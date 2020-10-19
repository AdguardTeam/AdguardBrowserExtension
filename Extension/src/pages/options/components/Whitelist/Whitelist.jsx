import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import SettingsSection from '../Settings/SettingsSection';
import SettingsSet from '../Settings/SettingsSet';
import Setting, { SETTINGS_TYPES } from '../Settings/Setting';
import { Editor } from '../Editor';
import { rootStore } from '../../stores/RootStore';

const Whitelist = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { settings } = settingsStore;

    const { DEFAULT_WHITE_LIST_MODE } = settings.names;

    const settingChangeHandler = async ({ id, data }) => {
        await settingsStore.updateSetting(id, data);
    };

    // TODO fix translations
    return (
        <>
            <h2 className="title">
                Whitelist
            </h2>
            <div className="desc">
                AdGuard does not filter websites from the whitelist.
            </div>
            <SettingsSection
                title="Invert whitelist"
            >
                <SettingsSet
                    title="Invert whitelist"
                    description="Unblock ads everywhere except for the whitelist"
                >
                    <Setting
                        id={DEFAULT_WHITE_LIST_MODE}
                        type={SETTINGS_TYPES.CHECKBOX}
                        value={settings.values[DEFAULT_WHITE_LIST_MODE]}
                        handler={settingChangeHandler}
                    />
                </SettingsSet>
            </SettingsSection>
            <Editor />
            <div className="actions">
                <button type="button" className="button button--m button--green actions__btn">
                    Import
                </button>
                <button type="button" className="button button--m button--green-bd actions__btn">
                    Export
                </button>
            </div>
        </>
    );
});

export { Whitelist };
