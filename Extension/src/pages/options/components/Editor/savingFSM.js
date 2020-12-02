import { interpret, Machine } from 'xstate';

import { log } from '../../../../background/utils/log';

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
                        log.error(error.message);
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
            log.debug(id, event);
        })
        .onTransition((state) => {
            log.debug(id, { currentState: state.value });
        });
};
