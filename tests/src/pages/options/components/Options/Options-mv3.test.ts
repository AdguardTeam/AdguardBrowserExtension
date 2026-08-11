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

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('react-modal', () => {
    // Return a mock that doesn't call setAppElement at module level
    function Modal() {
        return null;
    }
    (Modal as any).setAppElement = vi.fn();
    return {
        __esModule: true,
        default: Modal,
    };
});

/**
 * This test file validates that the `createMessageHandler` function (Options-mv3.tsx)
 * delegates ExtensionUpdateStateChange events to `settingsStore.handleExtensionUpdateStateChange`
 * without manually setting individual flags or calling uiStore.addNotification.
 */

describe('Options-mv3 - createMessageHandler', () => {
    let settingsStore: {
        handleExtensionUpdateStateChange: ReturnType<typeof vi.fn>;
        setIsExtensionCheckingUpdateOrUpdating: ReturnType<typeof vi.fn>;
        setIsExtensionUpdateAvailable: ReturnType<typeof vi.fn>;
        configureExtensionUpdates: ReturnType<typeof vi.fn>;
    };
    let uiStore: {
        addNotification: ReturnType<typeof vi.fn>;
    };
    let messageHandler: (message: { type: string; data: unknown[] }) => Promise<void>;

    beforeEach(async () => {
        vi.resetModules();

        settingsStore = {
            handleExtensionUpdateStateChange: vi.fn(),
            setIsExtensionCheckingUpdateOrUpdating: vi.fn(),
            setIsExtensionUpdateAvailable: vi.fn(),
            configureExtensionUpdates: vi.fn(),
        };

        uiStore = {
            addNotification: vi.fn(),
        };

        // Mock sub-components to avoid react-modal setAppElement('#root') at module load
        vi.doMock('../../../../../../Extension/src/pages/options/components/General', () => ({
            General: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/Filters', () => ({
            Filters: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/Stealth', () => ({
            Stealth: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/Allowlist', () => ({
            Allowlist: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/UserRules', () => ({
            UserRules: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/Miscellaneous', () => ({
            Miscellaneous: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/About', () => ({
            About: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/RulesLimits/RulesLimits-mv3', () => ({
            RulesLimits: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/Options/Options-layout', () => ({
            OptionsLayout: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/Options/Options-common', () => ({
            COMMON_EVENTS: [],
            createCommonMessageHandler: vi.fn(() => vi.fn()),
        }));

        const { createMessageHandler } = await import(
            '../../../../../../Extension/src/pages/options/components/Options/Options-mv3'
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messageHandler = createMessageHandler(settingsStore as any, uiStore as any) as any;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('calls handleExtensionUpdateStateChange on ExtensionUpdateStateChange event', async () => {
        const { ExtensionUpdateFSMState, NotifierType } = await import(
            '../../../../../../Extension/src/common/constants'
        );

        const message = {
            type: NotifierType.ExtensionUpdateStateChange,
            data: [ExtensionUpdateFSMState.Available],
        };

        await messageHandler(message);

        expect(settingsStore.handleExtensionUpdateStateChange).toHaveBeenCalledWith(
            ExtensionUpdateFSMState.Available,
        );
    });

    it('calls handleExtensionUpdateStateChange for all FSM states', async () => {
        const { ExtensionUpdateFSMState, NotifierType } = await import(
            '../../../../../../Extension/src/common/constants'
        );

        const states = [
            ExtensionUpdateFSMState.Checking,
            ExtensionUpdateFSMState.NotAvailable,
            ExtensionUpdateFSMState.Available,
            ExtensionUpdateFSMState.Updating,
            ExtensionUpdateFSMState.Failed,
            ExtensionUpdateFSMState.Success,
            ExtensionUpdateFSMState.Idle,
        ];

        for (const state of states) {
            const message = {
                type: NotifierType.ExtensionUpdateStateChange,
                data: [state],
            };

            await messageHandler(message);

            expect(settingsStore.handleExtensionUpdateStateChange).toHaveBeenCalledWith(state);
        }

        expect(settingsStore.handleExtensionUpdateStateChange).toHaveBeenCalledTimes(states.length);
    });

    it('does NOT manually set extension update flags', async () => {
        const { ExtensionUpdateFSMState, NotifierType } = await import(
            '../../../../../../Extension/src/common/constants'
        );

        const message = {
            type: NotifierType.ExtensionUpdateStateChange,
            data: [ExtensionUpdateFSMState.Checking],
        };

        await messageHandler(message);

        expect(settingsStore.setIsExtensionCheckingUpdateOrUpdating).not.toHaveBeenCalled();
        expect(settingsStore.setIsExtensionUpdateAvailable).not.toHaveBeenCalled();
    });
});

describe('Options-mv3 - initialize', () => {
    let settingsStore: {
        requestOptionsData: ReturnType<typeof vi.fn>;
        configureExtensionUpdates: ReturnType<typeof vi.fn>;
        checkLimitations: ReturnType<typeof vi.fn>;
    };
    let uiStore: {
        addRuleLimitsNotification: ReturnType<typeof vi.fn>;
        addNotification: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        vi.resetModules();

        settingsStore = {
            requestOptionsData: vi.fn(),
            configureExtensionUpdates: vi.fn(),
            checkLimitations: vi.fn(),
        };

        uiStore = {
            addRuleLimitsNotification: vi.fn(),
            addNotification: vi.fn(),
        };

        // Mock sub-components to avoid react-modal setAppElement('#root') at module load
        vi.doMock('../../../../../../Extension/src/pages/options/components/General', () => ({
            General: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/Filters', () => ({
            Filters: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/Stealth', () => ({
            Stealth: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/Allowlist', () => ({
            Allowlist: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/UserRules', () => ({
            UserRules: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/Miscellaneous', () => ({
            Miscellaneous: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/About', () => ({
            About: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/RulesLimits/RulesLimits-mv3', () => ({
            RulesLimits: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/Options/Options-layout', () => ({
            OptionsLayout: () => null,
        }));
        vi.doMock('../../../../../../Extension/src/pages/options/components/Options/Options-common', () => ({
            COMMON_EVENTS: [],
            createCommonMessageHandler: vi.fn(() => vi.fn()),
        }));
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('calls requestOptionsData to load options data and apply runtime info', async () => {
        const { initialize } = await import(
            '../../../../../../Extension/src/pages/options/components/Options/Options-mv3'
        );

        const runtimeInfo = {
            areFilterLimitsExceeded: false,
            isExtensionUpdateAvailable: true,
            isExtensionReloadedOnUpdate: false,
            isSuccessfulExtensionUpdate: false,
        };

        settingsStore.requestOptionsData.mockResolvedValue({
            runtimeInfo,
        });

        const result = await initialize(settingsStore as any, uiStore as any);

        expect(result).toBe(true);
        expect(settingsStore.requestOptionsData).toHaveBeenCalled();
    });

    it('returns false when requestOptionsData returns null', async () => {
        const { initialize } = await import(
            '../../../../../../Extension/src/pages/options/components/Options/Options-mv3'
        );

        settingsStore.requestOptionsData.mockResolvedValue(null);

        const result = await initialize(settingsStore as any, uiStore as any);

        expect(result).toBe(false);
    });

    it('shows filter limits notification when areFilterLimitsExceeded is true', async () => {
        const { initialize } = await import(
            '../../../../../../Extension/src/pages/options/components/Options/Options-mv3'
        );

        const runtimeInfo = {
            areFilterLimitsExceeded: true,
            isExtensionUpdateAvailable: false,
            isExtensionReloadedOnUpdate: false,
            isSuccessfulExtensionUpdate: false,
        };

        settingsStore.requestOptionsData.mockResolvedValue({
            runtimeInfo,
        });

        await initialize(settingsStore as any, uiStore as any);

        expect(uiStore.addRuleLimitsNotification).toHaveBeenCalled();
    });
});
