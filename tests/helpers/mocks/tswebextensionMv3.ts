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
