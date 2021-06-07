import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { rootStore } from '../../stores/RootStore';
import { SavingButton } from '../../../common/components/SavingButton';

export const AllowlistSavingButton = observer(({ onClick }) => {
    const { settingsStore } = useContext(rootStore);
    return (
        <SavingButton
            onClick={onClick}
            contentChanged={settingsStore.allowlistEditorContentChanged}
            savingState={settingsStore.savingAllowlistState}
        />
    );
});
