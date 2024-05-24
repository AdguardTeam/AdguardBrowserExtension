import {
    EventChannel,
    FilteringLogEvent,
    ConfigurationMV2Context,
} from '@adguard/tswebextension';

import { MockedEventCannel } from './event-channel';

// FIXME: Add mock for mv3
// TODO: restore inherit from TsWebExtension after lib module resolves update if needed.
export class MockedTsWebExtension {
    public isStarted = false;

    public configuration = {} as ConfigurationMV2Context;

    public start = jest.fn(async () => {
        this.isStarted = true;
        return Promise.resolve();
    });

    public configure = jest.fn(async () => {
        if (!this.isStarted) {
            return Promise.reject();
        }

        return Promise.resolve();
    });

    public stop = jest.fn(async () => {
        this.isStarted = false;
        return Promise.resolve();
    });

    public openAssistant = jest.fn(() => Promise.resolve());

    public closeAssistant = jest.fn(() => Promise.resolve());

    public getRulesCount = jest.fn(() => 0);

    public setLocalScriptRules = jest.fn();

    public getMessageHandler = jest.fn(() => jest.fn());

    public onFilteringLogEvent = new MockedEventCannel() as unknown as EventChannel<FilteringLogEvent>;

    public onAssistantCreateRule = new MockedEventCannel() as unknown as EventChannel<string>;

    public setFilteringEnabled = jest.fn();

    public setCollectHitStats = jest.fn();

    public setDebugScriptlets = jest.fn();

    public setStealthModeEnabled = jest.fn();

    public setSelfDestructFirstPartyCookies = jest.fn();

    public setSelfDestructThirdPartyCookies = jest.fn();

    public setSelfDestructFirstPartyCookiesTime = jest.fn();

    public setSelfDestructThirdPartyCookiesTime = jest.fn();

    public setHideReferrer = jest.fn();

    public setHideSearchQueries = jest.fn();

    public setBlockChromeClientData = jest.fn();

    public setSendDoNotTrack = jest.fn();

    public setBlockWebRTC = jest.fn();
}
