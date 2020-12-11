import React from 'react';
import ReactResizeDetector from 'react-resize-detector';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/theme-textmate';

import { log } from '../../../../common/log';
import './mode-adguard';

import './editor.pcss';

const Editor = ({
    name, value, editorRef, shortcuts,
}) => {
    const SIZE_STORAGE_KEY = `${name}_editor-size`;

    const DEFAULT_EDITOR_SIZE = {
        width: '100%',
        height: '300px',
    };

    let editorSize = DEFAULT_EDITOR_SIZE;

    const editorStorageSize = localStorage.getItem(SIZE_STORAGE_KEY);

    if (editorStorageSize) {
        try {
            editorSize = JSON.parse(editorStorageSize);
        } catch (e) {
            editorSize = DEFAULT_EDITOR_SIZE;
            log.debug(e.message);
        }
    }

    const editorStyles = {
        width: editorSize.width,
        height: editorSize.height,
    };

    const onResize = (width, height) => {
        localStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify({ width, height }));
        editorRef.current.editor.resize();
    };

    return (
        <div style={editorStyles} className="editor">
            <AceEditor
                ref={editorRef}
                width="100%"
                height="100%"
                mode="adguard"
                theme="textmate"
                name={name}
                showPrintMargin={false}
                editorProps={{ $blockScrolling: true }}
                value={value}
                commands={shortcuts}
            />
            <ReactResizeDetector
                skipOnMount
                handleWidth
                handleHeight
                onResize={onResize}
            />
        </div>
    );
};

export { Editor };
