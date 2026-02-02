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

import { findChunks } from '../../../Extension/src/pages/helpers';

describe('helpers', () => {
    describe('findChunks', () => {
        it('chunks count', () => {
            expect(findChunks('AdGuard Base filter', 'base')).toHaveLength(3);
            expect(findChunks('AdGuard Base filter', 'ADG')).toHaveLength(2);
            expect(findChunks('AdGuard Base filter', 'filter')).toHaveLength(2);
            expect(findChunks('Peter Lowe\'s Blocklist', 'lo')).toHaveLength(5);
            expect(findChunks('Fanboy\'s Anti-Facebook List', 'Bo')).toHaveLength(5);
            expect(findChunks('ChinaList+EasyList', '+')).toHaveLength(3);
        });
        it('matches', () => {
            let chunks = findChunks('AdGuard Base filter', 'base');
            let expected = ['AdGuard ', 'Base', ' filter'];
            expect(chunks).toEqual(expected);

            chunks = findChunks('AdGuard Base filter', 'base FIlt');
            expected = ['AdGuard ', 'Base filt', 'er'];
            expect(chunks).toEqual(expected);

            chunks = findChunks('Fanboy\'s Anti-Facebook List', 'Bo');
            expected = ['Fan', 'bo', 'y\'s Anti-Face', 'bo', 'ok List'];
            expect(chunks).toEqual(expected);

            chunks = findChunks('ChinaList+EasyList', '+');
            expected = ['ChinaList', '+', 'EasyList'];
            expect(chunks).toEqual(expected);
        });
    });
});
