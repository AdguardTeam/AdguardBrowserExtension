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

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
    BrowserSyncController,
} from '../../../../../Extension/src/background/services/settings/browser-sync/controller';
import {
    BrowserSyncAction,
    BrowserSyncError,
    type BrowserSyncPreferences,
    type BrowserSyncResponse,
} from '../../../../../Extension/src/common/browser-sync';

const KEY = 'adguard-browser-preferences-v1';
const preferences: BrowserSyncPreferences = {
    'appearance-theme': 'dark',
    'disable-show-page-statistic': false,
    'user-rules-editor-wrap': true,
};
const snapshot = (prefs = preferences) => ({
    format: 'adguard-browser-preferences',
    version: 1,
    revision: 'remote-revision',
    preferences: { ...prefs },
});

const fixture = () => {
    const state = {
        local: { ...preferences },
        remote: {} as Record<string, unknown>,
        managed: false,
        failRead: false,
        failWrite: false,
        failApply: false,
        writes: 0,
        available: true,
        limits: {} as { QUOTA_BYTES?: number; QUOTA_BYTES_PER_ITEM?: number; MAX_ITEMS?: number },
        gate: undefined as Promise<void> | undefined,
    };
    const controller = new BrowserSyncController({
        storage: () => (state.available ? {
            ...state.limits,
            get: async () => {
                await state.gate;
                if (state.failRead) {
                    throw new Error('network unavailable');
                }
                return structuredClone(state.remote);
            },
            set: async (data: Record<string, unknown>) => {
                if (state.failWrite) {
                    throw new Error('MAX_WRITE_OPERATIONS_PER_MINUTE');
                }
                Object.assign(state.remote, structuredClone(data));
                state.writes += 1;
            },
            remove: async (key: string) => {
                if (state.failWrite) {
                    throw new Error('storage unavailable');
                }
                delete state.remote[key];
                state.writes += 1;
            },
        } : undefined),
        readLocal: () => ({ ...state.local }),
        applyLocal: async (next: BrowserSyncPreferences) => {
            if (state.failApply) {
                throw new Error('disk full');
            }
            state.local = { ...next };
        },
        isManaged: async () => state.managed,
        createToken: () => crypto.randomUUID(),
    });
    const run = (action: BrowserSyncAction, token?: string, consent = true) => {
        return controller.handle({ action, token, consent });
    };
    return { state, run, controller };
};

const previewToken = (result: BrowserSyncResponse) => {
    assert.equal(result.ok, true);
    assert.ok('preview' in result);
    return result.preview.token;
};

test('upload requires a separate review and confirmation before writing', async () => {
    const { state, run } = fixture();
    const preview = await run(BrowserSyncAction.PreviewUpload);
    assert.deepEqual(state.remote, {});
    const token = previewToken(preview);
    assert.deepEqual(await run(BrowserSyncAction.Confirm, token), {
        ok: true, completed: BrowserSyncAction.PreviewUpload,
    });
    assert.deepEqual((state.remote[KEY] as ReturnType<typeof snapshot>).preferences, preferences);
    assert.equal(state.writes, 1);
});

test('download preview does not mutate and apply transfers only the reviewed preferences', async () => {
    const { state, run } = fixture();
    state.remote[KEY] = snapshot({ ...preferences, 'appearance-theme': 'light' });
    const preview = await run(BrowserSyncAction.PreviewDownload);
    assert.deepEqual(state.local, preferences);
    await run(BrowserSyncAction.Confirm, previewToken(preview));
    assert.equal(state.local['appearance-theme'], 'light');
    assert.equal(state.writes, 0);
});

test('missing consent or an unavailable API does not read or write sync data', async () => {
    const { state, run } = fixture();
    assert.deepEqual(await run(BrowserSyncAction.PreviewUpload, undefined, false), {
        ok: false, error: BrowserSyncError.Consent,
    });
    state.available = false;
    assert.deepEqual(await run(BrowserSyncAction.PreviewUpload), {
        ok: false, error: BrowserSyncError.Unavailable,
    });
    assert.equal(state.writes, 0);
});

test('malformed, incompatible, extra-key and overlarge snapshots never mutate local state', async () => {
    const { state, run } = fixture();
    for (const remote of [
        null, [], 'not JSON', {},
        { ...snapshot(), version: 2 },
        { ...snapshot(), preferences: { ...preferences, 'stealth-block-webrtc': true } },
        { ...snapshot(), preferences: { ...preferences, 'appearance-theme': 'sepia' } },
        { ...snapshot(), preferences: { ...preferences, 'user-rules-editor-wrap': 'true' } },
        { ...snapshot(), revision: 'a'.repeat(9000) },
    ]) {
        state.remote[KEY] = remote;
        assert.deepEqual(await run(BrowserSyncAction.PreviewDownload), {
            ok: false, error: BrowserSyncError.Invalid,
        });
        assert.deepEqual(state.local, preferences);
        assert.equal(state.writes, 0);
    }
});

test('empty remote and managed policy refuse apply without local mutation', async () => {
    const { state, run } = fixture();
    assert.deepEqual(await run(BrowserSyncAction.PreviewDownload), { ok: false, error: BrowserSyncError.Empty });
    state.remote[KEY] = snapshot();
    const token = previewToken(await run(BrowserSyncAction.PreviewDownload));
    state.managed = true;
    assert.deepEqual(await run(BrowserSyncAction.Confirm, token), { ok: false, error: BrowserSyncError.Managed });
    assert.deepEqual(state.local, preferences);
});

test('UTF-8 total quota includes unrelated keys and leaves them untouched', async () => {
    const { state, run } = fixture();
    state.remote.unrelated = '😀'.repeat(26000);
    const before = structuredClone(state.remote);
    const token = previewToken(await run(BrowserSyncAction.PreviewUpload));
    assert.deepEqual(await run(BrowserSyncAction.Confirm, token), { ok: false, error: BrowserSyncError.Quota });
    assert.deepEqual(state.remote, before);
});

test('storage read, quota/write and local apply failures are returned honestly', async () => {
    const { state, run } = fixture();
    state.failRead = true;
    assert.deepEqual(await run(BrowserSyncAction.PreviewUpload), { ok: false, error: BrowserSyncError.Storage });
    state.failRead = false;
    const token = previewToken(await run(BrowserSyncAction.PreviewUpload));
    state.failWrite = true;
    assert.deepEqual(await run(BrowserSyncAction.Confirm, token), { ok: false, error: BrowserSyncError.Storage });
    assert.deepEqual(state.remote, {});
    state.remote[KEY] = snapshot();
    state.failApply = true;
    const download = previewToken(await run(BrowserSyncAction.PreviewDownload));
    assert.deepEqual(await run(BrowserSyncAction.Confirm, download), { ok: false, error: BrowserSyncError.Apply });
});

test('local or remote changes after preview invalidate confirmation', async () => {
    for (const action of [BrowserSyncAction.PreviewUpload, BrowserSyncAction.PreviewDownload]) {
        for (const changed of ['local', 'remote']) {
            const { state, run } = fixture();
            state.remote[KEY] = snapshot();
            const token = previewToken(await run(action));
            if (changed === 'local') {
                state.local['appearance-theme'] = 'system';
            } else {
                state.remote[KEY] = snapshot({ ...preferences, 'appearance-theme': 'light' });
            }
            const before = structuredClone(state);
            assert.deepEqual(await run(BrowserSyncAction.Confirm, token), {
                ok: false, error: BrowserSyncError.Conflict,
            });
            assert.deepEqual(state.local, before.local);
            assert.deepEqual(state.remote, before.remote);
            assert.equal(state.writes, 0);
        }
    }
});

test('overlapping operations are rejected rather than queued with stale consent', async () => {
    const { state, run } = fixture();
    let release!: () => void;
    state.gate = new Promise<void>((resolve) => {
        release = resolve;
    });
    const first = run(BrowserSyncAction.PreviewUpload);
    assert.deepEqual(await run(BrowserSyncAction.PreviewDelete), { ok: false, error: BrowserSyncError.Busy });
    release();
    previewToken(await first);
});

test('remote deletion requires its own preview, preserves other keys and never changes local preferences', async () => {
    const { state, run } = fixture();
    state.remote = { [KEY]: { corrupt: true }, unrelated: 'keep me' };
    const token = previewToken(await run(BrowserSyncAction.PreviewDelete));
    assert.ok(KEY in state.remote);
    assert.deepEqual(await run(BrowserSyncAction.Confirm, token), {
        ok: true, completed: BrowserSyncAction.PreviewDelete,
    });
    assert.deepEqual(state.remote, { unrelated: 'keep me' });
    assert.deepEqual(state.local, preferences);
    assert.deepEqual(await run(BrowserSyncAction.Confirm, token), { ok: false, error: BrowserSyncError.Conflict });
});

test('browser-advertised item, total and count quotas prevent writes', async () => {
    for (const limits of [{ QUOTA_BYTES_PER_ITEM: 1 }, { QUOTA_BYTES: 1 }, { MAX_ITEMS: 0 }]) {
        const { state, run } = fixture();
        state.limits = limits;
        const token = previewToken(await run(BrowserSyncAction.PreviewUpload));
        assert.deepEqual(await run(BrowserSyncAction.Confirm, token), { ok: false, error: BrowserSyncError.Quota });
        assert.deepEqual(state.remote, {});
    }
});

test('editing a returned preview cannot change the confirmed payload', async () => {
    const { state, run } = fixture();
    const result = await run(BrowserSyncAction.PreviewUpload);
    const token = previewToken(result);
    assert.ok('preview' in result);
    result.preview.local['appearance-theme'] = 'light';
    await run(BrowserSyncAction.Confirm, token);
    assert.deepEqual((state.remote[KEY] as ReturnType<typeof snapshot>).preferences, preferences);
});

test('expired reviews and confirmations after restart cannot write', async (context) => {
    const { state, run } = fixture();
    const clock = context.mock.method(Date, 'now', () => 1000);
    const token = previewToken(await run(BrowserSyncAction.PreviewUpload));
    clock.mock.mockImplementation(() => 301001);
    assert.deepEqual(await run(BrowserSyncAction.Confirm, token), { ok: false, error: BrowserSyncError.Conflict });
    assert.deepEqual(await fixture().run(BrowserSyncAction.Confirm, token), {
        ok: false, error: BrowserSyncError.Conflict,
    });
    assert.equal(state.writes, 0);
});

test('a newer preview invalidates an older tab token', async () => {
    const { state, run } = fixture();
    const first = previewToken(await run(BrowserSyncAction.PreviewUpload));
    const result = await run(BrowserSyncAction.PreviewUpload);
    const second = previewToken(result);
    assert.deepEqual(await run(BrowserSyncAction.Confirm, first), { ok: false, error: BrowserSyncError.Conflict });
    // The failed confirmation also consumes the pending review.
    assert.deepEqual(await run(BrowserSyncAction.Confirm, second), { ok: false, error: BrowserSyncError.Conflict });
    assert.equal(state.writes, 0);
});
