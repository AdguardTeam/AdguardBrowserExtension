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

/* eslint-disable no-console */

import path from 'node:path';

import { CLEANUP_BUNDLE_FILENAME } from '@adguard/tswebextension/mv3/preregistered-scripts/hasher';

import { NEWLINE_CHAR_UNIX } from '../../../../../Extension/src/common/constants';
import { minifyJs } from '../../constants';
import {
    writeBundle,
    assertNoTemplateSentinels,
    extractTemplateBody,
} from '../../writeHelpers';

import { CLEANUP_TEMPLATE } from './cleanup-template';

/**
 * Compiles and writes `cleanup.js` — reassigns the coordination `let`
 * binding to `undefined`. Registered as the last entry in a domain's `js`
 * array, after the shared bundle and the per-hash files.
 *
 * @param coordinationKey Identifier declared by the shared bundle.
 * @param outputDir Directory to write the file into.
 *
 * @returns Promise that resolves when the file has been written.
 */
export const writeCleanupFile = async (
    coordinationKey: string,
    outputDir: string,
): Promise<void> => {
    const body = extractTemplateBody(CLEANUP_TEMPLATE)
        .replace('__PROP__', () => coordinationKey);

    assertNoTemplateSentinels(body, ['__PROP__']);

    const content = `(function () {${NEWLINE_CHAR_UNIX}${body.trim()}${NEWLINE_CHAR_UNIX}})();${NEWLINE_CHAR_UNIX}`;
    const minified = await minifyJs(content);

    const outputPath = path.join(outputDir, CLEANUP_BUNDLE_FILENAME);
    await writeBundle(minified, outputPath);
    console.log(`[ext.writeCleanupFile]: Wrote ${CLEANUP_BUNDLE_FILENAME}`);
};
