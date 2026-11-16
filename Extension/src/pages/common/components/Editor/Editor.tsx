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
import { useFindShortcut } from '../../hooks/useFindShortcut';

import { createDeferredEditorHandle, type EditorHandle } from './editor-handle';
import { adguardHighlightStyle, adguardTheme } from './adguard-theme';
import { createSingleLineExtensions } from './single-line';
import { createMultilineModeExtensions } from './multiline-mode';

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
 * Checks whether an element other than the editor itself currently owns the
 * focus.
 *
 * @param container Container to check the focused element against.
 *
 * @returns `true` when the focus is owned by an element outside of the container.
 */
const isFocusOutside = (container: HTMLElement | null): boolean => {
    const { activeElement, body, documentElement } = document;
    if (!activeElement || activeElement === body || activeElement === documentElement) {
        return false;
    }

    return !container?.contains(activeElement);
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
 * Editing mode of the shared editor, which selects the extra CodeMirror
 * configuration appended to the default one. Omitted for the default
 * multi-line rules editor.
 */
export const enum EditorMode {
    /**
     * Single-line input: Enter triggers the save callback instead of inserting
     * a newline, and line terminators are stripped from insertions.
     */
    SingleLine = 'single-line',

    /**
     * Multi-line input (comment blocks and the create-rule row): Enter triggers
     * the save callback, Shift-Enter inserts a newline, line terminators are
     * kept, and line wrapping is enabled so long lines are not cut off.
     */
    Multiline = 'multiline',
}

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
     * Initial document content, applied to the underlying textarea before
     * CodeMirror initializes so it becomes the editor's starting document.
     * Unlike a `setValue` replacement, the initial document is not an undoable
     * change. Captured once at mount, not reactive.
     */
    initialValue?: string;

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
     * Called when the editor fails to initialize (e.g. the WASM grammar could
     * not be loaded). Consumers can render a fallback instead of leaving an
     * empty editor shell.
     */
    onInitError?: () => void;

    /**
     * Whether the editor is read-only.
     */
    readOnly?: boolean;

    /**
     * Whether line wrapping is enabled. Multi-line mode enables it regardless,
     * so long lines wrap instead of being cut off.
     */
    wrapEnabled?: boolean;

    /**
     * Whether the editor is rendered in a compact, frameless inline mode used
     * inside list rows. Inline editors do not persist or restore their size and
     * are not resizable. The shell styling reacts to this prop, but the
     * CodeMirror configuration is captured at mount, so toggling it at runtime
     * requires a remount (e.g. via `key`).
     */
    inline?: boolean;

    /**
     * Editing mode, which selects the extra CodeMirror configuration: see
     * {@link EditorMode}. Omitted for the default multi-line rules editor.
     * Captured once at mount, not reactive; the `editor--inline-multiline` shell
     * class follows it on every render.
     */
    mode?: EditorMode;

    /**
     * Whether `Ctrl+F` / `Cmd+F` opens the editor search even when the focus
     * is outside the editor. CodeMirror renders only the lines in view, so the
     * browser's find would miss every match outside the viewport; the editor
     * search covers the whole document. Meant for the single full-size editor
     * of a page, not for inline editors.
     */
    captureFindShortcut?: boolean;
};

const Editor = ({
    name,
    editorRef,
    initialValue,
    onChange,
    fullscreen,
    highlightRules,
    shouldResetSize,
    onSave,
    onExit,
    onInitError,
    readOnly = false,
    wrapEnabled = false,
    inline = false,
    mode,
    captureFindShortcut = false,
}: EditorProps) => {
    const SIZE_STORAGE_KEY = `${name}_editor-size`;
    const [size, setSize] = useState<EditorSize>(() => {
        if (inline) {
            return DEFAULT_EDITOR_SIZE;
        }
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

    // Whether the editor had focus before it was locked via the `readOnly`
    // prop. Switching the content DOM to non-editable blurs it, so the flag is
    // used to give the focus (and with it the caret) back once the editor
    // becomes editable again — e.g. when the saving is finished.
    const wasFocusedBeforeReadOnlyRef = useRef(false);

    const isUserResizingRef = useRef(false);

    // Keep the latest callback props in a ref so the mount-once effect's
    // keymap and initEditor callbacks never close over stale values. This is
    // needed because the effect runs with `[]` deps (CodeMirror can't be
    // recreated on every render).
    const handlersRef = useRef({
        onChange,
        onSave,
        onExit,
        onInitError,
    });
    handlersRef.current = {
        onChange,
        onSave,
        onExit,
        onInitError,
    };

    useEffect(() => {
        if (shouldResetSize && !inline) {
            localStorage.removeItem(SIZE_STORAGE_KEY);
            setSize(DEFAULT_EDITOR_SIZE);
        }
    }, [shouldResetSize, inline, SIZE_STORAGE_KEY]);

    const editorStyles = inline
        ? undefined
        : {
            width: size.width,
            height: size.height,
        };

    // Persist size changes via ResizeObserver
    useEffect(() => {
        const container = containerRef.current;
        if (!container || fullscreen || inline) {
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
    }, [fullscreen, inline, SIZE_STORAGE_KEY]);

    // Multi-line mode always wraps: long lines would otherwise be cut off in
    // the narrow inline editor.
    const shouldWrap = wrapEnabled || mode === EditorMode.Multiline;

    const editorClassName = cn(
        'editor',
        { 'editor--full-screen': fullscreen && !inline },
        { 'editor--with-margin': !fullscreen && !inline },
        { 'editor--inline': inline },
        { 'editor--inline-multiline': mode === EditorMode.Multiline },
        getOculusClass(),
    );

    // Mount CodeMirror 6 editor
    //
    // NOTE: `highlightRules`, `mode` and the extension-list usage of `inline`
    // are intentionally captured once at mount (they are used below for the
    // WASM grammar URL, the `highlight` mode and the extension list) and are
    // NOT reactive. CodeMirror is created a single time via the `[]`-deps
    // effect, so changing them after mount has no effect on the editor
    // configuration. The `inline` flag and the `editor--inline-multiline` class
    // are additionally read reactively for the size persistence, resize
    // observer and class names; a future caller needing to fully switch modes
    // must remount the editor (e.g. via `key`) instead. All current callers
    // pass constant values for the component's lifetime.
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
            wrap.of(shouldWrap ? EditorView.lineWrapping : []),
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
        if (mobile && !inline) {
            extensions.push(cmPlaceholder(EDITOR_PLACEHOLDER));
        }

        if (mode === EditorMode.SingleLine) {
            extensions.push(...createSingleLineExtensions(() => {
                handlersRef.current.onSave?.();
            }));
        } else if (mode === EditorMode.Multiline) {
            extensions.push(...createMultilineModeExtensions(() => {
                handlersRef.current.onSave?.();
            }));
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
            if (mounted) {
                handlersRef.current.onInitError?.();
            }
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
        const handle = editorRef.current;
        if (!handle) {
            return;
        }

        if (readOnly) {
            // Read the focus state before the editor is locked: the browser
            // blurs an element which stops being editable.
            wasFocusedBeforeReadOnlyRef.current = viewRef.current?.hasFocus ?? false;
        }

        handle.setReadOnly(readOnly);

        // Unlocking the editor must restore the focus it had before, otherwise
        // the caret is lost until the user clicks the editor again. The focus
        // is not stolen back if it has been moved to another element meanwhile.
        if (!readOnly && wasFocusedBeforeReadOnlyRef.current) {
            wasFocusedBeforeReadOnlyRef.current = false;
            if (!isFocusOutside(containerRef.current)) {
                handle.focus();
            }
        }
    }, [readOnly, editorRef]);

    // Inside the editor, CodeMirror's own search keymap handles the shortcut.
    useFindShortcut({
        enabled: captureFindShortcut,
        onFind: () => editorRef.current?.openSearch(),
        ignoreWithinRef: containerRef,
    });

    // Keep the effective wrap state in sync after mount (multi-line mode forces
    // wrapping regardless of the `wrapEnabled` prop).
    useEffect(() => {
        editorRef.current?.setWrap(shouldWrap);
    }, [shouldWrap, editorRef]);

    return (
        <div
            ref={containerRef}
            style={editorStyles}
            className={editorClassName}
        >
            <textarea ref={nodeRef} defaultValue={initialValue} />
        </div>
    );
};

export { Editor };
