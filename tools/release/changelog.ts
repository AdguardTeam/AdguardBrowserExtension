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

import { type ReleaseChannel } from './version';

/**
 * Heading that marks the not-yet-released changes.
 */
export const UNRELEASED_HEADING = '## [Unreleased]';

/**
 * Matches the `## [Unreleased]` heading on its own line. Anchored so headings
 * with trailing text (e.g. `## [Unreleased] - WIP`) are not treated as the
 * Unreleased section and split mid-line.
 */
const UNRELEASED_HEADING_RE = /^## \[Unreleased\][ \t]*$/m;

/**
 * Matches release headings with the full 4-component extension version,
 * e.g. `## [5.6.0.1] - 2026-08-20` or `## [5.6.0.1-beta] - 2026-08-20`.
 * Legacy short headings (e.g. `## [5.5]`) are intentionally not matched.
 */
const VERSION_HEADING_RE = /^## \[(\d+\.\d+\.\d+\.\d+(?:-beta)?)\] - \d{4}-\d{2}-\d{2}\s*$/;

/**
 * Patches the changelog for a new release.
 *
 * When `## [Unreleased]` exists, the new version heading is inserted right
 * below it, so the content that accumulated under Unreleased now belongs to
 * the new version. When it does not exist, both `## [Unreleased]` and the new
 * heading are inserted before the first existing heading (after the preamble).
 *
 * @param content Changelog content.
 * @param headingVersion Version for the heading, e.g. `5.6.0.1` or `5.6.0.1-beta`.
 * @param date Release date in YYYY-MM-DD format.
 *
 * @returns Patched changelog content.
 */
export const patchChangelog = (content: string, headingVersion: string, date: string): string => {
    const newHeading = `## [${headingVersion}] - ${date}`;

    if (UNRELEASED_HEADING_RE.test(content)) {
        return content.replace(UNRELEASED_HEADING_RE, `${UNRELEASED_HEADING}\n\n${newHeading}`);
    }

    const firstHeadingMatch = content.match(/^## \[.*$/m);
    if (!firstHeadingMatch || firstHeadingMatch.index === undefined) {
        return `${content.trimEnd()}\n\n${UNRELEASED_HEADING}\n\n${newHeading}\n`;
    }

    const idx = firstHeadingMatch.index;
    return `${content.slice(0, idx)}${UNRELEASED_HEADING}\n\n${newHeading}\n\n${content.slice(idx)}`;
};

/**
 * Latest release entry parsed from the changelog.
 */
export type ChangelogEntry = {
    version: string;
    channel: ReleaseChannel;
    section: string;
};

/**
 * Extracts the first full-version release entry from the changelog: the
 * heading version, the release channel, and the section body until the next
 * heading.
 *
 * @param content Changelog content.
 *
 * @returns Parsed entry.
 *
 * @throws Error when no full-version heading exists.
 */
export const extractLatestEntry = (content: string): ChangelogEntry => {
    const lines = content.split(/\r?\n/);

    let start = -1;
    let version = '';
    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (line === undefined) {
            continue;
        }
        const match = line.match(VERSION_HEADING_RE);
        if (match) {
            start = i;
            version = match[1] ?? '';
            break;
        }
    }

    if (start === -1) {
        throw new Error(
            'No full-version release heading (## [M.m.p.BUILD[-beta]] - YYYY-MM-DD) '
            + 'found in the changelog',
        );
    }

    let end = lines.length;
    for (let i = start + 1; i < lines.length; i += 1) {
        const line = lines[i];
        if (line !== undefined && line.startsWith('## [')) {
            end = i;
            break;
        }
    }

    const section = lines.slice(start + 1, end).join('\n').trim();

    return {
        version,
        channel: version.endsWith('-beta') ? 'beta' : 'release',
        section,
    };
};
