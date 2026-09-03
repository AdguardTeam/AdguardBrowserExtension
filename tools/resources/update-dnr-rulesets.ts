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
import { readFileSync, writeFileSync } from 'node:fs';

const PACKAGE_NAME = '@adguard/dnr-rulesets';
const NPM_REGISTRY = 'https://registry.npmjs.org';
const LOCKFILE_PATH = 'pnpm-lock.yaml';

/**
 * Rewrites tarball URLs recorded in pnpm-lock.yaml back to the public npm
 * registry.
 *
 * pnpm stores the full tarball URL for packages resolved from a non-default
 * registry (e.g. the internal Artifact Keeper). Tarballs published to AK and
 * npm are byte-identical (same build artifact), so the integrity hash stays
 * valid, and installs keep working where AK is unreachable (public mirror).
 *
 * Matching uses the registry base, not the package name: `pnpm add
 * --registry <AK>` resolves the whole dependency tree from AK, so transitive
 * deps (e.g. @adguard/agtree, @adguard/dnr-converter) keep an AK tarball URL
 * that would break `--frozen-lockfile` installs on the public mirror / for
 * external contributors if only dnr-rulesets were rewritten.
 *
 * @param lockfileContent Raw pnpm-lock.yaml content.
 * @param registryBase Base URL of the registry the packages were resolved
 * from, without a trailing slash.
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

const pnpmBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

/**
 * Updates @adguard/dnr-rulesets to the latest ~5.0 from the registry in the
 * DNR_RULESETS_REGISTRY env var (public npm when unset), then rewrites lockfile
 * tarball URLs recorded against that registry back to npm — but only once the
 * freshly resolved version is confirmed on npm.
 */
const main = async (): Promise<void> => {
    const registry = (process.env.DNR_RULESETS_REGISTRY ?? '').replace(/\/+$/, '') || NPM_REGISTRY;
    console.log(`Updating ${PACKAGE_NAME} from ${registry}`);

    execFileSync(pnpmBin, ['remove', PACKAGE_NAME], { stdio: 'inherit' });
    execFileSync(pnpmBin, ['add', '-D', `${PACKAGE_NAME}@~5.0`, '--registry', registry], { stdio: 'inherit' });

    // Nothing to rewrite when we resolved from the public registry.
    if (registry === NPM_REGISTRY) {
        return;
    }

    // npm and AK publish the same byte-identical tarball, but the npm publish
    // may lag (throttled round). Confirm the freshly resolved version is on
    // npm before pointing the committed lockfile at it. The check is bounded
    // and non-fatal: a transport-level failure (DNS / connection reset —
    // exactly how npm behaves when fully throttled) must not hard-fail the
    // auto-build after the AK resolution already succeeded.
    const { version } = JSON.parse(readFileSync(`node_modules/${PACKAGE_NAME}/package.json`, 'utf8'));
    let isOnNpm = false;
    try {
        const response = await fetch(`${NPM_REGISTRY}/${PACKAGE_NAME}/${version}`, {
            signal: AbortSignal.timeout(30_000),
        });
        isOnNpm = response.ok;
    } catch {
        console.warn(`::warning::could not confirm ${PACKAGE_NAME}@${version} on npm (HTTP check failed); keeping registry tarball URLs in ${LOCKFILE_PATH}`);
    }

    if (!isOnNpm) {
        // dnr-rulesets versions are one-shot `5.0.<UTC timestamp>`; a throttled
        // round can produce a version that never lands on npm and is never
        // re-published. Rewriting its tarball URL to npm now would bake a 404
        // into the committed lockfile and wedge every later
        // `--frozen-lockfile` install (the run that would heal it runs after
        // those installs). Keep the source-registry URL so frozen installs keep
        // resolving; a later round rewrites it once npm catches up.
        console.warn(`::warning::${PACKAGE_NAME}@${version} is not on npm yet; keeping registry tarball URLs in ${LOCKFILE_PATH} so frozen installs keep resolving`);
        return;
    }

    const before = readFileSync(LOCKFILE_PATH, 'utf8');
    const after = rewriteDnrRulesetsTarballUrls(before, registry);
    if (after !== before) {
        writeFileSync(LOCKFILE_PATH, after);
        console.log(`Rewrote registry tarball URLs in ${LOCKFILE_PATH} back to ${NPM_REGISTRY}`);
    }
};

if (process.argv[1]?.endsWith('update-dnr-rulesets.ts')) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
