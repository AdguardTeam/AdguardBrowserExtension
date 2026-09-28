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
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
    AutoDisableNotificationService: { init: vi.fn() },
    AutoDisableFiltersService: {
        init: vi.fn(),
    },
    localeDetect: {
        init: vi.fn(),
    },
    safebrowsingService: {
        init: vi.fn(() => Promise.resolve()),
    },
    updateCheckService: {
        init: vi.fn(() => Promise.resolve()),
    },
}));

vi.mock('../../../../Extension/src/background/services/auto-disable-notification-mv2', () => ({
    AutoDisableNotificationService: mocks.AutoDisableNotificationService,
}));

vi.mock('../../../../Extension/src/background/services/auto-disable-filters-mv2', () => ({
    AutoDisableFiltersService: mocks.AutoDisableFiltersService,
}));

vi.mock('../../../../Extension/src/background/services/locale-detect-mv2', () => ({
    localeDetect: mocks.localeDetect,
}));

vi.mock('../../../../Extension/src/background/services/safebrowsing', () => ({
    SafebrowsingService: mocks.safebrowsingService,
}));

vi.mock('../../../../Extension/src/background/services/update-check/update-check-service', () => ({
    updateCheckService: mocks.updateCheckService,
}));

/**
 * Creates a test subclass that exposes the auto-disable filters service initialization.
 *
 * @returns Test app class with a public auto-disable filters initialization runner.
 */
const createTestApp = async () => {
    const { App } = await import('../../../../Extension/src/background/app');

    class TestApp extends App {
        public static runManifestSpecificInit(): Promise<void> {
            return super.manifestSpecificInit();
        }

        /**
         * Initializes the auto-disable filters service without executing full app startup.
         *
         * @returns Promise that resolves after the manifest-specific initialization completes.
         */
        public static runInitAutoDisableFiltersService(): Promise<void> {
            return super.initAutoDisableFiltersService();
        }
    }

    return TestApp;
};

describe('App auto-disable filters wiring', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes notifications only in the MV2 manifest lifecycle', async () => {
        const TestApp = await createTestApp();
        await TestApp.runManifestSpecificInit();
        expect(mocks.AutoDisableNotificationService.init).toHaveBeenCalledTimes(__IS_MV3__ ? 0 : 1);
    });

    it.skipIf(__IS_MV3__)('initializes the auto-disable filters service in MV2', async () => {
        const TestApp = await createTestApp();

        await TestApp.runInitAutoDisableFiltersService();

        expect(mocks.AutoDisableFiltersService.init).toHaveBeenCalledOnce();
    });

    it.skipIf(!__IS_MV3__)('does not initialize the auto-disable filters service in MV3', async () => {
        const TestApp = await createTestApp();

        await expect(TestApp.runInitAutoDisableFiltersService()).resolves.toBeUndefined();

        expect(mocks.AutoDisableFiltersService.init).not.toHaveBeenCalled();
    });
});
