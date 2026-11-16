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
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    shouldShowCanvasProtectionUserScriptsWarning,
} from '../../../../Extension/src/common/user-scripts-api/user-scripts-api-mv3';

describe('shouldShowCanvasProtectionUserScriptsWarning', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns false when the user scripts API is available', () => {
        vi.stubGlobal('chrome', {
            userScripts: {
                getScripts: vi.fn(),
            },
        });

        expect(shouldShowCanvasProtectionUserScriptsWarning()).toBe(false);
    });

    it('returns true when the user scripts API is not available', () => {
        vi.stubGlobal('chrome', {});

        expect(shouldShowCanvasProtectionUserScriptsWarning()).toBe(true);
    });

    it('returns true when the user scripts API throws', () => {
        vi.stubGlobal('chrome', {
            userScripts: {
                getScripts: vi.fn(() => {
                    throw new Error('Permission is not granted');
                }),
            },
        });

        expect(shouldShowCanvasProtectionUserScriptsWarning()).toBe(true);
    });
});
