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
 * but WITHOUT ANY WARRANTY; even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import React, { createContext } from 'react';

import {
    cleanup,
    render,
    screen,
    fireEvent,
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

// --- Hoisted mock functions (configurable per test) ---

const mocks = vi.hoisted(() => ({
    applySettingsJson: vi.fn(),
    hasPrivacy: vi.fn(),
    ensurePermission: vi.fn(),
    handleFileUpload: vi.fn(),
    addNotification: vi.fn(),
    setShowLoader: vi.fn(),
    checkLimitations: vi.fn(),
    // Stores the file content for the handleFileUpload mock,
    // since File.text() is not available in jsdom.
    fileContent: '' as string,
}));

// --- Static mocks (hoisted by vitest) ---

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

vi.mock('../../../../../../Extension/src/common/translators/reactTranslator', () => ({
    reactTranslator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../../../Extension/src/pages/common/telemetry', () => ({
    useTelemetryPageViewEvent: vi.fn(),
}));

vi.mock('../../../../../../Extension/src/common/telemetry', () => ({
    TelemetryScreenName: { GeneralSettings: 'general_settings' },
}));

vi.mock('react-modal', () => {
    function Modal({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) {
        if (!isOpen) {
            return null;
        }
        return React.createElement('div', { 'data-testid': 'modal' }, children);
    }
    (Modal as any).setAppElement = vi.fn();
    return { __esModule: true, default: Modal };
});

// Mock heavy sub-components to avoid importing CSS, images, etc.
vi.mock('../../../../../../Extension/src/pages/options/components/Settings/SettingsSection', () => ({
    SettingsSection: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
}));

vi.mock('../../../../../../Extension/src/pages/options/components/Settings/SettingsSetCheckbox', () => ({
    SettingsSetCheckbox: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/options/components/Settings/SettingSetSelect', () => ({
    SettingSetSelect: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/options/components/Warnings', () => ({
    StaticFiltersLimitsWarning: () => null,
}));

// eslint-disable-next-line max-len
vi.mock('../../../../../../Extension/src/pages/options/components/Miscellaneous/ExtensionUsageDataModal/ExtensionUsageDataModal', () => ({
    ExtensionUsageDataModal: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/options/components/General/DesktopAppPromo', () => ({
    DesktopAppPromo: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/common/components/ui/Icon', () => ({
    Icon: () => React.createElement('svg'),
}));

vi.mock('../../../../../../Extension/src/pages/common/styles/theme', () => ({
    default: {
        modal: {
            overlay: 'overlay',
            wrapper: 'wrapper',
            modal: 'modal',
            modalScrollable: 'modalScrollable',
            content: 'content',
            header: 'header',
            title: 'title',
            subtitle: 'subtitle',
            actions: 'actions',
            btn: 'btn',
            btnClose: 'btnClose',
        },
    },
}));

// Mock dependencies with configurable per-test return values
vi.mock('../../../../../../Extension/src/common/permissions', () => ({
    Permissions: {
        hasPrivacy: mocks.hasPrivacy,
        addPrivacy: vi.fn(),
        hasPermissions: vi.fn(),
        addPermissions: vi.fn(),
    },
}));

vi.mock('../../../../../../Extension/src/pages/options/ensure-permission', () => ({
    ensurePermission: mocks.ensurePermission,
}));

vi.mock('../../../../../../Extension/src/pages/services/messenger', () => ({
    messenger: {
        applySettingsJson: mocks.applySettingsJson,
        generateShareUrl: vi.fn(),
        openExtensionStore: vi.fn(),
        updateFullscreenUserRulesTheme: vi.fn(),
    },
}));

vi.mock('../../../../../../Extension/src/pages/helpers', () => ({
    handleFileUpload: mocks.handleFileUpload,
}));

vi.mock('../../../../../../Extension/src/pages/common/utils/export', () => ({
    exportData: vi.fn(),
    ExportTypes: { Settings: 'settings' },
}));

vi.mock('../../../../../../Extension/src/pages/common/components/helpers', () => ({
    addMinDelayLoader: (_cb: unknown, callback: any) => callback,
}));

// --- Helpers ---

const EXTENSION_PATH = '../../../../../../Extension/src/pages/options/components/General/General';

/**
 * Builds a JSON settings string with the given stealth-block-webrtc value.
 */
const buildSettingsJson = (blockWebrtc: boolean): string => {
    return JSON.stringify({
        stealth: {
            'stealth-block-webrtc': blockWebrtc,
        },
    });
};

/**
 * Creates a mock file for testing file upload.
 */
const createJsonFile = (content: string): File => {
    return new File([content], 'settings.json', { type: 'application/json' });
};

/**
 * Sets up the mocks and renders the General component.
 *
 * @param options Configuration for the mocks.
 *
 * @returns The rendered component and mock functions for assertions.
 */
const setupAndRender = async (options: {
    hasPrivacy?: boolean;
    ensurePermissionResult?: boolean;
    applySettingsJsonResult?: boolean;
} = {}) => {
    const {
        hasPrivacy = false,
        ensurePermissionResult = true,
        applySettingsJsonResult = true,
    } = options;

    // Configure mock return values for this test
    mocks.applySettingsJson.mockResolvedValue(applySettingsJsonResult);
    mocks.hasPrivacy.mockResolvedValue(hasPrivacy);
    mocks.ensurePermission.mockResolvedValue(ensurePermissionResult);
    mocks.checkLimitations.mockResolvedValue(undefined);
    // Return the stored content instead of relying on File.text() (not available in jsdom)
    mocks.handleFileUpload.mockImplementation(() => Promise.resolve(mocks.fileContent));
    mocks.addNotification.mockClear();
    mocks.applySettingsJson.mockClear();
    mocks.hasPrivacy.mockClear();
    mocks.ensurePermission.mockClear();

    const store = {
        settingsStore: {
            settings: {
                names: {},
                values: {},
            },
            allowAcceptableAds: false,
            checkLimitations: mocks.checkLimitations,
            setAllowAcceptableAdsState: vi.fn(),
            updateSetting: vi.fn(),
        },
        uiStore: {
            addNotification: mocks.addNotification,
            setShowLoader: mocks.setShowLoader,
        },
        telemetryStore: {},
    };

    const context = createContext(store);

    vi.doMock('../../../../../../Extension/src/pages/options/stores/RootStore', () => ({
        rootStore: context,
    }));

    const { General } = await import(EXTENSION_PATH);

    const { container } = render(React.createElement(General));

    return {
        container,
        store,
        applySettingsJsonMock: mocks.applySettingsJson,
        hasPrivacyMock: mocks.hasPrivacy,
        ensurePermissionMock: mocks.ensurePermission,
        addNotificationMock: mocks.addNotification,
        checkLimitationsMock: mocks.checkLimitations,
    };
};

describe('General - Import settings with stealth-block-webrtc', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    /**
     * Helper: triggers the import flow by clicking the import button and
     * dispatching a change event on the hidden file input.
     */
    const triggerImport = async (content: string) => {
        // Store the content for the handleFileUpload mock to return
        mocks.fileContent = content;

        const importButton = screen.getByText('options_import_settings');
        fireEvent.click(importButton);

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        expect(input).toBeTruthy();
        fireEvent.change(input, { target: { files: [createJsonFile(content)] } });
    };

    /**
     * Helper: clicks the confirm button in the ConfirmModal.
     */
    const clickConfirmButton = () => {
        const confirmButton = screen.getByTitle('options_import_configuration_confirm_button');
        fireEvent.click(confirmButton);
    };

    describe('Import with stealth.stealth-block-webrtc = false', () => {
        it('should apply settings immediately', async () => {
            const content = buildSettingsJson(false);
            const { applySettingsJsonMock } = await setupAndRender();

            await triggerImport(content);

            await waitFor(() => {
                expect(applySettingsJsonMock).toHaveBeenCalledTimes(1);
                expect(applySettingsJsonMock).toHaveBeenCalledWith(content);
            });
        });

        it('should not open confirm modal', async () => {
            const content = buildSettingsJson(false);
            const { container } = await setupAndRender();

            await triggerImport(content);

            await waitFor(() => {
                expect(container.querySelector('[data-testid="modal"]')).toBeNull();
            });
        });

        it('should not call ensurePermission', async () => {
            const content = buildSettingsJson(false);
            const { hasPrivacyMock } = await setupAndRender();

            await triggerImport(content);

            await waitFor(() => {
                expect(hasPrivacyMock).not.toHaveBeenCalled();
            });
        });
    });

    describe('Import with stealth.stealth-block-webrtc = true and privacy already granted', () => {
        it('should apply settings immediately', async () => {
            const content = buildSettingsJson(true);
            const { applySettingsJsonMock } = await setupAndRender({ hasPrivacy: true });

            await triggerImport(content);

            await waitFor(() => {
                expect(applySettingsJsonMock).toHaveBeenCalledTimes(1);
                expect(applySettingsJsonMock).toHaveBeenCalledWith(content);
            });
        });

        it('should not open confirm modal', async () => {
            const content = buildSettingsJson(true);
            const { container } = await setupAndRender({ hasPrivacy: true });

            await triggerImport(content);

            await waitFor(() => {
                expect(container.querySelector('[data-testid="modal"]')).toBeNull();
            });
        });
    });

    describe('Import with stealth.stealth-block-webrtc = true and privacy not granted', () => {
        it('should store pending import and show ConfirmModal', async () => {
            const content = buildSettingsJson(true);
            const { container } = await setupAndRender({ hasPrivacy: false });

            await triggerImport(content);

            await waitFor(() => {
                expect(container.querySelector('[data-testid="modal"]')).not.toBeNull();
            });
        });

        it('should not apply settings before confirmation', async () => {
            const content = buildSettingsJson(true);
            const { applySettingsJsonMock } = await setupAndRender({ hasPrivacy: false });

            await triggerImport(content);

            await waitFor(() => {
                expect(applySettingsJsonMock).not.toHaveBeenCalled();
            });
        });
    });

    describe('Confirm pending import and permission granted', () => {
        it('should call messenger.applySettingsJson() after modal confirm', async () => {
            const content = buildSettingsJson(true);
            const { applySettingsJsonMock, container } = await setupAndRender({
                hasPrivacy: false,
                ensurePermissionResult: true,
            });

            await triggerImport(content);

            await waitFor(() => {
                expect(container.querySelector('[data-testid="modal"]')).not.toBeNull();
            });

            clickConfirmButton();

            await waitFor(() => {
                expect(applySettingsJsonMock).toHaveBeenCalledTimes(1);
                expect(applySettingsJsonMock).toHaveBeenCalledWith(content);
            });
        });

        it('should show success notification', async () => {
            const content = buildSettingsJson(true);
            const { addNotificationMock, container } = await setupAndRender({
                hasPrivacy: false,
                ensurePermissionResult: true,
                applySettingsJsonResult: true,
            });

            await triggerImport(content);

            await waitFor(() => {
                expect(container.querySelector('[data-testid="modal"]')).not.toBeNull();
            });

            clickConfirmButton();

            await waitFor(() => {
                expect(addNotificationMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'success',
                        text: 'options_popup_import_success_title',
                    }),
                );
            });
        });
    });

    describe('Confirm pending import and permission denied', () => {
        it('should not call messenger.applySettingsJson()', async () => {
            const content = buildSettingsJson(true);
            const { applySettingsJsonMock, container } = await setupAndRender({
                hasPrivacy: false,
                ensurePermissionResult: false,
            });

            await triggerImport(content);

            await waitFor(() => {
                expect(container.querySelector('[data-testid="modal"]')).not.toBeNull();
            });

            clickConfirmButton();

            await waitFor(() => {
                expect(applySettingsJsonMock).not.toHaveBeenCalled();
            });
        });

        it('should show the privacy-permission error notification', async () => {
            const content = buildSettingsJson(true);
            const { addNotificationMock, container } = await setupAndRender({
                hasPrivacy: false,
                ensurePermissionResult: false,
            });

            await triggerImport(content);

            await waitFor(() => {
                expect(container.querySelector('[data-testid="modal"]')).not.toBeNull();
            });

            clickConfirmButton();

            await waitFor(() => {
                expect(addNotificationMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'error',
                        text: 'options_popup_import_error_required_privacy_permission',
                    }),
                );
            });
        });
    });

    describe('Invalid JSON / unparsable stealth.stealth-block-webrtc', () => {
        it('should show import error notification', async () => {
            const invalidContent = JSON.stringify({
                stealth: {
                    'stealth-block-webrtc': 'not-a-boolean',
                },
            });

            const { addNotificationMock, applySettingsJsonMock } = await setupAndRender();

            await triggerImport(invalidContent);

            await waitFor(() => {
                expect(addNotificationMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'error',
                        text: 'options_popup_import_error_title',
                    }),
                );
            });

            expect(applySettingsJsonMock).not.toHaveBeenCalled();
        });
    });
});
