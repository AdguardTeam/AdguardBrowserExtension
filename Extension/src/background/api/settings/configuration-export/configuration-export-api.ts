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

import browser from 'webextension-polyfill';

import { AntiBannerFiltersId } from '../../../../common/constants';
import { SettingOption } from '../../../schema';
import { settingsStorage, filterStateStorage } from '../../../storages';
import { CustomFilterApi, type CustomFilterDTO } from '../../filters/custom';

/**
 * URL parameter names for the v3 share/export schema.
 */
const V3_EXPORT_PARAMS = {
    SCHEME_VERSION: 'scheme_version',
    PRODUCT_TYPE: 'product_type',
    PRODUCT_VERSION: 'product_version',
    MANIFEST_VERSION: 'manifest_version',
    FILTERS: 'filters',
    CUSTOM_FILTERS: 'custom_filters',
    BROWSING_SECURITY_ENABLED: 'browsing_security.enabled',
    STEALTH_ENABLED: 'stealth.enabled',
    STEALTH_HIDE_SEARCH_QUERIES: 'stealth.hide_search_queries',
    STEALTH_SEND_DNT: 'stealth.DNT',
    STEALTH_BLOCK_WEBRTC: 'stealth.webrtc',
    STEALTH_STRIP_URL: 'stealth.strip_url',
    STEALTH_BLOCK_TRACKERS: 'stealth.block_trackers',
    STEALTH_X_CLIENT: 'stealth.x_client',
    STEALTH_REFERRER: 'stealth.referrer',
    STEALTH_THIRD_PARTY_COOKIES: 'stealth.third_party_cookies',
    STEALTH_FIRST_PARTY_COOKIES: 'stealth.first_party_cookies',
} as const;

/**
 * Base class for collecting current extension settings as a flat
 * `Record<string, string>` suitable for building a share URL.
 *
 * MV2 and MV3 subclasses may extend this to include or exclude
 * platform-specific settings.
 */
export class ConfigurationExportApi {
    /**
     * Scheme version used for the share URL (v3 format).
     */
    private readonly schemeVersion = '3';

    /**
     * Collects the current extension settings and returns them as a flat
     * key-value map ready to be passed to `Forward.get()`.
     *
     * Keys use dot-notation matching the v3 schema (e.g. `stealth.enabled`).
     * Booleans are encoded as `'true'` or `'false'`. Filter IDs are
     * dot-separated. Individual values are pre-encoded so that
     * `Forward.get()` can concatenate them as-is.
     *
     * @returns Flat settings map for URL serialization.
     */
    public collectShareParams(): Record<string, string> {
        const params: Record<string, string> = {};

        const manifest = browser.runtime.getManifest();

        // Meta parameters.
        params[V3_EXPORT_PARAMS.SCHEME_VERSION] = this.schemeVersion;
        params[V3_EXPORT_PARAMS.PRODUCT_TYPE] = 'Ext';
        params[V3_EXPORT_PARAMS.PRODUCT_VERSION] = manifest.version;
        params[V3_EXPORT_PARAMS.MANIFEST_VERSION] = String(manifest.manifest_version);

        // Filters (dot-separated in v3).
        const enabledFilters = filterStateStorage.getEnabledFilters();
        if (enabledFilters.length > 0) {
            params[V3_EXPORT_PARAMS.FILTERS] = enabledFilters.join('.');
        }

        // Custom filters.
        const customFiltersParam = ConfigurationExportApi.encodeCustomFilters();
        if (customFiltersParam) {
            params[V3_EXPORT_PARAMS.CUSTOM_FILTERS] = customFiltersParam;
        }

        this.collectStealthParams(params);

        this.collectBrowsingSecurityParams(params);

        return params;
    }

    /**
     * Collects browsing security parameters.
     * Overridden in MV3 subclass to be a no-op.
     *
     * @param params Target params map to populate.
     */
    // eslint-disable-next-line class-methods-use-this
    protected collectBrowsingSecurityParams(params: Record<string, string>): void {
        const safebrowsingDisabled = settingsStorage.get(SettingOption.DisableSafebrowsing);
        params[V3_EXPORT_PARAMS.BROWSING_SECURITY_ENABLED] = ConfigurationExportApi.boolToParam(!safebrowsingDisabled);
    }

    /**
     * Collects stealth mode parameters into the given params map.
     *
     * @param params Target params map to populate.
     */
    protected collectStealthParams(params: Record<string, string>): void {
        const stealthDisabled = settingsStorage.get(SettingOption.DisableStealthMode);
        params[V3_EXPORT_PARAMS.STEALTH_ENABLED] = ConfigurationExportApi.boolToParam(!stealthDisabled);

        params[V3_EXPORT_PARAMS.STEALTH_HIDE_SEARCH_QUERIES] = ConfigurationExportApi.boolToParam(
            settingsStorage.get(SettingOption.HideSearchQueries),
        );

        params[V3_EXPORT_PARAMS.STEALTH_SEND_DNT] = ConfigurationExportApi.boolToParam(
            settingsStorage.get(SettingOption.SendDoNotTrack),
        );

        params[V3_EXPORT_PARAMS.STEALTH_BLOCK_WEBRTC] = ConfigurationExportApi.boolToParam(
            settingsStorage.get(SettingOption.BlockWebRTC),
        );

        params[V3_EXPORT_PARAMS.STEALTH_STRIP_URL] = ConfigurationExportApi.boolToParam(
            !!filterStateStorage.get(AntiBannerFiltersId.UrlTrackingFilterId)?.enabled,
        );

        params[V3_EXPORT_PARAMS.STEALTH_BLOCK_TRACKERS] = ConfigurationExportApi.boolToParam(
            !!filterStateStorage.get(AntiBannerFiltersId.TrackingFilterId)?.enabled,
        );

        params[V3_EXPORT_PARAMS.STEALTH_X_CLIENT] = ConfigurationExportApi.boolToParam(
            settingsStorage.get(SettingOption.RemoveXClientData),
        );

        // stealth.referrer is a presence-only flag: empty string means "hide referrer = on".
        // Omit entirely when hide referrer is off.
        const hideReferrer = settingsStorage.get(SettingOption.HideReferrer);
        if (hideReferrer) {
            params[V3_EXPORT_PARAMS.STEALTH_REFERRER] = '';
        }

        // Cookie self-destruct — overridden in MV3 subclass to be a no-op.
        this.collectCookieParams(params);
    }

    /**
     * Collects cookie self-destruct parameters.
     * Overridden in MV3 subclass to be a no-op.
     *
     * @param params Target params map to populate.
     */
    // eslint-disable-next-line class-methods-use-this
    protected collectCookieParams(params: Record<string, string>): void {
        const selfDestructThirdParty = settingsStorage.get(SettingOption.SelfDestructThirdPartyCookies);
        if (selfDestructThirdParty) {
            const time = settingsStorage.get(SettingOption.SelfDestructThirdPartyCookiesTime);
            params[V3_EXPORT_PARAMS.STEALTH_THIRD_PARTY_COOKIES] = String(time);
        }

        const selfDestructFirstParty = settingsStorage.get(SettingOption.SelfDestructFirstPartyCookies);
        if (selfDestructFirstParty) {
            const time = settingsStorage.get(SettingOption.SelfDestructFirstPartyCookiesTime);
            params[V3_EXPORT_PARAMS.STEALTH_FIRST_PARTY_COOKIES] = String(time);
        }
    }

    /**
     * Encodes all enabled custom filters into a single comma-separated string.
     * Each entry follows the format: `Title (url: URL)`, `(url: URL)`,
     * or just `Title`.
     *
     * Commas and other special characters within individual entries are
     * percent-encoded so that commas between entries serve as array separators.
     *
     * @returns Encoded custom filters string, or empty string if none.
     */
    private static encodeCustomFilters(): string {
        const filters = CustomFilterApi.getFiltersData();
        const enabledFilters = filters.filter((f) => f.enabled);

        if (enabledFilters.length === 0) {
            return '';
        }

        const entries = enabledFilters.map(ConfigurationExportApi.encodeCustomFilterEntry);

        return entries.join(',');
    }

    /**
     * Encodes a single custom filter into a percent-encoded string.
     *
     * The format is `Title (url: URL)`, `(url: URL)`, or just `Title`.
     * Commas and other special characters are percent-encoded so that
     * the comma between entries serves as the array separator.
     *
     * @param filter Custom filter data.
     *
     * @returns Percent-encoded entry string.
     */
    private static encodeCustomFilterEntry(
        filter: Pick<CustomFilterDTO, 'title' | 'customUrl'>,
    ): string {
        const title = filter.title || '';
        const url = filter.customUrl || '';

        let entry: string;

        if (title && url) {
            entry = `${title} (url: ${url})`;
        } else if (url) {
            entry = `(url: ${url})`;
        } else {
            entry = title;
        }

        return encodeURIComponent(entry);
    }

    /**
     * Converts a boolean to `'true'` or `'false'` for v3 schema encoding.
     *
     * @param value Boolean value.
     *
     * @returns `'true'` for true, `'false'` for false.
     */
    private static boolToParam(value: boolean): string {
        return value ? 'true' : 'false';
    }
}
