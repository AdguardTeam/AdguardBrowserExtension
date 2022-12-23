/* eslint-disable @typescript-eslint/no-unused-vars */
import { UserRulesApi } from '../../../../../Extension/src/background/api/filters/userrules';

describe('userRules', () => {
    it('handles invalid rules', () => {
        // AG does not support selectors with combinators
        const invalidRule = 'bing.com##^#b_results > .b_a';
        const result = UserRulesApi.convertRules([invalidRule]);
        expect(result).toEqual([]);
    });
});
