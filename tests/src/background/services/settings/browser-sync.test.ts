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

import { runInNewContext } from 'node:vm';

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { handleBrowserSync } from '../../../../../Extension/src/background/services/settings/browser-sync/service';
import { settingsStorage } from '../../../../../Extension/src/background/storages/settings';
import { type Settings } from '../../../../../Extension/src/background/schema/settings';
import { MessageType } from '../../../../../Extension/src/common/messages/constants';
import { BrowserSyncAction, type BrowserSyncResponse } from '../../../../../Extension/src/common/browser-sync';

const boundary = vi.hoisted(() => ({
    remote: {} as Record<string, unknown>,
    persisted: {} as Record<string, unknown>,
    policy: {} as Record<string, unknown>,
    policyError: undefined as Error | undefined,
    isFirefox: false,
    failSave: false,
}));

vi.mock('webextension-polyfill', () => ({
    default: {
        runtime: {
            id: 'test-extension',
            getURL: (path: string) => `chrome-extension://test-extension/${path}`,
        },
        storage: {
            sync: {
                get: async () => structuredClone(boundary.remote),
                set: async (data: Record<string, unknown>) => Object.assign(boundary.remote, structuredClone(data)),
                remove: async (key: string) => {
                    delete boundary.remote[key];
                },
            },
            managed: {
                get: async () => {
                    if (boundary.policyError !== undefined) {
                        throw boundary.policyError;
                    }
                    return boundary.policy;
                },
            },
        },
    },
}));
vi.mock('../../../../../Extension/src/common/user-agent', () => ({
    UserAgent: {
        get isFirefox() {
            return boundary.isFirefox;
        },
    },
}));
vi.mock('../../../../../Extension/src/background/storages/shared-instances', () => ({
    browserStorage: {
        set: async (key: string, value: unknown) => {
            if (boundary.failSave) {
                throw new Error('disk full');
            }
            boundary.persisted[key] = structuredClone(value);
        },
    },
}));
vi.mock('../../../../../Extension/src/background/notifier', () => ({
    notifier: { notifyListeners: vi.fn() },
}));

const initial = {
    'appearance-theme': 'dark',
    'disable-show-page-statistic': false,
    'user-rules-editor-wrap': true,
    'adguard-disabled': true,
    'stealth-block-webrtc': false,
    'allow-anonymized-usage-data': false,
    'allowlist-domains': '["example.test"]',
} as Settings;
const sender = { id: 'test-extension', url: 'chrome-extension://test-extension/pages/options.html#/general', frameId: 0 };
const request = (action: BrowserSyncAction, token?: string) => ({
    type: MessageType.BrowserSync as const,
    data: { action, token, consent: true },
});
const tokenOf = (result: BrowserSyncResponse) => {
    if (!result.ok || !('preview' in result)) {
        throw new Error(JSON.stringify(result));
    }
    return result.preview.token;
};

beforeEach(() => {
    boundary.remote = {};
    boundary.persisted = {};
    boundary.policy = {};
    boundary.policyError = undefined;
    boundary.isFirefox = false;
    boundary.failSave = false;
    settingsStorage.setCache(structuredClone(initial));
});

describe('browser sync options message adapter', () => {
    it('rejects content scripts, foreign extensions and subframes before reading storage', async () => {
        for (const untrusted of [
            { ...sender, url: 'https://example.test/' },
            { ...sender, id: 'other-extension' },
            { ...sender, frameId: 1 },
            { id: sender.id },
        ]) {
            expect(await handleBrowserSync(request(BrowserSyncAction.PreviewUpload), untrusted)).toEqual({
                ok: false, error: 'forbidden',
            });
        }
        expect(boundary.remote).toEqual({});
        expect(boundary.persisted).toEqual({});
    });

    it.each([
        { browserName: 'Chromium', isFirefox: false, policyError: undefined },
        {
            browserName: 'Firefox without a managed manifest',
            isFirefox: true,
            policyError: new Error('Managed storage manifest not found'),
        },
        {
            browserName: 'Firefox with a cross-realm absence error',
            isFirefox: true,
            policyError: runInNewContext("new Error('Managed storage manifest not found')") as Error,
        },
    ])('transfers only reviewed preferences without resetting protection on $browserName', async (scenario) => {
        boundary.isFirefox = scenario.isFirefox;
        boundary.policyError = scenario.policyError;
        const upload = await handleBrowserSync(request(BrowserSyncAction.PreviewUpload), sender);
        expect(boundary.remote).toEqual({});
        await handleBrowserSync(request(BrowserSyncAction.Confirm, tokenOf(upload)), sender);
        const remote = boundary.remote['adguard-browser-preferences-v1'] as { preferences: Record<string, unknown> };
        expect(remote.preferences).toEqual({
            'appearance-theme': 'dark',
            'disable-show-page-statistic': false,
            'user-rules-editor-wrap': true,
        });
        remote.preferences['appearance-theme'] = 'light';
        const download = await handleBrowserSync(request(BrowserSyncAction.PreviewDownload), sender);
        expect(settingsStorage.getData()).toEqual(initial);
        expect(await handleBrowserSync(request(BrowserSyncAction.Confirm, tokenOf(download)), sender)).toEqual({
            ok: true, completed: 'preview-download',
        });
        expect(settingsStorage.getData()).toEqual({ ...initial, 'appearance-theme': 'light' });
        expect(boundary.persisted['adguard-settings']).toEqual({ ...initial, 'appearance-theme': 'light' });
    });

    it.each([
        { isFirefox: true, message: 'permission denied' },
        { isFirefox: false, message: 'permission denied' },
        { isFirefox: false, message: 'Managed storage manifest not found' },
        { isFirefox: true, message: 'Managed storage manifest not found: permission denied' },
    ])('fails closed for policy error "$message" (Firefox: $isFirefox)', async (scenario) => {
        boundary.isFirefox = scenario.isFirefox;
        boundary.policyError = new Error(scenario.message);
        for (const action of [BrowserSyncAction.PreviewUpload, BrowserSyncAction.PreviewDownload]) {
            expect(await handleBrowserSync(request(action), sender)).toEqual({
                ok: false, error: 'storage',
            });
        }
        expect(boundary.remote).toEqual({});
        expect(boundary.persisted).toEqual({});
        expect(settingsStorage.getData()).toEqual(initial);
    });

    it('rechecks Firefox policy on confirmation and blocks newly unreadable policy', async () => {
        boundary.isFirefox = true;
        boundary.policyError = new Error('Managed storage manifest not found');
        const upload = await handleBrowserSync(request(BrowserSyncAction.PreviewUpload), sender);
        boundary.policyError = new Error('permission denied');
        expect(await handleBrowserSync(request(BrowserSyncAction.Confirm, tokenOf(upload)), sender)).toEqual({
            ok: false, error: 'storage',
        });
        expect(boundary.remote).toEqual({});
        expect(boundary.persisted).toEqual({});
        expect(settingsStorage.getData()).toEqual(initial);
    });

    it('reports failed persistence rather than claiming the download was saved', async () => {
        const upload = await handleBrowserSync(request(BrowserSyncAction.PreviewUpload), sender);
        await handleBrowserSync(request(BrowserSyncAction.Confirm, tokenOf(upload)), sender);
        const download = await handleBrowserSync(request(BrowserSyncAction.PreviewDownload), sender);
        boundary.failSave = true;
        expect(await handleBrowserSync(request(BrowserSyncAction.Confirm, tokenOf(download)), sender)).toEqual({
            ok: false, error: 'apply',
        });
        expect(boundary.persisted).toEqual({});
    });
});
