import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import debounce from 'lodash/debounce';

import { rootStore } from '../../stores/RootStore';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { HANDLER_DELAY_MS } from '../../../common/constants';

export const UserRulesSwitcher = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleUserGroupToggle = debounce((e) => {
        settingsStore.updateSetting(e.id, e.data);
    }, HANDLER_DELAY_MS);

    return (
        <Setting
            id={settingsStore.userFilterEnabledSettingId}
            type={SETTINGS_TYPES.CHECKBOX}
            value={settingsStore.userFilterEnabled}
            handler={handleUserGroupToggle}
        />
    );
});
