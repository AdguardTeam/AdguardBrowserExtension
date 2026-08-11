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
import { type CategoriesFilterData } from '../../../../../background/api/filters/categories';

/**
 * Hook that provides MV2-specific filter actions and display settings for the
 * {@link Filter} component.
 *
 * @param filter Filter data used to compute the display timestamp.
 * @param _groupEnabled Whether the parent group is enabled (unused in MV2).
 *
 * @returns Filter actions and display settings.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useFilterActions = (filter: CategoriesFilterData, _groupEnabled: boolean) => {
    const { settingsStore } = useContext(rootStore);

    const getDisplayTimestamp = (): number => Math.max(
        filter.lastUpdateTime || 0,
        filter.lastCheckTime || 0,
        filter.lastScheduledCheckTime || 0,
    );

    return {
        updateFilterSetting: settingsStore.updateFilterSetting,
        optimistic: true,
        getDisplayTimestamp,
        checkLimitations: async (): Promise<void> => {},
    };
};
