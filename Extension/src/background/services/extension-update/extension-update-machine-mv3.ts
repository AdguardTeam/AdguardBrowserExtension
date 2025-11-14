/**
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
                        // TODO: check if it is still needed. AG-47075
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
            on: {
                [ExtensionUpdateFSMEvent.UpdateAvailable]: {
                    target: ExtensionUpdateFSMState.Available,
                },
                [ExtensionUpdateFSMEvent.NoUpdateAvailable]: {
                    target: ExtensionUpdateFSMState.NotAvailable,
                },
                // This can be done if checking failed due to timeout
                [ExtensionUpdateFSMEvent.UpdateFailed]: {
                    target: ExtensionUpdateFSMState.Failed,
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
            on: {
                [ExtensionUpdateFSMEvent.UpdateFailed]: {
                    target: ExtensionUpdateFSMState.Failed,
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
