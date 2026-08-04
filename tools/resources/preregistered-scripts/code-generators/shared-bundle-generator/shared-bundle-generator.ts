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

import { NEWLINE_CHAR_UNIX } from '../../../../../Extension/src/common/constants';
import { minifyJs } from '../../constants';
import { assertNoTemplateSentinels, extractTemplateBody } from '../../write-helpers';

import { BUNDLE_TEMPLATE } from './shared-bundle-template';

/**
 * Compiles the shared scriptlets bundle: the coordination-key runner
 * assigned to a `window` property so the cleanup file can fully `delete`
 * it. Scriptlet implementations are NOT embedded — per-function files
 * populate the `.f` registry instead, so each host loads only the
 * functions its rules use.
 *
 * The bundle is emitted even when no scriptlets are used: per-hash JS-rule
 * files still need `<key>.b` for deduplication.
 *
 * @param coordinationKey Identifier shared with the per-function files,
 * the per-hash files and the cleanup file.
 *
 * @returns Compiled shared bundle string.
 */
export const compileSharedScriptletsBundle = async (coordinationKey: string): Promise<string> => {
    const filled = extractTemplateBody(BUNDLE_TEMPLATE)
        .replace(/__PROP__/g, () => coordinationKey);

    assertNoTemplateSentinels(filled, ['__PROP__']);

    const source = `${filled.trim()}${NEWLINE_CHAR_UNIX}`;
    const minified = await minifyJs(source);

    return `${minified}${NEWLINE_CHAR_UNIX}`;
};
