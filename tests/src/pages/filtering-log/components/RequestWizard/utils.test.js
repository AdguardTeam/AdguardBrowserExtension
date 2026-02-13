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
    expect,
    it,
} from 'vitest';

import { UrlUtils } from '../../../../../../Extension/src/pages/filtering-log/components/RequestWizard/utils';

describe('utils', () => {
    describe('UrlUtils', () => {
        describe('getProtocol', () => {
            it('returns protocol of url', () => {
                expect(UrlUtils.getProtocol('https://example.org')).toBe('https:');
                expect(UrlUtils.getProtocol('http://example.org')).toBe('http:');
            });

            it('returns protocol of url with stun', () => {
                expect(UrlUtils.getProtocol('stun:example.org')).toBe('stun:');
                expect(UrlUtils.getProtocol('turn:example.org')).toBe('turn:');
            });
        });

        describe('getUrlWithoutScheme', () => {
            it('returns url without scheme for standard protocols https, ws', () => {
                expect(UrlUtils.getUrlWithoutScheme('https://example.org')).toBe('example.org');
                expect(UrlUtils.getUrlWithoutScheme('https://www.example.org')).toBe('example.org');
            });
            it('returns url without scheme for non-standard protocols stun', () => {
                expect(UrlUtils.getUrlWithoutScheme('stun:example.org')).toBe('example.org');
            });
        });
    });
});
