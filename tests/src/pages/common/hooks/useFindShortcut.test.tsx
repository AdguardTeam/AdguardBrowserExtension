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

import React, { useRef } from 'react';

import { cleanup, render } from '@testing-library/react';
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { isFindShortcut, useFindShortcut } from '../../../../../Extension/src/pages/common/hooks/useFindShortcut';
import { REACT_MODAL_OVERLAY_CLASS } from '../../../../../Extension/src/pages/common/constants';

const userAgentMock = vi.hoisted(() => ({ isMacOs: false }));

vi.mock('../../../../../Extension/src/common/user-agent', () => ({
    UserAgent: userAgentMock,
}));

/**
 * Builds a cancelable keydown event.
 *
 * @param init Keyboard event options.
 *
 * @returns Keydown event.
 */
const keyDown = (init: KeyboardEventInit): KeyboardEvent => new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    ...init,
});

describe('isFindShortcut', () => {
    it('matches Ctrl+F off macOS and Cmd+F on macOS', () => {
        expect(isFindShortcut(keyDown({ key: 'f', code: 'KeyF', ctrlKey: true }), false)).toBe(true);
        expect(isFindShortcut(keyDown({ key: 'F', code: 'KeyF', ctrlKey: true }), false)).toBe(true);
        expect(isFindShortcut(keyDown({ key: 'f', code: 'KeyF', metaKey: true }), true)).toBe(true);

        expect(isFindShortcut(keyDown({ key: 'f', code: 'KeyF', metaKey: true }), false)).toBe(false);
        expect(isFindShortcut(keyDown({ key: 'f', code: 'KeyF', ctrlKey: true }), true)).toBe(false);
    });

    it('matches the physical key on other keyboard layouts', () => {
        expect(isFindShortcut(keyDown({ key: 'а', code: 'KeyF', ctrlKey: true }), false)).toBe(true);
    });

    it('ignores shortcuts that share the physical find key on other layouts', () => {
        // On Dvorak, `KeyF` types `u`, so `Ctrl+U` must not open the search.
        expect(isFindShortcut(keyDown({ key: 'u', code: 'KeyF', ctrlKey: true }), false)).toBe(false);
    });

    it('does not match with other modifiers or keys', () => {
        expect(isFindShortcut(keyDown({ key: 'f', code: 'KeyF' }), false)).toBe(false);
        expect(isFindShortcut(keyDown({
            key: 'f', code: 'KeyF', ctrlKey: true, shiftKey: true,
        }), false)).toBe(false);
        expect(isFindShortcut(keyDown({
            key: 'f', code: 'KeyF', ctrlKey: true, altKey: true,
        }), false)).toBe(false);
        expect(isFindShortcut(keyDown({
            key: 'f',
            code: 'KeyF',
            ctrlKey: true,
            metaKey: true,
        }), false)).toBe(false);
        expect(isFindShortcut(keyDown({ key: 'g', code: 'KeyG', ctrlKey: true }), false)).toBe(false);
    });
});

describe('useFindShortcut', () => {
    afterEach(() => {
        cleanup();
        userAgentMock.isMacOs = false;
        document.body.innerHTML = '';
    });

    function Harness({ enabled, onFind }: { enabled: boolean; onFind: () => void }) {
        const ref = useRef<HTMLDivElement>(null);
        useFindShortcut({ enabled, onFind, ignoreWithinRef: ref });
        return (
            <div>
                <div ref={ref}>
                    <input data-testid="inside" />
                </div>
                <input data-testid="outside" />
            </div>
        );
    }

    it('replaces the browser find with the callback', () => {
        const onFind = vi.fn();
        const { getByTestId } = render(<Harness enabled onFind={onFind} />);

        const event = keyDown({ key: 'f', code: 'KeyF', ctrlKey: true });
        getByTestId('outside').dispatchEvent(event);

        expect(onFind).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(true);
    });

    it('uses Cmd+F on macOS', () => {
        userAgentMock.isMacOs = true;
        const onFind = vi.fn();
        render(<Harness enabled onFind={onFind} />);

        document.body.dispatchEvent(keyDown({ key: 'f', code: 'KeyF', ctrlKey: true }));
        expect(onFind).not.toHaveBeenCalled();

        document.body.dispatchEvent(keyDown({ key: 'f', code: 'KeyF', metaKey: true }));
        expect(onFind).toHaveBeenCalledTimes(1);
    });

    it('leaves the shortcut alone inside the ignored element', () => {
        const onFind = vi.fn();
        const { getByTestId } = render(<Harness enabled onFind={onFind} />);

        const event = keyDown({ key: 'f', code: 'KeyF', ctrlKey: true });
        getByTestId('inside').dispatchEvent(event);

        expect(onFind).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
    });

    it('leaves the shortcut alone while a modal is open', () => {
        const onFind = vi.fn();
        render(<Harness enabled onFind={onFind} />);
        const overlay = document.createElement('div');
        overlay.className = REACT_MODAL_OVERLAY_CLASS;
        document.body.appendChild(overlay);

        const event = keyDown({ key: 'f', code: 'KeyF', ctrlKey: true });
        document.body.dispatchEvent(event);

        expect(onFind).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
    });

    it('does nothing while disabled and after unmount', () => {
        const onFind = vi.fn();
        const { rerender, unmount } = render(<Harness enabled={false} onFind={onFind} />);

        document.body.dispatchEvent(keyDown({ key: 'f', code: 'KeyF', ctrlKey: true }));
        expect(onFind).not.toHaveBeenCalled();

        rerender(<Harness enabled onFind={onFind} />);
        unmount();
        document.body.dispatchEvent(keyDown({ key: 'f', code: 'KeyF', ctrlKey: true }));
        expect(onFind).not.toHaveBeenCalled();
    });

    it('uses the latest callback', () => {
        const first = vi.fn();
        const second = vi.fn();
        const { rerender } = render(<Harness enabled onFind={first} />);
        rerender(<Harness enabled onFind={second} />);

        document.body.dispatchEvent(keyDown({ key: 'f', code: 'KeyF', ctrlKey: true }));

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });
});
