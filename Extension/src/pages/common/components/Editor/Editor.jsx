/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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

import React, { useState, useEffect } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import AceEditor from 'react-ace';

import cn from 'classnames';
// These side effects imports must be placed after the 'react-ace' import
import 'ace-builds/src-noconflict/ext-searchbox.js';
import 'ace-builds/src-noconflict/theme-textmate.js';
import 'ace-builds/src-noconflict/mode-text.js';

import { logger } from '../../../../common/logger';
import { UserAgent } from '../../../../common/user-agent';

import './mode-adguard.js';

import './editor.pcss';


/**
 * Helper to get Oculus-specific class for the editor container.
 *
 * Task: AG-43589 — see this task number for the related CSS workaround.
 */
const getOculusClass = () => {
    return UserAgent.isOculus ? 'oculus-browser' : '';
};

const DEFAULT_EDITOR_SIZE = {
    width: '618px',
    height: '300px',
};

const EDITOR_PADDING = 26;

const Editor = ({
    name,
    value,
    editorRef,
    shortcuts = [],
    onChange,
    fullscreen,
    highlightRules,
    shouldResetSize,
    onSave,
    onExit,
    readOnly = false,
}) => {
    const SIZE_STORAGE_KEY = `${name}_editor-size`;
    const editorStorageSize = localStorage.getItem(SIZE_STORAGE_KEY);
    const [size, setSize] = useState(JSON.parse(editorStorageSize) || DEFAULT_EDITOR_SIZE);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
    const [hasContent, setHasContent] = useState(false);


    useEffect(() => {
        if (editorStorageSize) {
            try {
                setSize(JSON.parse(editorStorageSize));
            } catch (e) {
                setSize(DEFAULT_EDITOR_SIZE);
                logger.debug('[ext.Editor]: failed to parse editor size from storage: ', e.message);
            }
        }
    }, [editorStorageSize]);

    useEffect(() => {
        if (shouldResetSize) {
            localStorage.removeItem(SIZE_STORAGE_KEY);
            setSize(DEFAULT_EDITOR_SIZE);
        }
    }, [shouldResetSize, SIZE_STORAGE_KEY]);

    const editorStyles = {
        width: size.width,
        height: size.height,
    };

    // On fullscreen ignore size change
    const onResize = fullscreen
        ? () => { }
        : (width, height) => {
            localStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify({
                width: width + EDITOR_PADDING, height,
            }));
            editorRef.current.editor.resize();
            setIsMobile(window.innerWidth < 640);
        };

    const editorClassName = cn(
        'editor',
        { 'editor--full-screen': fullscreen },
        { 'editor--with-margin': !fullscreen },
        getOculusClass(),
    );

    const handleChange = (newValue) => {
        setHasContent(newValue?.length > 0);
        onChange(newValue);
    };

    // highlight rules syntax only for user rules
    const editorMode = highlightRules ? 'adguard' : 'text';

    const mergedShortcuts = [
        {
            name: 'save',
            bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
            exec: onSave,
        },
        {
            name: 'exit',
            bindKey: { win: 'Esc', mac: 'Esc' },
            exec: onExit,
        },
        ...shortcuts,
    ];

    return (
        <div style={editorStyles} className={editorClassName}>
            {isMobile && !hasContent && <div className="editor__hint">example.com</div>}
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
                commands={mergedShortcuts}
                onChange={handleChange}
                readOnly={readOnly}
                showGutter={!isMobile}
                highlightActiveLine={!isMobile}
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
