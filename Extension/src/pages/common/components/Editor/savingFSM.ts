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

import {
    createActor,
    fromPromise,
    setup,
} from 'xstate';

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
}

/**
 * Save data parameters.
 */
type SaveDataParams = {
    /**
     * Event.
     */
    event: {
        /**
         * Value to be saved.
         */
        value: string;

        /**
         * Callback to be called afterwards.
         */
        callback: () => void;
    };
};

const SAVED_DISPLAY_TIMEOUT_MS = 1000;

type SavingServiceParams = {
    /**
     * Identifier.
     */
    id: string;

    /**
     * Services to be used in the state machine.
     */
    services: {
        /**
         * Save data service.
         *
         * @param params Save data parameters.
         */
        saveData: (params: SaveDataParams) => Promise<void>;
    };
};

const SAVE_DATA_ACTOR_NAME = 'saveDataActor';

// TODO: Maybe we can remove this service?
export const createSavingService = ({ id, services }: SavingServiceParams) => {
    const workflow = setup({
        actors: {
            [SAVE_DATA_ACTOR_NAME]: fromPromise(async ({ input }: any) => {
                await services.saveData(input);
            }),
        },
    }).createMachine({
        id,
        initial: SavingFSMState.Idle,
        states: {
            [SavingFSMState.Idle]: {
                on: {
                    [SavingFSMEvent.Save]: SavingFSMState.Saving,
                },
            },
            [SavingFSMState.Saving]: {
                invoke: {
                    src: SAVE_DATA_ACTOR_NAME,
                    input: ({ event }) => ({ event }),
                    onDone: {
                        target: SavingFSMState.Saved,
                    },
                    onError: {
                        target: SavingFSMState.Saved,
                        actions: ({ event }) => {
                            const { error } = event;
                            logger.error('[ext.savingFSM]: failed to save data: ', error);
                        },
                    },
                },
            },
            [SavingFSMState.Saved]: {
                after: {
                    [SAVED_DISPLAY_TIMEOUT_MS]: SavingFSMState.Idle,
                },
            },
        },
    });

    const actor = createActor(workflow);

    actor.subscribe((snapshot) => {
        logger.trace('[ext.savingFSM]: current state: ', { id, currentState: snapshot.value });
    });

    return actor.start();
};

/**
 * undefined, 0 - Select all
 * -1 - At the beginning
 * 1 - At the end
 * see https://ace.c9.io/api/classes/src_editor.Editor.html#setValue
 */
export const CURSOR_POSITION_AFTER_INSERT = 1;
