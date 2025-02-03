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

// TODO: generate tools/bundle/manifest.common.json with this constants

export const WEB_ACCESSIBLE_RESOURCES_OUTPUT = 'web-accessible-resources';
export const WEB_ACCESSIBLE_RESOURCES_OUTPUT_REDIRECTS = `${WEB_ACCESSIBLE_RESOURCES_OUTPUT}/redirects`;

export const BACKGROUND_OUTPUT = 'pages/background';
export const OPTIONS_OUTPUT = 'pages/options';
export const POPUP_OUTPUT = 'pages/popup';
export const FILTERING_LOG_OUTPUT = 'pages/filtering-log';
export const POST_INSTALL_OUTPUT = 'pages/post-install';
export const FULLSCREEN_USER_RULES_OUTPUT = 'pages/fullscreen-user-rules';
export const SAFEBROWSING_OUTPUT = 'pages/safebrowsing';
export const DOCUMENT_BLOCK_OUTPUT = 'pages/ad-blocked';
export const SUBSCRIBE_OUTPUT = 'pages/subscribe';
export const CONTENT_SCRIPT_START_OUTPUT = 'pages/content-script-start';
export const CONTENT_SCRIPT_END_OUTPUT = 'pages/content-script-end';
export const THANKYOU_OUTPUT = 'pages/thankyou';
export const ASSISTANT_INJECT_OUTPUT = 'pages/assistant-inject';
export const GPC_SCRIPT_OUTPUT = 'pages/gpc';
export const HIDE_DOCUMENT_REFERRER_OUTPUT = 'pages/hide-document-referrer';
export const DEVTOOLS_OUTPUT = 'pages/devtools';
export const DEVTOOLS_ELEMENT_SIDEBAR_OUTPUT = 'pages/devtools-elements-sidebar';

export const SHARED_EDITOR_OUTPUT = 'shared/editor';

export const REACT_VENDOR_OUTPUT = 'vendors/react';
export const MOBX_VENDOR_OUTPUT = 'vendors/mobx';
export const XSTATE_VENDOR_OUTPUT = 'vendors/xstate';
export const TSURLFILTER_VENDOR_OUTPUT = 'vendors/tsurlfilter';
export const AGTREE_VENDOR_OUTPUT = 'vendors/agtree';
export const CSS_TOKENIZER_VENDOR_OUTPUT = 'vendors/css-tokenizer';
export const TSWEBEXTENSION_VENDOR_OUTPUT = 'vendors/tswebextension';
export const TEXT_ENCODING_POLYFILL_VENDOR_OUTPUT = 'vendors/text-encoding-polyfill';
export const SCRIPTLETS_VENDOR_OUTPUT = 'vendors/scriptlets';

// Placed here to use in the node environment and in the browser
// Important: extensions '.js' used for correct work of Cloudflare cache, but
// real format of these files is JSON.
// See AG-1901 for details.
export const REMOTE_METADATA_FILE_NAME = 'filters.js';
export const REMOTE_I18N_METADATA_FILE_NAME = 'filters_i18n.js';
// But locally we prefer to use '.json' extension.
export const LOCAL_METADATA_FILE_NAME = 'filters.json';
export const LOCAL_I18N_METADATA_FILE_NAME = 'filters_i18n.json';

/**
 * List of AdGuard filters IDs.
 *
 * `12` is absent because Safari filter if obsolete and not used anymore.
 */
export const ADGUARD_FILTERS_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 224];

/**
 * Minimum supported browser versions.
 *
 * IMPORTANT! Update browser compatibility in the README.md file when changing the versions.
 */
export const MIN_SUPPORTED_VERSION = {
    CHROMIUM_MV2: 79,
    CHROMIUM_MV3: 121,
    FIREFOX: 78,
    FIREFOX_MOBILE: 113,
    OPERA: 67,
    EDGE_CHROMIUM: 80,
};
