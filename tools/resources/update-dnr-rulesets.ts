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
 * Matches the stable `5.0.<UTC timestamp>` releases that the `~5.0` range
 * resolves to (dev/prerelease builds such as `5.0.2-dev.pr30.…` are excluded).
 */
const STABLE_5_VERSION_RE = /^5\.0\.(\d+)$/;

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
 * Picks the highest stable `5.0.<timestamp>` version out of a registry's
 * published-version list (e.g. AK metadata `versions` keys). This is what
 * pnpm's `@adguard/dnr-rulesets@~5.0` would resolve to.
 *
 * @param versions Published version strings.
 *
 * @returns The highest matching version, or `undefined` when none matches.
 */
export const resolveLatestStableVersion = (versions: string[]): string | undefined => {
    let latest: string | undefined;
    let latestTimestamp = -1;
    for (const version of versions) {
        const match = STABLE_5_VERSION_RE.exec(version);
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
 * in (`~5.0.<version>` in package.json, a normal versioned `resolution` in
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
 * @param version The resolved version, e.g. `5.0.20260903144513`.
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

    // version already carries the `5.0.` prefix (e.g. 5.0.20260903144513), so
    // the pinned spec is simply `~<version>`.
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
}

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
 * Updates stable @adguard/dnr-rulesets to the latest ~5.0, preserving exact prerelease pins.
 *
 * When DNR_RULESETS_REGISTRY points at the internal Artifact Keeper, the
 * package tarball is fetched from there (npm throttles the shared CI egress
 * IPs) while the rest of the dependency tree still resolves from npm — the AK
 * npm registry only mirrors the @adguard scope, so pnpm cannot resolve the
 * whole tree from it. The committed files then use the pinned
 * `~5.0.<version>` form with tarball URLs pointing back at npm once the fresh
 * version is confirmed there.
 *
 * @throws {Error} When no stable 5.0.x version of the package is found in the
 * registry, when its metadata/tarball cannot be fetched, or when pnpm fails.
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
    console.log(`Updating ${PACKAGE_NAME} from ${registry}`);

    execFileSync(pnpmBin, ['remove', PACKAGE_NAME], { stdio: 'inherit' });

    // Public registry: plain add, nothing else to do.
    if (registry === NPM_REGISTRY) {
        execFileSync(pnpmBin, ['add', '-D', `${PACKAGE_NAME}@~5.0`], { stdio: 'inherit' });
        return;
    }

    // Resolve the latest ~5.0 from the internal registry metadata.
    const metadata = await fetchJson(`${registry}/${PACKAGE_NAME}`);
    const version = resolveLatestStableVersion(Object.keys(metadata.versions ?? {}));
    if (!version) {
        throw new Error(`found no stable 5.0.x version of ${PACKAGE_NAME} in ${registry}`);
    }
    const tarballUrl = metadata.versions?.[version]?.dist?.tarball
        ?? `${registry}/${PACKAGE_NAME}/-/${PACKAGE_TARBALL_NAME}-${version}.tgz`;
    console.log(`Resolved ${PACKAGE_NAME}@${version} (${tarballUrl})`);

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
        // dnr-rulesets versions are one-shot `5.0.<UTC timestamp>`; a throttled
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
