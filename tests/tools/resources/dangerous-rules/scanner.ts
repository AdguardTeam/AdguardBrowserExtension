import { isMatchingCriteria } from '../../../../tools/resources/dangerous-rules/scanner';

describe('scanner', () => {
    describe('isMatchingCriteria', () => {
        test('should match a line with createElement and inclusion pattern', () => {
            const line = 'document.createElement("#%# filter rule")';
            expect(isMatchingCriteria(line)).toBe(true);
        });

        test('should not match a line without inclusion pattern', () => {
            const line = 'document.createElement("div")';
            expect(isMatchingCriteria(line)).toBe(false);
        });

        test('should not match a line with exclusion pattern', () => {
            const line = '//scriptlet document.createElement("div")';
            expect(isMatchingCriteria(line)).toBe(false);
        });

        test('should match a line with setAttribute and inclusion pattern', () => {
            const line = 'element.setAttribute("#@%# filter rule", "value")';
            expect(isMatchingCriteria(line)).toBe(true);
        });
    });
});
