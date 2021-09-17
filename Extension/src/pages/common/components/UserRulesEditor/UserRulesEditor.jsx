import React, {
    useContext,
    useEffect,
    useRef,
    useCallback,
} from 'react';
import { observer } from 'mobx-react';
import { Range } from 'ace-builds';
import { SimpleRegex } from '@adguard/tsurlfilter/dist/es/simple-regex';
import { RuleConverter } from '@adguard/tsurlfilter';

import { userRulesEditorStore } from './UserRulesEditorStore';
import { Editor } from '../Editor';
import { UserRulesSavingButton } from './UserRulesSavingButton';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { Popover } from '../ui/Popover';
import { Icon } from '../ui/Icon';
import { messenger } from '../../../services/messenger';
import { MESSAGE_TYPES, NOTIFIER_TYPES } from '../../../../common/constants';
import { uploadFile } from '../../../helpers';
import { log } from '../../../../common/log';
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
                MESSAGE_TYPES.GET_USER_RULES_EDITOR_DATA,
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
     * @return {Promise<void>}
     */
    const handleUserFilterUpdated = useCallback(async () => {
        const { userRules } = await messenger.sendMessage(
            MESSAGE_TYPES.GET_USER_RULES_EDITOR_DATA,
        );

        if (!store.userRulesEditorContentChanged) {
            editorRef.current.editor.setValue(userRules, 1);
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
        let removeListenerCallback = () => {};

        (async () => {
            // Subscribe to events of request filter update
            // to have actual user rules in the editor
            const events = [
                NOTIFIER_TYPES.USER_FILTER_UPDATED,
            ];

            removeListenerCallback = await messenger.createEventListener(
                events,
                async (message) => {
                    const { type } = message;

                    switch (type) {
                        case NOTIFIER_TYPES.USER_FILTER_UPDATED: {
                            await handleUserFilterUpdated();
                            break;
                        }
                        default: {
                            log.debug('Undefined message type:', type);
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
    }, [store]);

    const inputChangeHandler = async (event) => {
        event.persist();
        const file = event.target.files[0];

        try {
            const rawNewRules = await uploadFile(file, 'txt');
            // convert rules before merging. AG-9862
            const newRules = RuleConverter.convertRules(rawNewRules);
            const oldRules = editorRef.current.editor.getValue();
            const unionRules = `${oldRules}\n${newRules}`.split('\n');
            const uniqRules = Array.from(new Set(unionRules)).join('\n');
            editorRef.current.editor.setValue(uniqRules, 1);
            await store.saveUserRules(uniqRules);
        } catch (e) {
            log.debug(e.message);
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
        const toggledWrapMode = !editorRef.current.editor.session.getUseWrapMode();
        editorRef.current.editor.session.setUseWrapMode(toggledWrapMode);
        store.setUserRulesEditorWrapMode(toggledWrapMode);
    };

    const openEditorFullscreen = async () => {
        // send dirty content to the storage only before switching editors
        if (store.userRulesEditorContentChanged) {
            const content = editorRef.current.editor.session.getValue();
            await messenger.setEditorStorageContent(content);
        }

        await messenger.sendMessage(MESSAGE_TYPES.OPEN_FULLSCREEN_USER_RULES);
    };

    const closeEditorFullscreen = async () => {
        // send dirty content to the storage only before switching editors
        if (store.userRulesEditorContentChanged) {
            const content = editorRef.current.editor.session.getValue();
            await messenger.setEditorStorageContent(content);
        }

        window.close();
    };

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
                highlightRules
            />
            <div className="actions actions--divided">
                <div className="actions__group">
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
                                    className="actions__btn actions__btn--icon"
                                    onClick={closeEditorFullscreen}
                                >
                                    <Icon classname="icon--extend" id="#reduce" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="actions__btn actions__btn--icon"
                                    onClick={openEditorFullscreen}
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
