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

// @ts-nocheck
/* eslint-disable */

/**
 * Template for `cleanup.js` — the last file loaded for a domain, after the
 * shared bundle and every per-hash rule file (see `preregistered-scripts-service.ts`,
 * which always appends this file to the end of the `js` array).
 *
 * ## Build-time
 *
 * `__PROP__` is replaced with `JSON.stringify(coordinationKey)` — the same
 * random `window` property name used by the shared bundle and per-hash files.
 *
 * ## Runtime (MAIN world, `document_start`)
 *
 * Deletes the coordination property so it never survives into the page's
 * own script execution. Content scripts registered with `document_start`
 * all run, in registration order, before the page's own scripts get a
 * chance to run, so by the time page code executes, `window[__PROP__]` is
 * already gone — page code can never observe or call it.
 */
export const CLEANUP_TEMPLATE = () => {
    // __BODY_START__
    try {
        delete window[__PROP__];
    } catch (e) {}
    // __BODY_END__
};
