/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension
 * (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it
 * and/or modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension.
 * If not, see <http://www.gnu.org/licenses/>.
 */

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { createActor, type Actor } from 'xstate';

// eslint-disable-next-line import/order
import {
    ExtensionUpdateFSMEvent,
    ExtensionUpdateFSMState,
    MIN_UPDATE_DISPLAY_DURATION_MS,
} from '../../../../../Extension/src/common/constants';

// Mock dependencies used by the machine's actor handler
vi.mock('../../../../../Extension/src/common/logger', () => ({
    logger: {
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        isVerbose: false,
    },
}));

vi.mock('../../../../../Extension/src/background/services/api/ui/icons', () => ({
    iconsApi: {
        update: vi.fn(),
    },
}));

vi.mock('../../../../../Extension/src/background/services/notifier', () => ({
    notifier: {
        notifyListeners: vi.fn(),
    },
}));

// Import after mocks are set up
// eslint-disable-next-line import/first
import {
    extensionUpdateMachine,
} from '../../../../../Extension/src/background/services/extension-update/extension-update-machine-mv3';

describe('extensionUpdateMachine', () => {
    let actor: Actor<typeof extensionUpdateMachine>;

    beforeEach(() => {
        vi.useFakeTimers();
        actor = createActor(extensionUpdateMachine);
        actor.start();
    });

    afterEach(() => {
        actor.stop();
        vi.useRealTimers();
    });

    describe('Init event from Idle', () => {
        it('transitions to Available when isUpdateAvailable is true', () => {
            actor.send({
                type: ExtensionUpdateFSMEvent.Init,
                isUpdateAvailable: true,
                isReloadedOnUpdate: false,
                isReloadFailed: false,
            });

            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Available);
        });

        it(
            'transitions to Success when isReloadedOnUpdate and not failed',
            () => {
                actor.send({
                    type: ExtensionUpdateFSMEvent.Init,
                    isUpdateAvailable: false,
                    isReloadedOnUpdate: true,
                    isReloadFailed: false,
                });

                expect(actor.getSnapshot().value)
                    .toBe(ExtensionUpdateFSMState.Success);
            },
        );

        it('transitions to Failed when reload failed', () => {
            actor.send({
                type: ExtensionUpdateFSMEvent.Init,
                isUpdateAvailable: false,
                isReloadedOnUpdate: true,
                isReloadFailed: true,
            });

            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Failed);
        });

        it('stays in Idle when no update and no reload', () => {
            actor.send({
                type: ExtensionUpdateFSMEvent.Init,
                isUpdateAvailable: false,
                isReloadedOnUpdate: false,
                isReloadFailed: false,
            });

            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Idle);
        });

        it('prioritizes isUpdateAvailable over isReloadedOnUpdate', () => {
            actor.send({
                type: ExtensionUpdateFSMEvent.Init,
                isUpdateAvailable: true,
                isReloadedOnUpdate: true,
                isReloadFailed: false,
            });

            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Available);
        });
    });

    describe('manual update check flow', () => {
        it('transitions Idle → Checking → Available', () => {
            actor.send({ type: ExtensionUpdateFSMEvent.Check });
            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Checking);

            actor.send({ type: ExtensionUpdateFSMEvent.UpdateAvailable });
            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Available);
        });

        it(
            'transitions Idle → Checking → NotAvailable → Idle (after delay)',
            () => {
                actor.send({ type: ExtensionUpdateFSMEvent.Check });
                expect(actor.getSnapshot().value)
                    .toBe(ExtensionUpdateFSMState.Checking);

                actor.send({ type: ExtensionUpdateFSMEvent.NoUpdateAvailable });
                expect(actor.getSnapshot().value)
                    .toBe(ExtensionUpdateFSMState.NotAvailable);

                vi.advanceTimersByTime(MIN_UPDATE_DISPLAY_DURATION_MS);
                expect(actor.getSnapshot().value)
                    .toBe(ExtensionUpdateFSMState.Idle);
            },
        );

        it('transitions Idle → Checking → Failed on check failure', () => {
            actor.send({ type: ExtensionUpdateFSMEvent.Check });
            actor.send({ type: ExtensionUpdateFSMEvent.UpdateFailed });
            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Failed);
        });
    });

    describe('update installation flow', () => {
        it('transitions Available → Updating', () => {
            actor.send({ type: ExtensionUpdateFSMEvent.Check });
            actor.send({ type: ExtensionUpdateFSMEvent.UpdateAvailable });
            actor.send({ type: ExtensionUpdateFSMEvent.Update });

            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Updating);
        });

        it('transitions Updating → Failed on update failure', () => {
            actor.send({ type: ExtensionUpdateFSMEvent.Check });
            actor.send({ type: ExtensionUpdateFSMEvent.UpdateAvailable });
            actor.send({ type: ExtensionUpdateFSMEvent.Update });
            actor.send({ type: ExtensionUpdateFSMEvent.UpdateFailed });

            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Failed);
        });
    });

    describe('retry from Failed', () => {
        it('transitions Failed → Checking on Check event', () => {
            actor.send({ type: ExtensionUpdateFSMEvent.Check });
            actor.send({ type: ExtensionUpdateFSMEvent.UpdateFailed });
            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Failed);

            actor.send({ type: ExtensionUpdateFSMEvent.Check });
            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Checking);
        });
    });

    describe('Success auto-transition', () => {
        it('transitions Success → Idle after NOTIFICATION_DELAY', () => {
            actor.send({
                type: ExtensionUpdateFSMEvent.Init,
                isUpdateAvailable: false,
                isReloadedOnUpdate: true,
                isReloadFailed: false,
            });
            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Success);

            vi.advanceTimersByTime(MIN_UPDATE_DISPLAY_DURATION_MS);
            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Idle);
        });
    });

    describe('ignored events', () => {
        it('ignores Check event while in Checking state', () => {
            actor.send({ type: ExtensionUpdateFSMEvent.Check });
            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Checking);

            // Sending Check again should be ignored (no transition defined)
            actor.send({ type: ExtensionUpdateFSMEvent.Check });
            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Checking);
        });

        it('ignores Init event when not in Idle state', () => {
            actor.send({ type: ExtensionUpdateFSMEvent.Check });
            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Checking);

            actor.send({
                type: ExtensionUpdateFSMEvent.Init,
                isUpdateAvailable: true,
            });
            expect(actor.getSnapshot().value)
                .toBe(ExtensionUpdateFSMState.Checking);
        });
    });
});
