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
import Modal from 'react-modal';

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    cleanup,
    fireEvent,
    render,
    screen,
} from '@testing-library/react';

import { BrowserSync } from '../../../../../../Extension/src/pages/options/components/General/BrowserSync';
import { BrowserSyncAction } from '../../../../../../Extension/src/common/browser-sync';
import messages from '../../../../../../Extension/_locales/en/messages.json';

const boundary = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../../../../Extension/src/pages/services/messenger', () => ({
    messenger: { browserSync: boundary.send },
}));
vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    translator: {
        getMessage: (key: keyof typeof messages) => messages[key]?.message || key,
    },
}));
vi.mock('../../../../../../Extension/src/pages/common/styles/theme', () => ({
    default: { modal: {}, common: {} },
}));

const preview = {
    token: 'review-token',
    action: BrowserSyncAction.PreviewUpload,
    local: { 'appearance-theme': 'dark', 'disable-show-page-statistic': false, 'user-rules-editor-wrap': true },
    remote: { 'appearance-theme': 'light', 'disable-show-page-statistic': true, 'user-rules-editor-wrap': false },
    remoteExists: true,
};

beforeEach(() => {
    boundary.send.mockReset();
    Modal.setAppElement(document.createElement('div'));
});
afterEach(cleanup);

describe('manual browser sync controls', () => {
    it('does nothing on mount and needs opt-in, review and confirmation before upload', async () => {
        boundary.send.mockResolvedValueOnce({ ok: true, preview })
            .mockResolvedValueOnce({ ok: true, completed: BrowserSyncAction.PreviewUpload });
        render(<BrowserSync />);
        const upload = screen.getByRole('button', { name: 'Review upload' }) as HTMLButtonElement;
        expect(upload.disabled).toBe(true);
        expect(boundary.send).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(upload);
        expect(await screen.findByText(/This replaces the existing synced snapshot/)).toBeTruthy();
        expect(screen.getByText(/Theme: Dark \/ Light/)).toBeTruthy();
        expect(boundary.send).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole('button', { name: 'Upload local preferences' }));
        expect(await screen.findByText(/Written to browser sync storage/)).toBeTruthy();
        expect(boundary.send).toHaveBeenLastCalledWith({ action: 'confirm', token: 'review-token', consent: true });
    });

    it('cancels a review without transferring and resets opt-in on remount', async () => {
        boundary.send.mockResolvedValue({ ok: true, preview });
        const view = render(<BrowserSync />);
        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: 'Review upload' }));
        await screen.findByRole('dialog');
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(boundary.send).toHaveBeenCalledTimes(1);
        view.unmount();
        render(<BrowserSync />);
        expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
        expect(boundary.send).toHaveBeenCalledTimes(1);
    });

    it('shows actionable failures and prevents overlapping clicks while waiting', async () => {
        let release!: (value: unknown) => void;
        boundary.send.mockReturnValue(new Promise((resolve) => {
            release = resolve;
        }));
        render(<BrowserSync />);
        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: 'Review download' }));
        fireEvent.click(screen.getByRole('button', { name: 'Review deletion' }));
        expect(boundary.send).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('status').textContent).toBe('Working…');
        release({ ok: false, error: 'conflict' });
        expect((await screen.findByRole('alert')).textContent).toContain('Review again before confirming.');
        expect((screen.getByRole('button', { name: 'Review download' }) as HTMLButtonElement).disabled).toBe(false);
    });
});
