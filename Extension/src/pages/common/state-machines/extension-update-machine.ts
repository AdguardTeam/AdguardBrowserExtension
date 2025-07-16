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

import { logger } from '../../../common/logger';

/**
 * Extension update state machine states.
 */
export const enum ExtensionUpdateState {
    /**
     * Idle state.
     */
    Idle = 'Idle',

    /**
     * Checking for updates state.
     */
    Checking = 'Checking',

    /**
     * Available updates state.
     */
    Available = 'Available',

    /**
     * Updating state.
     */
    Updating = 'Updating',

    /**
     * Not available updates state.
     *
     * It means that the extension is already up-to-date.
     */
    NotAvailable = 'NotAvailable',

    /**
     * Update failed state.
     */
    UpdateFailed = 'UpdateFailed',
}

/**
 * Extension update state machine events.
 */
export const enum ExtensionUpdateEvent {
    /**
     * Event to check for updates.
     */
    Check = 'Check',

    /**
     * Event for no available updates after the check.
     */
    NoUpdateAvailable = 'NoUpdateAvailable',

    /**
     * Event for available updates after the check.
     */
    UpdateAvailable = 'UpdateAvailable',

    /**
     * Event to start the update.
     */
    Update = 'Update',

    /**
     * Event for failed update.
     */
    UpdateFailed = 'UpdateFailed',

    /**
     * Event for successful update.
     */
    UpdateSuccess = 'UpdateSuccess',

    /**
     * Event for transition to idle state.
     */
    Idle = 'Idle',
}

/**
 * Extension update state machine event type.
 */
type EventType = {
    type: ExtensionUpdateEvent;
};

const EXTENSION_UPDATE_MACHINE_ID = 'extensionUpdate';

const MIN_DELAY_MS = 1;

const NOTIFICATION_DELAY_MS = 2 * 1000;

/**
 * Extension update state machine.
 */
const extensionUpdateMachine = setup({
    types: {} as { events: EventType },
    delays: {
        MIN_DELAY: MIN_DELAY_MS,
        NOTIFICATION_DELAY: NOTIFICATION_DELAY_MS,
    },
}).createMachine({
    id: EXTENSION_UPDATE_MACHINE_ID,
    initial: ExtensionUpdateState.Idle,
    states: {
        [ExtensionUpdateState.Idle]: {
            on: {
                [ExtensionUpdateEvent.Check]: {
                    target: ExtensionUpdateState.Checking,
                },
                // transition from Idle to Available (with no Checking in between) is possible
                // when update checking was done before in popup, and update is available,
                // and options page was opened
                [ExtensionUpdateEvent.UpdateAvailable]: {
                    target: ExtensionUpdateState.Available,
                },
            },
        },
        [ExtensionUpdateState.Checking]: {
            on: {
                [ExtensionUpdateEvent.UpdateAvailable]: {
                    target: ExtensionUpdateState.Available,
                },
                [ExtensionUpdateEvent.NoUpdateAvailable]: {
                    target: ExtensionUpdateState.NotAvailable,
                },
            },
        },
        // transition state, needed to show a notification on popup
        [ExtensionUpdateState.NotAvailable]: {
            after: {
                NOTIFICATION_DELAY: {
                    target: ExtensionUpdateState.Idle,
                },
            },
        },
        [ExtensionUpdateState.Available]: {
            on: {
                [ExtensionUpdateEvent.Update]: {
                    target: ExtensionUpdateState.Updating,
                },
            },
        },
        [ExtensionUpdateState.Updating]: {
            on: {
                [ExtensionUpdateEvent.UpdateSuccess]: {
                    target: ExtensionUpdateState.Idle,
                },
                [ExtensionUpdateEvent.UpdateFailed]: {
                    target: ExtensionUpdateState.UpdateFailed,
                },
            },
        },
        [ExtensionUpdateState.UpdateFailed]: {
            on: {
                [ExtensionUpdateEvent.Check]: {
                    target: ExtensionUpdateState.Checking,
                },
                [ExtensionUpdateEvent.Idle]: {
                    target: ExtensionUpdateState.Idle,
                },
            },
        },
    },
});

const extensionUpdateActor = createActor(extensionUpdateMachine);

extensionUpdateActor.subscribe((state) => {
    logger.trace('[ext.extension-update-machine]: current state:', { id: EXTENSION_UPDATE_MACHINE_ID, currentState: state.value });
});

extensionUpdateActor.start();

export { extensionUpdateActor };

/**
 * Sets the initial state of the extension update machine actor
 * based on the current data for the page — options or popup.
 *
 * @param isExtensionUpdateAvailable Whether an extension update is available.
 */
export const setActorInitState = (isExtensionUpdateAvailable: boolean) => {
    if (isExtensionUpdateAvailable) {
        extensionUpdateActor.send({ type: ExtensionUpdateEvent.UpdateAvailable });
        return;
    }

    extensionUpdateActor.send({ type: ExtensionUpdateEvent.NoUpdateAvailable });
};
