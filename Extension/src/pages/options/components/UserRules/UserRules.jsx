import React, { useContext, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { rootStore } from '../../stores/RootStore';
import { Editor } from '../Editor';
import { uploadFile } from '../../../helpers';
import { log } from '../../../../background/utils/log';

// FIXME update editor when user rules are added to the editor outside of editor
// TODO add shortcut for comments
const UserRules = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const editorRef = useRef(null);
    const inputRef = useRef(null);

    const inputChangeHandler = async (event) => {
        event.persist();
        const file = event.target.files[0];

        try {
            const content = await uploadFile(file, 'txt');
            editorRef.current.editor.setValue(content);
            await settingsStore.saveUserRules(content);
        } catch (e) {
            log.debug(e.message);
            uiStore.addNotification({ description: e.message });
        }

        // eslint-disable-next-line no-param-reassign
        event.target.value = '';
    };

    const importClickHandler = (e) => {
        e.preventDefault();
        inputRef.current.click();
    };

    const saveClickHandler = async () => {
        const value = editorRef.current.editor.getValue();
        await settingsStore.saveUserRules(value);
    };

    const shortcuts = [{
        name: 'save',
        bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
        exec: async () => {
            await saveClickHandler();
        },
    }];

    const exportClickHandler = async () => {
        window.open('/pages/export.html#uf', '_blank');
    };

    useEffect(() => {
        (async () => {
            await settingsStore.getUserRules();
        })();
    }, []);

    return (
        <>
            {/* TODO fix translations */}
            <h2 className="title">User rules</h2>
            <div className="desc">
                You can add your own rules here. This option is recommended for advanced users familiar
                with HTML/CSS. Read the
                {' '}
                <a
                    className="desc--link"
                    href="https://adguard.com/forward.html?action=userfilter_description&from=options&app=browser_extension"
                >
                    filter
                    rules tutorial
                </a>
                {' '}
                to learn how to write your own filter rules.
            </div>
            <Editor
                name="user-rules"
                value={settingsStore.userRules}
                editorRef={editorRef}
                shortcuts={shortcuts}
            />
            <div className="actions">
                <div>
                    <input
                        type="file"
                        id="inputEl"
                        ref={inputRef}
                        onChange={inputChangeHandler}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        className="button button--m button--green actions__btn"
                        onClick={importClickHandler}
                    >
                        Import
                    </button>
                </div>
                <button
                    type="button"
                    className="button button--m button--green-bd actions__btn"
                    onClick={exportClickHandler}
                >
                    Export
                </button>
                <button
                    type="button"
                    className="button button--m button--green actions__btn"
                    onClick={saveClickHandler}
                >
                    Save
                </button>
            </div>
        </>
    );
});

export { UserRules };
