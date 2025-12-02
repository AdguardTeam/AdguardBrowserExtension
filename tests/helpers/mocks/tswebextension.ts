import { vi } from 'vitest';

// TODO: Use 'tswebextension' alias to work with mv3 version. AG-37302
import {
    type EventChannel,
    type FilteringLogEvent,
    type ConfigurationMV2Context,
} from '@adguard/tswebextension';

import { MockedEventCannel } from './event-channel';

/**
 * Factory function for tabsApi mock used in both MV2 and MV3 tswebextension mocks.
 * Returns a fresh mock instance each time it's called.
 */
export const createMockTabsApi = () => ({
    onCreate: { subscribe: vi.fn() },
    onUpdate: { subscribe: vi.fn() },
    onDelete: { subscribe: vi.fn() },
    onActivate: { subscribe: vi.fn() },
    getTabContext: vi.fn(),
    isIncognitoTab: vi.fn(() => false),
});

/**
 * Factory function for defaultFilteringLog mock used in both MV2 and MV3 tswebextension mocks.
 * Returns a fresh mock instance each time it's called.
 */
export const createMockDefaultFilteringLog = () => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
});

/**
 * Factory function for companiesDbService mock used in both MV2 and MV3 tswebextension mocks.
 * Returns a fresh mock instance each time it's called.
 */
export const createMockCompaniesDbService = () => ({
    getCompaniesDbCategories: vi.fn(() => ({
        audio_video_player: 'audio_video_player',
        comments: 'comments',
        customer_interaction: 'customer_interaction',
        pornvertising: 'pornvertising',
        advertising: 'advertising',
        essential: 'essential',
        site_analytics: 'site_analytics',
        social_media: 'social_media',
        misc: 'misc',
        cdn: 'cdn',
        hosting: 'hosting',
        unknown: 'unknown',
        extensions: 'extensions',
        email: 'email',
        consent: 'consent',
        telemetry: 'telemetry',
        mobile_analytics: 'mobile_analytics',
    })),
});

// TODO: restore inherit from TsWebExtension after lib module resolves update if needed.
export class MockedTsWebExtension {
    public isStarted = false;

    public configuration = {} as ConfigurationMV2Context;

    // Static methods for MV3
    public static setLocalScriptRules = vi.fn();

    public static syncRuleSetWithIdbByFilterId = vi.fn(() => Promise.resolve());

    public start = vi.fn(async () => {
        this.isStarted = true;
        return Promise.resolve();
    });

    public configure = vi.fn(async () => {
        if (!this.isStarted) {
            return Promise.reject();
        }

        return Promise.resolve();
    });

    public stop = vi.fn(async () => {
        this.isStarted = false;
        return Promise.resolve();
    });

    public openAssistant = vi.fn(() => Promise.resolve());

    public closeAssistant = vi.fn(() => Promise.resolve());

    public getRulesCount = vi.fn(() => 0);

    public setLocalScriptRules = vi.fn();

    public getMessageHandler = vi.fn(() => vi.fn());

    public onFilteringLogEvent = new MockedEventCannel() as unknown as EventChannel<FilteringLogEvent>;

    public onAssistantCreateRule = new MockedEventCannel() as unknown as EventChannel<string>;

    public setFilteringEnabled = vi.fn();

    public setCollectHitStats = vi.fn();

    public setDebugScriptlets = vi.fn();

    public setStealthModeEnabled = vi.fn();

    public setSelfDestructFirstPartyCookies = vi.fn();

    public setSelfDestructThirdPartyCookies = vi.fn();

    public setSelfDestructFirstPartyCookiesTime = vi.fn();

    public setSelfDestructThirdPartyCookiesTime = vi.fn();

    public setHideReferrer = vi.fn();

    public setHideSearchQueries = vi.fn();

    public setBlockChromeClientData = vi.fn();

    public setSendDoNotTrack = vi.fn();

    public setBlockWebRTC = vi.fn();

    public initStorage = vi.fn(() => Promise.resolve());
}
