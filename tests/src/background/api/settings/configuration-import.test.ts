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
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
} from 'vitest';
import { configurationImportApi } from 'configuration-import-api';

import {
    UrlParamParser,
} from '../../../../../Extension/src/background/api/settings/configuration-import/url-param-parser';
import { SEPARATE_ANNOYANCE_FILTER_IDS } from '../../../../../Extension/src/common/constants';
import { SettingsApi } from '../../../../../Extension/src/background/api/settings';

const { mockIsUserScriptsApiSupported } = vi.hoisted(() => ({
    mockIsUserScriptsApiSupported: vi.fn(() => true),
}));

vi.mock('../../../../../Extension/src/common/user-scripts-api/user-scripts-api-mv3', () => ({
    isUserScriptsApiSupported: mockIsUserScriptsApiSupported,
}));

describe('UrlParamParser', () => {
    describe('v4 scheme parsing', () => {
        it('parses regular_filters as comma-separated IDs', () => {
            const result = UrlParamParser.parse('scheme_version=4&regular_filters=2,3,14');

            expect(result.schemeVersion).toBe(4);
            expect(result.regularFilters).toContain(2);
            expect(result.regularFilters).toContain(3);
        });

        it('expands the combined annoyances filter ID 14 into separate IDs', () => {
            const result = UrlParamParser.parse('scheme_version=4&regular_filters=14');

            expect(result.regularFilters).not.toContain(14);
            SEPARATE_ANNOYANCE_FILTER_IDS.forEach((id) => {
                expect(result.regularFilters).toContain(id);
            });
        });

        it('parses stealth boolean params as true for "1"', () => {
            const result = UrlParamParser.parse(
                'scheme_version=4&stealth.enabled=1&stealth.hide_search_queries=1&stealth.send_dnt=0',
            );

            expect(result.stealth.enabled).toBe(true);
            expect(result.stealth.hideSearchQueries).toBe(true);
            expect(result.stealth.sendDnt).toBe(false);
        });

        it('parses stealth cookie TTL as non-negative integer', () => {
            const result = UrlParamParser.parse(
                'scheme_version=4&stealth.third_party_cookies_min=30&stealth.first_party_cookies_min=0',
            );

            expect(result.stealth.thirdPartyCookiesMin).toBe(30);
            expect(result.stealth.firstPartyCookiesMin).toBe(0);
        });

        it('parses browsing_security.enabled', () => {
            const result = UrlParamParser.parse('scheme_version=4&browsing_security.enabled=1');

            expect(result.browsingSecurity).toEqual({ enabled: true });
        });

        it('parses custom_filters with title and url', () => {
            const result = UrlParamParser.parse(
                'scheme_version=4&custom_filters=My Filter (url: https://example.com/filter.txt)',
            );

            expect(result.customFilters).toHaveLength(1);
            expect(result.customFilters[0]).toEqual({ title: 'My Filter', url: 'https://example.com/filter.txt' });
        });

        it('skips custom_filters entries with invalid URL', () => {
            const result = UrlParamParser.parse(
                'scheme_version=4&custom_filters=Bad (url: not-a-url)',
            );

            expect(result.customFilters).toHaveLength(0);
        });

        it('deduplicates filter IDs', () => {
            const result = UrlParamParser.parse('scheme_version=4&regular_filters=2,2,3');

            expect(result.regularFilters.filter((id) => id === 2)).toHaveLength(1);
        });

        it('skips non-numeric filter IDs without throwing', () => {
            const result = UrlParamParser.parse('scheme_version=4&regular_filters=abc,2,foo');

            expect(result.regularFilters).toEqual([2]);
        });

        it('ignores non-extension params (e.g. dns.*, win.*)', () => {
            const result = UrlParamParser.parse(
                'scheme_version=4&regular_filters=2&dns.enabled=1&win.setting=1',
            );

            expect(result.regularFilters).toEqual([2]);
            expect(result.informational['dns.enabled']).toBeUndefined();
        });

        it('collects informational params', () => {
            const result = UrlParamParser.parse(
                'scheme_version=4&regular_filters=2&url=https%3A%2F%2Fexample.com&product_type=ext',
            );

            expect(result.informational['url']).toBeDefined();
            expect(result.informational['product_type']).toBeDefined();
        });
    });

    describe('v3 scheme parsing (legacy)', () => {
        it('detects v3 when scheme_version is absent', () => {
            const result = UrlParamParser.parse('filters=2.3.4');

            expect(result.schemeVersion).toBe(3);
        });

        it('maps v3 "filters" to regularFilters with dot separator', () => {
            const result = UrlParamParser.parse('filters=2.3.4');

            expect(result.regularFilters).toEqual(expect.arrayContaining([2, 3, 4]));
        });

        it('converts v3 "true"/"false" booleans to actual booleans', () => {
            const result = UrlParamParser.parse('stealth.block_webrtc=true&stealth.DNT=false');

            expect(result.stealth.blockWebrtc).toBe(true);
            expect(result.stealth.sendDnt).toBe(false);
        });

        it('maps v3 stealth.DNT to stealth.sendDnt', () => {
            const result = UrlParamParser.parse('stealth.DNT=true');

            expect(result.stealth.sendDnt).toBe(true);
        });

        it('maps v3 stealth.webrtc to stealth.blockWebrtc', () => {
            const result = UrlParamParser.parse('stealth.webrtc=true');

            expect(result.stealth.blockWebrtc).toBe(true);
        });

        it('expands combined annoyances filter ID 14 in v3 dot-separated list', () => {
            const result = UrlParamParser.parse('filters=14');

            expect(result.regularFilters).not.toContain(14);
            SEPARATE_ANNOYANCE_FILTER_IDS.forEach((id) => {
                expect(result.regularFilters).toContain(id);
            });
        });
    });

    describe('edge cases', () => {
        it('returns empty config for empty query string', () => {
            const result = UrlParamParser.parse('');

            expect(result.regularFilters).toHaveLength(0);
            expect(result.customFilters).toHaveLength(0);
            expect(result.stealth).toEqual({});
            expect(result.browsingSecurity).toBeUndefined();
        });

        it('ignores invalid browsing_security.enabled value', () => {
            const result = UrlParamParser.parse('scheme_version=4&browsing_security.enabled=maybe');

            expect(result.browsingSecurity).toBeUndefined();
        });

        it('ignores invalid cookie TTL (negative float)', () => {
            const result = UrlParamParser.parse('scheme_version=4&stealth.third_party_cookies_min=-1');

            expect(result.stealth.thirdPartyCookiesMin).toBeUndefined();
        });
    });
});

describe('ConfigurationImportApi', () => {
    describe('hasApplicableSettings', () => {
        it('returns true when regularFilters is non-empty', () => {
            const config = UrlParamParser.parse('scheme_version=4&regular_filters=2');

            expect(configurationImportApi.hasApplicableSettings(config)).toBe(true);
        });

        it('returns true when customFilters is non-empty', () => {
            const config = UrlParamParser.parse(
                'scheme_version=4&custom_filters=My Filter (url: https://example.com/f.txt)',
            );

            expect(configurationImportApi.hasApplicableSettings(config)).toBe(true);
        });

        it('returns true when stealth settings are present', () => {
            const config = UrlParamParser.parse('scheme_version=4&stealth.enabled=1');

            expect(configurationImportApi.hasApplicableSettings(config)).toBe(true);
        });

        it.skipIf(__IS_MV3__)('returns true when browsingSecurity is set (MV2 only)', () => {
            const config = UrlParamParser.parse('scheme_version=4&browsing_security.enabled=1');

            expect(configurationImportApi.hasApplicableSettings(config)).toBe(true);
        });

        it('returns false when only informational/unknown params are present', () => {
            const config = UrlParamParser.parse('scheme_version=4&url=https%3A%2F%2Fexample.com&product_type=ext');

            expect(configurationImportApi.hasApplicableSettings(config)).toBe(false);
        });
    });

    describe.skipIf(!__IS_MV3__)('hasApplicableSettings — MV3 ignores browsingSecurity and cookie TTLs', () => {
        it('returns false when only browsingSecurity is set', () => {
            const config = UrlParamParser.parse('scheme_version=4&browsing_security.enabled=1');

            expect(configurationImportApi.hasApplicableSettings(config)).toBe(false);
        });

        it('returns false when only cookie TTL params are set', () => {
            const config = UrlParamParser.parse(
                'scheme_version=4&stealth.third_party_cookies_min=30&stealth.first_party_cookies_min=15',
            );

            expect(configurationImportApi.hasApplicableSettings(config)).toBe(false);
        });

        it('returns false when only browsingSecurity and cookie TTLs are set', () => {
            const config = UrlParamParser.parse(
                'scheme_version=4&browsing_security.enabled=1'
                + '&stealth.third_party_cookies_min=30&stealth.first_party_cookies_min=15',
            );

            expect(configurationImportApi.hasApplicableSettings(config)).toBe(false);
        });

        it('returns true when MV3-applicable stealth settings accompany unsupported ones', () => {
            const config = UrlParamParser.parse(
                'scheme_version=4&stealth.enabled=1&stealth.third_party_cookies_min=30'
                + '&browsing_security.enabled=1',
            );

            expect(configurationImportApi.hasApplicableSettings(config)).toBe(true);
        });
    });
});

describe('UrlParamParser — stealth.referrer / stealth.ext_hide_referrer (hide referrer)', () => {
    it('sets hideReferrer=true when v4 stealth.referrer is present (empty value)', () => {
        const config = UrlParamParser.parse('scheme_version=4&stealth.referrer=');

        expect(config.stealth.hideReferrer).toBe(true);
    });

    it('sets hideReferrer=true when v4 stealth.referrer has a non-empty value', () => {
        const config = UrlParamParser.parse('scheme_version=4&stealth.referrer=somevalue');

        expect(config.stealth.hideReferrer).toBe(true);
    });

    it('leaves hideReferrer undefined when v4 stealth.referrer is absent', () => {
        const config = UrlParamParser.parse('scheme_version=4&stealth.enabled=1');

        expect(config.stealth.hideReferrer).toBeUndefined();
    });

    it('maps v3 stealth.ext_hide_referrer=true to hideReferrer=true', () => {
        const config = UrlParamParser.parse('stealth.ext_hide_referrer=true');

        expect(config.stealth.hideReferrer).toBe(true);
    });

    it('maps v3 stealth.ext_hide_referrer=false to hideReferrer=false', () => {
        const config = UrlParamParser.parse('stealth.ext_hide_referrer=false');

        expect(config.stealth.hideReferrer).toBe(false);
    });

    it('v3 stealth.ext_hide_referrer does not bleed into stealth.referrer normalisation', () => {
        const config = UrlParamParser.parse('stealth.ext_hide_referrer=false');

        expect(config.stealth.hideReferrer).toBe(false);
    });
});

describe('UrlParamParser — real-world config examples from docs', () => {
    it('parses Windows v3 example correctly', () => {
        const qs = 'scheme_version=3&product_type=Win&product_version=7.15.2'
            + '&system_version=Microsoft%20Windows%2011&url=https%3A%2F%2Fexample.com'
            + '&filters=2.3.4.224&filters_last_update=2025-10-31-12-00-00'
            + '&custom_filters=User%20rules%20(url%3A%20none)'
            + '&browsing_security.enabled=true&stealth.enabled=true'
            + '&stealth.block_trackers=true&stealth.strip_url=true'
            + '&stealth.hide_search_queries=true&stealth.x_client=true'
            + '&stealth.block_webrtc=true&stealth.send_dnt=true'
            + '&stealth.first_party_cookies=15&stealth.third_party_cookies=30';

        const result = UrlParamParser.parse(qs);

        expect(result.schemeVersion).toBe(3);

        // filters=2.3.4.224 parsed as dot-separated
        expect(result.regularFilters).toContain(2);
        expect(result.regularFilters).toContain(3);
        expect(result.regularFilters).toContain(4);
        expect(result.regularFilters).toContain(224);

        // boolean "true"/"false" converted to actual booleans
        expect(result.stealth.enabled).toBe(true);
        expect(result.stealth.blockTrackers).toBe(true);
        expect(result.stealth.stripUrl).toBe(true);
        expect(result.stealth.hideSearchQueries).toBe(true);
        expect(result.stealth.xClient).toBe(true);
        expect(result.stealth.blockWebrtc).toBe(true);
        expect(result.stealth.sendDnt).toBe(true);

        // v3 cookie names mapped to _min variants
        expect(result.stealth.thirdPartyCookiesMin).toBe(30);
        expect(result.stealth.firstPartyCookiesMin).toBe(15);

        expect(result.browsingSecurity).toEqual({ enabled: true });

        // informational params collected
        expect(result.informational['product_type']).toBe('Win');
        expect(result.informational['url']).toBe('https://example.com');
    });

    it('parses macOS v3 example correctly', () => {
        const qs = 'scheme_version=3&product_type=Mac&product_version=2.14.0'
            + '&system_version=macOS%2015.0&url=https%3A%2F%2Fads.example.com'
            + '&filters=2.4.5.50&filters_last_update=2025-10-31-10-00-00'
            + '&custom_filters=Custom%20List%20(url%3A%20https%3A%2F%2Fexample.org%2Ffilter.txt)'
            + '&browsing_security.enabled=true&stealth.enabled=true'
            + '&stealth.block_trackers=true&stealth.strip_url=true'
            + '&stealth.hide_search_queries=true&stealth.send_dnt=true'
            + '&stealth.block_webrtc=true';

        const result = UrlParamParser.parse(qs);

        expect(result.schemeVersion).toBe(3);
        expect(result.regularFilters).toEqual(expect.arrayContaining([2, 4, 5, 50]));
        expect(result.stealth.enabled).toBe(true);
        expect(result.stealth.blockTrackers).toBe(true);
        expect(result.stealth.stripUrl).toBe(true);
        expect(result.stealth.blockWebrtc).toBe(true);
        expect(result.stealth.sendDnt).toBe(true);
        expect(result.browsingSecurity).toEqual({ enabled: true });

        // Custom filter with valid URL is included
        expect(result.customFilters).toHaveLength(1);
        expect(result.customFilters[0]?.url).toBe('https://example.org/filter.txt');
        expect(result.customFilters[0]?.title).toBe('Custom List');
    });

    it('parses Android v3 example correctly', () => {
        const qs = 'scheme_version=3&product_type=And&product_version=4.3'
            + '&system_version=Android%2015&url=https%3A%2F%2Fexample.org'
            + '&filters=2.3.4.200&browsing_security.enabled=true'
            + '&stealth.enabled=true&stealth.block_trackers=true'
            + '&stealth.strip_url=true&stealth.block_webrtc=true&stealth.send_dnt=true';

        const result = UrlParamParser.parse(qs);

        expect(result.schemeVersion).toBe(3);
        expect(result.regularFilters).toEqual(expect.arrayContaining([2, 3, 4, 200]));
        expect(result.stealth.enabled).toBe(true);
        expect(result.stealth.blockTrackers).toBe(true);
        expect(result.stealth.stripUrl).toBe(true);
        expect(result.browsingSecurity).toEqual({ enabled: true });

        // android.* params are not extension params — ignored
        expect(Object.keys(result.stealth)).not.toContain('android');
    });

    it('parses iOS v3 example correctly', () => {
        const qs = 'scheme_version=3&product_type=iOS&product_version=4.5.1'
            + '&system_version=iOS%2018.0&url=https%3A%2F%2Fnews.example.com'
            + '&filters=2.3.4.205&browsing_security.enabled=true'
            + '&stealth.enabled=true&stealth.block_trackers=true'
            + '&stealth.strip_url=true&stealth.send_dnt=true';

        const result = UrlParamParser.parse(qs);

        expect(result.schemeVersion).toBe(3);
        expect(result.regularFilters).toEqual(expect.arrayContaining([2, 3, 4, 205]));
        expect(result.stealth.enabled).toBe(true);
        expect(result.stealth.sendDnt).toBe(true);
        expect(result.browsingSecurity).toEqual({ enabled: true });
    });

    it('ignores win.*, dns.*, android.*, parental_control.* params', () => {
        const qs = 'scheme_version=3'
            + '&regular_filters=2'
            + '&dns.enabled=1&dns.servers=System&dns.timeout=5000'
            + '&win.wfp=true&win.disable_windows_defender=true'
            + '&android.mode=VPN&android.https_filtering=true'
            + '&parental_control.enabled=true&parental_control.safe_search=true';

        const result = UrlParamParser.parse(qs);

        // Only extension-relevant params are present
        expect(result.regularFilters).toEqual([2]);
        expect(result.stealth).toEqual({});
        expect(result.browsingSecurity).toBeUndefined();

        // None of the foreign-namespace params bleed into informational or stealth
        const allKeys = [
            ...Object.keys(result.stealth),
            ...Object.keys(result.informational),
        ];

        expect(allKeys.some((k) => k.startsWith('dns.'))).toBe(false);
        expect(allKeys.some((k) => k.startsWith('win.'))).toBe(false);
        expect(allKeys.some((k) => k.startsWith('android.'))).toBe(false);
        expect(allKeys.some((k) => k.startsWith('parental_control.'))).toBe(false);
    });

    // Regression test for: importing a URL with stealth.block_webrtc=1 must expose
    // blockWebrtc=true so that the options page can request the optional 'privacy'
    // permission before applying the config. Without this the background would try
    // to call setDisableWebRTC without the permission and throw
    // "[tsweb.StealthService.setDisableWebRTC]: permissions are not granted: privacy".
    it('parses real-world block_webrtc import URL and exposes blockWebrtc=true', () => {
        const qs = 'product_type=3ext&filters=2'
            + '&stealth.enabled=true&stealth.first_party_cookies_min=42'
            + '&stealth.block_webrtc=1&stealth.send_dnt=1'
            + '&stealth.third_party_cookies_min=9999';

        const result = UrlParamParser.parse(qs);

        expect(result.stealth.blockWebrtc).toBe(true);
        expect(result.stealth.enabled).toBe(true);
        expect(result.stealth.sendDnt).toBe(true);
        expect(result.stealth.firstPartyCookiesMin).toBe(42);
        expect(result.stealth.thirdPartyCookiesMin).toBe(9999);
    });
});

describe.skipIf(!__IS_MV3__)('MV3 — custom filters gated by User Scripts API', () => {
    afterEach(() => {
        mockIsUserScriptsApiSupported.mockReturnValue(true);
    });

    describe('hasApplicableSettings', () => {
        it('returns true for custom filters when User Scripts API is enabled', () => {
            mockIsUserScriptsApiSupported.mockReturnValue(true);

            const config = UrlParamParser.parse(
                'scheme_version=4&custom_filters=My Filter (url: https://example.com/f.txt)',
            );

            expect(configurationImportApi.hasApplicableSettings(config)).toBe(true);
        });

        it('returns false when only custom filters are present and User Scripts API is disabled', () => {
            mockIsUserScriptsApiSupported.mockReturnValue(false);

            const config = UrlParamParser.parse(
                'scheme_version=4&custom_filters=My Filter (url: https://example.com/f.txt)',
            );

            expect(configurationImportApi.hasApplicableSettings(config)).toBe(false);
        });

        it('returns true when other settings accompany custom filters and User Scripts API is disabled', () => {
            mockIsUserScriptsApiSupported.mockReturnValue(false);

            const config = UrlParamParser.parse(
                'scheme_version=4&regular_filters=2&custom_filters=My Filter (url: https://example.com/f.txt)',
            );

            expect(configurationImportApi.hasApplicableSettings(config)).toBe(true);
        });
    });

    describe('applyConfig', () => {
        afterEach(() => {
            vi.restoreAllMocks();
            mockIsUserScriptsApiSupported.mockReturnValue(true);
        });

        it('strips custom filters from config when User Scripts API is disabled', async () => {
            mockIsUserScriptsApiSupported.mockReturnValue(false);
            vi.spyOn(SettingsApi, 'import').mockResolvedValue(true);

            const config = UrlParamParser.parse(
                'scheme_version=4&regular_filters=2'
                + '&custom_filters=My Filter (url: https://example.com/f.txt)',
            );
            await configurationImportApi.applyConfig(config);

            const calls = vi.mocked(SettingsApi.import).mock.calls;
            const imported = JSON.parse(calls[0]![0]);

            expect(imported['filters']['custom-filters']).toHaveLength(0);
            expect(imported['filters']['enabled-groups']).not.toContain(0);
        });

        it('includes custom filters in config when User Scripts API is enabled', async () => {
            mockIsUserScriptsApiSupported.mockReturnValue(true);
            vi.spyOn(SettingsApi, 'import').mockResolvedValue(true);

            const config = UrlParamParser.parse(
                'scheme_version=4&regular_filters=2'
                + '&custom_filters=My Filter (url: https://example.com/f.txt)',
            );
            await configurationImportApi.applyConfig(config);

            const calls = vi.mocked(SettingsApi.import).mock.calls;
            const imported = JSON.parse(calls[0]![0]);

            expect(imported['filters']['custom-filters']).toHaveLength(1);
            expect(imported['filters']['custom-filters'][0].customUrl).toBe('https://example.com/f.txt');
            expect(imported['filters']['enabled-groups']).toContain(0);
        });
    });
});

describe('ConfigurationImportApi.applyConfig — full-replace semantics', () => {
    beforeEach(() => {
        vi.spyOn(SettingsApi, 'import').mockResolvedValue(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const getImportedConfig = (): ReturnType<typeof JSON.parse> => {
        const calls = vi.mocked(SettingsApi.import).mock.calls;

        expect(calls.length).toBeGreaterThan(0);

        return JSON.parse(calls[0]![0]);
    };

    describe('filters — full replace', () => {
        it('includes filters listed in the URL in enabled-filters', async () => {
            const config = UrlParamParser.parse('scheme_version=4&regular_filters=2,3');
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['filters']['enabled-filters']).toEqual(expect.arrayContaining([2, 3]));
        });

        it('does not include filters absent from URL (full-replace)', async () => {
            const config = UrlParamParser.parse('scheme_version=4&regular_filters=2');
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['filters']['enabled-filters']).toEqual(expect.arrayContaining([2]));
            expect(imported['filters']['enabled-filters']).not.toContain(1);
            expect(imported['filters']['enabled-filters']).not.toContain(5);
        });

        it('passes empty enabled-filters when URL has no regular_filters', async () => {
            const config = UrlParamParser.parse('scheme_version=4&stealth.enabled=1');
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['filters']['enabled-filters']).toHaveLength(0);
        });

        it('replaces custom-filters with those from the URL', async () => {
            const config = UrlParamParser.parse(
                'scheme_version=4&custom_filters=New (url: https://example.com/new.txt)',
            );
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['filters']['custom-filters']).toHaveLength(1);
            expect(imported['filters']['custom-filters'][0].customUrl).toBe('https://example.com/new.txt');
            expect(imported['filters']['custom-filters'][0].trusted).toBe(true);
        });

        it('enables custom-filters group (id=0) when custom filters are present', async () => {
            const config = UrlParamParser.parse(
                'scheme_version=4&custom_filters=My List (url: https://example.com/f.txt)',
            );
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['filters']['enabled-groups']).toContain(0);
        });

        it('does not add custom-filters group when no custom filters are present', async () => {
            const config = UrlParamParser.parse('scheme_version=4&regular_filters=2');
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['filters']['enabled-groups']).not.toContain(0);
        });

        it('passes empty custom-filters when URL has none', async () => {
            const config = UrlParamParser.parse('scheme_version=4&regular_filters=2');
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['filters']['custom-filters']).toHaveLength(0);
        });
    });

    describe('stealth — full replace', () => {
        it('sets disable-stealth-mode=true when stealth.enabled is absent from URL', async () => {
            const config = UrlParamParser.parse('scheme_version=4&regular_filters=2');
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['stealth']['stealth-disable-stealth-mode']).toBe(true);
        });

        it('sets disable-stealth-mode=false when stealth.enabled=1', async () => {
            const config = UrlParamParser.parse('scheme_version=4&stealth.enabled=1');
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['stealth']['stealth-disable-stealth-mode']).toBe(false);
        });

        it('sets stealth sub-options to false (defaults) when absent from URL', async () => {
            const config = UrlParamParser.parse('scheme_version=4&stealth.enabled=1');
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['stealth']['stealth-send-do-not-track']).toBe(false);
            expect(imported['stealth']['stealth-block-webrtc']).toBe(false);
            expect(imported['stealth']['stealth-hide-search-queries']).toBe(false);
        });

        it('sets stealth sub-options from URL values', async () => {
            const config = UrlParamParser.parse(
                'scheme_version=4&stealth.enabled=1&stealth.send_dnt=1&stealth.block_webrtc=1',
            );
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['stealth']['stealth-send-do-not-track']).toBe(true);
            expect(imported['stealth']['stealth-block-webrtc']).toBe(true);
        });

        it('adds TrackingFilterId to enabled-filters when blockTrackers=true', async () => {
            const config = UrlParamParser.parse('scheme_version=4&stealth.block_trackers=1');
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['filters']['enabled-filters']).toContain(3);
            expect(imported['stealth']['block-known-trackers']).toBe(true);
        });

        it('adds UrlTrackingFilterId to enabled-filters when stripUrl=true', async () => {
            const config = UrlParamParser.parse('scheme_version=4&stealth.strip_url=1');
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['filters']['enabled-filters']).toContain(17);
            expect(imported['stealth']['strip-tracking-parameters']).toBe(true);
        });
    });

    describe('stealth.block_webrtc — privacy permission pathway', () => {
        it('parses stealth.block_webrtc=1 (v4) and exposes blockWebrtc=true for permission check', () => {
            const config = UrlParamParser.parse('scheme_version=4&stealth.block_webrtc=1');

            expect(config.stealth.blockWebrtc).toBe(true);
        });

        it('parses v3 stealth.webrtc=true and exposes blockWebrtc=true for permission check', () => {
            const config = UrlParamParser.parse('stealth.webrtc=true');

            expect(config.stealth.blockWebrtc).toBe(true);
        });

        it('leaves blockWebrtc undefined when stealth.block_webrtc is absent', () => {
            const config = UrlParamParser.parse('scheme_version=4&stealth.enabled=1');

            expect(config.stealth.blockWebrtc).toBeUndefined();
        });

        it('sets stealth-block-webrtc=true in built config when blockWebrtc=true', async () => {
            const config = UrlParamParser.parse('scheme_version=4&stealth.block_webrtc=1');
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['stealth']['stealth-block-webrtc']).toBe(true);
        });

        it('sets stealth-block-webrtc=false in built config when stealth.block_webrtc=0', async () => {
            const config = UrlParamParser.parse('scheme_version=4&stealth.block_webrtc=0');
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['stealth']['stealth-block-webrtc']).toBe(false);
        });

        it('sets stealth-block-webrtc=false in built config when stealth.block_webrtc is absent', async () => {
            const config = UrlParamParser.parse('scheme_version=4&stealth.enabled=1');
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['stealth']['stealth-block-webrtc']).toBe(false);
        });
    });

    describe('browsing security — full replace', () => {
        it.skipIf(__IS_MV3__)('sets safebrowsing-enabled=false when absent from URL (MV2 only)', async () => {
            const config = UrlParamParser.parse('scheme_version=4&stealth.enabled=1');
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['general-settings']['safebrowsing-enabled']).toBe(false);
        });

        // eslint-disable-next-line max-len
        it.skipIf(__IS_MV3__)('sets safebrowsing-enabled=true when browsing_security.enabled=1 (MV2 only)', async () => {
            const config = UrlParamParser.parse('scheme_version=4&browsing_security.enabled=1');
            await configurationImportApi.applyConfig(config);

            const imported = getImportedConfig();

            expect(imported['general-settings']['safebrowsing-enabled']).toBe(true);
        });
    });

    describe('return value', () => {
        it('returns true when SettingsApi.import succeeds', async () => {
            const config = UrlParamParser.parse('scheme_version=4&regular_filters=2');
            const result = await configurationImportApi.applyConfig(config);

            expect(result).toBe(true);
        });

        it('returns false when SettingsApi.import returns false', async () => {
            vi.spyOn(SettingsApi, 'import').mockResolvedValue(false);

            const config = UrlParamParser.parse('scheme_version=4&regular_filters=2');
            const result = await configurationImportApi.applyConfig(config);

            expect(result).toBe(false);
        });
    });
});
