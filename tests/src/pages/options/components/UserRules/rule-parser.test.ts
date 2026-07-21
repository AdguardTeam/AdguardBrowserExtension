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
    setRuleDisabled,
    classifyRule,
    RuleIconType,
    groupLines,
    filterGroups,
    deleteLinesFromRules,
    insertLinesIntoRules,
    ensureTrailingEmptyLine,
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

describe('ensureTrailingEmptyLine', () => {
    it('returns the empty string unchanged (one blank line to type on)', () => {
        expect(ensureTrailingEmptyLine('')).toBe('');
    });

    it('appends a line terminator when there is none', () => {
        expect(ensureTrailingEmptyLine('||example.org^')).toBe('||example.org^\n');
    });

    it('does not add a second terminator when one already exists', () => {
        // A single trailing newline already starts an empty line below.
        expect(ensureTrailingEmptyLine('||a.com^\n||b.com^\n'))
            .toBe('||a.com^\n||b.com^\n');
    });

    it('collapses several trailing line terminators into one', () => {
        // Regression: previously only the presence of a terminator was checked,
        // leaving extra blank lines and placing the cursor on the wrong line.
        expect(ensureTrailingEmptyLine('||a.com^\n||b.com^\n\n\n'))
            .toBe('||a.com^\n||b.com^\n');
    });

    it('normalises CRLF-only trailing terminators too', () => {
        expect(ensureTrailingEmptyLine('||a.com^\r\n||b.com^\r\n'))
            .toBe('||a.com^\r\n||b.com^\n');
    });

    it('never strips internal line terminators', () => {
        // Regression guard for the regex: without a non-capturing group the
        // alternation `\\r\\n|\\r|\\n+$` matches internal terminators too.
        expect(ensureTrailingEmptyLine('! header\n\n||example.org^\n'))
            .toBe('! header\n\n||example.org^\n');
    });

    it('yields a trailing empty line for every input shape', () => {
        const cases = [
            '',
            'rule1',
            'rule1\nrule2',
            'rule1\nrule2\n',
            'rule1\nrule2\n\n',
            'rule1\r\nrule2\r\n',
        ];
        for (const input of cases) {
            const result = ensureTrailingEmptyLine(input);
            // Either empty (the editor's single blank line) or ends with a
            // line terminator whose following line is empty.
            const endsWithEmptyLine = result.length === 0
                || /(?:\r\n|\r|\n)$/.test(result);
            expect(endsWithEmptyLine, `for input ${JSON.stringify(input)}`).toBe(true);
        }
    });

    it('produced text has exactly one trailing line after splitting', () => {
        const cases = ['||a.com^', '||a.com^\n||b.com^\n\n', '||a.com^\r\n||b.com^\r\n'];
        const LINE_TERMINATOR_RE = /\r\n|\r|\n/;
        for (const input of cases) {
            const result = ensureTrailingEmptyLine(input);
            const parts = result.split(LINE_TERMINATOR_RE);
            // Exactly one trailing empty string entry => one blank line at bottom.
            expect(parts[parts.length - 1], `for input ${JSON.stringify(input)}`).toBe('');
            // And at most one trailing empty entry: the second-to-last must be
            // non-empty (a real rule), proving no extra blank lines remain.
            if (parts.length > 1) {
                expect(parts[parts.length - 2], `for input ${JSON.stringify(input)}`)
                    .not.toBe('');
            }
        }
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
});
