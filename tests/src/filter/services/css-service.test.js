/* eslint-disable max-len */
import * as TSUrlFilter from '@adguard/tsurlfilter';
import { cssService } from '../../../../Extension/src/background/filter/services/css-service';

describe('cssService', () => {
    it('General', () => {
        const elemhideRuleText = 'example.org##body';
        const injectRuleText = 'example.org#$#.textad { visibility: hidden; }';

        const elemhideRule = new TSUrlFilter.CosmeticRule(elemhideRuleText, 1);
        const injectRule = new TSUrlFilter.CosmeticRule(injectRuleText, 1);

        let stylesheet = cssService.buildStyleSheet([elemhideRule], [injectRule]);
        expect(stylesheet).toBeTruthy();
        expect(stylesheet).toHaveLength(2);
        expect(stylesheet[0]).toBe('body { display: none!important; }\r\n');
        expect(stylesheet[1]).toBe('.textad { visibility: hidden; }');

        stylesheet = cssService.buildStyleSheet([elemhideRule], [injectRule], true);
        expect(stylesheet).toBeTruthy();
        expect(stylesheet).toHaveLength(2);
        expect(stylesheet[0]).toBe('body { display: none!important; }\r\n');
        expect(stylesheet[1]).toBe('.textad { visibility: hidden; }');
    });

    it('Css hits', () => {
        const elemhideRuleText = 'example.org##body';
        const injectRuleText = 'example.org#$#.textad { visibility: hidden; }';

        const elemhideRule = new TSUrlFilter.CosmeticRule(elemhideRuleText, 1);
        const injectRule = new TSUrlFilter.CosmeticRule(injectRuleText, 1);

        let stylesheet = cssService.buildStyleSheetHits([elemhideRule], [injectRule]);
        expect(stylesheet).toBeTruthy();
        expect(stylesheet).toHaveLength(2);
        expect(stylesheet[0]).toBe('body { display: none!important; content: \'adguard1%3Bexample.org%23%23body\' !important;}\r\n');
        expect(stylesheet[1]).toBe('.textad { visibility: hidden; content: \'adguard1%3Bexample.org%23%24%23.textad%20%7B%20visibility%3A%20hidden%3B%20%7D\' !important;}\r\n');

        stylesheet = cssService.buildStyleSheetHits([elemhideRule], [injectRule]);
        expect(stylesheet).toBeTruthy();
        expect(stylesheet).toHaveLength(2);
        expect(stylesheet[0]).toBe('body { display: none!important; content: \'adguard1%3Bexample.org%23%23body\' !important;}\r\n');
        expect(stylesheet[1]).toBe('.textad { visibility: hidden; content: \'adguard1%3Bexample.org%23%24%23.textad%20%7B%20visibility%3A%20hidden%3B%20%7D\' !important;}\r\n');
    });
});
