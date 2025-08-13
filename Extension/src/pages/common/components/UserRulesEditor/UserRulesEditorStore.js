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
    SavingFSMEvent,
    SavingFSMState,
} from '../Editor/savingFSM';

class UserRulesEditorStore {
    @observable
    settings = null;

    @observable
    userRulesEditorContentChanged = false;

    @observable
    userRulesEditorWrap = null;

    @observable
    userRulesExportAvailable = false;

    @observable
    userRulesEditorPrefsDropped = false;

    @observable
    specificLimitWarningData = null;

    @observable
    cursorPosition = null;

    savingService = createSavingService({
        id: 'userRules',
        services: {
            saveData: async ({ event }) => {
                const { value, callback } = event;

                await messenger.saveUserRules(value);

                await callback();
            },
        },
    });

    @observable
    savingUserRulesState = this.savingService.getSnapshot().value;

    constructor() {
        makeObservable(this);

        this.updateSetting = this.updateSetting.bind(this);

        this.savingService.subscribe((state) => {
            runInAction(() => {
                this.savingUserRulesState = state.value;
                if (state.value === SavingFSMState.Saving) {
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
    setCursorPosition = (position) => {
        this.cursorPosition = position;
    };

    @action
    async updateSetting(settingId, value) {
        if (this.settings) {
            this.settings.values[settingId] = value;
        }

        await messenger.changeUserSetting(settingId, value);
    }

    @action
    async toggleUserRulesEditorWrapMode() {
        this.userRulesEditorWrap = !this.userRulesEditorWrap;
        if (this.settings) {
            await this.updateSetting(
                this.settings.names.UserRulesEditorWrap,
                this.userRulesEditorWrap,
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

    getCursorPosition() {
        return this.cursorPosition;
    }

    saveUserRules(value) {
        return new Promise((resolve, reject) => {
            try {
                this.savingService.send({
                    type: SavingFSMEvent.Save,
                    value,
                    callback: resolve,
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}

export const userRulesEditorStore = createContext(new UserRulesEditorStore());
