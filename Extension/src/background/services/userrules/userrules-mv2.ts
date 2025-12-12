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

import { type Engine } from 'engine';

import { SettingOption } from '../../schema';
import { settingsEvents } from '../../events';

import { UserRulesServiceCommon } from './userrules-common';

/**
 * Service for handling user rules: reading, adding, deleting.
 */
export class UserRulesService extends UserRulesServiceCommon {
    /**
     * Initializes UserRulesService: creates handlers for operations on user rules.
     *
     * @param engine Engine instance.
     */
    public static async init(engine: Engine): Promise<void> {
        UserRulesServiceCommon.init(engine);

        settingsEvents.addListener(
            SettingOption.UserFilterEnabled,
            UserRulesService.handleEnableStateChange,
        );
    }

    /**
     * Updates the tswebextension engine on {@link SettingOption.UserFilterEnabled} setting change.
     * This setting can be changed by the switch ui element, so it is important to update the engine config
     * via debounce function for MV2, as this is a heavyweight call.
     */
    private static async handleEnableStateChange(): Promise<void> {
        await UserRulesServiceCommon.engine.debounceUpdate();
    }
}
