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

/* global chrome, EventChannels, UrlUtils, Utils */

/**
 * Initialize LocaleDetectService.
 *
 * This service is used to auto-enable language-specific filters.
 */
adguard.localeDetectService = (function () {

    var browsingLanguages = [];

    var SUCCESS_HIT_COUNT = 3;
    var MAX_HISTORY_LENGTH = 10;

    var filtersLanguages = null;

    var domainToLanguagesMap = {
        // Russian
        'ru': 'ru',
        'ua': 'ru',
        'by': 'ru',
        'kz': 'ru',
        // English
        'com': 'en',
        'au': 'en',
        'uk': 'en',
        'nz': 'en',
        // Deutch
        'de': 'de',
        'at': 'de',
        // Japanese
        'jp': 'ja',
        // Dutch
        'nl': 'nl',
        // French
        'fr': 'fr',
        // Spanish
        'es': 'es',
        // Italian
        'it': 'it',
        // Portuguese
        'pt': 'pt',
        // Polish
        'pl': 'pl',
        // Czech
        'cz': 'cs',
        // Bulgarian
        'bg': 'bg',
        // Lithuanian
        'lt': 'lt',
        // Latvian
        'lv': 'lv',
        // Arabic
        'eg': 'ar',
        'dz': 'ar',
        'kw': 'ar',
        'ae': 'ar',
        // Slovakian
        'sk': 'sk',
        // Romanian
        'ro': 'ro',
        // Suomi
        'fi': 'fi',
        // Icelandic
        'is': 'is',
        // Norwegian
        'no': 'no',
        // Greek
        'gr': 'el',
        // Hungarian
        'hu': 'hu',
        // Hebrew
        'il': 'he',
        // Chinese
        'cn': 'zh',
        // Indonesian
        'id': 'id'
    };

    var onDetectedChannel = EventChannels.newChannel();

    /**
     * Stores language in the special array containing languages of the last visited pages.
     * If user has visited enough pages with a specified language we call special callback
     * to auto-enable filter for this language
     *
     * @param language Page language
     * @private
     */
    function detectLanguage(language) {

        if (!language || language == "und") {
            return;
        }

        language = language.trim().toLowerCase();

        browsingLanguages.push({
            language: language,
            time: Date.now()
        });
        if (browsingLanguages.length > MAX_HISTORY_LENGTH) {
            browsingLanguages.shift();
        }

        var history = browsingLanguages.filter(function (h) {
            return h.language == language;
        });

        if (history.length >= SUCCESS_HIT_COUNT) {
            var filterIds = getFilterIdsForLanguage(language);
            onDetectedChannel.notify(filterIds);
        }
    }

    /**
     * Detects language for the specified page
     * @param tabId  Tab identifier
     * @param url    Page URL
     */
    function detectTabLanguage(tabId, url) {
        if (!adguard.settings.isAutodetectFilters()) {
            return;
        }

        // Check language only for http://... tabs
        if (!UrlUtils.isHttpRequest(url)) {
            return;
        }

        if (tabId && typeof chrome != 'undefined' && chrome.tabs && chrome.tabs.detectLanguage) {
            // Using Chrome language detection if possible
            //detectLanguage working only in chrome browser (Opera and YaBrowser not fire callback method)
            if (Utils.isChromeBrowser()) {
                chrome.tabs.detectLanguage(tabId, function (language) {
                    if (chrome.runtime.lastError) {
                        return;
                    }
                    detectLanguage(language);
                }.bind(this));
                return;
            }
        }

        // Detecting language by top-level domain if Chrome language detection is unavailable
        var host = UrlUtils.getHost(url);
        if (host) {
            var parts = host ? host.split('.') : [];
            var tld = parts[parts.length - 1];
            var lang = domainToLanguagesMap[tld];
            detectLanguage(lang);
        }
    }

    /**
     * Sets current filter-language mapping
     *
     * @param languages Map containing pairs of filterId and list of supported languages
     */
    var setFiltersLanguages = function (languages) {
        filtersLanguages = languages;
    };

    /**
     * Gets list of filters for the specified languages
     *
     * @param lang Language to check
     * @returns List of filters identifiers
     */
    var getFilterIdsForLanguage = function (lang) {
        if (!lang || !filtersLanguages) {
            return [];
        }
        lang = lang.substring(0, 2).toLowerCase();
        var filterIds = [];
        for (var filterId in filtersLanguages) { // jshint ignore:line
            var languages = filtersLanguages[filterId];
            if (languages.indexOf(lang) >= 0) {
                filterIds.push(filterId);
            }
        }
        return filterIds;
    };

    // Locale detect
    adguard.tabs.onUpdated.addListener(function (tab) {
        if (tab.status === 'complete') {
            detectTabLanguage(tab.tabId, tab.url);
        }
    });

    return {
        setFiltersLanguages: setFiltersLanguages,
        getFilterIdsForLanguage: getFilterIdsForLanguage,
        onDetected: onDetectedChannel
    };

})();
