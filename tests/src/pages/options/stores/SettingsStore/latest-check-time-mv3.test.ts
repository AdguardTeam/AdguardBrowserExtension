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
    sleepIfNecessary: vi.fn(() => Promise.resolve()),
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
        checkUpdates: vi.fn(() => Promise.resolve({ lastCheckTimeMs: Date.now() })),
        saveAllowlist: vi.fn(() => Promise.resolve()),
        getCurrentLimits: vi.fn(),
        openExtensionStore: vi.fn(),
        getCategoriesFilters: vi.fn(() => Promise.resolve([])),
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

describe.skipIf(!__IS_MV3__)('SettingsStore MV3 — latestCheckTime', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const createStore = async () => {
        const { SettingsStore } = await import(
            '../../../../../../Extension/src/pages/options/stores/SettingsStore/SettingsStore-mv3'
        );

        const mockRootStore = {
            uiStore: {
                setStaticFiltersLimitsWarning: vi.fn(),
                setDynamicRulesLimitsWarning: vi.fn(),
                addRuleLimitsNotification: vi.fn(),
                addNotification: vi.fn(),
                dynamicRulesLimitsWarning: null,
            },
            telemetryStore: {
                setIsAnonymizedUsageDataAllowed: vi.fn(),
            },
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const store = new SettingsStore(mockRootStore as any);
        return store;
    };

    const makeRuntimeInfo = (overrides: Record<string, unknown> = {}) => ({
        areFilterLimitsExceeded: false,
        isExtensionUpdateAvailable: false,
        isExtensionReloadedOnUpdate: false,
        isSuccessfulExtensionUpdate: false,
        lastCheckTimeMs: null,
        ...overrides,
    });

    it('latestCheckTime is 0 by default', async () => {
        const store = await createStore();
        expect(store.latestCheckTime).toBe(0);
    });

    it('latestCheckTime is set from runtimeInfo.lastCheckTimeMs on applyRuntimeInfo', async () => {
        const store = await createStore();
        const ts = 1_700_000_000_000;

        store.applyRuntimeInfo(makeRuntimeInfo({ lastCheckTimeMs: ts }));

        expect(store.latestCheckTime).toBe(ts);
    });

    it('latestCheckTime stays 0 when runtimeInfo.lastCheckTimeMs is null', async () => {
        const store = await createStore();

        store.applyRuntimeInfo(makeRuntimeInfo({ lastCheckTimeMs: null }));

        expect(store.latestCheckTime).toBe(0);
    });

    it('latestCheckTime updates reactively after checkUpdates() when background confirms timestamp', async () => {
        const store = await createStore();
        const confirmedTs = Date.now() + 1_000;

        const { messenger } = await import(
            '../../../../../../Extension/src/pages/options/services/messenger'
        );
        vi.mocked(messenger.checkUpdates).mockResolvedValueOnce({ lastCheckTimeMs: confirmedTs });

        await store.checkUpdates();

        expect(store.lastCheckedTime).toBe(confirmedTs);
        expect(store.latestCheckTime).toBeGreaterThanOrEqual(confirmedTs);
    });

    it('latestCheckTime does not update when background returns null (persistence failed)', async () => {
        const store = await createStore();

        const { messenger } = await import(
            '../../../../../../Extension/src/pages/options/services/messenger'
        );
        vi.mocked(messenger.checkUpdates).mockResolvedValueOnce({ lastCheckTimeMs: null });

        await store.checkUpdates();

        // lastCheckedTime must stay 0 — no inconsistent optimistic update
        expect(store.lastCheckedTime).toBe(0);
    });

    it('latestCheckTime returns max of filter timestamps and lastCheckedTime', async () => {
        const store = await createStore();

        // Simulate a filter with a recent check time
        const filterTs = Date.now() + 10_000;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (store as any).filters = [
            { lastCheckTime: filterTs, lastScheduledCheckTime: 0 },
        ];

        // lastCheckedTime is older
        const olderTs = filterTs - 5_000;
        store.applyRuntimeInfo(makeRuntimeInfo({ lastCheckTimeMs: olderTs }));

        expect(store.latestCheckTime).toBe(filterTs);
    });

    it('latestCheckTime prefers lastCheckedTime when it is newer than filter timestamps', async () => {
        const store = await createStore();

        const filterTs = Date.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (store as any).filters = [
            { lastCheckTime: filterTs, lastScheduledCheckTime: 0 },
        ];

        const newerTs = filterTs + 10_000;
        store.applyRuntimeInfo(makeRuntimeInfo({ lastCheckTimeMs: newerTs }));

        expect(store.latestCheckTime).toBe(newerTs);
    });
});
