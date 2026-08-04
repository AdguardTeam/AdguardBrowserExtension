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

/** Sentinel comments delimiting the extractable body in code templates. */
const BODY_START_MARKER = '// __BODY_START__';
const BODY_END_MARKER = '// __BODY_END__';

/**
 * Extracts the marker-delimited body from a stringified code template.
 *
 * @param templateFunction Zero-arg template function delimited by
 * `// __BODY_START__` / `// __BODY_END__` comments. Its name is used in the
 * error message.
 *
 * @returns Raw template body between the markers.
 *
 * @throws {Error} When the markers are missing or malformed.
 */
export const extractTemplateBody = (
    templateFunction: () => unknown,
): string => {
    const source = templateFunction.toString();
    const bodyStartIdx = source.indexOf(BODY_START_MARKER);
    const bodyEndIdx = source.indexOf(BODY_END_MARKER);

    if (bodyStartIdx < 0 || bodyEndIdx < 0 || bodyEndIdx <= bodyStartIdx) {
        throw new Error(
            `${templateFunction.name} template markers not found or malformed — `
            + 'the toolchain likely stripped comments from the template',
        );
    }

    return source.slice(bodyStartIdx + BODY_START_MARKER.length, bodyEndIdx);
};

/**
 * Asserts that none of the given template markers remain in `content`,
 * catching unreplaced markers right after a template is filled.
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
 * Validates the syntax of `content` via `vm.Script` (never executed) and
 * writes it to `filePath`.
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
