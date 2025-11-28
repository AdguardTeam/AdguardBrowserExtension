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
    makeObservable,
    observable,
    runInAction,
    override,
} from 'mobx';
import { type GetOptionsDataResponse } from 'settings-types';

import { NotificationType } from '../../../common/types';
import { translator } from '../../../../common/translators/translator';
import { type RootStore } from '../RootStore';
import { ForwardFrom } from '../../../../common/forward';
import { messenger } from '../../../services/messenger';
import { logger } from '../../../../common/logger';
import { MIN_UPDATE_DISPLAY_DURATION_MS } from '../../../../common/constants';
import { sleepIfNecessary } from '../../../../common/sleep-utils';
import { type IRulesLimits } from '../../../../background/services/rules-limits/interface';

import { SettingsStoreCommon, fetchDataWithRetry } from './SettingsStore-common';

const DEFAULT_RULES_LIMITS: IRulesLimits = {
    dynamicRulesEnabledCount: 0,
    dynamicRulesMaximumCount: 0,
    dynamicRulesUnsafeEnabledCount: 0,
    dynamicRulesUnsafeMaximumCount: 0,
    dynamicRulesRegexpsEnabledCount: 0,
    dynamicRulesRegexpsMaximumCount: 0,
    staticFiltersEnabledCount: 0,
    staticFiltersMaximumCount: 0,
    staticRulesEnabledCount: 0,
    staticRulesMaximumCount: 0,
    staticRulesRegexpsEnabledCount: 0,
    staticRulesRegexpsMaxCount: 0,
    expectedEnabledFilters: [],
    actuallyEnabledFilters: [],
    areFilterLimitsExceeded: false,
};

export class SettingsStore extends SettingsStoreCommon {
    /**
     * Whether the extension update is available after the checking.
     */
    @observable
    isExtensionUpdateAvailable = false;

    @observable
    rulesLimits: IRulesLimits = DEFAULT_RULES_LIMITS;

    /**
     * Whether the extension update is checking or is updating now.
     */
    @observable
    isExtensionCheckingUpdateOrUpdating = false;

    constructor(rootStore: RootStore) {
        super(rootStore);

        this.checkUpdatesMV3 = this.checkUpdatesMV3.bind(this);
        makeObservable(this);
    }

    /**
     * Requests options data and applies runtime info.
     *
     * @param firstRender Whether this is the first render of the options page.
     */
    @override
    async requestOptionsData(firstRender?: boolean): Promise<GetOptionsDataResponse | null> {
        const data = await super.requestOptionsData(firstRender);
        if (!data) {
            return null;
        }

        const { runtimeInfo } = data;
        this.applyRuntimeInfo(runtimeInfo);

        return data;
    }

    /**
     * Applies runtime information related to extension update state.
     *
     * @param runtimeInfo Runtime info from options data response.
     */
    @action
    applyRuntimeInfo(runtimeInfo: GetOptionsDataResponse['runtimeInfo']) {
        const {
            isExtensionUpdateAvailable,
            isExtensionReloadedOnUpdate,
            isSuccessfulExtensionUpdate,
        } = runtimeInfo;

        this.setIsExtensionUpdateAvailable(isExtensionUpdateAvailable);

        // notification about successful or failed update should be shown after the options page is opened.
        // and it cannot be done by notifier (from the background page)
        // because event may be dispatched before the options page is opened,
        // i.e. listener may not be registered yet.
        if (isExtensionReloadedOnUpdate) {
            const notification = isSuccessfulExtensionUpdate
                ? {
                    type: NotificationType.Success,
                    text: translator.getMessage('update_success_text'),
                } : {
                    type: NotificationType.Error,
                    text: translator.getMessage('update_failed_text'),
                    button: {
                        title: translator.getMessage('update_failed_try_again_btn'),
                        onClick: this.checkUpdatesMV3,
                    },
                };

            this.uiStore.addNotification(notification);
        }
    }

    /**
     * Updates filters group state and refreshes rules limits counters.
     *
     * @param groupId Target group id.
     * @param enabled Desired enabled state.
     */
    @override
    async updateGroupSetting(groupId: number, enabled: boolean): Promise<void> {
        await super.updateGroupSetting(groupId, enabled);

        await this.getRulesLimitsCounters();
    }

    /**
     * Loads current rules limits counters from the background.
     */
    @action
    async getRulesLimitsCounters() {
        const rulesLimits = await fetchDataWithRetry(messenger.getRulesLimitsCounters.bind(messenger));

        // Will use default rules limits if the background service is not ready.
        if (!rulesLimits) {
            return;
        }

        runInAction(() => {
            this.rulesLimits = rulesLimits;
        });
    }

    // eslint-disable-next-line class-methods-use-this
    @action
    async checkUpdatesMV3() {
        const start = Date.now();
        try {
            await messenger.checkUpdatesMV3();
        } catch (error) {
            logger.debug('[ext.SettingsStore.checkUpdatesMV3]: failed to check updates on options page: ', error);
        }

        // Ensure minimum duration for smooth UI experience
        await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);
    }

    /**
     * Triggers extension update and waits minimum duration
     * for a smoother UI experience before reload.
     */
    // eslint-disable-next-line class-methods-use-this
    async updateExtensionMV3() {
        const start = Date.now();
        try {
            await messenger.updateExtensionMV3({
                from: ForwardFrom.Options,
            });
        } catch (error) {
            logger.debug('[ext.SettingsStore.updateExtensionMV3]: failed to update extension on options page: ', error);
        }
        // Ensure minimum duration for smooth UI experience before extension reload
        await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);
    }

    /**
     * @inheritdoc
     */
    @action
    async updateFilterSetting(filterId: number, enabled: boolean): Promise<void> {
        const updateResult = await this.updateFilterSettingCore(filterId, enabled);

        if (updateResult) {
            this.setFilterEnabledState(filterId, enabled);
        }
    }

    @action
    setIsExtensionCheckingUpdateOrUpdating(value: boolean): void {
        this.isExtensionCheckingUpdateOrUpdating = value;
    }

    @action
    setIsExtensionUpdateAvailable(isAvailable: boolean): void {
        this.isExtensionUpdateAvailable = isAvailable;
    }
}
