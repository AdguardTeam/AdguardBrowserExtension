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
import { type SettingOption } from '../../../../background/schema';

export const UserRulesSwitcher = observer(({ labelId }: { labelId: string }) => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const updateSettingWithLimitCheck = async (settingId: SettingOption, value: boolean) => {
        await settingsStore.updateSetting(settingId, value);
        if (__IS_MV3__) {
            await settingsStore.checkLimitations();
        }
    };

    const handleUserGroupToggle = async ({ id, data }: { id: SettingOption; data: boolean }) => {
        await addMinDelayLoader(
            uiStore.setShowLoader,
            updateSettingWithLimitCheck,
        )(id, data);
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
