import { Version } from '../../../../Extension/src/background/utils';

describe('version', () => {
    it('parses parts from semver string', () => {
        const semver = '1.2.3.4';
        const expectedVersionData = [1, 2, 3, 4];

        const version = new Version(semver);

        expect(version.data).toStrictEqual(expectedVersionData);
    });

    it('throws parse error, if semver string is invalid', () => {
        const invalidSemver = 'test';
        const expectedErrorMessage = 'Can not parse version string';

        expect(() => new Version(invalidSemver)).toThrow(expectedErrorMessage);
    });

    it('compares versions', () => {
        const v1 = new Version('1.0.0.0');
        const v2 = new Version('2.0.0.0');

        expect(v1.compare(v2)).toBe(-1);
        expect(v2.compare(v1)).toBe(1);
        expect(v2.compare(v2)).toBe(0);
    });

    it('throws error, if versions cannot be compared', () => {
        const version = new Version('1.2.3.4');
        const invalidVersion = 'invalid' as unknown as Version;

        const expectedErrorMessage = 'Can not compare versions';

        expect(() => version.compare(invalidVersion)).toThrow(expectedErrorMessage);
    });
});
