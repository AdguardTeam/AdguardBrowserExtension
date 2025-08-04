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

import classNames from 'classnames';

import { SettingsSection } from '../Settings/SettingsSection';
import { translator } from '../../../../common/translators/translator';
import { UserRulesEditor } from '../../../common/components/UserRulesEditor';
import { rootStore } from '../../stores/RootStore';
import { messenger } from '../../../services/messenger';
import { DynamicRulesLimitsWarning } from '../Warnings';

import { UserRulesSwitcher } from './UserRulesSwitcher';
import { UserScriptsApiWarningForUserRules } from './UserScriptsApiWarningForUserRules';
import { RuleSyntaxLink } from './RuleSyntaxLink';

import './styles.pcss';

const UserRules = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const handleGoToEditorClick = async () => {
        await messenger.openFullscreenUserRules();
    };
    const linksClassNames = classNames('settings__group__links', {
        'settings__group__links--custom': settingsStore.isFullscreenUserRulesEditorOpen,
    });

    const switchId = settingsStore.userFilterEnabledSettingId;
    const switchTitleId = `${switchId}-title`;

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
                id={switchId}
                title={translator.getMessage('options_userfilter')}
                titleId={switchTitleId}
                mode="smallContainer"
                description={translator.getMessage('options_userfilter_subtitle_key')}
                inlineControl={(<UserRulesSwitcher labelId={switchTitleId} />)}
            />
            <DynamicRulesLimitsWarning />
            <UserScriptsApiWarningForUserRules />
            <div className={linksClassNames}>
                <RuleSyntaxLink />
            </div>
            {settingsStore.isFullscreenUserRulesEditorOpen
                ? (
                    <div className="editor__open">
                        <div className="editor__open-text">
                            <div className="editor__open-title">
                                {translator.getMessage('options_user_rules_editor_stub_title')}
                            </div>
                            <div className="editor__open-subtitle">
                                {translator.getMessage('options_user_rules_editor_stub_subtitle')}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="button button--l button--green-bg actions__btn"
                            onClick={handleGoToEditorClick}
                            title={translator.getMessage('options_user_rules_editor_stub_go_to_editor_button')}
                        >
                            {translator.getMessage('options_user_rules_editor_stub_go_to_editor_button')}
                        </button>
                    </div>
                )
                : (<UserRulesEditor />)}
        </>
    );
});

export { UserRules };
