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

import {
    appendRule,
    appendRuleSuffix,
    computeRemoveRanges,
    hasUserRules,
    isUserFilterUpdatedEventData,
    mergeImportedRules,
    removeRule,
    UserFilterUpdateOperation,
    type TextRange,
} from '../../../../Extension/src/common/utils/user-rules';

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

describe('appendRule', () => {
    it('appends to an empty list without a leading newline', () => {
        expect(appendRule('', '||a.com^')).toBe('||a.com^');
    });

    it('adds a separator when the text does not end with a newline', () => {
        expect(appendRule('||a.com^', '||b.com^')).toBe('||a.com^\n||b.com^');
    });

    it('does not double the separator when the text ends with a newline', () => {
        expect(appendRule('||a.com^\n', '||b.com^')).toBe('||a.com^\n||b.com^');
    });
});

describe('appendRuleSuffix', () => {
    it('returns the bare rule for an empty list', () => {
        expect(appendRuleSuffix('', '||a.com^')).toBe('||a.com^');
    });

    it('prepends a separator when the text does not end with a newline', () => {
        expect(appendRuleSuffix('||a.com^', '||b.com^')).toBe('\n||b.com^');
    });

    it('does not double the separator when the text ends with a newline', () => {
        expect(appendRuleSuffix('||a.com^\n', '||b.com^')).toBe('||b.com^');
    });

    it('is consistent with appendRule', () => {
        const texts = ['', '||a.com^', '||a.com^\n'];
        for (const text of texts) {
            expect(text + appendRuleSuffix(text, '||b.com^')).toBe(appendRule(text, '||b.com^'));
        }
    });
});

describe('hasUserRules', () => {
    it('returns false for empty and whitespace-only text', () => {
        expect(hasUserRules('')).toBe(false);
        expect(hasUserRules('  \n \n')).toBe(false);
    });

    it('returns true when at least one rule is present', () => {
        expect(hasUserRules('||a.com^')).toBe(true);
        expect(hasUserRules('\n||a.com^\n')).toBe(true);
    });
});

describe('isUserFilterUpdatedEventData', () => {
    it('accepts add/remove with a string ruleText', () => {
        expect(isUserFilterUpdatedEventData({
            operation: UserFilterUpdateOperation.Add,
            ruleText: '||a.com^',
        })).toBe(true);
        expect(isUserFilterUpdatedEventData({
            operation: UserFilterUpdateOperation.Remove,
            ruleText: '||a.com^',
        })).toBe(true);
    });

    it('rejects add/remove without ruleText', () => {
        expect(isUserFilterUpdatedEventData({ operation: UserFilterUpdateOperation.Add })).toBe(false);
        expect(isUserFilterUpdatedEventData({ operation: UserFilterUpdateOperation.Remove })).toBe(false);
    });

    it('rejects unknown operations', () => {
        expect(isUserFilterUpdatedEventData({ operation: 'replace' })).toBe(false);
        expect(isUserFilterUpdatedEventData({ operation: 1 })).toBe(false);
    });

    it('rejects non-object payloads and missing operation', () => {
        expect(isUserFilterUpdatedEventData(null)).toBe(false);
        expect(isUserFilterUpdatedEventData(undefined)).toBe(false);
        expect(isUserFilterUpdatedEventData('set')).toBe(false);
        expect(isUserFilterUpdatedEventData({})).toBe(false);
    });

    it('rejects add/remove with an empty ruleText', () => {
        expect(isUserFilterUpdatedEventData({
            operation: UserFilterUpdateOperation.Add,
            ruleText: '',
        })).toBe(false);
        expect(isUserFilterUpdatedEventData({
            operation: UserFilterUpdateOperation.Remove,
            ruleText: '',
        })).toBe(false);
    });

    it('rejects a non-string ruleText', () => {
        expect(isUserFilterUpdatedEventData({
            operation: UserFilterUpdateOperation.Add,
            ruleText: 42,
        })).toBe(false);
    });

    it('rejects multiline ruleText: line-based granular offsets cannot address it', () => {
        expect(isUserFilterUpdatedEventData({
            operation: UserFilterUpdateOperation.Add,
            ruleText: '||a.com^\n||b.com^',
        })).toBe(false);
        expect(isUserFilterUpdatedEventData({
            operation: UserFilterUpdateOperation.Remove,
            ruleText: '||a.com^\r\n||b.com^',
        })).toBe(false);
    });
});

describe('removeRule', () => {
    it('removes all duplicate occurrences', () => {
        expect(removeRule('||a.com^\n||b.com^\n||a.com^', '||a.com^')).toBe('||b.com^');
    });

    it('removes the only rule leaving an empty string', () => {
        expect(removeRule('||a.com^', '||a.com^')).toBe('');
    });

    it('ignores rules that only partially match a line', () => {
        expect(removeRule('||a.com^$third-party', '||a.com^')).toBe('||a.com^$third-party');
    });

    it('handles CRLF line endings', () => {
        expect(removeRule('||a.com^\r\n||b.com^', '||a.com^')).toBe('||b.com^');
    });
});

/**
 * Applies ranges to the text from last to first, mirroring how the editor
 * consumes {@link computeRemoveRanges}.
 *
 * @param text Original text.
 * @param ranges Ranges to delete.
 *
 * @returns Text with the ranges removed.
 */
const applyRanges = (text: string, ranges: TextRange[]): string => [...ranges]
    .reverse()
    .reduce((acc, { from, to }) => acc.slice(0, from) + acc.slice(to), text);

describe('computeRemoveRanges', () => {
    it('returns no ranges when nothing matches', () => {
        expect(computeRemoveRanges('||a.com^\n||b.com^', '||c.com^')).toEqual([]);
    });

    it('removes the only rule including its trailing newline', () => {
        expect(computeRemoveRanges('||a.com^', '||a.com^')).toEqual([{ from: 0, to: 8 }]);
        expect(applyRanges('||a.com^', computeRemoveRanges('||a.com^', '||a.com^'))).toBe('');
    });

    it('removes the first line together with its newline', () => {
        const text = '||a.com^\n||b.com^';
        expect(applyRanges(text, computeRemoveRanges(text, '||a.com^'))).toBe('||b.com^');
    });

    it('removes a middle line together with the preceding newline', () => {
        const text = '||a.com^\n||b.com^\n||c.com^';
        expect(applyRanges(text, computeRemoveRanges(text, '||b.com^'))).toBe('||a.com^\n||c.com^');
    });

    it('removes the last line together with the preceding newline', () => {
        const text = '||a.com^\n||b.com^';
        expect(applyRanges(text, computeRemoveRanges(text, '||b.com^'))).toBe('||a.com^');
    });

    it('removes consecutive duplicates without leaving empty lines', () => {
        const text = '||a.com^\n||a.com^\n||b.com^';
        expect(applyRanges(text, computeRemoveRanges(text, '||a.com^'))).toBe('||b.com^');
    });

    it('removes non-consecutive duplicates', () => {
        const text = '||a.com^\n||b.com^\n||a.com^';
        expect(applyRanges(text, computeRemoveRanges(text, '||a.com^'))).toBe('||b.com^');
    });

    it('matches removeRule output for a mixed list', () => {
        const text = '||a.com^\n||b.com^\n||a.com^\n||c.com^\n||a.com^';
        expect(applyRanges(text, computeRemoveRanges(text, '||a.com^')))
            .toBe(removeRule(text, '||a.com^'));
    });

    it('handles a trailing newline in the document', () => {
        const text = '||a.com^\n||b.com^\n';
        expect(applyRanges(text, computeRemoveRanges(text, '||b.com^'))).toBe('||a.com^\n');
    });
});
