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

import fs from 'node:fs';
import path from 'node:path';

import postcss, { type Rule } from 'postcss';
import {
    describe,
    it,
    expect,
} from 'vitest';

import {
    ROW_PADDING_PX,
    ROW_PADDING_TOP_PX,
    TEXT_OFFSET_TOP_PX,
    LINE_HEIGHT_PX,
    ICON_HEIGHT_PX,
    COMMENT_BLOCK_VIRTUALIZATION_THRESHOLD_LINES,
    COMMENT_BLOCK_OVERSCAN_LINES,
} from '../../../../../../Extension/src/pages/options/components/UserRules/rule-row-constants';

/**
 * Path to the CSS module file whose values the constants mirror.
 */
const PCSS_PATH = path.resolve(
    __dirname,
    '../../../../../../Extension/src/pages/options/components/UserRules/RuleRow.module.pcss',
);

/**
 * Path to the shared editor stylesheet, whose inline comment height the
 * constants mirror.
 */
const EDITOR_PCSS_PATH = path.resolve(
    __dirname,
    '../../../../../../Extension/src/pages/common/components/Editor/editor.pcss',
);

/**
 * Resolves a rule's selectors against its nesting parents, replacing `&` with
 * the parent selector (and prefixing plain nested selectors with it), so tests
 * can look up the same selectors the browser sees (e.g. `&--inline` under
 * `.editor` becomes `.editor--inline`). At-rule parents (`@media`, …) are
 * skipped.
 *
 * @param rule Rule whose selectors to resolve.
 *
 * @returns Resolved selector list.
 */
const resolveRuleSelectors = (rule: Rule): string[] => {
    let selectors = rule.selectors;
    // Only rule ancestors matter; at-rules (`@media`, …), the document and the
    // root are skipped. The cast keeps the walk typed while the runtime `type`
    // check filters non-rule parents.
    let parent = rule.parent as unknown as Rule | undefined;
    while (parent && parent.type === 'rule') {
        const parentSelectors = parent.selectors;
        selectors = selectors.flatMap((selector) => parentSelectors.map((parentSelector) => (
            selector.includes('&')
                ? selector.replaceAll('&', parentSelector)
                : `${parentSelector} ${selector}`
        )));
        parent = parent.parent as unknown as Rule | undefined;
    }
    return selectors;
};

/**
 * Parses the given `.pcss` file and returns a Map from selector → Map of
 * property → raw value.
 *
 * @param pcssPath Absolute path to the stylesheet to parse.
 *
 * @returns Selector → property → value map.
 */
const parsePcss = (pcssPath: string): Map<string, Map<string, string>> => {
    const css = fs.readFileSync(pcssPath, 'utf-8');
    const root = postcss.parse(css);

    const rulesBySelector = new Map<string, Map<string, string>>();

    root.walk((node) => {
        if (node.type === 'rule') {
            const rule = node as Rule;
            const declarations = new Map<string, string>();
            // Direct declarations only: `walkDecls` would also collect the
            // declarations of nested rules (e.g. the `.cm-editor` overrides
            // inside `.editor--inline`), which would mask a changed value on
            // the rule itself.
            rule.nodes.forEach((child) => {
                if (child.type === 'decl') {
                    declarations.set(child.prop, child.value);
                }
            });
            // A selector can appear in several rule nodes (e.g. a shared
            // `flex`/`min-width` group plus its own block), so merge instead of
            // overwriting; declarations from later nodes win.
            resolveRuleSelectors(rule).forEach((selector) => {
                const existing = rulesBySelector.get(selector);
                rulesBySelector.set(
                    selector,
                    existing ? new Map([...existing, ...declarations]) : declarations,
                );
            });
        }
    });

    return rulesBySelector;
};

/**
 * Parses a CSS dimension value like "8px" or "20px" into a number.
 *
 * @param value The CSS value string
 *
 * @returns The numeric part of the value
 *
 * @throws If the value cannot be parsed as a number
 */
const parsePixelValue = (value: string): number => {
    const match = value.match(/^(\d+(?:\.\d+)?)/);
    if (!match || match[1] === undefined) {
        throw new Error(`Cannot parse pixel value: "${value}"`);
    }
    return parseFloat(match[1]);
};

describe('rule-row-constants', () => {
    const rulesBySelector = parsePcss(PCSS_PATH);

    describe('ROW_PADDING_PX', () => {
        it(`should match the sum of top + bottom padding from .row in ${path.basename(PCSS_PATH)}`, () => {
            const rowDecls = rulesBySelector.get('.row');
            expect(rowDecls, 'The .row selector is missing from the pcss file').toBeDefined();

            const padding = rowDecls!.get('padding');
            expect(padding, 'The .row rule does not have a padding declaration').toBeDefined();

            // padding: 8px 16px → parts[0]=top, parts[2]=bottom (for 3+ values)
            const parts = padding!.split(/\s+/);
            const bottomPart = parts.length >= 3 ? parts[2] : parts[0];
            if (parts[0] === undefined || bottomPart === undefined) {
                throw new Error(`Cannot parse padding value: "${padding}"`);
            }
            const top = parsePixelValue(parts[0]);
            const bottom = parsePixelValue(bottomPart);
            const totalVertical = top + bottom;

            expect(totalVertical).toBe(ROW_PADDING_PX);
        });
    });

    describe('ROW_PADDING_TOP_PX', () => {
        it(`should match the top padding from .row in ${path.basename(PCSS_PATH)}`, () => {
            const rowDecls = rulesBySelector.get('.row');
            expect(rowDecls, 'The .row selector is missing from the pcss file').toBeDefined();

            const padding = rowDecls!.get('padding');
            expect(padding, 'The .row rule does not have a padding declaration').toBeDefined();

            // padding: 8px 16px → parts[0] is the top padding.
            const parts = padding!.split(/\s+/);
            if (parts[0] === undefined) {
                throw new Error(`Cannot parse padding value: "${padding}"`);
            }

            expect(parsePixelValue(parts[0])).toBe(ROW_PADDING_TOP_PX);
        });
    });

    describe('TEXT_OFFSET_TOP_PX', () => {
        it(`should match margin-top from .ruleText in ${path.basename(PCSS_PATH)}`, () => {
            const ruleDecls = rulesBySelector.get('.ruleText');
            expect(ruleDecls, 'The .ruleText selector is missing from the pcss file').toBeDefined();

            const marginTop = ruleDecls!.get('margin-top');
            expect(marginTop, 'The .ruleText rule does not have a margin-top declaration').toBeDefined();

            expect(parsePixelValue(marginTop!)).toBe(TEXT_OFFSET_TOP_PX);
        });

        it(`should match margin-top from .commentText in ${path.basename(PCSS_PATH)}`, () => {
            const commentDecls = rulesBySelector.get('.commentText');
            expect(commentDecls, 'The .commentText selector is missing from the pcss file').toBeDefined();

            const marginTop = commentDecls!.get('margin-top');
            expect(marginTop, 'The .commentText rule does not have a margin-top declaration').toBeDefined();

            expect(parsePixelValue(marginTop!)).toBe(TEXT_OFFSET_TOP_PX);
        });

        it('should be cancelled by the bottom margin, so the row keeps its height', () => {
            // The row height estimates count whole text lines; an offset
            // that added to the layout height would put them off.
            expect(rulesBySelector.get('.ruleText')!.get('margin-bottom')).toBe(`-${TEXT_OFFSET_TOP_PX}px`);
            expect(rulesBySelector.get('.commentText')!.get('margin-bottom')).toBe(`-${TEXT_OFFSET_TOP_PX}px`);
        });
    });

    describe('comment block virtualization constants', () => {
        it('uses a virtualization threshold well above one viewport of lines', () => {
            // Blocks at or below the threshold keep the simple full
            // rendering; the threshold must sit comfortably above the ~38
            // lines a 768px viewport shows so ordinary blocks never pay the
            // nested virtualizer cost.
            expect(COMMENT_BLOCK_VIRTUALIZATION_THRESHOLD_LINES).toBeGreaterThan(
                Math.ceil(1000 / LINE_HEIGHT_PX),
            );
        });

        it('keeps a positive overscan of lines around the visible window', () => {
            expect(COMMENT_BLOCK_OVERSCAN_LINES).toBeGreaterThanOrEqual(1);
        });
    });

    describe('virtualized comment line classes', () => {
        it(`should position the lines viewport relatively in ${path.basename(PCSS_PATH)}`, () => {
            const viewportDecls = rulesBySelector.get('.commentLinesViewport');
            expect(viewportDecls, 'The .commentLinesViewport selector is missing from the pcss file').toBeDefined();

            expect(viewportDecls!.get('position')).toBe('relative');
            // Absolutely positioned lines contribute no intrinsic width, so the
            // viewport must span the container explicitly.
            expect(viewportDecls!.get('width')).toBe('100%');
        });

        it(`should let a virtualized block take the free row width in ${path.basename(PCSS_PATH)}`, () => {
            // Without in-flow children the flex column would collapse to zero
            // width and every line would wrap per character; the wrapper has
            // to grow for the same reason.
            const textDecls = rulesBySelector.get('.commentTextVirtualized');
            expect(textDecls, 'The .commentTextVirtualized selector is missing from the pcss file').toBeDefined();
            expect(textDecls!.get('flex')).toBe('1');
            expect(textDecls!.get('min-width')).toBe('0');

            const commentDecls = rulesBySelector.get('.commentVirtualized');
            expect(commentDecls, 'The .commentVirtualized selector is missing from the pcss file').toBeDefined();
            expect(commentDecls!.get('flex')).toBe('1');
            expect(commentDecls!.get('min-width')).toBe('0');
        });

        it(`should position the virtualized lines absolutely in ${path.basename(PCSS_PATH)}`, () => {
            const lineDecls = rulesBySelector.get('.commentLineVirtualized');
            expect(lineDecls, 'The .commentLineVirtualized selector is missing from the pcss file').toBeDefined();

            expect(lineDecls!.get('position')).toBe('absolute');
            expect(lineDecls!.get('top')).toBe('0');
            expect(lineDecls!.get('left')).toBe('0');
            expect(lineDecls!.get('width')).toBe('100%');
        });
    });

    describe('LINE_HEIGHT_PX', () => {
        it(`should match line-height from .commentText in ${path.basename(PCSS_PATH)}`, () => {
            const commentDecls = rulesBySelector.get('.commentText');
            expect(commentDecls, 'The .commentText selector is missing from the pcss file').toBeDefined();

            const lineHeight = commentDecls!.get('line-height');
            expect(lineHeight, 'The .commentText rule does not have a line-height declaration').toBeDefined();

            expect(parsePixelValue(lineHeight!)).toBe(LINE_HEIGHT_PX);
        });

        it(`should match line-height from .ruleText in ${path.basename(PCSS_PATH)}`, () => {
            const ruleDecls = rulesBySelector.get('.ruleText');
            expect(ruleDecls, 'The .ruleText selector is missing from the pcss file').toBeDefined();

            const lineHeight = ruleDecls!.get('line-height');
            expect(lineHeight, 'The .ruleText rule does not have a line-height declaration').toBeDefined();

            expect(parsePixelValue(lineHeight!)).toBe(LINE_HEIGHT_PX);
        });
    });

    describe('ICON_HEIGHT_PX', () => {
        it(`should match height from .icon in ${path.basename(PCSS_PATH)}`, () => {
            const iconDecls = rulesBySelector.get('.icon');
            expect(iconDecls, 'The .icon selector is missing from the pcss file').toBeDefined();

            const height = iconDecls!.get('height');
            expect(height, 'The .icon rule does not have a height declaration').toBeDefined();

            expect(parsePixelValue(height!)).toBe(ICON_HEIGHT_PX);
        });
    });

    describe('single-line rule text', () => {
        it(`truncates long rules with an ellipsis in ${path.basename(PCSS_PATH)}`, () => {
            const ruleTextDecls = rulesBySelector.get('.ruleText');
            expect(ruleTextDecls, 'The .ruleText selector is missing from the pcss file').toBeDefined();

            expect(ruleTextDecls!.get('white-space')).toBe('nowrap');
            expect(ruleTextDecls!.get('overflow')).toBe('hidden');
            expect(ruleTextDecls!.get('text-overflow')).toBe('ellipsis');
        });

        it(`allows the rule text to shrink to the available width in ${path.basename(PCSS_PATH)}`, () => {
            const ruleDecls = rulesBySelector.get('.rule');
            expect(ruleDecls, 'The .rule selector is missing from the pcss file').toBeDefined();

            expect(ruleDecls!.get('min-width')).toBe('0');
        });
    });

    describe('inline comment editor height', () => {
        const editorRulesBySelector = parsePcss(EDITOR_PCSS_PATH);

        it('keeps the inline rule editor at one line height', () => {
            const inlineEditorDecls = editorRulesBySelector.get('.editor--inline');
            expect(
                inlineEditorDecls,
                'The .editor--inline selector is missing from the editor stylesheet',
            ).toBeDefined();

            // The single-line inline editor mirrors LINE_HEIGHT_PX in all
            // three height declarations.
            const height = inlineEditorDecls!.get('height');
            const minHeight = inlineEditorDecls!.get('min-height');
            const maxHeight = inlineEditorDecls!.get('max-height');
            expect(height, 'The inline rule editor does not have a height declaration').toBeDefined();
            expect(minHeight, 'The inline rule editor does not have a min-height declaration').toBeDefined();
            expect(maxHeight, 'The inline rule editor does not have a max-height declaration').toBeDefined();

            expect(parsePixelValue(height!)).toBe(LINE_HEIGHT_PX);
            expect(parsePixelValue(minHeight!)).toBe(LINE_HEIGHT_PX);
            expect(parsePixelValue(maxHeight!)).toBe(LINE_HEIGHT_PX);
        });

        it('keeps the nested inline rule editor scroller at one line height', () => {
            // The nested `.cm-editor` declaration overrides the shell height,
            // so it has to be checked on its own.
            const cmEditorDecls = editorRulesBySelector.get('.editor--inline .cm-editor');
            expect(
                cmEditorDecls,
                'The .editor--inline .cm-editor selector is missing from the editor stylesheet',
            ).toBeDefined();

            const height = cmEditorDecls!.get('height');
            expect(height, 'The nested .cm-editor does not have a height declaration').toBeDefined();

            expect(parsePixelValue(height!)).toBe(LINE_HEIGHT_PX);
        });

        it('caps the inline comment editor at five lines', () => {
            const commentEditorDecls = editorRulesBySelector.get('.editor--inline.editor--inline-multiline');
            expect(
                commentEditorDecls,
                'The .editor--inline.editor--inline-multiline selector is missing '
                + 'from the editor stylesheet',
            ).toBeDefined();

            const maxHeight = commentEditorDecls!.get('max-height');
            expect(maxHeight, 'The inline comment editor does not have a max-height declaration').toBeDefined();

            expect(parsePixelValue(maxHeight!)).toBe(LINE_HEIGHT_PX * 5);
        });

        it('caps the nested inline comment editor at five lines', () => {
            const cmEditorDecls = editorRulesBySelector.get(
                '.editor--inline.editor--inline-multiline .cm-editor',
            );
            expect(
                cmEditorDecls,
                'The .editor--inline.editor--inline-multiline .cm-editor selector is missing '
                + 'from the editor stylesheet',
            ).toBeDefined();

            const maxHeight = cmEditorDecls!.get('max-height');
            expect(maxHeight, 'The nested comment .cm-editor does not have a max-height declaration').toBeDefined();

            expect(parsePixelValue(maxHeight!)).toBe(LINE_HEIGHT_PX * 5);
        });
    });
});
