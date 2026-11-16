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

import { CHROME_CODEBASE_URL, FIREFOX_XPI_URL } from '../constants';

import {
    type ExtensionVersion,
    formatHeadingVersion,
    formatTag,
    ReleaseChannel,
} from './version';

/**
 * Heading that marks the not-yet-released changes.
 */
export const UNRELEASED_HEADING = '## [Unreleased]';

/**
 * Public repository URL used in the compare link definitions.
 */
const CHANGELOG_REPO_URL = 'https://github.com/AdguardTeam/AdguardBrowserExtension';

/**
 * Matches any `##` heading that mentions Unreleased, including the historical
 * forms `## Unreleased`, `## Unreleased 5.6`, `## Unreleased v5.2`,
 * `## Unreleased 5.2 patch 1`, and `## [Unreleased] <!-- master -->`. The whole
 * line is replaced, so the section content moves under the new release heading
 * instead of staying under a stale one.
 */
const UNRELEASED_HEADING_RE = /^## .*Unreleased.*$/m;

/**
 * Matches release headings with the full 4-component extension version,
 * e.g. `## [5.6.0.1] - 2026-08-20` or `## [5.6.0.1-beta] - 2026-08-20`.
 * Legacy short headings (e.g. `## [5.5]`) are intentionally not matched.
 */
const VERSION_HEADING_RE = /^## \[(\d+\.\d+\.\d+\.\d+(?:-beta)?)\] - \d{4}-\d{2}-\d{2}\s*$/;

/**
 * Inserts the release heading into the changelog.
 *
 * When an Unreleased heading exists, the new version heading is inserted right
 * below it, so the content that accumulated under Unreleased now belongs to
 * the new version. When it does not exist, both `## [Unreleased]` and the new
 * heading are inserted before the first existing heading (after the preamble).
 *
 * @param content Changelog content.
 * @param newHeading Heading line to insert.
 *
 * @returns Patched changelog content.
 *
 * @throws Error when more than one Unreleased heading exists.
 */
const insertHeading = (content: string, newHeading: string): string => {
    const eol = content.includes('\r\n') ? '\r\n' : '\n';
    const unreleasedHeadings = content
        .split(/\r?\n/)
        .filter((line) => UNRELEASED_HEADING_RE.test(line));

    if (unreleasedHeadings.length > 1) {
        throw new Error(
            `Found ${unreleasedHeadings.length} Unreleased headings; merge them manually `
            + `before preparing a release: ${unreleasedHeadings.join(', ')}`,
        );
    }

    if (unreleasedHeadings.length === 1) {
        return content.replace(
            UNRELEASED_HEADING_RE,
            `${UNRELEASED_HEADING}${eol}${eol}${newHeading}`,
        );
    }

    const firstHeadingMatch = content.match(/^## \[.*$/m);
    if (!firstHeadingMatch || firstHeadingMatch.index === undefined) {
        return `${content.trimEnd()}${eol}${eol}${UNRELEASED_HEADING}${eol}${eol}${newHeading}${eol}`;
    }

    const idx = firstHeadingMatch.index;
    return `${content.slice(0, idx)}${UNRELEASED_HEADING}${eol}${eol}${newHeading}${eol}${eol}${content.slice(idx)}`;
};

/**
 * Finds the index of the next `## [` heading after the given line.
 *
 * @param lines Changelog lines.
 * @param start Index of the line to start searching after.
 *
 * @returns Index of the next heading, or the number of lines when there is
 * none.
 */
const findNextHeadingIndex = (lines: string[], start: number): number => {
    for (let i = start + 1; i < lines.length; i += 1) {
        const line = lines[i];
        if (line !== undefined && line.startsWith('## [')) {
            return i;
        }
    }
    return lines.length;
};

/**
 * Inserts the compare link definition at the end of the release section, right
 * before the next heading.
 *
 * @param content Changelog content with the release heading already inserted.
 * @param heading Heading line of the release section.
 * @param link Link definition to insert.
 *
 * @returns Patched changelog content.
 *
 * @throws Error when the heading is not found in the content.
 */
const insertCompareLink = (content: string, heading: string, link: string): string => {
    const eol = content.includes('\r\n') ? '\r\n' : '\n';
    const lines = content.split(/\r?\n/);
    const headingIndex = lines.indexOf(heading);
    if (headingIndex === -1) {
        throw new Error(`Cannot find the changelog heading: ${heading}`);
    }

    const nextHeadingIndex = findNextHeadingIndex(lines, headingIndex);

    // Drop the blank lines that separate the section body from the next heading.
    const body = lines.slice(headingIndex + 1, nextHeadingIndex);
    while (body.length > 0 && body[body.length - 1]?.trim() === '') {
        body.pop();
    }

    const tail = lines.slice(nextHeadingIndex);

    return [...lines.slice(0, headingIndex + 1), ...body, '', link, '', ...tail].join(eol);
};

/**
 * Builds the compare link definition for a release, e.g.
 * `[5.5.3.1-beta]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v5.5.3-beta.0...v5.5.3-beta.1`.
 *
 * @param version Version that is being prepared.
 * @param previousTag Previous tag to compare with.
 *
 * @returns Link definition line.
 */
const formatCompareLink = (version: ExtensionVersion, previousTag: string): string => {
    return `[${formatHeadingVersion(version)}]: ${CHANGELOG_REPO_URL}/compare/${previousTag}...${formatTag(version)}`;
};

/**
 * Patches the changelog for a new release: inserts the version heading and,
 * when a previous tag is given, the compare link definition at the end of the
 * new section.
 *
 * @param content Changelog content.
 * @param version Version that is being prepared.
 * @param date Release date in YYYY-MM-DD format.
 * @param previousTag Previous tag for the compare link. When omitted, no link
 * is added.
 *
 * @returns Patched changelog content.
 */
export const patchChangelog = (
    content: string,
    version: ExtensionVersion,
    date: string,
    previousTag?: string,
): string => {
    const newHeading = `## [${formatHeadingVersion(version)}] - ${date}`;
    const patched = insertHeading(content, newHeading);

    if (!previousTag) {
        return patched;
    }

    return insertCompareLink(patched, newHeading, formatCompareLink(version, previousTag));
};

/**
 * Latest release entry parsed from the changelog.
 */
export type ChangelogEntry = {
    version: string;
    section: string;
};

/**
 * Extracts the first full-version release entry from the changelog: the
 * heading version and the section body until the next heading.
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

    const end = findNextHeadingIndex(lines, start);

    const section = lines.slice(start + 1, end).join('\n').trim();

    return {
        version,
        section,
    };
};

/**
 * Section appended to the release notes of the release channel that links the
 * signed standalone builds shipped on the beta channel. Both auto-update from
 * the beta static directory, so users who cannot install from the stores
 * (Chromium MV2 forks, AMO geo-blocking) can install them directly.
 */
const STANDALONE_BUILDS_SECTION = `### Standalone builds

Signed, self-distributed packages auto-updating from the beta channel:

- [chrome.crx](${CHROME_CODEBASE_URL}) — Chrome MV2 CRX for Chromium MV2 forks (e.g. Supermium, Helium)
- [firefox.xpi](${FIREFOX_XPI_URL}) — signed Firefox XPI for regions where AMO is unavailable`;

/**
 * Appends the standalone builds section to the release notes for the release
 * channel. Beta pre-releases already attach these packages as assets, so their
 * notes stay unchanged.
 *
 * @param section Changelog section used as release notes.
 * @param channel Release channel.
 *
 * @returns Release notes with the standalone builds links appended.
 */
export const appendStandaloneBuildLinks = (section: string, channel: ReleaseChannel): string => {
    if (channel !== ReleaseChannel.Release) {
        return section;
    }
    return `${section.trimEnd()}\n\n${STANDALONE_BUILDS_SECTION}`;
};
