import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { SettingsSection } from '../Settings/SettingsSection';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { UserRulesEditor } from '../../../common/components/UserRulesEditor';
import { MESSAGE_TYPES } from '../../../../common/constants';
import { rootStore } from '../../stores/RootStore';
import { messenger } from '../../../services/messenger';
import { UserRulesSwitcher } from './UserRulesSwitcher';
import { HOW_TO_CREATE_RULES_URL } from '../../../constants';

import './styles.pcss';

const UserRules = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const handleGoToEditorClick = async () => {
        await messenger.sendMessage(MESSAGE_TYPES.OPEN_FULLSCREEN_USER_RULES);
    };

    return (
        <>
            <SettingsSection
                title={reactTranslator.getMessage('options_userfilter')}
                id={settingsStore.userFilterEnabledSettingId}
                mode="smallContainer"
                description={reactTranslator.getMessage('options_userfilter_description_key', {
                    a: (chunks) => (
                        <a
                            className="desc--link"
                            href={HOW_TO_CREATE_RULES_URL}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {chunks}
                        </a>
                    ),
                })}
                inlineControl={<UserRulesSwitcher />}
            />
            {settingsStore.isFullscreenUserRulesEditorOpen
                ? (
                    <div className="editor__open">
                        <div className="editor__open-title">
                            {reactTranslator.getMessage('options_user_rules_editor_stub_title')}
                        </div>
                        <button
                            type="button"
                            className="button button--m button--green actions__btn"
                            onClick={handleGoToEditorClick}
                        >
                            {reactTranslator.getMessage('options_user_rules_editor_stub_go_to_editor_button')}
                        </button>
                    </div>
                )
                : (<UserRulesEditor uiStore={uiStore} />)}
        </>
    );
});

export { UserRules };
