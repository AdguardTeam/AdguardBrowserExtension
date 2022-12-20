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

import { Log } from '../../../../common/log';

export const STATES = {
    IDLE: 'idle',
    SAVING: 'saving',
    SAVED: 'saved',
};

export const EVENTS = {
    SAVE: 'save',
    SUCCESS: 'success',
    ERROR: 'error',
    TIMEOUT: 'timeout',
};

const SAVED_DISPLAY_TIMEOUT_MS = 1000;

const savingStateMachine = {
    initial: 'idle',
    states: {
        [STATES.IDLE]: {
            on: {
                [EVENTS.SAVE]: STATES.SAVING,
            },
        },
        [STATES.SAVING]: {
            invoke: {
                src: 'saveData',
                onDone: {
                    target: STATES.SAVED,
                },
                onError: {
                    target: STATES.SAVED,
                    actions: (context, event) => {
                        const { data: error } = event;
                        Log.error(error.message);
                    },
                },
            },
        },
        [STATES.SAVED]: {
            after: [{
                delay: SAVED_DISPLAY_TIMEOUT_MS, target: STATES.IDLE,
            }],
        },
    },
};

export const createSavingService = ({ id, services }) => {
    return interpret(Machine({ ...savingStateMachine, id }, { services }))
        .start()
        .onEvent((event) => {
            Log.debug(id, event);
        })
        .onTransition((state) => {
            Log.debug(id, { currentState: state.value });
        });
};
