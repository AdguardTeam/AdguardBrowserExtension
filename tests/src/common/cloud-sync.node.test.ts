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
    CloudErrorCode,
    CloudSyncError,
    WebDavSession,
    cloudDocumentUrl,
    parseCloudDocument,
    selectCloudPreferences,
} from '../../../Extension/src/common/cloud-sync';
import { createCloudPreferencesApplier } from '../../../Extension/src/common/cloud-preferences-apply';

test('rejects remote objects with unrecognized keys before any settings can be applied', () => {
    assert.throws(() => parseCloudDocument({ version: 1, credentials: 'not-settings' }));
});

const preferences = {
    'appearance-theme': 'dark' as const,
    'disable-show-page-statistic': false,
    'context-menu-disabled': true,
    'user-rules-editor-wrap': true,
};
const document = { format: 'adguard-ui-preferences', version: 1, preferences };
const code = (expected: CloudErrorCode) => (error: unknown) => {
    return error instanceof CloudSyncError && error.code === expected;
};
const response = (etag = '"one"') => new Response(JSON.stringify(document), { headers: { ETag: etag } });
const session = () => new WebDavSession('https://dav.example/remote.php/dav/files/test/', 'test', 'app-password');

test('selects only UI preferences, excluding rules, credentials, policies and logs', () => {
    assert.deepEqual(selectCloudPreferences({
        ...preferences, credentials: 'secret', rules: ['rule'], policy: true,
    }), preferences);
});

test('rejects unsafe URLs before credentials or requests exist', () => {
    for (const url of ['http://dav.example/', 'https://user:secret@dav.example/', 'https://dav.example/?token=x',
        'https://dav.example/#secret', 'https://dav.example/ bad', 'file:///tmp/']) {
        assert.throws(() => cloudDocumentUrl(url), code(CloudErrorCode.Endpoint));
    }
    assert.equal(
        cloudDocumentUrl('https://dav.example/folder').href,
        'https://dav.example/folder/adguard-preferences-v1.json',
    );
});

test('does not connect until requested; creates using If-None-Match and never retries writes', async (t) => {
    const calls: RequestInit[] = [];
    t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
        calls.push(init);
        return new Response(null, { status: init.method === 'GET' ? 404 : 201 });
    });
    const dav = session();
    assert.equal(calls.length, 0);
    await assert.rejects(dav.upload(preferences), code(CloudErrorCode.Inspect));
    assert.equal(await dav.inspect(), null);
    await dav.upload(preferences);
    assert.equal(calls.length, 2);
    assert.equal(new Headers(calls[1]?.headers).get('If-None-Match'), '*');
    assert.deepEqual(JSON.parse(String(calls[1]?.body)), document);
    assert.equal(calls[1]?.redirect, 'error');
    assert.equal(calls[1]?.credentials, 'omit');
    assert.equal(calls[1]?.referrerPolicy, 'no-referrer');
    await assert.rejects(dav.upload(preferences), code(CloudErrorCode.Inspect));
    assert.equal(calls.length, 2);
});

test('previews without local mutation and conditionally replaces and deletes the inspected document', async (t) => {
    const calls: RequestInit[] = [];
    t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
        calls.push(init);
        return init.method === 'GET' ? response() : new Response(null, { status: 204 });
    });
    const dav = session();
    const preview = await dav.inspect();
    assert.deepEqual(preview?.document, document);
    assert.equal(calls.length, 1);
    // A caller cannot change the private precondition by editing the returned preview.
    if (preview) {
        preview.etag = '"forged"';
    }
    await dav.upload(preferences);
    assert.equal(new Headers(calls[1]?.headers).get('If-Match'), '"one"');
    await dav.inspect();
    await dav.delete();
    assert.equal(calls[3]?.method, 'DELETE');
    assert.equal(new Headers(calls[3]?.headers).get('If-Match'), '"one"');
});

test('conflicts invalidate the baseline and cannot fall back to unconditional writes', async (t) => {
    let requests = 0;
    t.mock.method(globalThis, 'fetch', async () => {
        requests += 1;
        return requests === 1 ? response() : new Response(null, { status: 412 });
    });
    const dav = session();
    await dav.inspect();
    await assert.rejects(dav.upload(preferences), code(CloudErrorCode.Conflict));
    await assert.rejects(dav.delete(), code(CloudErrorCode.Inspect));
    assert.equal(requests, 2);
});

test('rejects invalid remote data, unknown schema versions and weak or missing validators', async (t) => {
    const cases = [
        new Response('{', { headers: { ETag: '"one"' } }),
        new Response(JSON.stringify({ ...document, version: 2 }), { headers: { ETag: '"one"' } }),
        new Response(
            JSON.stringify({ ...document, preferences: { ...preferences, token: 'secret' } }),
            { headers: { ETag: '"one"' } },
        ),
        response('W/"one"'),
        new Response(JSON.stringify(document)),
    ];
    for (const remote of cases) {
        t.mock.method(globalThis, 'fetch', async () => remote);
        const dav = session();
        await assert.rejects(dav.inspect(), CloudSyncError);
        await assert.rejects(dav.upload(preferences), code(CloudErrorCode.Inspect));
    }
});

test('bounds both advertised and streamed response bytes', async (t) => {
    for (const remote of [
        new Response('{}', { headers: { ETag: '"one"', 'Content-Length': '20000' } }),
        new Response(' '.repeat(17000), { headers: { ETag: '"one"' } }),
    ]) {
        t.mock.method(globalThis, 'fetch', async () => remote);
        await assert.rejects(session().inspect(), code(CloudErrorCode.TooLarge));
    }
});

test('reports unavailable API, quota, authentication and network errors without leaking secrets', async (t) => {
    for (const [status, expected] of [[507, CloudErrorCode.Quota], [401, CloudErrorCode.Authentication],
        [302, CloudErrorCode.Network]] as const) {
        t.mock.method(globalThis, 'fetch', async () => new Response(null, { status }));
        await assert.rejects(session().inspect(), code(expected));
    }
    t.mock.method(globalThis, 'fetch', async () => {
        throw new Error('secret endpoint password');
    });
    await assert.rejects(session().inspect(), code(CloudErrorCode.Network));
    const fetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch')!;
    try {
        Object.defineProperty(globalThis, 'fetch', { value: undefined, configurable: true });
        await assert.rejects(session().inspect(), code(CloudErrorCode.Unavailable));
    } finally {
        Object.defineProperty(globalThis, 'fetch', fetchDescriptor);
    }
});

test('rejects concurrent operations and aborts a closed session', async (t) => {
    t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
        });
    });
    const dav = session();
    const pending = dav.inspect();
    await assert.rejects(dav.inspect(), code(CloudErrorCode.Busy));
    dav.close();
    await assert.rejects(pending, code(CloudErrorCode.Network));
    await assert.rejects(dav.inspect(), code(CloudErrorCode.Unavailable));
});

test('applies exactly the validated subset and persists before reporting success', async () => {
    const current = { ...preferences };
    let persisted = false;
    const apply = createCloudPreferencesApplier({
        read: () => ({ ...current }),
        write: async (key, value) => {
            Object.assign(current, { [key]: value });
        },
        persist: async () => {
            persisted = true;
        },
    });
    const target = { ...preferences, 'appearance-theme': 'light' };
    assert.deepEqual(await apply(preferences, target), { ok: true });
    assert.equal(persisted, true);
    assert.deepEqual(current, target);
});

test('invalid incoming settings and stale local preview never mutate local settings', async () => {
    let writes = 0;
    const apply = createCloudPreferencesApplier({
        read: () => ({ ...preferences }),
        write: async () => {
            writes += 1;
        },
        persist: async () => {},
    });
    assert.deepEqual(
        await apply(preferences, { ...preferences, rules: 'unsafe' }),
        { ok: false, code: CloudErrorCode.Invalid },
    );
    assert.deepEqual(
        await apply({ ...preferences, 'context-menu-disabled': false }, preferences),
        { ok: false, code: CloudErrorCode.LocalChanged },
    );
    assert.equal(writes, 0);
});

test('persistence failure is explicitly non-atomic, and overlapping apply is refused', async () => {
    const current = { ...preferences };
    let finish: (() => void) | undefined;
    const apply = createCloudPreferencesApplier({
        read: () => ({ ...current }),
        write: async (key, value) => {
            Object.assign(current, { [key]: value });
            await new Promise<void>((resolve) => {
                finish = resolve;
            });
        },
        persist: async () => {
            throw new Error('quota');
        },
    });
    const pending = apply(preferences, { ...preferences, 'appearance-theme': 'light' });
    assert.deepEqual(await apply(preferences, preferences), { ok: false, code: CloudErrorCode.Busy });
    finish?.();
    assert.deepEqual(await pending, { ok: false, code: CloudErrorCode.Apply });
});
