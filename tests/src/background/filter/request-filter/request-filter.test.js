/* eslint-disable no-console,max-len */
import * as TSUrlFilter from '@adguard/tsurlfilter';
import { RequestFilter } from '../../../../../Extension/src/background/filter/request-filter';
import { engine } from '../../../../../Extension/src/background/filter/engine';
import { RequestTypes } from '../../../../../Extension/src/background/utils/request-types';
import { filtersFromTxt } from './test_filter';
import { redirectService } from '../../../../../Extension/src/background/filter/services/redirect-service';

jest.mock('../../../../../Extension/src/background/filter/request-blocking', () => {
    return {
        __esModule: true,
        webRequestService: {
            isCollectingCosmeticRulesHits: jest.fn(() => false),
        },
    };
});

jest.mock('../../../../../Extension/src/common/log');

const createRequestFilter = async (rulesText) => {
    const lists = [new TSUrlFilter.StringRuleList(1, rulesText, false, false)];
    await engine.startEngine(lists);
    return new RequestFilter();
};

const createRequestFilterWithRules = rules => createRequestFilter(rules.join('\n'));

describe('RequestFilter', () => {
    it('General', async () => {
        const url = 'https://test.com/';
        const referrer = 'example.org';
        const ruleText = '||test.com^';

        const requestFilter = await createRequestFilter(ruleText);

        const result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
        expect(result).toBeTruthy();
        expect(result.getText()).toBe(ruleText);
    });

    it('RequestFilter.findRuleForRequest performance', async () => {
        TSUrlFilter.setLogger({
            error() {},
            warn() {},
            log() {},
            info() {},
        });

        // eslint-disable-next-line no-undef
        const requestFilter = await createRequestFilter(filtersFromTxt.join('\n'));

        const url = 'https://www.youtube.com/gaming';
        const referrer = 'http://example.org';

        const count = 50000;
        const startTime = new Date().getTime();
        for (let k = 0; k < count; k += 1) {
            requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
        }

        const elapsed = new Date().getTime() - startTime;
        expect(elapsed).toBeGreaterThan(0);

        console.log('------------------------------------START TEST PERFORMANCE-----------------------------------');
        console.log(`Total: ${elapsed} ms`);
        console.log(`Average: ${elapsed / count} ms`);
        console.log('------------------------------------END TEST PERFORMANCE-----------------------------------');

        // Total: 84 ms
        // Average: 0.00168 ms

        TSUrlFilter.setLogger(console);
    });

    it('Whitelist rules selecting', async () => {
        const url = 'https://test.com/';
        const referrer = 'http://example.org';

        const rule = '||test.com^';
        const whitelist = '@@||test.com^';
        const documentRule = '@@||test.com^$document';
        const genericHideRule = '@@||test.com^$generichide';

        let requestFilter;
        let result;

        requestFilter = await createRequestFilterWithRules([rule]);
        result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
        expect(result).toBeTruthy();
        expect(result.getText()).toBe(rule);

        requestFilter = await createRequestFilterWithRules([rule, whitelist]);
        result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
        expect(result).toBeTruthy();
        expect(result.getText()).toBe(whitelist);

        requestFilter = await createRequestFilterWithRules([rule, documentRule]);
        result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.DOCUMENT);
        expect(result).toBeTruthy();
        expect(result.ruleText).toBe(documentRule);

        requestFilter = await createRequestFilterWithRules([rule, whitelist, genericHideRule]);
        result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.DOCUMENT);
        expect(result).toBeTruthy();
        expect(result.getText()).toBe(genericHideRule);
    });

    it('Important modifier rules', async () => {
        const url = 'https://test.com/';
        const referrer = 'http://example.org';

        const rule = '||test.com^';
        const whitelist = '@@||test.com^';
        const important = '||test.com^$important';

        let requestFilter;
        let result;

        requestFilter = await createRequestFilterWithRules([rule]);
        result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
        expect(result).toBeTruthy();
        expect(result.getText()).toBe(rule);

        requestFilter = await createRequestFilterWithRules([rule, whitelist]);
        result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
        expect(result).toBeTruthy();
        expect(result.getText()).toBe(whitelist);

        requestFilter = await createRequestFilterWithRules([rule, whitelist, important]);
        result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
        expect(result).toBeTruthy();
        expect(result.getText()).toBe(important);
    });

    it('Cookie rules', async () => {
        const ruleText = '||xpanama.net^$third-party,cookie=c_user,domain=~example.org|merriam-webster.com';
        const requestFilter = await createRequestFilterWithRules([ruleText]);

        const rules = requestFilter.findCookieRules(
            'https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP',
            'https://www.merriam-webster.com/',
            RequestTypes.DOCUMENT,
        );

        expect(rules).toHaveLength(1);
        expect(rules[0].getText()).toBe(ruleText);
    });

    it('Redirect rules', async () => {
        const rawYaml = `
        - title: 1x1-transparent.gif
          aliases:
            - 1x1-transparent-gif
          comment: 'http://probablyprogramming.com/2009/03/15/the-tiniest-gif-ever'
          contentType: image/gif;base64
          content: R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==

        - title: noopjs
          aliases:
            - blank-js
          contentType: application/javascript
          content: (function() {})()`;

        redirectService.init(rawYaml);

        const redirectRule = 'example.org/ads.js$script,redirect=noopjs';
        const blockRedirectRule = '||example.org/*.png$image,redirect=1x1-transparent.gif';

        const requestFilter = await createRequestFilterWithRules([redirectRule, blockRedirectRule]);

        const rule = requestFilter.findRuleForRequest(
            'http://example.org/ads.js', 'http://example.org/', RequestTypes.SCRIPT,
        );
        expect(rule).toBeTruthy();
        expect(rule.getText()).toBe(redirectRule);

        const imgRule = requestFilter.findRuleForRequest(
            'http://example.org/ad.png', 'http://example.org/', RequestTypes.IMAGE,
        );
        expect(imgRule).toBeTruthy();
        expect(imgRule.getText()).toBe(blockRedirectRule);
    });

    describe('$badfilter', () => {
        it('BadFilter option', async () => {
            const rule = 'https:*_ad_';
            const ruleTwo = 'https:*_da_';
            const ruleThree = 'https:*_ad_$match-case';
            const badFilterRule = 'https:*_ad_$badfilter';

            const comAd = 'https://google.com/_ad_agency';
            const comDa = 'https://google.com/_da_agency';

            let requestFilter;

            requestFilter = await createRequestFilterWithRules([
                rule,
                ruleTwo,
            ]);
            expect(requestFilter.findRuleForRequest(comAd, '', RequestTypes.SUBDOCUMENT)).toBeTruthy();
            expect(requestFilter.findRuleForRequest(comDa, '', RequestTypes.SUBDOCUMENT)).toBeTruthy();

            requestFilter = await createRequestFilterWithRules([
                rule,
                ruleTwo,
                badFilterRule,
            ]);
            expect(requestFilter.findRuleForRequest(comAd, '', RequestTypes.SUBDOCUMENT)).toBeFalsy();
            expect(requestFilter.findRuleForRequest(comDa, '', RequestTypes.SUBDOCUMENT)).toBeTruthy();

            requestFilter = await createRequestFilterWithRules([
                ruleTwo,
                ruleThree,
                badFilterRule,
            ]);
            expect(requestFilter.findRuleForRequest(comAd, '', RequestTypes.SUBDOCUMENT)).toBeTruthy();
            expect(requestFilter.findRuleForRequest(comDa, '', RequestTypes.SUBDOCUMENT)).toBeTruthy();

            requestFilter = await createRequestFilterWithRules([
                ruleTwo,
                ruleThree,

            ]);
            expect(requestFilter.findRuleForRequest(comAd, '', RequestTypes.SUBDOCUMENT)).toBeTruthy();
            expect(requestFilter.findRuleForRequest(comDa, '', RequestTypes.SUBDOCUMENT)).toBeTruthy();

            requestFilter = await createRequestFilterWithRules([
                ruleTwo,
            ]);
            expect(requestFilter.findRuleForRequest(comAd, '', RequestTypes.SUBDOCUMENT)).toBeFalsy();
            expect(requestFilter.findRuleForRequest(comDa, '', RequestTypes.SUBDOCUMENT)).toBeTruthy();
        });

        it('BadFilter option whitelist', async () => {
            const url = 'https://test.com/';
            const referrer = 'http://example.org';

            const rule = '||test.com^';
            const whitelist = '@@||test.com^';
            const badFilterRule = '@@||test.com^$badfilter';

            let requestFilter;
            let result;

            requestFilter = await createRequestFilterWithRules([
                rule,
            ]);

            result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
            expect(result).toBeTruthy();
            expect(result.getText()).toEqual(rule);


            requestFilter = await createRequestFilterWithRules([
                rule, whitelist,
            ]);

            result = requestFilter.findWhitelistRule(url, referrer, RequestTypes.SUBDOCUMENT);
            expect(result).toBeTruthy();
            expect(result.getText()).toEqual(whitelist);

            result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
            expect(result).toBeTruthy();
            expect(result.getText()).toEqual(whitelist);

            requestFilter = await createRequestFilterWithRules([
                rule, whitelist, badFilterRule,
            ]);

            result = requestFilter.findWhitelistRule(url, referrer, RequestTypes.SUBDOCUMENT);
            expect(result).toBeFalsy();

            result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
            expect(result).toBeTruthy();
            expect(result.getText()).toEqual(rule);
        });

        it('BadFilter multi-options', async () => {
            const rule = '||example.org^$object';
            const ruleTwo = '||example.org^';
            const badFilterRule = '||example.org^$badfilter,object';
            const badFilterRuleInv = '||example.org^$object,badfilter';

            const testUrl = 'https://example.org';

            let requestFilter;

            requestFilter = await createRequestFilterWithRules([
                rule, ruleTwo,
            ]);
            expect(requestFilter.findRuleForRequest(testUrl, '', RequestTypes.OBJECT)).toBeTruthy();
            expect(requestFilter.findRuleForRequest(testUrl, '', RequestTypes.SUBDOCUMENT)).toBeTruthy();

            requestFilter = await createRequestFilterWithRules([
                rule, ruleTwo, badFilterRule,
            ]);

            expect(requestFilter.findRuleForRequest(testUrl, '', RequestTypes.OBJECT)).toBeTruthy();
            expect(requestFilter.findRuleForRequest(testUrl, '', RequestTypes.SUBDOCUMENT)).toBeTruthy();
            expect(requestFilter.findRuleForRequest(testUrl, '', RequestTypes.OBJECT).getText()).toBe(ruleTwo);
            expect(requestFilter.findRuleForRequest(testUrl, '', RequestTypes.SUBDOCUMENT).getText()).toBe(ruleTwo);

            requestFilter = await createRequestFilterWithRules([
                rule, ruleTwo, badFilterRuleInv,
            ]);
            expect(requestFilter.findRuleForRequest(testUrl, '', RequestTypes.OBJECT)).toBeTruthy();
            expect(requestFilter.findRuleForRequest(testUrl, '', RequestTypes.SUBDOCUMENT)).toBeTruthy();
            expect(requestFilter.findRuleForRequest(testUrl, '', RequestTypes.OBJECT).getText()).toBe(ruleTwo);
            expect(requestFilter.findRuleForRequest(testUrl, '', RequestTypes.SUBDOCUMENT).getText()).toBe(ruleTwo);
        });

        it('BadFilter does not stop looking for other rules', async () => {
            const rule = '||example.org^$third-party';
            const ruleTwo = '||example.org^$xmlhttprequest';
            const badFilterRule = '||example.org^$third-party,badfilter';
            const badFilterRuleHttp = '||example.org^$xmlhttprequest,badfilter';

            const testUrl = 'https://example.org';
            const documentUrl = 'https://third-party.com';

            let requestFilter;

            requestFilter = await createRequestFilterWithRules([
                rule, ruleTwo,
            ]);

            expect(requestFilter.findRuleForRequest(testUrl, documentUrl, RequestTypes.DOCUMENT)).toBeTruthy();
            expect(requestFilter.findRuleForRequest(testUrl, '', RequestTypes.XMLHTTPREQUEST)).toBeTruthy();

            requestFilter = await createRequestFilterWithRules([
                rule, ruleTwo, badFilterRule,
            ]);
            expect(requestFilter.findRuleForRequest(testUrl, documentUrl, RequestTypes.DOCUMENT)).toBeFalsy();
            expect(requestFilter.findRuleForRequest(testUrl, '', RequestTypes.XMLHTTPREQUEST)).toBeTruthy();

            requestFilter = await createRequestFilterWithRules([
                rule, ruleTwo, badFilterRuleHttp,
            ]);

            expect(requestFilter.findRuleForRequest(testUrl, documentUrl, RequestTypes.DOCUMENT)).toBeTruthy();
            expect(requestFilter.findRuleForRequest(testUrl, '', RequestTypes.XMLHTTPREQUEST)).toBeFalsy();
        });
    });


    describe('$csp', () => {
        it('CSP rules', async () => {
            let requestFilter;
            let result;

            const cspRule = '||xpanama.net^$third-party,csp=connect-src \'none\',domain=~example.org|merriam-webster.com';
            requestFilter = await createRequestFilterWithRules([cspRule]);
            result = requestFilter.findCspRules(
                'https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP',
                'https://www.merriam-webster.com/',
                RequestTypes.DOCUMENT,
            );
            expect(result).toHaveLength(1);
            expect(result[0].getText()).toBe(cspRule);

            result = requestFilter.findCspRules(
                'https://xpanama.net',
                'https://example.org',
                RequestTypes.DOCUMENT,
            );
            expect(!result || result.length === 0).toBeTruthy();

            // Add matching directive whitelist rule
            const directiveWhitelistRule = '@@||xpanama.net^$csp=connect-src \'none\'';
            requestFilter = await createRequestFilterWithRules([cspRule, directiveWhitelistRule]);
            result = requestFilter.findCspRules(
                'https://xpanama.net',
                'https://www.merriam-webster.com/',
                RequestTypes.DOCUMENT,
            );
            // Specific whitelist rule should be returned
            expect(result).toHaveLength(1);
            expect(result[0].getText()).toBe(directiveWhitelistRule);

            // Add global whitelist rule
            const globalWhitelistRule = '@@||xpanama.net^$csp';
            requestFilter = await createRequestFilterWithRules([cspRule, directiveWhitelistRule, globalWhitelistRule]);
            result = requestFilter.findCspRules(
                'https://xpanama.net', 'https://www.merriam-webster.com/', RequestTypes.DOCUMENT,
            );
            // Global whitelist rule should be returned
            expect(result).toHaveLength(1);
            expect(result[0].getText()).toBe(globalWhitelistRule);

            // Add whitelist rule, but with not matched directive
            const directiveMissWhitelistRule = '@@||xpanama.net^$csp=frame-src \'none\'';
            requestFilter = await createRequestFilterWithRules([cspRule, directiveMissWhitelistRule]);
            result = requestFilter.findCspRules(
                'https://xpanama.net', 'https://www.merriam-webster.com/', RequestTypes.DOCUMENT,
            );
            expect(result).toHaveLength(1);
            expect(result[0].getText()).toBe(cspRule);

            // Add CSP rule with duplicated directive
            const duplicateCspRule = '||xpanama.net^$third-party,csp=connect-src \'none\'';
            requestFilter = await createRequestFilterWithRules([cspRule, directiveMissWhitelistRule, duplicateCspRule]);
            result = requestFilter.findCspRules(
                'https://xpanama.net', 'https://www.merriam-webster.com/', RequestTypes.DOCUMENT,
            );
            expect(result).toHaveLength(1);
            expect(result[0].getText() === cspRule || result[0].getText() === duplicateCspRule).toBeTruthy();

            // Test request type matching
            const cspRuleSubDocument = '||xpanama.net^$csp=connect-src http:,domain=merriam-webster.com,subdocument';
            const cspRuleNotSubDocument = '||xpanama.net^$csp=connect-src \'none\',domain=merriam-webster.com,~subdocument';
            const cspRuleAny = '||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com';
            requestFilter = await createRequestFilterWithRules([cspRuleSubDocument, cspRuleNotSubDocument, cspRuleAny]);

            result = requestFilter.findCspRules(
                'https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP',
                'https://www.merriam-webster.com/',
                RequestTypes.DOCUMENT,
            );
            expect(result).toHaveLength(2);
            expect(result[0].getText() === cspRuleAny || result[0].getText() === cspRuleNotSubDocument).toBeTruthy();
            expect(result[1].getText() === cspRuleAny || result[1].getText() === cspRuleNotSubDocument).toBeTruthy();

            result = requestFilter.findCspRules(
                'https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP',
                'https://www.merriam-webster.com/',
                RequestTypes.SUBDOCUMENT,
            );
            expect(result).toHaveLength(2);
            expect(result[0].getText() === cspRuleAny || result[0].getText() === cspRuleSubDocument).toBeTruthy();
            expect(result[1].getText() === cspRuleAny || result[1].getText() === cspRuleSubDocument).toBeTruthy();
        });

        it('CSP important rules', async () => {
            let requestFilter;
            let rules;

            // Test important rules
            const globalWhitelistRule = '@@||xpanama.net^$csp,domain=merriam-webster.com';
            const directiveWhitelistRule = '@@||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com';
            // eslint-disable-next-line max-len
            const importantDirectiveWhitelistRule = '@@||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com,important';
            const defaultCspRule = '||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com';
            const importantCspRule = '||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com,important';

            function checkCspRules(expected) {
                rules = requestFilter.findCspRules(
                    'https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP',
                    'https://www.merriam-webster.com/', RequestTypes.DOCUMENT,
                );
                expect(rules).toHaveLength(1);
                expect(rules[0].getText()).toBe(expected);
            }

            requestFilter = await createRequestFilterWithRules([
                globalWhitelistRule,
                directiveWhitelistRule,
                importantDirectiveWhitelistRule,
                defaultCspRule,
                importantCspRule,
            ]);

            checkCspRules(globalWhitelistRule);

            requestFilter = await createRequestFilterWithRules([
                directiveWhitelistRule,
                importantDirectiveWhitelistRule,
                defaultCspRule,
                importantCspRule,
            ]);
            checkCspRules(importantDirectiveWhitelistRule);

            requestFilter = await createRequestFilterWithRules([
                directiveWhitelistRule,
                defaultCspRule,
                importantCspRule,
            ]);
            checkCspRules(importantCspRule);

            requestFilter = await createRequestFilterWithRules([
                directiveWhitelistRule,
                defaultCspRule,
            ]);
            checkCspRules(directiveWhitelistRule);

            requestFilter = await createRequestFilterWithRules([
                defaultCspRule,
            ]);
            checkCspRules(defaultCspRule);
        });

        it('CSP rules are found correctly', async () => {
            /**
             * For example:
             * rule1 = '||$csp'
             * rule2 = '||$csp,subdocument'
             * rule3 = '||$csp,~subdocument'
             * findCspRules(RequestTypes.SUBDOCUMENT) = [rule1, rule2];
             * findCspRules(RequestTypes.DOCUMENT) = [rule1, rule3];
             */
            const url = 'https://example.org/blabla';

            const ruleText1 = '||example.org^$csp=default-src \'none\'';
            const ruleText2 = '||example.org^$csp=script-src \'none\',subdocument';
            const ruleText3 = '||example.org^$csp=connect-src \'none\',~subdocument';

            const requestFilter = await createRequestFilterWithRules([
                ruleText1, ruleText2, ruleText3,
            ]);

            const search1 = requestFilter.findCspRules(url, null, RequestTypes.SUBDOCUMENT);
            expect(search1).toHaveLength(2);
            expect(search1[0].getText()).toBe(ruleText1);
            expect(search1[1].getText()).toBe(ruleText2);

            const search2 = requestFilter.findCspRules(url, null, RequestTypes.DOCUMENT);
            expect(search2).toHaveLength(2);
            expect(search2[0].getText()).toBe(ruleText1);
            expect(search2[1].getText()).toBe(ruleText3);
        });
    });

    describe('Stylesheets', () => {
        it('Css Exception Rules', async () => {
            const rule = '##.sponsored';
            const rule1 = 'adguard.com#@#.sponsored';

            const testUrl = 'http://adguard.com';

            let filter = await createRequestFilterWithRules([rule]);
            let { css } = filter.getSelectorsForUrl(testUrl, TSUrlFilter.CosmeticOption.CosmeticOptionAll);
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('.sponsored { display: none!important; }');

            filter = await createRequestFilterWithRules([rule, rule1]);
            css = filter.getSelectorsForUrl(testUrl, TSUrlFilter.CosmeticOption.CosmeticOptionAll).css;
            expect(css).toHaveLength(0);

            css = filter.getSelectorsForUrl('http://another.com', TSUrlFilter.CosmeticOption.CosmeticOptionAll).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('.sponsored { display: none!important; }');
        });

        it('Css GenericHide Exception Rules', async () => {
            const genericOne = '##.generic-one';
            const genericTwo = '~google.com,~yahoo.com###generic';
            const nonGeneric = 'adguard.com##.non-generic';
            const exceptionRule = 'adguard.com#@#.generic-one';
            const genericHideRule = '@@||adguard.com^$generichide';
            const elemHideRule = '@@||adguard.com^$elemhide';

            const testUrl = 'http://adguard.com';
            const anOtherUrl = 'http://another.com';

            let filter;
            let css;

            filter = await createRequestFilterWithRules([genericOne]);
            css = filter.getSelectorsForUrl(testUrl, TSUrlFilter.CosmeticOption.CosmeticOptionAll).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('.generic-one { display: none!important; }');

            filter = await createRequestFilterWithRules([genericOne, genericTwo]);
            css = filter.getSelectorsForUrl(testUrl, TSUrlFilter.CosmeticOption.CosmeticOptionAll).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('.generic-one, #generic { display: none!important; }');

            filter = await createRequestFilterWithRules([genericOne, genericTwo, nonGeneric]);
            css = filter.getSelectorsForUrl(testUrl, TSUrlFilter.CosmeticOption.CosmeticOptionAll).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('.generic-one, #generic, .non-generic { display: none!important; }');

            css = filter.getSelectorsForUrl(anOtherUrl, TSUrlFilter.CosmeticOption.CosmeticOptionAll).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('.generic-one, #generic { display: none!important; }');

            filter = await createRequestFilterWithRules([genericOne, genericTwo, nonGeneric, exceptionRule]);
            css = filter.getSelectorsForUrl(testUrl, TSUrlFilter.CosmeticOption.CosmeticOptionAll).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('#generic, .non-generic { display: none!important; }');

            css = filter.getSelectorsForUrl(anOtherUrl, TSUrlFilter.CosmeticOption.CosmeticOptionAll).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('.generic-one, #generic { display: none!important; }');

            filter = await createRequestFilterWithRules([genericOne, genericTwo, nonGeneric, exceptionRule, genericHideRule]);
            css = filter.getSelectorsForUrl(testUrl, TSUrlFilter.CosmeticOption.CosmeticOptionAll).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('#generic, .non-generic { display: none!important; }');
            css = filter.getSelectorsForUrl(testUrl, TSUrlFilter.CosmeticOption.CosmeticOptionCSS).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('.non-generic { display: none!important; }');

            css = filter.getSelectorsForUrl(anOtherUrl, TSUrlFilter.CosmeticOption.CosmeticOptionAll).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('.generic-one, #generic { display: none!important; }');
            css = filter.getSelectorsForUrl(anOtherUrl, TSUrlFilter.CosmeticOption.CosmeticOptionCSS).css;
            expect(css).toHaveLength(0);

            filter = await createRequestFilterWithRules([genericOne, genericTwo, nonGeneric, genericHideRule]);
            css = filter.getSelectorsForUrl(testUrl, TSUrlFilter.CosmeticOption.CosmeticOptionAll).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('.generic-one, #generic, .non-generic { display: none!important; }');
            css = filter.getSelectorsForUrl(testUrl, TSUrlFilter.CosmeticOption.CosmeticOptionCSS).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('.non-generic { display: none!important; }');

            css = filter.getSelectorsForUrl(anOtherUrl, TSUrlFilter.CosmeticOption.CosmeticOptionAll).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('.generic-one, #generic { display: none!important; }');
            css = filter.getSelectorsForUrl(anOtherUrl, TSUrlFilter.CosmeticOption.CosmeticOptionCSS).css;
            expect(css).toHaveLength(0);

            filter = await createRequestFilterWithRules([genericOne, genericTwo, nonGeneric, genericHideRule, elemHideRule]);
            css = filter.getSelectorsForUrl(testUrl, TSUrlFilter.CosmeticOption.CosmeticOptionAll).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('.generic-one, #generic, .non-generic { display: none!important; }');
            css = filter.getSelectorsForUrl(testUrl, TSUrlFilter.CosmeticOption.CosmeticOptionCSS).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('.non-generic { display: none!important; }');

            css = filter.getSelectorsForUrl(anOtherUrl, TSUrlFilter.CosmeticOption.CosmeticOptionAll).css;
            expect(css).toHaveLength(1);
            expect(css[0].trim()).toBe('.generic-one, #generic { display: none!important; }');
            css = filter.getSelectorsForUrl(anOtherUrl, TSUrlFilter.CosmeticOption.CosmeticOptionCSS).css;
            expect(css).toHaveLength(0);
        });
    });

    describe('Misc', () => {
        it('$document modifier', async () => {
            const rule = '||example.org^$document';

            const requestFilter = await createRequestFilterWithRules([rule]);
            expect(requestFilter.findRuleForRequest(
                'https://example.org',
                'https://example.org',
                RequestTypes.DOCUMENT,
            )).toBeTruthy();
        });

        it('Domain restriction semantic', async () => {
            const url = 'https://example.org/';

            const cspRule = '$domain=example.org,csp=script-src \'none\'';
            const cookieRule = '$cookie=test,domain=example.org';

            const requestFilter = await createRequestFilterWithRules([cspRule, cookieRule]);
            const cspResultDocument = requestFilter.findCspRules(url, url, RequestTypes.DOCUMENT);
            expect(cspResultDocument).toHaveLength(1);
            expect(cspResultDocument[0].getText()).toBe(cspRule);

            const cspResultSubDocument = requestFilter.findCspRules(url, url, RequestTypes.SUBDOCUMENT);
            expect(cspResultSubDocument).toHaveLength(1);
            expect(cspResultSubDocument[0].getText()).toBe(cspRule);

            const cookieResult = requestFilter.findCookieRules(url, url, RequestTypes.DOCUMENT);
            expect(cookieResult).toHaveLength(1);
            expect(cookieResult[0].getText()).toBe(cookieRule);
        });

        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1586
        it('Request filter finds rules for domains with "." in the end', async () => {
            const cssRuleText = 'www.benchmark.pl##body';
            let requestFilter = await createRequestFilterWithRules([cssRuleText]);

            // eslint-disable-next-line max-len
            const { css: [firstCss] } = requestFilter.getSelectorsForUrl('http://www.benchmark.pl./', TSUrlFilter.CosmeticOption.CosmeticOptionAll);
            expect(firstCss).toBeTruthy();
            expect(firstCss.indexOf('body { display: none!important; }')).toBeGreaterThan(-1);

            const urlRuleText = '||cdn.benchmark.pl^$domain=benchmark.pl';
            requestFilter = await createRequestFilterWithRules([cssRuleText, urlRuleText]);

            const rule = requestFilter.findRuleForRequest(
                'http://cdn.benchmark.pl/assets/css/mainPage.min.css',
                'http://www.benchmark.pl./',
                RequestTypes.STYLESHEET,
            );

            expect(rule.getText()).toBe(urlRuleText);
        });

        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1534
        // eslint-disable-next-line max-len
        it('In case request has "DOCUMENT" type - $domain modifier will match as well request URL hostname', async () => {
            const urlRuleText = '||check.com/url$domain=example.org|check.com';
            const requestFilter = await createRequestFilterWithRules([urlRuleText]);

            // Will match document url host
            let rule = requestFilter.findRuleForRequest(
                'http://check.com/url',
                'http://www.example.org/',
                RequestTypes.DOCUMENT,
            );

            expect(rule.getText()).toBe(urlRuleText);

            // request url doesn't match
            rule = requestFilter.findRuleForRequest(
                'http://another.org/url',
                'http://www.example.org/',
                RequestTypes.DOCUMENT,
            );

            expect(rule).toBeFalsy();

            // Will match request url host
            rule = requestFilter.findRuleForRequest(
                'http://check.com/url',
                'http://test.com/',
                RequestTypes.DOCUMENT,
            );

            expect(rule.getText()).toBe(urlRuleText);

            // Will match request url host
            rule = requestFilter.findRuleForRequest(
                'http://check.com/url',
                'http://test.com/',
                RequestTypes.SUBDOCUMENT,
            );

            expect(rule.getText()).toBe(urlRuleText);

            // Request type DOCUMENT is required
            rule = requestFilter.findRuleForRequest(
                'http://check.com/url',
                'http://test.com/',
                RequestTypes.IMAGE,
            );

            expect(rule).toBeFalsy();
        });

        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1534
        // eslint-disable-next-line max-len
        it('In case request has "DOCUMENT" type - $domain modifier will match as well request URL hostname 2', async () => {
            const urlRuleText = '|http://$third-party,domain=example.org';
            const requestFilter = await createRequestFilterWithRules([urlRuleText]);

            // Will match document url host
            let rule = requestFilter.findRuleForRequest(
                'http://check.com/url',
                'http://www.example.org/',
                RequestTypes.DOCUMENT,
            );

            expect(rule.getText()).toBe(urlRuleText);

            // Will match request url host
            // rule = requestFilter.findRuleForRequest(
            //     'http://www.example.org/url',
            //     'http://test.com/',
            //     RequestTypes.DOCUMENT
            // );
            //
            // expect(rule.getText(), urlRuleText);

            // Request type DOCUMENT is required
            rule = requestFilter.findRuleForRequest(
                'http://check.com/url',
                'http://test.com/',
                RequestTypes.SUBDOCUMENT,
            );

            expect(rule).toBeFalsy();

            // Request type DOCUMENT is required
            rule = requestFilter.findRuleForRequest(
                'http://check.com/url',
                'http://test.com/',
                RequestTypes.IMAGE,
            );

            expect(rule).toBeFalsy();
        });

        it('Invalid scriptlets are not added to the scripts string', async () => {
            const validScriptletRuleText = 'example.org#%#//scriptlet("adjust-setTimeout", "example", "400")';
            const invalidScriptletRuleText = 'example.org#%#//scriptlet("adjust-setTimeout-invalid", "example", "400")';

            const requestFilter = await createRequestFilterWithRules([validScriptletRuleText, invalidScriptletRuleText]);
            const scripts = requestFilter.getScriptsForUrl('https://example.org', TSUrlFilter.CosmeticOption.CosmeticOptionAll);

            expect(scripts).toHaveLength(1);
            expect(scripts[0].script).toBeTruthy();
        });
    });
});
