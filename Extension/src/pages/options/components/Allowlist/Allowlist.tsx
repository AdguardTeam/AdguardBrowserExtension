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
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';

import { useTelemetryPageViewEvent } from '../../../common/telemetry';
import { TelemetryEventName, TelemetryScreenName } from '../../../../common/telemetry';
import { SettingsSection } from '../Settings/SettingsSection';
import { addMinDelayLoader } from '../../../common/components/helpers';
import { Editor, EditorLeaveModal } from '../../../common/components/Editor';
import { FILE_WRONG_EXTENSION_CAUSE } from '../../../common/constants';
import { NotificationType } from '../../../common/types';
import { rootStore } from '../../stores/RootStore';
import { handleFileUpload } from '../../../helpers';
import { logger } from '../../../../common/logger';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { translator } from '../../../../common/translators/translator';
import { OptionsPageSections } from '../../../../common/nav';
import { exportData, ExportTypes } from '../../../common/utils/export';
import { getFirstNonDisabledElement } from '../../../common/utils/dom';
import { normalizeAllowlistEntry, validateAllowlistEntries } from '../../../../common/utils/allowlist-domains';
import { DynamicRulesLimitsWarning, ClipboardPermissionWarning } from '../Warnings';
import { SavingFSMState } from '../../../common/components/Editor/savingFSM';
import {
    type EditorCursor,
    type EditorHandle,
    type EditorSelectionState,
} from '../../../common/components/Editor/editor-handle';
import { SavingErrorMessage } from '../../../common/components/SavingButton';
import { usePreventUnload } from '../../../common/hooks/usePreventUnload';
import { UserAgent } from '../../../../common/user-agent';
import { Icon } from '../../../common/components/ui/Icon';

import { AllowlistMenu } from './AllowlistMenu';
import { AllowlistSavingButton } from './AllowlistSavingButton';
import { AllowlistSwitcher } from './AllowlistSwitcher';

/**
 * Maps a character position from an old line to a new line.
 *
 * When normalization removes a prefix, the position is shifted by the offset
 * of the new line in the old line. If the new line is not found, the position
 * moves to the end of the new line.
 *
 * @param ch Character offset in the old line.
 * @param oldLine Old line content.
 * @param newLine New line content.
 *
 * @returns Character offset in the new line.
 */
const mapCh = (ch: number, oldLine: string, newLine: string): number => {
    if (oldLine === newLine) {
        return Math.min(Math.max(ch, 0), newLine.length);
    }

    const offset = oldLine.toLowerCase().indexOf(newLine.toLowerCase());

    if (offset === -1) {
        return newLine.length;
    }

    return Math.min(Math.max(ch - offset, 0), newLine.length);
};

/**
 * Maps each old line to its normalized line in the fetched content. Blank and
 * duplicate lines map to `null`. Invalid lines also map to `null`; a
 * successful save rejects them, so this is a defensive case.
 *
 * @param oldLines Old document lines.
 * @param newLines Fetched document lines.
 *
 * @returns Index of the fetched line for each old line, or `null`.
 */
const getNewLineIndexes = (oldLines: string[], newLines: string[]): Array<number | null> => {
    const fetchedIndexes = new Map<string, number>();

    newLines.forEach((line, index) => {
        if (!fetchedIndexes.has(line)) {
            fetchedIndexes.set(line, index);
        }
    });

    const seen = new Set<string>();
    const indexes: Array<number | null> = [];

    for (const line of oldLines) {
        const normalized = normalizeAllowlistEntry(line);

        if (normalized === null || normalized.length === 0 || seen.has(normalized)) {
            indexes.push(null);
            continue;
        }

        seen.add(normalized);

        // The fetched list is not guaranteed to be normalized: the settings
        // import keeps entries as they are, and a stored `www.example.com`
        // normalizes to `example.com` on the next pass. The raw line covers
        // those cases, so the caret stays on the entry.
        indexes.push(fetchedIndexes.get(line) ?? fetchedIndexes.get(normalized) ?? null);
    }

    return indexes;
};

/**
 * Maps a cursor from old content to new content.
 *
 * Normalization works line by line: it changes domains inside lines and drops
 * blank and duplicate lines. Invalid lines are also treated as dropped
 * defensively; a successful save rejects them before storing. The cursor is
 * mapped to the matching fetched line, and its character position is shifted
 * by removed prefixes. When lines are dropped, the cursor moves to the
 * corresponding remaining line. A cursor after the last saved line moves to
 * the document end.
 *
 * @param cursor Cursor in the old content.
 * @param oldLines Old document lines.
 * @param newLines New document lines.
 * @param newLineIndexes Fetched line index for each old line.
 *
 * @returns Cursor in the new content.
 */
const mapCursor = (
    cursor: EditorCursor,
    oldLines: string[],
    newLines: string[],
    newLineIndexes: Array<number | null>,
): EditorCursor => {
    const oldLineIndex = Math.min(Math.max(cursor.line, 1), oldLines.length) - 1;
    const newLineIndex = newLineIndexes[oldLineIndex] ?? null;

    if (newLineIndex !== null && newLineIndex < newLines.length) {
        const oldLine = oldLines[oldLineIndex] ?? '';
        const newLine = newLines[newLineIndex] ?? '';

        return {
            line: newLineIndex + 1,
            ch: mapCh(cursor.ch, oldLine, newLine),
        };
    }

    let nextLineIndex: number | null = null;

    for (let index = oldLineIndex + 1; index < newLineIndexes.length; index += 1) {
        const targetIndex = newLineIndexes[index];

        if (targetIndex !== null && targetIndex !== undefined && targetIndex < newLines.length) {
            nextLineIndex = targetIndex;
            break;
        }
    }

    if (nextLineIndex !== null) {
        return { line: nextLineIndex + 1, ch: 0 };
    }

    const lastLineIndex = newLines.length - 1;

    return {
        line: newLines.length,
        ch: newLines[lastLineIndex]?.length ?? 0,
    };
};

/**
 * Maps a selection from old content to new content line by line.
 *
 * @param selection Selection in the old content.
 * @param oldContent Old document content.
 * @param newContent New document content.
 *
 * @returns Selection for the new content.
 */
const mapSelection = (
    selection: EditorSelectionState,
    oldContent: string,
    newContent: string,
): EditorSelectionState => {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const newLineIndexes = getNewLineIndexes(oldLines, newLines);

    return {
        ranges: selection.ranges.map(({ anchor, head }) => ({
            anchor: mapCursor(anchor, oldLines, newLines, newLineIndexes),
            head: mapCursor(head, oldLines, newLines, newLineIndexes),
        })),
        mainIndex: selection.mainIndex,
    };
};

const Allowlist = observer(() => {
    const { settingsStore, uiStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(telemetryStore, TelemetryScreenName.WebsiteAllowListScreen);

    // rerender allowlist after removed and none-saved domains and import
    // AG-10492
    const [shouldAllowlistRerender, setAllowlistRerender] = useState(false);

    const editorRef = useRef<EditorHandle | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const actionsRef = useRef<HTMLDivElement>(null);
    // The first load seeds the editor through `resetValue`, which keeps the
    // seed out of the undo history. Later content syncs (external changes and
    // imports) must stay undoable and use `setValue` instead.
    const hasSeededEditorRef = useRef(false);
    // Prevents the sync effect below from seeding the editor with the store's
    // initial value before `getAllowlist()` resolves: that would make the first
    // load look up to date and skip the non-undoable `resetValue`.
    const initialLoadFinishedRef = useRef(false);

    const importClickHandler = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        telemetryStore.sendCustomEvent(
            TelemetryEventName.AllowlistImportClick,
            TelemetryScreenName.WebsiteAllowListScreen,
        );

        if (!inputRef.current) {
            return;
        }

        inputRef.current.click();
    }, [telemetryStore]);

    const exportClickHandler = () => {
        exportData(ExportTypes.Allowlist);
    };

    /**
     * Replaces the editor content with the given allowlist and restores the
     * selection.
     *
     * The background normalizes the allowlist on saving, so the content fetched
     * after a save can differ from the text the user has typed. {@link EditorHandle.setValue}
     * moves the caret to the end of the document, so the selection is remembered
     * before the replacement and restored afterwards. The selection is mapped
     * line by line, and character positions are shifted by removed prefixes, so
     * the caret stays on the same text. Dropped trailing lines do not move it to
     * the document start. An empty editor keeps the caret at the end after the
     * initial load.
     *
     * @param allowlist Allowlist content to set.
     */
    const setEditorValue = useCallback((allowlist: string) => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }

        const currentValue = editor.getValue();
        if (currentValue === allowlist) {
            return;
        }

        const selection = currentValue.length > 0
            ? mapSelection(editor.getSelection(), currentValue, allowlist)
            : null;

        editor.setValue(allowlist);

        if (selection) {
            editor.setSelection(selection);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            await settingsStore.getAllowlist();
            if (cancelled) {
                return;
            }

            setAllowlistRerender(false);

            if (editorRef.current) {
                if (!hasSeededEditorRef.current && editorRef.current.getValue().length === 0) {
                    // The allowlist is loaded after mount, so the `initialValue`
                    // prop cannot be used. Seed an empty editor through
                    // `resetValue` instead of `setValue`: a plain replacement
                    // would let Ctrl/Cmd+Z right after opening clear the whole
                    // list (and Ctrl+S then save it empty).
                    if (settingsStore.allowlist.length > 0) {
                        editorRef.current.resetValue(settingsStore.allowlist);
                    }
                } else {
                    // The editor already has content (e.g. the user started
                    // typing before the fetch resolved, or a later reload after
                    // an import). Sync it through `setEditorValue`: the change
                    // stays undoable, the selection is preserved and the old
                    // undo entries do not point at text that is no longer shown.
                    setEditorValue(settingsStore.allowlist);
                }
            }

            hasSeededEditorRef.current = true;
            initialLoadFinishedRef.current = true;
            settingsStore.setAllowlistEditorContentChangedState(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [settingsStore, shouldAllowlistRerender, setEditorValue]);

    /**
     * One of the reasons for allowlist to update may be
     * adding domains from other places like popup, etc.
     */
    useEffect(() => {
        // The initial load is seeded by the effect above; this effect only
        // mirrors changes made after it (another tab, the popup, an import).
        if (!initialLoadFinishedRef.current || settingsStore.allowlistEditorContentChanged) {
            return;
        }

        if (editorRef.current) {
            setEditorValue(settingsStore.allowlist);
        }
        settingsStore.setAllowlistEditorContentChangedState(false);
    }, [settingsStore.allowlist, settingsStore, setEditorValue]);

    const isSaving = settingsStore.savingAllowlistState === SavingFSMState.Saving;
    const hasUnsavedChanges = !isSaving && settingsStore.allowlistEditorContentChanged;
    const unsavedChangesTitle = translator.getMessage('options_editor_leave_title');
    const unsavedChangesSubtitle = translator.getMessage('options_allowlist_leave_subtitle');
    usePreventUnload(hasUnsavedChanges || isSaving, `${unsavedChangesTitle} ${unsavedChangesSubtitle}`);

    const { settings } = settingsStore;

    if (!settings) {
        return null;
    }

    const { AllowlistEnabled, DefaultAllowlistMode } = settings.names;

    const switchId = AllowlistEnabled;
    const switchTitleId = `${switchId}-title`;

    const saveAllowlist = async (allowlist: string) => {
        if (!__IS_MV3__) {
            await settingsStore.saveAllowlist(allowlist);
        } else {
            uiStore.setShowLoader(true);
            await settingsStore.saveAllowlist(allowlist);
            await settingsStore.checkLimitations();
            uiStore.setShowLoader(false);
        }
    };

    const inputChangeHandler = async (event: ChangeEvent<HTMLInputElement>) => {
        event.persist();
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const content = await handleFileUpload(file, 'txt');
            const combined = settingsStore.allowlist.concat('\n', content);

            const { valid, invalidEntries } = validateAllowlistEntries(combined);

            if (!valid) {
                uiStore.addNotification({
                    type: NotificationType.Error,
                    text: translator.getMessage(
                        'options_allowlist_invalid_entries',
                        { entries: invalidEntries.join(', ') },
                    ),
                });
                return;
            }

            await saveAllowlist(combined);
            setAllowlistRerender(true);
        } catch (e) {
            logger.debug('[ext.Allowlist]: error:', e);
            if (e instanceof Error && e.cause === FILE_WRONG_EXTENSION_CAUSE) {
                uiStore.addNotification({
                    type: NotificationType.Error,
                    text: e.message,
                });
            } else {
                uiStore.addNotification({
                    type: NotificationType.Error,
                    text: translator.getMessage('options_popup_import_error_file_description'),
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

    /**
     * Handles save button click.
     */
    const saveClickHandler = async () => {
        telemetryStore.sendCustomEvent(
            TelemetryEventName.AllowlistSaveClick,
            TelemetryScreenName.WebsiteAllowListScreen,
        );

        if (settingsStore.allowlistEditorContentChanged && editorRef.current) {
            const value = editorRef.current.getValue();

            const { valid, invalidEntries } = validateAllowlistEntries(value);

            if (!valid) {
                uiStore.addNotification({
                    type: NotificationType.Error,
                    text: translator.getMessage(
                        'options_allowlist_invalid_entries',
                        { entries: invalidEntries.join(', ') },
                    ),
                });
                return;
            }

            await saveAllowlist(value);
            setAllowlistRerender(true);
        }
    };

    const editorChangeHandler = (value: string) => {
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
                title={translator.getMessage('options_allowlist')}
                description={settings.values[DefaultAllowlistMode]
                    ? translator.getMessage('options_allowlist_desc')
                    : (
                        <div>
                            <span className="setting__alert-desc">
                                {translator.getMessage('options_allowlist_alert_invert')}
                                <br />
                                {reactTranslator.getMessage('options_allowlist_alert_invert_stop', {
                                    a: (chunks: string) => (
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
                actions={(
                    <AllowlistMenu
                        onImportClick={importClickHandler}
                        onExportClick={exportClickHandler}
                        exportDisabled={!settingsStore.allowlist}
                    />
                )}
            />
            <SettingsSection
                id={switchId}
                titleId={switchTitleId}
                titleIcon={(<Icon id="#user-rules" className="icon--24" aria-hidden="true" />)}
                title={translator.getMessage('options_allowlist')}
                mode="smallContainer"
                className="settings__group--editor-switch"
                inlineControl={(<AllowlistSwitcher labelId={switchTitleId} />)}
            />
            <DynamicRulesLimitsWarning />
            {UserAgent.isFirefoxMobile && <ClipboardPermissionWarning />}
            <Editor
                name="allowlist"
                editorRef={editorRef}
                onChange={editorChangeHandler}
                wrapEnabled={settingsStore.allowlistEditorWrap ?? false}
                shouldResetSize={shouldResetSize}
                onSave={saveClickHandler}
                onExit={focusFirstEnabledButton}
                readOnly={isSaving}
            />
            {hasUnsavedChanges && (
                <EditorLeaveModal
                    title={unsavedChangesTitle}
                    subtitle={unsavedChangesSubtitle}
                />
            )}
            <SavingErrorMessage savingState={settingsStore.savingAllowlistState} />
            <div
                ref={actionsRef}
                className="actions actions--grid actions--buttons"
            >
                <AllowlistSavingButton onClick={saveClickHandler} />
                <input
                    type="file"
                    accept="text/plain"
                    ref={inputRef}
                    onChange={inputChangeHandlerWrapper}
                    className="actions__input-file"
                />
            </div>
        </>
    );
});

export { Allowlist };
