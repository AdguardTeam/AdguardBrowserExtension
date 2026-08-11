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
import browser from 'webextension-polyfill';

import { PagesApi, pagesApi } from '../../../../../Extension/src/background/api/ui/pages';
import { PagesApiCommon } from '../../../../../Extension/src/background/api/ui/pages/pages-common';
import { SettingsApi } from '../../../../../Extension/src/background/api/settings';
import { FilterStateStorage } from '../../../../../Extension/src/background/storages/filter-state';
import { GroupStateStorage } from '../../../../../Extension/src/background/storages/group-state';
import { ForwardAction, ForwardFrom } from '../../../../../Extension/src/common/forward';
import { UserAgent } from '../../../../../Extension/src/common/user-agent';
import { browserStorage } from '../../../../../Extension/src/background/storages/shared-instances';
import { TabsApi, WindowsApi } from '../../../../../Extension/src/common/api/extension';

vi.mock('../../../../../Extension/src/background/storages/metadata');
vi.mock('../../../../../Extension/src/common/user-agent');

vi.spyOn(FilterStateStorage.prototype, 'getEnabledFilters').mockImplementation(() => []);
vi.spyOn(GroupStateStorage.prototype, 'getEnabledGroups').mockImplementation(() => []);
vi.spyOn(GroupStateStorage.prototype, 'get').mockImplementation(() => {
    return {
        enabled: false,
        touched: false,
    };
});

describe('PagesApi', () => {
    beforeEach(async () => {
        await SettingsApi.init();
    });

    it('getIssueReportUrl', async () => {
        const websiteUrl = 'https://example.com';
        const reportedFrom = ForwardFrom.Popup;

        const reportUrl = await pagesApi.getIssueReportUrl(websiteUrl, reportedFrom);

        const url = new URL(reportUrl);

        expect(url.searchParams.get('app')).toBe('browser_extension');
        expect(url.searchParams.get('from')).toBe(reportedFrom);
        expect(url.searchParams.get('url')).toBe(websiteUrl);
        expect(url.searchParams.get('product_type')).toBe('ext');
    });

    describe('openFilteringLogPage', () => {
        beforeEach(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.spyOn(TabsApi, 'getActive').mockResolvedValue({ id: 1 } as any);
            vi.spyOn(TabsApi, 'findOne').mockResolvedValue(undefined);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.spyOn(WindowsApi, 'create').mockResolvedValue({} as any);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('opens with default state when windowState is undefined', async () => {
            vi.spyOn(browserStorage, 'get').mockResolvedValue(undefined);

            await PagesApiCommon.openFilteringLogPage();

            const spy = vi.mocked(WindowsApi.create);
            expect(spy).toHaveBeenCalledOnce();
            const createData = spy.mock.calls[0]![0]!;
            expect(typeof createData).toBe('object');
            expect(createData).toHaveProperty('width');
            expect(createData).toHaveProperty('height');
        });

        it('opens with parsed state when windowState is a legacy JSON string', async () => {
            vi.spyOn(browserStorage, 'get').mockResolvedValue(
                '{"width":1280,"height":720,"top":233,"left":352}' as unknown as undefined,
            );

            await PagesApiCommon.openFilteringLogPage();

            const spy = vi.mocked(WindowsApi.create);
            expect(spy).toHaveBeenCalledOnce();
            const createData = spy.mock.calls[0]![0]!;
            expect(typeof createData).toBe('object');
            expect(createData).toHaveProperty('width', 1280);
            expect(createData).toHaveProperty('height', 720);
            expect(createData).toHaveProperty('top', 233);
            expect(createData).toHaveProperty('left', 352);
        });

        it('falls back to default state when windowState is a corrupt JSON string', async () => {
            vi.spyOn(browserStorage, 'get').mockResolvedValue(
                'not-valid-json' as unknown as undefined,
            );

            await PagesApiCommon.openFilteringLogPage();

            const spy = vi.mocked(WindowsApi.create);
            expect(spy).toHaveBeenCalledOnce();
            const createData = spy.mock.calls[0]![0]!;
            expect(typeof createData).toBe('object');
            expect(createData).toHaveProperty('width');
            expect(createData).toHaveProperty('height');
        });

        it('falls back to default state when windowState has extra unknown keys', async () => {
            vi.spyOn(browserStorage, 'get').mockResolvedValue(
                {
                    width: 800,
                    height: 600,
                    top: 100,
                    left: 50,
                    unexpectedKey: 'should be rejected',
                } as unknown as undefined,
            );

            await PagesApiCommon.openFilteringLogPage();

            const spy = vi.mocked(WindowsApi.create);
            expect(spy).toHaveBeenCalledOnce();
            const createData = spy.mock.calls[0]![0]!;
            expect(createData).toHaveProperty('width', 1280);
            expect(createData).toHaveProperty('height', 720);
        });

        it('opens with object state when windowState is already an object', async () => {
            vi.spyOn(browserStorage, 'get').mockResolvedValue(
                {
                    width: 800,
                    height: 600,
                    top: 100,
                    left: 50,
                } as unknown as undefined,
            );

            await PagesApiCommon.openFilteringLogPage();

            const spy = vi.mocked(WindowsApi.create);
            expect(spy).toHaveBeenCalledOnce();
            const createData = spy.mock.calls[0]![0]!;
            expect(createData).toHaveProperty('width', 800);
            expect(createData).toHaveProperty('height', 600);
            expect(createData).toHaveProperty('top', 100);
            expect(createData).toHaveProperty('left', 50);
        });
    });

    describe('openExtensionStorePage', () => {
        const chromeWebStoreHomepageUrl = (
            'https://chromewebstore.google.com/detail/bgnkhhnnamicmpeenaelnjfhikgbkllg'
        );
        const edgeAddonsHomepageUrl = (
            'https://microsoftedge.microsoft.com/addons/detail/pdffkfellgipmhklpdmokmckkkfcopbh'
        );
        const standaloneUpdateUrl = 'https://static.adtidy.org/extensions/adguardadblocker/beta/update.xml';
        const expectedChromeStoreAction = __IS_MV3__
            ? ForwardAction.ChromeMv3Store
            : ForwardAction.ChromeMv2Store;
        const originalUserAgentFlags = {
            isOpera: UserAgent.isOpera,
            isFirefox: UserAgent.isFirefox,
            isEdge: UserAgent.isEdge,
            isYandex: UserAgent.isYandex,
            isChromium: UserAgent.isChromium,
        };
        const originalManagement = browser.management;
        const originalTabsCreate = browser.tabs.create;

        let testPagesApi: PagesApi;

        beforeEach(() => {
            Object.defineProperties(UserAgent, {
                isOpera: { value: false, configurable: true },
                isFirefox: { value: false, configurable: true },
                isEdge: { value: true, configurable: true },
                isYandex: { value: false, configurable: true },
                isChromium: { value: true, configurable: true },
            });

            // Cast is needed because sinon-chrome's mock types don't match
            // webextension-polyfill's function signatures.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            browser.tabs.create = vi.fn().mockResolvedValue({ id: 1 }) as any;
            Object.assign(browser, {
                management: {
                    ...browser.management,
                    getSelf: vi.fn(),
                },
            });

            testPagesApi = new PagesApi();
        });

        afterEach(() => {
            Object.defineProperties(UserAgent, {
                isOpera: { value: originalUserAgentFlags.isOpera, configurable: true },
                isFirefox: { value: originalUserAgentFlags.isFirefox, configurable: true },
                isEdge: { value: originalUserAgentFlags.isEdge, configurable: true },
                isYandex: { value: originalUserAgentFlags.isYandex, configurable: true },
                isChromium: { value: originalUserAgentFlags.isChromium, configurable: true },
            });
            Object.assign(browser, {
                management: originalManagement,
            });
            browser.tabs.create = originalTabsCreate;
            vi.restoreAllMocks();
        });

        /**
         * Returns the forwarding action from the URL opened in the current test.
         *
         * @returns Forwarding action query parameter.
         */
        const getOpenedStoreAction = (): string | null => {
            const createTab = vi.mocked(browser.tabs.create);
            expect(createTab).toHaveBeenCalledOnce();

            const { url } = createTab.mock.calls[0]![0];
            return new URL(url!).searchParams.get('action');
        };

        it('uses Chrome Web Store for a CWS installation running in Edge', async () => {
            vi.mocked(browser.management.getSelf).mockResolvedValue({
                homepageUrl: chromeWebStoreHomepageUrl,
            } as browser.Management.ExtensionInfo);

            await testPagesApi.openExtensionStorePage();

            expect(getOpenedStoreAction()).toBe(expectedChromeStoreAction);
            expect(browser.management.getSelf).toHaveBeenCalledOnce();
        });

        it('calculates the extension store URL only once', async () => {
            vi.mocked(browser.management.getSelf).mockResolvedValue({
                homepageUrl: chromeWebStoreHomepageUrl,
            } as browser.Management.ExtensionInfo);

            await Promise.all([
                testPagesApi.openExtensionStorePage(),
                testPagesApi.openExtensionStorePage(),
            ]);

            expect(browser.management.getSelf).toHaveBeenCalledOnce();
            expect(browser.tabs.create).toHaveBeenCalledTimes(2);

            const openedActions = vi.mocked(browser.tabs.create).mock.calls.map(([{ url }]) => (
                new URL(url!).searchParams.get('action')
            ));
            expect(openedActions).toEqual([expectedChromeStoreAction, expectedChromeStoreAction]);
        });

        it('uses Chrome Web Store for a CWS installation running in Opera', async () => {
            Object.defineProperties(UserAgent, {
                isOpera: { value: true, configurable: true },
                isEdge: { value: false, configurable: true },
            });
            vi.mocked(browser.management.getSelf).mockResolvedValue({
                homepageUrl: chromeWebStoreHomepageUrl,
            } as browser.Management.ExtensionInfo);

            await testPagesApi.openExtensionStorePage();

            expect(getOpenedStoreAction()).toBe(expectedChromeStoreAction);
            expect(browser.management.getSelf).toHaveBeenCalledOnce();
        });

        it('uses Opera Add-ons for an Opera Add-ons installation', async () => {
            Object.defineProperties(UserAgent, {
                isOpera: { value: true, configurable: true },
                isEdge: { value: false, configurable: true },
            });
            vi.mocked(browser.management.getSelf).mockResolvedValue({
                homepageUrl: 'https://addons.opera.com/extensions/details/adguard/',
            } as browser.Management.ExtensionInfo);

            await testPagesApi.openExtensionStorePage();

            expect(getOpenedStoreAction()).toBe(ForwardAction.OperaStore);
            expect(browser.management.getSelf).toHaveBeenCalledOnce();
        });

        it('uses Opera Add-ons for an unpacked installation in Opera', async () => {
            Object.defineProperties(UserAgent, {
                isOpera: { value: true, configurable: true },
                isEdge: { value: false, configurable: true },
            });
            vi.mocked(browser.management.getSelf).mockResolvedValue({
                installType: 'development',
            } as browser.Management.ExtensionInfo);

            await testPagesApi.openExtensionStorePage();

            expect(getOpenedStoreAction()).toBe(ForwardAction.OperaStore);
            expect(browser.management.getSelf).toHaveBeenCalledOnce();
        });

        it('uses Microsoft Edge Add-ons for an Edge Add-ons installation', async () => {
            vi.mocked(browser.management.getSelf).mockResolvedValue({
                homepageUrl: edgeAddonsHomepageUrl,
            } as browser.Management.ExtensionInfo);

            await testPagesApi.openExtensionStorePage();

            expect(getOpenedStoreAction()).toBe(ForwardAction.EdgeStore);
            expect(browser.management.getSelf).toHaveBeenCalledOnce();
        });

        it('uses Microsoft Edge Add-ons for an unpacked installation in Edge', async () => {
            vi.mocked(browser.management.getSelf).mockResolvedValue({
                installType: 'development',
            } as browser.Management.ExtensionInfo);

            await testPagesApi.openExtensionStorePage();

            expect(getOpenedStoreAction()).toBe(ForwardAction.EdgeStore);
            expect(browser.management.getSelf).toHaveBeenCalledOnce();
        });

        it('uses Microsoft Edge Add-ons for a standalone installation in Edge', async () => {
            vi.mocked(browser.management.getSelf).mockResolvedValue({
                installType: 'normal',
                updateUrl: standaloneUpdateUrl,
            } as browser.Management.ExtensionInfo);

            await testPagesApi.openExtensionStorePage();

            expect(getOpenedStoreAction()).toBe(ForwardAction.EdgeStore);
            expect(browser.management.getSelf).toHaveBeenCalledOnce();
        });

        it('uses Microsoft Edge Add-ons when extension metadata cannot be read', async () => {
            vi.mocked(browser.management.getSelf).mockRejectedValue(new Error('Management API unavailable'));

            await testPagesApi.openExtensionStorePage();

            expect(getOpenedStoreAction()).toBe(ForwardAction.EdgeStore);
            expect(browser.management.getSelf).toHaveBeenCalledOnce();
        });

        it('uses Chrome Web Store in Yandex Browser without reading installation metadata', async () => {
            Object.defineProperties(UserAgent, {
                isEdge: { value: false, configurable: true },
                isYandex: { value: true, configurable: true },
            });
            testPagesApi = new PagesApi();

            await testPagesApi.openExtensionStorePage();

            expect(getOpenedStoreAction()).toBe(expectedChromeStoreAction);
            expect(browser.management.getSelf).not.toHaveBeenCalled();
        });

        it('uses Chrome Web Store in other Chromium browsers without reading installation metadata', async () => {
            Object.defineProperty(UserAgent, 'isEdge', { value: false, configurable: true });
            testPagesApi = new PagesApi();

            await testPagesApi.openExtensionStorePage();

            expect(getOpenedStoreAction()).toBe(expectedChromeStoreAction);
            expect(browser.management.getSelf).not.toHaveBeenCalled();
        });

        it('uses Firefox Add-ons without reading installation metadata', async () => {
            Object.defineProperties(UserAgent, {
                isFirefox: { value: true, configurable: true },
                isEdge: { value: false, configurable: true },
                isChromium: { value: false, configurable: true },
            });
            testPagesApi = new PagesApi();

            await testPagesApi.openExtensionStorePage();

            expect(getOpenedStoreAction()).toBe(ForwardAction.FirefoxStore);
            expect(browser.management.getSelf).not.toHaveBeenCalled();
        });
    });

    describe('forward URLs should not contain "undefined"', () => {
        beforeEach(() => {
            // Cast is needed because sinon-chrome's mock types don't match
            // webextension-polyfill's function signatures.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            browser.tabs.create = vi.fn().mockResolvedValue({ id: 1 }) as any;
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        /**
         * Asserts that a URL does not contain the string "undefined".
         * This catches class field initialization order bugs where
         * a derived class property is accessed before it's initialized.
         *
         * @param url URL to validate.
         */
        const expectValidUrl = (url: string): void => {
            expect(url).not.toContain('undefined');

            // Additionally, verify all query params have non-empty values
            const parsed = new URL(url);
            parsed.searchParams.forEach((value, key) => {
                expect(value, `query param "${key}" should not be empty`).not.toBe('');
                expect(value, `query param "${key}" should not be "undefined"`).not.toBe('undefined');
            });
        };

        it('openExtensionStorePage produces a valid URL', async () => {
            await pagesApi.openExtensionStorePage();

            const spy = vi.mocked(browser.tabs.create);
            expect(spy).toHaveBeenCalledOnce();

            // Non-null assertion is safe: toHaveBeenCalledOnce() guarantees the call exists.
            const { url } = spy.mock.calls[0]![0];
            expectValidUrl(url!);
        });

        it('openThankYouPage produces a valid URL', async () => {
            await pagesApi.openThankYouPage();

            const spy = vi.mocked(browser.tabs.create);
            expect(spy).toHaveBeenCalledOnce();

            // Non-null assertion is safe: toHaveBeenCalledOnce() guarantees the call exists.
            const { url } = spy.mock.calls[0]![0];
            expectValidUrl(url!);
        });
    });
});
