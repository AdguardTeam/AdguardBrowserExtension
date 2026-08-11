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
 * Security test: verifies that the HTML produced by the real
 * `@adguard/rules-editor` renderer — the same renderer whose output is fed to
 * `dangerouslySetInnerHTML` in `HighlightedText` — properly escapes
 * user-authored rule text so that no raw `<script>` tags, event-handler
 * attributes, or other executable HTML can survive.
 *
 * Rule text is user-authored (self-XSS only in practice), but the
 * `dangerouslySetInnerHTML` usage means any escaping gap in the renderer would
 * directly execute injected HTML. These tests pin the renderer's escaping
 * contract so a future change that drops or weakens escaping is caught.
 *
 * This is an integration test (like `strip-comment-marker.integration.test.ts`)
 * because it must run the real WASM-based renderer, not a mock.
 */
describe('Rule HTML renderer XSS safety', () => {
    let renderRule: (rule: string, search?: {
        searchTerm?: string;
        searchClassName?: string;
    }) => string;

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
     * Asserts that the HTML string is XSS-safe.
     *
     * Checks both at the string level (no raw `<script` tags) and at the DOM
     * level (parses the HTML via `innerHTML` — exactly as
     * `dangerouslySetInnerHTML` does — and walks the element tree for
     * executable elements and event-handler attributes).
     *
     * @param html HTML produced by the renderer.
     */
    const assertNoExecutableHtml = (html: string) => {
        // String-level: the renderer must escape < > " ' & so no raw <script>
        // tags can appear in the output (it only emits <span> tags).
        expect(html).not.toMatch(/<script[\s>]/i);

        // DOM-level: parse the HTML exactly as dangerouslySetInnerHTML would.
        const container = document.createElement('div');
        container.innerHTML = html;

        // No executable elements should survive.
        expect(container.querySelectorAll('script, iframe, object, embed')).toHaveLength(0);

        // No element should have an event-handler attribute (onclick, onerror,
        // onload, onmouseover, etc.).
        Array.from(container.querySelectorAll('*')).forEach((el) => {
            Array.from(el.attributes).forEach((attr) => {
                expect(attr.name.toLowerCase()).not.toMatch(/^on/);
            });
        });
    };

    /**
     * Hostile rules that attempt to inject executable HTML.
     */
    const hostileRules = [
        { description: 'script tag in URL pattern', rule: '||x^<script>alert(1)</script>' },
        { description: 'img onerror', rule: '<img src=x onerror=alert(1)>' },
        { description: 'svg onload', rule: '<svg/onload=alert(1)>' },
        { description: 'attribute breakout via double quote', rule: '||evil.com^" onmouseover="alert(1)"' },
        { description: 'script with type attribute', rule: '<script type="text/javascript">alert(1)</script>' },
        { description: 'iframe with javascript src', rule: '<iframe src="javascript:alert(1)"></iframe>' },
        { description: 'body onload', rule: '<body onload=alert(1)>' },
        { description: 'div with onclick', rule: '<div onclick="alert(1)">text</div>' },
        { description: 'nested script to bypass naive filtering', rule: '||x^<scr<script>ipt>alert(1)</script>' },
    ];

    it.each(hostileRules)('escapes hostile rule without search term: $description', ({ rule }) => {
        const html = renderRule(rule);
        // Sanity: renderer produced non-empty output.
        expect(html.length).toBeGreaterThan(0);
        assertNoExecutableHtml(html);
    });

    it.each(hostileRules)('escapes hostile rule with search term: $description', ({ rule }) => {
        // The search-highlight path wraps matches in an extra <span> and must
        // also escape the rule text.
        const html = renderRule(rule, {
            searchTerm: 'alert',
            searchClassName: 'highlight',
        });
        expect(html.length).toBeGreaterThan(0);
        assertNoExecutableHtml(html);
    });

    it('escapes a hostile search term containing a script tag', () => {
        // The search term is used for matching but must not be injected raw.
        const html = renderRule('||example.com^', {
            searchTerm: '<script>alert(1)</script>',
            searchClassName: 'highlight',
        });
        assertNoExecutableHtml(html);
    });

    it('escapes a hostile search term containing an event handler', () => {
        const html = renderRule('||example.com^', {
            searchTerm: '" onmouseover="alert(1)',
            searchClassName: 'highlight',
        });
        assertNoExecutableHtml(html);
    });

    it('escapes a hostile searchClassName that attempts attribute breakout', () => {
        // The searchClassName is placed in a class="..." attribute; it must be
        // escaped so it cannot break out and create new attributes.
        const html = renderRule('||example.com^', {
            searchTerm: 'example',
            searchClassName: 'highlight" onclick="alert(1)',
        });
        assertNoExecutableHtml(html);
    });

    /**
     * Hostile comments — the renderer receives the full comment (with marker)
     * and the output is then passed through `stripCommentMarkerFromHtml`,
     * exactly as `HighlightedText` does when `stripMarker` is true.
     */
    const hostileComments = [
        { description: 'script in regular comment', rule: '! <script>alert(1)</script>' },
        { description: 'img onerror in regular comment', rule: '! <img src=x onerror=alert(1)>' },
        { description: 'script in hosts-style comment', rule: '# <script>alert(1)</script>' },
        { description: 'body onload in comment', rule: '! <body onload=alert(1)>' },
    ];

    it.each(hostileComments)(
        'escapes hostile comment after marker stripping: $description',
        ({ rule }) => {
            const html = renderRule(rule);
            const stripped = stripCommentMarkerFromHtml(html);
            assertNoExecutableHtml(stripped);
        },
    );

    it.each(hostileComments)(
        'escapes hostile comment with search term after marker stripping: $description',
        ({ rule }) => {
            const html = renderRule(rule, {
                searchTerm: 'alert',
                searchClassName: 'highlight',
            });
            const stripped = stripCommentMarkerFromHtml(html);
            assertNoExecutableHtml(stripped);
        },
    );
});
