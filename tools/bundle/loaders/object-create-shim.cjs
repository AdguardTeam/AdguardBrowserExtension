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

/**
 * Replaces the core-js `Object.create` polyfill with the native function.
 *
 * Every supported browser has native `Object.create`. The polyfill needs its
 * legacy ActiveX/iframe fallback only when `Object.create` is missing. That
 * fallback is dead code for the supported browsers, and the Chrome Web Store
 * readability check treats it as obfuscated code.
 *
 * @returns {string} The module source.
 */
module.exports = function objectCreateShim() {
    return 'module.exports = Object.create;';
};
