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
import { writeBundle, assertNoTemplateSentinels } from '../../writeHelpers';

import { CLEANUP_TEMPLATE } from './cleanup-template';

/**
 * Explicit sentinel comments marking the extractable body inside
 * {@link CLEANUP_TEMPLATE}. Using explicit markers (instead of locating the
 * first `{`/last `}` in the stringified function) keeps extraction correct
 * regardless of how the template's signature or surrounding code is written.
 */
const BODY_START_MARKER = '// __BODY_START__';
const BODY_END_MARKER = '// __BODY_END__';

/**
 * Compiles and writes `cleanup.js` — deletes the coordination property the
 * shared bundle created on `window`, so it never survives into the page's
 * own script execution.
 *
 * Must be registered as the last entry in a domain's `js` array (see
 * `PreregisteredScriptsService.buildDomainScripts`), after the shared bundle
 * and every per-hash file.
 *
 * @param coordinationKey Random per-build `window` property name (see
 * `coordination-key.ts`), matching the one baked into the shared bundle and
 * per-hash files.
 * @param outputDir Directory to write the file into.
 *
 * @returns Promise that resolves when the file has been written.
 */
export const writeCleanupFile = async (
    coordinationKey: string,
    outputDir: string,
): Promise<void> => {
    const source = CLEANUP_TEMPLATE.toString();
    const bodyStart = source.indexOf(BODY_START_MARKER) + BODY_START_MARKER.length;
    const bodyEnd = source.indexOf(BODY_END_MARKER);

    const body = source
        .slice(bodyStart, bodyEnd)
        .replace('__PROP__', () => JSON.stringify(coordinationKey));

    assertNoTemplateSentinels(body, ['__PROP__']);

    const content = `(function () {${NEWLINE_CHAR_UNIX}${body.trim()}${NEWLINE_CHAR_UNIX}})();${NEWLINE_CHAR_UNIX}`;
    const minified = await minifyJs(content);

    const outputPath = path.join(outputDir, CLEANUP_BUNDLE_FILENAME);
    await writeBundle(minified, outputPath);
    console.log(`[ext.writeCleanupFile]: Wrote ${CLEANUP_BUNDLE_FILENAME}`);
};
