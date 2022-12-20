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
    useCallback,
} from 'react';
import { observer } from 'mobx-react';
import { Range } from 'ace-builds';
import debounce from 'lodash/debounce';
import { SimpleRegex } from '@adguard/tsurlfilter';

import { userRulesEditorStore } from './UserRulesEditorStore';
import { Editor } from '../Editor';
import { UserRulesSavingButton } from './UserRulesSavingButton';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { Popover } from '../ui/Popover';
import { Checkbox } from '../ui/Checkbox';
import { Icon } from '../ui/Icon';
import { messenger } from '../../../services/messenger';
import { MessageType } from '../../../../common/messages';
import { NotifierType } from '../../../../common/constants';
import { HANDLER_DELAY_MS } from '../../constants';
import { handleFileUpload } from '../../../helpers';
import { Log } from '../../../../common/log';
import { ToggleWrapButton } from './ToggleWrapButton';
import { exportData, ExportTypes } from '../../utils/export';

/**
 * This module is placed in the common directory because it is used in the options page
 * and fullscreen-user-rules page
 */
export const UserRulesEditor = observer(({ fullscreen, uiStore }) => {
    const store = useContext(userRulesEditorStore);

    const editorRef = useRef(null);
    const inputRef = useRef(null);

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
                        case NotifierType.SettingUpdated: {
                            await store.requestSettingsData();
                            break;
                        }
                        default: {
                            Log.debug('Undefined message type:', type);
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

            editorRef.current.editor.setValue(editorContent, 1);
            editorRef.current.editor.session.getUndoManager().reset();
            if (resetInfoThatContentChanged) {
                store.setUserRulesEditorContentChangedState(false);
            }

            // initial export button state
            const { userRules } = await messenger.sendMessage(
                MessageType.GetUserRulesEditorData,
            );
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
        const { userRules } = await messenger.sendMessage(
            MessageType.GetUserRulesEditorData,
        );

        if (!store.userRulesEditorContentChanged) {
            if (editorRef.current) {
                editorRef.current.editor.setValue(userRules, 1);
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
                NotifierType.userFilterUpdated,
            ];

            removeListenerCallback = await messenger.createEventListener(
                events,
                async (message) => {
                    const { type } = message;

                    switch (type) {
                        case NotifierType.userFilterUpdated: {
                            await handleUserFilterUpdated();
                            break;
                        }
                        default: {
                            Log.debug('Undefined message type:', type);
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

    // subscribe to editor changes, to update editor storage content
    useEffect(() => {
        const changeHandler = () => {
            store.setUserRulesEditorContentChangedState(true);
        };

        editorRef.current.editor.session.on('change', changeHandler);
    }, [store]);

    // set initial wrap mode
    useEffect(() => {
        editorRef.current.editor.session.setUseWrapMode(store.userRulesEditorWrapState);
    }, [store.userRulesEditorWrapState]);

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
            const oldRules = oldRulesString.split('\n');
            const newRules = trimmedNewRules.split('\n');
            const uniqNewRules = newRules.filter((newRule) => {
                const trimmedNewRule = newRule.trim();
                if (trimmedNewRule.length === 0) {
                    return true;
                }

                const isInOldRules = oldRules.some((oldRule) => oldRule === trimmedNewRule);
                return !isInOldRules;
            });

            const rulesUnion = [...oldRules, ...uniqNewRules];
            const rulesUnionString = rulesUnion.join('\n').trim();

            if (oldRulesString !== rulesUnionString) {
                editorRef.current.editor.setValue(rulesUnionString, 1);
                await store.saveUserRules(rulesUnionString);
            }
        } catch (e) {
            Log.debug(e.message);
            if (uiStore?.addNotification) {
                uiStore.addNotification({ description: e.message });
            }
        }

        // eslint-disable-next-line no-param-reassign
        event.target.value = '';
    };

    const importClickHandler = (e) => {
        e.preventDefault();
        inputRef.current.click();
    };

    const saveClickHandler = async () => {
        if (store.userRulesEditorContentChanged) {
            const value = editorRef.current.editor.getValue();
            await store.saveUserRules(value);
        }
    };

    const shortcuts = [
        {
            name: 'save',
            bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
            exec: saveClickHandler,
        },
        {
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
        },
    ];

    const exportClickHandler = () => {
        exportData(ExportTypes.USER_FILTER);
    };

    // We set wrap mode directly in order to avoid editor re-rendering
    // Otherwise editor would remove all unsaved content
    const toggleWrap = () => {
        const toggledWrapMode = !store.userRulesEditorWrapState;
        editorRef.current.editor.session.setUseWrapMode(toggledWrapMode);
        store.toggleUserRulesEditorWrapMode(toggledWrapMode);
    };

    const openEditorFullscreen = async () => {
        // send dirty content to the storage only before switching editors
        if (store.userRulesEditorContentChanged) {
            const content = editorRef.current.editor.session.getValue();
            await messenger.setEditorStorageContent(content);
        }

        await messenger.sendMessage(MessageType.OpenFullscreenUserRules);
    };

    const closeEditorFullscreen = async () => {
        // send dirty content to the storage only before switching editors
        if (store.userRulesEditorContentChanged) {
            const content = editorRef.current.editor.session.getValue();
            await messenger.setEditorStorageContent(content);
        }

        window.close();
    };

    const handleUserRulesToggle = debounce((e) => {
        store.updateSetting(e.id, e.data);
    }, HANDLER_DELAY_MS);

    const fullscreenTooltipText = fullscreen
        ? reactTranslator.getMessage('options_editor_close_fullscreen_button_tooltip')
        : reactTranslator.getMessage('options_editor_open_fullscreen_button_tooltip');

    return (
        <>
            <Editor
                name="user-rules"
                editorRef={editorRef}
                shortcuts={shortcuts}
                fullscreen={fullscreen}
                shouldResetSize={shouldResetSize}
                highlightRules
            />
            <div className="actions actions--divided">
                <div className="actions__group">
                    {
                        fullscreen && (
                            <label
                                className="actions__label"
                                htmlFor="user-filter-enabled"
                            >
                                <div className="actions__title">
                                    {reactTranslator.getMessage('fullscreen_user_rules_title')}
                                </div>
                                <Checkbox
                                    id="user-filter-enabled"
                                    handler={handleUserRulesToggle}
                                    value={store.userFilterEnabled}
                                    className="checkbox__label--actions"
                                />
                            </label>
                        )
                    }
                    <UserRulesSavingButton onClick={saveClickHandler} />
                    <input
                        type="file"
                        id="inputEl"
                        accept="text/plain"
                        ref={inputRef}
                        onChange={inputChangeHandler}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        className="button button--m button--transparent actions__btn"
                        onClick={importClickHandler}
                    >
                        {reactTranslator.getMessage('options_userfilter_import')}
                    </button>
                    <button
                        type="button"
                        className="button button--m button--transparent actions__btn"
                        onClick={exportClickHandler}
                        disabled={!store.userRulesExportAvailable}
                    >
                        {reactTranslator.getMessage('options_userfilter_export')}
                    </button>
                </div>
                <div className="actions__group">
                    <ToggleWrapButton onClick={toggleWrap} />
                    <Popover text={fullscreenTooltipText}>
                        {
                            fullscreen ? (
                                <button
                                    type="button"
                                    className="button actions__btn actions__btn--icon"
                                    onClick={closeEditorFullscreen}
                                    aria-label={reactTranslator.getMessage('options_editor_close_fullscreen_button_tooltip')}
                                >
                                    <Icon classname="icon--extend" id="#reduce" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="button actions__btn actions__btn--icon"
                                    onClick={openEditorFullscreen}
                                    aria-label={reactTranslator.getMessage('options_editor_open_fullscreen_button_tooltip')}
                                >
                                    <Icon classname="icon--extend" id="#extend" />
                                </button>
                            )
                        }
                    </Popover>
                </div>
            </div>
        </>
    );
});
