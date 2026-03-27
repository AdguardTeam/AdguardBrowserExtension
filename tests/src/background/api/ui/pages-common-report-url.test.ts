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

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { pagesApi } from '../../../../../Extension/src/background/api/ui/pages';
import { SettingsApi } from '../../../../../Extension/src/background/api/settings';
import { SettingOption } from '../../../../../Extension/src/background/schema';
import { settingsStorage } from '../../../../../Extension/src/background/storages';
import { FilterStateStorage } from '../../../../../Extension/src/background/storages/filter-state';
import { GroupStateStorage } from '../../../../../Extension/src/background/storages/group-state';
import { FiltersApi } from '../../../../../Extension/src/background/api/filters';
import { AntiBannerFiltersId } from '../../../../../Extension/src/common/constants';
import { ForwardFrom } from '../../../../../Extension/src/common/forward';
import { FilterUpdateService } from '../../../../../Extension/src/background/services/filter-update';

vi.mock('../../../../../Extension/src/background/storages/metadata');
vi.mock('../../../../../Extension/src/common/user-agent');

const WEBSITE_URL = 'https://example.com';

/**
 * Parses the TDS redirect URL and extracts query params forwarded to reports.adguard.com.
 * The generated URL has the form:
 *   https://link.adtidy.org/forward.html?action=report&from=...&app=...&<v4-params>
 *
 * @param reportUrl Full report URL returned by getIssueReportUrl().
 *
 * @returns URLSearchParams of the TDS redirect URL.
 */
const getReportParams = (reportUrl: string): URLSearchParams => {
    const url = new URL(reportUrl);
    return url.searchParams;
};

describe('Report URL v4 migration — getIssueReportUrl()', () => {
    const setupDefaultMocks = () => {
        vi.spyOn(FilterStateStorage.prototype, 'getEnabledFilters').mockReturnValue([]);
        vi.spyOn(GroupStateStorage.prototype, 'getEnabledGroups').mockReturnValue([]);
        vi.spyOn(GroupStateStorage.prototype, 'get').mockReturnValue({
            enabled: false,
            touched: false,
        });
        vi.spyOn(FiltersApi, 'getEnabledFilters').mockReturnValue([]);
        vi.spyOn(FilterUpdateService, 'getLastUpdateTimeMs').mockResolvedValue(null);
    };

    beforeEach(async () => {
        setupDefaultMocks();
        await SettingsApi.init();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('includes scheme_version=4', async () => {
        const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
        const params = getReportParams(url);

        expect(params.get('scheme_version')).toBe('4');
    });

    it('includes product_type=ext (lowercase)', async () => {
        const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
        const params = getReportParams(url);

        expect(params.get('product_type')).toBe('ext');
        expect(params.get('product_type')).not.toBe('Ext');
    });

    it('includes ext.manifest_version (namespaced, not flat manifest_version)', async () => {
        const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
        const params = getReportParams(url);

        expect(params.get('ext.manifest_version')).toBeDefined();
        expect(params.get('manifest_version')).toBeNull();
    });

    it('uses regular_filters with comma separator (not dot), renamed from "filters"', async () => {
        vi.spyOn(FiltersApi, 'getEnabledFilters').mockReturnValue([1, 2, 3]);

        const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
        const params = getReportParams(url);

        const regularFilters = params.get('regular_filters');

        expect(regularFilters).not.toBeNull();
        expect(params.get('filters')).toBeNull();

        // Comma-separated, not dot-separated
        expect(regularFilters!).toMatch(/^\d+(,\d+)*$/);
        expect(regularFilters!).not.toContain('.');

        const ids = regularFilters!.split(',').map(Number);

        expect(ids).toContain(1);
        expect(ids).toContain(2);
        expect(ids).toContain(3);
    });

    it('omits regular_filters when no filters are enabled', async () => {
        const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
        const params = getReportParams(url);

        expect(params.get('regular_filters')).toBeNull();
    });

    describe('stealth params', () => {
        it('emits stealth.enabled=0 when stealth mode is disabled', async () => {
            await SettingsApi.setSetting(SettingOption.DisableStealthMode, true);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            expect(params.get('stealth.enabled')).toBe('0');
        });

        it('emits stealth.enabled=1 when stealth mode is enabled', async () => {
            await SettingsApi.setSetting(SettingOption.DisableStealthMode, false);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            expect(params.get('stealth.enabled')).toBe('1');
        });

        it('uses stealth.send_dnt instead of stealth.DNT, with 1/0 value', async () => {
            await SettingsApi.setSetting(SettingOption.DisableStealthMode, false);
            await SettingsApi.setSetting(SettingOption.SendDoNotTrack, true);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            expect(params.get('stealth.send_dnt')).toBe('1');
            expect(params.get('stealth.DNT')).toBeNull();
        });

        it('uses stealth.block_webrtc instead of stealth.webrtc, with 1/0 value', async () => {
            await SettingsApi.setSetting(SettingOption.DisableStealthMode, false);
            await SettingsApi.setSetting(SettingOption.BlockWebRTC, true);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            expect(params.get('stealth.block_webrtc')).toBe('1');
            expect(params.get('stealth.webrtc')).toBeNull();
        });

        it('does not include stealth sub-options when stealth is disabled', async () => {
            await SettingsApi.setSetting(SettingOption.DisableStealthMode, true);
            await SettingsApi.setSetting(SettingOption.SendDoNotTrack, true);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            // When stealth is disabled, only stealth.enabled=0 is expected
            expect(params.get('stealth.enabled')).toBe('0');
            expect(params.get('stealth.send_dnt')).toBeNull();
        });

        it('emits stealth.referrer with empty string when hide referrer is enabled', async () => {
            await SettingsApi.setSetting(SettingOption.DisableStealthMode, false);
            await SettingsApi.setSetting(SettingOption.HideReferrer, true);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            expect(params.has('stealth.referrer')).toBe(true);
            expect(params.get('stealth.referrer')).toBe('');
            expect(params.get('stealth.ext_hide_referrer')).toBeNull();
            expect(params.get('stealth.hide_referrer')).toBeNull();
        });

        it('omits stealth.referrer when hide referrer is disabled', async () => {
            await SettingsApi.setSetting(SettingOption.DisableStealthMode, false);
            await SettingsApi.setSetting(SettingOption.HideReferrer, false);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            expect(params.has('stealth.referrer')).toBe(false);
        });

        it('uses stealth.x_client with 1/0 value', async () => {
            await SettingsApi.setSetting(SettingOption.DisableStealthMode, false);
            await SettingsApi.setSetting(SettingOption.RemoveXClientData, true);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            expect(params.get('stealth.x_client')).toBe('1');
        });

        it('uses stealth.hide_search_queries with 1/0 value', async () => {
            await SettingsApi.setSetting(SettingOption.DisableStealthMode, false);
            await SettingsApi.setSetting(SettingOption.HideSearchQueries, true);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            expect(params.get('stealth.hide_search_queries')).toBe('1');
        });

        it('includes stealth.block_trackers=1 when tracking filter is enabled', async () => {
            vi.spyOn(FiltersApi, 'getEnabledFilters').mockReturnValue(
                [AntiBannerFiltersId.TrackingFilterId],
            );

            await SettingsApi.setSetting(SettingOption.DisableStealthMode, false);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            expect(params.get('stealth.block_trackers')).toBe('1');
        });

        it('includes stealth.strip_url=1 when URL tracking filter is enabled', async () => {
            vi.spyOn(FiltersApi, 'getEnabledFilters').mockReturnValue(
                [AntiBannerFiltersId.UrlTrackingFilterId],
            );

            await SettingsApi.setSetting(SettingOption.DisableStealthMode, false);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            expect(params.get('stealth.strip_url')).toBe('1');
        });
    });

    describe('browsing security params', () => {
        it('includes browsing_security.enabled=1 when safe browsing is enabled (MV2)', async () => {
            await SettingsApi.setSetting(SettingOption.DisableSafebrowsing, false);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            // MV2 includes browsing_security.enabled; MV3 omits it
            if (!__IS_MV3__) {
                expect(params.get('browsing_security.enabled')).toBe('1');
            }
        });

        it('includes browsing_security.enabled=0 when safe browsing is disabled (MV2)', async () => {
            await SettingsApi.setSetting(SettingOption.DisableSafebrowsing, true);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            if (!__IS_MV3__) {
                expect(params.get('browsing_security.enabled')).toBe('0');
            }
        });
    });

    describe('boolean value format', () => {
        it('uses 1/0 booleans, not true/false strings', async () => {
            await SettingsApi.setSetting(SettingOption.DisableStealthMode, false);
            await SettingsApi.setSetting(SettingOption.SendDoNotTrack, true);
            await SettingsApi.setSetting(SettingOption.BlockWebRTC, false);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            // Verify no "true"/"false" strings appear in stealth param values
            params.forEach((value, key) => {
                if (key.startsWith('stealth.')) {
                    expect(value, `param "${key}" should use 1/0, not true/false`).not.toBe('true');
                    expect(value, `param "${key}" should use 1/0, not true/false`).not.toBe('false');
                }
            });
        });
    });

    describe('filters_last_update', () => {
        it('includes filters_last_update as ISO 8601 UTC timestamp when available', async () => {
            const testTimestampMs = new Date('2026-03-17T20:00:00Z').getTime();
            vi.spyOn(FilterUpdateService, 'getLastUpdateTimeMs').mockResolvedValue(testTimestampMs);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            const lastUpdate = params.get('filters_last_update');

            expect(lastUpdate).toBeDefined();
            expect(lastUpdate).toBe('2026-03-17T20:00:00Z');
        });

        it('omits filters_last_update when not available', async () => {
            vi.spyOn(FilterUpdateService, 'getLastUpdateTimeMs').mockResolvedValue(null);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            expect(params.get('filters_last_update')).toBeNull();
        });
    });

    describe('TDS redirect flow is preserved', () => {
        it('generates a link.adtidy.org/forward.html URL', async () => {
            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);

            expect(url).toContain('link.adtidy.org/forward.html');
        });

        it('includes app=browser_extension and from params', async () => {
            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Options);
            const params = getReportParams(url);

            expect(params.get('app')).toBe('browser_extension');
            expect(params.get('from')).toBe(ForwardFrom.Options);
        });

        it('does not contain "undefined" in any param value', async () => {
            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            params.forEach((value, key) => {
                expect(value, `param "${key}" should not be "undefined"`).not.toBe('undefined');
                expect(value, `param "${key}" should not be empty`).not.toBe('');
            });
        });
    });

    describe('cookie TTL conversion', () => {
        it.skipIf(__IS_MV3__)('converts third_party_cookies_min value (not ms)', async () => {
            await SettingsApi.setSetting(SettingOption.DisableStealthMode, false);
            await SettingsApi.setSetting(SettingOption.SelfDestructThirdPartyCookies, true);
            settingsStorage.set(SettingOption.SelfDestructThirdPartyCookiesTime, 30);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            expect(params.get('stealth.third_party_cookies_min')).toBeDefined();
            expect(params.get('stealth.third_party_cookies')).toBeNull();

            // Value should be the raw stored value (already in minutes in settings)
            const value = Number(params.get('stealth.third_party_cookies_min'));
            expect(value).toBe(30);
        });

        it.skipIf(__IS_MV3__)('converts first_party_cookies_min value (not ms)', async () => {
            await SettingsApi.setSetting(SettingOption.DisableStealthMode, false);
            await SettingsApi.setSetting(SettingOption.SelfDestructFirstPartyCookies, true);
            settingsStorage.set(SettingOption.SelfDestructFirstPartyCookiesTime, 15);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            expect(params.get('stealth.first_party_cookies_min')).toBeDefined();
            expect(params.get('stealth.first_party_cookies')).toBeNull();

            const value = Number(params.get('stealth.first_party_cookies_min'));
            expect(value).toBe(15);
        });

        it.skipIf(!__IS_MV3__)('omits cookie TTL params on MV3', async () => {
            await SettingsApi.setSetting(SettingOption.DisableStealthMode, false);

            const url = await pagesApi.getIssueReportUrl(WEBSITE_URL, ForwardFrom.Popup);
            const params = getReportParams(url);

            expect(params.get('stealth.third_party_cookies_min')).toBeNull();
            expect(params.get('stealth.first_party_cookies_min')).toBeNull();
        });
    });
});
