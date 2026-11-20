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
    cleanup,
    render,
    screen,
} from '@testing-library/react';
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { RuleSyntaxLink } from '../../../../../../Extension/src/pages/options/components/UserRules/RuleSyntaxLink';

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    translator: { getMessage: (key: any) => key },
}));

/* eslint-disable react/require-default-props */
vi.mock('../../../../../../Extension/src/pages/common/components/ui/Icon', () => ({
    Icon: ({ id, className }: { id: string; className?: string }) => (
        <svg data-testid="icon" data-icon-id={id} className={className} />
    ),
}));
/* eslint-enable react/require-default-props */

describe('RuleSyntaxLink', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders the rule syntax label with the question icon', () => {
        render(<RuleSyntaxLink />);

        expect(screen.getByText('options_rule_syntax')).toBeTruthy();
        const icon = screen.getByTestId('icon');
        expect(icon.getAttribute('data-icon-id')).toBe('#question');
        expect(icon.getAttribute('class')).toContain('icon--24');
    });

    it('opens the rule syntax page in a new tab', () => {
        render(<RuleSyntaxLink />);

        const link = screen.getByText('options_rule_syntax').closest('a');
        expect(link).not.toBeNull();
        expect(link?.getAttribute('href')).toContain('userfilter_description');
        expect(link?.getAttribute('target')).toBe('_blank');
        expect(link?.getAttribute('rel')).toBe('noreferrer');
    });
});
