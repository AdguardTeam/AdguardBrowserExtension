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

import { logger } from '../../../../common/logger';
import { AntiBannerFiltersId, SEPARATE_ANNOYANCE_FILTER_IDS } from '../../../../common/constants';

import { type ImportConfiguration, type StealthImportConfig } from './types';
import { importConfigurationSchema } from './url-param-schema';
import {
    V3_TO_V4_PARAM_MAP,
    INFORMATIONAL_PARAM_NAMES,
    PARAM_NAMES,
    type SchemeVersion,
} from './param-mapping';

/**
 * Parses `adguard:import_user_configuration` URL query parameters and converts
 * them into a typed {@link ImportConfiguration} object.
 *
 * Supports both v3 (legacy) and v4 parameter formats.
 */
export class UrlParamParser {
    /**
     * Parses the URL query string from an import configuration link.
     *
     * @param queryString The raw query string (without leading `?`).
     *
     * @returns Parsed {@link ImportConfiguration}.
     */
    public static parse(queryString: string): ImportConfiguration {
        const params = new URLSearchParams(queryString);

        const rawEntries = Object.fromEntries(params.entries());

        const schemeVersion = UrlParamParser.parseSchemeVersion(rawEntries[PARAM_NAMES.SCHEME_VERSION]);

        const normalised = UrlParamParser.normaliseParams(rawEntries, schemeVersion);

        return UrlParamParser.buildConfig(normalised, schemeVersion);
    }

    /**
     * Determines the scheme version from the raw `scheme_version` parameter value.
     *
     * @param raw Raw string value of `scheme_version`, or undefined if absent.
     *
     * @returns `4` if the value is `"4"`, otherwise `3`.
     */
    private static parseSchemeVersion(raw: string | undefined): SchemeVersion {
        if (raw === '4') {
            return 4;
        }

        return 3;
    }

    /**
     * Normalises a v3 parameter map to v4 names and converts boolean values
     * from `"true"`/`"false"` to `"1"`/`"0"`.
     *
     * @param raw Raw key-value map from URLSearchParams.
     * @param schemeVersion Detected scheme version.
     *
     * @returns Normalised key-value map with v4 parameter names.
     */
    private static normaliseParams(
        raw: Record<string, string>,
        schemeVersion: SchemeVersion,
    ): Record<string, string> {
        const result: Record<string, string> = {};

        for (const [key, value] of Object.entries(raw)) {
            let normKey = key;
            let normValue = value;

            if (schemeVersion === 3) {
                const mapped = V3_TO_V4_PARAM_MAP[key];
                if (mapped) {
                    normKey = mapped;
                }

                if (normValue === 'true') {
                    normValue = '1';
                } else if (normValue === 'false') {
                    normValue = '0';
                }
            }

            result[normKey] = normValue;
        }

        return result;
    }

    /**
     * Parses a boolean from a `"1"`/`"0"` string value.
     *
     * @param value String value to parse.
     *
     * @returns `true` for `"1"`, `false` for `"0"`, `undefined` otherwise.
     */
    private static parseBool(value: string): boolean | undefined {
        if (value === '1') {
            return true;
        }

        if (value === '0') {
            return false;
        }

        return undefined;
    }

    /**
     * Parses a non-negative integer from a string.
     *
     * @param value String value to parse.
     *
     * @returns The parsed integer, or `undefined` if not a valid non-negative integer.
     */
    private static parseNonNegativeInt(value: string): number | undefined {
        const n = Number(value);

        if (!Number.isInteger(n) || n < 0) {
            return undefined;
        }

        return n;
    }

    /**
     * Parses a comma-separated (v4) or dot-separated (v3 fallback) list of filter IDs.
     * Non-numeric values are silently skipped.
     * Expands the Annoyances combined filter ID (14) to separate filter IDs (18–22).
     *
     * @param value Raw string value from the URL parameter.
     * @param schemeVersion Detected scheme version (affects separator).
     *
     * @returns Deduplicated array of valid filter IDs.
     */
    private static parseFilterIds(value: string, schemeVersion: SchemeVersion): number[] {
        const separator = schemeVersion === 3 ? '.' : ',';
        const parts = value.split(separator);

        const ids = new Set<number>();

        for (const part of parts) {
            const trimmed = part.trim();
            const id = Number(trimmed);

            if (!Number.isInteger(id) || id <= 0 || trimmed === '') {
                logger.debug(`[ext.UrlParamParser.parseFilterIds]: skipping non-numeric filter ID: "${trimmed}"`);
                continue;
            }

            // Backward compatibility: Filter 14 (Annoyances combined) was historically
            // a single filter that was split into 5 separate filters (18-22).
            // We expand 14→18-22 on import to support old report URLs, but never collapse
            // 18-22→14 on export because users may enable individual annoyance filters.
            if (id === AntiBannerFiltersId.AnnoyancesCombinedFilterId) {
                SEPARATE_ANNOYANCE_FILTER_IDS.forEach((separateId) => ids.add(separateId));
            } else {
                ids.add(id);
            }
        }

        return Array.from(ids);
    }

    /**
     * Parses custom filters from a comma-separated list of `Title (url: URL)` entries.
     * Entries that do not match the expected format are silently skipped.
     *
     * @param value Raw string value from the `custom_filters` URL parameter.
     *
     * @returns Array of parsed custom filter objects.
     */
    private static parseCustomFilters(value: string): Array<{ title: string; url: string }> {
        const results: Array<{ title: string; url: string }> = [];

        // NOTE: entries are split on literal commas. The spec requires that commas
        // in filter titles are percent-encoded as %2C in the raw URL, so by the time
        // this method is called (after URLSearchParams decoding), literal commas are
        // always entry separators. URLs must not contain literal commas either.
        const entries = value.split(',');

        for (const entry of entries) {
            const trimmed = entry.trim();

            const urlMarker = '(url:';
            const urlMarkerIdx = trimmed.lastIndexOf(urlMarker);
            const hasUrlPart = urlMarkerIdx !== -1 && trimmed.endsWith(')');

            const title = hasUrlPart
                ? trimmed.slice(0, urlMarkerIdx).trimEnd()
                : trimmed;

            const url = hasUrlPart
                ? trimmed.slice(urlMarkerIdx + urlMarker.length, trimmed.length - 1).trim()
                : '';

            if (!url) {
                continue;
            }

            try {
                const parsed = new URL(url);
                if (!parsed.href) {
                    throw new Error('empty href');
                }
            } catch {
                logger.debug(`[ext.UrlParamParser.parseCustomFilters]: skipping custom_filters entry with invalid URL: "${url}"`);
                continue;
            }

            results.push({ title, url });
        }

        return results;
    }

    /**
     * Builds the {@link ImportConfiguration} from the normalised parameter map.
     *
     * @param params Normalised v4 key-value map.
     * @param schemeVersion Detected scheme version.
     *
     * @returns Parsed {@link ImportConfiguration}.
     */
    private static buildConfig(
        params: Record<string, string>,
        schemeVersion: SchemeVersion,
    ): ImportConfiguration {
        const regularFiltersParam = params[PARAM_NAMES.REGULAR_FILTERS];
        const regularFilters: number[] = regularFiltersParam
            ? UrlParamParser.parseFilterIds(regularFiltersParam, schemeVersion)
            : [];

        const customFiltersParam = params[PARAM_NAMES.CUSTOM_FILTERS];
        const customFilters = customFiltersParam
            ? UrlParamParser.parseCustomFilters(customFiltersParam)
            : [];

        const stealth: Partial<StealthImportConfig> = {};

        const stealthEnabledParam = params[PARAM_NAMES.STEALTH_ENABLED];
        if (stealthEnabledParam !== undefined) {
            stealth.enabled = UrlParamParser.parseBool(stealthEnabledParam);
        }

        const hideSearchQueriesParam = params[PARAM_NAMES.STEALTH_HIDE_SEARCH_QUERIES];
        if (hideSearchQueriesParam !== undefined) {
            stealth.hideSearchQueries = UrlParamParser.parseBool(hideSearchQueriesParam);
        }

        const sendDntParam = params[PARAM_NAMES.STEALTH_SEND_DNT];
        if (sendDntParam !== undefined) {
            stealth.sendDnt = UrlParamParser.parseBool(sendDntParam);
        }

        const blockWebrtcParam = params[PARAM_NAMES.STEALTH_BLOCK_WEBRTC];
        if (blockWebrtcParam !== undefined) {
            stealth.blockWebrtc = UrlParamParser.parseBool(blockWebrtcParam);
        }

        const stripUrlParam = params[PARAM_NAMES.STEALTH_STRIP_URL];
        if (stripUrlParam !== undefined) {
            stealth.stripUrl = UrlParamParser.parseBool(stripUrlParam);
        }

        const blockTrackersParam = params[PARAM_NAMES.STEALTH_BLOCK_TRACKERS];
        if (blockTrackersParam !== undefined) {
            stealth.blockTrackers = UrlParamParser.parseBool(blockTrackersParam);
        }

        const thirdPartyCookiesMinParam = params[PARAM_NAMES.STEALTH_THIRD_PARTY_COOKIES_MIN];
        if (thirdPartyCookiesMinParam !== undefined) {
            stealth.thirdPartyCookiesMin = UrlParamParser.parseNonNegativeInt(thirdPartyCookiesMinParam);
        }

        const firstPartyCookiesMinParam = params[PARAM_NAMES.STEALTH_FIRST_PARTY_COOKIES_MIN];
        if (firstPartyCookiesMinParam !== undefined) {
            stealth.firstPartyCookiesMin = UrlParamParser.parseNonNegativeInt(firstPartyCookiesMinParam);
        }

        const xClientParam = params[PARAM_NAMES.STEALTH_X_CLIENT];
        if (xClientParam !== undefined) {
            stealth.xClient = UrlParamParser.parseBool(xClientParam);
        }

        // v4: stealth.referrer is a presence-only flag — the extension always exports it as an
        // empty string ("") and treats its presence as "hide referrer = true". It is NOT the
        // same as the desktop stealth.referrer string (custom referrer URL value); the extension
        // does not support custom referrer replacement, only stripping the header entirely.
        const stealthReferrerParam = params[PARAM_NAMES.STEALTH_REFERRER];
        if (stealthReferrerParam !== undefined) {
            stealth.hideReferrer = true;
        }

        // v3: stealth.ext_hide_referrer is an explicit extension-only boolean. It is intentionally
        // NOT mapped through V3_TO_V4_PARAM_MAP to stealth.referrer because the two params have
        // different semantics (see above). Parsed directly here so that false → hideReferrer=false.
        const extHideReferrerParam = params[PARAM_NAMES.STEALTH_EXT_HIDE_REFERRER];
        if (extHideReferrerParam !== undefined) {
            stealth.hideReferrer = UrlParamParser.parseBool(extHideReferrerParam);
        }

        let browsingSecurity: { enabled: boolean } | undefined;
        const browsingSecurityEnabledParam = params[PARAM_NAMES.BROWSING_SECURITY_ENABLED];
        if (browsingSecurityEnabledParam !== undefined) {
            const val = UrlParamParser.parseBool(browsingSecurityEnabledParam);

            if (val !== undefined) {
                browsingSecurity = { enabled: val };
            }
        }

        const informational: Record<string, string> = {};
        for (const [key, value] of Object.entries(params)) {
            if (INFORMATIONAL_PARAM_NAMES.has(key)) {
                informational[key] = value;
            }
        }

        // Zod is used here only for validation, not parsing. All URL parameter values
        // arrive as raw strings and require domain-specific helpers (parseBool,
        // parseNonNegativeInt, parseFilterIds with v3→v4 remapping, etc.) that cannot
        // be expressed cleanly as Zod transforms. The manual parsing above converts
        // strings to typed values; this call confirms the resulting object satisfies
        // the expected shape before it propagates further.
        return importConfigurationSchema.parse({
            schemeVersion,
            regularFilters,
            customFilters,
            stealth,
            browsingSecurity,
            informational,
        });
    }
}
