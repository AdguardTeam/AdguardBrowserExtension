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
import { autorun, configure } from 'mobx';

import { type GetOptionsDataResponse } from '../../../../../../Extension/src/background/services/settings';
import { AntibannerGroupsId } from '../../../../../../Extension/src/common/constants';

const mocks = vi.hoisted(() => ({
    getOptionsData: vi.fn(),
    clearUnusedFiltersStatus: vi.fn(),
    enableFilter: vi.fn(),
    disableFilter: vi.fn(),
    updateGroupStatus: vi.fn(),
    saveAllowlist: vi.fn(() => Promise.resolve()),
    getCurrentLimits: vi.fn(),
    openExtensionStore: vi.fn(),
    registerPendingChange: vi.fn(),
    confirmChange: vi.fn(),
    cancelChange: vi.fn(),
}));

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

vi.mock('../../../../../../Extension/src/common/user-agent', () => ({
    UserAgent: {
        isChromium: false,
        version: '121',
    },
}));

vi.mock('../../../../../../Extension/src/common/sleep-utils', () => ({
    sleep: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../../../Extension/src/pages/services/messenger', () => ({
    messenger: {
        getOptionsData: mocks.getOptionsData,
        clearUnusedFiltersStatus: mocks.clearUnusedFiltersStatus,
        enableFilter: mocks.enableFilter,
        disableFilter: mocks.disableFilter,
        updateGroupStatus: mocks.updateGroupStatus,
        saveAllowlist: mocks.saveAllowlist,
        getCurrentLimits: mocks.getCurrentLimits,
        openExtensionStore: mocks.openExtensionStore,
    },
}));

vi.mock('../../../../../../Extension/src/pages/services/EventPauseController-mv2', () => ({
    eventPauseController: {
        registerPendingChange: mocks.registerPendingChange,
        confirmChange: mocks.confirmChange,
        cancelChange: mocks.cancelChange,
    },
    ChangeType: {
        Filter: 'filter',
        Group: 'group',
    },
}));

vi.mock('../../../../../../Extension/src/pages/common/components/Editor/savingFSM', () => {
    const SavingFSMState = {
        Idle: 'idle',
        Saving: 'saving',
        Saved: 'saved',
        Error: 'error',
    };
    const SavingFSMEvent = { Save: 'save' };
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

const LANGUAGE_GROUP_ID = AntibannerGroupsId.LanguageFiltersGroupId;
const PRIVACY_GROUP_ID = AntibannerGroupsId.PrivacyFiltersGroupId;

/**
 * Creates filter data for tests.
 *
 * @param filterId Filter id.
 * @param groupId Group id.
 * @param disabledAsUnused Whether the filter is marked as unused.
 *
 * @returns Filter data.
 */
const createFilter = (filterId: number, groupId: number, disabledAsUnused = false): any => ({
    filterId,
    groupId,
    name: `Filter ${filterId}`,
    enabled: false,
    installed: true,
    loaded: true,
    disabledAsUnused,
    tags: [],
    tagsDetails: [],
    displayNumber: filterId,
});

/**
 * Creates group data for tests.
 *
 * @param groupId Group id.
 *
 * @returns Group data.
 */
const createGroup = (groupId: number): any => ({
    groupId,
    groupName: `Group ${groupId}`,
    displayNumber: groupId,
    enabled: false,
    touched: false,
});

/**
 * Creates an options data payload.
 *
 * @param filters Filters to provide.
 * @param categories Groups to provide.
 *
 * @returns Options data payload.
 */
const createOptionsData = (
    filters: unknown[],
    categories: unknown[] = [],
): GetOptionsDataResponse => ({
    settings: {
        values: {},
        names: {},
    } as any,
    appVersion: '5.6.0',
    libVersions: {} as any,
    environmentOptions: { isChrome: true } as any,
    filtersInfo: { rulesCount: 0 },
    filtersMetadata: {
        filters: filters as any,
        categories: categories as any,
    },
    fullscreenUserRulesEditorIsOpen: false,
} as any);

describe.skipIf(__IS_MV3__)('SettingsStore unused filters status', () => {
    let store: any;

    beforeEach(async () => {
        vi.clearAllMocks();

        const { SettingsStore } = await import(
            '../../../../../../Extension/src/pages/options/stores/SettingsStore/SettingsStore-mv2'
        );

        const mockRootStore = {
            uiStore: {
                setShowLoader: vi.fn(),
                addRuleLimitsNotification: vi.fn(),
                setStaticFiltersLimitsWarning: vi.fn(),
                setDynamicRulesLimitsWarning: vi.fn(),
                dynamicRulesLimitsWarning: null,
            },
            telemetryStore: {
                setIsAnonymizedUsageDataAllowed: vi.fn(),
            },
        };

        store = new SettingsStore(mockRootStore as any);

        mocks.enableFilter.mockResolvedValue(undefined);
        mocks.disableFilter.mockResolvedValue(undefined);
        mocks.updateGroupStatus.mockResolvedValue([]);
        mocks.clearUnusedFiltersStatus.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Applies options data with the provided filters.
     *
     * @param filters Filters shown on the screen.
     *
     * @returns Promise resolved after the options data is applied.
     */
    const applyFilters = async (filters: unknown[]): Promise<void> => {
        mocks.getOptionsData.mockResolvedValue(createOptionsData(
            filters,
            [createGroup(LANGUAGE_GROUP_ID), createGroup(PRIVACY_GROUP_ID)],
        ));

        await store.requestOptionsData(true);
    };

    /**
     * Opens the Language-specific group with the provided filters loaded.
     *
     * @param filters Filters shown on the screen.
     *
     * @returns Promise resolved after the opening is acknowledged.
     */
    const openLanguageGroup = async (filters: unknown[]): Promise<void> => {
        await applyFilters(filters);
        store.setSelectedGroupId(LANGUAGE_GROUP_ID);
        await Promise.resolve();
    };

    it('acknowledges all unused statuses of the group when it is opened', async () => {
        const firstUnusedLanguageFilter = createFilter(1, LANGUAGE_GROUP_ID, true);
        const secondUnusedLanguageFilter = createFilter(4, LANGUAGE_GROUP_ID, true);
        const ordinaryLanguageFilter = createFilter(2, LANGUAGE_GROUP_ID, false);

        await openLanguageGroup([
            firstUnusedLanguageFilter,
            secondUnusedLanguageFilter,
            ordinaryLanguageFilter,
        ]);

        expect(mocks.clearUnusedFiltersStatus).toHaveBeenCalledTimes(1);
        expect(mocks.clearUnusedFiltersStatus).toHaveBeenCalledWith([1, 4]);
        expect(store.shouldDisplayUnusedStatus(firstUnusedLanguageFilter)).toBe(true);
        expect(store.shouldDisplayUnusedStatus(secondUnusedLanguageFilter)).toBe(true);
        expect(store.shouldDisplayUnusedStatus(ordinaryLanguageFilter)).toBe(false);
    });

    it('keeps showing acknowledged statuses for the rest of the opening', async () => {
        const unusedLanguageFilter = createFilter(1, LANGUAGE_GROUP_ID, true);

        await openLanguageGroup([unusedLanguageFilter]);

        // The background has already cleared the flags after the acknowledgment.
        await applyFilters([createFilter(1, LANGUAGE_GROUP_ID, false)]);

        expect(store.shouldDisplayUnusedStatus(createFilter(1, LANGUAGE_GROUP_ID, false))).toBe(true);
    });

    it('does not show acknowledged statuses on the next opening', async () => {
        const unusedLanguageFilter = createFilter(1, LANGUAGE_GROUP_ID, true);

        await openLanguageGroup([unusedLanguageFilter]);
        await Promise.resolve();

        store.setSelectedGroupId(null);
        store.setSelectedGroupId(LANGUAGE_GROUP_ID);

        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(false);
        expect(mocks.clearUnusedFiltersStatus).toHaveBeenCalledTimes(1);
    });

    it('does not acknowledge statuses until the filters list is loaded', async () => {
        store.setSelectedGroupId(LANGUAGE_GROUP_ID);

        expect(mocks.clearUnusedFiltersStatus).not.toHaveBeenCalled();

        await applyFilters([createFilter(1, LANGUAGE_GROUP_ID, true)]);
        store.setSelectedGroupId(LANGUAGE_GROUP_ID);

        expect(mocks.clearUnusedFiltersStatus).toHaveBeenCalledWith([1]);
    });

    it('does not acknowledge statuses when the filters list fails to load', async () => {
        mocks.getOptionsData.mockResolvedValue(null);

        await store.requestOptionsData(true);
        store.setSelectedGroupId(LANGUAGE_GROUP_ID);

        expect(mocks.clearUnusedFiltersStatus).not.toHaveBeenCalled();
    });

    it('does not acknowledge statuses of other groups', async () => {
        await applyFilters([createFilter(3, PRIVACY_GROUP_ID, true)]);
        store.setSelectedGroupId(PRIVACY_GROUP_ID);

        expect(mocks.clearUnusedFiltersStatus).not.toHaveBeenCalled();
    });

    it('does not display the status outside the Language-specific group', async () => {
        const unusedLanguageFilter = createFilter(1, LANGUAGE_GROUP_ID, true);

        await applyFilters([unusedLanguageFilter]);

        expect(store.shouldDisplayUnusedStatus(unusedLanguageFilter)).toBe(false);
    });

    it('hides the status while enabling a filter and after it succeeds', async () => {
        await openLanguageGroup([createFilter(1, LANGUAGE_GROUP_ID, true)]);
        let resolve!: () => void;
        mocks.enableFilter.mockReturnValueOnce(new Promise<void>((done) => {
            resolve = done;
        }));

        const pending = store.updateFilterSetting(1, true);

        expect(store.filters[0].enabled).toBe(true);
        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(false);

        resolve();
        await pending;

        expect(store.filters[0].enabled).toBe(true);
        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(false);
    });

    it('hides the status while enabling a filter and restores it when enabling fails', async () => {
        await openLanguageGroup([createFilter(1, LANGUAGE_GROUP_ID, true)]);
        let reject!: (error: Error) => void;
        mocks.enableFilter.mockReturnValueOnce(new Promise<void>((_done, fail) => {
            reject = fail;
        }));

        const pending = store.updateFilterSetting(1, true);

        expect(store.filters[0].enabled).toBe(true);
        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(false);

        reject(new Error('enable failed'));
        await pending;

        expect(store.filters[0].enabled).toBe(false);
        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(true);
    });

    it('does not display stale unused flags for enabled filters', async () => {
        const filter = { ...createFilter(1, LANGUAGE_GROUP_ID, true), enabled: true };
        await openLanguageGroup([filter]);

        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(false);
        expect(mocks.clearUnusedFiltersStatus).not.toHaveBeenCalled();
    });

    it('clears the displayed status after a successful filter update', async () => {
        const unusedLanguageFilter = createFilter(1, LANGUAGE_GROUP_ID, true);

        await openLanguageGroup([unusedLanguageFilter]);
        await store.updateFilterSetting(1, true);
        await store.updateFilterSetting(1, false);

        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(false);
    });

    it('keeps the displayed status when a filter update fails', async () => {
        const unusedLanguageFilter = createFilter(1, LANGUAGE_GROUP_ID, true);

        await openLanguageGroup([unusedLanguageFilter]);
        mocks.enableFilter.mockRejectedValueOnce(new Error('enable failed'));
        await store.updateFilterSetting(1, true);

        expect(store.shouldDisplayUnusedStatus(unusedLanguageFilter)).toBe(true);
    });

    it('clears the displayed statuses when the group is enabled', async () => {
        const unusedLanguageFilter = createFilter(1, LANGUAGE_GROUP_ID, true);

        await openLanguageGroup([unusedLanguageFilter]);

        await store.updateGroupSetting(LANGUAGE_GROUP_ID, true);

        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(false);
    });

    it('keeps the displayed statuses when another group is enabled', async () => {
        const unusedLanguageFilter = createFilter(1, LANGUAGE_GROUP_ID, true);

        await openLanguageGroup([unusedLanguageFilter]);

        await store.updateGroupSetting(PRIVACY_GROUP_ID, true);

        expect(store.shouldDisplayUnusedStatus(unusedLanguageFilter)).toBe(true);
    });

    it('shows a new auto-disable status after a previous acknowledgment', async () => {
        const firstFilter = createFilter(1, LANGUAGE_GROUP_ID, true);
        const secondFilter = createFilter(2, LANGUAGE_GROUP_ID, false);

        await openLanguageGroup([firstFilter, secondFilter]);

        const refreshedSecondFilter = createFilter(2, LANGUAGE_GROUP_ID, true);
        await applyFilters([
            createFilter(1, LANGUAGE_GROUP_ID, false),
            refreshedSecondFilter,
        ]);

        expect(store.shouldDisplayUnusedStatus(refreshedSecondFilter)).toBe(true);

        store.setSelectedGroupId(null);
        store.setSelectedGroupId(LANGUAGE_GROUP_ID);

        expect(store.shouldDisplayUnusedStatus(refreshedSecondFilter)).toBe(true);
        expect(store.shouldDisplayUnusedStatus(createFilter(1, LANGUAGE_GROUP_ID, false))).toBe(false);
    });

    it('keeps the current opening when selected again before the acknowledgment completes', async () => {
        let acknowledge!: () => void;
        mocks.clearUnusedFiltersStatus.mockReturnValueOnce(new Promise<void>((resolve) => {
            acknowledge = resolve;
        }));
        await openLanguageGroup([createFilter(1, LANGUAGE_GROUP_ID, true)]);

        store.setSelectedGroupId(LANGUAGE_GROUP_ID);

        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(true);
        expect(mocks.clearUnusedFiltersStatus).toHaveBeenCalledTimes(1);
        acknowledge();
    });

    it('keeps the current opening when selected again after the acknowledgment completes', async () => {
        await openLanguageGroup([createFilter(1, LANGUAGE_GROUP_ID, true)]);
        await Promise.resolve();

        store.setSelectedGroupId(LANGUAGE_GROUP_ID);

        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(true);
        expect(mocks.clearUnusedFiltersStatus).toHaveBeenCalledTimes(1);
    });

    it('shows a new auto-disable of the same filter after re-enabling it', async () => {
        await openLanguageGroup([createFilter(1, LANGUAGE_GROUP_ID, true)]);
        await store.updateFilterSetting(1, true);
        store.setSelectedGroupId(null);

        await applyFilters([createFilter(1, LANGUAGE_GROUP_ID, true)]);
        store.setSelectedGroupId(LANGUAGE_GROUP_ID);

        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(true);
        expect(mocks.clearUnusedFiltersStatus).toHaveBeenCalledTimes(2);
    });

    it('does not restore an acknowledged status from stale data received before the response', async () => {
        let acknowledge!: () => void;
        mocks.clearUnusedFiltersStatus.mockReturnValueOnce(new Promise<void>((resolve) => {
            acknowledge = resolve;
        }));
        await openLanguageGroup([createFilter(1, LANGUAGE_GROUP_ID, true)]);
        await applyFilters([createFilter(1, LANGUAGE_GROUP_ID, true)]);

        acknowledge();
        await Promise.resolve();
        store.setSelectedGroupId(null);
        store.setSelectedGroupId(LANGUAGE_GROUP_ID);

        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(false);
        expect(mocks.clearUnusedFiltersStatus).toHaveBeenCalledTimes(1);
    });

    it('allows a later status after the background confirms the previous clearing', async () => {
        await openLanguageGroup([createFilter(1, LANGUAGE_GROUP_ID, true)]);
        await applyFilters([createFilter(1, LANGUAGE_GROUP_ID, false)]);
        store.setSelectedGroupId(null);

        await applyFilters([createFilter(1, LANGUAGE_GROUP_ID, true)]);
        store.setSelectedGroupId(LANGUAGE_GROUP_ID);

        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(true);
        expect(mocks.clearUnusedFiltersStatus).toHaveBeenCalledTimes(2);
    });

    it('removes the displayed status when updated data confirms enabling elsewhere', async () => {
        await openLanguageGroup([createFilter(1, LANGUAGE_GROUP_ID, true)]);
        await applyFilters([{ ...createFilter(1, LANGUAGE_GROUP_ID, false), enabled: true }]);

        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(false);

        // A later ordinary disable must not restore the opening's old status.
        await applyFilters([createFilter(1, LANGUAGE_GROUP_ID, false)]);
        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(false);
    });

    it('does not let a delayed acknowledgment suppress a later auto-disable', async () => {
        let acknowledge!: () => void;
        mocks.clearUnusedFiltersStatus.mockReturnValueOnce(new Promise<void>((resolve) => {
            acknowledge = resolve;
        }));
        await openLanguageGroup([createFilter(1, LANGUAGE_GROUP_ID, true)]);
        await applyFilters([{ ...createFilter(1, LANGUAGE_GROUP_ID, false), enabled: true }]);
        await applyFilters([createFilter(1, LANGUAGE_GROUP_ID, true)]);

        acknowledge();
        await Promise.resolve();
        store.setSelectedGroupId(null);
        store.setSelectedGroupId(LANGUAGE_GROUP_ID);

        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(true);
    });

    it('removes displayed statuses when updated data confirms enabling the group elsewhere', async () => {
        await openLanguageGroup([createFilter(1, LANGUAGE_GROUP_ID, true)]);
        mocks.getOptionsData.mockResolvedValue(createOptionsData(
            [createFilter(1, LANGUAGE_GROUP_ID, false)],
            [{ ...createGroup(LANGUAGE_GROUP_ID), enabled: true }],
        ));

        await store.requestOptionsData();

        expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(false);
    });

    it('clears the status inside a MobX action when a filter is enabled', async () => {
        configure({ enforceActions: 'observed' });
        await openLanguageGroup([createFilter(1, LANGUAGE_GROUP_ID, true)]);
        const dispose = autorun(() => store.shouldDisplayUnusedStatus(store.filters[0]));
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            await store.updateFilterSetting(1, true);

            expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(false);
            expect(warning).not.toHaveBeenCalled();
        } finally {
            dispose();
            warning.mockRestore();
            configure({ enforceActions: 'never' });
        }
    });

    it('clears the status inside a MobX action when the group is enabled', async () => {
        configure({ enforceActions: 'observed' });
        await openLanguageGroup([createFilter(1, LANGUAGE_GROUP_ID, true)]);
        const dispose = autorun(() => store.shouldDisplayUnusedStatus(store.filters[0]));
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            await store.updateGroupSetting(LANGUAGE_GROUP_ID, true);

            expect(store.shouldDisplayUnusedStatus(store.filters[0])).toBe(false);
            expect(warning).not.toHaveBeenCalled();
        } finally {
            dispose();
            warning.mockRestore();
            configure({ enforceActions: 'never' });
        }
    });

    it('keeps statuses available for the next opening when acknowledgment fails', async () => {
        const unusedLanguageFilter = createFilter(1, LANGUAGE_GROUP_ID, true);

        mocks.clearUnusedFiltersStatus.mockRejectedValueOnce(new Error('clear failed'));
        await openLanguageGroup([unusedLanguageFilter]);

        store.setSelectedGroupId(null);
        store.setSelectedGroupId(LANGUAGE_GROUP_ID);

        expect(store.shouldDisplayUnusedStatus(unusedLanguageFilter)).toBe(true);
    });
});
