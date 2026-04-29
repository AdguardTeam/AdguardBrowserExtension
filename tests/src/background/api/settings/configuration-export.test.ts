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
} from 'vitest';

const mockSettingsStorageGet = vi.fn();
const mockFilterStateStorageGetEnabledFilters = vi.fn();
const mockCustomFilterApiGetFiltersData = vi.fn();
const mockBrowserRuntimeGetManifest = vi.fn();
const mockFilterStateStorageGet = vi.fn();

vi.mock('../../../../../Extension/src/background/storages', () => ({
    settingsStorage: {
        get: (...args: unknown[]) => mockSettingsStorageGet(...args),
    },
    filterStateStorage: {
        getEnabledFilters: () => mockFilterStateStorageGetEnabledFilters(),
        get: (...args: unknown[]) => mockFilterStateStorageGet(...args),
    },
}));

vi.mock('../../../../../Extension/src/background/api/filters/custom', () => ({
    CustomFilterApi: {
        getFiltersData: () => mockCustomFilterApiGetFiltersData(),
    },
}));

vi.mock('webextension-polyfill', () => ({
    default: {
        runtime: {
            getManifest: () => mockBrowserRuntimeGetManifest(),
        },
    },
}));

// Import after mocks.
const { ConfigurationExportApi } = await import(
    '../../../../../Extension/src/background/api/settings/configuration-export/configuration-export-api'
);

// Create an instance to test (base class = MV2 behavior with all params).
const exportApi = new ConfigurationExportApi();

describe('ConfigurationExportApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock returns.
        mockBrowserRuntimeGetManifest.mockReturnValue({ version: '5.1.0', manifest_version: 2 });
        mockFilterStateStorageGetEnabledFilters.mockReturnValue([1, 2, 14]);
        mockCustomFilterApiGetFiltersData.mockReturnValue([]);
        mockSettingsStorageGet.mockReturnValue(false);
        mockFilterStateStorageGet.mockReturnValue(undefined);
    });

    it('includes scheme_version=3 and product_type=Ext', () => {
        const params = exportApi.collectShareParams();
        expect(params['scheme_version']).toBe('3');
        expect(params['product_type']).toBe('Ext');
    });

    it('includes product version from manifest', () => {
        mockBrowserRuntimeGetManifest.mockReturnValue({ version: '5.2.1', manifest_version: 2 });
        const params = exportApi.collectShareParams();
        expect(params['product_version']).toBe('5.2.1');
    });

    it('includes enabled filter IDs as dot-separated string', () => {
        mockFilterStateStorageGetEnabledFilters.mockReturnValue([1, 2, 14]);
        const params = exportApi.collectShareParams();
        expect(params['filters']).toBe('1.2.14');
    });

    it('omits filters when no filters are enabled', () => {
        mockFilterStateStorageGetEnabledFilters.mockReturnValue([]);
        const params = exportApi.collectShareParams();
        expect(params['filters']).toBeUndefined();
    });

    it('encodes custom filters with title and URL', () => {
        mockCustomFilterApiGetFiltersData.mockReturnValue([
            { title: 'My Filter', customUrl: 'https://example.com/filter.txt', enabled: true },
        ]);
        const params = exportApi.collectShareParams();
        expect(params['custom_filters']).toBe(
            'My%20Filter%20(url%3A%20https%3A%2F%2Fexample.com%2Ffilter.txt)',
        );
    });

    it('encodes custom filter without title as (url: URL)', () => {
        mockCustomFilterApiGetFiltersData.mockReturnValue([
            { title: '', customUrl: 'https://example.com/filter.txt', enabled: true },
        ]);
        const params = exportApi.collectShareParams();
        expect(params['custom_filters']).toBe(
            '(url%3A%20https%3A%2F%2Fexample.com%2Ffilter.txt)',
        );
    });

    it('encodes custom filter without URL as just title', () => {
        mockCustomFilterApiGetFiltersData.mockReturnValue([
            { title: 'My Local Filter', customUrl: '', enabled: true },
        ]);
        const params = exportApi.collectShareParams();
        expect(params['custom_filters']).toBe('My%20Local%20Filter');
    });

    it('encodes comma in custom filter title as %2C', () => {
        mockCustomFilterApiGetFiltersData.mockReturnValue([
            { title: 'My Filter, v2', customUrl: 'https://example.com/f.txt', enabled: true },
        ]);
        const params = exportApi.collectShareParams();
        expect(params['custom_filters']).toBe(
            'My%20Filter%2C%20v2%20(url%3A%20https%3A%2F%2Fexample.com%2Ff.txt)',
        );
    });

    it('joins multiple custom filters with comma separator', () => {
        mockCustomFilterApiGetFiltersData.mockReturnValue([
            { title: 'Filter A', customUrl: 'https://a.com/f.txt', enabled: true },
            { title: 'Filter B', customUrl: 'https://b.com/f.txt', enabled: true },
        ]);
        const params = exportApi.collectShareParams();
        expect(params['custom_filters']).toBe(
            'Filter%20A%20(url%3A%20https%3A%2F%2Fa.com%2Ff.txt),Filter%20B%20(url%3A%20https%3A%2F%2Fb.com%2Ff.txt)',
        );
    });

    it('includes only enabled custom filters', () => {
        mockCustomFilterApiGetFiltersData.mockReturnValue([
            { title: 'Enabled', customUrl: 'https://a.com/f.txt', enabled: true },
            { title: 'Disabled', customUrl: 'https://b.com/f.txt', enabled: false },
        ]);
        const params = exportApi.collectShareParams();
        expect(params['custom_filters']).toBe(
            'Enabled%20(url%3A%20https%3A%2F%2Fa.com%2Ff.txt)',
        );
    });

    it('maps stealth settings correctly', () => {
        // Mock: DisableStealthMode=false means stealth IS enabled.
        mockSettingsStorageGet.mockImplementation((key: string) => {
            const map: Record<string, boolean | number> = {
                'stealth-disable-stealth-mode': false, // enabled=true
                'stealth-hide-search-queries': true,
                'stealth-send-do-not-track': true,
                'stealth-block-webrtc': false,
                'stealth-remove-x-client': true,
                'stealth-hide-referrer': true,
                'stealth-block-third-party-cookies': true,
                'stealth-block-third-party-cookies-time': 180,
                'stealth-block-first-party-cookies': false,
                'stealth-block-first-party-cookies-time': 60,
            };
            return map[key] ?? false;
        });

        // Filter-based stealth settings: strip_url (filter 17) and block_trackers (filter 3).
        mockFilterStateStorageGet.mockImplementation((filterId: number) => {
            if (filterId === 17) {
                return { enabled: true }; // UrlTrackingFilterId → strip_url
            }
            if (filterId === 3) {
                return { enabled: false }; // TrackingFilterId → block_trackers
            }
            return undefined;
        });

        const params = exportApi.collectShareParams();

        expect(params['stealth.enabled']).toBe('true');
        expect(params['stealth.hide_search_queries']).toBe('true');
        expect(params['stealth.DNT']).toBe('true');
        expect(params['stealth.webrtc']).toBe('false');
        expect(params['stealth.webrtc']).toBe('false');
        expect(params['stealth.strip_url']).toBe('true');
        expect(params['stealth.block_trackers']).toBe('false');
        expect(params['stealth.x_client']).toBe('true');
        expect(params['stealth.referrer']).toBe('');
    });

    it('omits stealth.referrer when hide referrer is off', () => {
        mockSettingsStorageGet.mockImplementation((key: string) => {
            if (key === 'stealth-hide-referrer') {
                return false;
            }
            return false;
        });

        const params = exportApi.collectShareParams();
        expect(params['stealth.referrer']).toBeUndefined();
    });

    it('includes manifest_version', () => {
        mockBrowserRuntimeGetManifest.mockReturnValue({ version: '5.1.0', manifest_version: 3 });
        const params = exportApi.collectShareParams();
        expect(params['manifest_version']).toBe('3');
    });

    it('uses v3 param names stealth.DNT and stealth.webrtc', () => {
        mockSettingsStorageGet.mockImplementation((key: string) => {
            if (key === 'stealth-send-do-not-track') {
                return true;
            }
            if (key === 'stealth-block-webrtc') {
                return true;
            }
            return false;
        });

        const params = exportApi.collectShareParams();
        expect(params['stealth.DNT']).toBe('true');
        expect(params['stealth.webrtc']).toBe('true');
        // v4 names should NOT be present
        expect(params['stealth.send_dnt']).toBeUndefined();
        expect(params['stealth.block_webrtc']).toBeUndefined();
    });

    it('does NOT include user rules or allowlist', () => {
        const params = exportApi.collectShareParams();
        const allKeys = Object.keys(params).join(' ');
        expect(allKeys).not.toContain('user_rules');
        expect(allKeys).not.toContain('user_filter');
        expect(allKeys).not.toContain('allowlist');
        expect(allKeys).not.toContain('appid');
    });

    it('includes browsing_security.enabled on MV2 (base class)', () => {
        const params = exportApi.collectShareParams();
        expect(params['browsing_security.enabled']).toBe('true');
    });

    it('includes cookie TTL params when toggles are on', () => {
        mockSettingsStorageGet.mockImplementation((key: string) => {
            if (key === 'stealth-block-third-party-cookies') {
                return true;
            }
            if (key === 'stealth-block-third-party-cookies-time') {
                return 180;
            }
            if (key === 'stealth-block-first-party-cookies') {
                return true;
            }
            if (key === 'stealth-block-first-party-cookies-time') {
                return 60;
            }
            return false;
        });

        const params = exportApi.collectShareParams();
        expect(params['stealth.third_party_cookies']).toBe('180');
        expect(params['stealth.first_party_cookies']).toBe('60');
    });

    it('omits cookie TTL params when toggles are off', () => {
        mockSettingsStorageGet.mockImplementation((key: string) => {
            if (key === 'stealth-block-third-party-cookies') {
                return false;
            }
            if (key === 'stealth-block-first-party-cookies') {
                return false;
            }
            return false;
        });

        const params = exportApi.collectShareParams();
        expect(params['stealth.third_party_cookies']).toBeUndefined();
        expect(params['stealth.first_party_cookies']).toBeUndefined();
    });
});

const { configurationExportApi } = await import(
    '../../../../../Extension/src/background/api/settings/configuration-export'
);

describe.skipIf(!__IS_MV3__)('MV3 — ConfigurationExportApiMv3', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockBrowserRuntimeGetManifest.mockReturnValue({ version: '5.1.0', manifest_version: 3 });
        mockFilterStateStorageGetEnabledFilters.mockReturnValue([]);
        mockCustomFilterApiGetFiltersData.mockReturnValue([]);
        mockSettingsStorageGet.mockReturnValue(false);
        mockFilterStateStorageGet.mockReturnValue(undefined);
    });

    it('omits browsing_security.enabled on MV3', () => {
        const params = configurationExportApi.collectShareParams();
        expect(params['browsing_security.enabled']).toBeUndefined();
    });

    it('omits cookie TTL params on MV3 even when toggles are on', () => {
        mockSettingsStorageGet.mockImplementation((key: string) => {
            if (key === 'stealth-block-third-party-cookies') {
                return true;
            }
            if (key === 'stealth-block-third-party-cookies-time') {
                return 180;
            }
            if (key === 'stealth-block-first-party-cookies') {
                return true;
            }
            if (key === 'stealth-block-first-party-cookies-time') {
                return 60;
            }
            return false;
        });

        const params = configurationExportApi.collectShareParams();
        expect(params['stealth.third_party_cookies']).toBeUndefined();
        expect(params['stealth.first_party_cookies']).toBeUndefined();
    });

    it('still includes stealth and filter params on MV3', () => {
        mockFilterStateStorageGetEnabledFilters.mockReturnValue([1, 2]);
        const params = configurationExportApi.collectShareParams();
        expect(params['filters']).toBe('1.2');
        expect(params['stealth.enabled']).toBeDefined();
        expect(params['manifest_version']).toBe('3');
    });
});
