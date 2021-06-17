import { createMachine } from 'xstate';

export const PREVIEW_STATES = {
    LOADING: 'loading',
    ERROR: 'error',
    SUCCESS: 'success',
};

export const PREVIEW_EVENTS = {
    ERROR: 'error',
    SUCCESS: 'success',
};

export const previewLoadMachine = createMachine({
    id: 'preview-load',
    initial: PREVIEW_STATES.LOADING,
    states: {
        [PREVIEW_STATES.LOADING]: {
            on: {
                [PREVIEW_EVENTS.ERROR]: PREVIEW_STATES.ERROR,
                [PREVIEW_EVENTS.SUCCESS]: PREVIEW_STATES.SUCCESS,
            },
        },
        [PREVIEW_STATES.ERROR]: {
            type: 'final',
        },
        [PREVIEW_STATES.SUCCESS]: {
            type: 'final',
        },
    },
});
