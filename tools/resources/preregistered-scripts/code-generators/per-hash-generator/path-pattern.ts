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

import { SimpleRegex } from '@adguard/tsurlfilter';

/**
 * Converts a `$path` pattern into regex source and flags via tsurlfilter's
 * `SimpleRegex.patternToRegexp`. The result is embedded into MAIN-world
 * runtime code, so `Pattern` itself can't be reused here.
 *
 * @param pathPattern Raw `$path` modifier pattern text
 * (`rule.pathModifier.pattern`).
 *
 * @returns Regex source and flags for `new RegExp(source, flags)`.
 */
export const getPathPatternRegex = (pathPattern: string): { source: string; flags: string } => {
    if (pathPattern === '') {
        return { source: '^/$', flags: '' };
    }

    return {
        source: SimpleRegex.patternToRegexp(pathPattern),
        flags: 'i',
    };
};

/**
 * Builds a runtime regex test against the page URL's path + query + hash.
 * Matches tsurlfilter, which tests `$path` against path + query + fragment
 * with a case-insensitive regex.
 *
 * @param pathPattern Raw `$path` modifier pattern text
 * (`rule.pathModifier.pattern`).
 *
 * @returns JS expression evaluating to a boolean.
 */
export const getPathTest = (pathPattern: string): string => {
    const { source, flags } = getPathPatternRegex(pathPattern);
    return `new RegExp(${JSON.stringify(source)}, ${JSON.stringify(flags)})`
        + '.test(location.pathname + location.search + location.hash)';
};
