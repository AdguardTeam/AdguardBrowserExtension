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

import { FilterUpdateApi } from 'filters-update-api';

import {
    autoDisableFiltersStorage,
    filterStateStorage,
    metadataStorage,
} from '../../../storages';
import { logger } from '../../../../common/logger';
import { getZodErrorMessage } from '../../../../common/error';

import { FiltersApiCommon } from './main-common';

/**
 * API for managing filters data. This class is a facade for working with
 * filters, for example, its methods are called by the handlers of user actions:
 * enabling or disabling a filter or filter group, updating, etc. It depends on
 * CommonFilterApi and CustomFilterApi.
 */
export class FiltersApi extends FiltersApiCommon {
    /**
     * Enables filters and updates the unused-filter tracking of language filters.
     *
     * Language filters which were disabled get a fresh allowance from the current active day.
     * The allowance is recorded only after the first active day: on day zero the default
     * baseline already gives the full allowance. Enabled filters are also removed
     * from the pending notification about automatically disabled filters.
     * A failure to read the tracking state does not block enabling.
     *
     * @param filterIds Loaded filter IDs.
     *
     * @returns Promise resolved after filters are enabled.
     */
    public static override async enableFilters(filterIds: number[]): Promise<void> {
        const languageFilterIds = filterIds.filter((id) => (metadataStorage.getFilter(id)?.languages.length ?? 0) > 0);

        if (languageFilterIds.length > 0) {
            try {
                await autoDisableFiltersStorage.update((state) => {
                    const enabledIds = new Set(languageFilterIds);
                    const newlyEnabledIds = languageFilterIds.filter((id) => !filterStateStorage.get(id)?.enabled);
                    const pendingNotificationFilterIds = state.pendingNotificationFilterIds
                        .filter((id) => !enabledIds.has(id));
                    const shouldRecordAllowance = newlyEnabledIds.length > 0 && state.activeDayCounter > 0;

                    if (!shouldRecordAllowance
                        && pendingNotificationFilterIds.length === state.pendingNotificationFilterIds.length) {
                        return state;
                    }

                    const enabledAtActiveDayByFilter = { ...state.enabledAtActiveDayByFilter };
                    if (shouldRecordAllowance) {
                        newlyEnabledIds.forEach((id) => {
                            enabledAtActiveDayByFilter[id] = state.activeDayCounter;
                        });
                    }

                    return { ...state, enabledAtActiveDayByFilter, pendingNotificationFilterIds };
                });
            } catch (e) {
                logger.error('[ext.FiltersApi.enableFilters]: cannot update unused-filter tracking:', getZodErrorMessage(e));
            }
        }

        await super.enableFilters(filterIds);
    }

    /**
     * @inheritdoc
     */
    protected static override async afterLoadAndEnable(
        loadedFilters: number[],
        alreadyLoadedFilterIds: number[],
        remote: boolean,
        enableGroups: boolean,
    ): Promise<void> {
        if (!remote) {
            await FilterUpdateApi.checkForFiltersUpdates(loadedFilters);
        } else if (alreadyLoadedFilterIds.length > 0) {
            await FilterUpdateApi.checkForFiltersUpdates(alreadyLoadedFilterIds);
        }

        if (enableGroups) {
            FiltersApiCommon.enableGroupsWereNotTouched(loadedFilters);
        }
    }
}
