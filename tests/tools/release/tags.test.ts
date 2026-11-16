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

import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import { listTags, parseTagList } from '../../../tools/release/tags';

vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, unknown>;
    const spawnSyncMock = vi.fn();
    return {
        ...actual,
        spawnSync: spawnSyncMock,
        default: {
            ...actual,
            spawnSync: spawnSyncMock,
        },
    };
});

describe('parseTagList', () => {
    test('splits git ls-remote output into tag names', () => {
        expect(parseTagList(
            'abc123\trefs/tags/v5.5.3.5\ndef456\trefs/tags/v5.5.3.4\n',
        )).toEqual(['v5.5.3.5', 'v5.5.3.4']);
    });

    test('trims whitespace and drops empty lines', () => {
        expect(parseTagList(
            '  abc123\trefs/tags/v5.5.3.5  \n\ndef456\trefs/tags/v5.5.3.4\n\n',
        )).toEqual(['v5.5.3.5', 'v5.5.3.4']);
    });

    test('returns an empty list for empty output', () => {
        expect(parseTagList('')).toEqual([]);
    });

    test('ignores lines without a refs/tags ref', () => {
        expect(parseTagList(
            'garbage\nabc123\trefs/heads/main\ndef456\trefs/tags/v5.5.3.5\n',
        )).toEqual(['v5.5.3.5']);
    });
});

describe('listTags', () => {
    beforeEach(() => {
        vi.mocked(spawnSync).mockReset();
    });

    test('reads the tags from origin in the repository root', () => {
        vi.mocked(spawnSync).mockReturnValue({
            status: 0,
            stdout: 'abc123\trefs/tags/v5.5.3.5\ndef456\trefs/tags/v5.5.3.4\n',
            stderr: '',
        } as ReturnType<typeof spawnSync>);

        expect(listTags('/repo')).toEqual(['v5.5.3.5', 'v5.5.3.4']);
        expect(spawnSync).toHaveBeenCalledWith(
            'git',
            ['ls-remote', '--tags', '--refs', 'origin'],
            { cwd: '/repo', encoding: 'utf8' },
        );
    });

    test('throws when git fails', () => {
        vi.mocked(spawnSync).mockReturnValue({
            status: 128,
            stdout: '',
            stderr: 'fatal: unable to access origin',
        } as ReturnType<typeof spawnSync>);

        expect(() => listTags('/repo'))
            .toThrow(/Cannot list tags on origin: fatal: unable to access origin/);
    });
});
