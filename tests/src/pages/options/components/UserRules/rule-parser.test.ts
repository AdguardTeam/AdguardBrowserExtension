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
    parseRuleLines,
    parseLine,
    setRuleDisabled,
    classifyRule,
    RuleIconType,
    groupLines,
    filterGroups,
    deleteLinesFromRules,
    insertLinesIntoRules,
    getInlineEditorPrefix,
    getInlineEditorGroupSeed,
    serializeCommentDraft,
    serializeRuleDraft,
    replaceGroupLinesInRules,
    captureDeletedBlock,
    createPendingDeletedBlock,
    restoreDeletedBlockWithAnchor,
    restorePendingDeletedBlock,
    isInlineDraftUnchanged,
} from '../../../../../../Extension/src/pages/options/components/UserRules/rule-parser';

/**
 * Mirrors the `displayText` computation in `parseLine`: strips the `!off `
 * disabled marker or the leading comment marker (`!`/`#`) so tests build
 * `ParsedRuleLine` fixtures the same way the parser does.
 */
const computeDisplayText = (text: string, isComment: boolean) => {
    if (text.startsWith('!off ')) {
        return text.slice(5).trimStart();
    }
    if (isComment) {
        return text.replace(/^[!#]\s*/, '');
    }
    return text;
};

describe('parseRuleLines', () => {
    it('returns no lines for empty or whitespace-only input', () => {
        expect(parseRuleLines('')).toHaveLength(0);
        expect(parseRuleLines('  \n  \n\t')).toHaveLength(0);
    });

    it('trims leading/trailing whitespace before display', () => {
        const [line] = parseRuleLines('   ||example.org^   ');
        expect(line!.trimmedText).toBe('||example.org^');
    });

    it('splits on \\n, \\r\\n and \\r', () => {
        const lines = parseRuleLines('||a.com^\r\n||b.com^\r||c.com^');
        expect(lines).toHaveLength(3);
    });

    it('parses comments and rules as independent flat items', () => {
        const input = ['! one', '! two', '||example.org^'].join('\n');
        const lines = parseRuleLines(input);
        expect(lines).toHaveLength(3);
        expect(lines[0]!.trimmedText).toBe('! one');
        expect(lines[0]!.isComment).toBe(true);
        expect(lines[1]!.trimmedText).toBe('! two');
        expect(lines[1]!.isComment).toBe(true);
        expect(lines[2]!.trimmedText).toBe('||example.org^');
        expect(lines[2]!.isComment).toBe(false);
    });

    it('skips blank lines', () => {
        const input = ['! header', '', '||example.org^'].join('\n');
        const lines = parseRuleLines(input);
        expect(lines).toHaveLength(2);
        expect(lines[0]!.trimmedText).toBe('! header');
        expect(lines[1]!.trimmedText).toBe('||example.org^');
    });

    it('marks disabled (!off) rules as disabled', () => {
        const input = ['!off ||example.org^', '! a normal comment', '||example.com^', '!offer special'].join('\n');
        const lines = parseRuleLines(input);
        // A disabled rule is a rule, not a comment, and the marker is stripped for display.
        expect(lines[0]!.isDisabled).toBe(true);
        expect(lines[0]!.isComment).toBe(false);
        expect(lines[0]!.displayText).toBe('||example.org^');
        expect(lines[1]!.isDisabled).toBe(false);
        expect(lines[1]!.isComment).toBe(true);
        expect(lines[2]!.isDisabled).toBe(false);
        // `!offer` must not be treated as a disabled rule (boundary check).
        expect(lines[3]!.isDisabled).toBe(false);
        expect(lines[3]!.isComment).toBe(true);
    });

    it('does NOT treat spaced variants as disabled rules', () => {
        const input = ['! off ||example.org^', '!  off ||example.com^'].join('\n');
        const lines = parseRuleLines(input);
        // Spaced variants are regular comments, not disabled rules.
        expect(lines[0]!.isDisabled).toBe(false);
        expect(lines[0]!.isComment).toBe(true);
        expect(lines[0]!.displayText).toBe('off ||example.org^');
        expect(lines[1]!.isDisabled).toBe(false);
        expect(lines[1]!.isComment).toBe(true);
        expect(lines[1]!.displayText).toBe('off ||example.com^');
    });

    it('still recognizes a strict !off marker with trailing space', () => {
        const input = '!off ||example.org^';
        const [line] = parseRuleLines(input);
        expect(line!.isDisabled).toBe(true);
        expect(line!.isComment).toBe(false);
        expect(line!.displayText).toBe('||example.org^');
    });

    it('treats bare `!off` (no trailing space) as a comment, not a disabled rule', () => {
        // `!off` alone has no rule content to disable, and lacks the required
        // trailing space, so it is a regular comment.
        const [line] = parseRuleLines('!off');
        expect(line!.isDisabled).toBe(false);
        expect(line!.isComment).toBe(true);
    });

    it('strips the leading marker from comment display text', () => {
        const lines = parseRuleLines(['! a regular comment', '#  a hosts comment'].join('\n'));
        expect(lines[0]!.isComment).toBe(true);
        expect(lines[0]!.displayText).toBe('a regular comment');
        expect(lines[1]!.isComment).toBe(true);
        expect(lines[1]!.displayText).toBe('a hosts comment');
    });

    it('treats a `#` line as a comment only when it is not a cosmetic rule', () => {
        const input = [
            '# this is a hosts-style comment',
            'example.org##.banner',
            '##.ad',
            '#@#.ad',
            '#%#//scriptlet("set-constant", "foo", "true")',
        ].join('\n');
        const lines = parseRuleLines(input);
        // Hashmark comment.
        expect(lines[0]!.isComment).toBe(true);
        expect(lines[0]!.displayText).toBe('this is a hosts-style comment');
        // Cosmetic rules must not be treated as comments.
        expect(lines[1]!.isComment).toBe(false);
        expect(lines[2]!.isComment).toBe(false);
        expect(lines[3]!.isComment).toBe(false);
        expect(lines[4]!.isComment).toBe(false);
    });

    it('handles 1000 rules without error', () => {
        const rules = Array.from({ length: 1000 }, (_, i) => `||r-${i}.com^`).join('\n');
        expect(parseRuleLines(rules)).toHaveLength(1000);
    });
});

describe('classifyRule', () => {
    it('classifies exclusion rules (starting with @@) even with caret content', () => {
        expect(classifyRule('@@||example.org^')).toBe(RuleIconType.Exclusion);
        expect(classifyRule('@@||example.org^$third-party')).toBe(RuleIconType.Exclusion);
    });

    it('classifies custom rules (characters after ^)', () => {
        expect(classifyRule('||example.org^$dnsrewrite=example1.org')).toBe(RuleIconType.Custom);
    });

    it('classifies blocking rules (caret is last char or no caret)', () => {
        expect(classifyRule('||example.org^')).toBe(RuleIconType.Blocking);
        expect(classifyRule('||example.org')).toBe(RuleIconType.Blocking);
    });
});

describe('groupLines', () => {
    const makeLine = (text: string, lineIndex = 0, isComment = false) => {
        const displayText = computeDisplayText(text, isComment);
        return {
            text,
            trimmedText: text,
            displayText,
            lowerDisplayText: displayText.toLowerCase(),
            isComment,
            isDisabled: text.startsWith('!off'),
            isBlank: false,
            lineIndex,
        };
    };

    it('groups consecutive comment lines into a single block', () => {
        const lines = [
            makeLine('! header', 0, true),
            makeLine('! description', 1, true),
            makeLine('||example.org^', 2),
        ];
        const groups = groupLines(lines);
        expect(groups).toHaveLength(2);
        expect(groups[0]!.isComment).toBe(true);
        expect(groups[0]!.lines).toHaveLength(2);
        expect(groups[0]!.lines[0]!.trimmedText).toBe('! header');
        expect(groups[0]!.lines[1]!.trimmedText).toBe('! description');
        expect(groups[1]!.isComment).toBe(false);
        expect(groups[1]!.lines[0]!.trimmedText).toBe('||example.org^');
    });

    it('keeps each rule as its own single-line group', () => {
        const lines = [
            makeLine('||a.com^', 0),
            makeLine('||b.com^', 1),
            makeLine('||c.com^', 2),
        ];
        const groups = groupLines(lines);
        expect(groups).toHaveLength(3);
        groups.forEach((g) => {
            expect(g.isComment).toBe(false);
            expect(g.lines).toHaveLength(1);
        });
    });

    it('splits a comment block around a disabled (!off) rule', () => {
        const lines = [
            makeLine('! header', 0, true),
            makeLine('!off ||example.org^', 1),
            makeLine('! footer', 2, true),
        ];
        const groups = groupLines(lines);
        expect(groups).toHaveLength(3);
        expect(groups[0]!.isComment).toBe(true);
        expect(groups[1]!.isComment).toBe(false);
        expect(groups[1]!.lines[0]!.isDisabled).toBe(true);
        expect(groups[1]!.lines).toHaveLength(1);
        expect(groups[2]!.isComment).toBe(true);
    });

    it('splits comment blocks separated by rules', () => {
        const lines = [
            makeLine('! block 1', 0, true),
            makeLine('||example.org^', 1),
            makeLine('! block 2', 2, true),
            makeLine('! still block 2', 3, true),
        ];
        const groups = groupLines(lines);
        expect(groups).toHaveLength(3);
        expect(groups[0]!.isComment).toBe(true);
        expect(groups[0]!.lines).toHaveLength(1);
        expect(groups[1]!.isComment).toBe(false);
        expect(groups[2]!.isComment).toBe(true);
        expect(groups[2]!.lines).toHaveLength(2);
    });

    it('returns empty array for empty input', () => {
        expect(groupLines([])).toHaveLength(0);
    });

    it('groups consecutive `!` and `#` comments into a single block', () => {
        const lines = [
            makeLine('! regular comment', 0, true),
            makeLine('# hosts comment', 1, true),
            makeLine('||example.org^', 2),
        ];
        const groups = groupLines(lines);
        expect(groups).toHaveLength(2);
        expect(groups[0]!.isComment).toBe(true);
        expect(groups[0]!.lines).toHaveLength(2);
        expect(groups[1]!.isComment).toBe(false);
    });

    it('uses first comment line index as group lineIndex', () => {
        const lines = [
            makeLine('||a.com^', 5),
            makeLine('! c1', 6, true),
            makeLine('! c2', 7, true),
        ];
        const groups = groupLines(lines);
        expect(groups[1]!.lineIndex).toBe(6);
    });
});

describe('filterGroups', () => {
    const makeGroup = (
        texts: string[],
        isComment: boolean,
        lineIndex = 0,
    ) => ({
        lines: texts.map((t, i) => {
            const displayText = computeDisplayText(t, isComment);
            return {
                text: t,
                trimmedText: t,
                displayText,
                lowerDisplayText: displayText.toLowerCase(),
                isComment,
                isDisabled: t.startsWith('!off'),
                isBlank: false,
                lineIndex: lineIndex + i,
            };
        }),
        isComment,
        lineIndex,
    });

    it('returns all groups when search term is empty', () => {
        const groups = [makeGroup(['||a.com^'], false)];
        expect(filterGroups(groups, '')).toHaveLength(1);
    });

    it('filters to only matching groups', () => {
        const groups = [
            makeGroup(['||example.com^'], false),
            makeGroup(['||other.com^'], false),
            makeGroup(['! example comment'], true),
        ];
        const result = filterGroups(groups, 'example');
        expect(result).toHaveLength(2);
        expect(result[0]!.lines[0]!.trimmedText).toBe('||example.com^');
        expect(result[1]!.lines[0]!.trimmedText).toBe('! example comment');
    });

    it('keeps entire comment block if any line matches', () => {
        const groups = [
            makeGroup(['! header', '! Block ads', '! footer'], true, 0),
            makeGroup(['||other.com^'], false, 3),
        ];
        const result = filterGroups(groups, 'ads');
        expect(result).toHaveLength(1);
        expect(result[0]!.isComment).toBe(true);
        expect(result[0]!.lines).toHaveLength(3);
    });

    it('performs case-insensitive matching', () => {
        const groups = [makeGroup(['||EXAMPLE.com^'], false)];
        expect(filterGroups(groups, 'example')).toHaveLength(1);
    });

    it('keeps the groups accepted by alwaysKeep in document order', () => {
        const groups = [
            makeGroup(['||kept.org^'], false, 0),
            makeGroup(['||example.com^'], false, 1),
            makeGroup(['||other.org^'], false, 2),
        ];
        const result = filterGroups(groups, 'example', (group) => group.lineIndex === 0);
        expect(result.map((group) => group.lineIndex)).toEqual([0, 1]);
    });

    it('ignores alwaysKeep when the search term is empty', () => {
        const groups = [makeGroup(['||a.com^'], false), makeGroup(['||b.com^'], false, 1)];
        expect(filterGroups(groups, '  ', () => false)).toHaveLength(2);
    });

    it('does not match the stripped `!off` marker of a disabled rule', () => {
        // The `!off` marker is hidden in the row, so a search for `off` must not
        // match a disabled rule (otherwise the row shows no visible highlight).
        const groups = [makeGroup(['!off ||example.org^'], false)];
        expect(filterGroups(groups, 'off')).toHaveLength(0);
        // The visible content is still searchable.
        expect(filterGroups(groups, 'example')).toHaveLength(1);
    });

    it('does not match the stripped comment marker of a comment line', () => {
        // The `!`/`#` markers are hidden in the row, so searching for them must
        // not match comments that only contain the marker as matching text.
        const regularComment = [makeGroup(['! comment'], true)];
        const hostsComment = [makeGroup(['# comment'], true)];
        expect(filterGroups(regularComment, '!')).toHaveLength(0);
        expect(filterGroups(hostsComment, '#')).toHaveLength(0);
        // The visible content is still searchable.
        expect(filterGroups(regularComment, 'comment')).toHaveLength(1);
    });
});

describe('deleteLinesFromRules', () => {
    it('removes a single line by index and rejoins with \\n', () => {
        expect(deleteLinesFromRules('||a.com^\n||b.com^\n||c.com^', [1]))
            .toBe('||a.com^\n||c.com^');
    });

    it('removes multiple lines (a comment block) as a unit', () => {
        expect(deleteLinesFromRules('! c1\n! c2\n||a.com^', [0, 1]))
            .toBe('||a.com^');
    });

    it('preserves blank lines that are not targeted', () => {
        expect(deleteLinesFromRules('||a.com^\n\n||b.com^', [0]))
            .toBe('\n||b.com^');
    });

    it('preserves original CRLF/CR terminators of the kept lines', () => {
        expect(deleteLinesFromRules('||a.com^\r\n||b.com^\r||c.com^', [1]))
            .toBe('||a.com^\r\n||c.com^');
    });

    it('returns the input unchanged when no indices are given', () => {
        expect(deleteLinesFromRules('||a.com^\n||b.com^', [])).toBe('||a.com^\n||b.com^');
    });

    it('removing the only line yields an empty string', () => {
        expect(deleteLinesFromRules('||a.com^', [0])).toBe('');
    });
});

describe('setRuleDisabled', () => {
    it('adds the !off marker to disable an enabled rule', () => {
        const text = '||example.org^\n||other.com^';
        const result = setRuleDisabled(text, 0, true);
        expect(result).toBe('!off ||example.org^\n||other.com^');
    });

    it('removes the !off marker to enable a disabled rule', () => {
        const text = '!off ||example.org^\n||other.com^';
        const result = setRuleDisabled(text, 0, false);
        expect(result).toBe('||example.org^\n||other.com^');
    });

    it('is idempotent: disabling an already-disabled rule is a no-op', () => {
        const text = '!off ||example.org^';
        expect(setRuleDisabled(text, 0, true)).toBe('!off ||example.org^');
    });

    it('is idempotent: enabling an already-enabled rule is a no-op', () => {
        const text = '||example.org^';
        expect(setRuleDisabled(text, 0, false)).toBe('||example.org^');
    });

    it('preserves other lines, comments and blank lines exactly', () => {
        const text = '! header\n\n||a.com^\n!off ||b.com^\n||c.com^';
        const result = setRuleDisabled(text, 2, true);
        expect(result).toBe('! header\n\n!off ||a.com^\n!off ||b.com^\n||c.com^');
    });

    it('preserves \\r\\n line endings on the toggled line and elsewhere', () => {
        const text = '||a.com^\r\n||b.com^\r\n';
        const result = setRuleDisabled(text, 0, true);
        expect(result).toBe('!off ||a.com^\r\n||b.com^\r\n');
    });

    it('strips leading whitespace from the toggled line when disabling', () => {
        const text = '   ||example.org^';
        expect(setRuleDisabled(text, 0, true)).toBe('!off ||example.org^');
    });

    it('removes only the strict marker, leaving a spaced variant comment untouched', () => {
        // '! off ||x^' is a comment under strict detection; enabling must NOT mutate it.
        const text = '! off ||x^';
        expect(setRuleDisabled(text, 0, false)).toBe('! off ||x^');
    });

    it('returns the original text when lineIndex is out of range', () => {
        const text = '||a.com^';
        expect(setRuleDisabled(text, 5, true)).toBe('||a.com^');
    });
});

/**
 * Structural signature of the rendered groups: per-group line index + kind +
 * line count. The virtualizer uses `group.lineIndex` as its content-identity
 * `getItemKey`, so the size cache maps heights to the correct row across search
 * filter changes. This signature verifies the parser-level invariant that makes
 * that work: toggling a rule (adding/removing the `!off` marker) changes only
 * the line text — never line indices, group kinds, or line counts — so the
 * cache correctly retains each row's measured height.
 */
const structuralSignature = (
    groups: ReturnType<typeof groupLines>,
    searchTerm = '',
) => filterGroups(groups, searchTerm)
    .map((g) => `${g.lineIndex}:${g.isComment ? 'c' : 'r'}:${g.lines.length}`)
    .join('|');

describe('toggle preserves list structure (virtualizer cache stays valid)', () => {
    it('disabling then enabling a rule leaves the signature unchanged', () => {
        const text = '! header line one\n! header line two\n||example.org^\n||block.com^';
        const base = structuralSignature(groupLines(parseRuleLines(text)));

        const disabled = setRuleDisabled(text, 3, true);
        expect(disabled).not.toBe(text);
        expect(structuralSignature(groupLines(parseRuleLines(disabled)))).toBe(base);

        const reEnabled = setRuleDisabled(disabled, 3, false);
        expect(reEnabled).toBe(text);
        expect(structuralSignature(groupLines(parseRuleLines(reEnabled)))).toBe(base);
    });

    it('toggling the FIRST rule (right below a comment header) keeps the signature', () => {
        // Reproduces the reported scenario: first rule after a long comment.
        const text = '! header\n! more header\n||example.org^\n||second.com^';
        const base = structuralSignature(groupLines(parseRuleLines(text)));

        const toggled = setRuleDisabled(text, 2, true);
        expect(structuralSignature(groupLines(parseRuleLines(toggled)))).toBe(base);
    });

    it('toggling a rule with \\r\\n line endings keeps the signature', () => {
        const text = '! header\r\n||example.org^\r\n||second.com^\r\n';
        const base = structuralSignature(groupLines(parseRuleLines(text)));

        const toggled = setRuleDisabled(text, 1, true);
        expect(structuralSignature(groupLines(parseRuleLines(toggled)))).toBe(base);
    });

    it('deleting or searching changes the signature (contrast: real relayout triggers)', () => {
        const text = '! header\n||example.org^\n||block.com^';
        const base = structuralSignature(groupLines(parseRuleLines(text)));

        // Deleting the first rule shifts every subsequent line index.
        const deleted = '! header\n||block.com^';
        expect(structuralSignature(groupLines(parseRuleLines(deleted)))).not.toBe(base);

        // Searching narrows the visible groups (count/indices change).
        expect(structuralSignature(groupLines(parseRuleLines(text)), 'block'))
            .not.toBe(base);
    });
});

describe('insertLinesIntoRules', () => {
    it('re-inserts a single deleted line at its original position', () => {
        // After deleting line 1 from [a, b, c], current text is [a, c].
        // Re-inserting b at index 1 restores [a, b, c].
        expect(insertLinesIntoRules('||a.com^\n||c.com^', [{ lineIndex: 1, text: '||b.com^' }]))
            .toBe('||a.com^\n||b.com^\n||c.com^');
    });

    it('re-inserts a deleted line at the beginning', () => {
        expect(insertLinesIntoRules('||b.com^\n||c.com^', [{ lineIndex: 0, text: '||a.com^' }]))
            .toBe('||a.com^\n||b.com^\n||c.com^');
    });

    it('re-inserts a deleted line at the end', () => {
        expect(insertLinesIntoRules('||a.com^\n||b.com^', [{ lineIndex: 2, text: '||c.com^' }]))
            .toBe('||a.com^\n||b.com^\n||c.com^');
    });

    it('re-inserts into empty rules text', () => {
        expect(insertLinesIntoRules('', [{ lineIndex: 0, text: '||a.com^' }]))
            .toBe('||a.com^');
    });

    it('preserves gaps when re-inserting into empty rules text', () => {
        expect(insertLinesIntoRules('', [
            { lineIndex: 0, text: '! p' },
            { lineIndex: 2, text: '! q' },
        ])).toBe('! p\n\n! q');
    });

    it('re-inserts a multi-line comment block as a unit', () => {
        // Original: [! c1, ! c2, ||a.com^]; deleted [0, 1]; current: [||a.com^]
        expect(insertLinesIntoRules('||a.com^', [
            { lineIndex: 0, text: '! c1' },
            { lineIndex: 1, text: '! c2' },
        ])).toBe('! c1\n! c2\n||a.com^');
    });

    it('only restores the given lines, not a full snapshot', () => {
        // Scenario: original [a, b, c]; delete b (index 1); then delete c (index 2).
        // After both deletes, current text is [a]. Undoing the FIRST delete (b)
        // should only restore b, not c.
        expect(insertLinesIntoRules('||a.com^', [{ lineIndex: 1, text: '||b.com^' }]))
            .toBe('||a.com^\n||b.com^');
    });

    it('undoing the second delete after the first was already undone', () => {
        // Original [a, b, c]; delete b (index 1) -> [a, c]; undo b -> [a, b, c].
        // Now undo c (original index 2): current text is [a, b, c], insert at 2.
        expect(insertLinesIntoRules('||a.com^\n||b.com^\n||c.com^', [{ lineIndex: 2, text: '||c.com^' }]))
            .toBe('||a.com^\n||b.com^\n||c.com^\n||c.com^');
    });

    it('returns the input unchanged when no lines are given', () => {
        expect(insertLinesIntoRules('||a.com^\n||b.com^', [])).toBe('||a.com^\n||b.com^');
    });

    it('handles insertion when original index exceeds current line count', () => {
        // Current text has 1 line; inserting at index 5 appends at the end.
        expect(insertLinesIntoRules('||a.com^', [{ lineIndex: 5, text: '||b.com^' }]))
            .toBe('||a.com^\n||b.com^');
    });

    it('is the inverse of deleteLinesFromRules for a single line', () => {
        const original = '||a.com^\n||b.com^\n||c.com^';
        const deleted = deleteLinesFromRules(original, [1]);
        const restored = insertLinesIntoRules(deleted, [{ lineIndex: 1, text: '||b.com^' }]);
        expect(restored).toBe(original);
    });

    it('is the inverse of deleteLinesFromRules for a comment block', () => {
        const original = '! c1\n! c2\n||a.com^';
        const deleted = deleteLinesFromRules(original, [0, 1]);
        const restored = insertLinesIntoRules(deleted, [
            { lineIndex: 0, text: '! c1' },
            { lineIndex: 1, text: '! c2' },
        ]);
        expect(restored).toBe(original);
    });

    it('preserves CRLF terminators when inserting in the middle', () => {
        expect(insertLinesIntoRules('||a.com^\r\n||c.com^', [{ lineIndex: 1, text: '||b.com^' }]))
            .toBe('||a.com^\r\n||b.com^\r\n||c.com^');
    });

    it('preserves CRLF terminators when appending', () => {
        expect(insertLinesIntoRules('||a.com^\r\n||b.com^', [{ lineIndex: 2, text: '||c.com^' }]))
            .toBe('||a.com^\r\n||b.com^\r\n||c.com^');
    });

    it('preserves CRLF terminators when prepending', () => {
        expect(insertLinesIntoRules('||b.com^\r\n||c.com^', [{ lineIndex: 0, text: '||a.com^' }]))
            .toBe('||a.com^\r\n||b.com^\r\n||c.com^');
    });

    it('does not rewrite other lines\' terminators when growing a block', () => {
        expect(insertLinesIntoRules('! first\r\n||a.com^', [{ lineIndex: 1, text: '! second' }]))
            .toBe('! first\r\n! second\r\n||a.com^');
    });
});

describe('pending delete restoration', () => {
    /**
     * Models the list's delete/undo bookkeeping: deletes a parsed group from
     * the visible text and keeps the pending block, then restores it the same
     * way the Undo snackbar does.
     *
     * @param original Original rules text.
     * @param steps Delete (by group index) and undo (by deletion id) steps.
     *
     * @returns Rules text after all steps.
     *
     * @throws If a step references a missing group or pending block.
     */
    const applySteps = (
        original: string,
        steps: ({ deleteGroup: number } | { undo: number })[],
    ): string => {
        let rules = original;
        let nextId = 0;
        const pendingBlocks: (ReturnType<typeof createPendingDeletedBlock> & { id: number })[] = [];

        for (const step of steps) {
            if ('deleteGroup' in step) {
                const group = groupLines(parseRuleLines(rules))[step.deleteGroup];
                if (!group) {
                    throw new Error(`No group at index ${step.deleteGroup}`);
                }
                const block = createPendingDeletedBlock(rules, group, pendingBlocks);
                pendingBlocks.push({ ...block, id: nextId });
                nextId += 1;
                rules = deleteLinesFromRules(rules, group.lines.map((line) => line.lineIndex));
            } else {
                const block = pendingBlocks.find((candidate) => candidate.id === step.undo);
                if (!block) {
                    throw new Error(`No pending block ${step.undo}`);
                }
                rules = restorePendingDeletedBlock(rules, pendingBlocks, block);
                pendingBlocks.splice(pendingBlocks.indexOf(block), 1);
            }
        }

        return rules;
    };

    it.each([
        {
            title: 'restores deletes undone in delete order',
            original: '||a.com^\n||b.com^\n||c.com^',
            steps: [{ deleteGroup: 1 }, { deleteGroup: 1 }, { undo: 0 }, { undo: 1 }],
        },
        {
            title: 'restores deletes undone in reverse order',
            original: '||a.com^\n||b.com^\n||c.com^',
            steps: [{ deleteGroup: 2 }, { deleteGroup: 1 }, { undo: 0 }, { undo: 1 }],
        },
        {
            title: 'restores a deleted first rule before a deleted second one',
            original: '||a.com^\n||b.com^\n||c.com^',
            steps: [{ deleteGroup: 0 }, { deleteGroup: 0 }, { undo: 0 }, { undo: 1 }],
        },
        {
            title: 'restores three stacked deletes in delete order',
            original: '||a.com^\n||b.com^\n||c.com^\n||d.com^',
            steps: [
                { deleteGroup: 1 },
                { deleteGroup: 1 },
                { deleteGroup: 1 },
                { undo: 0 },
                { undo: 1 },
                { undo: 2 },
            ],
        },
        {
            title: 'restores three stacked deletes out of order',
            original: '||a.com^\n||b.com^\n||c.com^\n||d.com^',
            steps: [
                { deleteGroup: 1 },
                { deleteGroup: 1 },
                { deleteGroup: 1 },
                { undo: 1 },
                { undo: 0 },
                { undo: 2 },
            ],
        },
        {
            title: 'restores a block that was not last before a surviving rule',
            original: '||a.com^\n||b.com^\n||c.com^\n||d.com^',
            steps: [
                { deleteGroup: 1 },
                { deleteGroup: 1 },
                { undo: 1 },
                { undo: 0 },
            ],
        },
        {
            title: 'maps each comment line when a deleted rule merged the block',
            original: '! a\n||r.com^\n! b\n||z.com^',
            steps: [
                { deleteGroup: 1 },
                { deleteGroup: 0 },
                { undo: 1 },
                { undo: 0 },
            ],
        },
        {
            title: 'keeps a trailing newline',
            original: '||a.com^\n||b.com^\n',
            steps: [{ deleteGroup: 1 }, { undo: 0 }],
        },
        {
            title: 'restores a sole comment block with a blank line from empty text',
            original: '! p\n\n! q',
            steps: [{ deleteGroup: 0 }, { undo: 0 }],
        },
        {
            title: 'restores stacked deletes with lines after them from empty text',
            original: '||r1.com^\n\n||r3.com^\n||r4.com^',
            steps: [
                { deleteGroup: 2 },
                { deleteGroup: 0 },
                { deleteGroup: 0 },
                { undo: 0 },
                { undo: 1 },
                { undo: 2 },
            ],
        },
        {
            title: 'restores blank lines inside a comment block',
            original: 'x.com\n! p\n\n! q',
            steps: [{ deleteGroup: 1 }, { undo: 0 }],
        },
        {
            title: 'restores a deleted first rule after its blank line',
            original: '||a.com^\n\n||b.com^',
            steps: [{ deleteGroup: 0 }, { undo: 0 }],
        },
        {
            title: 'restores a deleted last rule before its blank line',
            original: '||a.com^\n\n||b.com^',
            steps: [{ deleteGroup: 1 }, { undo: 0 }],
        },
        {
            title: 'preserves CRLF terminators',
            original: '||a.com^\r\n||b.com^\r\n||c.com^',
            steps: [{ deleteGroup: 1 }, { undo: 0 }],
        },
    ])('$title', ({ original, steps }) => {
        expect(applySteps(original, steps)).toBe(original);
    });
});

describe('deleted block anchor fallback', () => {
    /**
     * Deletes the group at the given index and restores it with the text-based
     * anchor, used after the list unmounted.
     *
     * @param original Original rules text.
     * @param groupIndex Index of the group to delete.
     *
     * @returns Restored rules text.
     */
    const deleteAndRestoreWithAnchor = (original: string, groupIndex: number): string => {
        const group = groupLines(parseRuleLines(original))[groupIndex]!;
        const captured = captureDeletedBlock(original, group);
        const deleted = deleteLinesFromRules(
            original,
            group.lines.map((line) => line.lineIndex),
        );

        return restoreDeletedBlockWithAnchor(deleted, captured);
    };

    it.each([
        {
            title: 'restores a trailing newline',
            original: '||a.com^\n||b.com^\n',
            groupIndex: 1,
        },
        {
            title: 'restores blank lines inside a comment block',
            original: 'x.com\n! p\n\n! q',
            groupIndex: 1,
        },
        {
            title: 'restores a deleted first rule after its blank line',
            original: '||a.com^\n\n||b.com^',
            groupIndex: 0,
        },
        {
            title: 'restores a deleted last rule before its blank line',
            original: '||a.com^\n\n||b.com^',
            groupIndex: 1,
        },
        {
            title: 'preserves CRLF terminators',
            original: '||a.com^\r\n||b.com^\r\n||c.com^',
            groupIndex: 1,
        },
    ])('$title', ({ original, groupIndex }) => {
        expect(deleteAndRestoreWithAnchor(original, groupIndex)).toBe(original);
    });

    it('restores at the top when no rules remain instead of padding blanks', () => {
        const original = '||a.com^\n||b.com^\n||c.com^\n||d.com^';
        const group = groupLines(parseRuleLines(original))[3]!;
        const captured = captureDeletedBlock(original, group);

        // Delete all left the text empty, so the stale raw index of d must not
        // become three leading blank lines.
        expect(restoreDeletedBlockWithAnchor('', captured)).toBe('||d.com^');
    });
});

describe('isInlineDraftUnchanged', () => {
    it.each([
        ['rule', '||a.com^', '||a.com^', false],
        ['rule with surrounding whitespace', '  ||a.com^  ', '||a.com^', false],
        ['comment with surrounding whitespace', '  comment  ', 'comment', true],
        ['multi-line comment with indented lines', 'first\n  second  ', 'first\nsecond', true],
    ])('treats an untouched %s draft as unchanged', (_title, draft, seed, isComment) => {
        expect(isInlineDraftUnchanged(draft, seed, isComment)).toBe(true);
    });

    it.each([
        ['rule', '||b.com^', '||a.com^', false],
        ['comment', 'edited', 'comment', true],
    ])('detects a real %s edit', (_title, draft, seed, isComment) => {
        expect(isInlineDraftUnchanged(draft, seed, isComment)).toBe(false);
    });
});

describe('getInlineEditorPrefix', () => {
    it('keeps the comment marker and its whitespace', () => {
        const line = parseRuleLines('!   my comment')[0]!;

        expect(getInlineEditorPrefix(line)).toBe('!   ');
    });

    it('keeps a hashmark comment marker', () => {
        const line = parseRuleLines('# my comment')[0]!;

        expect(getInlineEditorPrefix(line)).toBe('# ');
    });

    it('keeps the !off marker for a disabled rule', () => {
        const line = parseRuleLines('!off ||example.com^')[0]!;

        expect(getInlineEditorPrefix(line)).toBe('!off ');
    });

    it('returns an empty prefix for an enabled rule', () => {
        const line = parseRuleLines('||example.com^')[0]!;

        expect(getInlineEditorPrefix(line)).toBe('');
    });
});

describe('getInlineEditorGroupSeed', () => {
    it('joins a comment block\'s displayed lines with newlines', () => {
        const group = groupLines(parseRuleLines('! first\n! second'))[0]!;

        expect(getInlineEditorGroupSeed(group)).toBe('first\nsecond');
    });

    it('returns the displayed text for a rule group', () => {
        const group = groupLines(parseRuleLines('||example.com^'))[0]!;

        expect(getInlineEditorGroupSeed(group)).toBe('||example.com^');
    });

    it('drops the !off marker for a disabled rule group', () => {
        const group = groupLines(parseRuleLines('!off ||example.com^'))[0]!;

        expect(getInlineEditorGroupSeed(group)).toBe('||example.com^');
    });
});

describe('serializeCommentDraft', () => {
    it('keeps each existing line\'s marker and whitespace', () => {
        const group = groupLines(parseRuleLines('! first\n#   second'))[0]!;

        expect(serializeCommentDraft(group, 'one\ntwo')).toEqual(['! one', '#   two']);
    });

    it('prefixes added lines with a hashmark for a hashmark block', () => {
        const group = groupLines(parseRuleLines('# first\n# second'))[0]!;

        expect(serializeCommentDraft(group, 'one\ntwo\nthree')).toEqual(['# one', '# two', '# three']);
    });

    it('prefixes added lines with ! for a regular block', () => {
        const group = groupLines(parseRuleLines('! first'))[0]!;

        expect(serializeCommentDraft(group, 'one\ntwo')).toEqual(['! one', '! two']);
    });

    it('prefixes added lines with the last line marker for a mixed block', () => {
        const group = groupLines(parseRuleLines('! first\n# second'))[0]!;

        expect(serializeCommentDraft(group, 'one\ntwo\nthree')).toEqual(['! one', '# two', '# three']);
    });

    it('prefixes added lines with the block marker without forcing a space', () => {
        const group = groupLines(parseRuleLines('!aaa\n!bbb'))[0]!;

        expect(serializeCommentDraft(group, 'one\ntwo\nthree')).toEqual(['!one', '!two', '!three']);
    });

    it('prefixes added lines of a hashmark block without forcing a space', () => {
        const group = groupLines(parseRuleLines('#aaa\n#bbb'))[0]!;

        expect(serializeCommentDraft(group, 'one\ntwo\nthree')).toEqual(['#one', '#two', '#three']);
    });

    it('keeps the block spacing when adding a line to a spaced block', () => {
        const group = groupLines(parseRuleLines('!   first'))[0]!;

        expect(serializeCommentDraft(group, 'one\ntwo')).toEqual(['!   one', '!   two']);
    });

    it('prefixes added lines with the last line spacing when the last line has no space', () => {
        const group = groupLines(parseRuleLines('! d\n!dd'))[0]!;

        expect(serializeCommentDraft(group, 'd\ndd\nx')).toEqual(['! d', '!dd', '!x']);
    });

    it('prefixes added lines with the last line spacing when the last line is spaced', () => {
        const group = groupLines(parseRuleLines('!dd\n! d'))[0]!;

        expect(serializeCommentDraft(group, 'dd\nd\nx')).toEqual(['!dd', '! d', '! x']);
    });

    it('turns empty draft lines into bare comments', () => {
        const group = groupLines(parseRuleLines('! first'))[0]!;

        expect(serializeCommentDraft(group, 'one\n')).toEqual(['! one', '!']);
    });

    it('keeps each original marker when a line is inserted above others', () => {
        // Markers must follow their lines, not their positions: inserting a
        // line above `! first` / `# second` must not turn `first` into a
        // hashmark comment.
        const group = groupLines(parseRuleLines('! first\n# second'))[0]!;

        expect(serializeCommentDraft(group, 'new\nfirst\nsecond'))
            .toEqual(['# new', '! first', '# second']);
    });

    it('keeps the marker of a line that moves up after a deletion', () => {
        const group = groupLines(parseRuleLines('! first\n# second'))[0]!;

        expect(serializeCommentDraft(group, 'second')).toEqual(['# second']);
    });

    it('keeps markers attached to their lines when lines are reordered', () => {
        const group = groupLines(parseRuleLines('! first\n# second'))[0]!;

        expect(serializeCommentDraft(group, 'second\nfirst'))
            .toEqual(['# second', '! first']);
    });

    it('gives a reworded line the first unclaimed original marker', () => {
        // `second` claims its own marker in the first pass; the reworded line
        // then takes the first marker left unclaimed.
        const group = groupLines(parseRuleLines('! first\n# second'))[0]!;

        expect(serializeCommentDraft(group, 'first edited\nsecond'))
            .toEqual(['! first edited', '# second']);
    });

    it('takes the first unclaimed marker when the line it replaced is gone', () => {
        // `a` is deleted and `b` is reworded: the only draft line takes the
        // marker that belonged to `a`, not the marker of `b`.
        const group = groupLines(parseRuleLines('! a\n# b'))[0]!;

        expect(serializeCommentDraft(group, 'B')).toEqual(['! B']);
    });

    it('matches duplicate texts to their own occurrences in order', () => {
        const group = groupLines(parseRuleLines('! same\n# same'))[0]!;

        expect(serializeCommentDraft(group, 'same\nsame')).toEqual(['! same', '# same']);
    });

    it('falls back to the ! marker when a hashmark line would become a cosmetic rule', () => {
        const group = groupLines(parseRuleLines('# note'))[0]!;

        expect(serializeCommentDraft(group, 'see example.org##.banner'))
            .toEqual(['! see example.org##.banner']);
    });

    it('falls back to a spaced ! marker when a line would become a disabled rule', () => {
        const group = groupLines(parseRuleLines('!aaa\n!bbb'))[0]!;

        expect(serializeCommentDraft(group, 'aaa\noff topic'))
            .toEqual(['!aaa', '! off topic']);
    });

    it('never serializes a line that parses as a rule', () => {
        const group = groupLines(parseRuleLines('# note'))[0]!;
        const lines = serializeCommentDraft(group, 'see example.org##.banner\noff topic');

        for (const line of lines) {
            expect(parseLine(line, 0).isComment).toBe(true);
        }
    });
});

describe('serializeRuleDraft', () => {
    it('keeps the !off marker for a disabled rule', () => {
        const line = parseRuleLines('!off ||example.com^')[0]!;

        expect(serializeRuleDraft(line, '||other.com^')).toBe('!off ||other.com^');
    });

    it('keeps an empty prefix for a regular rule', () => {
        const line = parseRuleLines('||example.com^')[0]!;

        expect(serializeRuleDraft(line, '  ||other.com^  ')).toBe('||other.com^');
    });
});

describe('replaceGroupLinesInRules', () => {
    it('replaces every line of a block when the count is unchanged', () => {
        const group = groupLines(parseRuleLines('! first\n! second'))[0]!;

        expect(replaceGroupLinesInRules('! first\n! second\n||a.com^', group, ['! one', '! two']))
            .toBe('! one\n! two\n||a.com^');
    });

    it('adds lines when the draft is longer than the block', () => {
        const group = groupLines(parseRuleLines('! first'))[0]!;

        expect(replaceGroupLinesInRules('! first\n||a.com^', group, ['! one', '! two']))
            .toBe('! one\n! two\n||a.com^');
    });

    it('removes lines when the draft is shorter than the block', () => {
        const group = groupLines(parseRuleLines('! first\n! second'))[0]!;

        expect(replaceGroupLinesInRules('! first\n! second\n||a.com^', group, ['! one']))
            .toBe('! one\n||a.com^');
    });

    it('preserves blank lines between the block\'s comment lines', () => {
        // parseRuleLines drops blank lines, so the group indices are [0, 2].
        const group = groupLines(parseRuleLines('! first\n\n! second'))[0]!;
        expect(group.lines.map((line) => line.lineIndex)).toEqual([0, 2]);

        expect(replaceGroupLinesInRules('! first\n\n! second\n||a.com^', group, ['! one', '! two']))
            .toBe('! one\n\n! two\n||a.com^');
    });

    it('appends added lines at the end of a block that is the last line', () => {
        const group = groupLines(parseRuleLines('! first'))[0]!;

        expect(replaceGroupLinesInRules('! first', group, ['! one', '! two']))
            .toBe('! one\n! two');
    });

    it('preserves CRLF terminators when a block grows', () => {
        const group = groupLines(parseRuleLines('! first\r\n||a.com^'))[0]!;

        expect(replaceGroupLinesInRules('! first\r\n||a.com^', group, ['! one', '! two']))
            .toBe('! one\r\n! two\r\n||a.com^');
    });
});
