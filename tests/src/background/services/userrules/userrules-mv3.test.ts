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
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';

import { UnsupportedRegexpError } from '@adguard/tswebextension/mv3';

const { mockIsEnabled } = vi.hoisted(() => ({
    mockIsEnabled: vi.fn(),
}));

vi.mock(
    '@adguard/agtree/generator',
    () => ({
        RuleGenerator: {
            generate: () => 'mocked-rule-text',
        },
    }),
);

vi.mock(
    '../../../../../Extension/src/background/api',
    () => ({
        UserRulesApi: {
            isEnabled: () => mockIsEnabled(),
        },
    }),
);

vi.mock(
    '../../../../../Extension/src/background/schema',
    () => ({
        SettingOption: { UserFilterEnabled: 'user-filter-enabled' },
    }),
);

vi.mock(
    '../../../../../Extension/src/background/events',
    () => ({
        settingsEvents: { addListener: vi.fn() },
        contextMenuEvents: { addListener: vi.fn(), publishEvent: vi.fn() },
        ContextMenuAction: {
            SiteProtectionDisabled: 'context_site_protection_disabled',
            SiteFilteringDisabled: 'context_site_filtering_disabled',
            SiteException: 'context_site_exception',
            BlockSiteAds: 'context_block_site_ads',
            SecurityReport: 'context_security_report',
            ComplaintWebsite: 'context_complaint_website',
            SiteFilteringOn: 'context_site_filtering_on',
            SiteFilteringOff: 'context_site_filtering_off',
            EnableProtection: 'context_enable_protection',
            DisableProtection: 'context_disable_protection',
            OpenSettings: 'context_open_settings',
            OpenLog: 'context_open_log',
            UpdateFilters: 'context_update_antibanner_filters',
        },
    }),
);

const mockLoggerError = vi.fn();
vi.mock(
    '../../../../../Extension/src/common/logger',
    () => ({
        logger: {
            error: (...args: unknown[]) => mockLoggerError(...args),
        },
    }),
);

const { UserRulesService } = await import(
    '../../../../../Extension/src/background/services/userrules/userrules-mv3'
);

describe.skipIf(!__IS_MV3__)('UserRulesService MV3 - checkUserRulesErrors', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsEnabled.mockReturnValue(true);
    });

    it('should not log errors when user filter is disabled', () => {
        mockIsEnabled.mockReturnValue(false);

        const result = {
            dynamicRules: {
                errors: [new Error('some error')],
            },
        };

        // @ts-expect-error -- partial ConfigurationResult mock
        UserRulesService.checkUserRulesErrors(result);

        expect(mockLoggerError).not.toHaveBeenCalled();
    });

    it('should log UnsupportedRegexpError with rule text', () => {
        const mockNode = { type: 'NetworkRule' };
        const error = Object.create(UnsupportedRegexpError.prototype);
        error.networkRule = { node: mockNode };
        error.message = 'Regexp is too complex';

        const result = {
            dynamicRules: {
                errors: [error],
            },
        };

        // @ts-expect-error -- partial ConfigurationResult mock
        UserRulesService.checkUserRulesErrors(result);

        expect(mockLoggerError).toHaveBeenCalledTimes(1);
        expect(mockLoggerError).toHaveBeenCalledWith(
            expect.stringContaining('[ext.UserRulesService.checkUserRulesErrors]'),
            expect.any(String),
            expect.stringContaining('Reason'),
            error,
        );
    });

    it('should log non-UnsupportedRegexpError errors generically', () => {
        const error = new Error('$cookie rules are not supported in MV3');

        const result = {
            dynamicRules: {
                errors: [error],
            },
        };

        // @ts-expect-error -- partial ConfigurationResult mock
        UserRulesService.checkUserRulesErrors(result);

        expect(mockLoggerError).toHaveBeenCalledTimes(1);
        expect(mockLoggerError).toHaveBeenCalledWith(
            expect.stringContaining('[ext.UserRulesService.checkUserRulesErrors]'),
            error,
        );
    });

    it('should log multiple errors', () => {
        const error1 = new Error('unsupported modifier');
        const error2 = new Error('another error');

        const result = {
            dynamicRules: {
                errors: [error1, error2],
            },
        };

        // @ts-expect-error -- partial ConfigurationResult mock
        UserRulesService.checkUserRulesErrors(result);

        expect(mockLoggerError).toHaveBeenCalledTimes(2);
    });

    it('should not log when there are no errors', () => {
        const result = {
            dynamicRules: {
                errors: [],
            },
        };

        // @ts-expect-error -- partial ConfigurationResult mock
        UserRulesService.checkUserRulesErrors(result);

        expect(mockLoggerError).not.toHaveBeenCalled();
    });

    it('should handle missing dynamicRules gracefully', () => {
        const result = {};

        // @ts-expect-error -- partial ConfigurationResult mock
        UserRulesService.checkUserRulesErrors(result);

        expect(mockLoggerError).not.toHaveBeenCalled();
    });
});
