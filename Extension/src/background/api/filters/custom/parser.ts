/**
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
export type CustomFilterParsedData = {
    name: string,
    description: string,
    homepage: string,
    version: string,
    expires: string,
    timeUpdated: string,
};

/**
 * Helper class for parsing custom filter metadata, loaded from remote source.
 */
export class CustomFilterParser {
    /**
     * Amount of lines to parse metadata from filter's header.
     */
    private static AMOUNT_OF_LINES_TO_PARSE = 50;

    /**
     * Parses filter metadata from rules header.
     *
     * @param rules Lines of raw filter data text.
     *
     * @returns Parsed filter data.
     */
    static parseFilterDataFromHeader(rules: string[]): CustomFilterParsedData {
        return {
            name: CustomFilterParser.parseTag('Title', rules),
            description: CustomFilterParser.parseTag('Description', rules),
            homepage: CustomFilterParser.parseTag('Homepage', rules),
            version: CustomFilterParser.parseTag('Version', rules),
            expires: CustomFilterParser.parseTag('Expires', rules),
            timeUpdated: CustomFilterParser.parseTag('TimeUpdated', rules),
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
        const maxLines = Math.min(CustomFilterParser.AMOUNT_OF_LINES_TO_PARSE, rules.length);
        for (let i = 0; i < maxLines; i += 1) {
            const rule = rules[i];

            if (!rule) {
                continue;
            }

            const search = `! ${tagName}: `;
            const indexOfSearch = rule.indexOf(search);

            if (indexOfSearch >= 0) {
                result = rule.substring(indexOfSearch + search.length);
            }
        }

        if (tagName === 'Expires') {
            result = String(CustomFilterParser.parseExpiresStr(result));
        }

        if (tagName === 'TimeUpdated') {
            result = result || new Date().toISOString();
        }

        return result;
    }

    /**
     * Parses string value of 'Expires' header tag.
     *
     * @param str Line of rule text with 'Expires' tag.
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
