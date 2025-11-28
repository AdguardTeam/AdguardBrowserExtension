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

import {
    action,
    computed,
    makeObservable,
    observable,
    override,
} from 'mobx';
import { type GetOptionsDataResponse } from 'settings-types';

import { messenger } from '../../../services/messenger';
import { MIN_UPDATE_DISPLAY_DURATION_MS } from '../../../../common/constants';
import { type RootStore } from '../RootStore';

import { SettingsStoreCommon } from './SettingsStore-common';

export class SettingsStore extends SettingsStoreCommon {
    /**
     * Whether filters are currently being updated.
     * Used to show loading state during filter updates.
     */
    @observable
    filtersUpdating = false;

    /**
     * Total count of active filtering rules.
     * Updated after each options data request.
     */
    @observable
    rulesCount = 0;

    constructor(rootStore: RootStore) {
        super(rootStore);

        makeObservable(this);
    }

    /**
     * @inheritdoc
     */
    @override
    protected applyOptionsData(data: GetOptionsDataResponse, firstRender?: boolean): void {
        super.applyOptionsData(data, firstRender);
        this.rulesCount = data.filtersInfo.rulesCount;
    }

    /**
     * Triggers filters update and refreshes local filters metadata.
     */
    @action
    async updateFiltersMV2() {
        this.setFiltersUpdating(true);
        try {
            const filtersUpdates = await messenger.updateFiltersMV2();
            this.refreshFilters(filtersUpdates);
            setTimeout(() => {
                this.setFiltersUpdating(false);
            }, MIN_UPDATE_DISPLAY_DURATION_MS);
            return filtersUpdates;
        } catch (error) {
            this.setFiltersUpdating(false);
            throw error;
        }
    }

    /**
     * @inheritdoc
     */
    @action
    async updateFilterSetting(filterId: number, enabled: boolean): Promise<void> {
        this.setFilterEnabledState(filterId, enabled);

        await this.updateFilterSettingCore(filterId, enabled);
    }

    /**
     * Used to display the last check time under all rules count.
     *
     * @returns {number} the latest check time of all filters.
     */
    @computed
    get latestCheckTime() {
        return Math.max(...this.filters
            .map(({ lastScheduledCheckTime, lastCheckTime }) => Math.max(
                lastScheduledCheckTime || 0,
                lastCheckTime || 0,
            )));
    }

    @action
    setFiltersUpdating(value: boolean): void {
        this.filtersUpdating = value;
    }
}
