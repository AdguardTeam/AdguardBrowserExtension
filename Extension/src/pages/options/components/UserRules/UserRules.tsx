/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
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

import React, {
    useContext,
    useCallback,
    useEffect,
    useState,
} from 'react';
import { observer } from 'mobx-react';

import { useTelemetryPageViewEvent } from '../../../common/telemetry';
import { TelemetryEventName, TelemetryScreenName } from '../../../../common/telemetry';
import { SettingsSection } from '../Settings/SettingsSection';
import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';
import { rootStore } from '../../stores/RootStore';
import { messenger } from '../../../services/messenger';
import { DynamicRulesLimitsWarning, ClipboardPermissionWarning } from '../Warnings';
import { UserAgent } from '../../../../common/user-agent';
import { UserRulesEditor } from '../../../common/components/UserRulesEditor';
import { userRulesEditorStore } from '../../../common/components/UserRulesEditor/UserRulesEditorStore';
import { EditorLeaveModal } from '../../../common/components/Editor';
import { SavingFSMState } from '../../../common/components/Editor/savingFSM';
import { type ViewModeValue, ViewMode } from '../../../common/components/UserRulesEditor/view-mode';

import { UserRulesSwitcher } from './UserRulesSwitcher';
import { UserScriptsApiWarningForUserRules } from './UserScriptsApiWarningForUserRules';
import { USER_RULES_VIEW_MODE_TOGGLE_CLASS, UserRulesList } from './UserRulesList';
import { UserRulesMenu } from './UserRulesMenu';

import './styles.pcss';

const UserRules = observer(() => {
    const { settingsStore, uiStore, telemetryStore } = useContext(rootStore);
    const editorStore = useContext(userRulesEditorStore);

    useTelemetryPageViewEvent(telemetryStore, TelemetryScreenName.UserRulesScreen);

    const viewMode = settingsStore.userRulesViewMode;

    /**
     * Which switch the user asked for while there were unsaved changes, or
     * `null` when the "leave without saving?" confirmation is hidden.
     *
     * The List view reports its inline draft through
     * {@link UserRulesList}'s `onUnsavedDraftChange`: switching to the Edit view
     * unmounts the list and discards that draft without a route change, so
     * neither `beforeunload` nor the list's route blocker would catch it.
     */
    const [pendingLeave, setPendingLeave] = useState<ViewModeValue | null>(null);
    const [hasUnsavedListDraft, setHasUnsavedListDraft] = useState(false);

    const isSaving = editorStore.savingUserRulesState === SavingFSMState.Saving;
    const isFullscreenOpen = settingsStore.isFullscreenUserRulesEditorOpen;
    const isListView = viewMode === ViewMode.List;

    const setViewMode = useCallback((mode: ViewModeValue) => {
        settingsStore.setUserRulesViewMode(mode);
    }, [settingsStore]);

    const handleGoToEditorClick = async () => {
        telemetryStore.sendCustomEvent(
            TelemetryEventName.EditorInNewWindowClick,
            TelemetryScreenName.UserRulesScreen,
        );
        await messenger.openFullscreenUserRules();
    };

    /**
     * Toggles the User Rules section between View and Edit mode.
     *
     * View → Edit clears the editor storage first. This prevents stale
     * content from a previously-closed fullscreen editor (whose beforeunload
     * listener saved dirty content) from leaking into the options editor.
     * By the time the user switches to Edit, the fullscreen window is already
     * closed, so beforeunload has already run and can't re-save over the clear.
     * An unsaved inline draft in the list asks for confirmation first, since
     * the switch unmounts the list.
     *
     * Edit → View switches immediately when the editor content is clean. When
     * there are unsaved changes, it shows the "leave without saving?"
     * confirmation modal instead of auto-saving: confirming discards the
     * changes and switches to View, cancelling stays in Edit.
     */
    const handleToggleViewMode = useCallback(() => {
        telemetryStore.sendCustomEvent(
            viewMode === ViewMode.List
                ? TelemetryEventName.SwitchToEditorClick
                : TelemetryEventName.SwitchToListClick,
            TelemetryScreenName.UserRulesScreen,
        );

        if (viewMode === ViewMode.List) {
            if (hasUnsavedListDraft) {
                setPendingLeave(ViewMode.Editor);
                return;
            }
            messenger.setEditorStorageContent('');
            setViewMode(ViewMode.Editor);
            return;
        }

        // Edit -> View.
        if (isFullscreenOpen || editorStore.userRulesEditorContentChanged) {
            setPendingLeave(ViewMode.List);
            return;
        }

        setViewMode(ViewMode.List);
    }, [viewMode, setViewMode, editorStore, isFullscreenOpen, hasUnsavedListDraft, telemetryStore]);

    const handleLeaveConfirm = useCallback(() => {
        if (pendingLeave === ViewMode.Editor) {
            // Discard the inline draft by unmounting the list and open the
            // editor, exactly like the clean path in `handleToggleViewMode`.
            messenger.setEditorStorageContent('');
            setPendingLeave(null);
            setViewMode(ViewMode.Editor);
            return;
        }

        // Discard unsaved changes and switch to the list.
        // Note: we do NOT clear editor storage here because the fullscreen
        // editor's beforeunload listener would re-save dirty content after
        // our clear (beforeunload fires when the window actually closes).
        // Instead, storage is cleared when the user next opens the editor
        // (View → Edit in handleToggleViewMode), by which point beforeunload
        // has already run.
        if (isFullscreenOpen) {
            // Close the fullscreen editor window. The port disconnect will
            // fire FullscreenUserRulesEditorUpdated, which updates the
            // options page stub state via the notifier.
            messenger.closeFullscreenUserRules();
        }
        editorStore.setUserRulesEditorContentChangedState(false);
        setPendingLeave(null);
        setViewMode(ViewMode.List);
    }, [editorStore, setViewMode, isFullscreenOpen, pendingLeave]);

    const handleLeaveCancel = useCallback(() => {
        setPendingLeave(null);
    }, []);

    const switchId = settingsStore.userFilterEnabledSettingId;
    const switchTitleId = `${switchId}-title`;

    // When we close fullscreen editor we should update limits warning message.
    useEffect(() => {
        const updateLimits = async () => {
            if (!settingsStore.isFullscreenUserRulesEditorOpen) {
                await settingsStore.checkLimitations();
            }
        };

        updateLimits();
    }, [settingsStore, settingsStore.isFullscreenUserRulesEditorOpen]);

    const switchLabel = isListView
        ? translator.getMessage('options_user_rules_switch_to_editor')
        : translator.getMessage('options_user_rules_switch_to_list');

    const switchToEditorButton = (
        <button
            type="button"
            className={USER_RULES_VIEW_MODE_TOGGLE_CLASS}
            onClick={handleToggleViewMode}
            disabled={isSaving}
            title={switchLabel}
            aria-label={switchLabel}
            aria-pressed={!isListView}
        >
            <Icon
                id={isListView ? '#switch-to-editor' : '#switch-to-list-view'}
                className="icon--24"
                aria-hidden="true"
            />
        </button>
    );

    const fullscreenStub = () => (
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
    );

    let mainContent;
    if (settingsStore.isFullscreenUserRulesEditorOpen) {
        mainContent = fullscreenStub();
    } else if (isListView) {
        mainContent = (
            <UserRulesList
                filterOff={!settingsStore.userFilterEnabled}
                telemetryStore={telemetryStore}
                addNotification={uiStore.addNotification}
                removeNotification={uiStore.removeNotification}
                checkLimitations={settingsStore.checkLimitations}
                onUnsavedDraftChange={setHasUnsavedListDraft}
            />
        );
    } else {
        mainContent = (
            <UserRulesEditor
                setShowLoader={uiStore.setShowLoader}
                addNotification={uiStore.addNotification}
                updateSetting={settingsStore.updateSetting}
                checkLimitations={settingsStore.checkLimitations}
                sendTelemetryCustomEvent={telemetryStore.sendCustomEvent}
            />
        );
    }

    return (
        <>
            <SettingsSection
                title={translator.getMessage('options_userfilter')}
                description={translator.getMessage('options_user_rules_description_key')}
                actions={(
                    <>
                        {switchToEditorButton}
                        <UserRulesMenu />
                    </>
                )}
            />
            <SettingsSection
                id={switchId}
                titleId={switchTitleId}
                titleIcon={(<Icon id="#user-rules" className="icon--24" aria-hidden="true" />)}
                title={translator.getMessage('options_userfilter')}
                mode="smallContainer"
                className="settings__group--editor-switch"
                inlineControl={(<UserRulesSwitcher labelId={switchTitleId} />)}
            />
            <DynamicRulesLimitsWarning />
            <UserScriptsApiWarningForUserRules />
            {UserAgent.isFirefoxMobile && <ClipboardPermissionWarning />}
            {mainContent}
            <EditorLeaveModal
                title={translator.getMessage('options_editor_leave_title')}
                subtitle={translator.getMessage('options_userfilter_leave_subtitle')}
                isOpen={pendingLeave !== null}
                onConfirm={handleLeaveConfirm}
                onCancel={handleLeaveCancel}
            />
        </>
    );
});

export { UserRules };
