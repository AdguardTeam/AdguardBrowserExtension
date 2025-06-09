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

import React, {
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';

import { SettingsSection } from '../Settings/SettingsSection';
import { addMinDelayLoader } from '../../../common/components/helpers';
import { Editor, EditorLeaveModal } from '../../../common/components/Editor';
import { FILE_WRONG_EXTENSION_CAUSE } from '../../../common/constants';
import { rootStore } from '../../stores/RootStore';
import { handleFileUpload } from '../../../helpers';
import { logger } from '../../../../common/logger';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { translator } from '../../../../common/translators/translator';
import { OptionsPageSections } from '../../../../common/nav';
import { exportData, ExportTypes } from '../../../common/utils/export';
import { getFirstNonDisabledElement } from '../../../common/utils/dom';
import { DynamicRulesLimitsWarning } from '../Warnings';
import { SavingFSMState, CURSOR_POSITION_AFTER_INSERT } from '../../../common/components/Editor/savingFSM';
import { NotificationType } from '../../stores/UiStore';
import { usePreventUnload } from '../../../common/hooks/usePreventUnload';

import { AllowlistSavingButton } from './AllowlistSavingButton';
import { AllowlistSwitcher } from './AllowlistSwitcher';

const Allowlist = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    // rerender allowlist after removed and none-saved domains and import
    // AG-10492
    const [shouldAllowlistRerender, setAllowlistRerender] = useState(false);

    const editorRef = useRef(null);
    const inputRef = useRef(null);
    const actionsRef = useRef(null);

    useEffect(() => {
        (async () => {
            await settingsStore.getAllowlist();
            setAllowlistRerender(false);

            if (editorRef.current) {
                // Get initial store content and set to the editor
                editorRef.current.editor.setValue(settingsStore.allowlist, CURSOR_POSITION_AFTER_INSERT);
                editorRef.current.editor.session.getUndoManager().reset();
            }

            settingsStore.setAllowlistEditorContentChangedState(false);
        })();
    }, [settingsStore, shouldAllowlistRerender]);

    /**
     * One of the reasons for allowlist to update may be
     * adding domains from other places like popup, etc.
     */
    useEffect(() => {
        if (settingsStore.allowlistEditorContentChanged) {
            return;
        }

        if (editorRef.current) {
            editorRef.current.editor.setValue(settingsStore.allowlist, CURSOR_POSITION_AFTER_INSERT);
        }
        settingsStore.setAllowlistEditorContentChangedState(false);
    }, [settingsStore.allowlist, settingsStore]);

    const isSaving = settingsStore.savingAllowlistState === SavingFSMState.Saving;
    const hasUnsavedChanges = !isSaving && settingsStore.allowlistEditorContentChanged;
    const unsavedChangesTitle = translator.getMessage('options_editor_leave_title');
    const unsavedChangesSubtitle = translator.getMessage('options_allowlist_leave_subtitle');
    usePreventUnload(hasUnsavedChanges, `${unsavedChangesTitle} ${unsavedChangesSubtitle}`);

    const { settings } = settingsStore;

    const { AllowlistEnabled, DefaultAllowlistMode } = settings.names;

    const switchId = AllowlistEnabled;
    const switchTitleId = `${switchId}-title`;

    const importClickHandler = (e) => {
        e.preventDefault();

        if (!inputRef.current) {
            return;
        }

        inputRef.current.click();
    };

    const exportClickHandler = () => {
        exportData(ExportTypes.Allowlist);
    };

    const saveAllowlist = async (allowlist) => {
        if (!__IS_MV3__) {
            await settingsStore.saveAllowlist(allowlist);
        } else {
            uiStore.setShowLoader(true);
            await settingsStore.saveAllowlist(allowlist);
            await settingsStore.checkLimitations();
            uiStore.setShowLoader(false);
        }
    };

    const inputChangeHandler = async (event) => {
        event.persist();
        const file = event.target.files[0];

        try {
            const content = await handleFileUpload(file, 'txt');
            await saveAllowlist(settingsStore.allowlist.concat('\n', content));
            setAllowlistRerender(true);
        } catch (e) {
            logger.debug('[ext.Allowlist]: error:', e);
            if (e instanceof Error && e.cause === FILE_WRONG_EXTENSION_CAUSE) {
                uiStore.addNotification({ description: e.message, type: NotificationType.ERROR });
            } else {
                uiStore.addNotification({
                    description: translator('options_popup_import_error_file_description'),
                    type: NotificationType.ERROR,
                });
            }
        }

        // eslint-disable-next-line no-param-reassign
        event.target.value = '';
    };

    const inputChangeHandlerWrapper = addMinDelayLoader(
        uiStore.setShowLoader,
        inputChangeHandler,
    );

    const saveClickHandler = async () => {
        if (settingsStore.allowlistEditorContentChanged) {
            const value = editorRef.current.editor.getValue();
            await saveAllowlist(value);
        }
    };

    const editorChangeHandler = (value) => {
        settingsStore.setAllowlistEditorContentChangedState(settingsStore.allowlist !== value);
    };

    const focusFirstEnabledButton = () => {
        const actionsEl = actionsRef.current;
        if (!actionsEl) {
            return;
        }

        const firstNonDisabledButton = getFirstNonDisabledElement(actionsEl, '.actions__btn');
        if (firstNonDisabledButton) {
            // Before focusing on element we need to add info about shortcut
            // so Screen Reader can tell user that editor can be closed with Escape
            firstNonDisabledButton.ariaKeyShortcuts = 'Escape';
            firstNonDisabledButton.focus();
        }
    };

    let shouldResetSize = false;
    if (settingsStore.allowlistSizeReset) {
        settingsStore.setAllowlistSizeReset(false);
        shouldResetSize = true;
    }

    return (
        <>
            <SettingsSection
                id={switchId}
                title={translator.getMessage('options_allowlist')}
                titleId={switchTitleId}
                mode="smallContainer"
                description={settings.values[DefaultAllowlistMode]
                    ? translator.getMessage('options_allowlist_desc')
                    : (
                        <div>
                            <span className="setting__alert-desc">
                                {reactTranslator.getMessage('options_allowlist_alert_invert', {
                                    a: (chunks) => (
                                        <Link
                                            className="setting__alert-link"
                                            to={`/${OptionsPageSections.miscellaneous}`}
                                        >
                                            {chunks}
                                        </Link>
                                    ),
                                })}
                            </span>
                        </div>
                    )}
                inlineControl={(<AllowlistSwitcher labelId={switchTitleId} />)}
            />
            <DynamicRulesLimitsWarning />
            <Editor
                name="allowlist"
                editorRef={editorRef}
                onChange={editorChangeHandler}
                wrapEnabled={settingsStore.allowlistEditorWrap}
                shouldResetSize={shouldResetSize}
                onSave={saveClickHandler}
                onExit={focusFirstEnabledButton}
            />
            {hasUnsavedChanges && (
                <EditorLeaveModal
                    title={unsavedChangesTitle}
                    subtitle={unsavedChangesSubtitle}
                />
            )}
            <div
                ref={actionsRef}
                className="actions actions--grid actions--buttons actions--allowlist"
            >
                <AllowlistSavingButton onClick={saveClickHandler} />
                <input
                    type="file"
                    accept="text/plain"
                    ref={inputRef}
                    onChange={inputChangeHandlerWrapper}
                    className="actions__input-file"
                />
                <button
                    type="button"
                    className="button button--l button--transparent actions__btn"
                    onClick={importClickHandler}
                    title={translator.getMessage('options_userfilter_import')}
                >
                    {translator.getMessage('options_userfilter_import')}
                </button>
                <button
                    type="button"
                    className="button button--l button--transparent actions__btn"
                    onClick={exportClickHandler}
                    disabled={!settingsStore.allowlist}
                    title={translator.getMessage('options_userfilter_export')}
                >
                    {translator.getMessage('options_userfilter_export')}
                </button>
            </div>
        </>
    );
});

export { Allowlist };
