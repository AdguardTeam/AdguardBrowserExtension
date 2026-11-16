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

import React from 'react';

import {
    cleanup,
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    BlockFingerprintingWarning,
} from '../../../../../../Extension/src/pages/options/components/Stealth/BlockFingerprintingWarning';

const mocks = vi.hoisted(() => ({
    shouldShowCanvasProtectionUserScriptsWarning: vi.fn(),
    reapplyCanvasProtection: vi.fn(),
}));

vi.mock('../../../../../../Extension/src/common/user-scripts-api', () => ({
    shouldShowCanvasProtectionUserScriptsWarning: mocks.shouldShowCanvasProtectionUserScriptsWarning,
}));

vi.mock('../../../../../../Extension/src/pages/services/messenger', () => ({
    messenger: {
        reapplyCanvasProtection: mocks.reapplyCanvasProtection,
    },
}));

vi.mock('../../../../../../Extension/src/pages/options/components/Warnings', () => ({
    UserScriptsApiRequiredMessage: () => (
        <div data-testid="user-scripts-api-required-message">
            user-scripts-api-required-message
        </div>
    ),
}));

vi.mock('../../../../../../Extension/src/common/logger', () => ({
    logger: {
        error: vi.fn(),
    },
}));

describe('BlockFingerprintingWarning', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.reapplyCanvasProtection.mockResolvedValue(undefined);
    });

    afterEach(() => {
        cleanup();
    });

    it('shows the user scripts message while the check is true', () => {
        mocks.shouldShowCanvasProtectionUserScriptsWarning.mockReturnValue(true);

        render(<BlockFingerprintingWarning />);

        expect(screen.queryByTestId('user-scripts-api-required-message')).not.toBeNull();
    });

    it('does not send reapplyCanvasProtection while the check is true', () => {
        mocks.shouldShowCanvasProtectionUserScriptsWarning.mockReturnValue(true);

        render(<BlockFingerprintingWarning />);
        fireEvent.focus(window);

        expect(mocks.reapplyCanvasProtection).not.toHaveBeenCalled();
    });

    it('sends reapplyCanvasProtection once and hides the message when the check turns false', () => {
        mocks.shouldShowCanvasProtectionUserScriptsWarning.mockReturnValue(true);
        render(<BlockFingerprintingWarning />);
        expect(screen.queryByTestId('user-scripts-api-required-message')).not.toBeNull();

        mocks.shouldShowCanvasProtectionUserScriptsWarning.mockReturnValue(false);
        fireEvent.focus(window);
        fireEvent.focus(window);

        expect(mocks.reapplyCanvasProtection).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('user-scripts-api-required-message')).toBeNull();
    });

    it('sends reapplyCanvasProtection once on mount when the check is false', () => {
        mocks.shouldShowCanvasProtectionUserScriptsWarning.mockReturnValue(false);
        const { container } = render(<BlockFingerprintingWarning />);
        expect(container.innerHTML).toBe('');

        fireEvent.focus(window);

        expect(mocks.reapplyCanvasProtection).toHaveBeenCalledTimes(1);
    });
});
