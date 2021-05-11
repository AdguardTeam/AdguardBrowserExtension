import React, {
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { observer } from 'mobx-react';
import { Range } from 'ace-builds';
import { SimpleRegex } from '@adguard/tsurlfilter/dist/es/simple-regex';

import { Editor } from '../Editor';
import { SettingsSection } from '../Settings/SettingsSection';
import { uploadFile } from '../../../helpers';
import { rootStore } from '../../stores/RootStore';
import { log } from '../../../../common/log';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { UserRulesSavingButton } from './UserRulesSavingButton';
import { usePrevious } from '../../../common/hooks/usePrevious';
import { Icon } from '../../../common/components/ui/Icon';

import './styles.pcss';

const UserRules = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const editorRef = useRef(null);
    const inputRef = useRef(null);
    const prevUserRules = usePrevious(settingsStore.userRules);

    const inputChangeHandler = async (event) => {
        event.persist();
        const file = event.target.files[0];

        try {
            const content = await uploadFile(file, 'txt');
            editorRef.current.editor.setValue(content, 1);
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
        if (settingsStore.userRulesEditorContentChanged) {
            const value = editorRef.current.editor.getValue();
            await settingsStore.saveUserRules(value);
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

    const exportClickHandler = async () => {
        window.open('/pages/export.html#uf', '_blank');
    };

    useEffect(() => {
        (async () => {
            await settingsStore.getUserRules();
        })();
    }, []);

    useEffect(() => {
        if (prevUserRules === '') {
            // reset undo manager, otherwise ctrl+z after initial load removes all content
            editorRef.current.editor.session.getUndoManager().reset();
        }
    }, [settingsStore.userRules]);

    const onChange = () => {
        settingsStore.setUserRulesEditorContentChangedState(true);
    };

    const toggleWrap = () => {
        settingsStore.toggleUserRulesEditorWrap();
    };

    return (
        <>
            <SettingsSection
                title={reactTranslator.getMessage('options_userfilter')}
                description={reactTranslator.getMessage('options_userfilter_description_key', {
                    a: (chunks) => (
                        <a
                            className="desc--link"
                            href="https://adguard.com/forward.html?action=userfilter_description&from=options&app=browser_extension"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {chunks}
                        </a>
                    ),
                })}
            />
            <Editor
                name="user-rules"
                editorRef={editorRef}
                shortcuts={shortcuts}
                onChange={onChange}
                value={settingsStore.userRules}
                wrapEnabled={settingsStore.userRulesEditorWrapState}
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
                        disabled={!settingsStore.userRules}
                    >
                        {reactTranslator.getMessage('options_userfilter_export')}
                    </button>
                </div>
                <div className="actions__group">
                    {/* TODO add onClick */}
                    <button
                        type="button"
                        className="actions__btn actions__btn--icon"
                        onClick={toggleWrap}
                    >
                        <Icon classname="icon--extend" id="#line-break" />
                    </button>
                    {/* TODO add onClick */}
                    <button
                        type="button"
                        className="actions__btn actions__btn--icon"
                    >
                        <Icon classname="icon--extend" id="#extend" />
                    </button>
                </div>
            </div>
        </>
    );
});

export { UserRules };
