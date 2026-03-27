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

/**
 * URL parameter name constants for v4 import configuration format.
 */
export const PARAM_NAMES = {
    SCHEME_VERSION: 'scheme_version',
    REGULAR_FILTERS: 'regular_filters',
    CUSTOM_FILTERS: 'custom_filters',
    STEALTH_ENABLED: 'stealth.enabled',
    STEALTH_HIDE_SEARCH_QUERIES: 'stealth.hide_search_queries',
    STEALTH_SEND_DNT: 'stealth.send_dnt',
    STEALTH_BLOCK_WEBRTC: 'stealth.block_webrtc',
    STEALTH_STRIP_URL: 'stealth.strip_url',
    STEALTH_BLOCK_TRACKERS: 'stealth.block_trackers',
    STEALTH_THIRD_PARTY_COOKIES_MIN: 'stealth.third_party_cookies_min',
    STEALTH_FIRST_PARTY_COOKIES_MIN: 'stealth.first_party_cookies_min',
    STEALTH_X_CLIENT: 'stealth.x_client',
    STEALTH_REFERRER: 'stealth.referrer',
    STEALTH_EXT_HIDE_REFERRER: 'stealth.ext_hide_referrer',
    BROWSING_SECURITY_ENABLED: 'browsing_security.enabled',
} as const;

/**
 * Mapping from v3 parameter names to v4 parameter names.
 * Used to normalise legacy links before processing.
 */
export const V3_TO_V4_PARAM_MAP: Record<string, string> = {
    'filters': 'regular_filters',
    'stealth.DNT': 'stealth.send_dnt',
    'stealth.webrtc': 'stealth.block_webrtc',
    'stealth.third_party_cookies': 'stealth.third_party_cookies_min',
    'stealth.first_party_cookies': 'stealth.first_party_cookies_min',
    'manifest_version': 'ext.manifest_version',
};

/**
 * Names of informational parameters that are not applied as settings,
 * only shown in the confirmation dialog for context.
 */
export const INFORMATIONAL_PARAM_NAMES = new Set([
    'product_type',
    'product_version',
    'system_version',
    'browser',
    'browser_detail',
    'user_agent',
    'url',
    'action',
    'from',
    'app',
    'filters_last_update',
    'license_type',
    'ext.manifest_version',
]);

/**
 * Supported scheme versions for the import URL format.
 */
export const SUPPORTED_SCHEME_VERSIONS = [3, 4] as const;

/**
 * Union of supported scheme version numbers.
 */
export type SchemeVersion = typeof SUPPORTED_SCHEME_VERSIONS[number];
