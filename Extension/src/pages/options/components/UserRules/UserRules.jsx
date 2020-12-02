import React, { useContext, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import { Range } from 'ace-builds';

import { rootStore } from '../../stores/RootStore';
import { Editor } from '../Editor';
import { uploadFile } from '../../../helpers';
import { log } from '../../../../background/utils/log';
import { STATES as SAVING_STATES } from '../Editor/savingFSM';
import { reactTranslator } from '../../../reactCommon/reactTranslator';
import { SettingsSection } from '../Settings/SettingsSection';

import './styles.pcss';

const UserRules = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const editorRef = useRef(null);
    const inputRef = useRef(null);

    const { savingRulesState } = settingsStore;

    const renderSavingState = () => {
        const indicatorTextMap = {
            [SAVING_STATES.IDLE]: '',
            [SAVING_STATES.SAVED]: reactTranslator.translate('options_editor_indicator_saved'),
            [SAVING_STATES.SAVING]: reactTranslator.translate('options_editor_indicator_saving'),
        };

        const indicatorText = indicatorTextMap[savingRulesState];

        if (savingRulesState === SAVING_STATES.IDLE) {
            return null;
        }

        const indicatorClassnames = classnames('editor__label', {
            'editor__label--saved': savingRulesState === SAVING_STATES.SAVED,
        });

        return (
            <div className={indicatorClassnames}>
                {indicatorText}
            </div>
        );
    };

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

    const shortcuts = [
        {
            name: 'save',
            bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
            exec: async () => {
                await saveClickHandler();
            },
        },
        {
            name: 'togglecomment',
            bindKey: { win: 'Ctrl-/', mac: 'Command-/' },
            exec: (editor) => {
                // TODO get this mark from TSUrlFilter
                const COMMENT_MARK = '!';

                const selection = editor.getSelection();
                const ranges = selection.getAllRanges();

                const rowsToToggle = ranges
                    .map((range) => {
                        const [start, end] = [range.start.row, range.end.row];
                        return Array.from({ length: end - start + 1 }, (_, idx) => idx + start);
                    })
                    .flat();

                rowsToToggle.forEach((row) => {
                    const rawLine = editor.session.getLine(row);
                    // if line starts with comment mark we remove it
                    if (rawLine.trim().startsWith(COMMENT_MARK)) {
                        const lineWithRemovedComment = rawLine.replace(COMMENT_MARK, '');
                        editor.session.replace(new Range(row, 0, row), lineWithRemovedComment);
                    // otherwise we add it
                    } else {
                        editor.session.insert({ row, column: 0 }, COMMENT_MARK);
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

    return (
        <>
            <SettingsSection
                title={reactTranslator.translate('options_userfilter')}
                description={reactTranslator.translate('options_userfilter_description', {
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
                value={settingsStore.userRules}
                editorRef={editorRef}
                shortcuts={shortcuts}
            />
            <div className="actions actions--divided">
                <div className="actions__group">
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
                        {reactTranslator.translate('options_userfilter_import')}
                    </button>
                    <button
                        type="button"
                        className="button button--m button--green-bd actions__btn"
                        onClick={exportClickHandler}
                        disabled={!settingsStore.userRules}
                    >
                        {reactTranslator.translate('options_userfilter_export')}
                    </button>
                </div>
                <div className="actions__group">
                    {renderSavingState()}
                    <button
                        type="button"
                        className="button button--m button--green actions__btn"
                        onClick={saveClickHandler}
                    >
                        {reactTranslator.translate('options_editor_save')}
                    </button>
                </div>
            </div>
        </>
    );
});

export { UserRules };
