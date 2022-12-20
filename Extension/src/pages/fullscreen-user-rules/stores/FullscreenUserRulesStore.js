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
