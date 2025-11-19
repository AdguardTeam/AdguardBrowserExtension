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

import { createContext } from 'react';

import browser from 'webextension-polyfill';
import {
    action,
    computed,
    configure,
    makeObservable,
    observable,
    runInAction,
} from 'mobx';
import punycode from 'punycode/';

import { type GetStatisticsDataResponse, type SettingsData } from '../../../background/api';
import { type GetTabInfoForPopupResponse } from '../../../background/services';
import { type PageStatsDataItem } from '../../../background/schema';
import { messenger } from '../../services/messenger';
import {
    SpecificPopupState,
    TimeRange,
    ViewState,
} from '../constants';
import { translator } from '../../../common/translators/translator';
import { type PromoNotification } from '../../../background/storages';
import {
    type AppState,
    appStateActor,
    AppStateEvent,
} from '../state-machines/app-state-machine';
import { asyncWrapper } from '../../filtering-log/stores/helpers';
import { MIN_UPDATE_DISPLAY_DURATION_MS, TOTAL_BLOCKED_STATS_GROUP_ID } from '../../../common/constants';
import { UserAgent } from '../../../common/user-agent';
import { logger } from '../../../common/logger';
import { sleepIfNecessary } from '../../../common/sleep-utils';
import { NotificationType, type NotificationParams } from '../../common/types';

type BlockedStatsInfo = {
    tabId: number;
    totalBlocked: number;
    totalBlockedTab: number;
};

type CategoryBlockedStatsInfo = {
    blocked: number;
    categoryId: string;
    categoryName: string;
};

// Do not allow property change outside of store actions
configure({ enforceActions: 'observed' });

export class PopupStore {
    TOTAL_BLOCKED_GROUP_ID = TOTAL_BLOCKED_STATS_GROUP_ID;

    /**
     * Flag that indicates whether the application filtering is **paused**.
     */
    @observable
    applicationFilteringPaused: boolean | null = null;

    /**
     * Flag that indicates whether the filtering is possible or not (e.g. secure pages).
     */
    @observable
    isFilteringPossible = true;

    /**
     * Flag that indicates whether the application is initialized.
     */
    @observable
    isAppInitialized: boolean = false;

    /**
     * Flag that indicates whether the filtering on a website is disabled
     * by a document exception rule — `@@||example.com^$document` in some filter, **not user rules**,
     * so it cannot be undone by the user.
     */
    @observable
    canAddRemoveRule = true;

    @observable
    url: string | null = null;

    @observable
    viewState = ViewState.Actions;

    @observable
    totalBlocked = 0;

    @observable
    totalBlockedTab = 0;

    @observable
    documentAllowlisted: boolean | null = null;

    @observable
    userAllowlisted: boolean | null = null;

    @observable
    showInfoAboutFullVersion = true;

    @observable
    isEdgeBrowser = false;

    @observable
    isAndroidBrowser = false;

    @observable
    stats: GetStatisticsDataResponse | null = null;

    @observable
    selectedTimeRange = TimeRange.Week;

    @observable
    selectedBlockedType = this.TOTAL_BLOCKED_GROUP_ID;

    @observable
    promoNotification: PromoNotification | null = null;

    @observable
    hasUserRulesToReset = false;

    @observable
    settings: SettingsData | null = null;

    @observable
    areFilterLimitsExceeded = false;

    currentTabId?: number | null = null;

    domainName: string | null = null;

    @observable
    appState: AppState = appStateActor.getSnapshot().value;

    @observable
    isExtensionUpdateAvailable = false;

    /**
     * Whether the extension update is checking or is updating now.
     */
    @observable
    isExtensionCheckingUpdateOrUpdating = false;

    @observable
    updateNotification: NotificationParams | null = null;

    constructor() {
        makeObservable(this);
        this.checkUpdatesMV3 = this.checkUpdatesMV3.bind(this);

        appStateActor.subscribe((state) => {
            runInAction(() => {
                this.appState = state.value;
            });
        });
    }

    /**
     * Fetches the application initialized state from the background.
     */
    fetchIsAppInitialized = async () => {
        const res = await messenger.getIsAppInitialized();

        this.setIsAppInitialized(res);
    };

    /**
     * Sets the application initialized flag.
     *
     * @param value Whether the application is initialized.
     */
    @action
    setIsAppInitialized = (value: boolean) => {
        this.isAppInitialized = value;
    };

    /**
     * Sets the initial state of the app state machine actor based on the current popup data.
     */
    setAppActorInitState = () => {
        if (this.applicationFilteringPaused) {
            appStateActor.send({ type: AppStateEvent.Pause });
        } else if (this.documentAllowlisted) {
            appStateActor.send({ type: AppStateEvent.Disable });
        } else {
            appStateActor.send({ type: AppStateEvent.Enable });
        }
    };

    @action
    getPopupData = async (): Promise<GetTabInfoForPopupResponse | undefined> => {
        /**
         * Get android data first because our styles depends on it,
         * and UI might shift because it was loaded too late.
         */
        const isAndroidBrowser = await UserAgent.getIsAndroid();

        runInAction(() => {
            this.isAndroidBrowser = isAndroidBrowser;
        });

        // get current tab id
        const tabs = await browser.tabs.query({
            active: true,
            currentWindow: true,
        });
        const currentTab = tabs?.[0];

        if (!currentTab?.id) {
            return;
        }

        const response = await messenger.getTabInfoForPopup(currentTab.id);

        if (!response) {
            return;
        }

        runInAction(() => {
            const {
                frameInfo,
                options,
                stats,
                settings,
                mv3SpecificOptions,
            } = response;

            // frame info
            this.applicationFilteringPaused = frameInfo.applicationFilteringDisabled;
            this.isFilteringPossible = frameInfo.isFilteringPossible;
            this.url = frameInfo.url;
            this.totalBlocked = frameInfo.totalBlocked;
            this.totalBlockedTab = frameInfo.totalBlockedTab;
            this.domainName = frameInfo.domainName;
            this.documentAllowlisted = frameInfo.documentAllowlisted;
            this.userAllowlisted = frameInfo.userAllowlisted;
            this.canAddRemoveRule = frameInfo.canAddRemoveRule;

            // options
            this.showInfoAboutFullVersion = options.showInfoAboutFullVersion;
            this.isEdgeBrowser = options.isEdgeBrowser;
            this.promoNotification = options.notification;
            this.hasUserRulesToReset = options.hasUserRulesToReset;

            // stats
            this.stats = stats;

            // settings
            this.settings = settings;

            this.currentTabId = currentTab.id;

            this.setAppActorInitState();

            // Handle MV3-specific options
            if (!mv3SpecificOptions) {
                // Early exit for MV2 or when mv3SpecificOptions is absent
                this.areFilterLimitsExceeded = false;
                this.setIsExtensionUpdateAvailable(false);
                return;
            }

            const {
                areFilterLimitsExceeded,
                isExtensionUpdateAvailable,
                isExtensionReloadedOnUpdate,
                isSuccessfulExtensionUpdate,
            } = mv3SpecificOptions;

            this.areFilterLimitsExceeded = areFilterLimitsExceeded;
            this.setIsExtensionUpdateAvailable(isExtensionUpdateAvailable);

            // notification about successful or failed update should be shown after the popup is opened.
            // and it cannot be done by notifier (from the background page)
            // because event may be dispatched _before_ the popup is opened,
            // i.e. listener may not be registered yet.
            if (!isExtensionReloadedOnUpdate) {
                return;
            }

            if (isSuccessfulExtensionUpdate) {
                this.setUpdateNotification({
                    type: NotificationType.Success,
                    text: translator.getMessage('update_success_text'),
                });
            } else {
                this.setUpdateNotification({
                    type: NotificationType.Error,
                    text: translator.getMessage('update_failed_text'),
                    button: {
                        title: translator.getMessage('update_failed_try_again_btn'),
                        onClick: this.checkUpdatesMV3,
                    },
                });
            }
        });
    };

    /**
     * Sends a message to the background to set the application filtering paused state to the specified value.
     *
     * @param state Whether the application filtering is paused or not.
     */
    @action
    changeApplicationFilteringPaused = async (state: boolean) => {
        await messenger.changeApplicationFilteringPaused(state);

        runInAction(() => {
            this.applicationFilteringPaused = state;
        });
    };

    /**
     * Pauses the application filtering.
     */
    pauseApplicationFiltering = async () => {
        appStateActor.send({
            type: AppStateEvent.Pause,
        });

        await this.changeApplicationFilteringPaused(true);

        appStateActor.send({
            type: AppStateEvent.PauseSuccess,
        });
    };

    /**
     * Resumes the application filtering.
     */
    resumeApplicationFiltering = async () => {
        appStateActor.send({
            type: AppStateEvent.Resume,
        });

        await this.changeApplicationFilteringPaused(false);

        // `canAddRemoveRule` is `true` if there is no a global exception for a website
        // and the filtering can be disabled for a website (allowlisted).
        // BUT it also may happen so when a global exception is present for a website,
        // and the filtering is _paused_ (which means mainFrameRule is null) as the same time,
        // so the background will send `canAddRemoveRule` as `true` as well.
        // That's why getting the popup data should be done — we need `canAddRemoveRule` to be re-calculated
        // after the filtering is resumed in the background.
        await this.getPopupData();

        // Due to the updated `canAddRemoveRule` value, if site is in exceptions, consider resuming successful.
        if (!this.canAddRemoveRule) {
            appStateActor.send({
                type: AppStateEvent.ResumeSuccess,
            });
            return;
        }

        // If the site is not in exceptions and can possibly be allowlisted, send the event based on this value.
        appStateActor.send({
            type: this.documentAllowlisted
                ? AppStateEvent.ResumeFail
                : AppStateEvent.ResumeSuccess,
        });
    };

    @action
    setViewState = (state: ViewState) => {
        this.viewState = state;
    };

    /**
     * Returns the current site URL or domain name.
     */
    @computed
    get currentSite(): string | undefined {
        let res;

        if (this.url) {
            res = this.url;
        }

        if (this.isFilteringPossible && this.domainName) {
            res = punycode.toUnicode(this.domainName);
        }

        return res;
    }

    /**
     * Returns a popup main title for enabled state.
     *
     * @returns Enabled popup title.
     */
    get currentEnabledTitle(): string {
        let title = translator.getMessage('popup_tab_blocked_count', {
            num: this.totalBlockedTab.toLocaleString(),
        });

        if (!this.isFilteringPossible) {
            title = translator.getMessage('popup_site_filtering_state_secure_page');
        } else if (!this.canAddRemoveRule) {
            title = translator.getMessage('popup_site_filtering_state_disabled');
        }

        return title;
    }

    /**
     * Returns a popup main title for disabled state.
     *
     * @returns Disabled popup title.
     */
    get currentDisabledTitle(): string {
        let title = translator.getMessage('popup_site_filtering_state_disabled');

        if (!this.isFilteringPossible) {
            title = translator.getMessage('popup_site_filtering_state_secure_page');
        }

        return title;
    }

    @action
    toggleAllowlisted = async () => {
        if (!this.isFilteringPossible || this.applicationFilteringPaused) {
            return;
        }

        if (!this.canAddRemoveRule) {
            return;
        }

        let isAllowlisted = this.documentAllowlisted;

        appStateActor.send({
            type: isAllowlisted
                ? AppStateEvent.Enable
                : AppStateEvent.Disable,
        });

        if (isAllowlisted) {
            await asyncWrapper(messenger.removeAllowlistDomain, this.currentTabId, true);
            isAllowlisted = false;
        } else {
            await asyncWrapper(messenger.addAllowlistDomainForTabId, this.currentTabId);
            isAllowlisted = true;
        }

        runInAction(() => {
            this.documentAllowlisted = isAllowlisted;
            this.userAllowlisted = isAllowlisted;
            this.totalBlockedTab = 0;
        });

        appStateActor.send({
            type: isAllowlisted
                ? AppStateEvent.DisableSuccess
                : AppStateEvent.EnableSuccess,
        });
    };

    /**
     * Returns the specific popup state based on {@link isFilteringPossible} and {@link canAddRemoveRule} values.
     *
     * For other states of the popup, a state machine is used.
     */
    @computed
    get specificPopupState(): SpecificPopupState | null {
        if (!this.isFilteringPossible) {
            return SpecificPopupState.FilteringUnavailable;
        }

        if (!this.canAddRemoveRule) {
            return SpecificPopupState.SiteInException;
        }

        return null;
    }

    static getDataByRange = (stats: GetStatisticsDataResponse, range: string): PageStatsDataItem | undefined => {
        switch (range) {
            case TimeRange.Day:
                if (!stats.lastMonth[stats.lastMonth.length - 1]) {
                    return undefined;
                }
                return stats.lastMonth[stats.lastMonth.length - 1];
            case TimeRange.Week: {
                const result: PageStatsDataItem = {};
                for (let i = 0; i < stats.lastWeek.length; i += 1) {
                    const day = stats.lastWeek[i];
                    if (!day) {
                        continue;
                    }
                    // eslint-disable-next-line no-restricted-syntax
                    for (const type of Object.keys(day)) {
                        if (!type) {
                            continue;
                        }
                        result[type] = (result[type] || 0) + (day[type] || 0);
                    }
                }
                return result;
            }
            case TimeRange.Month:
                return stats.lastYear[stats.lastYear.length - 1];
            case TimeRange.Year: {
                const result: PageStatsDataItem = {};
                for (let i = 0; i < stats.lastYear.length; i += 1) {
                    const month = stats.lastYear[i];
                    if (!month) {
                        continue;
                    }
                    // eslint-disable-next-line no-restricted-syntax
                    for (const type of Object.keys(month)) {
                        result[type] = (result[type] || 0) + (month[type] || 0);
                    }
                }
                return result;
            }
            default:
                throw new Error('There is no such time range type');
        }
    };

    @computed
    get statsDataByType() {
        const { stats } = this;

        if (!stats) {
            return null;
        }

        const statsDataForCurrentRange = PopupStore.getDataByRange(stats, this.selectedTimeRange);

        if (!statsDataForCurrentRange) {
            return null;
        }

        const { blockedCategories } = stats;

        return blockedCategories
            .slice()
            .map((category) => {
                const { categoryId, categoryName } = category;
                const blocked = statsDataForCurrentRange[categoryId];
                return {
                    categoryId,
                    blocked,
                    categoryName,
                };
            })
            .filter((category) => {
                return category.blocked
                    && (category.blocked > 0 || category.categoryId === this.TOTAL_BLOCKED_GROUP_ID);
            }) as CategoryBlockedStatsInfo[];
    }

    @action
    setSelectedBlockedType = (value: string) => {
        this.selectedBlockedType = value;
    };

    @action
    setSelectedTimeRange = (value: TimeRange) => {
        this.selectedTimeRange = value;
    };

    @action
    closePromoNotification = async () => {
        this.promoNotification = null;
        await messenger.setNotificationViewed(false);
    };

    @action
    openPromoNotificationUrl = async () => {
        let url = this.promoNotification?.url;
        if (!url) {
            return;
        }

        url = `${url}&from=popup`;

        runInAction(() => {
            this.promoNotification = null;
        });

        // TODO: This message will mark the notification as viewed,
        // but it seems that we need to show it.
        await messenger.setNotificationViewed(false);
        await browser.tabs.create({ url });
    };

    @action
    updateBlockedStats = (tabInfo: BlockedStatsInfo) => {
        if (this.currentTabId === tabInfo.tabId) {
            this.totalBlockedTab = tabInfo.totalBlockedTab;
            this.totalBlocked = tabInfo.totalBlocked;
        }
    };

    @computed
    get appearanceTheme() {
        if (!this.settings) {
            return null;
        }

        return this.settings.values[this.settings.names.AppearanceTheme];
    }

    /**
     * Checks for updates and if update is available, starts the update process.
     *
     * Note:
     * This behavior is different on options page
     * where two separate clicks are required
     * to check for updates and start the update process.
     */
    @action
    async checkUpdatesMV3() {
        const start = Date.now();

        try {
            this.setUpdateNotification(null);
            await messenger.checkUpdatesMV3();
        } catch (error: unknown) {
            logger.debug('[ext.PopupStore.checkUpdatesMV3]: failed to check updates in popup: ', error);
        }

        // Ensure minimum duration for smooth UI experience
        await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);
    }

    @action
    setIsExtensionUpdateAvailable(isUpdateAvailable: boolean): void {
        this.isExtensionUpdateAvailable = isUpdateAvailable;
    }

    @action
    setIsExtensionCheckingUpdateOrUpdating(value: boolean): void {
        this.isExtensionCheckingUpdateOrUpdating = value;
    }

    @action
    setUpdateNotification(notification: NotificationParams | null): void {
        this.updateNotification = notification;
    }
}

export const popupStore = createContext(new PopupStore());
