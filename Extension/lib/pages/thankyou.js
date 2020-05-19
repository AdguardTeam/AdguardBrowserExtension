/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global contentPage */
const PageController = (response) => {
    const {
        userSettings,
        enabledFilters,
        constants: { AntiBannerFiltersId },
    } = response;

    let safebrowsingEnabledCheckbox;
    let trackingFilterEnabledCheckbox;
    let socialFilterEnabledCheckbox;
    let sendStatsCheckbox;
    let allowAcceptableAdsCheckbox;

    const safebrowsingEnabledChange = (e) => {
        const checkbox = e.currentTarget;
        contentPage.sendMessage({
            type: 'changeUserSetting',
            key: userSettings.names.DISABLE_SAFEBROWSING,
            value: !checkbox.checked,
        });
    };

    const trackingFilterEnabledChange = (e) => {
        const checkbox = e.currentTarget;
        if (checkbox.checked) {
            contentPage.sendMessage({
                type: 'addAndEnableFilter',
                filterId: AntiBannerFiltersId.TRACKING_FILTER_ID,
            });
        } else {
            contentPage.sendMessage({
                type: 'disableAntiBannerFilter',
                filterId: AntiBannerFiltersId.TRACKING_FILTER_ID,
                remove: true,
            });
        }
    };

    const socialFilterEnabledChange = (e) => {
        const checkbox = e.currentTarget;
        if (checkbox.checked) {
            contentPage.sendMessage({
                type: 'addAndEnableFilter',
                filterId: AntiBannerFiltersId.SOCIAL_FILTER_ID,
            });
        } else {
            contentPage.sendMessage({
                type: 'disableAntiBannerFilter',
                filterId: AntiBannerFiltersId.SOCIAL_FILTER_ID,
                remove: true,
            });
        }
    };

    const sendStatsCheckboxChange = (e) => {
        const checkbox = e.currentTarget;
        contentPage.sendMessage({
            type: 'changeUserSetting',
            key: userSettings.names.DISABLE_COLLECT_HITS,
            value: !checkbox.checked,
        });
    };

    const allowAcceptableAdsChange = (e) => {
        const checkbox = e.currentTarget;
        if (checkbox.checked) {
            contentPage.sendMessage({
                type: 'addAndEnableFilter',
                filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID,
            });
        } else {
            contentPage.sendMessage({
                type: 'disableAntiBannerFilter',
                filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID,
                remove: true,
            });
        }
    };

    const bindEvents = () => {
        safebrowsingEnabledCheckbox = document.getElementById('safebrowsingEnabledCheckbox');
        trackingFilterEnabledCheckbox = document.getElementById('trackingFilterEnabledCheckbox');
        socialFilterEnabledCheckbox = document.getElementById('socialFilterEnabledCheckbox');
        // sendSafebrowsingStatsCheckbox - id saved, because it should be changed on thankyou page
        sendStatsCheckbox = document.getElementById('sendSafebrowsingStatsCheckbox');
        allowAcceptableAdsCheckbox = document.getElementById('allowAcceptableAds');

        safebrowsingEnabledCheckbox.addEventListener('change', safebrowsingEnabledChange);
        trackingFilterEnabledCheckbox.addEventListener('change', trackingFilterEnabledChange);
        socialFilterEnabledCheckbox.addEventListener('change', socialFilterEnabledChange);
        // ignore Firefox, see task AG-2322
        if (!navigator.userAgent.includes('Firefox')) {
            sendStatsCheckbox.addEventListener('change', sendStatsCheckboxChange);
        }
        allowAcceptableAdsCheckbox.addEventListener('change', allowAcceptableAdsChange);

        const openExtensionStoreBtns = [].slice.call(document.querySelectorAll('.openExtensionStore'));
        openExtensionStoreBtns.forEach((openExtensionStoreBtn) => {
            openExtensionStoreBtn.addEventListener('click', (e) => {
                e.preventDefault();
                contentPage.sendMessage({ type: 'openExtensionStore' });
            });
        });

        const openSettingsBtns = [].slice.call(document.querySelectorAll('.openSettings'));
        openSettingsBtns.forEach((openSettingsBtn) => {
            openSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                contentPage.sendMessage({ type: 'openSettingsTab' });
            });
        });
    };

    const updateCheckbox = (checkbox, enabled) => {
        if (!checkbox) {
            return;
        }
        if (enabled) {
            checkbox.setAttribute('checked', 'checked');
        } else {
            checkbox.removeAttribute('checked');
        }
    };

    const renderSafebrowsingSection = (safebrowsingEnabled, collectHitStats) => {
        updateCheckbox(safebrowsingEnabledCheckbox, safebrowsingEnabled);
        updateCheckbox(sendStatsCheckbox, collectHitStats);
    };

    const render = () => {
        const safebrowsingEnabled = !userSettings.values[userSettings.names.DISABLE_SAFEBROWSING];
        const collectHitsCount = !userSettings.values[userSettings.names.DISABLE_COLLECT_HITS];
        const trackingFilterEnabled = AntiBannerFiltersId.TRACKING_FILTER_ID in enabledFilters;
        const socialFilterEnabled = AntiBannerFiltersId.SOCIAL_FILTER_ID in enabledFilters;
        const allowAcceptableAdsEnabled = AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID in enabledFilters;

        renderSafebrowsingSection(safebrowsingEnabled, collectHitsCount);
        updateCheckbox(trackingFilterEnabledCheckbox, trackingFilterEnabled);
        updateCheckbox(socialFilterEnabledCheckbox, socialFilterEnabled);
        updateCheckbox(allowAcceptableAdsCheckbox, allowAcceptableAdsEnabled);
    };

    const init = () => {
        bindEvents();
        render();
    };

    return {
        init,
    };
};

let timeoutId;
let counter = 0;
const MAX_WAIT_RETRY = 10;
const RETRY_TIMEOUT_MS = 100;
const waitContentPage = () => {
    if (typeof contentPage === 'undefined') {
        if (counter > MAX_WAIT_RETRY) {
            clearTimeout(timeoutId);
            return;
        }
        timeoutId = setTimeout(waitContentPage, RETRY_TIMEOUT_MS);
        counter += 1;
        return;
    }

    clearTimeout(timeoutId);

    contentPage.sendMessage({ type: 'initializeFrameScript' }, (response) => {
        const controller = PageController(response);
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                controller.init();
            });
        } else {
            controller.init();
        }
    });
};

waitContentPage();
