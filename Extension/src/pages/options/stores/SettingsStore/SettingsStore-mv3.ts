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
    action,
    computed,
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
import { ExtensionUpdateFSMState } from '../../../../common/constants';
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
     * Current rule limits and counters for DNR.
     */
    @observable
    rulesLimits: IRulesLimits = DEFAULT_RULES_LIMITS;

    /**
     * Current state of the extension update FSM.
     *
     * All UI flags are derived from this single source of truth.
     */
    @observable
    extensionUpdateState: ExtensionUpdateFSMState = ExtensionUpdateFSMState.Idle;

    /**
     * Whether an extension update is available for installation.
     * Derived from the FSM state.
     */
    @computed
    get isExtensionUpdateAvailable(): boolean {
        return this.extensionUpdateState === ExtensionUpdateFSMState.Available;
    }

    /**
     * Whether the extension is currently checking for updates or installing one.
     * Derived from the FSM state.
     */
    @computed
    get isExtensionCheckingUpdateOrUpdating(): boolean {
        return this.extensionUpdateState === ExtensionUpdateFSMState.Checking
            || this.extensionUpdateState === ExtensionUpdateFSMState.Updating;
    }

    /**
     * Timestamp of the last extension update check.
     * Updated on each manual "Check for updates" action.
     */
    @observable
    lastCheckedTimeMs = 0;

    constructor(rootStore: RootStore) {
        super(rootStore);

        this.checkUpdates = this.checkUpdates.bind(this);
        makeObservable(this);
    }

    /**
     * Requests options data and applies runtime info.
     *
     * @param firstRender Whether this is the first render of the options page.
     */
    @override
    override async requestOptionsData(firstRender?: boolean): Promise<GetOptionsDataResponse | null> {
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
            extensionUpdateState,
            isExtensionReloadedOnUpdate,
            isSuccessfulExtensionUpdate,
            lastCheckTimeMs,
        } = runtimeInfo;

        const previousState = this.extensionUpdateState;
        this.extensionUpdateState = extensionUpdateState;

        this.lastCheckedTimeMs = lastCheckTimeMs ?? this.lastCheckedTimeMs;

        // Show notification for terminal states from non-post-reload data fetches
        // (e.g., when requestOptionsData is called during an update check flow).
        // Post-reload notifications are handled separately below.
        if (!isExtensionReloadedOnUpdate && extensionUpdateState !== previousState) {
            switch (extensionUpdateState) {
                case ExtensionUpdateFSMState.NotAvailable:
                    this.uiStore.addNotification({
                        type: NotificationType.Success,
                        text: translator.getMessage('update_not_needed'),
                    });
                    break;
                case ExtensionUpdateFSMState.Failed:
                    this.uiStore.addNotification({
                        type: NotificationType.Error,
                        text: translator.getMessage('update_failed_text'),
                        buttons: [{
                            title: translator.getMessage('update_failed_try_again_btn'),
                            onClick: this.checkUpdates,
                        }],
                    });
                    break;
                case ExtensionUpdateFSMState.Success:
                    this.uiStore.addNotification({
                        type: NotificationType.Success,
                        text: translator.getMessage('update_success_text'),
                    });
                    break;
                default:
                    break;
            }
        }

        // Show post-reload notification. The FSM event may have been dispatched
        // and completed before the options page was opened, so we use the
        // reload metadata's success flag rather than the current FSM state
        // (which may have already transitioned back to Idle).
        if (isExtensionReloadedOnUpdate) {
            const notification = isSuccessfulExtensionUpdate
                ? {
                    type: NotificationType.Success,
                    text: translator.getMessage('update_success_text'),
                }
                : {
                    type: NotificationType.Error,
                    text: translator.getMessage('update_failed_text'),
                    buttons: [{
                        title: translator.getMessage(
                            'update_failed_try_again_btn',
                        ),
                        onClick: this.checkUpdates,
                    }],
                };

            this.uiStore.addNotification(notification);
        }
    }

    /**
     * Handles extension update state changes from FSM events.
     * Called by the event listener when the FSM transitions to a new state.
     *
     * Shows appropriate notifications for terminal states (NotAvailable, Failed, Success).
     *
     * @param state New FSM state value.
     */
    @action
    handleExtensionUpdateStateChange(state: ExtensionUpdateFSMState): void {
        this.extensionUpdateState = state;

        switch (state) {
            case ExtensionUpdateFSMState.NotAvailable:
                this.uiStore.addNotification({
                    type: NotificationType.Success,
                    text: translator.getMessage('update_not_needed'),
                });
                break;
            case ExtensionUpdateFSMState.Failed:
                this.uiStore.addNotification({
                    type: NotificationType.Error,
                    text: translator.getMessage('update_failed_text'),
                    buttons: [{
                        title: translator.getMessage('update_failed_try_again_btn'),
                        onClick: this.checkUpdates,
                    }],
                });
                break;
            case ExtensionUpdateFSMState.Success:
                this.uiStore.addNotification({
                    type: NotificationType.Success,
                    text: translator.getMessage('update_success_text'),
                });
                break;
            default:
                break;
        }
    }

    /**
     * Updates filters group state and refreshes rules limits counters.
     *
     * @param groupId Target group id.
     * @param enabled Desired enabled state.
     */
    @override
    override async updateGroupSetting(groupId: number, enabled: boolean): Promise<void> {
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

    /**
     * Checks for updates of the extension (always)
     * and custom filters (optionally).
     *
     * Important: if there is no extension update found,
     * custom filters are updated.
     *
     * Note: if extension update is found,
     * custom filters will be updated after the extension reload.
     */
    async checkUpdates() {
        let lastCheckTimeMs: number | null = null;
        try {
            ({ lastCheckTimeMs } = await messenger.checkUpdates());
        } catch (error) {
            logger.debug('[ext.SettingsStore.checkUpdates]: failed to check updates on options page: ', error);
        }

        // Only update local state with the timestamp confirmed and persisted by the background.
        // If persistence failed (null) or an extension update was found, do not mutate local state
        // to avoid showing a stale time that will disappear after a page reload.
        if (lastCheckTimeMs !== null) {
            runInAction(() => {
                this.lastCheckedTimeMs = lastCheckTimeMs;
            });
        }
    }

    /**
     * Triggers extension update.
     */
    // eslint-disable-next-line class-methods-use-this
    async updateExtensionMV3() {
        try {
            await messenger.updateExtension({
                from: ForwardFrom.Options,
            });
        } catch (error) {
            logger.debug('[ext.SettingsStore.updateExtensionMV3]: failed to update extension on options page: ', error);
        }
    }

    /**
     * @inheritdoc
     */
    @action
    async updateFilterSetting(filterId: number, enabled: boolean): Promise<void> {
        const updateResult = await this.updateFilterSettingCore(filterId, enabled);

        // Do not update filter state for mv3 optimistically
        if (updateResult) {
            this.setFilterEnabledState(filterId, enabled);
        }
    }

    /**
     * Returns the last time the user checked for updates.
     * Compares the common getter (based on filter timestamps, used in MV2)
     * with the persisted last check time from the backend, and returns the latest.
     *
     * @returns The latest check timestamp.
     */
    @override
    override get latestCheckTimeMs() {
        return Math.max(super.latestCheckTimeMs, this.lastCheckedTimeMs);
    }

    /**
     * Checks MV3 rule limitations and updates UI warnings.
     */
    @override
    override async checkLimitations(): Promise<void> {
        const currentLimitsMv3 = await messenger.getCurrentLimits();

        this.uiStore.setStaticFiltersLimitsWarning(currentLimitsMv3.staticFiltersData);
        this.uiStore.setDynamicRulesLimitsWarning(currentLimitsMv3.dynamicRulesData);

        if (this.uiStore.dynamicRulesLimitsWarning) {
            this.uiStore.addRuleLimitsNotification(this.uiStore.dynamicRulesLimitsWarning);
        }
    }
}
