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

import { interpret, Machine } from 'xstate';

import { logger } from '../../../../common/logger';

/**
 * Possible states of the saving state machine.
 */
export const enum SavingFSMState {
    Idle = 'idle',
    Saving = 'saving',
    Saved = 'saved',
}

export type SavingFSMStateType = SavingFSMState.Idle | SavingFSMState.Saving | SavingFSMState.Saved;

/**
 * Possible events of the saving state machine.
 */
export const enum SavingFSMEvent {
    Save = 'save',
    Success = 'success',
    Error = 'error',
    Timeout = 'timeout',
}

const SAVED_DISPLAY_TIMEOUT_MS = 1000;

const savingStateMachine = {
    initial: SavingFSMState.Idle,
    states: {
        [SavingFSMState.Idle]: {
            on: {
                [SavingFSMEvent.Save]: SavingFSMState.Saving,
            },
        },
        [SavingFSMState.Saving]: {
            invoke: {
                src: 'saveData',
                onDone: {
                    target: SavingFSMState.Saved,
                },
                onError: {
                    target: SavingFSMState.Saved,
                    // @ts-ignore
                    actions: (context, event) => {
                        const { data: error } = event;
                        logger.error(error.message);
                    },
                },
            },
        },
        [SavingFSMState.Saved]: {
            after: [{
                delay: SAVED_DISPLAY_TIMEOUT_MS, target: SavingFSMState.Idle,
            }],
        },
    },
};

type SavingServiceParams = {
    /**
     * Identifier.
     */
    id: string,

    /**
     * Services to be used in the state machine.
     */
    services: {
        saveData: () => Promise<void>,
    },

};

export const createSavingService = ({ id, services }: SavingServiceParams) => {
    return interpret(Machine({ ...savingStateMachine, id }, { services }))
        .start()
        .onEvent((event) => {
            logger.debug(id, event);
        })
        .onTransition((state) => {
            logger.debug(id, { currentState: state.value });
        });
};
