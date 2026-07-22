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

import crypto from 'node:crypto';

/**
 * Number of random bytes used to build a coordination key. 8 bytes (16 hex
 * chars) is more than enough to make the property name unguessable within a
 * single build.
 */
const KEY_RANDOM_BYTES = 8;

/**
 * Generates a random identifier shared by the bundle, per-hash files, and
 * the cleanup file within one build. Used as a top-level `let` variable
 * name (a lexical binding, not a `window` property), changing every build
 * so pages can't hardcode it across versions.
 *
 * @returns A valid-JS-identifier random string, e.g. `"__ag_3f9a1c2b8e4d5601"`.
 */
export const generateCoordinationKey = (): string => {
    return `__ag_${crypto.randomBytes(KEY_RANDOM_BYTES).toString('hex')}`;
};
