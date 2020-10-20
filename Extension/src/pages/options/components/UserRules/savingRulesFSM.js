import { interpret, Machine } from 'xstate';
import { log } from '../../../../background/utils/log';
import { messenger } from '../../../services/messenger';

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

const savingRulesFSM = Machine({
    id: 'savingRulesFSM',
    initial: 'idle',
    states: {
        [STATES.IDLE]: {
            on: {
                [EVENTS.SAVE]: STATES.SAVING,
            },
        },
        [STATES.SAVING]: {
            invoke: {
                id: 'saveUserRules',
                src: (context, event) => {
                    const { value } = event;
                    return messenger.saveUserRules(value);
                },
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
});

export const savingRulesService = interpret(savingRulesFSM)
    .start()
    .onEvent((event) => log.debug(event))
    .onTransition((state) => {
        log.debug({ currentState: state.value });
    });
