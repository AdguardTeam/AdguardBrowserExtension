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

import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { SettingsSection } from '../Settings/SettingsSection';
import { translator } from '../../../../common/translators/translator';
import { UserRulesEditor } from '../../../common/components/UserRulesEditor';
import { MessageType } from '../../../../common/messages';
import { rootStore } from '../../stores/RootStore';
import { messenger } from '../../../services/messenger';
import { DynamicRulesLimitsWarning } from '../Warnings';
import { RuleLimitsLink } from '../RulesLimits/RuleLimitsLink';

import { UserRulesSwitcher } from './UserRulesSwitcher';
import { RuleSyntaxLink } from './RuleSyntaxLink';

import './styles.pcss';

const UserRules = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const handleGoToEditorClick = async () => {
        await messenger.sendMessage(MessageType.OpenFullscreenUserRules);
    };

    // When we close fullscreen editor we should update limits warning message.
    useEffect(() => {
        const updateLimits = async () => {
            if (__IS_MV3__ && !settingsStore.isFullscreenUserRulesEditorOpen) {
                await settingsStore.checkLimitations();
            }
        };

        updateLimits();
    }, [settingsStore, uiStore, settingsStore.isFullscreenUserRulesEditorOpen]);

    return (
        <>
            <SettingsSection
                title={translator.getMessage('options_userfilter')}
                id={settingsStore.userFilterEnabledSettingId}
                mode="smallContainer"
                description={translator.getMessage('options_userfilter_subtitle_key')}
                inlineControl={<UserRulesSwitcher />}
            />
            <div className="settings__group__links">
                <RuleSyntaxLink />
                <RuleLimitsLink />
            </div>
            <DynamicRulesLimitsWarning useWrapper />
            {settingsStore.isFullscreenUserRulesEditorOpen
                ? (
                    <div className="editor__open">
                        <div className="editor__open-title">
                            {translator.getMessage('options_user_rules_editor_stub_title')}
                        </div>
                        <button
                            type="button"
                            className="button button--l button--green-bg actions__btn"
                            onClick={handleGoToEditorClick}
                        >
                            {translator.getMessage('options_user_rules_editor_stub_go_to_editor_button')}
                        </button>
                    </div>
                )
                : (<UserRulesEditor uiStore={uiStore} />)}
        </>
    );
});

export { UserRules };
