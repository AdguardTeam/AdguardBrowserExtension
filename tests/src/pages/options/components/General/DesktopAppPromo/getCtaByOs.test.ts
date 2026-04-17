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

vi.mock('../../../../../../../Extension/src/common/translators/translator', () => ({
    translator: {
        getMessage: (key: string) => key,
    },
}));

describe('getCtaByOs', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return macOS CTA when UserAgent.isMacOs is true', async () => {
        vi.doMock('../../../../../../../Extension/src/common/user-agent', () => ({
            UserAgent: { isMacOs: true, isWindows: false },
        }));

        const { getCtaByOs } = await import(
            '../../../../../../../Extension/src/pages/options/components/General/DesktopAppPromo/DesktopAppPromo'
        );

        const result = getCtaByOs();

        expect(result.text).toBe('options_desktop_app_promo_button_mac');
        expect(result.url).toContain('desktop_app_promo_mac');
        expect(result.url).toContain('forward.html');
    });

    it('should return Windows CTA when UserAgent.isWindows is true', async () => {
        vi.doMock('../../../../../../../Extension/src/common/user-agent', () => ({
            UserAgent: { isMacOs: false, isWindows: true },
        }));

        const { getCtaByOs } = await import(
            '../../../../../../../Extension/src/pages/options/components/General/DesktopAppPromo/DesktopAppPromo'
        );

        const result = getCtaByOs();

        expect(result.text).toBe('options_desktop_app_promo_button_windows');
        expect(result.url).toContain('desktop_app_promo_windows');
    });

    it('should return Linux CTA as fallback when neither macOS nor Windows', async () => {
        vi.doMock('../../../../../../../Extension/src/common/user-agent', () => ({
            UserAgent: { isMacOs: false, isWindows: false },
        }));

        const { getCtaByOs } = await import(
            '../../../../../../../Extension/src/pages/options/components/General/DesktopAppPromo/DesktopAppPromo'
        );

        const result = getCtaByOs();

        expect(result.text).toBe('options_desktop_app_promo_button_linux');
        expect(result.url).toContain('desktop_app_promo_linux');
    });
});
