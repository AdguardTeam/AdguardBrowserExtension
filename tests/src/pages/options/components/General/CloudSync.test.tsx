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

import React from 'react';

import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    expect,
    it,
    vi,
} from 'vitest';

import { CloudSync } from '../../../../../../Extension/src/pages/options/components/General/CloudSync';

const local = {
    'appearance-theme': 'light',
    'disable-show-page-statistic': false,
    'context-menu-disabled': false,
    'user-rules-editor-wrap': false,
};
const remote = { ...local, 'appearance-theme': 'dark' };
const mocks = vi.hoisted(() => ({
    request: vi.fn(), read: vi.fn(), apply: vi.fn(), fetch: vi.fn(),
}));

vi.mock('webextension-polyfill', () => ({ default: { permissions: { request: mocks.request } } }));
vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    translator: { getMessage: (key: string) => key },
}));
vi.mock('../../../../../../Extension/src/pages/services/messenger/index.ts', () => ({
    messenger: { getCloudPreferences: mocks.read, applyCloudPreferences: mocks.apply },
}));

beforeEach(() => {
    mocks.request.mockResolvedValue(true);
    mocks.read.mockResolvedValue(local);
    mocks.apply.mockResolvedValue({ ok: true });
    mocks.fetch.mockImplementation(async (_url: string, init: RequestInit) => {
        if (init.method !== 'GET') {
            return new Response(null, { status: 204 });
        }
        return new Response(JSON.stringify({ format: 'adguard-ui-preferences', version: 1, preferences: remote }), {
            headers: { ETag: '"fixture-one"' },
        });
    });
    vi.stubGlobal('fetch', mocks.fetch);
});

afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    vi.unstubAllGlobals();
});

const connect = async () => {
    fireEvent.click(screen.getByLabelText('options_cloud_enable'));
    fireEvent.change(screen.getByLabelText('options_cloud_folder'), { target: { value: 'https://dav.example/folder/' } });
    fireEvent.change(screen.getByLabelText('options_cloud_username'), { target: { value: 'fixture-user' } });
    fireEvent.change(screen.getByLabelText('options_cloud_password'), { target: { value: 'fixture-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'options_cloud_connect' }));
    await screen.findByText('options_cloud_connected');
};

it('does no network work until preview and applies only the explicitly accepted snapshot', async () => {
    render(<CloudSync />);
    expect(mocks.fetch).not.toHaveBeenCalled();
    await connect();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.request).toHaveBeenCalledWith({ origins: ['https://dav.example/*'] });
    expect((screen.getByLabelText('options_cloud_password') as HTMLInputElement).value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'options_cloud_inspect' }));
    await screen.findByText('options_cloud_preview_ready');
    expect(screen.getByText('options_cloud_remote: dark')).toBeTruthy();
    expect(mocks.apply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'options_cloud_apply' }));
    await screen.findByText('options_cloud_applied');
    expect(mocks.apply).toHaveBeenCalledWith({ expected: local, incoming: remote });
    expect(screen.queryByRole('button', { name: 'options_cloud_apply' })).toBeNull();
});

it('does not make a request after host access is denied', async () => {
    mocks.request.mockResolvedValue(false);
    render(<CloudSync />);
    fireEvent.click(screen.getByLabelText('options_cloud_enable'));
    fireEvent.change(screen.getByLabelText('options_cloud_folder'), { target: { value: 'https://dav.example/' } });
    fireEvent.change(screen.getByLabelText('options_cloud_username'), { target: { value: 'fixture-user' } });
    fireEvent.change(screen.getByLabelText('options_cloud_password'), { target: { value: 'fixture-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'options_cloud_connect' }));
    await screen.findByText('options_cloud_error_unavailable');
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'options_cloud_inspect' })).toBeNull();
});

it('invalid remote input removes all apply and destructive actions', async () => {
    mocks.fetch.mockResolvedValue(new Response('{"credentials":"not-settings"}', { headers: { ETag: '"one"' } }));
    render(<CloudSync />);
    await connect();
    fireEvent.click(screen.getByRole('button', { name: 'options_cloud_inspect' }));
    await screen.findByText('options_cloud_error_invalid');
    expect(screen.queryByRole('button', { name: 'options_cloud_apply' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'options_cloud_delete' })).toBeNull();
    expect(mocks.apply).not.toHaveBeenCalled();
});

it('requires delete confirmation and forgets credentials when disconnected', async () => {
    render(<CloudSync />);
    await connect();
    fireEvent.click(screen.getByRole('button', { name: 'options_cloud_inspect' }));
    await screen.findByText('options_cloud_preview_ready');
    const remove = screen.getByRole('button', { name: 'options_cloud_delete' }) as HTMLButtonElement;
    expect(remove.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('options_cloud_delete_confirm'));
    expect(remove.disabled).toBe(false);
    fireEvent.click(remove);
    await screen.findByText('options_cloud_deleted');
    const init = mocks.fetch.mock.calls[1]?.[1] as RequestInit;
    expect(init.method).toBe('DELETE');
    expect(new Headers(init.headers).get('If-Match')).toBe('"fixture-one"');
    expect(mocks.apply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'options_cloud_disconnect' }));
    expect((screen.getByLabelText('options_cloud_username') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('options_cloud_folder') as HTMLInputElement).value).toBe('');
    expect(screen.queryByRole('button', { name: 'options_cloud_delete' })).toBeNull();
});

it('does not report partial application as success', async () => {
    mocks.apply.mockResolvedValue({ ok: false, code: 'apply' });
    render(<CloudSync />);
    await connect();
    fireEvent.click(screen.getByRole('button', { name: 'options_cloud_inspect' }));
    await screen.findByText('options_cloud_preview_ready');
    fireEvent.click(screen.getByRole('button', { name: 'options_cloud_apply' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('options_cloud_error_apply'));
    expect(screen.queryByText('options_cloud_applied')).toBeNull();
});
