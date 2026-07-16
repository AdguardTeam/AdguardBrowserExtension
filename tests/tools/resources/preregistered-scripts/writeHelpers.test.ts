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

import vm from 'node:vm';

import {
    describe,
    it,
    expect,
} from 'vitest';

/**
 * Validates the JavaScript syntax of the given code string using Node.js `vm.Script`.
 *
 * @param code JavaScript source code to validate.
 * @param desc Human-readable description of the bundle (used in the error message).
 *
 * @throws {Error} If the code contains a syntax error.
 */
const validateSyntax = (code: string, desc: string): void => {
    try {
        // eslint-disable-next-line no-new
        new vm.Script(code);
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`Syntax error in ${desc}: ${msg}`);
    }
};

describe('validateSyntax', () => {
    it('does not throw for valid JavaScript', () => {
        expect(() => validateSyntax('var x = 1;', 'test.js')).not.toThrow();
    });

    it('does not throw for an empty string', () => {
        expect(() => validateSyntax('', 'empty.js')).not.toThrow();
    });

    it('does not throw for a complex valid IIFE', () => {
        const code = '(function() { var _g = window._g; if (!_g) return; _g.r("foo", {}, [], "k"); })();';
        expect(() => validateSyntax(code, 'bundle.js')).not.toThrow();
    });

    it('throws for a syntax error and includes the descriptor in the message', () => {
        expect(() => validateSyntax('var = ;', 'bad-bundle.js')).toThrowError(/bad-bundle\.js/);
    });

    it('throws for unclosed braces', () => {
        expect(() => validateSyntax('function foo() {', 'unclosed.js')).toThrow();
    });

    it('throws for an unexpected token', () => {
        expect(() => validateSyntax('!!!', 'invalid.js')).toThrow();
    });
});
