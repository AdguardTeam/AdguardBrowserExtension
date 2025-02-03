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

import { convertFilters } from '@adguard/tsurlfilter/cli';

import { WEB_ACCESSIBLE_RESOURCES_OUTPUT_REDIRECTS } from '../../constants';
import {
    FILTERS_DEST,
    DECLARATIVE_FILTERS_DEST,
    AssetsFiltersBrowser,
} from '../constants';

const convert = async (browser: string) => {
    const filtersDir = FILTERS_DEST.replace('%browser', browser);
    const declarativeFiltersDir = `${DECLARATIVE_FILTERS_DEST.replace('%browser', browser)}`;
    await convertFilters(
        filtersDir,
        `/${WEB_ACCESSIBLE_RESOURCES_OUTPUT_REDIRECTS}`,
        declarativeFiltersDir,
        {
            debug: true,
            prettifyJson: false,
        },
    );
};

export const convertFiltersToRulesets = async () => {
    await convert(AssetsFiltersBrowser.ChromiumMv3);
};
