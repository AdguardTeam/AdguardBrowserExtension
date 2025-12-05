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
