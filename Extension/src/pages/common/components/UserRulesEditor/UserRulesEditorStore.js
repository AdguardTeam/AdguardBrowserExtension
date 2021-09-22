import { createContext } from 'react';
import {
    action,
    observable,
    runInAction,
    makeObservable,
} from 'mobx';

import { messenger } from '../../../services/messenger';
import { createSavingService, EVENTS as SAVING_FSM_EVENTS, STATES } from '../Editor/savingFSM';

const savingService = createSavingService({
    id: 'userRules',
    services: {
        saveData: (_, e) => messenger.saveUserRules(e.value),
    },
});

class UserRulesEditorStore {
    @observable userRulesEditorContentChanged = false;

    @observable savingUserRulesState = savingService.initialState.value;

    @observable userRulesExportAvailable = false;

    constructor() {
        makeObservable(this);

        savingService.onTransition((state) => {
            runInAction(() => {
                this.savingUserRulesState = state.value;
                if (state.value === STATES.SAVING) {
                    this.userRulesEditorContentChanged = false;
                }
            });
        });
    }

    @action
    setUserRulesEditorContentChangedState = (state) => {
        this.userRulesEditorContentChanged = state;
    };

    @action
    setUserRulesExportAvailableState = (state) => {
        this.userRulesExportAvailable = state;
    };

    // eslint-disable-next-line class-methods-use-this
    async saveUserRules(value) {
        savingService.send(SAVING_FSM_EVENTS.SAVE, { value });
    }
}

export const userRulesEditorStore = createContext(new UserRulesEditorStore());
