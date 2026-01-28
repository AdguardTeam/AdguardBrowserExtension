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

import { LineScanner } from '../../../../Extension/src/background/utils';

describe('LineScanner', () => {
    describe('single line without line break', () => {
        it('returns the single line', () => {
            const content = 'single line';
            const scanner = new LineScanner(content);

            expect(scanner.nextLine()).toBe('single line');
            expect(scanner.nextLine()).toBeNull();
        });

        it('works with iterator', () => {
            const content = 'single line';
            const scanner = new LineScanner(content);
            const lines = [...scanner];

            expect(lines).toEqual(['single line']);
        });
    });

    describe('empty content', () => {
        it('returns null immediately', () => {
            const scanner = new LineScanner('');

            expect(scanner.nextLine()).toBeNull();
            expect(scanner.hasNext()).toBe(false);
        });

        it('works with iterator', () => {
            const scanner = new LineScanner('');
            const lines = [...scanner];

            expect(lines).toEqual([]);
        });
    });

    describe('multiple lines with Unix line breaks', () => {
        it('returns all lines', () => {
            const content = 'line1\nline2\nline3';
            const scanner = new LineScanner(content);

            expect(scanner.nextLine()).toBe('line1');
            expect(scanner.nextLine()).toBe('line2');
            expect(scanner.nextLine()).toBe('line3');
            expect(scanner.nextLine()).toBeNull();
        });

        it('works with iterator', () => {
            const content = 'line1\nline2\nline3';
            const scanner = new LineScanner(content);
            const lines = [...scanner];

            expect(lines).toEqual(['line1', 'line2', 'line3']);
        });
    });

    describe('multiple lines with Windows line breaks', () => {
        it('returns all lines', () => {
            const content = 'line1\r\nline2\r\nline3';
            const scanner = new LineScanner(content);

            expect(scanner.nextLine()).toBe('line1');
            expect(scanner.nextLine()).toBe('line2');
            expect(scanner.nextLine()).toBe('line3');
            expect(scanner.nextLine()).toBeNull();
        });

        it('works with iterator', () => {
            const content = 'line1\r\nline2\r\nline3';
            const scanner = new LineScanner(content);
            const lines = [...scanner];

            expect(lines).toEqual(['line1', 'line2', 'line3']);
        });
    });

    describe('content ending with line break', () => {
        it('includes empty line at the end', () => {
            const content = 'line1\nline2\n';
            const scanner = new LineScanner(content);

            expect(scanner.nextLine()).toBe('line1');
            expect(scanner.nextLine()).toBe('line2');
            expect(scanner.nextLine()).toBe('');
            expect(scanner.nextLine()).toBeNull();
        });

        it('works with iterator', () => {
            const content = 'line1\nline2\n';
            const scanner = new LineScanner(content);
            const lines = [...scanner];

            expect(lines).toEqual(['line1', 'line2', '']);
        });
    });

    describe('content with empty lines', () => {
        it('returns empty strings for empty lines', () => {
            const content = 'line1\n\nline3';
            const scanner = new LineScanner(content);

            expect(scanner.nextLine()).toBe('line1');
            expect(scanner.nextLine()).toBe('');
            expect(scanner.nextLine()).toBe('line3');
            expect(scanner.nextLine()).toBeNull();
        });

        it('works with iterator', () => {
            const content = 'line1\n\nline3';
            const scanner = new LineScanner(content);
            const lines = [...scanner];

            expect(lines).toEqual(['line1', '', 'line3']);
        });
    });

    describe('mixed line break types', () => {
        it('handles mixed Unix and Windows line breaks', () => {
            const content = 'line1\nline2\r\nline3';
            const scanner = new LineScanner(content);
            const lines = [...scanner];

            expect(lines).toEqual(['line1', 'line2', 'line3']);
        });
    });

    describe('hasNext method', () => {
        it('returns true when there are more lines', () => {
            const content = 'line1\nline2';
            const scanner = new LineScanner(content);

            expect(scanner.hasNext()).toBe(true);
            scanner.nextLine();
            expect(scanner.hasNext()).toBe(true);
            scanner.nextLine();
            expect(scanner.hasNext()).toBe(false);
        });

        it('returns false for empty content', () => {
            const scanner = new LineScanner('');

            expect(scanner.hasNext()).toBe(false);
        });
    });

    describe('reset method', () => {
        it('resets scanner to beginning', () => {
            const content = 'line1\nline2\nline3';
            const scanner = new LineScanner(content);

            expect(scanner.nextLine()).toBe('line1');
            expect(scanner.nextLine()).toBe('line2');

            scanner.reset();

            expect(scanner.nextLine()).toBe('line1');
            expect(scanner.nextLine()).toBe('line2');
            expect(scanner.nextLine()).toBe('line3');
            expect(scanner.nextLine()).toBeNull();
        });

        it('works with iterator after manual iteration', () => {
            const content = 'line1\nline2\nline3';
            const scanner = new LineScanner(content);

            scanner.nextLine();
            scanner.nextLine();

            const lines = [...scanner];

            expect(lines).toEqual(['line1', 'line2', 'line3']);
        });
    });

    describe('real-world user rules scenarios', () => {
        it('handles adblock filter rules', () => {
            const content = '||example.com^\n@@||whitelist.com^\n##.ad-banner';
            const scanner = new LineScanner(content);
            const lines = [...scanner];

            expect(lines).toEqual([
                '||example.com^',
                '@@||whitelist.com^',
                '##.ad-banner',
            ]);
        });

        it('handles single rule without line break', () => {
            const content = '||example.com^';
            const scanner = new LineScanner(content);
            const lines = [...scanner];

            expect(lines).toEqual(['||example.com^']);
        });

        it('handles rules with comments', () => {
            const content = '! This is a comment\n||example.com^\n! Another comment';
            const scanner = new LineScanner(content);
            const lines = [...scanner];

            expect(lines).toEqual([
                '! This is a comment',
                '||example.com^',
                '! Another comment',
            ]);
        });
    });

    describe('performance characteristics', () => {
        it('allows early exit without processing all lines', () => {
            const lines = Array.from({ length: 10000 }, (_, i) => `rule${i}`);
            const content = lines.join('\n');
            const scanner = new LineScanner(content);

            let count = 0;
            while (scanner.hasNext() && count < 10) {
                scanner.nextLine();
                count += 1;
            }

            expect(count).toBe(10);
            expect(scanner.hasNext()).toBe(true);
        });
    });
});
