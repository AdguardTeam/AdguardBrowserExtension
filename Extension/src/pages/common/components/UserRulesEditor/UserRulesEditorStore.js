import { createContext } from 'react';
import {
    action,
    computed,
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
    @observable settings = null;

    @observable userRulesEditorContentChanged = false;

    @observable userRulesEditorWrap = null;

    @observable savingUserRulesState = savingService.initialState.value;

    @observable userRulesExportAvailable = false;

    @observable userRulesEditorPrefsDropped = false;

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
    async requestSettingsData() {
        const data = await messenger.getOptionsData();

        runInAction(() => {
            this.settings = data.settings;
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

    @action
    setUserRulesEditorPrefsDropped = (state) => {
        this.userRulesEditorPrefsDropped = state;
    };

    @action
    updateSetting(settingId, value) {
        if (this.settings) {
            this.settings.values[settingId] = value;
        }

        messenger.changeUserSetting(settingId, value);
    }

    @action
    async toggleUserRulesEditorWrapMode() {
        this.userRulesEditorWrap = !this.userRulesEditorWrap;
        if (this.settings) {
            await this.updateSetting(
                this.settings.names.USER_RULES_EDITOR_WRAP, this.userRulesEditorWrap,
            );
        }
    }

    @action
    setUserRulesEditorWrapMode(value) {
        this.userRulesEditorWrap = value;
    }

    @computed
    get userRulesEditorWrapState() {
        if (this.settings) {
            this.setUserRulesEditorWrapMode(
                this.settings.values[this.settings.names.USER_RULES_EDITOR_WRAP],
            );
        }

        return this.userRulesEditorWrap;
    }

    // eslint-disable-next-line class-methods-use-this
    async saveUserRules(value) {
        savingService.send(SAVING_FSM_EVENTS.SAVE, { value });
    }
}

export const userRulesEditorStore = createContext(new UserRulesEditorStore());
