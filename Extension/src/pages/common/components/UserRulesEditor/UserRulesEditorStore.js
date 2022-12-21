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

import { createContext } from 'react';
import {
    action,
    computed,
    observable,
    runInAction,
    makeObservable,
} from 'mobx';

import { messenger } from '../../../services/messenger';
import {
    createSavingService,
    EVENTS as SAVING_FSM_EVENTS,
    STATES,
} from '../Editor/savingFSM';

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
                this.settings.names.UserRulesEditorWrap, this.userRulesEditorWrap,
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
                this.settings.values[this.settings.names.UserRulesEditorWrap],
            );
        }

        return this.userRulesEditorWrap;
    }

    @computed
    get userFilterEnabledSettingId() {
        return this.settings.names.UserFilterEnabled;
    }

    @computed
    get userFilterEnabled() {
        if (this.settings) {
            return this.settings.values[this.userFilterEnabledSettingId];
        }
        return false;
    }

    // eslint-disable-next-line class-methods-use-this
    async saveUserRules(value) {
        savingService.send(SAVING_FSM_EVENTS.SAVE, { value });
    }
}

export const userRulesEditorStore = createContext(new UserRulesEditorStore());
