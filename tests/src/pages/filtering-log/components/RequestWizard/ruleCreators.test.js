/* eslint-disable max-len */
import {
    createDocumentLevelBlockRule,
    createExceptionCookieRules,
    createExceptionCssRule,
    createExceptionScriptRule,
    splitToPatterns,
} from '../../../../../../Extension/src/pages/filtering-log/components/RequestWizard/ruleCreators';

describe('ruleCreators', () => {
    describe('splitToPatterns', () => {
        it('splits urls for blocking', () => {
            const url = 'https://www.gstatic.com/firebasejs/6.0.4/firebase-app.js';
            const domain = 'gstatic.com';
            const isAllowlist = false;
            const result = splitToPatterns(url, domain, isAllowlist);
            expect(result).toHaveLength(4);
            expect(result[0]).toBe('||gstatic.com/firebasejs/6.0.4/firebase-app.js');
            expect(result[1]).toBe('||gstatic.com/firebasejs/6.0.4/');
            expect(result[2]).toBe('||gstatic.com/firebasejs/');
            expect(result[3]).toBe('||gstatic.com^');
        });

        it('splits urls for allowing rule', () => {
            const url = 'https://www.gstatic.com/firebasejs/6.0.4/firebase-app.js';
            const domain = 'gstatic.com';
            const isAllowlist = true;
            const result = splitToPatterns(url, domain, isAllowlist);
            expect(result).toHaveLength(4);
            expect(result[0]).toBe('@@||gstatic.com/firebasejs/6.0.4/firebase-app.js');
            expect(result[1]).toBe('@@||gstatic.com/firebasejs/6.0.4/');
            expect(result[2]).toBe('@@||gstatic.com/firebasejs/');
            expect(result[3]).toBe('@@||gstatic.com^');
        });
    });

    describe('createDocumentLevelBlockRule', () => {
        it('creates document level block rule', () => {
            const rule = {
                ruleText: '@@||example.org^$urlblock',
            };

            const result = createDocumentLevelBlockRule(rule);
            expect(result).toBe('@@||example.org^$urlblock,badfilter');
        });
    });

    describe('createExceptionCssRule', () => {
        it('creates exception rule for css cosmetic rules', () => {
            const ruleText = 'example.org#$#body { background-color: #333!important; }';
            const rule = { ruleText };
            const event = { frameDomain: 'example.org' };
            const result = createExceptionCssRule(rule, event);
            expect(result).toBe('example.org#@$#body { background-color: #333!important; }');
        });

        it('creates exception rule for element hiding rules', () => {
            const rule = {
                ruleText: 'example.org###adblock',
            };
            const event = { frameDomain: 'example.org' };
            const result = createExceptionCssRule(rule, event);
            expect(result).toBe('example.org#@##adblock');
        });

        it('creates exception rule for extcss element hiding rules', () => {
            const rule = {
                ruleText: 'example.org#?#.banner:matches-css(width: 360px)',
            };
            const event = { frameDomain: 'example.org' };
            const result = createExceptionCssRule(rule, event);
            expect(result).toBe('example.org#@?#.banner:matches-css(width: 360px)');
        });

        it('creates exception rule for extcss cosmetic rules', () => {
            const rule = {
                ruleText: 'example.org#$?#h3:contains(cookies) { display: none!important; }',
            };
            const event = { frameDomain: 'example.org' };
            const result = createExceptionCssRule(rule, event);
            expect(result).toBe('example.org#@$?#h3:contains(cookies) { display: none!important; }');
        });

        it('creates exception rule for html filtering rules', () => {
            const rule = {
                ruleText: 'example.org$$script[data-src="banner"]',
            };
            const event = { frameDomain: 'example.org' };
            const result = createExceptionCssRule(rule, event);
            expect(result).toBe('example.org$@$script[data-src="banner"]');
        });
    });

    describe('createExceptionCookieRule', () => {
        it('creates exception cookie rules', () => {
            const RULE_MODIFIED_VALUE = '/test|name/';
            const COOKIE_NAME = 'testName';

            const event = {
                cookieName: COOKIE_NAME,
                frameDomain: 'example.org',
                requestRule: { modifierValue: RULE_MODIFIED_VALUE },
            };
            const result = createExceptionCookieRules(event);
            expect(result).toHaveLength(3);
            expect(result[0]).toBe(`@@||example.org^$cookie=${COOKIE_NAME}`);
            expect(result[1]).toBe(`@@||example.org^$cookie=${RULE_MODIFIED_VALUE}`);
            expect(result[2]).toBe('@@||example.org^$cookie');
        });
    });

    describe('createExceptionScriptRule', () => {
        it('creates exception js rule', () => {
            const rule = {
                ruleText: 'example.org#%#window.__gaq = undefined;',
            };
            const event = { frameDomain: 'example.org' };
            const result = createExceptionScriptRule(rule, event);
            expect(result).toBe('example.org#@%#window.__gaq = undefined;');
        });

        it('creates exception js rule for ubo syntax', () => {
            const rule = {
                ruleText: 'example.org##+js(nobab)',
            };
            const event = { frameDomain: 'example.org' };
            const result = createExceptionScriptRule(rule, event);
            expect(result).toBe('example.org#@#+js(nobab)');
        });
    });
});
