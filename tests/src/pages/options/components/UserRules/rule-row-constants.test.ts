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
    LINE_HEIGHT_PX,
    ICON_HEIGHT_PX,
} from '../../../../../../Extension/src/pages/options/components/UserRules/rule-row-constants';

/**
 * Path to the CSS module file whose values the constants mirror.
 */
const PCSS_PATH = path.resolve(
    __dirname,
    '../../../../../../Extension/src/pages/options/components/UserRules/RuleRow.module.pcss',
);

/**
 * Parses the `.pcss` file and returns a Map from selector → Map of property → raw value.
 */
const parsePcss = (): Map<string, Map<string, string>> => {
    const css = fs.readFileSync(PCSS_PATH, 'utf-8');
    const root = postcss.parse(css);

    const rulesBySelector = new Map<string, Map<string, string>>();

    root.walk((node) => {
        if (node.type === 'rule') {
            const rule = node as Rule;
            const declarations = new Map<string, string>();
            rule.walkDecls((decl) => {
                declarations.set(decl.prop, decl.value);
            });
            rule.selectors.forEach((selector) => {
                rulesBySelector.set(selector, declarations);
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
    const rulesBySelector = parsePcss();

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
});
