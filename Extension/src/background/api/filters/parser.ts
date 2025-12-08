/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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
export type FilterParsedData = {
    name: string;
    description: string;
    homepage: string;
    version: string;
    expires: number;
    timeUpdated: string;
    // Spec https://github.com/ameshkov/diffupdates/tree/b81243c50d23e0a8be0fe95a80d55abd00b08981?tab=readme-ov-file#-diff-path
    diffPath: string;
};

/**
 * Helper class for parsing custom filter metadata, loaded from a remote source.
 */
export class FilterParser {
    /**
     * Number of lines to parse metadata from filter's header.
     */
    private static AMOUNT_OF_LINES_TO_PARSE = 50;

    /**
     * Parses filter metadata from rules' header.
     *
     * @param rules Lines of raw filter data text.
     *
     * @returns Parsed filter data.
     */
    static parseFilterDataFromHeader(rules: string[]): FilterParsedData {
        return {
            name: FilterParser.parseTag('Title', rules),
            description: FilterParser.parseTag('Description', rules),
            homepage: FilterParser.parseTag('Homepage', rules),
            version: FilterParser.parseTag('Version', rules),
            expires: Number(FilterParser.parseTag('Expires', rules)),
            timeUpdated: FilterParser.parseTag('TimeUpdated', rules),
            // Specs - https://github.com/ameshkov/diffupdates/tree/b81243c50d23e0a8be0fe95a80d55abd00b08981?tab=readme-ov-file#-diff-path
            diffPath: FilterParser.parseTag('Diff-Path', rules),
        };
    }

    /**
     * Finds value of specified header tag in filter rules text.
     *
     * @param tagName Filter header tag name.
     * @param rules Lines of filter rules text.
     *
     * @returns Value of specified header tag.
     */
    private static parseTag(tagName: string, rules: string[]): string {
        let result = '';

        // Look up no more than 50 first lines
        const maxLines = Math.min(FilterParser.AMOUNT_OF_LINES_TO_PARSE, rules.length);
        for (let i = 0; i < maxLines; i += 1) {
            const rule = rules[i];

            if (!rule) {
                continue;
            }

            const search = `! ${tagName}: `;
            const indexOfSearch = rule.indexOf(search);

            if (indexOfSearch >= 0) {
                result = rule.substring(indexOfSearch + search.length);
                // WARNING!
                // Potential memory leak mitigation for substring operation due to V8 optimizations:
                // When extracting a substring with rule.substring(), there's a concern in some JS environments
                // that the resulting substring might retain a hidden reference to the entire original 'rule' string.
                // This could prevent the garbage collector (GC) from freeing the memory allocated for filter rules.
                // This hidden reference occurs because the substring might not create a new string but rather
                // a view into the original, keeping it in memory longer than necessary.
                // And we receive a memory leak here because we store parsed tags from first N lines of the filter rules
                // which have references to the original large string with filter rules.
                // To ensure that the original large string can be garbage collected, and only the necessary
                // substring is retained, we explicitly force a copy of the substring via split and join,
                // thereby breaking the direct reference to the original string and allowing the GC to free the memory
                // for filter rules when they are no longer in use.
                result = result.split('').join('');
                break;
            }
        }

        if (tagName === 'Expires') {
            result = String(FilterParser.parseExpiresStr(result));
        }

        if (tagName === 'TimeUpdated') {
            result = result || new Date().toISOString();
        }

        return result;
    }

    /**
     * Parses string value of 'Expires' header tag.
     *
     * @param str Line of the rule text with 'Expires' tag.
     *
     * @returns Parsed value of 'Expires' header tag.
     */
    private static parseExpiresStr(str: string): number {
        const regexp = /(\d+)\s+(day|hour)/;

        const parseRes = str.match(regexp);

        if (!parseRes) {
            const parsed = Number.parseInt(str, 10);
            return Number.isNaN(parsed) ? 0 : parsed;
        }

        const [, num, period] = parseRes;

        let multiplier = 1;
        switch (period) {
            case 'day': {
                multiplier = 24 * 60 * 60;
                break;
            }
            case 'hour': {
                multiplier = 60 * 60;
                break;
            }
            default: {
                break;
            }
        }

        return Number(num) * multiplier;
    }
}
