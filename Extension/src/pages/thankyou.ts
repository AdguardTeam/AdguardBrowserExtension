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

import { UserAgent } from '../common/user-agent';
import { type PageInitAppData } from '../background/services';
import { AntiBannerFiltersId } from '../common/constants';

import { messenger } from './services/messenger';

const PageController = (response: PageInitAppData) => {
    const {
        userSettings,
        enabledFilters,
    } = response;

    let safebrowsingEnabledCheckbox: HTMLElement | null = null;
    let trackingFilterEnabledCheckbox: HTMLElement | null = null;
    let socialFilterEnabledCheckbox: HTMLElement | null = null;
    let sendStatsCheckbox: HTMLElement | null = null;
    let allowAcceptableAdsCheckbox: HTMLElement | null = null;
    let allowAnonymizedUsageDataCheckbox: HTMLElement | null = null;

    const safebrowsingEnabledChange = (e: Event) => {
        const checkbox = e.currentTarget as HTMLInputElement;
        messenger.changeUserSetting(
            userSettings.names.DisableSafebrowsing,
            !checkbox.checked,
        );
    };

    const trackingFilterEnabledChange = (e: Event) => {
        const checkbox = e.currentTarget as HTMLInputElement;
        if (checkbox.checked) {
            messenger.enableFilter(AntiBannerFiltersId.TrackingFilterId);
        } else {
            messenger.disableFilter(AntiBannerFiltersId.TrackingFilterId);
        }
    };

    const socialFilterEnabledChange = (e: Event) => {
        const checkbox = e.currentTarget as HTMLInputElement;
        if (checkbox.checked) {
            messenger.enableFilter(AntiBannerFiltersId.SocialFilterId);
        } else {
            messenger.disableFilter(AntiBannerFiltersId.SocialFilterId);
        }
    };

    const sendStatsCheckboxChange = (e: Event) => {
        const checkbox = e.currentTarget as HTMLInputElement;
        messenger.changeUserSetting(
            userSettings.names.DisableCollectHits,
            !checkbox.checked,
        );
    };

    const allowAcceptableAdsChange = (e: Event) => {
        const checkbox = e.currentTarget as HTMLInputElement;
        if (checkbox.checked) {
            messenger.enableFilter(AntiBannerFiltersId.SearchAndSelfPromoFilterId);
        } else {
            messenger.disableFilter(AntiBannerFiltersId.SearchAndSelfPromoFilterId);
        }
    };

    const allowAnonymizedUsageDataChange = (e: Event) => {
        const checkbox = e.currentTarget as HTMLInputElement;
        messenger.changeUserSetting(
            userSettings.names.AllowAnonymizedUsageData,
            checkbox.checked,
        );
    };

    const bindEvents = () => {
        safebrowsingEnabledCheckbox = document.getElementById('safebrowsingEnabledCheckbox');
        trackingFilterEnabledCheckbox = document.getElementById('trackingFilterEnabledCheckbox');
        socialFilterEnabledCheckbox = document.getElementById('socialFilterEnabledCheckbox');
        // sendSafebrowsingStatsCheckbox - id saved, because it should be changed on thankyou page
        sendStatsCheckbox = document.getElementById('sendSafebrowsingStatsCheckbox');
        allowAcceptableAdsCheckbox = document.getElementById('allowAcceptableAds');
        allowAnonymizedUsageDataCheckbox = document.getElementById('sendAnonymizedData');

        safebrowsingEnabledCheckbox?.addEventListener('change', safebrowsingEnabledChange);
        trackingFilterEnabledCheckbox?.addEventListener('change', trackingFilterEnabledChange);
        socialFilterEnabledCheckbox?.addEventListener('change', socialFilterEnabledChange);
        if (!UserAgent.isFirefox) {
            // ignore Firefox, see task AG-2322
            sendStatsCheckbox?.addEventListener('change', sendStatsCheckboxChange);
            // ignore Firefox, see task ADG-11023
            allowAnonymizedUsageDataCheckbox?.addEventListener('change', allowAnonymizedUsageDataChange);
        }
        allowAcceptableAdsCheckbox?.addEventListener('change', allowAcceptableAdsChange);

        const openExtensionStoreBtns: HTMLElement[] = [].slice.call(document.querySelectorAll('.openExtensionStore'));
        openExtensionStoreBtns.forEach((openExtensionStoreBtn) => {
            openExtensionStoreBtn.addEventListener('click', (e: Event) => {
                e.preventDefault();
                messenger.openExtensionStore();
            });
        });

        const openSettingsBtns: HTMLElement[] = [].slice.call(document.querySelectorAll('.openSettings'));
        openSettingsBtns.forEach((openSettingsBtn) => {
            openSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                messenger.openSettingsTab();
            });
        });
    };

    const updateCheckbox = (checkbox: HTMLElement | null, enabled: boolean) => {
        if (!checkbox) {
            return;
        }
        if (enabled) {
            checkbox.setAttribute('checked', 'checked');
        } else {
            checkbox.removeAttribute('checked');
        }
    };

    const render = () => {
        const trackingFilterEnabled = AntiBannerFiltersId.TrackingFilterId in enabledFilters;
        const socialFilterEnabled = AntiBannerFiltersId.SocialFilterId in enabledFilters;
        const allowAcceptableAdsEnabled = AntiBannerFiltersId.SearchAndSelfPromoFilterId in enabledFilters;
        const collectHitsCount = !userSettings.values[userSettings.names.DisableCollectHits];
        const allowAnonymizedUsageData = userSettings.values[userSettings.names.AllowAnonymizedUsageData];

        if (!__IS_MV3__) {
            const safebrowsingEnabled = !userSettings.values[userSettings.names.DisableSafebrowsing];
            updateCheckbox(safebrowsingEnabledCheckbox, safebrowsingEnabled);
        }

        updateCheckbox(trackingFilterEnabledCheckbox, trackingFilterEnabled);
        updateCheckbox(socialFilterEnabledCheckbox, socialFilterEnabled);
        updateCheckbox(allowAcceptableAdsCheckbox, allowAcceptableAdsEnabled);
        updateCheckbox(sendStatsCheckbox, collectHitsCount);
        updateCheckbox(allowAnonymizedUsageDataCheckbox, allowAnonymizedUsageData);
    };

    const init = () => {
        bindEvents();
        render();
    };

    return {
        init,
    };
};

let timeoutId: number;
let counter = 0;
const MAX_WAIT_RETRY = 10;
const RETRY_TIMEOUT_MS = 100;
const init = async () => {
    if (typeof messenger === 'undefined') {
        if (counter > MAX_WAIT_RETRY) {
            window.clearTimeout(timeoutId);
            return;
        }
        timeoutId = window.setTimeout(init, RETRY_TIMEOUT_MS);
        counter += 1;
        return;
    }

    window.clearTimeout(timeoutId);

    const response = await messenger.initializeFrameScript();
    const controller = PageController(response);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            controller.init();
        });
    } else {
        controller.init();
    }
};

export const thankyou = {
    init,
};
