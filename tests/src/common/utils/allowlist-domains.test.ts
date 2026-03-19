/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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
    normalizeAllowlistEntry,
    normalizeAllowlistDomains,
    validateAllowlistEntries,
} from '../../../../Extension/src/common/utils/allowlist-domains';

describe('normalizeAllowlistEntry', () => {
    it('extracts domain from URL with path', () => {
        expect(normalizeAllowlistEntry('https://example.com/page')).toBe('example.com');
    });

    it('strips www prefix from URL', () => {
        expect(normalizeAllowlistEntry('https://www.example.com/')).toBe('example.com');
    });

    it('extracts subdomain from URL', () => {
        expect(normalizeAllowlistEntry('https://sub.example.com/path?q=1')).toBe('sub.example.com');
    });

    it('extracts domain from http URL', () => {
        expect(normalizeAllowlistEntry('http://example.com')).toBe('example.com');
    });

    it('preserves plain domain without scheme', () => {
        expect(normalizeAllowlistEntry('example.com')).toBe('example.com');
    });

    it('preserves wildcard subdomain pattern', () => {
        expect(normalizeAllowlistEntry('*.example.com')).toBe('*.example.com');
    });

    it('preserves wildcard TLD pattern', () => {
        expect(normalizeAllowlistEntry('example.*')).toBe('example.*');
    });

    it('preserves full wildcard *.*', () => {
        expect(normalizeAllowlistEntry('*.*')).toBe('*.*');
    });

    it('rejects bare *', () => {
        expect(normalizeAllowlistEntry('*')).toBeNull();
    });

    it('returns null for invalid entry', () => {
        expect(normalizeAllowlistEntry('not a domain!!!')).toBeNull();
    });

    it('preserves IP address', () => {
        expect(normalizeAllowlistEntry('192.168.1.1')).toBe('192.168.1.1');
    });

    it('strips port from domain', () => {
        expect(normalizeAllowlistEntry('example.com:8080')).toBe('example.com');
    });

    it('strips port from URL', () => {
        expect(normalizeAllowlistEntry('http://example.com:3000/page')).toBe('example.com');
    });

    it('returns null for scheme-only input', () => {
        expect(normalizeAllowlistEntry('http://')).toBeNull();
    });

    it('returns empty string for blank line', () => {
        expect(normalizeAllowlistEntry('')).toBe('');
    });

    it('returns empty string for whitespace-only line', () => {
        expect(normalizeAllowlistEntry('   ')).toBe('');
    });

    it('extracts localhost', () => {
        expect(normalizeAllowlistEntry('localhost')).toBe('localhost');
    });

    it('strips port from localhost', () => {
        expect(normalizeAllowlistEntry('localhost:3000')).toBe('localhost');
    });

    it('strips www from subdomain URL', () => {
        expect(normalizeAllowlistEntry('https://www.investing.com/news/commodities-news/')).toBe('investing.com');
    });

    it('rejects wildcard subdomain with invalid domain', () => {
        expect(normalizeAllowlistEntry('*.notadomain!!!')).toBeNull();
    });

    it('rejects wildcard TLD with invalid domain', () => {
        expect(normalizeAllowlistEntry('notadomain!!!.*')).toBeNull();
    });

    it('preserves www in wildcard subdomain entry', () => {
        expect(normalizeAllowlistEntry('*.www.example.com')).toBe('*.www.example.com');
    });

    it('rejects bare TLD', () => {
        expect(normalizeAllowlistEntry('com')).toBeNull();
    });

    it('rejects TLD with leading dot', () => {
        expect(normalizeAllowlistEntry('.com')).toBeNull();
    });

    it('rejects other bare TLDs', () => {
        expect(normalizeAllowlistEntry('org')).toBeNull();
        expect(normalizeAllowlistEntry('net')).toBeNull();
    });

    it('rejects single-word hostname', () => {
        expect(normalizeAllowlistEntry('randomword')).toBeNull();
    });

    it('preserves localhost as exception', () => {
        expect(normalizeAllowlistEntry('localhost')).toBe('localhost');
    });

    it('rejects invalid strings with special characters', () => {
        expect(normalizeAllowlistEntry('...')).toBeNull();
        expect(normalizeAllowlistEntry('---')).toBeNull();
        expect(normalizeAllowlistEntry('___')).toBeNull();
    });
});

describe('normalizeAllowlistDomains', () => {
    it('normalizes multiple entries', () => {
        const input = 'https://example.com/page\ngoogle.com\n*.test.com';
        const result = normalizeAllowlistDomains(input);

        expect(result.domains).toEqual(['example.com', 'google.com', '*.test.com']);
        expect(result.invalidEntries).toEqual([]);
    });

    it('filters out empty lines', () => {
        const input = 'example.com\n\n\ngoogle.com';
        const result = normalizeAllowlistDomains(input);

        expect(result.domains).toEqual(['example.com', 'google.com']);
        expect(result.invalidEntries).toEqual([]);
    });

    it('collects invalid entries', () => {
        const input = 'example.com\nnot valid\ngoogle.com';
        const result = normalizeAllowlistDomains(input);

        expect(result.domains).toEqual(['example.com', 'google.com']);
        expect(result.invalidEntries).toEqual(['not valid']);
    });

    it('handles mixed valid and invalid entries', () => {
        const input = 'https://example.com\n*\nhttp://\n*.google.com';
        const result = normalizeAllowlistDomains(input);

        expect(result.domains).toEqual(['example.com', '*.google.com']);
        expect(result.invalidEntries).toEqual(['*', 'http://']);
    });

    it('handles Windows-style line endings', () => {
        const input = 'example.com\r\ngoogle.com\r\ntest.org';
        const result = normalizeAllowlistDomains(input);

        expect(result.domains).toEqual(['example.com', 'google.com', 'test.org']);
        expect(result.invalidEntries).toEqual([]);
    });

    it('returns empty arrays for empty input', () => {
        const result = normalizeAllowlistDomains('');

        expect(result.domains).toEqual([]);
        expect(result.invalidEntries).toEqual([]);
    });
});

describe('validateAllowlistEntries', () => {
    it('returns valid for all valid entries', () => {
        const result = validateAllowlistEntries('example.com\n*.google.com');

        expect(result.valid).toBe(true);
        expect(result.invalidEntries).toEqual([]);
    });

    it('returns invalid with entries list', () => {
        const result = validateAllowlistEntries('example.com\nnot valid');

        expect(result.valid).toBe(false);
        expect(result.invalidEntries).toEqual(['not valid']);
    });

    it('treats empty input as valid', () => {
        const result = validateAllowlistEntries('');

        expect(result.valid).toBe(true);
        expect(result.invalidEntries).toEqual([]);
    });
});
