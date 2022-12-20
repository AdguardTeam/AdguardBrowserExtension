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

import { MessageType } from '../common/messages';
import { UserAgent } from '../common/user-agent';
import { messenger } from './services/messenger';

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
        messenger.sendMessage(MessageType.ChangeUserSettings, {
            key: userSettings.names.DisableSafebrowsing,
            value: !checkbox.checked,
        });
    };

    const trackingFilterEnabledChange = (e) => {
        const checkbox = e.currentTarget;
        if (checkbox.checked) {
            messenger.sendMessage(MessageType.AddAndEnableFilter, {
                filterId: AntiBannerFiltersId.TrackingFilterId,
            });
        } else {
            messenger.sendMessage(MessageType.DisableAntibannerFilter, {
                filterId: AntiBannerFiltersId.TrackingFilterId,
                remove: true,
            });
        }
    };

    const socialFilterEnabledChange = (e) => {
        const checkbox = e.currentTarget;
        if (checkbox.checked) {
            messenger.sendMessage(MessageType.AddAndEnableFilter, {
                filterId: AntiBannerFiltersId.SocialFilterId,
            });
        } else {
            messenger.sendMessage(MessageType.DisableAntibannerFilter, {
                filterId: AntiBannerFiltersId.SocialFilterId,
                remove: true,
            });
        }
    };

    const sendStatsCheckboxChange = (e) => {
        const checkbox = e.currentTarget;
        messenger.sendMessage(MessageType.ChangeUserSettings, {
            key: userSettings.names.DisableCollectHits,
            value: !checkbox.checked,
        });
    };

    const allowAcceptableAdsChange = (e) => {
        const checkbox = e.currentTarget;
        if (checkbox.checked) {
            messenger.sendMessage(MessageType.AddAndEnableFilter, {
                filterId: AntiBannerFiltersId.SearchAndSelfPromoFilterId,
            });
        } else {
            messenger.sendMessage(MessageType.DisableAntibannerFilter, {
                filterId: AntiBannerFiltersId.SearchAndSelfPromoFilterId,
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
        if (!UserAgent.isFirefox) {
            sendStatsCheckbox.addEventListener('change', sendStatsCheckboxChange);
        }
        allowAcceptableAdsCheckbox.addEventListener('change', allowAcceptableAdsChange);

        const openExtensionStoreBtns = [].slice.call(document.querySelectorAll('.openExtensionStore'));
        openExtensionStoreBtns.forEach((openExtensionStoreBtn) => {
            openExtensionStoreBtn.addEventListener('click', (e) => {
                e.preventDefault();
                messenger.sendMessage(MessageType.OpenExtensionStore);
            });
        });

        const openSettingsBtns = [].slice.call(document.querySelectorAll('.openSettings'));
        openSettingsBtns.forEach((openSettingsBtn) => {
            openSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                messenger.sendMessage(MessageType.OpenSettingsTab);
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
        const safebrowsingEnabled = !userSettings.values[userSettings.names.DisableSafebrowsing];
        const collectHitsCount = !userSettings.values[userSettings.names.DisableCollectHits];
        const trackingFilterEnabled = AntiBannerFiltersId.TrackingFilterId in enabledFilters;
        const socialFilterEnabled = AntiBannerFiltersId.SocialFilterId in enabledFilters;
        // eslint-disable-next-line max-len
        const allowAcceptableAdsEnabled = AntiBannerFiltersId.SearchAndSelfPromoFilterId in enabledFilters;

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
const init = async () => {
    if (typeof messenger === 'undefined') {
        if (counter > MAX_WAIT_RETRY) {
            clearTimeout(timeoutId);
            return;
        }
        timeoutId = setTimeout(init, RETRY_TIMEOUT_MS);
        counter += 1;
        return;
    }

    clearTimeout(timeoutId);

    const response = await messenger.sendMessage(MessageType.InitializeFrameScript);
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
