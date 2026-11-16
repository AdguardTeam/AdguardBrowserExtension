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
    fireEvent,
} from '@testing-library/react';
import {
    afterEach,
    describe,
    it,
    expect,
    vi,
} from 'vitest';

import { RuleRow } from '../../../../../../Extension/src/pages/options/components/UserRules/RuleRow';
import {
    InlineActionSource,
} from '../../../../../../Extension/src/pages/options/components/UserRules/inline-action-source';

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

vi.mock(
    '../../../../../../Extension/src/pages/options/components/UserRules/InlineRuleEditor',
    () => import('../../../../../helpers/mocks/inline-rule-editor'),
);

vi.mock(
    '../../../../../../Extension/src/pages/options/components/UserRules/CommentBlockLines',
    () => ({
        CommentBlockLines: ({ lines, viewportDocumentTop }: {
            lines: { displayText: string }[];
            viewportDocumentTop: number;
        }) => React.createElement('div', {
            'data-testid': 'comment-block-lines',
            'data-line-count': String(lines.length),
            'data-viewport-top': String(viewportDocumentTop),
        }),
    }),
);

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

const makeCommentBlock = (lineCount: number, lineIndex = 0) => makeGroup(
    Array.from({ length: lineCount }, (_, i) => `! comment ${i}`),
    { isComment: true, lineIndex },
);

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

        it('renders the edit action for a multi-line comment block and forwards the group', () => {
            const onEdit = vi.fn();
            const group = makeGroup(['! first', '! second'], { isComment: true });
            render(<RuleRow group={group} onEdit={onEdit} onDelete={vi.fn()} />);

            const editButton = screen.getByLabelText('options_user_rules_edit_rule');
            expect(editButton).toBeTruthy();
            expect(screen.getByLabelText('options_user_rules_delete_rule')).toBeTruthy();

            editButton.click();
            expect(onEdit).toHaveBeenCalledWith(group);
        });

        it('keeps the action buttons and the checkbox enabled while user rules are off', () => {
            const onEdit = vi.fn();
            const onDelete = vi.fn();
            const onToggle = vi.fn();
            const group = makeGroup(['||a.com^']);
            render(
                <RuleRow
                    group={group}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggle={onToggle}
                    filterOff
                />,
            );

            const editButton = screen.getByLabelText('options_user_rules_edit_rule');
            const deleteButton = screen.getByLabelText('options_user_rules_delete_rule');
            const checkbox = screen.getByRole('checkbox');
            expect(editButton).toHaveProperty('disabled', false);
            expect(deleteButton).toHaveProperty('disabled', false);
            expect(checkbox).toHaveProperty('disabled', false);

            fireEvent.click(checkbox);
            editButton.click();
            deleteButton.click();
            expect(onToggle).toHaveBeenCalledWith(group.lineIndex, true);
            expect(onEdit).toHaveBeenCalledWith(group);
            expect(onDelete).toHaveBeenCalledWith(group);
        });

        it('marks rule and comment rows as off while user rules are off', () => {
            const { container, rerender } = render(<RuleRow group={makeGroup(['||a.com^'])} filterOff />);
            expect((container.firstElementChild as HTMLElement).className).toContain('rowFilterOff');

            rerender(<RuleRow group={makeGroup(['! comment'], { isComment: true })} filterOff />);
            expect((container.firstElementChild as HTMLElement).className).toContain('rowFilterOff');

            rerender(<RuleRow group={makeGroup(['||a.com^'])} />);
            expect((container.firstElementChild as HTMLElement).className).not.toContain('rowFilterOff');
        });

        it('disables the mutation actions while a save is in flight', () => {
            render(
                <RuleRow
                    group={makeGroup(['||a.com^'])}
                    onEdit={vi.fn()}
                    onDelete={vi.fn()}
                    onToggle={vi.fn()}
                    saving
                />,
            );

            expect(screen.getByLabelText('options_user_rules_edit_rule')).toHaveProperty('disabled', true);
            expect(screen.getByLabelText('options_user_rules_delete_rule')).toHaveProperty('disabled', true);
            expect(screen.getByRole('checkbox')).toHaveProperty('disabled', true);
        });
    });

    describe('RuleRow inline editing', () => {
        it('swaps the text for the inline editor and edit/delete for save/cancel', () => {
            const group = makeGroup(['||example.org^'], { lineIndex: 2 });
            render(
                <RuleRow
                    group={group}
                    editing
                    onInlineSave={vi.fn()}
                    onInlineCancel={vi.fn()}
                />,
            );

            // The editor replaces the highlighted text and is seeded with the
            // marker-stripped displayed text.
            expect(screen.getByTestId('inline-editor').dataset.value).toBe('||example.org^');
            // Pencil and trash are replaced by save and cancel.
            expect(screen.queryByTestId('icon-#switch-to-editor')).toBeNull();
            expect(screen.queryByTestId('icon-#trash')).toBeNull();
            expect(screen.getByTestId('icon-#tick')).toBeTruthy();
            expect(screen.getByTestId('icon-#cross')).toBeTruthy();
            expect(screen.getByLabelText('options_user_rules_save_rule')).toBeTruthy();
            expect(screen.getByLabelText('options_user_rules_cancel_rule_editing')).toBeTruthy();
        });

        it('forwards save and cancel button clicks with the group', () => {
            const onInlineSave = vi.fn();
            const onInlineCancel = vi.fn();
            const group = makeGroup(['||example.org^'], { lineIndex: 4 });
            render(
                <RuleRow
                    group={group}
                    editing
                    onInlineSave={onInlineSave}
                    onInlineCancel={onInlineCancel}
                />,
            );

            // `detail` distinguishes a pointer click from keyboard activation:
            // `MouseEvent.detail` is 0 for keyboard/programmatic activation.
            fireEvent.click(screen.getByLabelText('options_user_rules_save_rule'), { detail: 1 });
            fireEvent.click(screen.getByLabelText('options_user_rules_cancel_rule_editing'), { detail: 1 });

            expect(onInlineSave).toHaveBeenCalledTimes(1);
            expect(onInlineSave).toHaveBeenCalledWith(group, InlineActionSource.Click);
            expect(onInlineCancel).toHaveBeenCalledTimes(1);
            expect(onInlineCancel).toHaveBeenCalledWith(InlineActionSource.Click);
        });

        it('reports keyboard activation of the action buttons as a keyboard source', () => {
            const onInlineSave = vi.fn();
            const onInlineCancel = vi.fn();
            const group = makeGroup(['||example.org^']);
            render(
                <RuleRow
                    group={group}
                    editing
                    onInlineSave={onInlineSave}
                    onInlineCancel={onInlineCancel}
                />,
            );

            // Enter / Space on a focused button fires `click` with detail 0, so
            // it must not be counted as a pointer click.
            fireEvent.click(screen.getByLabelText('options_user_rules_save_rule'), { detail: 0 });
            fireEvent.click(screen.getByLabelText('options_user_rules_cancel_rule_editing'), { detail: 0 });

            expect(onInlineSave).toHaveBeenCalledTimes(1);
            expect(onInlineSave).toHaveBeenCalledWith(group, InlineActionSource.Keyboard);
            expect(onInlineCancel).toHaveBeenCalledTimes(1);
            expect(onInlineCancel).toHaveBeenCalledWith(InlineActionSource.Keyboard);
        });

        it('wires the editor keyboard actions to the row callbacks', () => {
            const onInlineSave = vi.fn();
            const onInlineCancel = vi.fn();
            const group = makeGroup(['||example.org^']);
            render(
                <RuleRow
                    group={group}
                    editing
                    onInlineSave={onInlineSave}
                    onInlineCancel={onInlineCancel}
                />,
            );

            screen.getByTestId('inline-editor-save').click();
            screen.getByTestId('inline-editor-cancel').click();

            expect(onInlineSave).toHaveBeenCalledTimes(1);
            expect(onInlineSave).toHaveBeenCalledWith(group, InlineActionSource.Keyboard);
            expect(onInlineCancel).toHaveBeenCalledTimes(1);
            expect(onInlineCancel).toHaveBeenCalledWith(InlineActionSource.Keyboard);
        });

        it('seeds the editor with the in-progress draft when provided', () => {
            render(
                <RuleRow
                    group={makeGroup(['||example.org^'])}
                    editing
                    inlineDraft="typed text"
                    onInlineSave={vi.fn()}
                    onInlineCancel={vi.fn()}
                />,
            );

            expect(screen.getByTestId('inline-editor').dataset.value).toBe('typed text');
        });

        it('forwards inline editor draft changes', () => {
            const onInlineDraftChange = vi.fn();
            render(
                <RuleRow
                    group={makeGroup(['||example.org^'])}
                    editing
                    onInlineDraftChange={onInlineDraftChange}
                    onInlineSave={vi.fn()}
                    onInlineCancel={vi.fn()}
                />,
            );

            screen.getByTestId('inline-editor-draft').click();

            expect(onInlineDraftChange).toHaveBeenCalledWith('edited text');
        });

        it('seeds the editor with the comment text without its marker', () => {
            const group = makeGroup(['! my comment'], { isComment: true });
            render(
                <RuleRow
                    group={group}
                    editing
                    onInlineSave={vi.fn()}
                    onInlineCancel={vi.fn()}
                />,
            );

            // The marker is fixed context, so only the comment text is editable.
            expect(screen.getByTestId('inline-editor').dataset.value).toBe('my comment');
            expect(screen.queryByRole('checkbox')).toBeNull();
            expect(screen.getByTestId('icon-#comment')).toBeTruthy();
        });

        it('seeds the editor with every line of a multi-line comment block', () => {
            const group = makeGroup(['! first', '! second'], { isComment: true });
            render(
                <RuleRow
                    group={group}
                    editing
                    onInlineSave={vi.fn()}
                    onInlineCancel={vi.fn()}
                />,
            );

            const editor = screen.getByTestId('inline-editor');
            expect(editor.dataset.value).toBe('first\nsecond');
            expect(editor.dataset.comment).toBe('true');
        });

        it('renders the rule editor without multi-line mode', () => {
            render(
                <RuleRow
                    group={makeGroup(['||example.org^'])}
                    editing
                    onInlineSave={vi.fn()}
                    onInlineCancel={vi.fn()}
                />,
            );

            expect(screen.getByTestId('inline-editor').dataset.comment).toBe('false');
        });

        it('does not render the inline editor when editing is false', () => {
            render(<RuleRow group={makeGroup(['||example.org^'])} onEdit={vi.fn()} onDelete={vi.fn()} />);

            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getByLabelText('options_user_rules_edit_rule')).toBeTruthy();
            expect(screen.getByLabelText('options_user_rules_delete_rule')).toBeTruthy();
        });

        it('keeps save and cancel enabled while user rules are off', () => {
            render(
                <RuleRow
                    group={makeGroup(['||example.org^'])}
                    editing
                    filterOff
                    onInlineSave={vi.fn()}
                    onInlineCancel={vi.fn()}
                />,
            );

            // Turning user rules off does not block inline editing.
            expect(screen.getByLabelText('options_user_rules_save_rule')).toHaveProperty('disabled', false);
            expect(screen.getByLabelText('options_user_rules_cancel_rule_editing')).toHaveProperty('disabled', false);
        });

        it('locks the editor while the row save is in flight', () => {
            const group = makeGroup(['||example.org^']);
            const { rerender } = render(
                <RuleRow group={group} editing onInlineSave={vi.fn()} onInlineCancel={vi.fn()} />,
            );
            expect(screen.getByTestId('inline-editor').dataset.readonly).toBe('false');

            rerender(
                <RuleRow
                    group={group}
                    editing
                    inlineSaving
                    onInlineSave={vi.fn()}
                    onInlineCancel={vi.fn()}
                />,
            );
            expect(screen.getByTestId('inline-editor').dataset.readonly).toBe('true');
        });

        it('returns focus to the edit button when editing ends', () => {
            const group = makeGroup(['||example.org^']);
            const { rerender } = render(
                <RuleRow group={group} editing onInlineSave={vi.fn()} onInlineCancel={vi.fn()} />,
            );

            rerender(<RuleRow group={group} editing={false} onEdit={vi.fn()} onDelete={vi.fn()} />);

            expect(document.activeElement).toBe(screen.getByLabelText('options_user_rules_edit_rule'));
        });

        it('restores focus once a save in flight finishes after editing ends', () => {
            const group = makeGroup(['||example.org^']);
            const { rerender } = render(
                <RuleRow group={group} editing saving onInlineSave={vi.fn()} onInlineCancel={vi.fn()} />,
            );

            // Editing ends while the mutation is in flight: the button is
            // disabled, so the restore must be deferred, not dropped.
            rerender(
                <RuleRow group={group} editing={false} saving onEdit={vi.fn()} onDelete={vi.fn()} />,
            );
            expect(document.activeElement).not.toBe(screen.getByLabelText('options_user_rules_edit_rule'));

            // Once the save settles, focus lands on the row's edit button.
            rerender(
                <RuleRow group={group} editing={false} onEdit={vi.fn()} onDelete={vi.fn()} />,
            );
            expect(document.activeElement).toBe(screen.getByLabelText('options_user_rules_edit_rule'));
        });

        it('does not steal focus back when another element has claimed it', () => {
            const group = makeGroup(['||example.org^']);
            const { rerender } = render(
                <RuleRow group={group} editing saving onInlineSave={vi.fn()} onInlineCancel={vi.fn()} />,
            );
            rerender(
                <RuleRow group={group} editing={false} saving onEdit={vi.fn()} onDelete={vi.fn()} />,
            );

            // Another element (e.g. another row's editor) takes focus while the
            // save is still in flight.
            const other = document.createElement('input');
            document.body.appendChild(other);
            other.focus();

            rerender(
                <RuleRow group={group} editing={false} onEdit={vi.fn()} onDelete={vi.fn()} />,
            );

            expect(document.activeElement).toBe(other);
            other.remove();
        });

        it('keeps save and cancel enabled while a save is in flight', () => {
            render(
                <RuleRow
                    group={makeGroup(['||example.org^'])}
                    editing
                    saving
                    onInlineSave={vi.fn()}
                    onInlineCancel={vi.fn()}
                />,
            );

            // Leaving editing mode stays allowed during a save, matching the
            // Enter/Escape/Ctrl+S keyboard shortcuts.
            expect(screen.getByLabelText('options_user_rules_save_rule')).toHaveProperty('disabled', false);
            expect(screen.getByLabelText('options_user_rules_cancel_rule_editing')).toHaveProperty('disabled', false);
        });
    });
});

describe('RuleRow comment block virtualization', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders large comment blocks through the nested virtualizer', () => {
        render(<RuleRow group={makeCommentBlock(101)} rowDocumentTop={1000} />);

        const virtualized = screen.getByTestId('comment-block-lines');
        expect(virtualized.getAttribute('data-line-count')).toBe('101');
        // The row's document top plus its top padding (8px) and the text's
        // offset inside the row (1px) is the nested viewport's scroll margin.
        expect(virtualized.getAttribute('data-viewport-top')).toBe('1009');
        // The plain per-line rendering is not used for large blocks.
        expect(document.querySelector('span.commentLine')).toBeNull();
    });

    it('renders blocks at the virtualization threshold as plain lines', () => {
        render(<RuleRow group={makeCommentBlock(100)} rowDocumentTop={1000} />);

        expect(screen.queryByTestId('comment-block-lines')).toBeNull();
        expect(screen.getByText('comment 0')).toBeDefined();
        expect(screen.getByText('comment 99')).toBeDefined();
    });

    it('falls back to plain lines when the row document top is unknown', () => {
        render(<RuleRow group={makeCommentBlock(101)} />);

        expect(screen.queryByTestId('comment-block-lines')).toBeNull();
        expect(screen.getByText('comment 100')).toBeDefined();
    });

    it('renders the inline editor instead of the nested virtualizer while editing', () => {
        render(<RuleRow group={makeCommentBlock(101)} rowDocumentTop={1000} editing />);

        expect(screen.queryByTestId('comment-block-lines')).toBeNull();
        expect(screen.getByTestId('inline-editor')).toBeDefined();
    });
});
