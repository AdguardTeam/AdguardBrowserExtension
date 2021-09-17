import React, { useState, useEffect } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import AceEditor from 'react-ace';
import cn from 'classnames';

import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-noconflict/mode-text';

import { log } from '../../../../common/log';
import './mode-adguard';

import './editor.pcss';

const DEFAULT_EDITOR_SIZE = {
    width: '100%',
    height: '300px',
};

const Editor = ({
    name,
    value,
    editorRef,
    shortcuts,
    onChange,
    fullscreen,
    highlightRules,
}) => {
    const [size, setSize] = useState(DEFAULT_EDITOR_SIZE);

    const SIZE_STORAGE_KEY = `${name}_editor-size`;

    useEffect(() => {
        const editorStorageSize = localStorage.getItem(SIZE_STORAGE_KEY);

        if (editorStorageSize) {
            try {
                setSize(JSON.parse(editorStorageSize));
            } catch (e) {
                setSize(DEFAULT_EDITOR_SIZE);
                log.debug(e.message);
            }
        }
    }, [setSize, SIZE_STORAGE_KEY]);

    const editorStyles = {
        width: size.width,
        height: size.height,
    };

    // On fullscreen ignore size change
    const onResize = fullscreen
        ? () => {}
        : (width, height) => {
            localStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify({ width, height }));
            editorRef.current.editor.resize();
        };

    const editorClassName = cn(
        'editor',
        { 'editor--full-screen': fullscreen },
    );

    // highlight rules syntax only for user rules
    const editorMode = highlightRules ? 'adguard' : 'text';

    return (
        <div style={editorStyles} className={editorClassName}>
            <AceEditor
                ref={editorRef}
                width="100%"
                height="100%"
                mode={editorMode}
                theme="textmate"
                name={name}
                showPrintMargin={false}
                editorProps={{ $blockScrolling: true }}
                fontSize={14}
                value={value}
                commands={shortcuts}
                onChange={onChange}
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
