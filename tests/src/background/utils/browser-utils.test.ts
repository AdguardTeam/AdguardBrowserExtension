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

    // TODO: cover other cases
});
