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

import {
    appendStandaloneBuildLinks,
    extractLatestEntry,
    patchChangelog,
} from '../../../tools/release/changelog';
import { parseExtensionVersion, ReleaseChannel } from '../../../tools/release/version';

const PREAMBLE = [
    '# AdGuard Browser Extension Changelog',
    '',
    'Some preamble.',
    '',
].join('\n');

describe('patchChangelog', () => {
    test('inserts the new version heading below Unreleased and keeps unreleased content under it', () => {
        const content = `${PREAMBLE}## [Unreleased]\n\n### Added\n\n- Feature A\n\n## [5.5.0.7] - 2026-08-01\n\n### Fixed\n\n- Fix B\n`;
        const patched = patchChangelog(content, parseExtensionVersion('v5.5.0.8-beta'), '2026-08-20');

        expect(patched).toContain('## [Unreleased]\n\n## [5.5.0.8-beta] - 2026-08-20\n\n### Added\n\n- Feature A');
        expect(patched).toContain('## [5.5.0.7] - 2026-08-01');
    });

    test('introduces Unreleased when missing and inserts the heading before the first version heading', () => {
        const content = `${PREAMBLE}## [5.5] - 2026-08-17\n\n### Fixed\n\n- Fix B\n`;
        const patched = patchChangelog(content, parseExtensionVersion('v5.6.0.1'), '2026-08-20');

        expect(patched).toBe(
            `${PREAMBLE}## [Unreleased]\n\n## [5.6.0.1] - 2026-08-20\n\n## [5.5] - 2026-08-17\n\n### Fixed\n\n- Fix B\n`,
        );
    });

    test('appends Unreleased and the heading when the changelog has no headings at all', () => {
        const content = '# Header only\n';
        const patched = patchChangelog(content, parseExtensionVersion('v5.6.0.1'), '2026-08-20');

        expect(patched).toBe(
            '# Header only\n\n## [Unreleased]\n\n## [5.6.0.1] - 2026-08-20\n',
        );
    });

    test('treats a heading with trailing text as the Unreleased section', () => {
        const content = `${PREAMBLE}## [Unreleased] - WIP\n\n### Added\n\n- Feature A\n\n## [5.5.0.7] - 2026-08-01\n`;
        const patched = patchChangelog(content, parseExtensionVersion('v5.5.0.8'), '2026-08-20');

        expect(patched).toBe(
            `${PREAMBLE}## [Unreleased]\n\n## [5.5.0.8] - 2026-08-20\n\n### Added\n\n- Feature A\n\n## [5.5.0.7] - 2026-08-01\n`,
        );
    });

    test.each([
        '## Unreleased',
        '## Unreleased v5.2',
        '## Unreleased 5.2 patch 1',
        '## [Unreleased] <!-- master -->',
        '## Unreleased <!-- release/v5.2 -->',
        '## [5.1.X] Unreleased <!-- version 5.1 -->',
    ])('recognizes the historical Unreleased heading "%s"', (heading) => {
        const content = `${PREAMBLE}${heading}\n\n### Added\n\n- Feature A\n\n## [5.5.0.7] - 2026-08-01\n`;
        const patched = patchChangelog(content, parseExtensionVersion('v5.5.0.8'), '2026-08-20');

        expect(patched).toContain(
            '## [Unreleased]\n\n## [5.5.0.8] - 2026-08-20\n\n### Added\n\n- Feature A',
        );
        expect(patched).not.toContain(heading);
    });

    test('preserves CRLF line endings when no compare link is added', () => {
        const content = `${PREAMBLE}## [Unreleased]\n\n### Added\n\n- Feature A\n`.replace(/\n/g, '\r\n');
        const patched = patchChangelog(content, parseExtensionVersion('v5.5.0.8'), '2026-08-20');

        expect(patched).not.toMatch(/[^\r]\n/);
    });

    test('throws when more than one Unreleased heading exists', () => {
        const content = `${PREAMBLE}## Unreleased 5.6\n\n### Added\n\n- Feature A\n\n## Unreleased 5.5.2\n\n### Fixed\n\n- Fix B\n\n## [5.5.0.7] - 2026-08-01\n`;

        expect(() => patchChangelog(
            content,
            parseExtensionVersion('v5.6.0.1-beta'),
            '2026-10-20',
        )).toThrow(/2 Unreleased headings/);
    });
});

describe('patchChangelog with a previous tag', () => {
    test('adds the compare link at the end of the new section', () => {
        const content = `${PREAMBLE}## [Unreleased]\n\n### Added\n\n- Feature A\n\n## [5.5.0.7] - 2026-08-01\n\n### Fixed\n\n- Fix B\n`;
        const patched = patchChangelog(content, parseExtensionVersion('v5.5.0.8-beta'), '2026-08-20', 'v5.5.0.7');

        expect(patched).toBe(
            `${PREAMBLE}## [Unreleased]\n\n`
            + '## [5.5.0.8-beta] - 2026-08-20\n\n'
            + '### Added\n\n- Feature A\n\n'
            + '[5.5.0.8-beta]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v5.5.0.7...v5.5.0-beta.8\n\n'
            + '## [5.5.0.7] - 2026-08-01\n\n### Fixed\n\n- Fix B\n',
        );
    });

    test('adds the link right after an empty section', () => {
        const content = `${PREAMBLE}## [Unreleased]\n\n## [5.5.0.7] - 2026-08-01\n`;
        const patched = patchChangelog(content, parseExtensionVersion('v5.5.0.8'), '2026-08-20', 'v5.5.0.7');

        expect(patched).toBe(
            `${PREAMBLE}## [Unreleased]\n\n`
            + '## [5.5.0.8] - 2026-08-20\n\n'
            + '[5.5.0.8]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v5.5.0.7...v5.5.0\n\n'
            + '## [5.5.0.7] - 2026-08-01\n',
        );
    });

    test('adds the link when the heading is appended at the end of the file', () => {
        const patched = patchChangelog(
            '# Header only\n',
            parseExtensionVersion('v5.6.0.1'),
            '2026-08-20',
            'v5.5.3.6-beta',
        );

        expect(patched).toBe(
            '# Header only\n\n'
            + '## [Unreleased]\n\n'
            + '## [5.6.0.1] - 2026-08-20\n\n'
            + '[5.6.0.1]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v5.5.3.6-beta...v5.6.0\n',
        );
    });

    test('recognizes "## Unreleased 5.6" and moves its content under the new heading', () => {
        const content = `${PREAMBLE}## Unreleased 5.6\n\n### Added\n\n- Feature A\n\n## [5.5.3.5] - 2026-10-13\n`;
        const patched = patchChangelog(
            content,
            parseExtensionVersion('v5.6.0.1-beta'),
            '2026-10-20',
            'v5.5.3.6-beta',
        );

        expect(patched).toBe(
            `${PREAMBLE}## [Unreleased]\n\n`
            + '## [5.6.0.1-beta] - 2026-10-20\n\n'
            + '### Added\n\n- Feature A\n\n'
            + '[5.6.0.1-beta]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v5.5.3.6-beta...v5.6.0-beta.1\n\n'
            + '## [5.5.3.5] - 2026-10-13\n',
        );
    });

    test('adds no link when there are no older tags', () => {
        const content = `${PREAMBLE}## [Unreleased]\n\n### Added\n\n- Feature A\n`;
        const patched = patchChangelog(content, parseExtensionVersion('v5.5.0.8'), '2026-08-20');

        expect(patched).not.toContain('/compare/');
    });

    test('preserves CRLF line endings when adding the link', () => {
        const content = `${PREAMBLE}## [Unreleased]\n\n### Added\n\n- Feature A\n\n## [5.5.0.7] - 2026-08-01\n`.replace(/\n/g, '\r\n');
        const patched = patchChangelog(content, parseExtensionVersion('v5.5.0.8-beta'), '2026-08-20', 'v5.5.0.7');

        expect(patched).not.toMatch(/[^\r]\n/);
    });
});

describe('extractLatestEntry', () => {
    test('extracts the first full-version release entry', () => {
        const content = `${PREAMBLE}## [Unreleased]\n\n## [5.6.0.1] - 2026-08-20\n\n### Added\n\n- Feature A\n\n## [5.5.0.7] - 2026-08-01\n\n### Fixed\n\n- Fix B\n`;
        const entry = extractLatestEntry(content);

        expect(entry.version).toBe('5.6.0.1');
        expect(entry.section).toBe('### Added\n\n- Feature A');
    });

    test('extracts a beta entry', () => {
        const content = `${PREAMBLE}## [Unreleased]\n\n## [5.6.0.1-beta] - 2026-08-20\n\n### Fixed\n\n- Fix A\n`;
        const entry = extractLatestEntry(content);

        expect(entry.version).toBe('5.6.0.1-beta');
        expect(entry.section).toBe('### Fixed\n\n- Fix A');
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

describe('appendStandaloneBuildLinks', () => {
    const section = '### Added\n\n- Feature A';

    test('appends the standalone build links for the release channel', () => {
        const notes = appendStandaloneBuildLinks(section, ReleaseChannel.Release);

        expect(notes).toContain(section);
        expect(notes).toContain('### Standalone builds');
        expect(notes).toContain(
            '[chrome.crx](https://static.adtidy.org/extensions/adguardadblocker/beta/chrome.crx)',
        );
        expect(notes).toContain(
            '[firefox.xpi](https://static.adtidy.org/extensions/adguardadblocker/beta/firefox.xpi)',
        );
    });

    test('leaves the beta release notes unchanged', () => {
        expect(appendStandaloneBuildLinks(section, ReleaseChannel.Beta)).toBe(section);
    });
});
