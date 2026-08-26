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

import {
    describe,
    it,
    expect,
} from 'vitest';

import { mergeImportedRules, normalizeUserRulesLineEndings } from '../../../../Extension/src/common/utils/user-rules';

describe('normalizeUserRulesLineEndings', () => {
    it('normalizes mixed line endings to Unix-style line feeds', () => {
        expect(normalizeUserRulesLineEndings('||a.com^\r\n||b.com^\r||c.com^\n'))
            .toBe('||a.com^\n||b.com^\n||c.com^\n');
    });
});

describe('mergeImportedRules', () => {
    it('appends only genuinely-new rules and preserves existing order', () => {
        const result = mergeImportedRules('||dup.com^', '||new.com^\n||dup.com^');
        expect(result.merged).toBe('||dup.com^\n||new.com^');
        expect(result.addedCount).toBe(1);
    });

    it('drops blank lines from the imported file', () => {
        const result = mergeImportedRules('||a.com^', '||b.com^\n\n  \n||c.com^');
        expect(result.merged).toBe('||a.com^\n||b.com^\n||c.com^');
        expect(result.addedCount).toBe(2);
    });

    it('reports zero added when every imported rule is a duplicate', () => {
        const old = '||a.com^\n||b.com^';
        const result = mergeImportedRules(old, '||a.com^\n||b.com^');
        expect(result.addedCount).toBe(0);
        // merged equals the (trimmed) old rules — nothing to append.
        expect(result.merged).toBe(old);
    });

    it('treats an empty/whitespace-only import as nothing added', () => {
        const old = '||a.com^';
        const result = mergeImportedRules(old, '   \n\n  ');
        expect(result.addedCount).toBe(0);
        expect(result.merged).toBe(old);
    });

    it('preserves existing blank lines in the old rules verbatim', () => {
        const old = '||a.com^\n\n! comment\n||b.com^';
        const result = mergeImportedRules(old, '||c.com^');
        expect(result.merged).toBe('||a.com^\n\n! comment\n||b.com^\n||c.com^');
    });

    it('handles \r\n line endings in the imported file', () => {
        const result = mergeImportedRules('||a.com^', '||b.com^\r\n||a.com^\r\n||c.com^');
        expect(result.merged).toBe('||a.com^\n||b.com^\n||c.com^');
        expect(result.addedCount).toBe(2);
    });

    it('compares rules case-sensitively (||A.com^ is not a duplicate of ||a.com^)', () => {
        const result = mergeImportedRules('||a.com^', '||A.com^');
        expect(result.addedCount).toBe(1);
        expect(result.merged).toBe('||a.com^\n||A.com^');
    });
});
