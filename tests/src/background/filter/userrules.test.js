import { userrules } from '../../../../Extension/src/background/filter/userrules';

describe('userRules', () => {
    it('handles invalid rules', () => {
        // AG does not support selectors with combinators
        const invalidRule = 'bing.com##^#b_results > .b_a';
        const result = userrules.convertRules([invalidRule]);
        expect(result).toEqual([]);
    });
});
