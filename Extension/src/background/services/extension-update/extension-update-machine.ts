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
 * Handles state change events.
 *
 * @param state State change event.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleStateChange = (state: any): void => {
    logger.debug(`[ext.extension-update-machine]: Current state: ${state.value}`);

    notifier.notifyListeners(NotifierType.ExtensionUpdateStateChange, state.value);

    iconsApi.update();
};

const extensionUpdateActor = createActor(extensionUpdateMachine);

extensionUpdateActor.subscribe(handleStateChange);

export { extensionUpdateActor };
