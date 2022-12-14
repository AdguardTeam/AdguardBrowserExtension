import type {
    TsWebExtension,
    EventChannel,
    FilteringLogEvent,
    ConfigurationMV2Context,
} from '@adguard/tswebextension';

import { MockedEventCannel } from './event-channel';

export class MockedTsWebExtension implements TsWebExtension {
    public isStarted = false;

    public configuration: ConfigurationMV2Context | undefined;

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

    public setLocalScriptRules = jest.fn(() => {});

    public getMessageHandler = jest.fn(() => jest.fn());

    public onFilteringLogEvent = new MockedEventCannel() as unknown as EventChannel<FilteringLogEvent>;

    public onAssistantCreateRule = new MockedEventCannel() as unknown as EventChannel<string>;
}
