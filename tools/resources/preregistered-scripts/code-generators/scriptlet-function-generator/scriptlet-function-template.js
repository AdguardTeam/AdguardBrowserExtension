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
 * Template for a per-function scriptlet file.
 *
 * `__FUNCTION__`/`__ASSIGNMENTS__`/`__PROP__` are replaced with the
 * scriptlet function source, the alias registration statements and the
 * coordination key.
 *
 * The file registers the function under each of its alias names in the
 * shared bundle's `.f` registry. The shared bundle always runs first in a
 * registration's `js` list, but a missing registry is tolerated anyway —
 * the affected rules then silently no-op instead of breaking the page.
 */
export const FUNCTION_TEMPLATE = () => {
    // __BODY_START__
    try {
        let fn = __FUNCTION__; /* replaced with the scriptlet function source */
        let registry = window.__PROP__ && window.__PROP__.f;
        if (registry) {
            __ASSIGNMENTS__ /* replaced with registry["name"] = fn; per alias */
        }
    } catch (e) {
        // Swallow — never break the page.
    }
    // __BODY_END__
};
