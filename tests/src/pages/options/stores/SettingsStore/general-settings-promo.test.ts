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

// Mock heavy dependencies before importing the store module.
vi.mock('../../../../../../Extension/src/common/logger', () => ({
    logger: {
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        isVerbose: false,
    },
}));

vi.mock('../../../../../../Extension/src/common/sleep-utils', () => ({
    sleep: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../../../../Extension/src/common/user-agent', () => ({
    UserAgent: {
        isChromium: false,
        version: '121',
    },
}));

vi.mock('../../../../../../Extension/src/pages/options/services/messenger', () => ({
    messenger: {
        getOptionsData: vi.fn(),
        saveAllowlist: vi.fn(() => Promise.resolve()),
        getCurrentLimits: vi.fn(),
        openExtensionStore: vi.fn(),
    },
}));

vi.mock('../../../../../../Extension/src/pages/common/components/Editor/savingFSM', () => {
    const SavingFSMState = {
        Idle: 'idle',
        Saving: 'saving',
        Saved: 'saved',
        Error: 'error',
    };

    const SavingFSMEvent = {
        Save: 'save',
    };

    const createSavingService = () => ({
        subscribe: vi.fn(),
        getSnapshot: () => ({ value: SavingFSMState.Idle }),
        send: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
    });

    return { createSavingService, SavingFSMState, SavingFSMEvent };
});

vi.mock('../../../../../../Extension/src/pages/options/components/Filters/helpers', () => ({
    sortFilters: vi.fn((filters: unknown[]) => filters),
    updateFilters: vi.fn((_old: unknown[], updated: unknown[]) => updated),
    updateGroups: vi.fn((_old: unknown[], updated: unknown[]) => updated),
    sortGroupsOnSearch: vi.fn((groups: unknown[]) => groups),
}));

vi.mock('../../../../../../Extension/src/pages/options/options-storage', () => ({
    optionsStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
    },
}));

describe('SettingsStoreCommon', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    /**
     * Creates a concrete test subclass of SettingsStoreCommon with a mock RootStore,
     * and returns the instance along with the imported class for assertions.
     */
    const createStore = async () => {
        const { SettingsStoreCommon } = await import(
            '../../../../../../Extension/src/pages/options/stores/SettingsStore/SettingsStore-common'
        );

        // Concrete test subclass that exposes the protected applyOptionsData method.
        class TestSettingsStore extends SettingsStoreCommon {
            // eslint-disable-next-line class-methods-use-this
            async updateFilterSetting(): Promise<void> {
                // no-op for test
            }

            /**
             * Exposes the protected applyOptionsData for direct testing.
             *
             * @param data Options data payload.
             * @param firstRender Whether this is the first render.
             */
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            public testApplyOptionsData(data: any, firstRender?: boolean): void {
                this.applyOptionsData(data, firstRender);
            }
        }

        const mockRootStore = {
            uiStore: {
                setStaticFiltersLimitsWarning: vi.fn(),
                setDynamicRulesLimitsWarning: vi.fn(),
                addRuleLimitsNotification: vi.fn(),
                dynamicRulesLimitsWarning: null,
            },
            telemetryStore: {
                setIsAnonymizedUsageDataAllowed: vi.fn(),
            },
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const store = new TestSettingsStore(mockRootStore as any);

        return { store, mockRootStore };
    };

    /**
     * Creates a minimal valid options data payload.
     */
    const createOptionsData = (overrides: Record<string, unknown> = {}) => ({
        settings: {
            values: {},
            names: { AllowAnonymizedUsageData: 'allow-anonymized-usage-data' },
        },
        appVersion: '5.4.0',
        libVersions: {
            tswebextension: '1.0.0',
            tsurlfilter: '1.0.0',
            scriptlets: '1.0.0',
            extendedCss: '1.0.0',
        },
        environmentOptions: { isChrome: true },
        filtersInfo: { rulesCount: 100 },
        filtersMetadata: {
            filters: [],
            categories: [],
        },
        fullscreenUserRulesEditorIsOpen: false,
        showGeneralSettingsPromo: false,
        ...overrides,
    });

    describe('showGeneralSettingsPromo initialization from applyOptionsData', () => {
        it('should set showGeneralSettingsPromo from options data', async () => {
            const { store } = await createStore();

            store.testApplyOptionsData(
                createOptionsData({ showGeneralSettingsPromo: true }),
            );
            expect(store.showGeneralSettingsPromo).toBe(true);
        });

        it('should update showGeneralSettingsPromo on subsequent applyOptionsData calls', async () => {
            const { store } = await createStore();

            store.testApplyOptionsData(
                createOptionsData({ showGeneralSettingsPromo: true }),
            );
            expect(store.showGeneralSettingsPromo).toBe(true);

            store.testApplyOptionsData(
                createOptionsData({ showGeneralSettingsPromo: false }),
            );
            expect(store.showGeneralSettingsPromo).toBe(false);
        });
    });
});
