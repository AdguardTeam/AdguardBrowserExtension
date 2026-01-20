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

import { createActor, setup } from 'xstate';

import {
    ExtensionUpdateFSMEvent,
    ExtensionUpdateFSMState,
    MIN_UPDATE_DISPLAY_DURATION_MS,
    NotifierType,
} from '../../../common/constants';
import { logger } from '../../../common/logger';
import { iconsApi } from '../../api/ui/icons';
import { notifier } from '../../notifier';

/**
 * Extension update state machine event type.
 */
type EventType = {
    /**
     * Event type.
     */
    type: ExtensionUpdateFSMEvent;

    /**
     * Whether an extension update is available.
     */
    isUpdateAvailable?: boolean;

    /**
     * Whether the extension was reloaded after an update.
     */
    isReloadedOnUpdate?: boolean;
};

const EXTENSION_UPDATE_MACHINE_ID = 'extensionUpdate';

/**
 * Extension update state machine.
 */
const extensionUpdateMachine = setup({
    types: {} as { events: EventType },
    delays: {
        NOTIFICATION_DELAY: MIN_UPDATE_DISPLAY_DURATION_MS,
    },
}).createMachine({
    id: EXTENSION_UPDATE_MACHINE_ID,
    initial: ExtensionUpdateFSMState.Idle,
    states: {
        [ExtensionUpdateFSMState.Idle]: {
            on: {
                [ExtensionUpdateFSMEvent.Init]: [
                    {
                        /**
                         * Guard to restore Available state when update is already downloaded.
                         *
                         * Purpose: When a page (popup/options) loads and an update was already made
                         * available by Chrome (via onUpdateAvailable event), we need to restore the
                         * FSM to Available state so the UI can show the "Update" button immediately.
                         *
                         * This happens when:
                         * - Chrome auto-downloaded an update in the background;
                         * - User manually checked for update, it was found, but user didn't apply it yet;
                         * - Page was closed and reopened while update is still pending.
                         *
                         * Without this guard, the FSM would stay in Idle state and the UI wouldn't
                         * know an update is available, even though ExtensionUpdateService.isUpdateAvailable
                         * returns true.
                         *
                         * @param data Event data.
                         * @param data.event Event object containing the update availability information.
                         *
                         * @returns True if an update is available, false otherwise.
                         */
                        guard: ({ event }: { event: EventType }): boolean => !!event.isUpdateAvailable,
                        target: ExtensionUpdateFSMState.Available,
                    },
                    {
                        guard: ({ event }: { event: EventType }): boolean => !!event.isReloadedOnUpdate,
                        target: ExtensionUpdateFSMState.Success,
                    },
                ],
                [ExtensionUpdateFSMEvent.Check]: {
                    target: ExtensionUpdateFSMState.Checking,
                },
                // UpdateAvailable event is emitted when chrome.runtime.onUpdateAvailable is fired
                [ExtensionUpdateFSMEvent.UpdateAvailable]: {
                    target: ExtensionUpdateFSMState.Available,
                },
            },
        },
        [ExtensionUpdateFSMState.Checking]: {
            after: {
                NOTIFICATION_DELAY: [
                    {
                        /**
                         * Guard to transition to Available state after minimum display duration.
                         *
                         * Ensures "Checking for updates..." notification displays for at least 2 seconds
                         * before showing the update button, even if Chrome finds the update immediately.
                         *
                         * @param data Guard context object.
                         * @param data.event Event that triggered the guard.
                         *
                         * @returns True if UpdateAvailable event was received.
                         */
                        guard: ({ event }: { event: EventType }): boolean => (
                            event.type === ExtensionUpdateFSMEvent.UpdateAvailable
                        ),
                        target: ExtensionUpdateFSMState.Available,
                    },
                    {
                        /**
                         * Guard to transition to NotAvailable state after minimum display duration.
                         *
                         * Ensures "Checking for updates..." notification displays for at least 2 seconds
                         * before showing "No update available" result, preventing UI flicker.
                         *
                         * @param data Guard context object.
                         * @param data.event Event that triggered the guard.
                         *
                         * @returns True if NoUpdateAvailable event was received.
                         */
                        guard: ({ event }: { event: EventType }): boolean => (
                            event.type === ExtensionUpdateFSMEvent.NoUpdateAvailable
                        ),
                        target: ExtensionUpdateFSMState.NotAvailable,
                    },
                    {
                        /**
                         * Guard to transition to Failed state after minimum display duration.
                         *
                         * Ensures "Checking for updates..." notification displays for at least 2 seconds
                         * before showing error notification, providing smooth UI experience.
                         *
                         * @param data Guard context object.
                         * @param data.event Event that triggered the guard.
                         *
                         * @returns True if UpdateFailed event was received.
                         */
                        guard: ({ event }: { event: EventType }): boolean => (
                            event.type === ExtensionUpdateFSMEvent.UpdateFailed
                        ),
                        target: ExtensionUpdateFSMState.Failed,
                    },
                ],
            },
            on: {
                [ExtensionUpdateFSMEvent.UpdateAvailable]: {
                    // Store the event to be processed after delay
                    actions: [],
                },
                [ExtensionUpdateFSMEvent.NoUpdateAvailable]: {
                    // Store the event to be processed after delay
                    actions: [],
                },
                [ExtensionUpdateFSMEvent.UpdateFailed]: {
                    // Store the event to be processed after delay
                    actions: [],
                },
            },
        },
        // transition state, needed to show a notification on popup
        [ExtensionUpdateFSMState.NotAvailable]: {
            after: {
                NOTIFICATION_DELAY: {
                    target: ExtensionUpdateFSMState.Idle,
                },
            },
        },
        [ExtensionUpdateFSMState.Available]: {
            on: {
                [ExtensionUpdateFSMEvent.Update]: {
                    target: ExtensionUpdateFSMState.Updating,
                },
            },
        },
        [ExtensionUpdateFSMState.Updating]: {
            after: {
                NOTIFICATION_DELAY: [
                    {
                        /**
                         * Guard to transition to Failed state after minimum display duration.
                         *
                         * Ensures "Updating..." notification displays for at least 2 seconds
                         * before showing error notification, providing smooth UI experience.
                         *
                         * @param data Guard context object.
                         * @param data.event Event that triggered the guard.
                         *
                         * @returns True if UpdateFailed event was received.
                         */
                        guard: ({ event }: { event: EventType }): boolean => {
                            return event.type === ExtensionUpdateFSMEvent.UpdateFailed;
                        },
                        target: ExtensionUpdateFSMState.Failed,
                    },
                ],
            },
            on: {
                [ExtensionUpdateFSMEvent.UpdateFailed]: {
                    // Store the event to be processed after delay
                    actions: [],
                },
                /**
                 * Note: there is no event for successful update, because it is not needed —
                 * the extension is reloaded automatically after the update
                 * and needed notification is shown based on the storage value (set before the update).
                 * For more details, see `ExtensionUpdateService.handleExtensionReloadOnUpdate()`.
                 */
            },
        },
        [ExtensionUpdateFSMState.Failed]: {
            on: {
                [ExtensionUpdateFSMEvent.Check]: {
                    target: ExtensionUpdateFSMState.Checking,
                },
            },
        },
        [ExtensionUpdateFSMState.Success]: {
            after: {
                NOTIFICATION_DELAY: {
                    target: ExtensionUpdateFSMState.Idle,
                },
            },
        },
    },
});

/**
 * Creates the extension update actor and subscribes to state changes.
 *
 * Intentionally uses a closure to encapsulate the previous state value,
 * avoiding global variables and keeping state tracking internal to the handler logic.
 *
 * @returns The extension update actor instance.
 */
function createExtensionUpdateActorWithHandler(): ReturnType<typeof createActor> {
    const extensionUpdateActor = createActor(extensionUpdateMachine);
    let previousStateValue: unknown;

    const handleStateChange = async (state: ReturnType<typeof extensionUpdateActor.getSnapshot>): Promise<void> => {
        const firstCall = previousStateValue === undefined && state.value === ExtensionUpdateFSMState.Idle;
        const stateChanged = previousStateValue !== undefined && state.value !== previousStateValue;

        if (!firstCall && !stateChanged) {
            previousStateValue = state.value;

            return;
        }

        logger.debug(`[ext.extension-update-machine-mv3]: Current state: ${state.value}, previous state: ${previousStateValue}`);

        notifier.notifyListeners(NotifierType.ExtensionUpdateStateChange, state.value);

        previousStateValue = state.value;

        // We have special icon for "update available" state, so update it when
        // needed, because it will set the correct icon for all tabs independent
        // of their state (enabled/disabled/allowlisted).
        if (state.value === ExtensionUpdateFSMState.Available) {
            await iconsApi.update();
        }
    };

    extensionUpdateActor.subscribe(handleStateChange);

    return extensionUpdateActor;
}

const extensionUpdateActor = createExtensionUpdateActorWithHandler();

export { extensionUpdateActor };
