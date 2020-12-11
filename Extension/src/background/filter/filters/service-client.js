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

import FiltersDownloader from 'filters-downloader';
import { utils } from '../../utils/common';
import { backgroundPage } from '../../extension-api/background-page';
import { prefs } from '../../prefs';
import { log } from '../../../common/log';
import { subscriptions } from './subscription';
import { browserUtils } from '../../utils/browser-utils';
import { lazyGet } from '../../utils/lazy';

export const backend = (function () {
    /**
     * Class for working with our backend server.
     * All requests sent by this class are covered in the privacy policy:
     * http://adguard.com/en/privacy.html#browsers
     */

    /**
     * Settings
     */
    const settings = {

        // Base url of our backend server
        get backendUrl() {
            return 'https://chrome.adtidy.org';
        },

        get apiKey() {
            return '4DDBE80A3DA94D819A00523252FB6380';
        },

        // Url for load filters metadata and rules
        get filtersUrl() {
            return lazyGet(this, 'filtersUrl', () => {
                if (browserUtils.isFirefoxBrowser()) {
                    return 'https://filters.adtidy.org/extension/firefox';
                } if (browserUtils.isEdgeBrowser()) {
                    return 'https://filters.adtidy.org/extension/edge';
                } if (browserUtils.isOperaBrowser()) {
                    return 'https://filters.adtidy.org/extension/opera';
                }
                return 'https://filters.adtidy.org/extension/chromium';
            });
        },

        // URL for downloading AG filters
        get filterRulesUrl() {
            return `${this.filtersUrl}/filters/{filter_id}.txt`;
        },

        // URL for downloading optimized AG filters
        get optimizedFilterRulesUrl() {
            return `${this.filtersUrl}/filters/{filter_id}_optimized.txt`;
        },

        // URL for checking filter updates
        get filtersMetadataUrl() {
            const params = browserUtils.getExtensionParams();
            return `${this.filtersUrl}/filters.js?${params.join('&')}`;
        },

        // URL for user complaints on missed ads or malware/phishing websites
        get reportUrl() {
            return `${this.backendUrl}/url-report.html`;
        },

        /**
         * URL for collecting filter rules statistics.
         * We do not collect it by default, unless user is willing to help.
         *
         * Filter rules stats are covered in our privacy policy and on also here:
         * http://adguard.com/en/filter-rules-statistics.html
         */
        get ruleStatsUrl() {
            return `${this.backendUrl}/rulestats.html`;
        },

        /**
         * Browsing Security lookups. In case of Firefox lookups are disabled for HTTPS urls.
         */
        get safebrowsingLookupUrl() {
            return 'https://sb.adtidy.org/safebrowsing-lookup-short-hash.html';
        },

        // Folder that contains filters metadata and files with rules. 'filters' by default
        get localFiltersFolder() {
            return 'filters';
        },
        // Path to the redirect sources
        get redirectSourcesFolder() {
            return 'assets/libs/scriptlets';
        },
        // Array of filter identifiers, that have local file with rules. Range from 1 to 14 by default
        get localFilterIds() {
            return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
        },
    };

    /**
     * FiltersDownloader constants
     */
    const FilterCompilerConditionsConstants = {
        adguard: true,
        adguard_ext_chromium: browserUtils.isChromium(),
        adguard_ext_firefox: browserUtils.isFirefoxBrowser(),
        adguard_ext_edge: browserUtils.isEdgeBrowser(),
        adguard_ext_safari: false,
        adguard_ext_opera: browserUtils.isOperaBrowser(),
    };

    /**
     * Loading subscriptions map
     */
    const loadingSubscriptions = Object.create(null);

    /**
     * Executes async request
     * @param url Url
     * @param contentType Content type
     */
    function executeRequestAsync(url, contentType) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            try {
                request.open('GET', url);
                request.setRequestHeader('Content-type', contentType);
                request.setRequestHeader('Pragma', 'no-cache');
                request.overrideMimeType(contentType);
                request.mozBackgroundRequest = true;
                request.onload = function () {
                    resolve(request);
                };

                const errorCallbackWrapper = (errorMessage) => {
                    return (e) => {
                        let errorText = errorMessage;
                        if (e?.message) {
                            errorText = `${errorText}: ${e?.message}`;
                        }
                        const error = new Error(`Error: "${errorText}", statusText: ${request.statusText}`);
                        reject(error);
                    };
                };

                request.onerror = errorCallbackWrapper('An error occurred');
                request.onabort = errorCallbackWrapper('Request was aborted');
                request.ontimeout = errorCallbackWrapper('Request stopped by timeout');
                request.send(null);
            } catch (ex) {
                reject(ex);
            }
        });
    }

    /**
     * URL for downloading AG filter
     *
     * @param filterId Filter identifier
     * @param useOptimizedFilters
     * @private
     */
    function getUrlForDownloadFilterRules(filterId, useOptimizedFilters) {
        const url = useOptimizedFilters ? settings.optimizedFilterRulesUrl : settings.filterRulesUrl;
        return utils.strings.replaceAll(url, '{filter_id}', filterId);
    }

    /**
     * Appends request key to url
     */
    function addKeyParameter(url) {
        return `${url}&key=${settings.apiKey}`;
    }

    /**
     * Safe json parsing
     * @param text
     * @private
     */
    function parseJson(text) {
        try {
            return JSON.parse(text);
        } catch (ex) {
            log.error('Error parse json {0}', ex);
            return null;
        }
    }

    /**
     * Load metadata of the specified filters
     *
     * @param filterIds         Filters identifiers
     */
    const loadFiltersMetadata = async (filterIds) => {
        if (!filterIds || filterIds.length === 0) {
            return [];
        }

        const response = await executeRequestAsync(settings.filtersMetadataUrl, 'application/json');

        if (!response?.responseText) {
            throw new Error(`Empty response: ${response}`);
        }

        const metadata = parseJson(response.responseText);

        if (!metadata) {
            throw new Error(`Invalid response: ${response}`);
        }

        const filterMetadataList = [];

        for (let i = 0; i < filterIds.length; i += 1) {
            const filter = utils.collections.find(metadata.filters, 'filterId', filterIds[i]);
            if (filter) {
                filterMetadataList.push(subscriptions.createSubscriptionFilterFromJSON(filter));
            }
        }

        return filterMetadataList;
    };

    /**
     * Downloads filter rules by filter ID
     *
     * @param filterId              Filter identifier
     * @param forceRemote           Force download filter rules from remote server
     * @param useOptimizedFilters   Download optimized filters flag
     * @returns {Promise<string>}   Downloaded rules
     */
    const loadFilterRules = (filterId, forceRemote, useOptimizedFilters) => {
        let url;

        if (forceRemote || settings.localFilterIds.indexOf(filterId) < 0) {
            url = getUrlForDownloadFilterRules(filterId, useOptimizedFilters);
        } else {
            url = backgroundPage.getURL(`${settings.localFiltersFolder}/filter_${filterId}.txt`);
            if (useOptimizedFilters) {
                url = backgroundPage.getURL(`${settings.localFiltersFolder}/filter_mobile_${filterId}.txt`);
            }
        }

        return FiltersDownloader.download(url, FilterCompilerConditionsConstants);
    };

    /**
     * Downloads filter rules by url
     *
     * @param url - Subscription url
     */
    const loadFilterRulesBySubscriptionUrl = async (url) => {
        if (url in loadingSubscriptions) {
            return;
        }

        loadingSubscriptions[url] = true;

        try {
            const lines = await FiltersDownloader.download(url, FilterCompilerConditionsConstants);
            delete loadingSubscriptions[url];

            if (lines[0].indexOf('[') === 0) {
                // [Adblock Plus 2.0]
                lines.shift();
            }

            return lines;
        } catch (e) {
            delete loadingSubscriptions[url];
            const message = e instanceof Error ? e.message : e;
            throw new Error(message);
        }
    };

    const createError = (message, url, response) => {
        let errorMessage = `
            error:                    ${message}
            requested url:            ${url}`;

        if (response) {
            errorMessage = `
            error:                    ${message}
            requested url:            ${url}
            request status text:      ${response.statusText}`;
        }

        return new Error(errorMessage);
    };

    /**
     * Loads filter groups metadata
     */
    const loadLocalFiltersMetadata = async () => {
        const url = backgroundPage.getURL(`${settings.localFiltersFolder}/filters.json`);

        let response;

        try {
            response = await executeRequestAsync(url, 'application/json');
        } catch (e) {
            const exMessage = e?.message || 'couldn\'t load local filters metadata';
            throw createError(exMessage, url);
        }

        if (!response?.responseText) {
            throw createError('empty response', url, response);
        }

        const metadata = parseJson(response.responseText);
        if (!metadata) {
            throw createError('invalid response', url, response);
        }

        return metadata;
    };

    /**
     * Loads filter groups metadata from local file
     * @returns {Promise}
     */
    const loadLocalFiltersI18Metadata = async () => {
        const url = backgroundPage.getURL(`${settings.localFiltersFolder}/filters_i18n.json`);

        let response;
        try {
            response = await executeRequestAsync(url, 'application/json');
        } catch (e) {
            const exMessage = e?.message || 'couldn\'t load local filters i18n metadata';
            throw createError(exMessage, url);
        }

        if (!response?.responseText) {
            throw createError('empty response', url, response);
        }

        const metadata = parseJson(response.responseText);
        if (!metadata) {
            throw createError('invalid response', url, response);
        }
        return metadata;
    };

    /**
     * Loads script rules from local file
     * @returns {Promise}
     */
    const loadLocalScriptRules = async () => {
        const url = backgroundPage.getURL(`${settings.localFiltersFolder}/local_script_rules.json`);

        let response;
        try {
            response = await executeRequestAsync(url, 'application/json');
        } catch (e) {
            const exMessage = e?.message || 'couldn\'t load local script rules';
            throw createError(exMessage, url);
        }

        if (!response?.responseText) {
            throw createError('empty response', url, response);
        }

        const metadata = parseJson(response.responseText);
        if (!metadata) {
            throw createError('invalid response', url, response);
        }

        return metadata;
    };

    // TODO check necessity of this module,
    //  as we already have redirect sources in the webaccessible-resources folder
    /**
     * Loads redirect sources from local file
     * @returns {Promise}
     */
    const loadRedirectSources = async () => {
        const url = `${backgroundPage.getURL(settings.redirectSourcesFolder)}/redirects.yml`;

        let response;

        try {
            response = await executeRequestAsync(url, 'application/x-yaml');
        } catch (e) {
            const exMessage = e?.message || 'couldn\'t load redirect sources';
            throw createError(exMessage, url);
        }

        if (!response?.responseText) {
            throw createError('empty response', url, response);
        }

        return response.responseText;
    };

    /**
     * Checks specified host hashes with our safebrowsing service
     *
     * @param hashes                Host hashes
     */
    const lookupSafebrowsing = async function (hashes) {
        const url = `${settings.safebrowsingLookupUrl}?prefixes=${encodeURIComponent(hashes.join('/'))}`;
        const response = await executeRequestAsync(url, 'application/json');
        return response;
    };

    /**
     * Sends feedback from the user to our server
     *
     * @param url           URL
     * @param messageType   Message type
     * @param comment       Message text
     */
    const sendUrlReport = function (url, messageType, comment) {
        let params = `url=${encodeURIComponent(url)}`;
        params += `&messageType=${encodeURIComponent(messageType)}`;
        if (comment) {
            params += `&comment=${encodeURIComponent(comment)}`;
        }
        params = addKeyParameter(params);

        const request = new XMLHttpRequest();
        request.open('POST', settings.reportUrl);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.send(params);
    };

    /**
     * Sends filter hits stats to backend server.
     * This method is used if user has enabled "Send statistics for ad filters usage".
     * More information about ad filters usage stats:
     * http://adguard.com/en/filter-rules-statistics.html
     *
     * @param stats             Stats
     * @param enabledFilters    List of enabled filters
     */
    const sendHitStats = function (stats, enabledFilters) {
        let params = `stats=${encodeURIComponent(stats)}`;
        params += `&v=${encodeURIComponent(backgroundPage.app.getVersion())}`;
        params += `&b=${encodeURIComponent(prefs.browser)}`;
        if (enabledFilters) {
            for (let i = 0; i < enabledFilters.length; i += 1) {
                const filter = enabledFilters[i];
                params += `&f=${encodeURIComponent(`${filter.filterId},${filter.version}`)}`;
            }
        }
        params = addKeyParameter(params);

        const request = new XMLHttpRequest();
        request.open('POST', settings.ruleStatsUrl);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.send(params);
    };

    /**
     * Configures backend's URLs
     * @param configuration Configuration object:
     * {
     *  filtersMetadataUrl: '...',
     *  filterRulesUrl: '...',
     *  localFiltersFolder: '...',
     *  localFilterIds: []
     * }
     */
    const configure = function (configuration) {
        const { filtersMetadataUrl } = configuration;
        if (filtersMetadataUrl) {
            Object.defineProperty(settings, 'filtersMetadataUrl', {
                get() {
                    return filtersMetadataUrl;
                },
            });
        }
        const { filterRulesUrl } = configuration;
        if (filterRulesUrl) {
            Object.defineProperty(settings, 'filterRulesUrl', {
                get() {
                    return filterRulesUrl;
                },
            });
        }
        const { localFiltersFolder } = configuration;
        if (localFiltersFolder) {
            Object.defineProperty(settings, 'localFiltersFolder', {
                get() {
                    return localFiltersFolder;
                },
            });
        }

        const { redirectSourcesFolder } = configuration;
        if (redirectSourcesFolder) {
            Object.defineProperty(settings, 'redirectSourcesFolder', {
                get() {
                    return redirectSourcesFolder;
                },
            });
        }

        const { localFilterIds } = configuration;
        if (localFilterIds) {
            Object.defineProperty(settings, 'localFilterIds', {
                get() {
                    return localFilterIds;
                },
            });
        }
    };

    return {
        loadFiltersMetadata,
        loadFilterRules,

        loadFilterRulesBySubscriptionUrl,

        loadLocalFiltersMetadata,
        loadLocalFiltersI18Metadata,
        loadLocalScriptRules,
        loadRedirectSources,

        lookupSafebrowsing,

        sendUrlReport,
        sendHitStats,

        configure,
    };
})();
