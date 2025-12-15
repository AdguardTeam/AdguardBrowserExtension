/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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
    describe,
    it,
    expect,
} from 'vitest';

import { I18n } from '../../../../Extension/src/background/utils';

describe('I18n utility', () => {
    describe('finds locale in locales', () => {
        const cases = [
            { locale: 'en', locales: ['en'], expected: 'en' },
            { locale: 'en_US', locales: ['en'], expected: 'en' },
            { locale: 'en-US', locales: ['en'], expected: 'en' },
            { locale: 'en', locales: ['fr'], expected: null },
            { locale: 'zh-CN', locales: ['zh', 'zh-TW'], expected: 'zh' },
            { locale: 'zh-CN', locales: ['zh-CN', 'zh-TW'], expected: 'zh_cn' },
            { locale: 'zh-TW', locales: ['zh', 'zh-TW'], expected: 'zh_tw' },
            { locale: 'zh-TW', locales: ['zh-CN', 'zh-TW'], expected: 'zh_tw' },
            { locale: 'zh-TW', locales: ['en', 'zh-CN'], expected: null },
        ];

        it.each(cases)('returns $expected for locale $locale in locales $locales', ({
            locale,
            locales,
            expected,
        }) => {
            expect(I18n.find(locales, locale)).toBe(expected);
        });
    });
});
