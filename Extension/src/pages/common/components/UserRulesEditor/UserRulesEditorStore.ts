/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
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
import type { SettingOption, Settings } from '../../../../background/schema/settings';
import type { GetOptionsDataResponse } from '../../../../background/services/settings';
import {
    createSavingService,
    SavingFSMEvent,
    SavingFSMState,
} from '../Editor/savingFSM';
import { type EditorCursor } from '../Editor/editor-handle';

/**
 * Settings data received with the options page data.
 */
type SettingsData = GetOptionsDataResponse['settings'];

/**
 * Store of the user rules editor component.
 */
export class UserRulesEditorStore {
    @observable
    settings: SettingsData | null = null;

    @observable
    userRulesEditorContentChanged = false;

    @observable
    userRulesEditorWrap: boolean | null = null;

    @observable
    userRulesExportAvailable = false;

    @observable
    userRulesEditorPrefsDropped = false;

    @observable
    specificLimitWarningData: unknown = null;

    @observable
    cursorPosition: EditorCursor | null = null;

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

    /**
     * Requests settings data and stores it.
     */
    @action
    async requestSettingsData(): Promise<void> {
        const data = await messenger.getOptionsData();

        runInAction(() => {
            this.settings = data.settings;
        });
    }

    @action
    setUserRulesEditorContentChangedState = (state: boolean): void => {
        this.userRulesEditorContentChanged = state;
    };

    @action
    setUserRulesExportAvailableState = (state: boolean): void => {
        this.userRulesExportAvailable = state;
    };

    @action
    setUserRulesEditorPrefsDropped = (state: boolean): void => {
        this.userRulesEditorPrefsDropped = state;
    };

    @action
    setCursorPosition = (position: EditorCursor | null): void => {
        this.cursorPosition = position;
    };

    /**
     * Updates a setting and sends the change to the background.
     *
     * @param settingId Setting identifier
     * @param value New setting value
     */
    @action
    async updateSetting<T extends SettingOption>(settingId: T, value: Settings[T]): Promise<void> {
        if (this.settings) {
            this.settings.values[settingId] = value;
        }

        await messenger.changeUserSetting(settingId, value);
    }

    /**
     * Toggles the wrap mode and persists it in the settings.
     */
    @action
    async toggleUserRulesEditorWrapMode(): Promise<void> {
        this.userRulesEditorWrap = !this.userRulesEditorWrap;
        if (this.settings) {
            await this.updateSetting(
                this.settings.names.UserRulesEditorWrap,
                this.userRulesEditorWrap,
            );
        }
    }

    @action
    setUserRulesEditorWrapMode(value: boolean): void {
        this.userRulesEditorWrap = value;
    }

    @computed
    get userRulesEditorWrapState(): boolean | null {
        if (this.settings) {
            this.setUserRulesEditorWrapMode(
                this.settings.values[this.settings.names.UserRulesEditorWrap],
            );
        }

        return this.userRulesEditorWrap;
    }

    @computed
    get userFilterEnabledSettingId(): SettingOption.UserFilterEnabled | null {
        if (!this.settings) {
            return null;
        }
        return this.settings.names.UserFilterEnabled;
    }

    @computed
    get userFilterEnabled(): boolean {
        const settingId = this.userFilterEnabledSettingId;
        if (this.settings && settingId !== null) {
            return this.settings.values[settingId];
        }
        return false;
    }

    /**
     * Returns the cursor position requested by the list view.
     */
    getCursorPosition(): EditorCursor | null {
        return this.cursorPosition;
    }

    /**
     * Saves user rules via the saving state machine.
     *
     * @param value User rules content
     */
    saveUserRules(value: string): Promise<void> {
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
