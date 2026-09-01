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

import {
    describe,
    expect,
    test,
} from 'vitest';

import { extractLatestEntry, patchChangelog } from '../../../tools/release/changelog';

const PREAMBLE = [
    '# AdGuard Browser Extension Changelog',
    '',
    'Some preamble.',
    '',
].join('\n');

describe('patchChangelog', () => {
    test('inserts the new version heading below Unreleased and keeps unreleased content under it', () => {
        const content = `${PREAMBLE}## [Unreleased]\n\n### Added\n\n- Feature A\n\n## [5.5.0.7] - 2026-08-01\n\n### Fixed\n\n- Fix B\n`;
        const patched = patchChangelog(content, '5.5.0.8-beta', '2026-08-20');

        expect(patched).toContain('## [Unreleased]\n\n## [5.5.0.8-beta] - 2026-08-20\n\n### Added\n\n- Feature A');
        expect(patched).toContain('## [5.5.0.7] - 2026-08-01');
    });

    test('introduces Unreleased when missing and inserts the heading before the first version heading', () => {
        const content = `${PREAMBLE}## [5.5] - 2026-08-17\n\n### Fixed\n\n- Fix B\n`;
        const patched = patchChangelog(content, '5.6.0.1', '2026-08-20');

        expect(patched).toBe(
            `${PREAMBLE}## [Unreleased]\n\n## [5.6.0.1] - 2026-08-20\n\n## [5.5] - 2026-08-17\n\n### Fixed\n\n- Fix B\n`,
        );
    });

    test('appends Unreleased and the heading when the changelog has no headings at all', () => {
        const content = '# Header only\n';
        const patched = patchChangelog(content, '5.6.0.1', '2026-08-20');

        expect(patched).toBe(
            '# Header only\n\n## [Unreleased]\n\n## [5.6.0.1] - 2026-08-20\n',
        );
    });

    test('does not split a heading with trailing text like "## [Unreleased] - WIP"', () => {
        const content = `${PREAMBLE}## [Unreleased] - WIP\n\n## [5.5.0.7] - 2026-08-01\n`;
        const patched = patchChangelog(content, '5.5.0.8', '2026-08-20');

        expect(patched).toBe(
            `${PREAMBLE}## [Unreleased]\n\n## [5.5.0.8] - 2026-08-20\n\n## [Unreleased] - WIP\n\n## [5.5.0.7] - 2026-08-01\n`,
        );
    });
});

describe('extractLatestEntry', () => {
    test('extracts the first full-version release entry', () => {
        const content = `${PREAMBLE}## [Unreleased]\n\n## [5.6.0.1] - 2026-08-20\n\n### Added\n\n- Feature A\n\n## [5.5.0.7] - 2026-08-01\n\n### Fixed\n\n- Fix B\n`;
        const entry = extractLatestEntry(content);

        expect(entry.version).toBe('5.6.0.1');
        expect(entry.channel).toBe('release');
        expect(entry.section).toBe('### Added\n\n- Feature A');
    });

    test('extracts a beta entry with its channel', () => {
        const content = `${PREAMBLE}## [Unreleased]\n\n## [5.6.0.1-beta] - 2026-08-20\n\n### Fixed\n\n- Fix A\n`;
        const entry = extractLatestEntry(content);

        expect(entry.version).toBe('5.6.0.1-beta');
        expect(entry.channel).toBe('beta');
    });

    test('skips legacy short headings like [5.5] and finds the first full-version heading', () => {
        const content = `${PREAMBLE}## [5.5] - 2026-08-17\n\n### Fixed\n\n- Fix B\n\n## [5.5.0.8] - 2026-08-10\n\n### Added\n\n- Feature A\n`;
        const entry = extractLatestEntry(content);

        expect(entry.version).toBe('5.5.0.8');
    });

    test('throws when no full-version heading exists', () => {
        const content = `${PREAMBLE}## [5.5] - 2026-08-17\n`;
        expect(() => extractLatestEntry(content)).toThrow(/No full-version release heading/);
    });
});
