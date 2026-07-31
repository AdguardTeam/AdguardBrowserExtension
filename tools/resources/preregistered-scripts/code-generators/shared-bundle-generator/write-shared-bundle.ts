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

import { SHARED_BUNDLE_FILENAME } from '@adguard/tswebextension/mv3/preregistered-scripts/hasher';

import { writeBundle } from '../../writeHelpers';

import { compileSharedScriptletsBundle } from './shared-bundle-generator';

/**
 * Builds and writes the shared scriptlets bundle. Written unconditionally:
 * per-hash JS-rule files need its dedup set even when no scriptlets are used.
 *
 * @param scriptletNames Set of unique scriptlet names used across all domains.
 * @param outputDir Directory to write the shared bundle file into.
 * @param coordinationKey Identifier declared by the shared bundle.
 *
 * @returns Resolves when written.
 */
export const writeSharedBundle = async (
    scriptletNames: Set<string>,
    outputDir: string,
    coordinationKey: string,
): Promise<void> => {
    const shared = await compileSharedScriptletsBundle(scriptletNames, coordinationKey);

    const sharedPath = path.join(outputDir, SHARED_BUNDLE_FILENAME);
    await writeBundle(shared, sharedPath);
    const kb = (Buffer.byteLength(shared, 'utf-8') / 1024).toFixed(1);
    console.log(`[generate-preregistered-domain-bundles] Wrote ${SHARED_BUNDLE_FILENAME} (${kb} KB)`);
};
