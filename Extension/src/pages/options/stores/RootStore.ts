/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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

import { configure } from 'mobx';
import { SettingsStore } from 'settings-store';

import { TelemetryStore } from '../../common/telemetry';

import UiStore from './UiStore';

// Do not allow property change outside of store actions
configure({ enforceActions: 'observed' });

export class RootStore {
    public uiStore: UiStore;

    public settingsStore: SettingsStore;

    public telemetryStore: TelemetryStore;

    constructor() {
        // uiStore and telemetryStore should be initialized before settingsStore
        // because settingsStore uses these stores
        this.uiStore = new UiStore(this);
        this.telemetryStore = new TelemetryStore();
        this.settingsStore = new SettingsStore(this);
    }
}

export const rootStore = createContext(new RootStore());
