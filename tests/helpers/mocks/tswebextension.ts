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
