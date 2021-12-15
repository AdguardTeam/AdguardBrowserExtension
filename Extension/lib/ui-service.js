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

adguard.ui = (function (adguard) { // jshint ignore:line
    const alertStylesUrl = adguard.getURL('/lib/content-script/css/alert-popup.css');

    const browserActionTitle = adguard.i18n.getMessage('name');

    const contextMenuCallbackMappings = {
        'context_block_site_ads': function () {
            openAssistant();
        },
        'context_block_site_element': function () {
            openAssistant(true);
        },
        'context_security_report': function () {
            adguard.tabs.getActive((tab) => {
                openSiteReportTab(tab.url);
            });
        },
        'context_complaint_website': function () {
            adguard.tabs.getActive((tab) => {
                openAbuseTab(tab.url);
            });
        },
        'context_site_filtering_on': function () {
            adguard.tabs.getActive(unWhiteListTab);
        },
        'context_site_filtering_off': function () {
            adguard.tabs.getActive(whiteListTab);
        },
        'context_enable_protection': function () {
            changeApplicationFilteringDisabled(false);
        },
        'context_disable_protection': function () {
            changeApplicationFilteringDisabled(true);
        },
        'context_open_settings': function () {
            openSettingsTab();
        },
        'context_general_settings': function () {
            openSettingsTab('general-settings');
        },
        'context_antibanner': function () {
            openSettingsTab('antibanner');
        },
        'context_safebrowsing': function () {
            openSettingsTab('safebrowsing');
        },
        'context_whitelist': function () {
            openSettingsTab('whitelist');
        },
        'context_userfilter': function () {
            openSettingsTab('userfilter');
        },
        'context_miscellaneous_settings': function () {
            openSettingsTab('miscellaneous-settings');
        },
        'context_open_log': function () {
            openFilteringLog();
        },
        'context_update_antibanner_filters': function () {
            checkFiltersUpdates();
        },
    };

    const extensionStoreLink = (function () {
        let browser = 'chrome';
        if (adguard.utils.browser.isOperaBrowser()) {
            browser = 'opera';
        } else if (adguard.utils.browser.isFirefoxBrowser()) {
            browser = 'firefox';
        } else if (adguard.utils.browser.isEdgeChromiumBrowser()) {
            browser = 'edge';
        }

        const action = `${browser}_store`;

        return `https://adguard.com/forward.html?action=${action}&from=options_screen&app=browser_extension`;
    })();

    const THANKYOU_PAGE_URL = 'https://welcome.adguard.com/v2/thankyou.html';

    /**
     * Update icon for tab
     * @param tab Tab
     * @param options Options for icon or badge values
     */
    function updateTabIcon(tab, options) {
        let icon;
        let badge;
        let badgeColor = '#555';

        if (tab.tabId === adguard.BACKGROUND_TAB_ID) {
            return;
        }

        try {
            if (options) {
                icon = options.icon;
                badge = options.badge;
            } else {
                let blocked;
                let disabled;

                const tabInfo = adguard.frames.getFrameInfo(tab);
                disabled = tabInfo.applicationFilteringDisabled;
                disabled = disabled || tabInfo.documentWhiteListed;

                if (!disabled && adguard.settings.showPageStatistic()) {
                    blocked = tabInfo.totalBlockedTab.toString();
                } else {
                    blocked = '0';
                }

                if (disabled) {
                    icon = adguard.prefs.ICONS.ICON_GRAY;
                } else {
                    icon = adguard.prefs.ICONS.ICON_GREEN;
                }

                badge = adguard.utils.workaround.getBlockedCountText(blocked);

                // If there's an active notification, indicate it on the badge
                const notification = adguard.notifications.getCurrentNotification();
                if (notification) {
                    badge = notification.badgeText || badge;
                    badgeColor = notification.badgeBgColor || badgeColor;

                    const hasSpecialIcons = !!notification.icons;

                    if (hasSpecialIcons) {
                        if (disabled) {
                            icon = notification.icons.ICON_GRAY;
                        } else {
                            icon = notification.icons.ICON_GREEN;
                        }
                    }
                }
            }

            adguard.browserAction.setBrowserAction(tab, icon, badge, badgeColor, browserActionTitle);
        } catch (ex) {
            adguard.console.error('Error while updating icon for tab {0}: {1}', tab.tabId, new Error(ex));
        }
    }

    const updateTabIconAsync = adguard.utils.concurrent.debounce((tab) => {
        updateTabIcon(tab);
    }, 250);

    /**
     * Update extension browser action popup window
     * @param tab - active tab
     */
    function updatePopupStats(tab) {
        const tabInfo = adguard.frames.getFrameInfo(tab);
        if (!tabInfo) {
            return;
        }
        adguard.runtimeImpl.sendMessage({
            type: 'updateTotalBlocked',
            tabInfo,
        });
    }

    const updatePopupStatsAsync = adguard.utils.concurrent.debounce((tab) => {
        updatePopupStats(tab);
    }, 250);

    /**
     * Creates context menu item
     * @param title Title id
     * @param options Create options
     */
    function addMenu(title, options) {
        const createProperties = {
            contexts: ['all'],
            title: adguard.i18n.getMessage(title),
        };
        if (options) {
            if (options.id) {
                createProperties.id = options.id;
            }
            if (options.parentId) {
                createProperties.parentId = options.parentId;
            }
            if (options.disabled) {
                createProperties.enabled = false;
            }
            if (options.messageArgs) {
                createProperties.title = adguard.i18n.getMessage(title, options.messageArgs);
            }
            if (options.contexts) {
                createProperties.contexts = options.contexts;
            }
            if ('checkable' in options) {
                createProperties.checkable = options.checkable;
            }
            if ('checked' in options) {
                createProperties.checked = options.checked;
            }
        }
        let callback;
        if (options && options.action) {
            callback = contextMenuCallbackMappings[options.action];
        } else {
            callback = contextMenuCallbackMappings[title];
        }
        if (typeof callback === 'function') {
            createProperties.onclick = callback;
        }
        adguard.contextMenus.create(createProperties);
    }

    function customizeContextMenu(tab) {
        function addSeparator() {
            adguard.contextMenus.create({
                type: 'separator',
            });
        }

        const tabInfo = adguard.frames.getFrameInfo(tab);

        if (tabInfo.applicationFilteringDisabled) {
            addMenu('context_site_protection_disabled');
            addSeparator();
            addMenu('context_open_log');
            addMenu('context_open_settings');
            addMenu('context_enable_protection');
        } else if (tabInfo.urlFilteringDisabled) {
            addMenu('context_site_filtering_disabled');
            addSeparator();
            addMenu('context_open_log');
            addMenu('context_open_settings');
            addMenu('context_update_antibanner_filters');
        } else {
            if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
                addMenu('context_site_exception');
            } else if (tabInfo.canAddRemoveRule) {
                if (tabInfo.documentWhiteListed) {
                    addMenu('context_site_filtering_on');
                } else {
                    addMenu('context_site_filtering_off');
                }
            }
            addSeparator();

            if (!tabInfo.documentWhiteListed) {
                addMenu('context_block_site_ads');
                addMenu('context_block_site_element', { contexts: ['image', 'video', 'audio'] });
            }
            addMenu('context_security_report');
            addMenu('context_complaint_website');
            addSeparator();
            addMenu('context_update_antibanner_filters');
            addSeparator();
            addMenu('context_open_settings');
            addMenu('context_open_log');
            addMenu('context_disable_protection');
        }
    }

    function customizeMobileContextMenu(tab) {
        const tabInfo = adguard.frames.getFrameInfo(tab);

        if (tabInfo.applicationFilteringDisabled) {
            addMenu('popup_site_protection_disabled_android', {
                action: 'context_enable_protection',
                checked: true,
                checkable: true,
            });
            addMenu('popup_open_log_android', { action: 'context_open_log' });
            addMenu('popup_open_settings', { action: 'context_open_settings' });
        } else if (tabInfo.urlFilteringDisabled) {
            addMenu('context_site_filtering_disabled');
            addMenu('popup_open_log_android', { action: 'context_open_log' });
            addMenu('popup_open_settings', { action: 'context_open_settings' });
            addMenu('context_update_antibanner_filters');
        } else {
            addMenu('popup_site_protection_disabled_android', {
                action: 'context_disable_protection',
                checked: false,
                checkable: true,
            });
            if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
                addMenu('popup_in_white_list_android');
            } else if (tabInfo.canAddRemoveRule) {
                if (tabInfo.documentWhiteListed) {
                    addMenu('popup_site_filtering_state', {
                        action: 'context_site_filtering_on',
                        checkable: true,
                        checked: false,
                    });
                } else {
                    addMenu('popup_site_filtering_state', {
                        action: 'context_site_filtering_off',
                        checkable: true,
                        checked: true,
                    });
                }
            }

            if (!tabInfo.documentWhiteListed) {
                addMenu('popup_block_site_ads_android', { action: 'context_block_site_ads' });
            }
            addMenu('popup_open_log_android', { action: 'context_open_log' });
            addMenu('popup_security_report_android', { action: 'context_security_report' });
            addMenu('popup_open_settings', { action: 'context_open_settings' });
            addMenu('context_update_antibanner_filters');
        }
    }

    /**
     * Update context menu for tab
     * @param tab Tab
     */
    function updateTabContextMenu(tab) {
        // Isn't supported by Android WebExt
        if (!adguard.contextMenus) {
            return;
        }
        adguard.contextMenus.removeAll();
        if (adguard.settings.showContextMenu()) {
            if (adguard.prefs.mobile) {
                customizeMobileContextMenu(tab);
            } else {
                customizeContextMenu(tab);
            }
            if (typeof adguard.contextMenus.render === 'function') {
                // In some case we need to manually render context menu
                adguard.contextMenus.render();
            }
        }
    }

    function closeAllPages() {
        adguard.tabs.forEach((tab) => {
            if (tab.url.indexOf(adguard.getURL('')) >= 0) {
                adguard.tabs.remove(tab.tabId);
            }
        });
    }

    function getPageUrl(page) {
        return adguard.getURL(`pages/${page}`);
    }

    const isAdguardTab = (tab) => {
        const { url } = tab;
        const parsedUrl = new URL(url);
        const schemeUrl = adguard.app.getUrlScheme();
        return parsedUrl.protocol.indexOf(schemeUrl) > -1;
    };

    function showAlertMessagePopup(title, text, alertStyles) {
        adguard.tabs.getActive((tab) => {
            adguard.tabs.sendMessage(tab.tabId, {
                type: 'show-alert-popup',
                isAdguardTab: isAdguardTab(tab),
                title,
                text,
                alertStyles,
            });
        });
    }

    /**
     * Depending on version numbers select proper message for description
     *
     * @param currentVersion
     * @param previousVersion
     */
    function getUpdateDescriptionMessage(currentVersion, previousVersion) {
        if (adguard.utils.browser.getMajorVersionNumber(currentVersion) > adguard.utils.browser.getMajorVersionNumber(previousVersion)
            || adguard.utils.browser.getMinorVersionNumber(currentVersion) > adguard.utils.browser.getMinorVersionNumber(previousVersion)) {
            return adguard.i18n.getMessage('options_popup_version_update_description_major');
        }

        return adguard.i18n.getMessage('options_popup_version_update_description_minor');
    }

    /**
     * Shows application updated popup
     *
     * @param currentVersion
     * @param previousVersion
     * @param alertStyles
     */
    const showApplicationUpdatedPopup = async (currentVersion, previousVersion, alertStyles) => {
        // Suppress for v3.0 hotfix
        // TODO: Remove this in the next update

        const notification = adguard.notifications.getCurrentNotification();

        if (!notification
            && adguard.utils.browser.getMajorVersionNumber(currentVersion) == adguard.utils.browser.getMajorVersionNumber(previousVersion)
            && adguard.utils.browser.getMinorVersionNumber(currentVersion) == adguard.utils.browser.getMinorVersionNumber(previousVersion)) {
            return;
        }

        let offer = adguard.i18n.getMessage('options_popup_version_update_offer');
        let offerButtonHref = 'https://adguard.com/forward.html?action=learn_about_adguard&from=version_popup&app=browser_extension';
        let offerButtonText = adguard.i18n.getMessage('options_popup_version_update_offer_button_text');

        if (notification) {
            offer = notification.text.title;
            offerButtonText = notification.text.btn;
            offerButtonHref = `${notification.url}&from=version_popup`;
        }

        const message = {
            type: 'show-version-updated-popup',
            title: adguard.i18n.getMessage('options_popup_version_update_title', currentVersion),
            description: getUpdateDescriptionMessage(currentVersion, previousVersion),
            changelogHref: 'https://adguard.com/forward.html?action=github_version_popup&from=version_popup&app=browser_extension',
            changelogText: adguard.i18n.getMessage('options_popup_version_update_changelog_text'),
            showPromoNotification: !!notification,
            offer,
            offerButtonHref,
            offerButtonText,
            disableNotificationText: adguard.i18n.getMessage('options_popup_version_update_disable_notification'),
            alertStyles,
        };

        await sendMessageToActiveTab(message);
    };

    let sendMessageTries = 0;
    const MAX_TRIES = 500; // 2500 sec
    const TRIES_TIMEOUT = 5000;

    /**
     * Tries to send message to an active tab,
     * in case of updated app, the content script on not-reloaded tab will not be able to send success callback,
     * so then we postpone the try by TRIES_TIMEOUT.
     *
     * @param message
     */
    const sendMessageToActiveTab = async (message) => {
        const result = await trySendMessageToActiveTab(message);
        if (result) {
            return;
        }

        sendMessageTries += 1;
        if (sendMessageTries > MAX_TRIES) {
            // Give up trying
            return;
        }

        setTimeout(async () => {
            await sendMessageToActiveTab(message);
        }, TRIES_TIMEOUT);
    };

    const trySendMessageToActiveTab = async (message) => {
        return new Promise((resolve) => {
            adguard.tabs.getActive((tab) => {
                message.isAdguardTab = isAdguardTab(tab);
                adguard.tabs.sendMessage(tab.tabId, message, (result) => {
                    resolve(result);
                });
            });
        });
    };

    function getFiltersUpdateResultMessage(success, updatedFilters) {
        let title = '';
        let text = '';
        if (success) {
            if (updatedFilters.length === 0) {
                title = '';
                text = adguard.i18n.getMessage('options_popup_update_not_found');
            } else {
                title = '';
                text = updatedFilters
                    .sort((a, b) => {
                        if (a.groupId === b.groupId) {
                            return a.displayNumber - b.displayNumber;
                        }
                        return a.groupId === b.groupId;
                    })
                    .map(filter => `"${filter.name}"`)
                    .join(', ');
                if (updatedFilters.length > 1) {
                    text += ` ${adguard.i18n.getMessage('options_popup_update_filters')}`;
                } else {
                    text += ` ${adguard.i18n.getMessage('options_popup_update_filter')}`;
                }
            }
        } else {
            title = adguard.i18n.getMessage('options_popup_update_title_error');
            text = adguard.i18n.getMessage('options_popup_update_error');
        }

        return {
            title,
            text,
        };
    }

    function getFiltersEnabledResultMessage(enabledFilters) {
        const title = adguard.i18n.getMessage('alert_popup_filter_enabled_title');
        const text = [];
        enabledFilters.sort((a, b) => a.displayNumber - b.displayNumber);
        for (let i = 0; i < enabledFilters.length; i++) {
            const filter = enabledFilters[i];
            text.push(adguard.i18n.getMessage('alert_popup_filter_enabled_text', [filter.name]).replace('$1', filter.name));
        }
        return {
            title,
            text,
        };
    }

    const updateTabIconAndContextMenu = function (tab, reloadFrameData) {
        if (reloadFrameData) {
            adguard.frames.reloadFrameData(tab);
        }
        updateTabIcon(tab);
        updateTabContextMenu(tab);
    };

    const openExportRulesTab = function (hash) {
        openTab(getPageUrl(`${'export.html' + '#'}${hash}`));
    };

    /**
     * Open settings tab with hash parameters or without them
     * @param anchor
     * @param hashParameters
     */
    var openSettingsTab = function (anchor, hashParameters = {}) {
        if (anchor) {
            hashParameters.anchor = anchor;
        }

        const options = {
            activateSameTab: true,
            hashParameters,
        };

        openTab(getPageUrl('options.html'), options);
    };

    var openSiteReportTab = function (url) {
        const domain = adguard.utils.url.toPunyCode(adguard.utils.url.getDomainName(url));
        if (domain) {
            openTab(`https://adguard.com/site.html?domain=${encodeURIComponent(domain)}&utm_source=extension&aid=16593`);
        }
    };

    /**
     * Generates query string with stealth options information
     * @returns {string}
     */
    const getStealthString = () => {
        const stealthOptions = [
            { queryKey: 'ext_hide_referrer', settingKey: adguard.settings.HIDE_REFERRER },
            { queryKey: 'hide_search_queries', settingKey: adguard.settings.HIDE_SEARCH_QUERIES },
            { queryKey: 'DNT', settingKey: adguard.settings.SEND_DO_NOT_TRACK },
            { queryKey: 'x_client', settingKey: adguard.settings.BLOCK_CHROME_CLIENT_DATA },
            { queryKey: 'webrtc', settingKey: adguard.settings.BLOCK_WEBRTC },
            {
                queryKey: 'third_party_cookies',
                settingKey: adguard.settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES,
                settingValueKey: adguard.settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME,
            },
            {
                queryKey: 'first_party_cookies',
                settingKey: adguard.settings.SELF_DESTRUCT_FIRST_PARTY_COOKIES,
                settingValueKey: adguard.settings.SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME,
            },
        ];

        const stealthEnabled = !adguard.settings.getProperty(adguard.settings.DISABLE_STEALTH_MODE);

        if (!stealthEnabled) {
            return `&stealth.enabled=${stealthEnabled}`;
        }

        const stealthOptionsString = stealthOptions.map((option) => {
            const { queryKey, settingKey, settingValueKey } = option;
            const setting = adguard.settings.getProperty(settingKey);
            let settingString;
            if (!setting) {
                return '';
            }
            if (!settingValueKey) {
                settingString = setting;
            } else {
                settingString = adguard.settings.getProperty(settingValueKey);
            }
            return `stealth.${queryKey}=${encodeURIComponent(settingString)}`;
        })
            .filter(string => string.length > 0)
            .join('&');

        return `&stealth.enabled=${stealthEnabled}&${stealthOptionsString}`;
    };

    /**
     * Opens site complaint report tab
     * https://github.com/AdguardTeam/ReportsWebApp#pre-filling-the-app-with-query-parameters
     * @param url
     */
    const openAbuseTab = function (url) {
        let browser;
        let browserDetails;

        const supportedBrowsers = ['Chrome', 'Firefox', 'Opera', 'Safari', 'IE', 'Edge'];
        if (supportedBrowsers.includes(adguard.prefs.browser)) {
            browser = adguard.prefs.browser;
        } else {
            browser = 'Other';
            browserDetails = adguard.prefs.browser;
        }

        const filterIds = adguard.filters.getEnabledFiltersFromEnabledGroups()
            .map(filter => filter.filterId);

        openTab(`https://reports.adguard.com/new_issue.html?product_type=Ext&product_version=${
            encodeURIComponent(adguard.app.getVersion())
        }&browser=${encodeURIComponent(browser)
        }${browserDetails ? `&browser_detail=${encodeURIComponent(browserDetails)}` : ''
        }&url=${encodeURIComponent(url)
        }&filters=${encodeURIComponent(filterIds.join('.'))
        }${getStealthString()}`);
    };

    var openFilteringLog = function (tabId) {
        const options = { activateSameTab: true, type: 'popup' };
        if (!tabId) {
            adguard.tabs.getActive((tab) => {
                const { tabId } = tab;
                openTab(getPageUrl('log.html') + (tabId ? `#${tabId}` : ''), options);
            });
            return;
        }
        openTab(getPageUrl('log.html') + (tabId ? `#${tabId}` : ''), options);
    };

    const openThankYouPage = function () {
        const params = adguard.utils.browser.getExtensionParams();
        params.push(`_locale=${encodeURIComponent(adguard.app.getLocale())}`);
        const thankyouUrl = `${THANKYOU_PAGE_URL}?${params.join('&')}`;

        const filtersDownloadUrl = getPageUrl('filter-download.html');

        adguard.tabs.getAll((tabs) => {
            // Finds the filter-download page and reload it within the thank-you page URL
            for (let i = 0; i < tabs.length; i++) {
                const tab = tabs[i];
                if (tab.url === filtersDownloadUrl) {
                    // In YaBrowser don't activate found page
                    if (!adguard.utils.browser.isYaBrowser()) {
                        adguard.tabs.activate(tab.tabId);
                    }
                    adguard.tabs.reload(tab.tabId, thankyouUrl);
                    return;
                }
            }
            openTab(thankyouUrl);
        });
    };

    const openExtensionStore = function () {
        openTab(extensionStoreLink);
    };

    const openFiltersDownloadPage = function () {
        openTab(getPageUrl('filter-download.html'), { inBackground: adguard.utils.browser.isYaBrowser() });
    };

    var whiteListTab = function (tab) {
        const tabInfo = adguard.frames.getFrameInfo(tab);
        adguard.whitelist.whiteListUrl(tabInfo.url);
        updateTabIconAndContextMenu(tab, true);
        adguard.tabs.reload(tab.tabId);
    };

    var unWhiteListTab = function (tab) {
        const tabInfo = adguard.frames.getFrameInfo(tab);
        adguard.userrules.unWhiteListFrame(tabInfo);
        updateTabIconAndContextMenu(tab, true);
        adguard.tabs.reload(tab.tabId);
    };

    var changeApplicationFilteringDisabled = function (disabled) {
        adguard.settings.changeFilteringDisabled(disabled);
        adguard.tabs.getActive((tab) => {
            updateTabIconAndContextMenu(tab, true);
            adguard.tabs.reload(tab.tabId);
        });
    };

    /**
     * Checks filters updates
     * @param {Object[]} [filters] optional list of filters
     * @param {boolean} [showPopup = true] show update filters popup
     */
    const checkFiltersUpdates = (filters, showPopup = true) => {
        const showPopupEvent = adguard.listeners.UPDATE_FILTERS_SHOW_POPUP;
        const successCallback = showPopup
            ? (updatedFilters) => {
                adguard.listeners.notifyListeners(showPopupEvent, true, updatedFilters);
                adguard.listeners.notifyListeners(adguard.listeners.FILTERS_UPDATE_CHECK_READY);
            }
            : (updatedFilters) => {
                if (updatedFilters && updatedFilters.length > 0) {
                    const updatedFilterStr = updatedFilters.map(f => `Filter ID: ${f.filterId}`).join(', ');
                    adguard.console.info(`Filters were auto updated: ${updatedFilterStr}`);
                }
            };
        const errorCallback = showPopup
            ? () => {
                adguard.listeners.notifyListeners(showPopupEvent, false);
                adguard.listeners.notifyListeners(adguard.listeners.FILTERS_UPDATE_CHECK_READY);
            }
            : () => { };

        if (filters) {
            adguard.filters.checkFiltersUpdates(successCallback, errorCallback, filters);
        } else {
            adguard.filters.checkFiltersUpdates(successCallback, errorCallback);
        }
    };

    const initAssistant = function (selectElement) {
        const options = {
            addRuleCallbackName: 'addUserRule',
            selectElement,
        };

        // init assistant
        adguard.tabs.getActive((tab) => {
            adguard.tabs.sendMessage(tab.tabId, {
                type: 'initAssistant',
                options,
            });
        });
    };

    /**
     * The `openAssistant` function uses the `tabs.executeScript` function to inject
     * the Assistant code into a page without using messaging.
     * We do it dynamically and not include assistant file into the default content scripts
     * in order to reduce the overall memory usage.
     *
     * Browsers that do not support `tabs.executeScript` function use Assistant from the manifest
     * file manually (Safari for instance).
     * After executing the Assistant code in callback the `initAssistant` function is called.
     * It sends messages to current tab and runs Assistant. Other browsers call `initAssistant`
     * function manually.
     *
     * @param {boolean} selectElement - if true select the element on which the Mousedown event was
     */
    const openAssistant = (selectElement) => {
        if (adguard.tabs.executeScriptFile) {
            // Load Assistant code to the activate tab immediately
            adguard.tabs.executeScriptFile(null, { file: '/lib/content-script/assistant/js/assistant.js' }, () => {
                initAssistant(selectElement);
            });
        } else {
            // Manually start assistant
            initAssistant(selectElement);
        }
    };

    /**
     * Appends hash parameters if they exists
     * @param rowUrl
     * @param hashParameters
     * @returns {string} prepared url
     */
    const appendHashParameters = (rowUrl, hashParameters) => {
        if (!hashParameters) {
            return rowUrl;
        }

        if (rowUrl.indexOf('#') > -1) {
            adguard.console.warn(`Hash parameters can't be applied to the url with hash: '${rowUrl}'`);
            return rowUrl;
        }

        let hashPart;
        const { anchor } = hashParameters;

        if (anchor) {
            delete hashParameters[anchor];
        }

        const hashString = Object.keys(hashParameters)
            .map(key => `${key}=${hashParameters[key]}`)
            .join('&');

        if (hashString.length <= 0) {
            hashPart = anchor && anchor.length > 0 ? `#${anchor}` : '';
            return rowUrl + hashPart;
        }

        hashPart = anchor && anchor.length > 0 ? `replacement=${anchor}&${hashString}` : hashString;
        hashPart = encodeURIComponent(hashPart);
        return `${rowUrl}#${hashPart}`;
    };

    var openTab = function (url, options = {}, callback) {
        const {
            activateSameTab,
            inBackground,
            inNewWindow,
            type,
            hashParameters,
        } = options;

        url = appendHashParameters(url, hashParameters);

        function onTabFound(tab) {
            if (tab.url !== url) {
                adguard.tabs.reload(tab.tabId, url);
            }
            if (!inBackground) {
                adguard.tabs.activate(tab.tabId);
            }
            if (callback) {
                callback(tab);
            }
        }

        url = adguard.utils.strings.contains(url, '://') ? url : adguard.getURL(url);
        adguard.tabs.getAll((tabs) => {
            // try to find between opened tabs
            if (activateSameTab) {
                for (let i = 0; i < tabs.length; i += 1) {
                    const tab = tabs[i];
                    if (adguard.utils.url.urlEquals(tab.url, url)) {
                        onTabFound(tab);
                        return;
                    }
                }
            }
            adguard.tabs.create({
                url,
                type: type || 'normal',
                active: !inBackground,
                inNewWindow,
            }, callback);
        });
    };

    const init = async () => {
        const response = await fetch(alertStylesUrl);
        const alertStyles = await response.text();

        // update icon on event received
        adguard.listeners.addListener((event, tab, reset) => {
            if (event !== adguard.listeners.UPDATE_TAB_BUTTON_STATE || !tab) {
                return;
            }

            let options;
            if (reset) {
                options = { icon: adguard.prefs.ICONS.ICON_GREEN, badge: '' };
            }

            updateTabIcon(tab, options);
        });

        // Update tab icon and context menu while loading
        adguard.tabs.onUpdated.addListener((tab) => {
            const { tabId } = tab;
            // BrowserAction is set separately for each tab
            updateTabIcon(tab);
            adguard.tabs.getActive((aTab) => {
                if (aTab.tabId !== tabId) {
                    return;
                }
                // ContextMenu is set for all tabs, so update it only for current tab
                updateTabContextMenu(aTab);
            });
        });

        // Update tab icon and context menu on active tab changed
        adguard.tabs.onActivated.addListener((tab) => {
            updateTabIconAndContextMenu(tab, true);
        });

        // on application updated event
        adguard.listeners.addListener(async (event, info) => {
            if (event === adguard.listeners.APPLICATION_UPDATED) {
                if (adguard.settings.isShowAppUpdatedNotification()) {
                    await showApplicationUpdatedPopup(info.currentVersion, info.prevVersion, alertStyles);
                }
            }
        });

        // on filter auto-enabled event
        adguard.listeners.addListener((event, enabledFilters) => {
            if (event === adguard.listeners.ENABLE_FILTER_SHOW_POPUP) {
                const result = getFiltersEnabledResultMessage(enabledFilters);
                showAlertMessagePopup(result.title, result.text, alertStyles);
            }
        });
    };

    // Update icon and popup stats on ads blocked
    adguard.listeners.addListener((event, rule, tab, blocked) => {
        if (event !== adguard.listeners.ADS_BLOCKED || !tab) {
            return;
        }

        adguard.pageStats.updateStats(rule.filterId, blocked, new Date());
        const tabBlocked = adguard.frames.updateBlockedAdsCount(tab, blocked);
        if (tabBlocked === null) {
            return;
        }
        updateTabIconAsync(tab);

        adguard.tabs.getActive((activeTab) => {
            if (tab.tabId === activeTab.tabId) {
                updatePopupStatsAsync(activeTab);
            }
        });
    });

    // Update context menu on change user settings
    adguard.settings.onUpdated.addListener((setting) => {
        if (setting === adguard.settings.DISABLE_SHOW_CONTEXT_MENU) {
            adguard.tabs.getActive((tab) => {
                updateTabContextMenu(tab);
            });
        }
    });

    // Update tab icon and context menu on application initialization
    adguard.listeners.addListener((event) => {
        if (event === adguard.listeners.APPLICATION_INITIALIZED) {
            adguard.tabs.getActive(updateTabIconAndContextMenu);
        }
    });

    // on filter enabled event
    adguard.listeners.addListener((event, payload) => {
        switch (event) {
            case adguard.listeners.FILTER_ENABLE_DISABLE:
                if (payload.enabled) {
                    checkFiltersUpdates([payload], false);
                }
                break;
            case adguard.listeners.FILTER_GROUP_ENABLE_DISABLE:
                if (payload.enabled && payload.filters) {
                    const enabledFilters = payload.filters.filter(f => f.enabled);
                    checkFiltersUpdates(enabledFilters, false);
                }
                break;
            default:
                break;
        }
    });

    // on filters updated event
    adguard.listeners.addListener((event, success, updatedFilters) => {
        if (event === adguard.listeners.UPDATE_FILTERS_SHOW_POPUP) {
            const result = getFiltersUpdateResultMessage(success, updatedFilters);
            showAlertMessagePopup(result.title, result.text);
        }
    });

    // close all page on unload
    adguard.unload.when(closeAllPages);

    return {
        init,
        openExportRulesTab,
        openSettingsTab,
        openSiteReportTab,
        openFilteringLog,
        openThankYouPage,
        openExtensionStore,
        openFiltersDownloadPage,
        openAbuseTab,

        updateTabIconAndContextMenu,

        whiteListTab,
        unWhiteListTab,

        changeApplicationFilteringDisabled,
        checkFiltersUpdates,
        openAssistant,
        openTab,

        showAlertMessagePopup,
    };
})(adguard);
