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
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
} from '@testing-library/react';

import { Notification } from '../../../../../../Extension/src/pages/common/components/Notification/Notification';
import { NotificationType } from '../../../../../../Extension/src/pages/common/types';
import { NOTIFICATION_TTL_MS } from '../../../../../../Extension/src/common/constants';
import { TIME_TO_REMOVE_NOTIFICATION_MS } from '../../../../../../Extension/src/pages/common/constants';

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    translator: { getMessage: () => 'Close' },
}));

describe('Notification display lifetime', () => {
    beforeEach(() => vi.useFakeTimers());

    afterEach(() => {
        cleanup(); vi.useRealTimers();
    });

    it('keeps existing automatic dismissal as the default', () => {
        const onRemove = vi.fn();

        render(<Notification id="one" type={NotificationType.Success} text="Saved" onRemove={onRemove} />);

        act(() => {
            vi.advanceTimersByTime(NOTIFICATION_TTL_MS + TIME_TO_REMOVE_NOTIFICATION_MS);
        });

        expect(onRemove).toHaveBeenCalledWith('one');
    });

    it('keeps a manually closed notification until the close button is clicked', () => {
        const onRemove = vi.fn();

        render(
            <Notification
                id="one"
                type={NotificationType.Warning}
                text="Filter disabled"
                closeManually
                onRemove={onRemove}
            />,
        );
        act(() => {
            vi.advanceTimersByTime(NOTIFICATION_TTL_MS * 10);
        });
        expect(onRemove).not.toHaveBeenCalled();
        expect(screen.getByRole('status').textContent).toContain('Filter disabled');

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        act(() => {
            vi.advanceTimersByTime(TIME_TO_REMOVE_NOTIFICATION_MS);
        });

        expect(onRemove).toHaveBeenCalledExactlyOnceWith('one');
    });

    it('runs a button action and closes the notification', () => {
        const onRemove = vi.fn();
        const onReview = vi.fn();

        render(
            <Notification
                id="one"
                type={NotificationType.Warning}
                text="Filter disabled"
                closeManually
                onRemove={onRemove}
                buttons={[{ title: 'Review', onClick: onReview }]}
            />,
        );
        fireEvent.click(screen.getByRole('link', { name: 'Review' }));
        act(() => {
            vi.advanceTimersByTime(TIME_TO_REMOVE_NOTIFICATION_MS);
        });

        expect(onReview).toHaveBeenCalledOnce();
        expect(onRemove).toHaveBeenCalledExactlyOnceWith('one');
    });

    it('cancels pending dismissal work on unmount', () => {
        const onRemove = vi.fn();

        const view = render(
            <Notification id="one" type={NotificationType.Success} text="Saved" onRemove={onRemove} />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        view.unmount();
        act(() => {
            vi.runAllTimers();
        });

        expect(onRemove).not.toHaveBeenCalled();
    });
});
