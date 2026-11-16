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

import { AntiBannerFiltersId, AntibannerGroupsId } from '../../../../../../Extension/src/common/constants';

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

vi.mock('../../../../../../Extension/src/pages/services/messenger', () => ({
    messenger: {
        getOptionsData: vi.fn(),
        saveAllowlist: vi.fn(() => Promise.resolve()),
        getCurrentLimits: vi.fn(),
        openExtensionStore: vi.fn(),
        enableFilter: vi.fn(),
        disableFilter: vi.fn(),
        updateGroupStatus: vi.fn(),
        setConsentedFilters: vi.fn(),
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
        ...overrides,
    });

    describe('availableUpdateVersion initialization from applyOptionsData', () => {
        it('should set availableUpdateVersion from options data', async () => {
            const { store } = await createStore();

            store.testApplyOptionsData(
                createOptionsData({ availableUpdateVersion: '5.4.1' }),
            );

            expect(store.availableUpdateVersion).toBe('5.4.1');
        });
    });

    describe('async filter actions', () => {
        const createObservedStore = async (filterId: number, enabled: boolean) => {
            const { autorun, configure } = await import('mobx');
            const { messenger } = await import('../../../../../../Extension/src/pages/services/messenger');
            const { store } = await createStore();
            const groupId = AntibannerGroupsId.OtherFiltersGroupId;

            store.testApplyOptionsData(createOptionsData({
                filtersMetadata: {
                    filters: [{
                        filterId, groupId, enabled, tags: [],
                    }],
                    categories: [{
                        groupId, enabled: false, touched: false, filters: [],
                    }],
                },
            }));
            vi.mocked(messenger.enableFilter).mockResolvedValue(groupId);
            vi.mocked(messenger.disableFilter).mockResolvedValue(undefined);
            vi.mocked(messenger.updateGroupStatus).mockResolvedValue([]);
            vi.mocked(messenger.setConsentedFilters).mockResolvedValue(undefined);

            configure({ enforceActions: 'observed' });
            const dispose = autorun(() => {
                store.filters.map((filter) => filter.enabled);
                store.categories.map((group) => [group.enabled, group.touched]);
                return [
                    store.allowAcceptableAds,
                    store.blockKnownTrackers,
                    store.stripTrackingParameters,
                    store.filterIdSelectedForConsent,
                ];
            });
            const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});

            return {
                store,
                messenger,
                warning,
                cleanup: () => {
                    dispose();
                    warning.mockRestore();
                    configure({ enforceActions: 'observed' });
                },
            };
        };

        it.each([
            [AntiBannerFiltersId.SearchAndSelfPromoFilterId, 'allowAcceptableAds', true],
            [AntiBannerFiltersId.SearchAndSelfPromoFilterId, 'allowAcceptableAds', false],
            [AntiBannerFiltersId.TrackingFilterId, 'blockKnownTrackers', true],
            [AntiBannerFiltersId.TrackingFilterId, 'blockKnownTrackers', false],
            [AntiBannerFiltersId.UrlTrackingFilterId, 'stripTrackingParameters', true],
            [AntiBannerFiltersId.UrlTrackingFilterId, 'stripTrackingParameters', false],
        ] as const)('updates filter %s and %s to %s without strict-mode warnings', async (filterId, key, enabled) => {
            const { store, warning, cleanup } = await createObservedStore(filterId, !enabled);
            try {
                expect(await store.updateFilterSettingCore(filterId, enabled)).toBe(true);
                expect(store[key]).toBe(enabled);
                expect(store.categories[0]?.enabled).toBe(enabled);
                expect(store.categories[0]?.touched).toBe(enabled);
                expect(warning).not.toHaveBeenCalled();
            } finally {
                cleanup();
            }
        });

        it.each([true, false])('updates a related filter to %s without strict-mode warnings', async (enabled) => {
            const { store, warning, cleanup } = await createObservedStore(
                AntiBannerFiltersId.TrackingFilterId,
                !enabled,
            );
            try {
                await store.setBlockKnownTrackersState(enabled);

                expect(store.filters[0]?.enabled).toBe(enabled);
                expect(store.blockKnownTrackers).toBe(enabled);
                expect(warning).not.toHaveBeenCalled();
            } finally {
                cleanup();
            }
        });

        it('restores a related setting when the background rejects the change', async () => {
            const {
                store, messenger, warning, cleanup,
            } = await createObservedStore(
                AntiBannerFiltersId.TrackingFilterId,
                false,
            );
            vi.mocked(messenger.enableFilter).mockRejectedValueOnce(new Error('enable failed'));
            try {
                await store.setBlockKnownTrackersState(true);

                expect(store.filters[0]?.enabled).toBe(false);
                expect(store.blockKnownTrackers).toBe(false);
                expect(warning).not.toHaveBeenCalled();
            } finally {
                cleanup();
            }
        });

        it('clears the consent selection without strict-mode warnings after saving consent', async () => {
            const {
                store, messenger, warning, cleanup,
            } = await createObservedStore(
                AntiBannerFiltersId.TrackingFilterId,
                false,
            );
            store.setFilterIdSelectedForConsent(AntiBannerFiltersId.TrackingFilterId);
            try {
                await store.handleFilterConsentConfirm();

                expect(messenger.setConsentedFilters).toHaveBeenCalledWith([AntiBannerFiltersId.TrackingFilterId]);
                expect(store.filterIdSelectedForConsent).toBeNull();
                expect(warning).not.toHaveBeenCalled();
            } finally {
                cleanup();
            }
        });
    });
});
