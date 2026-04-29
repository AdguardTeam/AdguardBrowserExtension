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

import { parse } from 'tldts';

import { WILDCARD_TLD_SUFFIX } from '../../../common/constants';

/**
 * List of search engine domain patterns.
 *
 * The list is intentionally short because Opera only grants the
 * "Allow access to search page results" permission for a limited set
 * of domains — most search engines are not recognized by Opera as such.
 *
 * Source: https://en.wikipedia.org/wiki/List_of_search_engines.
 */
const SEARCH_ENGINE_DOMAINS = [
    'google.*',
    'bing.com',
    'duckduckgo.com',
    'yandex.*',
    'baidu.com',
    'qwant.com',
];

/**
 * Checks if the given URL belongs to a search engine domain.
 *
 * @param url URL to check.
 *
 * @returns True if the URL is a search engine page.
 */
export function isSearchEngineDomain(url: string): boolean {
    const { domain, domainWithoutSuffix } = parse(url);

    if (!domain || !domainWithoutSuffix) {
        return false;
    }

    return SEARCH_ENGINE_DOMAINS.some((enginePattern) => {
        if (enginePattern.endsWith(WILDCARD_TLD_SUFFIX)) {
            const prefix = enginePattern.slice(0, -WILDCARD_TLD_SUFFIX.length);
            return domainWithoutSuffix === prefix;
        }

        return domain === enginePattern;
    });
}
