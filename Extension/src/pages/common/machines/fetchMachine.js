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
