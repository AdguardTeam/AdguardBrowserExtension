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
import { MemoryRouter } from 'react-router-dom';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
} from 'vitest';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';

/**
 * Creates a mock rootStore context with the given override values.
 *
 * @param overrides Override values for rulesLimits.
 *
 * @returns An object with the React context and the store.
 */
const createMockRootStore = (overrides: {
    areFilterLimitsExceeded?: boolean;
    shouldShowLimitLoweredWarning?: boolean;
}) => {
    const {
        areFilterLimitsExceeded = false,
        shouldShowLimitLoweredWarning = false,
    } = overrides;

    const store = {
        settingsStore: {
            rulesLimits: {
                areFilterLimitsExceeded,
                shouldShowLimitLoweredWarning,
            },
        },
        telemetryStore: {
            sendCustomEvent: vi.fn(),
        },
    };

    return { context: createContext(store), store };
};

describe.skipIf(!__IS_MV3__)('WarningVariantB', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    describe('rendering', () => {
        it('should render nothing when neither limit is exceeded nor lowered', async () => {
            const { context } = createMockRootStore({
                areFilterLimitsExceeded: false,
                shouldShowLimitLoweredWarning: false,
            });

            vi.doMock(
                '../../../../../../../Extension/src/pages/options/stores/RootStore',
                () => ({ rootStore: context }),
            );

            const { WarningVariantB } = await import(
                '../../../../../../../Extension/src/pages/options/components/RulesLimits/Warning/WarningVariantB'
            );

            const { container } = render(
                React.createElement(WarningVariantB, { onClickCloseWarning: vi.fn() }),
                { wrapper: MemoryRouter },
            );
            expect(container.innerHTML).toBe('');
        });

        it('should render warning when limit is exceeded', async () => {
            const { context } = createMockRootStore({
                areFilterLimitsExceeded: true,
                shouldShowLimitLoweredWarning: false,
            });

            vi.doMock(
                '../../../../../../../Extension/src/pages/options/stores/RootStore',
                () => ({ rootStore: context }),
            );

            const { WarningVariantB } = await import(
                '../../../../../../../Extension/src/pages/options/components/RulesLimits/Warning/WarningVariantB'
            );

            const { container } = render(
                React.createElement(WarningVariantB, { onClickCloseWarning: vi.fn() }),
                { wrapper: MemoryRouter },
            );
            expect(container.innerHTML).toContain('options_rule_limits_warning_variant_b_title_limit_reached');
        });

        it('should render warning when limit is lowered', async () => {
            const { context } = createMockRootStore({
                areFilterLimitsExceeded: false,
                shouldShowLimitLoweredWarning: true,
            });

            vi.doMock(
                '../../../../../../../Extension/src/pages/options/stores/RootStore',
                () => ({ rootStore: context }),
            );

            const { WarningVariantB } = await import(
                '../../../../../../../Extension/src/pages/options/components/RulesLimits/Warning/WarningVariantB'
            );

            const { container } = render(
                React.createElement(WarningVariantB, { onClickCloseWarning: vi.fn() }),
                { wrapper: MemoryRouter },
            );
            expect(container.innerHTML).toContain('options_rule_limits_warning_variant_b_title_limit_lowered');
        });

        it('should render desktop app section in both cases', async () => {
            const { context } = createMockRootStore({
                areFilterLimitsExceeded: true,
                shouldShowLimitLoweredWarning: false,
            });

            vi.doMock(
                '../../../../../../../Extension/src/pages/options/stores/RootStore',
                () => ({ rootStore: context }),
            );

            const { WarningVariantB } = await import(
                '../../../../../../../Extension/src/pages/options/components/RulesLimits/Warning/WarningVariantB'
            );

            const { container } = render(
                React.createElement(WarningVariantB, { onClickCloseWarning: vi.fn() }),
                { wrapper: MemoryRouter },
            );
            expect(container.innerHTML).toContain('options_desktop_app_promo_button_mac');
        });
    });

    describe('interactions', () => {
        it('should call onClickCloseWarning when close button is clicked', async () => {
            const onClickCloseWarning = vi.fn();
            const { context } = createMockRootStore({
                areFilterLimitsExceeded: true,
                shouldShowLimitLoweredWarning: false,
            });

            vi.doMock(
                '../../../../../../../Extension/src/pages/options/stores/RootStore',
                () => ({ rootStore: context }),
            );

            const { WarningVariantB } = await import(
                '../../../../../../../Extension/src/pages/options/components/RulesLimits/Warning/WarningVariantB'
            );

            render(
                React.createElement(WarningVariantB, { onClickCloseWarning }),
                { wrapper: MemoryRouter },
            );
            const closeButton = document.querySelector('button');
            fireEvent.click(closeButton!);
            expect(onClickCloseWarning).toHaveBeenCalledTimes(1);
        });
    });
});
