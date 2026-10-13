/* eslint-disable no-console */
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

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const PACKAGE_NAME = '@adguard/dnr-rulesets';
const PACKAGE_TARBALL_NAME = PACKAGE_NAME.replace(/^@[^/]+\//, '');
const NPM_REGISTRY = 'https://registry.npmjs.org';
const PACKAGE_JSON_PATH = 'package.json';
const LOCKFILE_PATH = 'pnpm-lock.yaml';

/**
 * Matches a stable `<major>.<minor>.<UTC timestamp>` release of the given line
 * (e.g. `6.0.20261007011026`); dev/prerelease builds such as
 * `5.0.2-dev.pr30.…` are excluded.
 *
 * @param line Target line, e.g. `6.0`.
 *
 * @returns Version-matching regular expression.
 */
const buildStableVersionRe = (line: string): RegExp => {
    const escapedLine = line.replace(/\./g, '\\.');
    return new RegExp(`^${escapedLine}\\.(\\d+)$`);
};

/**
 * Derives the target rulesets line (`major.minor`) from the dependency spec
 * pinned in package.json, e.g. `6.0.0` or `~6.0.20261007011026` -> `6.0`.
 *
 * @param spec Pinned dependency spec.
 *
 * @returns Target line.
 *
 * @throws Error when the spec carries no `major.minor` version.
 */
export const resolveTargetLine = (spec: string): string => {
    const match = /^[~^]?(\d+)\.(\d+)\./.exec(spec);
    if (!match) {
        throw new Error(`Cannot derive the dnr-rulesets line from the pinned spec "${spec}": expected a major.minor version`);
    }
    return `${match[1]}.${match[2]}`;
};

/**
 * Rewrites tarball URLs recorded in pnpm-lock.yaml back to the public npm
 * registry.
 *
 * AK (`npm-internal`) publishes @adguard packages as byte-identical tarballs
 * (same build artifact as npm), so the integrity hash stays valid and installs
 * keep working where AK is unreachable (public mirror / external contributors).
 *
 * Only the @adguard/dnr-rulesets entry ever carries an AK tarball URL in the
 * committed lockfile — the rest of the tree resolves from the default npm
 * registry. Matching uses the registry base, not the package name, so the
 * rewrite stays correct regardless of which entry ends up pointing at AK.
 *
 * @param lockfileContent Raw pnpm-lock.yaml content.
 * @param registryBase Base URL of the registry the tarball was resolved from,
 * without a trailing slash.
 *
 * @returns Lockfile content with every tarball URL recorded under registryBase
 * pointing at the npm registry.
 */
export const rewriteDnrRulesetsTarballUrls = (lockfileContent: string, registryBase: string): string => {
    // Strip the scheme first: `https?://` is matched by the pattern itself so
    // the caller can pass either http or https bases.
    const hostPath = registryBase.replace(/^https?:\/\//, '');
    const escapedBase = hostPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return lockfileContent.replace(
        new RegExp(`https?://${escapedBase}(?=[/"'])`, 'g'),
        NPM_REGISTRY,
    );
};

/**
 * Picks the version published under the `stable-<line>` dist-tag when it
 * matches the requested line. Artifact Keeper publishes the 6.0 line under
 * `stable-6.0`.
 *
 * @param distTags Registry `dist-tags` object, if any.
 * @param line Target line, e.g. `6.0`.
 *
 * @returns The tagged version, or `undefined` when the tag is missing or
 * points at another line.
 */
export const resolveStableDistTagVersion = (
    distTags: Record<string, string> | undefined,
    line: string,
): string | undefined => {
    const version = distTags?.[`stable-${line}`];
    if (!version || !buildStableVersionRe(line).test(version)) {
        return undefined;
    }
    return version;
};

/**
 * Picks the highest stable `<line>.<timestamp>` version out of a registry's
 * published-version list (e.g. AK metadata `versions` keys). This is what
 * pnpm's `@adguard/dnr-rulesets@~<line>` would resolve to.
 *
 * @param versions Published version strings.
 * @param line Target line, e.g. `6.0`.
 *
 * @returns The highest matching version, or `undefined` when none matches.
 */
export const resolveLatestStableVersion = (versions: string[], line: string): string | undefined => {
    const versionRe = buildStableVersionRe(line);
    let latest: string | undefined;
    let latestTimestamp = -1;
    for (const version of versions) {
        const match = versionRe.exec(version);
        if (!match) {
            continue;
        }
        const timestamp = Number(match[1]);
        if (timestamp > latestTimestamp) {
            latestTimestamp = timestamp;
            latest = version;
        }
    }
    return latest;
};

/**
 * Extracts the numeric build component of a stable `<line>.<timestamp>`
 * version (e.g. `6.0.20261008010951` -> `20261008010951`), used to compare
 * two versions of the same line.
 *
 * @param version Version string to parse.
 * @param line Target line, e.g. `6.0`.
 *
 * @returns The numeric component, or `undefined` when the version is not a
 * stable version of the line.
 */
const versionTimestamp = (version: string, line: string): number | undefined => {
    const match = buildStableVersionRe(line).exec(version);
    return match ? Number(match[1]) : undefined;
};

/**
 * Reports whether installing `candidate` would roll the pinned spec backwards
 * within the same line. Registry pointers (the `stable-<line>` dist-tag, the
 * npm `latest`) can lag behind a pin resolved from a newer build, and the
 * resources update must never downgrade the rulesets.
 *
 * @param candidate Resolved candidate version, e.g. `6.0.20261007011026`.
 * @param pinnedSpec Pinned dependency spec, e.g. `~6.0.20261008010951`.
 * @param line Target line, e.g. `6.0`.
 *
 * @returns `true` when the candidate is strictly older than the pin.
 */
export const wouldDowngrade = (candidate: string, pinnedSpec: string, line: string): boolean => {
    const pinnedTimestamp = versionTimestamp(pinnedSpec.replace(/^[~^]/, ''), line);
    const candidateTimestamp = versionTimestamp(candidate, line);
    return pinnedTimestamp !== undefined
        && candidateTimestamp !== undefined
        && candidateTimestamp < pinnedTimestamp;
};

/**
 * Computes the `sha512-<base64>` integrity of a buffer — the format recorded in
 * pnpm's lockfile `resolution` entries.
 */
export const base64Sha512 = (buffer: Buffer): string => {
    return `sha512-${createHash('sha512').update(buffer).digest('base64')}`;
};

interface NormalizeUrlDependencyResult {
    packageJson: string;
    lockfile: string;
}

/**
 * Converts the "bare tarball URL" dependency entry produced by
 * `pnpm add -D <url>` back into the pinned-version form the repo is committed
 * in (`~<line>.<version>` in package.json, a normal versioned `resolution` in
 * pnpm-lock.yaml).
 *
 * `pnpm add -D <tarball URL>` is used to pull the fresh dnr-rulesets tarball
 * from AK while the rest of the tree still resolves from npm. pnpm records such
 * a dependency by its URL (importer `specifier`/`version`, `packages` and
 * `snapshots` keys), which would not survive a public, AK-less
 * `--frozen-lockfile` install. This normalizes it into the standard shape.
 *
 * @param packageJsonContent Raw package.json content.
 * @param lockfileContent Raw pnpm-lock.yaml content.
 * @param tarballUrl The AK tarball URL the package was installed from.
 * @param version The resolved version, e.g. `6.0.20261007011026`.
 * @param integrity The sha512 integrity of the tarball.
 *
 * @returns The normalized package.json / lockfile content.
 *
 * @throws {Error} When the tarball URL is absent from package.json or
 * pnpm-lock.yaml (dependency files changed out from under the install).
 */
export const normalizeUrlDependency = (
    packageJsonContent: string,
    lockfileContent: string,
    tarballUrl: string,
    version: string,
    integrity: string,
): NormalizeUrlDependencyResult => {
    if (!packageJsonContent.includes(tarballUrl) || !lockfileContent.includes(tarballUrl)) {
        throw new Error(`tarball URL ${tarballUrl} not found in the dependency files — cannot normalize the entry`);
    }

    // version already carries the `<line>.` prefix (e.g. 6.0.20261008010951),
    // so the pinned spec is simply `~<version>`.
    const specifier = `~${version}`;
    const replaceAll = (input: string, search: string, replacement: string): string => {
        return input.split(search).join(replacement);
    };

    let lockfile = lockfileContent;
    // `packages` and `snapshots` keys: '@adguard/dnr-rulesets@<url>' ->
    // '@adguard/dnr-rulesets@<version>' (a peer-hash suffix such as
    // `(typescript@5.6.3)` on the snapshots key is preserved).
    lockfile = replaceAll(lockfile, `${PACKAGE_NAME}@${tarballUrl}`, `${PACKAGE_NAME}@${version}`);
    // Importer devDependencies specifier.
    lockfile = replaceAll(lockfile, `specifier: ${tarballUrl}`, `specifier: ${specifier}`);
    // Importer version (peer-hash suffix preserved).
    lockfile = replaceAll(lockfile, `version: ${tarballUrl}`, `version: ${version}`);
    // resolution: record the integrity of the tarball we actually fetched.
    lockfile = replaceAll(
        lockfile,
        `resolution: {tarball: ${tarballUrl}}`,
        `resolution: {integrity: ${integrity}, tarball: ${tarballUrl}}`,
    );
    // Drop the now-redundant `version:` line inside the `packages` entry —
    // version-keyed entries carry the version in the key instead. The 4-space
    // indent scopes the match to `packages` entries: the importer `version:`
    // line is 8-space indented (and carries a peer-hash suffix).
    lockfile = replaceAll(lockfile, `\n    version: ${version}`, '');

    const packageJson = replaceAll(packageJsonContent, `"${tarballUrl}"`, `"${specifier}"`);

    return { packageJson, lockfile };
};

const pnpmBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

interface PackageMetadata {
    versions?: Record<string, { dist?: { tarball?: string } }>;
    'dist-tags'?: Record<string, string>;
}

/**
 * Resolves the version to install from registry metadata: the `stable-<line>`
 * dist-tag when the registry publishes one, otherwise the newest published
 * stable version of the line.
 *
 * @param metadata Registry package metadata.
 * @param line Target line, e.g. `6.0`.
 *
 * @returns The resolved version, or `undefined` when the registry has no
 * stable version of the line.
 */
export const resolveTargetVersion = (metadata: PackageMetadata, line: string): string | undefined => {
    return resolveStableDistTagVersion(metadata['dist-tags'], line)
        ?? resolveLatestStableVersion(Object.keys(metadata.versions ?? {}), line);
};

const fetchJson = async (url: string): Promise<PackageMetadata> => {
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) {
        throw new Error(`GET ${url} failed: HTTP ${response.status}`);
    }
    return response.json() as Promise<PackageMetadata>;
};

const sha512Integrity = async (tarballUrl: string): Promise<string> => {
    const response = await fetch(tarballUrl, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) {
        throw new Error(`failed to download ${tarballUrl}: HTTP ${response.status}`);
    }
    return base64Sha512(Buffer.from(await response.arrayBuffer()));
};

/**
 * Updates @adguard/dnr-rulesets to the latest stable version of the line
 * pinned in package.json (`major.minor`), preserving exact prerelease pins.
 *
 * When DNR_RULESETS_REGISTRY points at the internal Artifact Keeper, the
 * package tarball is fetched from there (npm throttles the shared CI egress
 * IPs) while the rest of the dependency tree still resolves from npm — the AK
 * npm registry only mirrors the @adguard scope, so pnpm cannot resolve the
 * whole tree from it. The committed files then use the pinned
 * `~<line>.<version>` form with tarball URLs pointing back at npm once the
 * fresh version is confirmed there. An exact pin on the public registry is the
 * version the release flow selected and is left untouched.
 *
 * @throws {Error} When the pinned spec carries no line, when no stable version
 * of that line is found in the registry, when its metadata/tarball cannot be
 * fetched, or when pnpm fails.
 */
export const updateDnrRulesets = async (): Promise<void> => {
    const currentPackage = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as {
        devDependencies: Record<string, string>;
    };
    const pinnedVersion = currentPackage.devDependencies[PACKAGE_NAME]!;
    // Prerelease packages are selected explicitly and must not be replaced by the stable channel.
    if (/^\d+\.\d+\.\d+-/.test(pinnedVersion)) {
        console.log(`Keeping pinned ${PACKAGE_NAME}@${pinnedVersion}`);
        return;
    }

    const registry = (process.env.DNR_RULESETS_REGISTRY ?? '').replace(/\/+$/, '') || NPM_REGISTRY;
    const line = resolveTargetLine(pinnedVersion);
    console.log(`Updating ${PACKAGE_NAME}@${line} from ${registry}`);

    // Public registry: an exact pin is the version selected by the release
    // flow and is kept as is. A range pin is refreshed only when the public
    // registry actually carries the line — the 6.0 line is published to
    // Artifact Keeper only, so there is nothing to resolve from npm.
    if (registry === NPM_REGISTRY) {
        if (!/^[~^]/.test(pinnedVersion)) {
            console.log(`Keeping exact pin ${PACKAGE_NAME}@${pinnedVersion} on the public registry`);
            return;
        }

        // The metadata check is best-effort: npm throttles shared CI egress
        // IPs (HTTP 429), and a failed check must not abort a resources update
        // — keep the pin and let the next run retry.
        let publicVersion: string | undefined;
        try {
            const publicMetadata = await fetchJson(`${NPM_REGISTRY}/${PACKAGE_NAME}`);
            publicVersion = resolveLatestStableVersion(Object.keys(publicMetadata.versions ?? {}), line);
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            console.warn(`::warning::could not read the public registry metadata for ${PACKAGE_NAME} (${reason}); keeping ${pinnedVersion}`);
            return;
        }
        if (!publicVersion) {
            console.warn(`::warning::the public registry has no stable ${line}.x version of ${PACKAGE_NAME}; keeping ${pinnedVersion}`);
            return;
        }
        if (wouldDowngrade(publicVersion, pinnedVersion, line)) {
            console.warn(`::warning::the public registry resolves ${PACKAGE_NAME}@${publicVersion}, older than the pinned ${pinnedVersion}; keeping the pin`);
            return;
        }

        execFileSync(pnpmBin, ['remove', PACKAGE_NAME], { stdio: 'inherit' });
        execFileSync(pnpmBin, ['add', '-D', `${PACKAGE_NAME}@~${line}`], { stdio: 'inherit' });
        return;
    }

    // Resolve the latest stable version of the line from the internal registry
    // metadata, preferring the `stable-<line>` dist-tag the line publishes
    // under. The tag can lag behind a pin resolved from a newer build, so
    // never roll the pin backwards within the line.
    const metadata = await fetchJson(`${registry}/${PACKAGE_NAME}`);
    const version = resolveTargetVersion(metadata, line);
    if (!version) {
        throw new Error(`found no stable ${line}.x version of ${PACKAGE_NAME} in ${registry}`);
    }
    if (wouldDowngrade(version, pinnedVersion, line)) {
        console.warn(`::warning::${registry} resolves ${PACKAGE_NAME}@${version}, older than the pinned ${pinnedVersion}; keeping the pin`);
        return;
    }
    const tarballUrl = metadata.versions?.[version]?.dist?.tarball
        ?? `${registry}/${PACKAGE_NAME}/-/${PACKAGE_TARBALL_NAME}-${version}.tgz`;
    console.log(`Resolved ${PACKAGE_NAME}@${version} (${tarballUrl})`);

    execFileSync(pnpmBin, ['remove', PACKAGE_NAME], { stdio: 'inherit' });

    // Fetch the fresh tarball from AK. pnpm records a bare tarball URL as a
    // URL dependency: the tarball itself is pulled from AK (unthrottled) while
    // its transitive deps still come from npm.
    execFileSync(pnpmBin, ['add', '-D', tarballUrl], { stdio: 'inherit' });

    // Normalize the URL dependency to the pinned-version form the repo commits.
    const integrity = await sha512Integrity(tarballUrl);
    const { packageJson, lockfile } = normalizeUrlDependency(
        readFileSync(PACKAGE_JSON_PATH, 'utf8'),
        readFileSync(LOCKFILE_PATH, 'utf8'),
        tarballUrl,
        version,
        integrity,
    );
    writeFileSync(PACKAGE_JSON_PATH, packageJson);
    writeFileSync(LOCKFILE_PATH, lockfile);

    // npm and AK publish the same byte-identical tarball, but the npm publish
    // may lag (throttled round). Confirm the freshly resolved version is on
    // npm before pointing the committed lockfile at it. The check is bounded
    // and non-fatal: a transport-level failure (DNS / connection reset —
    // exactly how npm behaves when fully throttled) must not hard-fail the
    // auto-build after the AK resolution already succeeded.
    let isOnNpm = false;
    try {
        const response = await fetch(`${NPM_REGISTRY}/${PACKAGE_NAME}/${version}`, {
            signal: AbortSignal.timeout(30_000),
        });
        isOnNpm = response.ok;
    } catch {
        console.warn(`::warning::could not confirm ${PACKAGE_NAME}@${version} on npm (HTTP check failed); keeping the registry tarball URL in ${LOCKFILE_PATH}`);
    }

    if (isOnNpm) {
        const before = readFileSync(LOCKFILE_PATH, 'utf8');
        const after = rewriteDnrRulesetsTarballUrls(before, registry);
        if (after !== before) {
            writeFileSync(LOCKFILE_PATH, after);
            console.log(`Rewrote the registry tarball URL in ${LOCKFILE_PATH} back to ${NPM_REGISTRY}`);
        }
    } else {
        // dnr-rulesets versions are one-shot `<line>.<UTC timestamp>`; a throttled
        // round can produce a version that never lands on npm and is never
        // re-published. Rewriting its tarball URL to npm now would bake a 404
        // into the committed lockfile and wedge every later
        // `--frozen-lockfile` install (the run that would heal it runs after
        // those installs). Keep the source-registry URL so frozen installs keep
        // resolving; a later round rewrites it once npm catches up.
        console.warn(`::warning::${PACKAGE_NAME}@${version} is not on npm yet; keeping the registry tarball URL in ${LOCKFILE_PATH} so frozen installs keep resolving`);
    }
};

if (process.argv[1]?.endsWith('update-dnr-rulesets.ts')) {
    updateDnrRulesets().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
