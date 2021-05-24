import React, { useContext, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';

import { SettingsSection } from '../Settings/SettingsSection';
import { Editor } from '../Editor';
import { rootStore } from '../../stores/RootStore';
import { uploadFile } from '../../../helpers';
import { log } from '../../../../common/log';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { AllowlistSavingButton } from './AllowlistSavingButton';
import { usePrevious } from '../../../common/hooks/usePrevious';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';

const Allowlist = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const editorRef = useRef(null);
    const inputRef = useRef(null);
    const prevAllowlist = usePrevious(settingsStore.allowlist);

    useEffect(() => {
        (async () => {
            await settingsStore.getAllowlist();
        })();
    }, []);

    useEffect(() => {
        if (prevAllowlist === '') {
            // reset undo manager, otherwise ctrl+z after initial load removes all content
            editorRef.current.editor.session.getUndoManager().reset();
        }
    }, [settingsStore.allowlist]);

    const { settings } = settingsStore;

    const { DEFAULT_ALLOWLIST_MODE } = settings.names;

    const importClickHandler = (e) => {
        e.preventDefault();
        inputRef.current.click();
    };

    const exportClickHandler = async () => {
        window.open('/pages/export.html#wl', '_blank');
    };

    const inputChangeHandler = async (event) => {
        event.persist();
        const file = event.target.files[0];

        try {
            const content = await uploadFile(file, 'txt');
            await settingsStore.appendAllowlist(content);
        } catch (e) {
            log.debug(e.message);
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

    const { ALLOWLIST_ENABLED } = settings.names;

    return (
        <>
            <SettingsSection
                title={reactTranslator.getMessage('options_allowlist')}
                inlineControl={(
                    <Setting
                        id={ALLOWLIST_ENABLED}
                        type={SETTINGS_TYPES.CHECKBOX}
                        value={settings.values[ALLOWLIST_ENABLED]}
                        handler={allowlistChangeHandler}
                    />
                )}
            >
                {!settings.values[DEFAULT_ALLOWLIST_MODE] && (
                    <div className="setting__alert">
                        <span className="setting__alert-desc">
                            {reactTranslator.getMessage('options_allowlist_alert_invert')}
                        </span>
                        &nbsp;
                        <Link className="setting__alert-link" to="/miscellaneous">
                            {reactTranslator.getMessage('options_allowlist_disable')}
                        </Link>
                    </div>
                )}
            </SettingsSection>
            <Editor
                name="allowlist"
                editorRef={editorRef}
                shortcuts={shortcuts}
                onChange={editorChangeHandler}
                value={settingsStore.allowlist}
                wrapEnabled={settingsStore.allowlistEditorWrap}
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
