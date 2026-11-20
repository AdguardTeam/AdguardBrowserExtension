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
    reapplyCanvasProtection: vi.fn(),
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

    it('shows the user scripts message while the API is unavailable', () => {
        render(<BlockFingerprintingWarning isUnavailable isBlockFingerprintingEnabled />);

        expect(screen.queryByTestId('user-scripts-api-required-message')).not.toBeNull();
    });

    it('shows the user scripts message even when the setting is off', () => {
        render(<BlockFingerprintingWarning isUnavailable isBlockFingerprintingEnabled={false} />);

        expect(screen.queryByTestId('user-scripts-api-required-message')).not.toBeNull();
    });

    it('does not send reapplyCanvasProtection while the API is unavailable', () => {
        render(<BlockFingerprintingWarning isUnavailable isBlockFingerprintingEnabled />);

        expect(mocks.reapplyCanvasProtection).not.toHaveBeenCalled();
    });

    it('hides the message and sends reapplyCanvasProtection when the API becomes available', () => {
        const { rerender } = render(
            <BlockFingerprintingWarning isUnavailable isBlockFingerprintingEnabled />,
        );
        expect(screen.queryByTestId('user-scripts-api-required-message')).not.toBeNull();

        rerender(<BlockFingerprintingWarning isUnavailable={false} isBlockFingerprintingEnabled />);

        expect(mocks.reapplyCanvasProtection).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('user-scripts-api-required-message')).toBeNull();
    });

    it('sends reapplyCanvasProtection once on mount when the API is available and the setting is on', () => {
        const { container } = render(
            <BlockFingerprintingWarning isUnavailable={false} isBlockFingerprintingEnabled />,
        );
        expect(container.innerHTML).toBe('');

        expect(mocks.reapplyCanvasProtection).toHaveBeenCalledTimes(1);
    });

    it('does not send reapplyCanvasProtection when the API is available and the setting is off', () => {
        render(<BlockFingerprintingWarning isUnavailable={false} isBlockFingerprintingEnabled={false} />);

        expect(mocks.reapplyCanvasProtection).not.toHaveBeenCalled();
    });
});
