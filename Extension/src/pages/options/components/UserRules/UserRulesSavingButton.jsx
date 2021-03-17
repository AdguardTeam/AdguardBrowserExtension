import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { rootStore } from '../../stores/RootStore';
import { SavingButton } from '../SavingButton';

export const UserRulesSavingButton = observer(({ onClick }) => {
    const { settingsStore } = useContext(rootStore);
    return (
        <SavingButton
            onClick={onClick}
            contentChanged={settingsStore.userRulesEditorContentChanged}
            savingState={settingsStore.savingRulesState}
        />
    );
});
