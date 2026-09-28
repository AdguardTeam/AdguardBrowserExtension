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
    beforeAll,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    type getAutoDisableNotificationMessage as getMessage,
} from '../../../../../../Extension/src/pages/options/components/AutoDisableNotification/message';

/**
 * Mocks the locale provider, because the repository's default test provider
 * returns keys. The setup file preloads the real provider, so the module
 * registry is reset before the helper is imported.
 */
vi.doMock('../../../../../../Extension/src/common/translators/i18n', async () => {
    const { default: messages } = await import('../../../../../../Extension/_locales/en/messages.json');
    const catalog: Record<string, { message: string }> = messages;
    return {
        i18n: {
            getMessage: (key: string) => catalog[key]?.message ?? '',
            getBaseMessage: (key: string) => catalog[key]?.message ?? '',
            getUILanguage: () => 'en',
            getBaseUILanguage: () => 'en',
        },
    };
});

let getAutoDisableNotificationMessage: typeof getMessage;

beforeAll(async () => {
    vi.resetModules();
    ({ getAutoDisableNotificationMessage } = await import(
        '../../../../../../Extension/src/pages/options/components/AutoDisableNotification/message'
    ));
});

describe('automatic-disable message', () => {
    it('produces no text for an empty batch', () => {
        expect(getAutoDisableNotificationMessage([])).toBeNull();
    });

    it('uses the display name for one filter', () => {
        expect(getAutoDisableNotificationMessage([{ filterId: 6, name: 'AdGuard German filter' }]))
            .toBe('AdGuard German filter was turned off as unused. This frees up room for filters you use more often');
    });

    it('uses the filter count for two filters', () => {
        const filters = [{ filterId: 1, name: 'Filter 1' }, { filterId: 2, name: 'Filter 2' }];
        expect(getAutoDisableNotificationMessage(filters))
            .toBe('2 language filters were turned off as unused. This frees up room for filters you use more often');
    });

    it('uses the filter count for five filters', () => {
        const filters = Array.from({ length: 5 }, (_, index) => ({ filterId: index, name: `Filter ${index}` }));
        expect(getAutoDisableNotificationMessage(filters))
            .toBe('5 language filters were turned off as unused. This frees up room for filters you use more often');
    });
});
