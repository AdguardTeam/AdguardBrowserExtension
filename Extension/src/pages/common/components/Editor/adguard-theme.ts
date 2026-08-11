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

import { EditorView } from '@codemirror/view';
import { HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

/**
 * Token colors mapped to the AdGuard editor CSS variables. Passed to
 * `initEditor` via `conf.extensions` and wrapped in `syntaxHighlighting()`
 * without the `fallback` option, so it lands in CodeMirror's main
 * `highlighterFacet`. The library registers its built-in `defaultHighlightStyle`
 * as a fallback highlighter, and CodeMirror ignores fallback highlighters
 * entirely whenever any non-fallback highlighter is present — so this style
 * wins regardless of extension ordering.
 */
export const adguardHighlightStyle = HighlightStyle.define([
    { tag: tags.comment, color: 'var(--editor-comment)', fontStyle: 'italic' },
    { tag: tags.keyword, color: 'var(--editor-syntax-red)' },
    { tag: tags.string, color: 'var(--editor-syntax-red)' },
    { tag: tags.operator, color: 'var(--editor-syntax-blue)' },
    { tag: tags.modifier, color: 'var(--editor-syntax-blue)' },
    { tag: tags.propertyName, color: 'var(--editor-syntax-pink)' },
    { tag: tags.tagName, color: 'var(--editor-syntax-pink)' },
    { tag: tags.attributeName, color: 'var(--editor-syntax-yellow)' },
    { tag: tags.number, color: 'var(--editor-syntax-yellow)' },
]);

/**
 * Editor background reset mapped to AdGuard variables. Selection and active-line
 * colors are intentionally NOT set here: they live in `editor.pcss`
 * (`.cm-selectionBackground` / `.cm-activeLine`) so they stay consistent with
 * the rest of the editor chrome and match the previous editor (Ace) styling.
 */
export const adguardTheme = EditorView.theme({
    '&': { backgroundColor: 'transparent' },
});
