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

import { SettingsSection } from '../Settings/SettingsSection';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { UserRulesEditor } from '../../../common/components/UserRulesEditor';
import { MessageType } from '../../../../common/messages';
import { rootStore } from '../../stores/RootStore';
import { messenger } from '../../../services/messenger';
import { UserRulesSwitcher } from './UserRulesSwitcher';
import { HOW_TO_CREATE_RULES_URL } from '../../constants';

import './styles.pcss';

const UserRules = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const handleGoToEditorClick = async () => {
        await messenger.sendMessage(MessageType.OpenFullscreenUserRules);
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
