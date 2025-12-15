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

import { vi } from 'vitest';

import {
    type EventChannel,
    type Configuration,
    type ConfigurationResult,
} from '@adguard/tswebextension/mv3';

import { MockedEventCannel } from './event-channel';

/**
 * Mocked TsWebExtension for MV3.
 * Based on the real TsWebExtension API from @adguard/tswebextension/mv3.
 */
export class MockedTsWebExtensionMV3 {
    public isStarted = false;

    public configuration = {} as Configuration;

    /**
     * Static method to set local script rules.
     * In MV3, this is called as TsWebExtension.setLocalScriptRules(localScriptRules).
     */
    public static setLocalScriptRules = vi.fn();

    public start = vi.fn(async (): Promise<ConfigurationResult> => {
        this.isStarted = true;
        return Promise.resolve({
            rulesCount: 0,
            declarativeRulesCount: 0,
            staticFiltersStatus: {
                errors: [],
            },
            staticFilters: [],
            stealthResult: {
                hideReferrer: false,
                hideSearchQueries: false,
                sendDoNotTrack: false,
                blockChromeClientData: false,
                blockWebRTC: false,
            },
        } as ConfigurationResult);
    });

    public configure = vi.fn(async (): Promise<ConfigurationResult> => {
        if (!this.isStarted) {
            return Promise.reject(new Error('Not started'));
        }

        return Promise.resolve({
            rulesCount: 0,
            declarativeRulesCount: 0,
            staticFiltersStatus: {
                errors: [],
            },
            staticFilters: [],
            stealthResult: {
                hideReferrer: false,
                hideSearchQueries: false,
                sendDoNotTrack: false,
                blockChromeClientData: false,
                blockWebRTC: false,
            },
        } as ConfigurationResult);
    });

    public stop = vi.fn(async () => {
        this.isStarted = false;
        return Promise.resolve();
    });

    public openAssistant = vi.fn(() => Promise.resolve());

    public closeAssistant = vi.fn(() => Promise.resolve());

    public getRulesCount = vi.fn(() => 0);

    public getMessageHandler = vi.fn(() => vi.fn());

    public initStorage = vi.fn(async () => Promise.resolve());

    public retrieveRuleNode = vi.fn(() => null);

    public onFilteringLogEvent = new MockedEventCannel() as unknown as EventChannel<any>;

    public onAssistantCreateRule = new MockedEventCannel() as unknown as EventChannel<string>;
}
