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
    type MutableRefObject,
    useState,
    useEffect,
    useRef,
} from 'react';

import { Compartment, EditorState } from '@codemirror/state';
import {
    keymap,
    placeholder as cmPlaceholder,
    EditorView,
} from '@codemirror/view';
import { syntaxHighlighting } from '@codemirror/language';
import { searchPanelOpen } from '@codemirror/search';
import cn from 'classnames';

import { initEditor } from '@adguard/rules-editor';

import { logger } from '../../../../common/logger';
import { UserAgent } from '../../../../common/user-agent';
import { MOBILE_BREAKPOINT_PX } from '../../constants';

import { createDeferredEditorHandle, type EditorHandle } from './editor-handle';
import { adguardHighlightStyle, adguardTheme } from './adguard-theme';

import './editor.pcss';

/**
 * Helper to get Oculus-specific class for the editor container.
 *
 * Task: AG-43589 — see this task number for the related CSS workaround.
 */
const getOculusClass = () => {
    return UserAgent.isOculus ? 'oculus-browser' : '';
};

/**
 * Persisted editor container size. Defaults are CSS strings; sizes saved by
 * the ResizeObserver are numbers (interpreted as pixels by React).
 */
type EditorSize = {
    /**
     * Container width.
     */
    width: string | number;

    /**
     * Container height.
     */
    height: string | number;
};

const DEFAULT_EDITOR_SIZE: EditorSize = {
    width: '618px',
    height: '300px',
};

/**
 * Total horizontal padding of the editor container (left + right).
 */
const EDITOR_PADDING = 26;

const EDITOR_PLACEHOLDER = 'example.com';

/**
 * Props for the {@link Editor} component.
 */
type EditorProps = {
    /**
     * Unique editor name, used as part of the size persistence storage key.
     */
    name: string;

    /**
     * Ref that receives the imperative {@link EditorHandle}.
     */
    editorRef: MutableRefObject<EditorHandle | null>;

    /**
     * Called with the whole document content on every document change.
     */
    onChange?: (value: string) => void;

    /**
     * Whether the editor is rendered in fullscreen mode.
     */
    fullscreen?: boolean;

    /**
     * Whether to enable syntax highlighting of the rules. Captured once at
     * mount, not reactive.
     */
    highlightRules?: boolean;

    /**
     * Whether the persisted editor size should be reset to the default one.
     */
    shouldResetSize?: boolean;

    /**
     * Called on the save hotkey (Ctrl/Cmd+S).
     */
    onSave?: () => void;

    /**
     * Called when Escape is pressed (unless the search panel is open).
     */
    onExit?: () => void;

    /**
     * Whether the editor is read-only.
     */
    readOnly?: boolean;

    /**
     * Whether line wrapping is enabled.
     */
    wrapEnabled?: boolean;
};

const Editor = ({
    name,
    editorRef,
    onChange,
    fullscreen,
    highlightRules,
    shouldResetSize,
    onSave,
    onExit,
    readOnly = false,
    wrapEnabled = false,
}: EditorProps) => {
    const SIZE_STORAGE_KEY = `${name}_editor-size`;
    const [size, setSize] = useState<EditorSize>(() => {
        const stored = localStorage.getItem(SIZE_STORAGE_KEY);
        if (!stored) {
            return DEFAULT_EDITOR_SIZE;
        }
        try {
            return JSON.parse(stored) || DEFAULT_EDITOR_SIZE;
        } catch {
            return DEFAULT_EDITOR_SIZE;
        }
    });

    const nodeRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    const isUserResizingRef = useRef(false);

    // Keep the latest callback props in a ref so the mount-once effect's
    // keymap and initEditor callbacks never close over stale values. This is
    // needed because the effect runs with `[]` deps (CodeMirror can't be
    // recreated on every render).
    const handlersRef = useRef({ onChange, onSave, onExit });
    handlersRef.current = { onChange, onSave, onExit };

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

    // Persist size changes via ResizeObserver
    useEffect(() => {
        const container = containerRef.current;
        if (!container || fullscreen) {
            return;
        }
        const observer = new ResizeObserver((entries) => {
            if (!isUserResizingRef.current) {
                return;
            }
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                localStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify({
                    width: width + EDITOR_PADDING,
                    height,
                }));
            }
        });
        observer.observe(container);

        const onPointerDown = () => {
            isUserResizingRef.current = true;
        };
        const onPointerUp = () => {
            isUserResizingRef.current = false;
        };

        container.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointerup', onPointerUp);

        return () => {
            observer.disconnect();
            container.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, [fullscreen, SIZE_STORAGE_KEY]);

    const editorClassName = cn(
        'editor',
        { 'editor--full-screen': fullscreen },
        { 'editor--with-margin': !fullscreen },
        getOculusClass(),
    );

    // Mount CodeMirror 6 editor
    //
    // NOTE: `highlightRules` is intentionally captured once at mount (used
    // below for the WASM grammar URL and the `highlight` mode) and is NOT
    // reactive. CodeMirror is created a single time via the `[]`-deps effect,
    // so changing this prop after mount has no effect. All current callers
    // (`UserRulesEditor`, `Allowlist`) pass a constant value for the
    // component's lifetime; a future caller needing to toggle highlighting at
    // runtime must remount the editor (e.g. via `key`) instead.
    useEffect(() => {
        const node = nodeRef.current;
        if (!node) {
            logger.error('[ext.Editor]: editor node is not available.');
            return undefined;
        }

        let view: EditorView | undefined;
        let mounted = true;

        const wrap = new Compartment();
        const readOnlyCompartment = new Compartment();
        const mobile = window.innerWidth < MOBILE_BREAKPOINT_PX;

        const wasm = highlightRules
            ? new URL('vscode-oniguruma/release/onig.wasm', import.meta.url)
            : undefined;

        const extensions = [
            wrap.of(wrapEnabled ? EditorView.lineWrapping : []),
            readOnlyCompartment.of(readOnly ? [EditorState.readOnly.of(true), EditorView.editable.of(false)] : []),
            syntaxHighlighting(adguardHighlightStyle),
            adguardTheme,
            keymap.of([{
                key: 'Escape',
                run: (targetView) => {
                    // Let @codemirror/search handle Escape to close its panel
                    // instead of triggering onExit and stranding the panel.
                    if (searchPanelOpen(targetView.state)) {
                        return false;
                    }
                    handlersRef.current.onExit?.();
                    return true;
                },
            }]),
        ];
        if (mobile) {
            extensions.push(cmPlaceholder(EDITOR_PLACEHOLDER));
        }

        // Expose a stable handle synchronously so async consumers (which fetch
        // content over IPC and may resolve before `initEditor`) never observe a
        // null ref. Writes made before the view exists are buffered and replayed
        // on attach, mirroring the old synchronous Ace behaviour.
        const deferred = createDeferredEditorHandle();
        editorRef.current = deferred.handle;

        initEditor(node, wasm, {
            highlight: highlightRules ? 'full' : 'none',
            // `initEditor` invokes `onChange` with the `EditorView` and only
            // for document changes (it filters `update.docChanged` internally),
            // so wrap/read-only reconfigurations never reach here.
            onChange: (changedView) => {
                handlersRef.current.onChange?.(changedView.state.doc.toString());
            },
            hotkeys: {
                mode: UserAgent.isMacOs ? 'mac' : 'windows',
                // `Ctrl/Cmd+/` is handled internally by rules-editor: its
                // `Mod-/` keymap always toggles `!`/`#` comment marks on the
                // selected lines (the replacement for the old Ace
                // `togglecomment`). `toggleRule`/`withBreakpoints` are
                // intentionally omitted — they drive the separate enabled-rule
                // gutter feature, which this editor does not use.
                onSave: () => handlersRef.current.onSave?.(),
            },
            extensions,
        }).then((created) => {
            if (!mounted) {
                created.destroy();
                return;
            }
            view = created;
            viewRef.current = view;
            deferred.attach(view, { wrap, readOnly: readOnlyCompartment });
        }).catch((e) => {
            logger.error('[ext.Editor]: failed to initialize editor:', e);
        });

        return () => {
            mounted = false;
            view?.destroy();
            viewRef.current = null;
            deferred.detach();
            editorRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep readOnly prop in sync after mount
    useEffect(() => {
        editorRef.current?.setReadOnly(readOnly);
    }, [readOnly, editorRef]);

    // Keep wrapEnabled prop in sync after mount
    useEffect(() => {
        editorRef.current?.setWrap(wrapEnabled);
    }, [wrapEnabled, editorRef]);

    return (
        <div
            ref={containerRef}
            style={editorStyles}
            className={editorClassName}
        >
            <textarea ref={nodeRef} />
        </div>
    );
};

export { Editor };
