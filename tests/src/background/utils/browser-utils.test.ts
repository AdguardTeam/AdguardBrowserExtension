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

import { BrowserUtils } from '../../../../Extension/src/background/utils/browser-utils';

describe('browserUtils', () => {
    it('isSemver', () => {
        expect(BrowserUtils.isSemver('4.0.1')).toBeTruthy();
        expect(BrowserUtils.isSemver('not.valid.semver')).toBeFalsy();
        expect(BrowserUtils.isSemver('4.0.102')).toBeTruthy();
        expect(BrowserUtils.isSemver('04.0.102')).toBeFalsy();
        expect(BrowserUtils.isSemver('05February2022v1')).toBeFalsy();
        expect(BrowserUtils.isSemver(null)).toBeFalsy();
        expect(BrowserUtils.isSemver(false)).toBeFalsy();
        expect(BrowserUtils.isSemver('')).toBeFalsy();
        expect(BrowserUtils.isSemver()).toBeFalsy();
        expect(BrowserUtils.isSemver('1.1.1.1')).toBeTruthy();
        expect(BrowserUtils.isSemver('1.1')).toBeTruthy();
        expect(BrowserUtils.isSemver('1')).toBeTruthy();
    });

    describe('getPatchVersionNumber', () => {
        it('extracts patch version from full semver', () => {
            expect(BrowserUtils.getPatchVersionNumber('1.2.3')).toBe('3');
            expect(BrowserUtils.getPatchVersionNumber('4.5.6.7')).toBe('6');
        });

        it('returns 0 for versions without patch number', () => {
            expect(BrowserUtils.getPatchVersionNumber('1.2')).toBe('0');
            expect(BrowserUtils.getPatchVersionNumber('5')).toBe('0');
        });

        it('handles various patch numbers', () => {
            expect(BrowserUtils.getPatchVersionNumber('2.3.0')).toBe('0');
            expect(BrowserUtils.getPatchVersionNumber('1.0.999')).toBe('999');
            expect(BrowserUtils.getPatchVersionNumber('10.20.30.40')).toBe('30');
        });
    });

    describe('getBuildVersionNumber', () => {
        it('extracts build version from full semver', () => {
            expect(BrowserUtils.getBuildVersionNumber('1.2.3.4')).toBe('4');
            expect(BrowserUtils.getBuildVersionNumber('5.6.7.8')).toBe('8');
        });

        it('returns 0 for versions without build number', () => {
            expect(BrowserUtils.getBuildVersionNumber('1.2.3')).toBe('0');
            expect(BrowserUtils.getBuildVersionNumber('1.2')).toBe('0');
            expect(BrowserUtils.getBuildVersionNumber('1')).toBe('0');
        });

        it('handles various build numbers', () => {
            expect(BrowserUtils.getBuildVersionNumber('2.3.4.0')).toBe('0');
            expect(BrowserUtils.getBuildVersionNumber('1.0.0.999')).toBe('999');
            expect(BrowserUtils.getBuildVersionNumber('10.20.30.999')).toBe('999');
        });
    });

    // TODO: cover other cases
});
