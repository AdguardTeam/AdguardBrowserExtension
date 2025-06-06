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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { addMinDelayLoader } from '../../../common/components/helpers';
import { rootStore } from '../../stores/RootStore';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';

export const UserRulesSwitcher = observer(({ labelId }) => {
    const { settingsStore, uiStore } = useContext(rootStore);

    /**
     * Check if user rules can be enabled (due to dynamic rules limit)
     * and if so, update the setting. Otherwise, sets a specific limit warning to show.
     *
     * @param {object} updateSettingData Data to update the setting.
     * @param {string} updateSettingData.id Setting ID.
     * @param {boolean} updateSettingData.data New setting value.
     */
    const updateUserRulesSetting = async ({ id, data }) => {
        await settingsStore.updateSetting(id, data);

        if (__IS_MV3__) {
            await settingsStore.checkLimitations();
        }
    };

    const handleUserGroupToggle = async (updateSettingData) => {
        await addMinDelayLoader(
            uiStore.setShowLoader,
            updateUserRulesSetting,
        )(updateSettingData);
    };

    return (
        <Setting
            id={settingsStore.userFilterEnabledSettingId}
            type={SETTINGS_TYPES.CHECKBOX}
            value={settingsStore.userFilterEnabled}
            handler={handleUserGroupToggle}
            optimistic={!__IS_MV3__}
            labelId={labelId}
        />
    );
});
