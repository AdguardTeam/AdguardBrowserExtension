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

import { SCRIPTLETS_VERSION } from '@adguard/scriptlets';

/** Hex chars kept from the SHA-256 digest (64 bits — collision-free here). */
const KEY_HASH_HEX_CHARS = 16;

/**
 * Derives the identifier shared by the bundle, per-hash files and cleanup
 * file within one build; used as a top-level `let` variable name.
 *
 * Deterministic (derived from the scriptlets library version): identical
 * inputs produce byte-identical bundles, and persisted content-script
 * registrations keep working across filter-only releases since both
 * generations share the key.
 *
 * @returns A valid-JS-identifier string, e.g. `"__ag_3f9a1c2b8e4d5601"`.
 */
export const generateCoordinationKey = (): string => {
    const digest = crypto
        .createHash('sha256')
        .update(`__ag_${SCRIPTLETS_VERSION}`)
        .digest('hex')
        .slice(0, KEY_HASH_HEX_CHARS);

    return `__ag_${digest}`;
};
