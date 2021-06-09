import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores/RootStore';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';

export const UserRulesSwitcher = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleUserGroupToggle = async (e) => {
        settingsStore.updateSetting(e.id, e.data);
    };

    return (
        <Setting
            id={settingsStore.userFilterEnabledSettingId}
            type={SETTINGS_TYPES.CHECKBOX}
            value={settingsStore.userFilterEnabled}
            handler={handleUserGroupToggle}
        />
    );
});
