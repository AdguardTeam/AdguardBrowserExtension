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

import { promises as fs } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

/**
 * Asserts that none of the given template sentinel markers remain in
 * `content`. Intended to be called right after filling in a code template,
 * to catch cases where a marker was left unreplaced (e.g. a typo in the
 * marker name, or a template change that removed a marker the generator
 * still expects to fill).
 *
 * @param content Assembled template content to check.
 * @param sentinels Marker strings that must not appear in `content`.
 *
 * @throws {Error} If any sentinel is still present in `content`.
 */
export const assertNoTemplateSentinels = (content: string, sentinels: string[]): void => {
    const remaining = sentinels.filter((sentinel) => content.includes(sentinel));
    if (remaining.length > 0) {
        throw new Error(`Template sentinel(s) not replaced: ${remaining.join(', ')}`);
    }
};

/**
 * Validates the syntax of `content` and writes it to `filePath`.
 *
 * The `vm.Script` constructor is used solely for syntax validation —
 * the script is never executed.
 *
 * @param content JavaScript source code to write.
 * @param filePath Absolute path of the output file.
 *
 * @throws {Error} If the code contains a syntax error.
 */
export const writeBundle = async (content: string, filePath: string): Promise<void> => {
    try {
        // eslint-disable-next-line no-new
        new vm.Script(content);
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`Syntax error in ${path.basename(filePath)}: ${msg}`);
    }
    await fs.writeFile(filePath, content, 'utf-8');
};
