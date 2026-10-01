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

import {
    Filter,
    FilterConverter,
    isSafeRule,
} from '@adguard/dnr-converter';

/**
 * Path to redirect resources used by the extension build.
 */
const REDIRECT_RESOURCES_PATH = '/web-accessible-resources/redirects';

/**
 * Converts filter text to the content of a single-filter ruleset file:
 * conversion with a source map, then all unsafe rules moved into the metadata.
 * Unlike the rulesets build, it applies no `$badfilter` rules from other
 * filters and no session-rule budget.
 *
 * @param filterId Filter id.
 * @param filterText Filter list text.
 *
 * @returns Content of `ruleset_<filterId>.json`.
 *
 * @throws Error if the conversion reports errors or limitations, i.e. some
 * rules were not converted.
 */
export const buildRulesetFile = async (filterId: number, filterText: string): Promise<string> => {
    const [conversionResult] = await new FilterConverter().convert(
        [new Filter(filterId, filterText)],
        { resourcesPath: REDIRECT_RESOURCES_PATH, withSourceMap: true },
    );
    // One filter in, one conversion result out.
    const { ruleset, errors, limitations } = conversionResult!;
    if (errors.length > 0 || limitations.length > 0) {
        throw new Error(
            `Ruleset conversion is incomplete: ${errors.length} error(s), ${limitations.length} limitation(s)`,
        );
    }
    const unsafeRules = (await ruleset.getDeclarativeRules()).filter((rule) => !isSafeRule(rule));

    return ruleset.serializeCompact(unsafeRules, false);
};
