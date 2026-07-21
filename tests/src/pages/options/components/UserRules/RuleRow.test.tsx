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

import React from 'react';

import {
    render,
    screen,
    cleanup,
} from '@testing-library/react';
import {
    afterEach,
    describe,
    it,
    expect,
    vi,
} from 'vitest';

import { RuleRow } from '../../../../../../Extension/src/pages/options/components/UserRules/RuleRow';

vi.mock(
    '../../../../../../Extension/src/pages/options/components/UserRules/RuleRow.module.pcss',
    () => ({ default: new Proxy({}, { get: (_t, prop) => String(prop) }) }),
);

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    translator: { getMessage: (key: string) => key },
}));

vi.mock('../../../../../../Extension/src/pages/common/components/ui/Icon', () => ({
    Icon: ({ id }: { id: string }) => React.createElement('svg', { 'data-testid': `icon-${id}` }),
}));

const makeLine = (
    text: string,
    { lineIndex = 0, isComment = false, isDisabled = false }:
    { lineIndex?: number; isComment?: boolean; isDisabled?: boolean } = {},
) => {
    let displayText = text;
    if (isDisabled) {
        displayText = text.replace(/^!off\s*/, '');
    } else if (isComment) {
        displayText = text.replace(/^[!#]\s*/, '');
    }
    return {
        text,
        trimmedText: text,
        displayText,
        lowerDisplayText: displayText.toLowerCase(),
        isComment,
        isDisabled,
        isBlank: false,
        lineIndex,
    };
};

const makeGroup = (
    texts: string[],
    { isComment = false, lineIndex = 0 }: { isComment?: boolean; lineIndex?: number } = {},
) => ({
    lines: texts.map((t, i) => makeLine(t, { lineIndex: lineIndex + i, isComment, isDisabled: t.startsWith('!off') })),
    isComment,
    lineIndex,
});

type SearchOptions = { searchTerm?: string; searchClassName?: string };

/**
 * Builds a mock rule highlighter that mirrors `@adguard/rules-editor`: it wraps
 * the rule in a token span and, when a search term is given, wraps every
 * case-insensitive match in a span with the provided class.
 */
const makeHighlighter = () => vi.fn((rule: string, search?: SearchOptions) => {
    let inner = rule;
    const term = search?.searchTerm;
    if (term) {
        const className = search?.searchClassName ?? '';
        const lowerRule = rule.toLowerCase();
        const lowerTerm = term.toLowerCase();
        let result = '';
        let lastIndex = 0;
        for (
            let i = lowerRule.indexOf(lowerTerm);
            i !== -1;
            i = lowerRule.indexOf(lowerTerm, lastIndex)
        ) {
            result += rule.slice(lastIndex, i);
            result += `<span class="${className}">${rule.slice(i, i + term.length)}</span>`;
            lastIndex = i + term.length;
        }
        result += rule.slice(lastIndex);
        inner = result;
    }
    return `<span data-testid="tok">${inner}</span>`;
});

describe('RuleRow', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders a blocking rule with checkbox and blocking icon', () => {
        render(<RuleRow group={makeGroup(['||example.org^'])} />);
        expect(screen.getByText('||example.org^')).toBeTruthy();
        expect(screen.getByTestId('icon-#blocking-rule')).toBeTruthy();
        expect(screen.getByRole('checkbox')).toBeTruthy();
    });

    it('renders an exclusion icon for @@ rules', () => {
        render(<RuleRow group={makeGroup(['@@||example.org^'])} />);
        expect(screen.getByTestId('icon-#exclusion-rule')).toBeTruthy();
    });

    it('renders a custom icon for rules with content after ^', () => {
        render(<RuleRow group={makeGroup(['||example.org^$dnsrewrite=example1.org'])} />);
        expect(screen.getByTestId('icon-#custom-rule')).toBeTruthy();
    });

    it('renders a comment with comment icon and no checkbox, with the marker stripped', () => {
        render(<RuleRow group={makeGroup(['! just a comment'], { isComment: true })} />);
        expect(screen.getByText('just a comment')).toBeTruthy();
        expect(screen.getByTestId('icon-#comment')).toBeTruthy();
        expect(screen.queryByRole('checkbox')).toBeNull();
    });

    it('renders all lines in a multi-line comment block', () => {
        render(<RuleRow group={makeGroup(['! header', '! description'], { isComment: true })} />);
        expect(screen.getByText('header')).toBeTruthy();
        expect(screen.getByText('description')).toBeTruthy();
        expect(screen.getByTestId('icon-#comment')).toBeTruthy();
    });

    it('highlights matching text in rule', () => {
        render(<RuleRow group={makeGroup(['||example.com^'])} searchTerm="example" />);
        const highlighted = screen.getByText('example');
        expect(highlighted).toBeTruthy();
        expect(highlighted.className).toContain('highlight');
    });

    it('highlights matching text in comments', () => {
        render(<RuleRow group={makeGroup(['! Block ads'], { isComment: true })} searchTerm="ads" />);
        const highlighted = screen.getByText('ads');
        expect(highlighted).toBeTruthy();
        expect(highlighted.className).toContain('highlight');
    });

    it('highlights match in any line of a multi-line comment', () => {
        render(
            <RuleRow
                group={makeGroup(['! header', '! match here', '! footer'], { isComment: true })}
                searchTerm="match"
            />,
        );
        const highlighted = screen.getByText('match');
        expect(highlighted).toBeTruthy();
        expect(highlighted.className).toContain('highlight');
        // All lines still rendered
        expect(screen.getByText('header')).toBeTruthy();
        expect(screen.getByText('footer')).toBeTruthy();
    });

    it('renders without highlighting when searchTerm is empty', () => {
        render(<RuleRow group={makeGroup(['||example.com^'])} searchTerm="" />);
        expect(screen.getByText('||example.com^')).toBeTruthy();
    });

    it('renders syntax-highlighted html when a highlighter is provided and no search term', () => {
        const highlightHtml = makeHighlighter();
        render(<RuleRow group={makeGroup(['||example.org^'])} highlightHtml={highlightHtml} />);

        // No search options are passed when there is no active search term.
        expect(highlightHtml).toHaveBeenCalledWith('||example.org^', undefined);
        expect(screen.getByTestId('tok')).toBeTruthy();
    });

    it('passes the full comment text (with marker) to the highlighter but strips it from the html', () => {
        const highlightHtml = makeHighlighter();
        render(<RuleRow group={makeGroup(['! my comment'], { isComment: true })} highlightHtml={highlightHtml} />);

        // The highlighter receives the marker so it can tokenize as a comment...
        expect(highlightHtml).toHaveBeenCalledWith('! my comment', undefined);
        // ...but the rendered text no longer shows the marker.
        expect(screen.getByTestId('tok').textContent).toBe('my comment');
    });

    it('strips the `#` marker from a highlighted hosts-style comment', () => {
        const highlightHtml = makeHighlighter();
        render(<RuleRow group={makeGroup(['# hosts comment'], { isComment: true })} highlightHtml={highlightHtml} />);

        expect(highlightHtml).toHaveBeenCalledWith('# hosts comment', undefined);
        expect(screen.getByTestId('tok').textContent).toBe('hosts comment');
    });

    it('passes the search term to the highlighter and renders its highlight span during search', () => {
        const highlightHtml = makeHighlighter();
        render(
            <RuleRow
                group={makeGroup(['||example.com^'])}
                searchTerm="example"
                highlightHtml={highlightHtml}
            />,
        );

        // Syntax highlighting stays active during search and the term is forwarded.
        expect(highlightHtml).toHaveBeenCalledWith('||example.com^', {
            searchTerm: 'example',
            searchClassName: 'highlight',
        });
        const token = screen.getByTestId('tok');
        const match = screen.getByText('example');
        expect(match.className).toContain('highlight');
        expect(token.contains(match)).toBe(true);
    });

    it('trims the search term before forwarding it to the highlighter', () => {
        const highlightHtml = makeHighlighter();
        render(
            <RuleRow
                group={makeGroup(['||example.com^'])}
                searchTerm="  example  "
                highlightHtml={highlightHtml}
            />,
        );

        expect(highlightHtml).toHaveBeenCalledWith('||example.com^', {
            searchTerm: 'example',
            searchClassName: 'highlight',
        });
    });

    it('forwards the search term for comments and still strips the marker from the html', () => {
        const highlightHtml = makeHighlighter();
        render(
            <RuleRow
                group={makeGroup(['! block ads here'], { isComment: true })}
                searchTerm="ads"
                highlightHtml={highlightHtml}
            />,
        );

        // Highlighter still receives the full comment (with marker) plus the term.
        expect(highlightHtml).toHaveBeenCalledWith('! block ads here', {
            searchTerm: 'ads',
            searchClassName: 'highlight',
        });
        const token = screen.getByTestId('tok');
        // Marker stripped from the rendered text.
        expect(token.textContent).toBe('block ads here');
        // Search match highlighted within the comment.
        expect(screen.getByText('ads').className).toContain('highlight');
    });

    it('falls back to plain search highlighting when no highlighter is provided', () => {
        render(
            <RuleRow
                group={makeGroup(['||example.com^'])}
                searchTerm="example"
            />,
        );

        expect(screen.queryByTestId('tok')).toBeNull();
        expect(screen.getByText('example').className).toContain('highlight');
    });

    it('renders a disabled (!off) rule as a rule row, not a comment, with the marker stripped', () => {
        render(<RuleRow group={makeGroup(['!off ||example.org^'])} />);
        // Rendered as a rule (blocking icon), not a comment.
        expect(screen.getByTestId('icon-#blocking-rule')).toBeTruthy();
        expect(screen.queryByTestId('icon-#comment')).toBeNull();
        // The `!off` marker is stripped from the displayed text.
        expect(screen.getByText('||example.org^')).toBeTruthy();
    });

    it('renders a disabled (!off) rule with an unchecked checkbox', () => {
        render(<RuleRow group={makeGroup(['!off ||example.org^'])} />);
        const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
        expect(checkbox.checked).toBe(false);
    });

    it('renders an active rule with a checked checkbox', () => {
        render(<RuleRow group={makeGroup(['||example.org^'])} />);
        const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
    });

    describe('comment blocks', () => {
        it('renders a multi-line block mixing `!` and `#` markers as one block with one comment icon', () => {
            const { container } = render(
                <RuleRow
                    group={makeGroup(['! regular', '# hosts', '!! emphasized'], { isComment: true })}
                />,
            );

            // A single comment icon for the whole block (not one per line).
            expect(screen.getAllByTestId('icon-#comment')).toHaveLength(1);
            // One commentLine span per source line.
            expect(container.querySelectorAll('.commentLine')).toHaveLength(3);
            // Comment blocks never render a checkbox.
            expect(screen.queryByRole('checkbox')).toBeNull();
            // Each line keeps its content with only the leading marker stripped.
            expect(screen.getByText('regular')).toBeTruthy();
            expect(screen.getByText('hosts')).toBeTruthy();
            expect(screen.getByText('! emphasized')).toBeTruthy();
        });

        it('strips only the leading marker, keeping markers that appear inside the comment text', () => {
            render(<RuleRow group={makeGroup(['#  see ## and ! inside'], { isComment: true })} />);
            expect(screen.getByText('see ## and ! inside')).toBeTruthy();
        });

        it('renders an empty comment (marker only) without crashing and without a checkbox', () => {
            const { container } = render(<RuleRow group={makeGroup(['!'], { isComment: true })} />);
            expect(screen.getByTestId('icon-#comment')).toBeTruthy();
            expect(screen.queryByRole('checkbox')).toBeNull();
            expect(container.querySelectorAll('.commentLine')).toHaveLength(1);
        });

        it('highlights and strips the marker on every line of a highlighted multi-line block', () => {
            const highlightHtml = vi.fn((rule: string) => `<span class="tok">${rule}</span>`);
            const { container } = render(
                <RuleRow
                    group={makeGroup(['! first', '# second'], { isComment: true })}
                    highlightHtml={highlightHtml}
                />,
            );

            // Highlighter is called per line with the full text (marker included)
            // and no search options (no active search term).
            expect(highlightHtml).toHaveBeenCalledWith('! first', undefined);
            expect(highlightHtml).toHaveBeenCalledWith('# second', undefined);
            const tokens = container.querySelectorAll('.tok');
            expect(tokens).toHaveLength(2);
            // Markers stripped from the rendered html of each line.
            expect(tokens[0]!.textContent).toBe('first');
            expect(tokens[1]!.textContent).toBe('second');
        });

        it('keeps a multi-line block intact while highlighting a search match in one line', () => {
            render(
                <RuleRow
                    group={makeGroup(['! header', '# match here', '! footer'], { isComment: true })}
                    searchTerm="match"
                />,
            );

            const highlighted = screen.getByText('match');
            expect(highlighted.className).toContain('highlight');
            expect(screen.getByText('header')).toBeTruthy();
            expect(screen.getByText('footer')).toBeTruthy();
        });
    });

    describe('disabled rules', () => {
        it('renders a disabled exclusion rule with the exclusion icon, unchecked, marker stripped', () => {
            render(<RuleRow group={makeGroup(['!off @@||example.org^'])} />);
            expect(screen.getByTestId('icon-#exclusion-rule')).toBeTruthy();
            expect(screen.queryByTestId('icon-#comment')).toBeNull();
            expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
            expect(screen.getByText('@@||example.org^')).toBeTruthy();
        });

        it('renders a disabled custom rule with the custom icon', () => {
            render(<RuleRow group={makeGroup(['!off ||example.org^$dnsrewrite=example1.org'])} />);
            expect(screen.getByTestId('icon-#custom-rule')).toBeTruthy();
            expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
        });

        it('uses the marker-stripped text as the checkbox aria-label for disabled rules', () => {
            render(<RuleRow group={makeGroup(['!off ||example.org^'])} />);
            expect(screen.getByLabelText('||example.org^')).toBeTruthy();
        });

        it('passes the stripped text (not the `!off` marker) to the highlighter', () => {
            const highlightHtml = makeHighlighter();
            render(<RuleRow group={makeGroup(['!off ||example.org^'])} highlightHtml={highlightHtml} />);
            expect(highlightHtml).toHaveBeenCalledWith('||example.org^', undefined);
            expect(highlightHtml).not.toHaveBeenCalledWith('!off ||example.org^', undefined);
            expect(screen.getByTestId('tok').textContent).toBe('||example.org^');
        });

        it('does not strip the comment marker from a disabled rule highlighted html', () => {
            // A disabled rule is highlighted from its stripped text, so no marker
            // stripping should occur on the resulting html.
            const highlightHtml = vi.fn((rule: string) => `<span data-testid="tok">!keep ${rule}</span>`);
            render(<RuleRow group={makeGroup(['!off ||example.org^'])} highlightHtml={highlightHtml} />);
            expect(screen.getByTestId('tok').textContent).toBe('!keep ||example.org^');
        });
    });

    describe('memoization', () => {
        it('does not re-run the highlighter when re-rendered with the same props', () => {
            // The virtualizer re-renders the list on every scroll range change;
            // with stable props the memoized row must not re-invoke the expensive
            // WASM highlighter.
            const highlightHtml = makeHighlighter();
            const group = makeGroup(['||example.org^']);
            const { rerender } = render(
                <RuleRow group={group} searchTerm="" highlightHtml={highlightHtml} />,
            );
            expect(highlightHtml).toHaveBeenCalledTimes(1);

            // Same prop references — a shallow-equal re-render should be skipped.
            rerender(<RuleRow group={group} searchTerm="" highlightHtml={highlightHtml} />);
            expect(highlightHtml).toHaveBeenCalledTimes(1);
        });

        it('re-runs the highlighter when a relevant prop changes', () => {
            // Sanity check that memoization does not over-block: a changed search
            // term must still trigger a re-render and re-highlight.
            const highlightHtml = makeHighlighter();
            const group = makeGroup(['||example.org^']);
            const { rerender } = render(
                <RuleRow group={group} searchTerm="" highlightHtml={highlightHtml} />,
            );
            expect(highlightHtml).toHaveBeenCalledTimes(1);

            rerender(<RuleRow group={group} searchTerm="example" highlightHtml={highlightHtml} />);
            expect(highlightHtml).toHaveBeenCalledTimes(2);
            expect(highlightHtml).toHaveBeenLastCalledWith('||example.org^', {
                searchTerm: 'example',
                searchClassName: 'highlight',
            });
        });
    });

    describe('RuleRow actions', () => {
        it('renders Edit and Delete buttons and forwards the group on click', () => {
            const onEdit = vi.fn();
            const onDelete = vi.fn();
            const line = makeLine('||a.com^', { lineIndex: 3 });
            const group = {
                lines: [line],
                isComment: false,
                lineIndex: line.lineIndex,
            };

            render(
                <RuleRow group={group} onEdit={onEdit} onDelete={onDelete} />,
            );

            const editButton = screen.getByLabelText('options_user_rules_edit_rule');
            const deleteButton = screen.getByLabelText('options_user_rules_delete_rule');
            expect(screen.getByTestId('icon-#switch-to-editor')).toBeTruthy();
            expect(screen.getByTestId('icon-#trash')).toBeTruthy();

            editButton.click();
            deleteButton.click();
            expect(onEdit).toHaveBeenCalledWith(group);
            expect(onDelete).toHaveBeenCalledWith(group);
        });

        it('disables the action buttons when disabled', () => {
            const line = makeLine('||a.com^');
            const group = {
                lines: [line],
                isComment: false,
                lineIndex: line.lineIndex,
            };
            render(
                <RuleRow group={group} onEdit={vi.fn()} onDelete={vi.fn()} disabled />,
            );
            expect(screen.getByLabelText('options_user_rules_edit_rule')).toHaveProperty('disabled', true);
            expect(screen.getByLabelText('options_user_rules_delete_rule')).toHaveProperty('disabled', true);
        });

        it('disables the checkbox when disabled', () => {
            render(<RuleRow group={makeGroup(['||a.com^'])} onToggle={vi.fn()} disabled />);

            expect(screen.getByRole('checkbox')).toHaveProperty('disabled', true);
        });
    });
});
