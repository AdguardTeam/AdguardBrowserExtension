import { Version } from '../../../../Extension/src/background/utils';

describe('version', () => {
    describe('parses parts from semver string', () => {
        const cases = [
            { value: '1', expected: [1, 0, 0, 0] },
            { value: '1.2', expected: [1, 2, 0, 0] },
            { value: '1.2.3.4', expected: [1, 2, 3, 4] },
        ];

        it.each(cases)('parses parts from $value', ({ value, expected }) => {
            expect(new Version(value).data).toStrictEqual(expected);
        });
    });

    describe('throws parse error', () => {
        const createFoundEmptyPartCase = (value: string): { value: string, expected: string } => {
            return { value, expected: `Found empty part in string '${value}'` };
        };

        const createCannotParseCase = (value: string): { value: string, expected: string } => {
            return { value, expected: `Can not parse '${value}' string` };
        };

        const createCannotParseLeadingZero = (value: string): { value: string, expected: string } => {
            return { value, expected: `Can not parse ${value}. Leading zeros are not allowed in the version parts` };
        };

        const cases = [
            createFoundEmptyPartCase(''),
            createFoundEmptyPartCase('1.2.'),
            createFoundEmptyPartCase('1..2'),
            createFoundEmptyPartCase('.1.2'),
            createCannotParseCase('test'),
            createCannotParseCase('1.test.2.1'),
            createCannotParseLeadingZero('01.1.2'),
        ];

        it.each(cases)('throws parse error, if argument is $value', ({ value, expected }) => {
            expect(() => new Version(value)).toThrow(expected);
        });
    });

    describe('compares versions', () => {
        const cases = [
            { left: '1.0.0.0', right: '2.0.0.0', expected: -1 },
            { left: '2.0.0.0', right: '1.0.0.0', expected: 1 },
            { left: '1.0.0.0', right: '1.0.0.0', expected: 0 },
            { left: '1.0.0.1', right: '1.0.0.2', expected: -1 },
            { left: '1.2', right: '1.0.2', expected: 1 },
            { left: '1.0.0.0.1', right: '1.0.0.0', expected: 0 },
        ];

        it.each(cases)('compares $left with $right', ({ left, right, expected }) => {
            expect(new Version(left).compare(new Version(right))).toBe(expected);
        });
    });

    it('throws error, if versions cannot be compared', () => {
        const version = new Version('1.2.3.4');
        const invalidVersion = 'invalid' as unknown as Version;

        const expectedErrorMessage = 'Can not compare versions';

        expect(() => version.compare(invalidVersion)).toThrow(expectedErrorMessage);
    });
});
