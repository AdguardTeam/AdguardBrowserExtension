import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { SavingButton } from '../SavingButton';
import { userRulesEditorStore } from './UserRulesEditorStore';

export const UserRulesSavingButton = observer(({ onClick }) => {
    const store = useContext(userRulesEditorStore);

    return (
        <SavingButton
            onClick={onClick}
            contentChanged={store.userRulesEditorContentChanged}
            savingState={store.savingUserRulesState}
        />
    );
});
