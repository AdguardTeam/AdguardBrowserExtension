import { createContext } from 'react';
import {
    action,
    computed,
    makeObservable,
    observable,
    runInAction,
} from 'mobx';
import { messenger } from '../../services/messenger';
import { MessageType } from '../../../common/messages';

class FullscreenUserRulesStore {
    @observable settings = null;

    constructor() {
        makeObservable(this);
    }

    @action
    async getFullscreenUserRulesData() {
        const { settings } = await messenger.sendMessage(MessageType.GetUserRulesEditorData);
        runInAction(() => {
            this.settings = settings;
        });
    }

    @computed
    get appearanceTheme() {
        if (!this.settings) {
            return null;
        }

        return this.settings.values[this.settings.names.AppearanceTheme];
    }
}

export const fullscreenUserRulesStore = createContext(new FullscreenUserRulesStore());
