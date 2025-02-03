import { vi } from 'vitest';

// TODO: Use 'tswebextension' alias to work with mv3 version. AG-37302
import {
    EventChannel,
    FilteringLogEvent,
    ConfigurationMV2Context,
} from '@adguard/tswebextension';

import { MockedEventCannel } from './event-channel';

// TODO: restore inherit from TsWebExtension after lib module resolves update if needed.
export class MockedTsWebExtension {
    public isStarted = false;

    public configuration = {} as ConfigurationMV2Context;

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
}
