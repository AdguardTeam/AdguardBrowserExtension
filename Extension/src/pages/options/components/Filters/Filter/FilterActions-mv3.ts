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

import { useContext } from 'react';

import { rootStore } from '../../../stores/RootStore';
import { messenger } from '../../../../services/messenger';
import { CustomFilterUtils } from '../../../../../common/custom-filter-utils';
import { getStaticWarningMessage } from '../../../../common/utils/rules-limits-messages';
import { type CategoriesFilterData } from '../../../../../background/api/filters/categories';

/**
 * Hook that provides MV3-specific filter actions and display settings for the
 * {@link Filter} component.
 *
 * @param filter Filter data used to compute the display timestamp.
 * @param groupEnabled Whether the parent group is enabled. Used to decide
 * whether to check static filter limits before enabling a filter.
 *
 * @returns Filter actions and display settings.
 */
export const useFilterActions = (filter: CategoriesFilterData, groupEnabled: boolean) => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const updateFilterSetting = async (filterId: number, enabled: boolean): Promise<void> => {
        if (CustomFilterUtils.isCustomFilter(filterId)) {
            // For custom filters, limits can only be checked after applying.
            await settingsStore.updateFilterSetting(filterId, enabled);
            await settingsStore.checkLimitations();
            return;
        }

        // Check limits before enabling a static filter.
        if (enabled && groupEnabled) {
            const result = await messenger.canEnableStaticFilter(filterId);
            if (!result.ok && result.data) {
                settingsStore.setFilterEnabledState(filterId, !enabled);

                const staticFiltersLimitsWarning = getStaticWarningMessage(result.data);
                if (staticFiltersLimitsWarning) {
                    uiStore.addRuleLimitsNotification(staticFiltersLimitsWarning);
                }

                // We don't enable the filter if it exceeds the limit.
                // [revert-checkbox] is used to revert the checkbox state.
                throw new Error('Filter will exceed the limit. [revert-checkbox]');
            }
        }

        await settingsStore.updateFilterSetting(filterId, enabled);
    };

    return {
        updateFilterSetting,
        optimistic: false,
        getDisplayTimestamp: (): number => filter.lastUpdateTime || 0,
        checkLimitations: async (): Promise<void> => {
            await settingsStore.checkLimitations();
        },
    };
};
