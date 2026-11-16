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

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import browser from 'webextension-polyfill';

import { NotifierType } from '../../../../../Extension/src/common/constants';
import { MessageType } from '../../../../../Extension/src/common/messages';
import { MessengerCommon, Page } from '../../../../../Extension/src/pages/services/messenger/messenger-common';

const { ports, createPort } = vi.hoisted(() => {
    const createPort = () => ({
        postMessage: vi.fn(),
        disconnect: vi.fn(),
        onMessage: { addListener: vi.fn() },
        onDisconnect: { addListener: vi.fn() },
    });

    return { ports: [] as ReturnType<typeof createPort>[], createPort };
});

vi.mock('webextension-polyfill', () => ({
    default: {
        runtime: {
            lastError: undefined,
            onMessage: {
                addListener: vi.fn(),
                removeListener: vi.fn(),
            },
            sendMessage: vi.fn(),
            connect: vi.fn(() => {
                const port = createPort();
                ports.push(port);
                return port;
            }),
        },
    },
}));

class TestMessenger extends MessengerCommon {}

describe('MessengerCommon unload teardown', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        ports.length = 0;
        vi.mocked(browser.runtime.sendMessage).mockResolvedValue({ listenerId: 1 });
    });

    afterEach(() => {
        // Tear down listeners registered by the test, as a real unload would.
        window.dispatchEvent(new Event('pagehide'));
        vi.clearAllMocks();
    });

    it('keeps the event listener subscription when the leave confirmation is dismissed', async () => {
        const messenger = new TestMessenger();
        await messenger.createEventListener([NotifierType.UserFilterUpdated], vi.fn());

        window.dispatchEvent(new Event('beforeunload'));

        // The user can still choose to stay, so the page must stay subscribed.
        expect(browser.runtime.onMessage.removeListener).not.toHaveBeenCalled();
        expect(browser.runtime.sendMessage).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: MessageType.RemoveListener }),
        );
    });

    it('removes the event listener subscription on pagehide', async () => {
        const messenger = new TestMessenger();
        await messenger.createEventListener([NotifierType.UserFilterUpdated], vi.fn());

        window.dispatchEvent(new Event('pagehide'));

        expect(browser.runtime.onMessage.removeListener).toHaveBeenCalled();
        expect(browser.runtime.sendMessage).toHaveBeenCalledWith(
            expect.objectContaining({ type: MessageType.RemoveListener }),
        );
    });

    it('keeps the long-lived connection when the leave confirmation is dismissed', () => {
        MessengerCommon.createLongLivedConnection(Page.Popup, [NotifierType.UserFilterUpdated], vi.fn());

        window.dispatchEvent(new Event('beforeunload'));

        expect(ports.at(-1)?.disconnect).not.toHaveBeenCalled();
    });

    it('disconnects the long-lived connection on pagehide', () => {
        MessengerCommon.createLongLivedConnection(Page.Popup, [NotifierType.UserFilterUpdated], vi.fn());

        window.dispatchEvent(new Event('pagehide'));

        expect(ports.at(-1)?.disconnect).toHaveBeenCalledTimes(1);
    });
});
