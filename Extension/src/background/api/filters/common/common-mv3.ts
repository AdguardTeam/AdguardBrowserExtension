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
import { type FilterUpdateOptions } from '../update';
import { type RegularFilterMetadata } from '../../../schema';

import { CommonFilterApiCommon } from './common-common';

/**
 * Extends {@link CommonFilterApiCommon}.
 */
export class CommonFilterApi extends CommonFilterApiCommon {
    /**
     * @inheritdoc
     */
    public static override async loadFilterRulesFromBackend(
        filterUpdateOptions: FilterUpdateOptions,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        forceRemote: boolean,
    ): Promise<RegularFilterMetadata> {
        return CommonFilterApiCommon.loadFilterRulesFromBackend(filterUpdateOptions, false);
    }

    /**
     * Checks whether the filter is supported (exists in filters metadata).
     *
     * @param filterId Filter id.
     *
     * @returns True if filter is supported, false otherwise.
     */
    public static isFilterSupported(filterId: number): boolean {
        const supportedFilterIds = CommonFilterApiCommon.getFiltersMetadata().map((filter) => filter.filterId);

        return supportedFilterIds.includes(filterId);
    }
}
