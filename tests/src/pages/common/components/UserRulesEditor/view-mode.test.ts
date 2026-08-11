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
    it,
    expect,
} from 'vitest';

import {
    VIEW_MODE_STORAGE_KEY,
    ViewMode,
    readViewMode,
    writeViewMode,
} from '../../../../../../Extension/src/pages/common/components/UserRulesEditor/view-mode';

describe('view-mode persistence', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('defaults to view mode when nothing is stored', () => {
        expect(readViewMode()).toBe(ViewMode.List);
    });

    it('reads an explicitly stored edit mode', () => {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, ViewMode.Editor);
        expect(readViewMode()).toBe(ViewMode.Editor);
    });

    it('reads an explicitly stored view mode', () => {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, ViewMode.List);
        expect(readViewMode()).toBe(ViewMode.List);
    });

    it('falls back to view mode for an invalid stored value', () => {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, 'bogus');
        expect(readViewMode()).toBe(ViewMode.List);
    });

    it('writes the view mode to localStorage', () => {
        writeViewMode(ViewMode.Editor);
        expect(localStorage.getItem(VIEW_MODE_STORAGE_KEY)).toBe(ViewMode.Editor);

        writeViewMode(ViewMode.List);
        expect(localStorage.getItem(VIEW_MODE_STORAGE_KEY)).toBe(ViewMode.List);
    });
});
