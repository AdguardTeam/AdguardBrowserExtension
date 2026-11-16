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

/**
 * Parses tag names from `git ls-remote --tags --refs` output. Each line is
 * `<object-id>\trefs/tags/<name>`; the object id and the `refs/tags/` prefix
 * are stripped.
 *
 * @param output Raw command output.
 *
 * @returns Tag names without empty lines and surrounding whitespace.
 */
export const parseTagList = (output: string): string[] => {
    return output
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '')
        .map((line) => line.split('\t')[1] ?? '')
        .filter((ref) => ref.startsWith('refs/tags/'))
        .map((ref) => ref.slice('refs/tags/'.length))
        .filter((tag) => tag !== '');
};

/**
 * Lists the release tags on the origin remote.
 *
 * Reads the tags from origin instead of the local checkout, so the caller does
 * not depend on fetched tag refs or on the process working directory.
 *
 * @param repoRoot Repository root to run git in.
 *
 * @returns Tag names.
 *
 * @throws Error when git itself fails.
 */
export const listTags = (repoRoot: string): string[] => {
    const result = spawnSync(
        'git',
        ['ls-remote', '--tags', '--refs', 'origin'],
        { cwd: repoRoot, encoding: 'utf8' },
    );

    if (result.error) {
        throw new Error(`Cannot list tags on origin: ${result.error.message}`);
    }
    if (result.status !== 0) {
        const details = result.stderr.trim();
        throw new Error(`Cannot list tags on origin${details ? `: ${details}` : ''}`);
    }

    return parseTagList(result.stdout);
};
