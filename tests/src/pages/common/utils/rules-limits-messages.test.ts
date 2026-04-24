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
    describe,
    expect,
    it,
    vi,
} from 'vitest';

// eslint-disable-next-line
import { type InvalidStaticResultData } from '../../../../../Extension/src/background/services/rules-limits';

vi.mock('../../../../../Extension/src/common/translators/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string, params?: Record<string, unknown>) => {
            return JSON.stringify({ key, params });
        }),
    },
}));

// eslint-disable-next-line import/first
import {
    getStaticWarningMessage,
    getDynamicWarningMessage,
} from '../../../../../Extension/src/pages/common/utils/rules-limits-messages';

describe('getStaticWarningMessage', () => {
    it('returns filters exceeded/expected message when filtersCount has expected and current', () => {
        const data: InvalidStaticResultData = {
            type: 'static',
            filtersCount: { expected: 10, current: 5 },
        };
        const result = getStaticWarningMessage(data);
        const parsed = JSON.parse(result!);
        expect(parsed.key).toBe('options_all_limits_exceeded_warning_browser');
        expect(parsed.params).toEqual({ current: 5, expected: 10 });
    });

    it('returns filters maximum message when filtersCount has maximum and current', () => {
        const data: InvalidStaticResultData = {
            type: 'static',
            filtersCount: { current: 50, maximum: 50 },
        };
        const result = getStaticWarningMessage(data);
        const parsed = JSON.parse(result!);
        expect(parsed.key).toBe('options_limits_warning_static_filters_browser');
        expect(parsed.params).toEqual({ current: 50, maximum: 50 });
    });

    it('returns static RULES warning (not filters) when rulesCount is present', () => {
        const data: InvalidStaticResultData = {
            type: 'static',
            rulesCount: { current: 300000, maximum: 330000 },
        };
        const result = getStaticWarningMessage(data);
        const parsed = JSON.parse(result!);
        // This is the key bug fix — must use 'static_rules_browser', not 'static_filters_browser'
        expect(parsed.key).toBe('options_limits_warning_static_rules_browser');
        expect(parsed.params).toEqual({ current: 300000, maximum: 330000 });
    });

    it('returns regex rules warning when rulesRegexpsCount is present', () => {
        const data: InvalidStaticResultData = {
            type: 'static',
            rulesRegexpsCount: { current: 1000, maximum: 1000 },
        };
        const result = getStaticWarningMessage(data);
        const parsed = JSON.parse(result!);
        expect(parsed.key).toBe('options_limits_warning_static_regex_rules_no_counter');
    });

    it('returns null when no relevant fields are present', () => {
        const data: InvalidStaticResultData = { type: 'static' };
        expect(getStaticWarningMessage(data)).toBeNull();
    });
});

describe('getDynamicWarningMessage', () => {
    it('returns dynamic rules hint when rulesCount is present', () => {
        const data = { type: 'dynamic' as const, rulesCount: { current: 5000, maximum: 5000 } };
        const result = getDynamicWarningMessage(data);
        const parsed = JSON.parse(result!);
        expect(parsed.key).toBe('options_limits_warning_dynamic_rules_hint');
    });
});
