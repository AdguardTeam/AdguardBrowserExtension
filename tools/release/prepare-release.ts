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

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    allocateVersion,
    composePackageVersion,
    formatManifestVersion,
    formatTag,
    getDnrPatchVersion,
    isNewerVersion,
    parseReleaseTag,
} from './version';
import { patchChangelog } from './changelog';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

const REPO_ROOT = path.resolve(__dirname, '../..');
const PACKAGE_JSON_PATH = path.join(REPO_ROOT, 'package.json');
const CHANGELOG_PATH = path.join(REPO_ROOT, 'CHANGELOG.md');

/**
 * Checks whether a tag exists on the origin remote.
 *
 * @param tag Semver tag to check.
 *
 * @returns True when the remote tag exists.
 *
 * @throws Error when the remote check fails.
 */
const remoteTagExists = (tag: string): boolean => {
    const result = spawnSync(
        'git',
        ['ls-remote', '--exit-code', '--tags', '--refs', 'origin', `refs/tags/${tag}`],
        { cwd: REPO_ROOT, encoding: 'utf8' },
    );

    if (result.error) {
        throw new Error(`Cannot check remote tag ${tag}: ${result.error.message}`);
    }
    if (result.status === 0) {
        return true;
    }
    if (result.status === 2) {
        return false;
    }

    const details = result.stderr.trim();
    throw new Error(`Cannot check remote tag ${tag} on origin${details ? `: ${details}` : ''}`);
};

/**
 * Prepares a release: allocates the next build number, bumps package.json and
 * patches CHANGELOG.md. Used by the prepare-release workflow.
 *
 * The build number is a single monotonic counter stored as `build[0]` in the
 * package.json version. Every prepare-release consumes the next value unless
 * an explicit higher build override is supplied: a beta is tagged
 * `vX.Y.Z-beta.N` with manifest `X.Y.Z.N`, and a release is tagged `vX.Y.Z`
 * with manifest `X.Y.Z.(N+1)`, where `N` is the beta build number for the same
 * `X.Y.Z`. A release prepared after that beta therefore bumps the build by
 * one, which keeps it installable over the beta on the same store item.
 *
 * @throws Error when the requested tag is invalid, its beta number does not
 * match the allocated build number, the version is not newer than the current
 * package version, a required remote tag exists, or the dnr-rulesets version
 * cannot be parsed.
 */
const main = (): void => {
    const tagInput = process.argv[2]?.trim();
    if (!tagInput) {
        throw new Error('Usage: pnpm tsx tools/release/prepare-release.ts <vX.Y.Z[-beta.N]> [build]');
    }

    const tag = parseReleaseTag(tagInput);
    const buildOverrideInput = process.argv[3]?.trim();
    const buildOverride = buildOverrideInput ? Number(buildOverrideInput) : undefined;

    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
    const version = allocateVersion(tag, packageJson.version, buildOverride);
    const manifestVersion = formatManifestVersion(version);
    const headingVersion = version.channel === 'beta' ? `${manifestVersion}-beta` : manifestVersion;

    if (!isNewerVersion(version, packageJson.version)) {
        throw new Error(
            `Version ${manifestVersion} is not newer than the current package version ${packageJson.version}`,
        );
    }

    const candidateTag = formatTag(version);
    const requiredRemoteTags = [candidateTag];
    if (version.channel === 'beta') {
        requiredRemoteTags.push(formatTag({ ...version, channel: 'release' }));
    }
    const existingRemoteTag = requiredRemoteTags.find((remoteTag) => remoteTagExists(remoteTag));
    if (existingRemoteTag) {
        throw new Error(
            `Cannot prepare ${candidateTag}: remote tag ${existingRemoteTag} already exists on origin. `
            + 'Choose a version that has not been released',
        );
    }

    packageJson.version = composePackageVersion(version, getDnrPatchVersion());
    fs.writeFileSync(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, 4)}\n`);

    const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
    const today = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(CHANGELOG_PATH, patchChangelog(changelog, headingVersion, today));

    console.log(`Prepared release ${formatTag(version)}:`);
    console.log(`  manifest version -> ${manifestVersion}`);
    console.log(`  package.json version -> ${packageJson.version}`);
    console.log(`  CHANGELOG.md heading -> [${headingVersion}] - ${today}`);
};

try {
    main();
} catch (error) {
    console.error(`Error preparing release: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
}
