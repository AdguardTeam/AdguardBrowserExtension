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

import { createHash } from 'node:crypto';

import { Engine } from '@adguard/tsurlfilter';

/**
 * Process-wide cache of compiled engines keyed by filter-list content hash.
 * Chromium and Opera rulesets share most filter lists, so compiling each
 * unique list only once avoids parsing ~100 MB of rules per browser target.
 */
const engineCache = new Map<string, Engine>();

/**
 * Returns a compiled engine for the filter list, reusing a cached instance
 * when another browser target already compiled identical content.
 *
 * @param rawFilterList Raw filter list text.
 *
 * @returns Compiled tsurlfilter engine.
 */
export const getEngineForFilterList = (rawFilterList: string): Engine => {
    const key = createHash('sha256').update(rawFilterList).digest('hex');

    let engine = engineCache.get(key);
    if (!engine) {
        engine = Engine.createSync({ filters: [{ id: 1, content: rawFilterList }] });
        engineCache.set(key, engine);
    }

    return engine;
};
