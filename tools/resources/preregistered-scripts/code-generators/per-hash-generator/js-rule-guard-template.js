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
 * Template for the idempotency guard wrapping each JS rule in a per-hash
 * file. `__KEY__` → rule hash, `__CODE__` → rule source, `__PROP__` → bare
 * coordination key identifier (the shared bundle's top-level `let`).
 */
export const JS_RULE_GUARD_TEMPLATE = () => {
    // __BODY_START__
    try {
        const ruleKey = __KEY__; /* replaced with JSON.stringify(ruleHash) */
        const dedupSet = __PROP__.b;
        if (!dedupSet.has(ruleKey)) {
            dedupSet.add(ruleKey);
            __CODE__; /* replaced with rule source code */
        }
    } catch (err) {}
    // __BODY_END__
};
