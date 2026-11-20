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

import React, { createContext } from 'react';

import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { SettingOption } from '../../../../../../Extension/src/background/schema/settings/enum';
import { TelemetryEventName, TelemetryScreenName } from '../../../../../../Extension/src/common/telemetry';
import { TelemetryStore } from '../../../../../../Extension/src/pages/common/telemetry/TelemetryStore';

const mocks = vi.hoisted(() => ({
    sendTelemetryCustomEvent: vi.fn(),
    updateSetting: vi.fn(),
    isUserScriptsApiUnavailable: { value: false },
}));

vi.mock('../../../../../../Extension/src/common/logger', () => ({
    logger: {
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    translator: {
        getMessage: (key: string) => key,
    },
}));

vi.mock('../../../../../../Extension/src/common/translators/reactTranslator', () => ({
    reactTranslator: {
        getMessage: (key: string) => key,
    },
}));

vi.mock('../../../../../../Extension/src/pages/services/messenger', () => ({
    messenger: {
        sendTelemetryCustomEvent: mocks.sendTelemetryCustomEvent,
    },
}));

vi.mock('../../../../../../Extension/src/pages/options/ensure-permission', () => ({
    ensurePermission: vi.fn(),
}));

vi.mock('../../../../../../Extension/src/common/user-scripts-api', () => ({
    shouldShowCanvasProtectionUserScriptsWarning: () => mocks.isUserScriptsApiUnavailable.value,
}));

const BLOCK_FINGERPRINTING_WARNING_TEST_ID = 'block-fingerprinting-warning';

vi.mock('../../../../../../Extension/src/pages/options/components/Stealth/BlockFingerprintingWarning', () => ({
    BlockFingerprintingWarning: ({ isUnavailable }: { isUnavailable: boolean }) => (
        isUnavailable ? <div data-testid={BLOCK_FINGERPRINTING_WARNING_TEST_ID} /> : null
    ),
}));

const renderStealth = async (isBlockFingerprintingEnabled: boolean, allowTelemetry = true) => {
    const telemetryStore = new TelemetryStore();
    telemetryStore.setIsAnonymizedUsageDataAllowed(allowTelemetry);

    const settingsStore = {
        settings: {
            names: SettingOption,
            values: {
                [SettingOption.DisableStealthMode]: false,
                [SettingOption.BlockFingerprinting]: isBlockFingerprintingEnabled,
            },
        },
        blockKnownTrackers: false,
        stripTrackingParameters: false,
        isChrome: false,
        updateSetting: mocks.updateSetting,
    };

    const context = createContext({
        settingsStore,
        uiStore: { setShowLoader: vi.fn() },
        telemetryStore,
    });

    vi.doMock('../../../../../../Extension/src/pages/options/stores/RootStore', () => ({
        rootStore: context,
    }));

    const { Stealth } = await import('../../../../../../Extension/src/pages/options/components/Stealth/Stealth');

    render(<Stealth />);
};

const getBlockFingerprintingToggle = () => {
    return screen.getByRole('checkbox', { name: 'options_block_fingerprinting_title' });
};

beforeEach(() => {
    vi.resetModules();
    mocks.isUserScriptsApiUnavailable.value = false;
});

describe('Stealth Block fingerprinting toggle telemetry', () => {
    beforeEach(() => {
        mocks.sendTelemetryCustomEvent.mockReset();
        mocks.sendTelemetryCustomEvent.mockResolvedValue(undefined);
        mocks.updateSetting.mockReset();
        mocks.updateSetting.mockResolvedValue(undefined);
    });

    afterEach(() => {
        cleanup();
    });

    it('sends block_fingerprinting_click when the toggle is turned on', async () => {
        await renderStealth(false);

        fireEvent.click(getBlockFingerprintingToggle());

        expect(mocks.sendTelemetryCustomEvent).toHaveBeenCalledOnce();
        expect(mocks.sendTelemetryCustomEvent).toHaveBeenCalledWith(
            TelemetryScreenName.TrackingProtectionScreen,
            TelemetryEventName.BlockFingerprintingClick,
        );
        await waitFor(() => {
            expect(mocks.updateSetting).toHaveBeenCalledWith(SettingOption.BlockFingerprinting, true, false);
        });
    });

    it('sends block_fingerprinting_click when the toggle is turned off', async () => {
        await renderStealth(true);

        fireEvent.click(getBlockFingerprintingToggle());

        expect(mocks.sendTelemetryCustomEvent).toHaveBeenCalledOnce();
        expect(mocks.sendTelemetryCustomEvent).toHaveBeenCalledWith(
            TelemetryScreenName.TrackingProtectionScreen,
            TelemetryEventName.BlockFingerprintingClick,
        );
        await waitFor(() => {
            expect(mocks.updateSetting).toHaveBeenCalledWith(SettingOption.BlockFingerprinting, false, false);
        });
    });

    it('does not send block_fingerprinting_click without consent to anonymized usage data', async () => {
        await renderStealth(false, false);

        fireEvent.click(getBlockFingerprintingToggle());

        await waitFor(() => {
            expect(mocks.updateSetting).toHaveBeenCalledWith(SettingOption.BlockFingerprinting, true, false);
        });
        expect(mocks.sendTelemetryCustomEvent).not.toHaveBeenCalled();
    });
});

describe('Stealth Block fingerprinting warning', () => {
    afterEach(() => {
        cleanup();
    });

    it('shows the warning when the toggle is on', async () => {
        mocks.isUserScriptsApiUnavailable.value = true;

        await renderStealth(true);

        expect(screen.getByTestId(BLOCK_FINGERPRINTING_WARNING_TEST_ID)).toBeDefined();
    });

    it('shows the warning when the toggle is off but the User Scripts API is unavailable', async () => {
        mocks.isUserScriptsApiUnavailable.value = true;

        await renderStealth(false);

        expect(screen.getByTestId(BLOCK_FINGERPRINTING_WARNING_TEST_ID)).toBeDefined();
    });

    it('hides the warning when the User Scripts API is available', async () => {
        await renderStealth(false);

        expect(screen.queryByTestId(BLOCK_FINGERPRINTING_WARNING_TEST_ID)).toBeNull();
    });

    it('keeps the toggle enabled while the User Scripts API is unavailable', async () => {
        mocks.isUserScriptsApiUnavailable.value = true;

        await renderStealth(false);

        expect((getBlockFingerprintingToggle() as HTMLInputElement).disabled).toBe(false);
    });

    it('keeps the toggle enabled when it is on without the User Scripts API', async () => {
        mocks.isUserScriptsApiUnavailable.value = true;

        await renderStealth(true);

        expect((getBlockFingerprintingToggle() as HTMLInputElement).disabled).toBe(false);
    });

    it('updates the setting when the toggle is turned on without the API', async () => {
        mocks.isUserScriptsApiUnavailable.value = true;
        mocks.updateSetting.mockReset();
        mocks.updateSetting.mockResolvedValue(undefined);

        await renderStealth(false);
        fireEvent.click(getBlockFingerprintingToggle());

        await waitFor(() => {
            expect(mocks.updateSetting).toHaveBeenCalledWith(SettingOption.BlockFingerprinting, true, false);
        });
    });

    it('marks the row while the User Scripts API is unavailable', async () => {
        mocks.isUserScriptsApiUnavailable.value = true;

        await renderStealth(false);

        const row = getBlockFingerprintingToggle().closest('.setting-checkbox');
        expect(row).not.toBeNull();
        expect(row?.classList.contains('stealth__fingerprinting--unavailable')).toBe(true);
    });

    it('does not mark the row when the User Scripts API is available', async () => {
        await renderStealth(false);

        const row = getBlockFingerprintingToggle().closest('.setting-checkbox');
        expect(row?.classList.contains('stealth__fingerprinting--unavailable')).toBe(false);
    });

    it('hides the warning after the permission is granted', async () => {
        mocks.isUserScriptsApiUnavailable.value = true;

        await renderStealth(false);
        expect(screen.getByTestId(BLOCK_FINGERPRINTING_WARNING_TEST_ID)).toBeDefined();

        mocks.isUserScriptsApiUnavailable.value = false;
        fireEvent.focus(window);

        await waitFor(() => {
            expect(screen.queryByTestId(BLOCK_FINGERPRINTING_WARNING_TEST_ID)).toBeNull();
        });
    });
});
