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

import { TelemetryEventName, TelemetryScreenName } from '../../../../../../../Extension/src/common/telemetry';

/**
 * Creates a mock rootStore context.
 *
 * @returns An object with the React context and the store.
 */
const createMockRootStore = () => {
    const store = {
        telemetryStore: {
            sendCustomEvent: vi.fn(),
        },
    };

    return { context: createContext(store), store };
};

describe.skipIf(!__IS_MV3__)('Warning', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    describe('rendering', () => {
        it('should render warning title and subtitle', async () => {
            const { context } = createMockRootStore();

            vi.doMock(
                '../../../../../../../Extension/src/pages/options/stores/RootStore',
                () => ({ rootStore: context }),
            );

            const { Warning } = await import(
                '../../../../../../../Extension/src/pages/options/components/RulesLimits/Warning/Warning'
            );

            const { container } = render(
                React.createElement(Warning, { onClickCloseWarning: vi.fn() }),
                { wrapper: MemoryRouter },
            );
            expect(container.innerHTML).toContain('options_rule_limits_warning_variant_b_title_limit_reached');
            expect(container.innerHTML).toContain('options_rule_limits_warning_variant_b_subtitle');
        });

        it('should render action sections and desktop app section', async () => {
            const { context } = createMockRootStore();

            vi.doMock(
                '../../../../../../../Extension/src/pages/options/stores/RootStore',
                () => ({ rootStore: context }),
            );

            const { Warning } = await import(
                '../../../../../../../Extension/src/pages/options/components/RulesLimits/Warning/Warning'
            );

            const { container } = render(
                React.createElement(Warning, { onClickCloseWarning: vi.fn() }),
                { wrapper: MemoryRouter },
            );
            expect(container.innerHTML).toContain('options_rule_limits_warning_variant_b_remove_blockers_title');
            expect(container.innerHTML).toContain('options_rule_limits_warning_variant_b_review_filters_title');
            expect(container.innerHTML).toContain('options_rule_limits_warning_variant_b_desktop_app_title');
            expect(container.innerHTML).toContain('options_desktop_app_promo_button_');
        });
    });

    describe('interactions', () => {
        it('should call onClickCloseWarning when close button is clicked', async () => {
            const onClickCloseWarning = vi.fn();
            const { context } = createMockRootStore();

            vi.doMock(
                '../../../../../../../Extension/src/pages/options/stores/RootStore',
                () => ({ rootStore: context }),
            );

            const { Warning } = await import(
                '../../../../../../../Extension/src/pages/options/components/RulesLimits/Warning/Warning'
            );

            render(
                React.createElement(Warning, { onClickCloseWarning }),
                { wrapper: MemoryRouter },
            );
            const closeButton = document.querySelector('button');
            fireEvent.click(closeButton!);
            expect(onClickCloseWarning).toHaveBeenCalledTimes(1);
        });

        it('should send telemetry event and open extensions page when Manage extensions is clicked', async () => {
            const openExtensionsSettingsPage = vi.fn().mockResolvedValue(undefined);
            const { context, store } = createMockRootStore();

            vi.doMock(
                '../../../../../../../Extension/src/pages/services/messenger',
                () => ({
                    messenger: { openExtensionsSettingsPage },
                }),
            );

            vi.doMock(
                '../../../../../../../Extension/src/pages/options/stores/RootStore',
                () => ({ rootStore: context }),
            );

            const { Warning } = await import(
                '../../../../../../../Extension/src/pages/options/components/RulesLimits/Warning/Warning'
            );

            render(
                React.createElement(Warning, { onClickCloseWarning: vi.fn() }),
                { wrapper: MemoryRouter },
            );

            const buttons = document.querySelectorAll('button');
            const manageBtn = Array.from(buttons).find(
                (b) => b.textContent?.includes('options_rule_limits_warning_variant_b_manage_extensions'),
            );
            expect(manageBtn).toBeTruthy();
            fireEvent.click(manageBtn!);
            expect(openExtensionsSettingsPage).toHaveBeenCalledTimes(1);
            expect(store.telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
                TelemetryEventName.ManageExtensionsClick,
                TelemetryScreenName.RulesLimitsError,
            );
        });

        it('should send telemetry event when Go to filters is clicked', async () => {
            const { context, store } = createMockRootStore();

            vi.doMock(
                '../../../../../../../Extension/src/pages/options/stores/RootStore',
                () => ({ rootStore: context }),
            );

            const { Warning } = await import(
                '../../../../../../../Extension/src/pages/options/components/RulesLimits/Warning/Warning'
            );

            render(
                React.createElement(Warning, { onClickCloseWarning: vi.fn() }),
                { wrapper: MemoryRouter },
            );

            const links = document.querySelectorAll('a');
            const goToFiltersLink = Array.from(links).find(
                (l) => l.textContent?.includes('options_rule_limits_warning_variant_b_go_to_filters'),
            );
            expect(goToFiltersLink).toBeTruthy();
            fireEvent.click(goToFiltersLink!);
            expect(store.telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
                TelemetryEventName.ReactivateFiltersClick,
                TelemetryScreenName.RulesLimitsError,
            );
        });
    });
});
