import { createContext } from 'react';
import {
    action,
    computed,
    observable,
    runInAction,
    makeObservable,
} from 'mobx';

import { messenger } from '../../../services/messenger';
import { optionsStorage } from '../../../options/options-storage';
import { createSavingService, EVENTS as SAVING_FSM_EVENTS, STATES } from '../Editor/savingFSM';

const savingService = createSavingService({
    id: 'userRules',
    services: {
        saveData: (_, e) => messenger.saveUserRules(e.value),
    },
});

class UserRulesEditorStore {
    @observable userRulesEditorContentChanged = false;

    @observable userRulesEditorWrap = null;

    @observable savingUserRulesState = savingService.initialState.value;

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
    setUserRulesEditorWrapMode() {
        this.userRulesEditorWrap = !this.userRulesEditorWrap;
        optionsStorage.setItem(
            optionsStorage.KEYS.USER_RULES_EDITOR_WRAP,
            this.userRulesEditorWrap,
        );
    }

    @computed
    get userRulesEditorWrapState() {
        this.userRulesEditorWrap = optionsStorage.getItem(
            optionsStorage.KEYS.USER_RULES_EDITOR_WRAP,
        );
        return this.userRulesEditorWrap;
    }

    // eslint-disable-next-line class-methods-use-this
    async saveUserRules(value) {
        savingService.send(SAVING_FSM_EVENTS.SAVE, { value });
    }
}

export const userRulesEditorStore = createContext(new UserRulesEditorStore());
