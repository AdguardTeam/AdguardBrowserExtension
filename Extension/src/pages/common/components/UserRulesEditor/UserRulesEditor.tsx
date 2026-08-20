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
    type ChangeEvent,
    type MouseEvent,
    type ReactNode,
    useContext,
    useEffect,
    useRef,
    useCallback,
} from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { Editor, EditorLeaveModal } from '../Editor';
import { translator } from '../../../../common/translators/translator';
import { Checkbox } from '../ui/Checkbox';
import { messenger } from '../../../services/messenger';
import {
    TelemetryEventName,
    TelemetryScreenName,
    type TelemetryActionToScreenMap,
} from '../../../../common/telemetry';
import { type Settings, SettingOption } from '../../../../background/schema/settings';
import { NotifierType } from '../../../../common/constants';
import {
    appendRuleSuffix,
    computeRemoveRanges,
    hasUserRules,
    isUserFilterUpdatedEventData,
    mergeImportedRules,
    UserFilterUpdateOperation,
    type UserFilterUpdatedEventData,
} from '../../../../common/utils/user-rules';
import { getFirstNonDisabledElement } from '../../utils/dom';
import { handleFileUpload } from '../../../helpers';
import { logger } from '../../../../common/logger';
import { exportData, ExportTypes } from '../../utils/export';
import { addMinDelayLoader } from '../helpers';
import { FILE_WRONG_EXTENSION_CAUSE } from '../../constants';
import { usePreventUnload } from '../../hooks/usePreventUnload';
import { type NotificationParams, NotificationType } from '../../types';
import { SavingFSMState } from '../Editor/savingFSM';
import { type EditorHandle } from '../Editor/editor-handle';
import { SavingErrorMessage } from '../SavingButton';

import { ToggleWrapButton } from './ToggleWrapButton';
import { ToggleFullscreenButton } from './ToggleFullscreenButton';
import { UserRulesSavingButton } from './UserRulesSavingButton';
import { userRulesEditorStore } from './UserRulesEditorStore';

import theme from '../../styles/theme';

/**
 * Props for the UserRulesEditor component.
 */
type UserRulesEditorProps = {
    /**
     * Whether the editor is in fullscreen mode.
     */
    fullscreen?: boolean;

    /**
     * Callback to toggle the loader overlay.
     */
    setShowLoader: (value: boolean) => void;

    /**
     * Callback to add a notification.
     */
    addNotification: (params: NotificationParams) => void;

    /**
     * Callback to update a boolean setting.
     */
    updateSetting: <T extends SettingOption>(settingId: T, value: Settings[T]) => Promise<void>;

    /**
     * Callback to check MV3 rule limitations.
     */
    checkLimitations: () => Promise<void>;

    /**
     * Callback to send a telemetry event.
     */
    sendTelemetryCustomEvent: (
        eventName: TelemetryEventName,
        screenName: TelemetryActionToScreenMap[TelemetryEventName],
    ) => Promise<void>;

    /**
     * Optional extra icon buttons rendered before the fullscreen toggle.
     */
    extraIcons?: ReactNode;
};

export const UserRulesEditor = observer(({
    fullscreen,
    setShowLoader,
    addNotification,
    updateSetting,
    checkLimitations,
    sendTelemetryCustomEvent,
    extraIcons = null,
}: UserRulesEditorProps) => {
    const store = useContext(userRulesEditorStore);

    const editorRef = useRef<EditorHandle | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const actionsRef = useRef<HTMLDivElement | null>(null);

    const getEditor = (): EditorHandle => {
        if (!editorRef.current) {
            throw new Error('User rules editor is not initialized.');
        }

        return editorRef.current;
    };

    const switchId = store.userFilterEnabledSettingId;
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
            await messenger.setEditorStorageContent('');
            let resetInfoThatContentChanged = false;

            if (!editorContent) {
                const { content } = await messenger.getUserRules();
                editorContent = content;
                resetInfoThatContentChanged = true;
            }

            if (editorRef.current) {
                editorRef.current.setValue(editorContent);

                // Apply a cursor position requested by the list view (Create /
                // Edit) and focus the editor so the user can type immediately.
                const cursorPosition = store.getCursorPosition();
                if (cursorPosition) {
                    editorRef.current.setCursor(cursorPosition);
                    editorRef.current.focus();
                    store.setCursorPosition(null);
                }
            }

            if (resetInfoThatContentChanged) {
                store.setUserRulesEditorContentChangedState(false);
            }

            // initial export button state
            const { userRules } = await messenger.getUserRulesEditorData();
            store.setUserRulesExportAvailableState(hasUserRules(userRules));
        })();
    }, [store]);

    /**
     * One of the reasons for request filter to update
     * may be adding user rules from other places like assistant and others.
     *
     * Granular add/remove events are applied to the buffer as a patch, so
     * unsaved edits are preserved; anything else falls back to a refetch.
     *
     * @param eventData Operation details sent with the event, if any.
     */
    const handleUserFilterUpdated = useCallback(async (eventData?: UserFilterUpdatedEventData) => {
        const editor = editorRef.current;

        if (editor && isUserFilterUpdatedEventData(eventData)) {
            if (eventData.operation === UserFilterUpdateOperation.Add) {
                const value = editor.getValue();
                editor.applyChanges([{
                    from: value.length,
                    to: value.length,
                    insert: appendRuleSuffix(value, eventData.ruleText),
                }]);
            } else {
                editor.applyChanges(computeRemoveRanges(editor.getValue(), eventData.ruleText));
            }
        }

        const { userRules } = await messenger.getUserRulesEditorData();

        if (!store.userRulesEditorContentChanged) {
            if (editor && !isUserFilterUpdatedEventData(eventData)) {
                editor.setValue(userRules);

                const cursorPosition = store.getCursorPosition();
                if (cursorPosition) {
                    editor.setCursor(cursorPosition);
                    store.setCursorPosition(null);
                }
            }
            store.setUserRulesEditorContentChangedState(false);
            await messenger.setEditorStorageContent('');
        } else if (editor) {
            // The patch moved the persisted content — recompute the flag.
            const { content } = await messenger.getUserRules();
            store.setUserRulesEditorContentChangedState(content !== editor.getValue());
        }

        // disable or enable export button
        store.setUserRulesExportAvailableState(hasUserRules(userRules));
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
                    const { type, data } = message;

                    switch (type) {
                        case NotifierType.UserFilterUpdated: {
                            const [rawEventData] = data ?? [];
                            await handleUserFilterUpdated(
                                isUserFilterUpdatedEventData(rawEventData) ? rawEventData : undefined,
                            );
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
                    const content = editorRef.current?.getValue();
                    if (content !== undefined) {
                        await messenger.setEditorStorageContent(content);
                    }
                }
            };
            window.addEventListener('beforeunload', beforeUnloadListener);

            return () => {
                window.removeEventListener('beforeunload', beforeUnloadListener);
            };
        }
        return undefined;
    }, [store.userRulesEditorContentChanged, fullscreen]);

    // set initial wrap mode
    useEffect(() => {
        editorRef.current?.setWrap(Boolean(store.userRulesEditorWrapState));
    }, [store.userRulesEditorWrapState]);

    const isSaving = store.savingUserRulesState === SavingFSMState.Saving;
    const hasUnsavedChanges = !isSaving && store.userRulesEditorContentChanged;
    const unsavedChangesTitle = translator.getMessage('options_editor_leave_title');
    const unsavedChangesSubtitle = translator.getMessage('options_userfilter_leave_subtitle');
    usePreventUnload(hasUnsavedChanges || isSaving, `${unsavedChangesTitle} ${unsavedChangesSubtitle}`);

    /**
     * Saves user rules.
     *
     * @param userRules User rules content.
     */
    const saveUserRules = async (userRules: string): Promise<void> => {
        sendTelemetryCustomEvent(
            TelemetryEventName.UserRulesSaveClick,
            TelemetryScreenName.UserRulesScreen,
        );

        if (isSaving) {
            return;
        }
        store.setCursorPosition(editorRef.current?.getCursor() ?? null);

        setShowLoader(true);
        try {
            await store.saveUserRules(userRules);
            await checkLimitations();
        } finally {
            setShowLoader(false);
        }

        store.setUserRulesEditorContentChangedState(false);
        store.setCursorPosition(null);
    };

    const inputChangeHandler = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
        event.persist();
        const [file] = event.target.files ?? [];

        try {
            if (!file) {
                return;
            }

            const rawNewRules = await handleFileUpload(file, 'txt');

            if (rawNewRules.trim().length === 0) {
                return;
            }

            const oldRulesString = getEditor().getValue();
            const { merged, addedCount } = mergeImportedRules(oldRulesString, rawNewRules);

            if (addedCount > 0 && oldRulesString !== merged) {
                getEditor().setValue(merged);

                await saveUserRules(merged);
            }
        } catch (e) {
            logger.debug('[ext.UserRulesEditor]: import error:', e);
            if (e instanceof Error && e.cause === FILE_WRONG_EXTENSION_CAUSE) {
                addNotification({
                    type: NotificationType.Error,
                    text: e.message,
                });
            } else {
                addNotification({
                    type: NotificationType.Error,
                    text: translator.getMessage('options_popup_import_error_file_description'),
                });
            }
        }

        // eslint-disable-next-line no-param-reassign
        event.target.value = '';
    };

    const importClickHandler = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        sendTelemetryCustomEvent(
            TelemetryEventName.UserRulesImportClick,
            TelemetryScreenName.UserRulesScreen,
        );

        if (!inputRef.current) {
            return;
        }

        inputRef.current.click();
    }, [sendTelemetryCustomEvent]);

    const saveClickHandler = async (): Promise<void> => {
        if (!store.userRulesEditorContentChanged) {
            return;
        }

        const value = getEditor().getValue();
        await saveUserRules(value);
    };

    const editorChangeHandler = async (value: string): Promise<void> => {
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

    const exportClickHandler = () => {
        exportData(ExportTypes.UserFilter);
    };

    // Wrap mode is applied in-place via the `useEffect` above using CM6 compartment
    // reconfiguration, so the editor is not destroyed and unsaved content is preserved.
    const toggleWrap = async () => {
        await store.toggleUserRulesEditorWrapMode();
        await checkLimitations();
    };

    const toggleFullscreen = async () => {
        if (fullscreen) {
            await closeEditorFullscreen();
        } else {
            await openEditorFullscreen();
        }
    };

    const openEditorFullscreen = async (): Promise<void> => {
        sendTelemetryCustomEvent(
            TelemetryEventName.EditorInNewWindowClick,
            TelemetryScreenName.UserRulesScreen,
        );

        // send dirty content to the storage only before switching editors
        if (store.userRulesEditorContentChanged) {
            const content = getEditor().getValue();
            await messenger.setEditorStorageContent(content);
        }

        await messenger.openFullscreenUserRules();
    };

    const closeEditorFullscreen = async (): Promise<void> => {
        // send dirty content to the storage only before switching editors
        if (store.userRulesEditorContentChanged) {
            const content = getEditor().getValue();
            await messenger.setEditorStorageContent(content);
        }

        window.close();
    };

    const updateSettingWithLimitCheck = async (
        settingId: SettingOption.UserFilterEnabled,
        value: boolean,
    ): Promise<void> => {
        await updateSetting(settingId, value);
        await checkLimitations();
    };

    const handleUserRulesToggle = async ({ id, data }: { id: string | number; data: boolean }): Promise<void> => {
        if (id !== SettingOption.UserFilterEnabled) {
            logger.error('[ext.UserRulesEditor]: unsupported setting:', id);
            return;
        }

        sendTelemetryCustomEvent(
            TelemetryEventName.UserRulesSwitchClick,
            TelemetryScreenName.UserRulesScreen,
        );

        await addMinDelayLoader(
            setShowLoader,
            updateSettingWithLimitCheck,
        )(id, data);
    };

    return (
        <>
            <Editor
                name="user-rules"
                editorRef={editorRef}
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
            <SavingErrorMessage savingState={store.savingUserRulesState} />
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
                                    label=""
                                    className="checkbox__label--actions"
                                    labelId={switchTitleId}
                                />
                            </div>
                        </label>
                    )
                }
                <div className="actions--grid actions--buttons">
                    <UserRulesSavingButton onClick={saveClickHandler} />
                    {fullscreen && (
                        <>
                            <input
                                type="file"
                                accept="text/plain"
                                ref={inputRef}
                                onChange={inputChangeHandler}
                                className="actions__input-file"
                            />
                            <button
                                type="button"
                                className={cn(
                                    'button button--l button--transparent actions__btn',
                                    theme.common.hideOnMobile,
                                )}
                                onClick={importClickHandler}
                                title={translator.getMessage('options_userfilter_import')}
                            >
                                {translator.getMessage('options_userfilter_import')}
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    'button button--l',
                                    'button--transparent actions__btn',
                                    theme.common.hideOnMobile,
                                )}
                                onClick={exportClickHandler}
                                disabled={!store.userRulesExportAvailable}
                                title={translator.getMessage('options_userfilter_export')}
                            >
                                {translator.getMessage('options_userfilter_export')}
                            </button>
                        </>
                    )}
                </div>
                <div className="actions--grid actions--icons">
                    <ToggleWrapButton onClick={toggleWrap} />
                    {extraIcons}
                    <ToggleFullscreenButton fullscreen={Boolean(fullscreen)} onClick={toggleFullscreen} />
                </div>
            </div>
        </>
    );
});
