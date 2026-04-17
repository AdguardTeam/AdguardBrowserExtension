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

import { calculateChecksum } from '../../../tools/utils/checksum';
import { validateChecksum } from '../../../tools/resources/download-filters';

describe('calculateChecksum', () => {
    it('returns a base64-encoded MD5 hash without trailing "="', () => {
        const result = calculateChecksum('! Title: Test\n||example.com^\n');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        expect(result).not.toContain('=');
    });

    it('produces consistent results for the same input', () => {
        const body = '! Checksum: abc\n! Title: Test\n||example.com^\n';
        expect(calculateChecksum(body)).toBe(calculateChecksum(body));
    });

    it('strips existing checksum comment before hashing', () => {
        const withChecksum = '! Checksum: abc\n! Title: Test\n||example.com^\n';
        const withoutChecksum = '! Title: Test\n||example.com^\n';
        // Both should produce the same hash since the checksum line is removed
        expect(calculateChecksum(withChecksum)).toBe(calculateChecksum(withoutChecksum));
    });
});

describe('validateChecksum', () => {
    const TEST_URL = 'https://filters.example.com/filter_1.txt';

    it('returns valid for correct checksum', () => {
        const body = '! Title: Test\n||example.com^\n';
        const checksum = calculateChecksum(body);
        const bodyWithChecksum = `! Checksum: ${checksum}\n${body}`;

        const result = validateChecksum(TEST_URL, bodyWithChecksum);
        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
    });

    it('returns invalid when checksum comment is missing', () => {
        const body = '! Title: Test\n||example.com^\n';

        const result = validateChecksum(TEST_URL, body);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('does not contain a checksum');
        expect(result.message).toContain(TEST_URL);
    });

    it('returns invalid when checksum does not match', () => {
        const body = '! Checksum: INVALIDCHECKSUM\n! Title: Test\n||example.com^\n';

        const result = validateChecksum(TEST_URL, body);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('Wrong checksum');
        expect(result.message).toContain('INVALIDCHECKSUM');
    });
});
