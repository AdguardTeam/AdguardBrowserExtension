import React from 'react';
import ReactResizeDetector from 'react-resize-detector';
import AceEditor from 'react-ace';

import 'brace/ext/searchbox';
import 'brace/theme/textmate';

import './mode-adguard';

import './editor.pcss';

function onChange(newValue) {
    console.log('change', newValue);
}

function Editor() {
    const reactAceComponent = React.createRef();

    const editorStorageSize = localStorage.getItem('editorSize');

    const editorSize = editorStorageSize ? JSON.parse(editorStorageSize) : false;

    const editorStyles = {
        width: editorSize ? editorSize.width : 'auto',
        height: editorSize ? editorSize.height : 'auto',
    };

    function onResize(width, height) {
        localStorage.setItem('editorSize', JSON.stringify({ width, height }));
        reactAceComponent.current.editor.resize();
    }

    return (
        <div style={editorStyles} className="editor">
            <AceEditor
                ref={reactAceComponent}
                width="100%"
                height="100%"
                mode="adguard"
                theme="textmate"
                onChange={onChange}
                name="user-filter"
                showPrintMargin={false}
                editorProps={{ $blockScrolling: true }}
            />
            <ReactResizeDetector
                skipOnMount
                handleWidth
                handleHeight
                onResize={onResize}
            />
        </div>
    );
}

export default Editor;
