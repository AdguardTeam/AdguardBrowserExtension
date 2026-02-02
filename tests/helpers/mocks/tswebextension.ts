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

import { type Mock, vi } from 'vitest';

// MV2 version of TsWebExtension mock. For MV3, see tswebextension-mv3.ts
import {
    type EventChannel,
    type FilteringLogEvent,
    type ConfigurationMV2Context,
} from '@adguard/tswebextension';

import { MockedEventCannel } from './event-channel';

// TODO: restore inherit from TsWebExtension after lib module resolves update if needed.
export class MockedTsWebExtension {
    public isStarted = false;

    public configuration = {} as ConfigurationMV2Context;

    public start: Mock = vi.fn(async () => {
        this.isStarted = true;
        return Promise.resolve();
    });

    public configure: Mock = vi.fn(async () => {
        if (!this.isStarted) {
            return Promise.reject();
        }

        return Promise.resolve();
    });

    public stop: Mock = vi.fn(async () => {
        this.isStarted = false;
        return Promise.resolve();
    });

    public openAssistant: Mock = vi.fn(() => Promise.resolve());

    public closeAssistant: Mock = vi.fn(() => Promise.resolve());

    public getRulesCount: Mock = vi.fn(() => 0);

    public setLocalScriptRules: Mock = vi.fn();

    public getMessageHandler: Mock = vi.fn(() => vi.fn());

    public onFilteringLogEvent = new MockedEventCannel() as unknown as EventChannel<FilteringLogEvent>;

    public onAssistantCreateRule = new MockedEventCannel() as unknown as EventChannel<string>;

    public setFilteringEnabled: Mock = vi.fn();

    public setCollectHitStats: Mock = vi.fn();

    public setDebugScriptlets: Mock = vi.fn();

    public setStealthModeEnabled: Mock = vi.fn();

    public setSelfDestructFirstPartyCookies: Mock = vi.fn();

    public setSelfDestructThirdPartyCookies: Mock = vi.fn();

    public setSelfDestructFirstPartyCookiesTime: Mock = vi.fn();

    public setSelfDestructThirdPartyCookiesTime: Mock = vi.fn();

    public setHideReferrer: Mock = vi.fn();

    public setHideSearchQueries: Mock = vi.fn();

    public setBlockChromeClientData: Mock = vi.fn();

    public setSendDoNotTrack: Mock = vi.fn();

    public setBlockWebRTC: Mock = vi.fn();

    public initStorage = vi.fn(() => Promise.resolve());

    public retrieveRuleText: Mock = vi.fn();

    public retrieveOriginalRuleText: Mock = vi.fn();
}
