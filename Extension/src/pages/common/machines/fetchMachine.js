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

import { createMachine, assign } from 'xstate';

export const FetchStates = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    FAILURE: 'failure',
};

export const FetchEvents = {
    FETCH: 'FETCH',
    RETRY: 'RETRY',
};

const fetchMachineConfig = {
    id: 'fetch',
    initial: FetchStates.IDLE,
    context: {
        data: null,
        error: null,
    },
    states: {
        [FetchStates.IDLE]: {
            on: {
                [FetchEvents.FETCH]: FetchStates.LOADING,
            },
        },
        [FetchStates.LOADING]: {
            invoke: {
                src: 'fetchData',
                onDone: {
                    target: FetchStates.SUCCESS,
                    actions: ['setData'],
                },
                onError: {
                    target: FetchStates.FAILURE,
                    actions: ['setError'],
                },
            },
        },
        [FetchStates.SUCCESS]: {
            type: 'final',
        },
        [FetchStates.FAILURE]: {
            on: {
                [FetchEvents.RETRY]: FetchStates.LOADING,
            },
        },
    },
};

const fetchMachineOptions = {
    actions: {
        setData: assign((ctx, event) => ({
            data: event.data,
        })),
        setError: assign((ctx, event) => ({
            error: event.data,
        })),
    },
};

export const fetchMachine = createMachine(fetchMachineConfig, fetchMachineOptions);
