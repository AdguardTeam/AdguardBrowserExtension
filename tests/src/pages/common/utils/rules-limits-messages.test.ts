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
    type getStaticWarningMessage as getMessage,
} from '../../../../../Extension/src/pages/common/utils/rules-limits-messages';

/**
 * Mocks the locale provider, because the repository's default test provider
 * returns keys. The setup file preloads the real provider, so the module
 * registry is reset before the helper is imported.
 */
vi.doMock('../../../../../Extension/src/common/translators/i18n', async () => {
    const { default: messages } = await import('../../../../../Extension/_locales/en/messages.json');
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

let getStaticWarningMessage: typeof getMessage;

beforeAll(async () => {
    vi.resetModules();
    ({ getStaticWarningMessage } = await import(
        '../../../../../Extension/src/pages/common/utils/rules-limits-messages'
    ));
});

describe('static limits warning message', () => {
    it('warns about the reached filters limit', () => {
        const expected = "You've reached your browser's limit for active built-in filters. "
            + '50 of 51 filters are enabled. To activate new filters, disable some built-in ones';

        expect(getStaticWarningMessage({
            type: 'static',
            filtersCount: { current: 51, maximum: 50 },
        })).toBe(expected);
    });

    it('warns about the reached rules limit', () => {
        const expected = "You've reached your browser's limit for active built-in rules. "
            + 'To activate new rules, disable some built-in filters';

        expect(getStaticWarningMessage({
            type: 'static',
            rulesCount: { current: 51, maximum: 50 },
        })).toBe(expected);
    });

    it('warns about the session rules limit', () => {
        const expected = "You've reached the limit of active built-in rules. "
            + '4994 of 4996 rules are enabled. '
            + 'To activate new rules, disable some built-in filters.';

        expect(getStaticWarningMessage({
            type: 'static',
            rulesSessionCount: { current: 4996, maximum: 4994 },
        })).toBe(expected);
    });

    it('returns null when the data has no count fields', () => {
        expect(getStaticWarningMessage({ type: 'static' })).toBeNull();
    });
});
