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
    updateCheckService: {
        init: vi.fn(() => Promise.resolve()),
    },
    localeDetect: {
        init: vi.fn(),
    },
    safebrowsingService: {
        init: vi.fn(() => Promise.resolve()),
    },
    extensionUpdateService: {
        init: vi.fn(() => Promise.resolve()),
    },
}));

vi.mock('../../../../Extension/src/background/services/update-check/update-check-service', () => ({
    updateCheckService: mocks.updateCheckService,
}));

vi.mock('../../../../Extension/src/background/services/locale-detect-mv2', () => ({
    localeDetect: mocks.localeDetect,
}));

vi.mock('../../../../Extension/src/background/services/safebrowsing', () => ({
    SafebrowsingService: mocks.safebrowsingService,
}));

vi.mock('../../../../Extension/src/background/services/extension-update/extension-update-service-mv3', () => ({
    ExtensionUpdateService: mocks.extensionUpdateService,
}));

/**
 * Creates a test subclass that exposes the manifest-specific init hook.
 *
 * @returns Test app class with public manifest-specific init runner.
 */
const createTestApp = async () => {
    const { App } = await import('../../../../Extension/src/background/app');

    class TestApp extends App {
        /**
         * Runs update-check init without executing full app startup.
         *
         * @returns Promise that resolves after update-check service is initialized.
         */
        public static runUpdateCheckServiceInit(): Promise<void> {
            return super.initUpdateCheckService();
        }
    }

    return TestApp;
};

describe('App update-check wiring', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes update checks during app startup wiring', async () => {
        const TestApp = await createTestApp();
        await TestApp.runUpdateCheckServiceInit();

        expect(mocks.updateCheckService.init).toHaveBeenCalledOnce();
    });
});
