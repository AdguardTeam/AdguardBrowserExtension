/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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
    useEffect,
    useRef,
    useCallback,
} from 'react';
import { observer } from 'mobx-react';

import { Range } from 'ace-builds';
import cn from 'classnames';

import { SimpleRegex } from '@adguard/tsurlfilter/es/simple-regex';

import { Editor, EditorLeaveModal } from '../Editor';
import { translator } from '../../../../common/translators/translator';
import { Checkbox } from '../ui/Checkbox';
import { messenger } from '../../../services/messenger';
import {
    NotifierType,
    NEWLINE_CHAR_UNIX,
    NEWLINE_CHAR_REGEX,
} from '../../../../common/constants';
import { getFirstNonDisabledElement } from '../../utils/dom';
import { handleFileUpload } from '../../../helpers';
import { logger } from '../../../../common/logger';
import { exportData, ExportTypes } from '../../utils/export';
import { addMinDelayLoader } from '../helpers';
// TODO: Continue to remove dependency on the root store via adding loader and
// notifications to own 'user-rules-editor' store. AG-48937
import { rootStore } from '../../../options/stores/RootStore';
import { SidebarMenuId } from '../../../options/stores/UiStore';
import { FILE_WRONG_EXTENSION_CAUSE } from '../../constants';
import { usePreventUnload } from '../../hooks/usePreventUnload';
import { NotificationType } from '../../types';
import { SavingFSMState, CURSOR_POSITION_AFTER_INSERT } from '../Editor/savingFSM';
import theme from '../../styles/theme';

import { ToggleWrapButton } from './ToggleWrapButton';
import { ToggleFullscreenButton } from './ToggleFullscreenButton';
import { UserRulesSavingButton } from './UserRulesSavingButton';
import { userRulesEditorStore } from './UserRulesEditorStore';

/**
 * This module is placed in the common directory because it is used in the options page
 * and fullscreen-user-rules page
 */
export const UserRulesEditor = observer(({ fullscreen }) => {
    const store = useContext(userRulesEditorStore);
    const { uiStore, settingsStore } = useContext(rootStore);

    const editorRef = useRef(null);
    const inputRef = useRef(null);
    const actionsRef = useRef(null);

    const switchId = settingsStore.userFilterEnabledSettingId;
    const switchTitleId = `${switchId}-title`;

    let shouldResetSize = false;
    if (store.userRulesEditorPrefsDropped) {
        store.setUserRulesEditorPrefsDropped(false);
        shouldResetSize = true;
    }

    useEffect(() => {
        let removeListenerCallback = () => {};

        (async () => {
            await store.requestSettingsData();

            const events = [
                NotifierType.SettingUpdated,
            ];
            removeListenerCallback = await messenger.createEventListener(
                events,
                async (message) => {
                    const { type } = message;

                    switch (type) {
                        // This event will be triggered when the user rules status is toggled.
                        case NotifierType.SettingUpdated: {
                            await store.requestSettingsData();
                            break;
                        }
                        default: {
                            logger.debug('[ext.UserRulesEditor]: undefined message type:', type);
                            break;
                        }
                    }
                },
            );
        })();

        return () => {
            removeListenerCallback();
        };
    }, [store]);

    // Get initial storage content and set to the editor
    useEffect(() => {
        (async () => {
            let editorContent = await messenger.getEditorStorageContent();
            // clear editor content from storage after reading it
            await messenger.setEditorStorageContent(null);
            let resetInfoThatContentChanged = false;

            if (!editorContent) {
                const { content } = await messenger.getUserRules();
                editorContent = content;
                resetInfoThatContentChanged = true;
            }

            if (editorRef.current) {
                editorRef.current.editor.setValue(editorContent, CURSOR_POSITION_AFTER_INSERT);
                editorRef.current.editor.session.getUndoManager().reset();
            }

            if (resetInfoThatContentChanged) {
                store.setUserRulesEditorContentChangedState(false);
            }

            // initial export button state
            const { userRules } = await messenger.getUserRulesEditorData();
            if (userRules.length > 0) {
                store.setUserRulesExportAvailableState(true);
            } else {
                store.setUserRulesExportAvailableState(false);
            }
        })();
    }, [store]);

    /**
     * One of the reasons for request filter to update
     * may be adding user rules from other places like assistant and others
     *
     * @returns {Promise<void>}
     */
    const handleUserFilterUpdated = useCallback(async () => {
        const { userRules } = await messenger.getUserRulesEditorData();

        if (!store.userRulesEditorContentChanged) {
            if (editorRef.current) {
                editorRef.current.editor.setValue(userRules, CURSOR_POSITION_AFTER_INSERT);

                const cursorPosition = store.getCursorPosition();
                if (cursorPosition) {
                    editorRef.current.editor.moveCursorTo(cursorPosition.row, cursorPosition.column);
                    store.setCursorPosition(null);
                }
            }
            store.setUserRulesEditorContentChangedState(false);
            await messenger.setEditorStorageContent(null);
        }

        // disable or enable export button
        if (userRules.length > 0) {
            store.setUserRulesExportAvailableState(true);
        } else {
            store.setUserRulesExportAvailableState(false);
        }
    }, [store]);

    // Append listeners
    useEffect(() => {
        let removeListenerCallback = () => { };

        (async () => {
            // Subscribe to events of request filter update
            // to have actual user rules in the editor
            const events = [
                NotifierType.UserFilterUpdated,
            ];

            removeListenerCallback = await messenger.createEventListener(
                events,
                async (message) => {
                    const { type } = message;

                    switch (type) {
                        case NotifierType.UserFilterUpdated: {
                            await handleUserFilterUpdated();
                            break;
                        }
                        default: {
                            logger.debug('[ext.UserRulesEditor]: undefined message type:', type);
                            break;
                        }
                    }
                },
            );
        })();

        return () => {
            removeListenerCallback();
        };
    }, [handleUserFilterUpdated]);

    // save editor content to the storage after close of fullscreen
    useEffect(() => {
        if (fullscreen) {
            const beforeUnloadListener = async () => {
                if (store.userRulesEditorContentChanged) {
                    // send content to the storage only before switching editors
                    const content = editorRef.current.editor.session.getValue();
                    await messenger.setEditorStorageContent(content);
                }
            };
            window.addEventListener('beforeunload', beforeUnloadListener);
        }
    }, [store.userRulesEditorContentChanged, fullscreen]);

    // set initial wrap mode
    useEffect(() => {
        editorRef.current.editor.session.setUseWrapMode(store.userRulesEditorWrapState);
    }, [store.userRulesEditorWrapState]);

    const isSaving = store.savingUserRulesState === SavingFSMState.Saving;
    const hasUnsavedChanges = !isSaving && store.userRulesEditorContentChanged;
    const unsavedChangesTitle = translator.getMessage('options_editor_leave_title');
    const unsavedChangesSubtitle = translator.getMessage('options_userfilter_leave_subtitle');
    usePreventUnload(hasUnsavedChanges || isSaving, `${unsavedChangesTitle} ${unsavedChangesSubtitle}`);

    const saveUserRules = async (userRules) => {
        if (isSaving) {
            return;
        }
        store.setCursorPosition(editorRef.current.editor.getCursorPosition());

        // For MV2 version we don't show loader and don't check limits.
        if (!__IS_MV3__) {
            await store.saveUserRules(userRules);
        } else {
            uiStore.setShowLoader(true);
            await store.saveUserRules(userRules);
            await settingsStore.checkLimitations();
            uiStore.setShowLoader(false);
        }
        store.setUserRulesEditorContentChangedState(false);
        store.setCursorPosition(null);
    };

    const inputChangeHandler = async (event) => {
        event.persist();
        const file = event.target.files[0];

        try {
            const rawNewRules = await handleFileUpload(file, 'txt');
            const trimmedNewRules = rawNewRules.trim();

            if (trimmedNewRules.length < 0) {
                return;
            }

            const oldRulesString = editorRef.current.editor.getValue();
            const oldRules = oldRulesString.split(NEWLINE_CHAR_UNIX);

            const newRules = trimmedNewRules.split(NEWLINE_CHAR_REGEX);
            const uniqNewRules = newRules.filter((newRule) => {
                const trimmedNewRule = newRule.trim();
                if (trimmedNewRule.length === 0) {
                    return true;
                }

                const isInOldRules = oldRules.some((oldRule) => oldRule === trimmedNewRule);
                return !isInOldRules;
            });

            const rulesUnion = [...oldRules, ...uniqNewRules];
            const rulesUnionString = rulesUnion.join(NEWLINE_CHAR_UNIX).trim();

            if (oldRulesString !== rulesUnionString) {
                editorRef.current.editor.setValue(rulesUnionString, CURSOR_POSITION_AFTER_INSERT);

                await saveUserRules(rulesUnionString);
            }
        } catch (e) {
            logger.debug('[ext.UserRulesEditor]: import error:', e);
            if (e instanceof Error && e.cause === FILE_WRONG_EXTENSION_CAUSE) {
                uiStore.addNotification({
                    type: NotificationType.Error,
                    text: e.message,
                });
            } else {
                uiStore.addNotification({
                    type: NotificationType.Error,
                    text: translator('options_popup_import_error_file_description'),
                });
            }
        }

        // eslint-disable-next-line no-param-reassign
        event.target.value = '';
    };

    const importClickHandler = (e) => {
        e.preventDefault();

        if (!inputRef.current) {
            return;
        }

        inputRef.current.click();
    };

    const saveClickHandler = async () => {
        if (!store.userRulesEditorContentChanged) {
            return;
        }

        const value = editorRef.current.editor.getValue();
        await saveUserRules(value);
    };

    const editorChangeHandler = async (value) => {
        const { content } = await messenger.getUserRules();
        store.setUserRulesEditorContentChangedState(content !== value);
    };

    const focusFirstEnabledAction = () => {
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

    const shortcuts = [{
        name: 'togglecomment',
        bindKey: { win: 'Ctrl-/', mac: 'Command-/' },
        exec: (editor) => {
            const selection = editor.getSelection();
            const ranges = selection.getAllRanges();

            const rowsSelected = ranges
                .map((range) => {
                    const [start, end] = [range.start.row, range.end.row];
                    return Array.from({ length: end - start + 1 }, (_, idx) => idx + start);
                })
                .flat();

            const allRowsCommented = rowsSelected.every((row) => {
                const rowLine = editor.session.getLine(row);
                return rowLine.trim().startsWith(SimpleRegex.MASK_COMMENT);
            });

            rowsSelected.forEach((row) => {
                const rawLine = editor.session.getLine(row);
                // if all lines start with comment mark we remove it
                if (allRowsCommented) {
                    const lineWithRemovedComment = rawLine.replace(SimpleRegex.MASK_COMMENT, '');
                    editor.session.replace(new Range(row, 0, row), lineWithRemovedComment);
                    // otherwise we add it
                } else {
                    editor.session.insert({ row, column: 0 }, SimpleRegex.MASK_COMMENT);
                }
            });
        },
    }];

    const exportClickHandler = () => {
        exportData(ExportTypes.UserFilter);
    };

    useEffect(() => {
        uiStore.setSidebarMenuOptions([
            {
                id: SidebarMenuId.ImportUserRules,
                title: translator.getMessage('options_userfilter_import'),
                onClick: importClickHandler,
            },
            {
                id: SidebarMenuId.ExportUserRules,
                title: translator.getMessage('options_userfilter_export'),
                onClick: exportClickHandler,
                disabled: !store.userRulesExportAvailable,
            },
        ]);

        return () => uiStore.setSidebarMenuOptions([]);
    }, [store.userRulesExportAvailable, uiStore]);

    // We set wrap mode directly in order to avoid editor re-rendering
    // Otherwise editor would remove all unsaved content
    const toggleWrap = async () => {
        const toggledWrapMode = !store.userRulesEditorWrapState;
        editorRef.current.editor.session.setUseWrapMode(toggledWrapMode);
        await store.toggleUserRulesEditorWrapMode(toggledWrapMode);

        if (__IS_MV3__) {
            await settingsStore.checkLimitations();
        }
    };

    const toggleFullscreen = async () => {
        if (fullscreen) {
            await closeEditorFullscreen();
        } else {
            await openEditorFullscreen();
        }
    };

    const openEditorFullscreen = async () => {
        // send dirty content to the storage only before switching editors
        if (store.userRulesEditorContentChanged) {
            const content = editorRef.current.editor.session.getValue();
            await messenger.setEditorStorageContent(content);
        }

        await messenger.openFullscreenUserRules();
    };

    const closeEditorFullscreen = async () => {
        // send dirty content to the storage only before switching editors
        if (store.userRulesEditorContentChanged) {
            const content = editorRef.current.editor.session.getValue();
            await messenger.setEditorStorageContent(content);
        }

        window.close();
    };

    const updateSettingWithLimitCheck = async (settingId, value) => {
        await settingsStore.updateSetting(settingId, value);
        if (__IS_MV3__) {
            await settingsStore.checkLimitations();
        }
    };

    const handleUserRulesToggle = async ({ id, data }) => {
        await addMinDelayLoader(
            uiStore.setShowLoader,
            updateSettingWithLimitCheck,
        )(id, data);
    };

    return (
        <>
            <Editor
                name="user-rules"
                editorRef={editorRef}
                shortcuts={shortcuts}
                fullscreen={fullscreen}
                shouldResetSize={shouldResetSize}
                onChange={editorChangeHandler}
                onSave={saveClickHandler}
                onExit={focusFirstEnabledAction}
                highlightRules
                readOnly={isSaving}
            />
            {/* We are using UserRulesEditor component in 2 pages: Options and FullscreenUserRules */}
            {/* We are hiding it because only Options page has router, and there is no point of using it */}
            {/* on FullscreenUserRules page, for that we are using `useBlockUnload` hook on top */}
            {!fullscreen && hasUnsavedChanges && (
                <EditorLeaveModal
                    title={unsavedChangesTitle}
                    subtitle={unsavedChangesSubtitle}
                />
            )}
            <div
                ref={actionsRef}
                className={cn('actions actions--grid', {
                    'actions--fullscreen-user-rules': fullscreen,
                    'actions--user-rules': !fullscreen,
                })}
            >
                {
                    fullscreen && (
                        <label
                            className="actions__label"
                            htmlFor={switchId}
                        >
                            <div id={switchTitleId} className="actions__title" aria-hidden="true">
                                {translator.getMessage('fullscreen_user_rules_title')}
                            </div>
                            <div className="actions__control">
                                <Checkbox
                                    id={switchId}
                                    handler={handleUserRulesToggle}
                                    value={store.userFilterEnabled}
                                    className="checkbox__label--actions"
                                    labelId={switchTitleId}
                                />
                            </div>
                        </label>
                    )
                }
                <div className="actions--grid actions--buttons">
                    <UserRulesSavingButton onClick={saveClickHandler} />
                    <input
                        type="file"
                        accept="text/plain"
                        ref={inputRef}
                        onChange={inputChangeHandler}
                        className="actions__input-file"
                    />
                    <button
                        type="button"
                        className={`button button--l button--transparent actions__btn ${theme.common.hideMobile}`}
                        onClick={importClickHandler}
                        title={translator.getMessage('options_userfilter_import')}
                    >
                        {translator.getMessage('options_userfilter_import')}
                    </button>
                    <button
                        type="button"
                        className={`button button--l button--transparent actions__btn ${theme.common.hideMobile}`}
                        onClick={exportClickHandler}
                        disabled={!store.userRulesExportAvailable}
                        title={translator.getMessage('options_userfilter_export')}
                    >
                        {translator.getMessage('options_userfilter_export')}
                    </button>
                </div>
                <div className="actions--grid actions--icons">
                    <ToggleWrapButton onClick={toggleWrap} />
                    <ToggleFullscreenButton fullscreen={fullscreen} onClick={toggleFullscreen} />
                </div>
            </div>
        </>
    );
});
