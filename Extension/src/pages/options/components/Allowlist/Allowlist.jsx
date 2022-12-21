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
import { Editor } from '../../../common/components/Editor';
import { rootStore } from '../../stores/RootStore';
import { handleFileUpload } from '../../../helpers';
import { Log } from '../../../../common/log';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { AllowlistSavingButton } from './AllowlistSavingButton';
import { usePrevious } from '../../../common/hooks/usePrevious';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { exportData, ExportTypes } from '../../../common/utils/export';

const Allowlist = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    // rerender allowlist after removed and none-saved domains and import
    // AG-10492
    const [shouldAllowlistRerender, setAllowlistRerender] = useState(false);

    const editorRef = useRef(null);
    const inputRef = useRef(null);
    const prevAllowlist = usePrevious(settingsStore.allowlist);

    useEffect(() => {
        (async () => {
            await settingsStore.getAllowlist();
            setAllowlistRerender(false);
        })();
    }, [settingsStore, shouldAllowlistRerender]);

    useEffect(() => {
        if (prevAllowlist === '') {
            // reset undo manager, otherwise ctrl+z after initial load removes all content
            editorRef.current.editor.session.getUndoManager().reset();
        }
    }, [settingsStore.allowlist, prevAllowlist]);

    const { settings } = settingsStore;

    const { DefaultAllowlistMode } = settings.names;

    const importClickHandler = (e) => {
        e.preventDefault();
        inputRef.current.click();
    };

    const exportClickHandler = () => {
        exportData(ExportTypes.ALLOW_LIST);
    };

    const inputChangeHandler = async (event) => {
        event.persist();
        const file = event.target.files[0];

        try {
            const content = await handleFileUpload(file, 'txt');
            await settingsStore.appendAllowlist(content);
            setAllowlistRerender(true);
        } catch (e) {
            Log.debug(e.message);
            uiStore.addNotification({ description: e.message });
        }

        // eslint-disable-next-line no-param-reassign
        event.target.value = '';
    };

    const saveClickHandler = async () => {
        if (settingsStore.allowlistEditorContentChanged) {
            const value = editorRef.current.editor.getValue();
            await settingsStore.saveAllowlist(value);
        }
    };

    const editorChangeHandler = () => {
        settingsStore.setAllowlistEditorContentChangedState(true);
    };

    const shortcuts = [{
        name: 'save',
        bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
        exec: async () => {
            await saveClickHandler();
        },
    }];

    const allowlistChangeHandler = async (e) => {
        const { id, data } = e;
        await settingsStore.updateSetting(id, data);
    };

    const { AllowlistEnabled } = settings.names;

    let shouldResetSize = false;
    if (settingsStore.allowlistSizeReset) {
        settingsStore.setAllowlistSizeReset(false);
        shouldResetSize = true;
    }

    return (
        <>
            <SettingsSection
                title={reactTranslator.getMessage('options_allowlist')}
                id={AllowlistEnabled}
                mode="smallContainer"
                description={settings.values[DefaultAllowlistMode]
                    ? reactTranslator.getMessage('options_allowlist_desc')
                    : (
                        <div>
                            <span className="setting__alert-desc">
                                {reactTranslator.getMessage('options_allowlist_alert_invert', {
                                    a: (chunks) => (
                                        <Link
                                            className="setting__alert-link"
                                            to="/miscellaneous"
                                        >
                                            {chunks}
                                        </Link>
                                    ),
                                })}
                            </span>
                        </div>
                    )}
                inlineControl={(
                    <Setting
                        id={AllowlistEnabled}
                        type={SETTINGS_TYPES.CHECKBOX}
                        value={settings.values[AllowlistEnabled]}
                        handler={allowlistChangeHandler}
                    />
                )}
            />
            <Editor
                name="allowlist"
                editorRef={editorRef}
                shortcuts={shortcuts}
                onChange={editorChangeHandler}
                value={settingsStore.allowlist}
                wrapEnabled={settingsStore.allowlistEditorWrap}
                shouldResetSize={shouldResetSize}
            />
            <div className="actions actions--divided">
                <div className="actions__group">
                    <AllowlistSavingButton onClick={saveClickHandler} />
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
                        disabled={!settingsStore.allowlist}
                    >
                        {reactTranslator.getMessage('options_userfilter_export')}
                    </button>
                </div>
            </div>
        </>
    );
});

export { Allowlist };
