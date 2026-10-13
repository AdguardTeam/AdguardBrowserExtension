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

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    composePackageVersion,
    formatManifestVersion,
    formatTag,
    getDnrPatchVersion,
    isNewerVersion,
    parseExtensionVersion,
    type ReleaseChannel,
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
 * Returns the channel of the last published version for the given version by
 * checking whether a matching `-beta` tag exists locally (e.g. `v5.5.0.5-beta`).
 * Both channels ship on the same 4-component version, so a `-beta` tag means the
 * same components were already released on the beta channel.
 *
 * @param version Version to look up.
 *
 * @returns `beta` when the matching `-beta` tag exists, `release` otherwise.
 *
 * @throws Error when git itself fails (not when the tag is merely absent).
 */
const getCurrentChannel = (version: ReturnType<typeof parseExtensionVersion>): ReleaseChannel => {
    const betaTag = formatTag({ ...version, channel: 'beta' });
    try {
        // Exit 1 means the ref does not exist; anything else is a real git
        // failure (missing binary, not a repository) and must not silently
        // fall back to `release`.
        execSync(`git show-ref --verify --quiet "refs/tags/${betaTag}"`, { stdio: 'pipe' });
        return 'beta';
    } catch (error) {
        if ((error as { status?: number }).status === 1) {
            return 'release';
        }
        throw error;
    }
};

/**
 * Prepares a release: bumps package.json to the requested 4-component version
 * and patches CHANGELOG.md. Used by the prepare-release workflow.
 *
 * @throws Error when the requested version is invalid, not newer than the
 * current package version, or the dnr-rulesets version cannot be parsed.
 */
const main = (): void => {
    const tag = process.argv[2]?.trim();
    if (!tag) {
        throw new Error('Usage: pnpm tsx tools/release/prepare-release.ts <vM.m.p.inc[-beta]>');
    }

    const version = parseExtensionVersion(tag);
    const manifestVersion = formatManifestVersion(version);
    const headingVersion = version.channel === 'beta' ? `${manifestVersion}-beta` : manifestVersion;

    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
    if (!isNewerVersion(version, packageJson.version, getCurrentChannel(version))) {
        throw new Error(
            `Version ${manifestVersion} is not newer than the current package version ${packageJson.version}`,
        );
    }

    packageJson.version = composePackageVersion(version, getDnrPatchVersion());
    fs.writeFileSync(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, 4)}\n`);

    const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
    const today = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(CHANGELOG_PATH, patchChangelog(changelog, headingVersion, today));

    console.log(`Prepared release ${formatTag(version)}:`);
    console.log(`  package.json version -> ${packageJson.version}`);
    console.log(`  CHANGELOG.md heading -> [${headingVersion}] - ${today}`);
};

try {
    main();
} catch (error) {
    console.error(`Error preparing release: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
}
