/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-disable no-console */

/**
 * Pins (or removes) tsurlfilter PR dev builds in a browser-extension checkout,
 * so the extension can be built and QA'd against unmerged tsurlfilter work
 * published by the DevEx bridge (devex-bridge.yml in the ext-tsurlfilter repo)
 * to the internal Artifact Keeper npm registry.
 *
 * This is the consumer-side half of the DevEx bridge, moved into the
 * browser-extension repo as TypeScript. It takes the bridged package set as
 * `--with-<package>` flags — the same flag style the old bamboo linking script
 * used. The registry is fixed: the only place dev builds are published is the
 * internal Artifact Keeper npm registry.
 *
 * Usage:
 *   pnpm tsx tools/ci/use-dev-builds.ts --pr <N> --extension <path> [--head <short-sha>] --with-<pkg>...
 *   pnpm tsx tools/ci/use-dev-builds.ts --remove --extension <path>
 *
 * `--remove` strips every dev pin the tool installed and does NOT need the
 * `--with-<pkg>` flags.
 *
 * Pin mode resolves the dev versions of the `--with-<pkg>` packages for this
 * PR and upserts pnpm.overrides entries in the extension's package.json
 * pointing at the AK tarball URLs (dependencies stay untouched), then
 * refreshes pnpm-lock.yaml with a single `pnpm install`.
 *
 * Every push to the tsurlfilter PR republishes the packages under a
 * HEAD-scoped version `<next-patch>-dev.pr<N>.<shortsha>` (AK versions are
 * immutable, so the short SHA gives every push a fresh, distinct version).
 * This lets the tool pin a COHERENT SET: it resolves builds carrying the exact
 * short SHA of the requested head, so all overrides come from one committed
 * source head. If the set for that head is incomplete on AK (e.g. a publish
 * leg failed), the tool fails loudly instead of silently mixing builds from
 * different heads.
 *
 * The packages must be pinned as an indivisible set: if any of them already
 * has a non-dev override (a hand-written pin the developer did not set up for
 * dev builds), the pin FAILS with an explicit instruction rather than silently
 * mixing stable and PR-built packages.
 *
 * Requires pnpm on PATH (extension repo pins pnpm >=10.33.4 <11).
 *
 * The pin is TEMPORARY: never merge a branch carrying `-dev.pr` overrides.
 * Restore registry versions with `--remove` before committing/merging.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const DEFAULT_REGISTRY = 'https://ak.int.agrd.dev/npm/npm-internal';
const DEV_MARK = '-dev.pr';

/**
 * The subset of the extension's package.json the tool touches, plus an index
 * signature so a rewrite never loses unrelated fields.
 */
interface ExtensionManifest {
    pnpm?: {
        overrides?: Record<string, string>;
    };
    [key: string]: unknown;
}

/**
 * A recoverable CLI error: `run()` prints it as a `::error::` annotation and
 * exits with {@link UsageError.exitCode}. Throwing (instead of calling
 * `process.exit` directly) keeps the failure paths unit-testable.
 */
export class UsageError extends Error {
    /** Exit code the CLI exits with when this error is reported. */
    readonly exitCode: number;

    /**
     * @param message Error description; the `::error::` prefix is added by `run()`.
     * @param exitCode Exit code (1 by default).
     */
    constructor(message: string, exitCode = 1) {
        super(message);
        this.exitCode = exitCode;
    }
}

/**
 * Report a fatal error by throwing a {@link UsageError} that `run()` turns
 * into a `::error::` annotation and a non-zero exit.
 *
 * @param message Error description; the `::error::` prefix is added by `run()`.
 * @param code Exit code (1 by default).
 *
 * @throws {UsageError} Always.
 */
const fail = (message: string, code = 1): never => {
    throw new UsageError(message, code);
};

/**
 * Is this module being executed as the CLI entry point (rather than imported
 * by a test)?
 *
 * @returns Whether `process.argv[1]` resolves to this file.
 */
const isMain = (): boolean => {
    const entry = process.argv[1];
    return entry !== undefined && import.meta.url === pathToFileURL(entry).href;
};

/**
 * Read one `--<name> <value>` option out of the raw argv.
 *
 * The value is required, non-empty and must not itself look like a flag (so
 * `--extension --pr` fails with a clear message instead of a confusing parse).
 *
 * @param args Raw `process.argv.slice(2)`.
 * @param name Option name including the `--` prefix (e.g. `--pr`).
 *
 * @returns The option value from argv.
 */
export const readArgFromArgs = (args: string[], name: string): string => {
    const index = args.indexOf(name);
    if (index === -1 || index + 1 >= args.length) {
        fail(`missing required argument ${name} <value>`);
    }
    const value = args[index + 1]!;
    if (value.startsWith('-')) {
        fail(`argument ${name} expects a value, got flag-like value '${value}' — put it before the positional values?`);
    }
    return value;
};

/**
 * Read and parse the extension's package.json, preserving formatting.
 *
 * @param packageJsonPath Path to the extension's package.json.
 *
 * @returns The parsed manifest plus the indentation string and line-ending
 *   style of the original file (so a rewrite never normalizes the whole file).
 */
const readManifest = (packageJsonPath: string): { manifest: ExtensionManifest; indentation: string; crlf: boolean } => {
    const source = fs.readFileSync(packageJsonPath, 'utf8');
    // Tolerate CRLF manifests (the shared set-dev-version action uses the same
    // /^{\r?\n(...)/ probe when preserving indentation).
    const indentMatch = source.match(/^{\r?\n([ \t]+)/);
    let manifest: ExtensionManifest;
    try {
        manifest = JSON.parse(source) as ExtensionManifest;
    } catch (error) {
        return fail(`${packageJsonPath} is not valid JSON: ${(error as Error).message}`);
    }
    return {
        manifest,
        indentation: indentMatch ? indentMatch[1]! : '  ',
        crlf: source.includes('\r\n'),
    };
};

/**
 * Rewrite the extension's package.json preserving its original formatting.
 *
 * @param packageJsonPath Path to the extension's package.json.
 * @param manifest The manifest to serialize.
 * @param indentation Indentation string captured by {@link readManifest}.
 * @param crlf Whether the original file used CRLF line endings.
 */
const writeManifest = (
    packageJsonPath: string,
    manifest: ExtensionManifest,
    indentation: string,
    crlf: boolean,
): void => {
    // Preserve the manifest's original line endings (CRLF vs LF) so a rewrite
    // never normalizes the whole file and pollutes the diff.
    const content = `${JSON.stringify(manifest, null, indentation)}\n`;
    fs.writeFileSync(packageJsonPath, crlf ? content.replace(/\n/g, '\r\n') : content);
};

/**
 * Every override in the manifest that carries a `-dev.pr` URL — the complete
 * set of dev pins the tool installs. `--remove` strips all of them, so it does
 * not need the `--with-<pkg>` flags.
 *
 * @param manifest Parsed extension manifest.
 *
 * @returns Override keys whose value is a `-dev.pr` URL.
 */
export const devPinOverrides = (manifest: ExtensionManifest): string[] => {
    const overrides = manifest.pnpm?.overrides ?? {};
    return Object.keys(overrides).filter((name) => {
        const url = overrides[name];
        return typeof url === 'string' && url.includes(DEV_MARK);
    });
};

/**
 * Remove every dev pin the tool previously installed.
 *
 * @param extensionDir Path to the browser-extension checkout.
 *
 * @returns `true` when at least one pin was removed and the manifest was
 *   rewritten; `false` when no dev pins were present.
 */
export const stripDevPins = (extensionDir: string): boolean => {
    const packageJsonPath = path.join(extensionDir, 'package.json');
    const { manifest, indentation, crlf } = readManifest(packageJsonPath);
    const present = devPinOverrides(manifest);
    if (present.length === 0) {
        return false;
    }
    for (const name of present) {
        delete manifest.pnpm!.overrides![name];
    }
    writeManifest(packageJsonPath, manifest, indentation, crlf);
    return true;
};

/**
 * Run `pnpm install` in the extension checkout to refresh the lockfile.
 *
 * @param extensionDir Path to the browser-extension checkout.
 */
const pnpmInstall = (extensionDir: string): void => {
    console.log('> pnpm install --no-frozen-lockfile --ignore-scripts');
    // --no-frozen-lockfile: package.json just changed and the lockfile must be
    // regenerated (pnpm defaults to frozen when a lockfile exists).
    try {
        execFileSync('pnpm', ['install', '--no-frozen-lockfile', '--ignore-scripts'], {
            cwd: extensionDir,
            stdio: 'inherit',
        });
    } catch (error) {
        // A failing pnpm install (network, lockfile conflict, registry auth)
        // must produce a clear message, not an opaque execFileSync stack.
        fail(`pnpm install failed in ${extensionDir} — see the pnpm output above (${(error as Error).message})`);
    }
};

/**
 * Query the AK registry for a package via `npm view`, failing with a curated
 * message instead of a raw Node stack trace on any error.
 *
 * @param spec Package spec (e.g. `@adguard/tsurlfilter@1.0.0-dev.pr18`).
 * @param field Optional `npm view` field to request; when null the whole
 *   `versions --json` array is requested.
 *
 * @returns The trimmed `npm view` stdout.
 */
const npmView = (spec: string, field: string | null): string => {
    const viewArgs = field
        ? ['view', spec, field, `--registry=${DEFAULT_REGISTRY}`, '--silent']
        : ['view', spec, 'versions', '--json', `--registry=${DEFAULT_REGISTRY}`, '--silent'];
    try {
        return execFileSync('npm', viewArgs, { encoding: 'utf8' }).trim();
    } catch (error) {
        // A failed registry round-trip (auth, network, E404) must produce a
        // curated, actionable message — never a raw Node stack trace.
        const err = error as {
            stderr?: { toString?: () => string };
            stdout?: { toString?: () => string };
            message?: string;
        };
        const detail = (err.stderr?.toString?.() || err.stdout?.toString?.() || err.message || '').trim();
        return fail(
            `npm view ${spec}${field ? ` ${field}` : ' versions'} failed`
            + ` (registry ${DEFAULT_REGISTRY}): ${detail || String(error)}`,
        );
    }
};

/**
 * Semver-ish comparator over the X.Y.Z core that precedes the `-dev.pr`
 * suffix; all candidates share the same suffix, so the core alone orders them
 * (used to pick the newest dev version when a mid-PR release bump left several
 * `-dev.pr<N>.<sha>` versions for the same PR behind).
 *
 * @param a First version string.
 * @param b Second version string.
 *
 * @returns Negative/zero/positive per the numeric core comparison.
 */
export const compareNumericCore = (a: string, b: string): number => {
    const core = (version: string): number[] => version.split('-dev.pr')[0]!.split('.').map((n) => Number(n));
    const ca = core(a);
    const cb = core(b);
    for (let i = 0; i < 3; i += 1) {
        if (ca[i] !== cb[i]) {
            return (ca[i] ?? 0) - (cb[i] ?? 0);
        }
    }
    return 0;
};

/**
 * The 8-char abbreviated SHA of the source head whose builds we pin.
 *
 * Only the explicit `--head` override is honored: the tool is not run from a
 * tsurlfilter checkout, so there is no local git context that could name the
 * tsurlfilter source head. Without `--head` the tool falls back to a
 * non-head-scoped resolution. The CI action always passes `--head`.
 * DEV_BUILDS_FORCE_NO_HEAD is a test hook that emulates "no head".
 *
 * At least 8 hex chars are required: the version lookup matches the exact
 * 8-char suffix, so a shorter prefix would be accepted but then reported as an
 * unpublished build even when the matching commit has been published.
 *
 * @param requested The `--head` value, or null.
 *
 * @returns The 8-char lowercase short SHA, or null.
 */
export const headShortSha = (requested: string | null): string | null => {
    if (process.env.DEV_BUILDS_FORCE_NO_HEAD === '1') {
        return null;
    }
    if (requested) {
        if (!/^[0-9a-f]{8,64}$/i.test(requested)) {
            fail(`--head must be a git SHA with at least 8 hex chars, got '${requested}'`);
        }
        return requested.toLowerCase().slice(0, 8);
    }
    return null;
};

/**
 * Does this version belong to PR N's dev line?
 *
 * Matches the exact `-dev.pr<N>` tag as well as all `-dev.pr<N>.<...>`
 * (e.g. head-scoped) builds, and never crosses into `-dev.pr<N+…>` (a bare
 * substring match on 'pr' alone could not tell `-dev.pr1` from `-dev.pr12`).
 *
 * @param version A version string (non-strings return false).
 * @param prNumber PR number (as a string).
 *
 * @returns Whether the version is a dev build of this PR.
 */
export const isPrVersion = (version: unknown, prNumber: string): boolean => {
    return typeof version === 'string' && new RegExp(`-dev\\.pr${prNumber}(\\.|$)`).test(version);
};

/**
 * Pick the newest candidate (by numeric core) and resolve its tarball URL.
 *
 * @param name Package name (e.g. `@adguard/tsurlfilter`).
 * @param candidates Versions to choose among (same suffix).
 *
 * @returns The chosen version and its `dist.tarball` URL from the registry.
 */
const pickAndTarball = (name: string, candidates: string[]): { version: string; url: string } => {
    const pick = candidates.slice().sort(compareNumericCore).pop()
        ?? fail(`${name}: no candidates to pin`);
    const url = npmView(`${name}@${pick}`, 'dist.tarball');
    if (!url) {
        fail(
            `${name}@${pick}: registry returned no dist.tarball URL`
            + ` (run 'npm view ${name}@${pick} dist.tarball --registry=${DEFAULT_REGISTRY}' to debug)`,
        );
    }
    return { version: pick, url };
};

/**
 * Parse the `npm view <name> versions --json` output into a list of versions.
 *
 * @param name Package name (e.g. `@adguard/tsurlfilter`), for error messages.
 * @param raw The raw `npm view` stdout.
 *
 * @returns The parsed versions array (a single non-array value is wrapped).
 */
export const parseVersions = (name: string, raw: string): unknown[] => {
    try {
        const parsed: unknown = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
        return fail(
            `${name}: npm view returned unexpected output (expected a JSON array of versions), got:`
            + ` ${JSON.stringify(raw)} — check the registry URL ${DEFAULT_REGISTRY}`,
        );
    }
};

/**
 * The `-dev.pr` overrides for the bridged set that are NOT dev pins — the set
 * must be pinned as a whole, so these block the pin until moved aside.
 *
 * @param manifest Parsed extension manifest.
 * @param bridgedPackages The `--with-<pkg>` set being pinned.
 *
 * @returns Human-readable `name=value` strings of the conflicting overrides.
 */
export const findConflicts = (manifest: ExtensionManifest, bridgedPackages: string[]): string[] => {
    const overrides = manifest.pnpm?.overrides ?? {};
    return bridgedPackages
        .map((dir) => `@adguard/${dir}`)
        .filter((name) => overrides[name] !== undefined
            && !(typeof overrides[name] === 'string' && overrides[name].includes(DEV_MARK)))
        .map((name) => `${name}=${JSON.stringify(overrides[name])}`);
};

/**
 * The CLI entry point: parse argv and pin (or remove) the dev builds.
 */
const main = (): void => {
    const args = process.argv.slice(2);

    // The bridged package set comes from `--with-<package>` flags, mirroring
    // the old bamboo `--with-agtree --with-tsurlfilter` flag style.
    const isWithFlag = (arg: string): boolean => /^--with-[a-z0-9-]+$/.test(arg);
    const BRIDGED_PACKAGES = args.filter(isWithFlag).map((arg) => arg.slice('--with-'.length));

    const removeMode = args.includes('--remove');

    // A typo'd flag (e.g. `--remov` instead of `--remove`) must fail loudly
    // rather than silently fall through to a full pin — the opposite of what
    // was asked.
    const KNOWN_FLAGS = new Set(['--remove', '--pr', '--extension', '--head']);
    for (const arg of args) {
        if (arg.startsWith('--') && !KNOWN_FLAGS.has(arg) && !isWithFlag(arg)) {
            fail(`unknown argument '${arg}' — supported: ${[...KNOWN_FLAGS].join(', ')} plus --with-<package> flags`);
        }
    }

    // The flags are only required in pin mode. `--remove` strips every dev pin
    // the tool installed, so it works without them (the docs show it that way).
    if (!removeMode && BRIDGED_PACKAGES.length === 0) {
        fail(
            'no --with-<package> flags given — pass the bridged packages to pin,'
            + ' e.g. --with-tsurlfilter --with-dnr-rulesets',
        );
    }
    for (const pkg of BRIDGED_PACKAGES) {
        if (!/^[a-z0-9-]+$/.test(pkg)) {
            fail(`invalid --with-<package> flag '--with-${pkg}' — package names are lowercase alphanumeric + hyphens`);
        }
    }

    if (removeMode && args.includes('--pr')) {
        fail('--remove does not take --pr');
    }
    if (removeMode && args.includes('--head')) {
        fail('--remove does not take --head');
    }
    const extensionDir = readArgFromArgs(args, '--extension');
    const pr = removeMode ? null : readArgFromArgs(args, '--pr');
    if (pr !== null && !/^\d+$/.test(pr)) {
        fail(`--pr must be a pull request number, got '${pr}'`);
    }
    let requestedHead: string | null = null;
    if (!removeMode && args.includes('--head')) {
        requestedHead = readArgFromArgs(args, '--head');
        if (requestedHead === '') {
            fail('--head must not be empty — pass a short SHA or omit the flag');
        }
    }

    const packageJsonPath = path.join(extensionDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        fail(`${packageJsonPath} does not exist — --extension must point at a browser-extension checkout`);
    }

    if (removeMode) {
        if (stripDevPins(extensionDir)) {
            pnpmInstall(extensionDir);
            console.log('Dev pins removed and lockfile restored to registry versions.');
        } else {
            console.log('No dev pins present — nothing to do.');
        }
        return;
    }

    // Pin mode: resolve each package's dev version for this PR, preferring a
    // set of builds stamped from ONE source head so the overrides stay coherent.
    const prNumber: string = pr ?? fail('--pr is required in pin mode');
    const suffix = `${DEV_MARK}${prNumber}`;          // '-dev.pr42'
    const sha = headShortSha(requestedHead);          // '2f5d9548' or null
    if (sha) {
        console.log(`Pinning the coherent set for head ${sha} (PR #${prNumber}).`);
    }

    const urls: Record<string, string> = {};
    for (const dir of BRIDGED_PACKAGES) {
        const name = `@adguard/${dir}`;
        const raw = npmView(name, null);
        const versions = parseVersions(name, raw);

        if (sha) {
            // Head-scoped: only versions stamped from THIS head qualify. A
            // partially published / cancelled matrix leaves the set incomplete
            // for the head, so this fails loudly instead of pinning a mixed set.
            const exact = versions
                .filter((v): v is string => typeof v === 'string' && v.endsWith(`${suffix}.${sha}`));
            if (exact.length === 0) {
                fail(
                    `${name}: no version ending '${suffix}.${sha}' found on ${DEFAULT_REGISTRY}.`
                    + ' The bridge has not published this head yet (or a publish leg failed).'
                    + ' Re-run with --head <short-sha>'
                    + ` matching the 'Dev builds published' review on PR #${prNumber}.`,
                );
            }
            const { version, url } = pickAndTarball(name, exact);
            urls[name] = url;
            if (exact.length > 1) {
                console.warn(`${name}: multiple ${suffix}.${sha} builds exist; pinning newest (${version})`);
            }
        } else {
            // No head: fall back to the newest -dev.pr<N> version. The set may
            // span several heads — warn rather than pretend otherwise.
            const matches = versions.filter((v): v is string => isPrVersion(v, prNumber));
            if (matches.length === 0) {
                fail(
                    `${name}: no version ending '${suffix}' found — has devex-bridge.yml finished for PR #${prNumber},`
                    + ' or was it cleaned up? Pass --head for the coherent set.',
                );
            }
            console.warn(
                `${name}: no --head given — pinned the newest ${suffix} version;`
                + ' the set may span multiple heads.',
            );
            const { url } = pickAndTarball(name, matches);
            urls[name] = url;
        }
    }

    // Indivisible-set preflight: the packages must be pinned as a whole. If any
    // of them already carries a non-dev override, fail BEFORE touching the
    // manifest so the developer is not left with a mixed stable/PR combination
    // that the final summary would then misreport as "all pinned".
    const { manifest, indentation, crlf } = readManifest(packageJsonPath);
    const conflicts = findConflicts(manifest, BRIDGED_PACKAGES);
    if (conflicts.length > 0) {
        fail(
            `cannot pin: ${conflicts.length} bridged override(s) are not dev pins — the set must be pinned as a whole:\n`
            + `  ${conflicts.join('\n  ')}\n`
            + 'Move these aside (or delete them) in the extension package.json, then re-run.'
            + " (--remove only strips dev pins, so it won't drop a manual override.)",
        );
    }

    manifest.pnpm = manifest.pnpm ?? {};
    manifest.pnpm.overrides = manifest.pnpm.overrides ?? {};
    for (const [name, url] of Object.entries(urls)) {
        manifest.pnpm.overrides[name] = url;
    }
    writeManifest(packageJsonPath, manifest, indentation, crlf);
    // A single install is enough: every push carries a fresh head-scoped
    // tarball URL, so refreshing the overrides (rather than strip-then-
    // reinstall) is sufficient to record the new integrity in pnpm-lock.yaml.
    pnpmInstall(extensionDir);

    console.log(`\nPinned ${Object.keys(urls).length} dev builds for PR #${prNumber}${sha ? ` (head ${sha})` : ''}:`);
    for (const [name, url] of Object.entries(urls)) {
        console.log(`  ${name} -> ${url.split('/').pop()}`);
    }
    console.log('\nTemporary dev pins applied. Do NOT commit package.json/pnpm-lock.yaml as-is, and never');
    console.log('let -dev overrides reach master/release. Restore registry versions before merging:');
    console.log(`  pnpm tsx tools/ci/use-dev-builds.ts --remove --extension ${extensionDir}`);
    console.log('Re-run this command after every push to the tsurlfilter PR.');
};

/**
 * Run the CLI, turning {@link UsageError}s into `::error::` annotations and a
 * non-zero exit (mirrors the old `fail()` behaviour) while letting any other
 * error surface normally.
 *
 * @throws {unknown} Re-throws any non-{@link UsageError} error.
 */
const run = (): void => {
    try {
        main();
    } catch (error) {
        if (error instanceof UsageError) {
            console.error(`::error::${error.message}`);
            process.exit(error.exitCode);
        }
        throw error;
    }
};

// Only execute when run as a CLI (`tsx tools/ci/use-dev-builds.ts`); importing
// the module (e.g. from unit tests) must not parse argv or touch the fs.
if (isMain()) {
    run();
}
