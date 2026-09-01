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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getFormattedVersion } from '../helpers';

import { extractLatestEntry } from './changelog';
import {
    formatManifestVersion,
    formatTag,
    parseExtensionVersion,
} from './version';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

const REPO_ROOT = path.resolve(__dirname, '../..');
const PACKAGE_JSON_PATH = path.join(REPO_ROOT, 'package.json');
const CHANGELOG_PATH = path.join(REPO_ROOT, 'CHANGELOG.md');

/**
 * Returns the $GITHUB_OUTPUT path, failing loudly when it is not set (the
 * script is only useful inside the publish-release workflow).
 *
 * @returns Path to the $GITHUB_OUTPUT file.
 *
 * @throws Error when `GITHUB_OUTPUT` is not set.
 */
const getGitHubOutputFile = (): string => {
    const outputFile = process.env.GITHUB_OUTPUT;
    if (!outputFile) {
        throw new Error('GITHUB_OUTPUT is not set; run via the publish-release workflow');
    }
    return outputFile;
};

/**
 * Appends a simple `key=value` line to GitHub Actions' $GITHUB_OUTPUT.
 *
 * @param key Output name.
 * @param value Output value.
 */
const appendToGitHubOutput = (key: string, value: string): void => {
    fs.appendFileSync(getGitHubOutputFile(), `${key}=${value}\n`);
};

/**
 * Appends a multi-line `notes=` block to GitHub Actions' $GITHUB_OUTPUT so the
 * workflow does not need a temporary file round-trip.
 *
 * @param notes Release notes section.
 */
const appendNotesToGitHubOutput = (notes: string): void => {
    fs.appendFileSync(getGitHubOutputFile(), `notes<<__RESOLVE_EOF__\n${notes}\n__RESOLVE_EOF__\n`);
};

/**
 * Resolves the release version from CHANGELOG.md for the publish-release
 * workflow: writes `tag=`, `channel=` and `notes=` directly to $GITHUB_OUTPUT.
 *
 * @throws Error when no full-version heading exists in the changelog, the
 * changelog version does not match the package.json version, or $GITHUB_OUTPUT
 * is not set.
 */
const main = (): void => {
    const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
    const entry = extractLatestEntry(changelog);
    const version = parseExtensionVersion(entry.version);

    // Guard against hand-edited release-bump PRs: the changelog heading must
    // match the version compiled into the build (from package.json).
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
    const manifestVersion = getFormattedVersion(packageJson.version);
    const headingVersion = formatManifestVersion(version);
    if (manifestVersion !== headingVersion) {
        throw new Error(
            `Changelog version ${headingVersion} does not match package.json version ${packageJson.version} (manifest ${manifestVersion})`,
        );
    }

    appendToGitHubOutput('tag', formatTag(version));
    appendToGitHubOutput('channel', version.channel);
    appendNotesToGitHubOutput(entry.section);
};

try {
    main();
} catch (error) {
    console.error(`Error resolving version: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
}
