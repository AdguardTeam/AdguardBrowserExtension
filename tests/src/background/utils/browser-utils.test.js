import { browserUtils } from '../../../../Extension/src/background/utils/browser-utils';

describe('browserUtils', () => {
    it('isSemver', () => {
        expect(browserUtils.isSemver('4.0.1')).toBeTruthy();
        expect(browserUtils.isSemver('not.valid.semver')).toBeFalsy();
        expect(browserUtils.isSemver('4.0.102')).toBeTruthy();
        expect(browserUtils.isSemver('04.0.102')).toBeFalsy();
        expect(browserUtils.isSemver('05February2022v1')).toBeFalsy();
        expect(browserUtils.isSemver(null)).toBeFalsy();
        expect(browserUtils.isSemver(false)).toBeFalsy();
        expect(browserUtils.isSemver('')).toBeFalsy();
        expect(browserUtils.isSemver()).toBeFalsy();
    });
});
