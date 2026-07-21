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
    render,
    screen,
    fireEvent,
    cleanup,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    it,
    expect,
    vi,
} from 'vitest';

import { AllowlistMenu } from '../../../../../../Extension/src/pages/options/components/Allowlist/AllowlistMenu';

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    translator: { getMessage: (key: any) => key },
}));

const mountMenu = (
    onImportClick: () => void,
    onExportClick: () => void,
    exportDisabled = false,
) => render(
    React.createElement(AllowlistMenu, {
        onImportClick,
        onExportClick,
        exportDisabled,
    }),
);

const openMenu = () => {
    // MenuDropDown trigger is a button with the aria-label we pass in.
    fireEvent.click(screen.getByRole('button', { name: 'options_allowlist_menu' }));
};

describe('AllowlistMenu', () => {
    beforeEach(() => {
        cleanup();
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders the menu trigger with an allowlist aria-label', () => {
        mountMenu(vi.fn(), vi.fn());
        expect(screen.getByRole('button', { name: 'options_allowlist_menu' })).toBeTruthy();
    });

    it('renders only Import and Export items (no delete, no rule syntax)', () => {
        mountMenu(vi.fn(), vi.fn());
        openMenu();
        const items = screen.getAllByRole('menuitem');
        expect(items).toHaveLength(2);
        expect(screen.getByText('options_userfilter_import')).toBeTruthy();
        expect(screen.getByText('options_userfilter_export')).toBeTruthy();
    });

    it('forwards import clicks to the parent handler', () => {
        const onImportClick = vi.fn();
        mountMenu(onImportClick, vi.fn());
        openMenu();
        fireEvent.click(screen.getByText('options_userfilter_import'));
        expect(onImportClick).toHaveBeenCalledTimes(1);
    });

    it('forwards export clicks to the parent handler', () => {
        const onExportClick = vi.fn();
        mountMenu(vi.fn(), onExportClick);
        openMenu();
        fireEvent.click(screen.getByText('options_userfilter_export'));
        expect(onExportClick).toHaveBeenCalledTimes(1);
    });

    it('disables the Export item when exportDisabled is true', () => {
        mountMenu(vi.fn(), vi.fn(), true);
        openMenu();
        const exportItem = screen.getByText('options_userfilter_export').closest('button');
        expect(exportItem?.disabled).toBe(true);
    });

    it('does not disable the Export item when exportDisabled is false', () => {
        mountMenu(vi.fn(), vi.fn(), false);
        openMenu();
        const exportItem = screen.getByText('options_userfilter_export').closest('button');
        expect(exportItem?.disabled).toBe(false);
    });
});
