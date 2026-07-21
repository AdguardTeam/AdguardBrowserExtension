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

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import {
    beforeAll,
    describe,
    it,
    expect,
} from 'vitest';

import { getHtmlRenderer } from '@adguard/rules-editor';

import {
    stripCommentMarkerFromHtml,
} from '../../../../../../Extension/src/pages/options/components/UserRules/strip-comment-marker';

/**
 * Pins the implicit contract between {@link stripCommentMarkerFromHtml} and the
 * real `@adguard/rules-editor` renderer output.
 *
 * Unlike `RuleRow.test.tsx`, which uses a simplified mock renderer, this suite
 * runs the marker-stripping regex against the actual HTML produced by
 * {@link getHtmlRenderer}. If the renderer changes how it wraps the leading
 * comment marker (e.g. nests it in a child element), these tests fail instead of
 * silently leaking the marker into the displayed comment text.
 */
describe('stripCommentMarkerFromHtml against the real renderer', () => {
    let renderRule: (rule: string) => string;

    beforeAll(async () => {
        const require = createRequire(import.meta.url);
        const wasmPath = require.resolve('vscode-oniguruma/release/onig.wasm');
        const wasmBuffer = readFileSync(wasmPath);
        // Pass a standalone ArrayBuffer slice so the WASM loader gets exactly the file bytes.
        const wasm = wasmBuffer.buffer.slice(
            wasmBuffer.byteOffset,
            wasmBuffer.byteOffset + wasmBuffer.byteLength,
        );
        renderRule = await getHtmlRenderer(wasm);
    });

    /**
     * Parses HTML and returns its visible text content via the jsdom DOM.
     *
     * @param html HTML string to parse.
     *
     * @returns The concatenated text content.
     */
    const textOf = (html: string): string => {
        const container = document.createElement('div');
        container.innerHTML = html;
        return container.textContent ?? '';
    };

    it.each([
        { label: 'regular (`!`) comment', rule: '! my comment', expected: 'my comment' },
        { label: 'hosts-style (`#`) comment', rule: '# hosts comment', expected: 'hosts comment' },
        { label: 'comment with no space after the marker', rule: '!tight comment', expected: 'tight comment' },
    ])('strips the marker from a highlighted $label', ({ rule, expected }) => {
        const rendered = renderRule(rule);

        // Sanity check: the raw renderer output still contains the marker as text.
        expect(textOf(rendered)).toContain(expected);
        expect(textOf(rendered).trimStart().startsWith(expected)).toBe(false);

        const stripped = stripCommentMarkerFromHtml(rendered);

        // The marker (and its trailing whitespace) is gone from the visible text...
        expect(textOf(stripped)).toBe(expected);
        // ...and the syntax-highlighting markup is preserved.
        expect(stripped).toContain('<span');
    });

    it('leaves already-highlighted rule HTML untouched (no marker to strip)', () => {
        const rendered = renderRule('||example.org^');
        expect(stripCommentMarkerFromHtml(rendered)).toBe(rendered);
        expect(textOf(stripCommentMarkerFromHtml(rendered))).toBe('||example.org^');
    });
});
