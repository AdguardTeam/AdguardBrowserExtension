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

import { CreateRuleRow } from '../../../../../../Extension/src/pages/options/components/UserRules/CreateRuleRow';
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

describe('CreateRuleRow', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders a checked, disabled checkbox, the custom-rule icon and the draft', () => {
        render(
            <CreateRuleRow
                draft=""
                onDraftChange={vi.fn()}
                onSave={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        const checkbox = screen.getByRole('checkbox', {
            name: 'options_user_rules_create_rule',
        }) as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
        expect(checkbox.disabled).toBe(true);
        expect(screen.getByTestId('icon-#custom-rule')).toBeTruthy();
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('');
    });

    it('marks the row as off while user rules are off and keeps it editable', () => {
        const { container, rerender } = render(
            <CreateRuleRow
                draft=""
                filterOff
                onDraftChange={vi.fn()}
                onSave={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        expect((container.firstElementChild as HTMLElement).className).toContain('rowFilterOff');
        expect(screen.getByTestId('inline-editor').dataset.readonly).toBe('false');
        expect(screen.getByLabelText('options_user_rules_save_rule')).toHaveProperty('disabled', false);

        rerender(
            <CreateRuleRow
                draft=""
                onDraftChange={vi.fn()}
                onSave={vi.fn()}
                onCancel={vi.fn()}
            />,
        );
        expect((container.firstElementChild as HTMLElement).className).not.toContain('rowFilterOff');
    });

    it('forwards editor draft changes', () => {
        const onDraftChange = vi.fn();
        render(
            <CreateRuleRow
                draft=""
                onDraftChange={onDraftChange}
                onSave={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByTestId('inline-editor-draft'));

        expect(onDraftChange).toHaveBeenCalledWith('edited text');
    });

    it('invokes onSave from the tick button and from the editor save', () => {
        const onSave = vi.fn();
        render(
            <CreateRuleRow
                draft=""
                onDraftChange={vi.fn()}
                onSave={onSave}
                onCancel={vi.fn()}
            />,
        );

        // `detail: 1` marks a pointer click; keyboard activation reports 0.
        fireEvent.click(screen.getByLabelText('options_user_rules_save_rule'), { detail: 1 });
        expect(onSave).toHaveBeenCalledTimes(1);
        expect(onSave).toHaveBeenCalledWith(InlineActionSource.Click);

        fireEvent.click(screen.getByTestId('inline-editor-save'));
        expect(onSave).toHaveBeenCalledTimes(2);
        expect(onSave).toHaveBeenLastCalledWith(InlineActionSource.Keyboard);
    });

    it('invokes onCancel from the cross button and from the editor cancel', () => {
        const onCancel = vi.fn();
        render(
            <CreateRuleRow
                draft=""
                onDraftChange={vi.fn()}
                onSave={vi.fn()}
                onCancel={onCancel}
            />,
        );

        fireEvent.click(screen.getByLabelText('options_user_rules_cancel_rule_creation'), { detail: 1 });
        fireEvent.click(screen.getByTestId('inline-editor-cancel'));

        expect(onCancel).toHaveBeenCalledTimes(2);
        expect(onCancel).toHaveBeenNthCalledWith(1, InlineActionSource.Click);
        expect(onCancel).toHaveBeenLastCalledWith(InlineActionSource.Keyboard);
    });

    it('disables the save and cancel buttons while the create save is in flight', () => {
        render(
            <CreateRuleRow
                draft=""
                inlineSaving
                onDraftChange={vi.fn()}
                onSave={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        expect(screen.getByLabelText('options_user_rules_save_rule'))
            .toHaveProperty('disabled', true);
        expect(screen.getByLabelText('options_user_rules_cancel_rule_creation'))
            .toHaveProperty('disabled', true);
    });

    it('keeps the buttons enabled and the editor editable when no save is in flight', () => {
        render(
            <CreateRuleRow
                draft=""
                onDraftChange={vi.fn()}
                onSave={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        // Only the row's own save locks it: `persistRules` orders concurrent
        // writes, so an unrelated toggle or delete must not.
        expect(screen.getByLabelText('options_user_rules_save_rule'))
            .toHaveProperty('disabled', false);
        expect(screen.getByLabelText('options_user_rules_cancel_rule_creation'))
            .toHaveProperty('disabled', false);
        expect(screen.getByTestId('inline-editor').dataset.readonly).toBe('false');
    });

    it('makes the editor read-only while the create save is in flight', () => {
        const { rerender } = render(
            <CreateRuleRow
                draft=""
                onDraftChange={vi.fn()}
                onSave={vi.fn()}
                onCancel={vi.fn()}
            />,
        );
        expect(screen.getByTestId('inline-editor').dataset.readonly).toBe('false');

        rerender(
            <CreateRuleRow
                draft=""
                inlineSaving
                onDraftChange={vi.fn()}
                onSave={vi.fn()}
                onCancel={vi.fn()}
            />,
        );
        expect(screen.getByTestId('inline-editor').dataset.readonly).toBe('true');
    });
});
