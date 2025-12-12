/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-disable max-len */
import {
    describe,
    it,
    expect,
} from 'vitest';

import {
    createDocumentLevelBlockRule,
    createExceptionCookieRules,
    createExceptionCssRule,
    createExceptionScriptRule,
    splitToPatterns,
    createRuleFromParams,
    getRuleText,
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
                appliedRuleText: '@@||example.org^$urlblock',
            };

            const result = createDocumentLevelBlockRule(rule);
            expect(result).toBe('@@||example.org^$urlblock,badfilter');
        });
    });

    describe('createExceptionCssRule', () => {
        it('creates exception rule for css cosmetic rules', () => {
            const appliedRuleText = 'example.org#$#body { background-color: #333!important; }';
            const rule = { appliedRuleText };
            const event = { frameDomain: 'example.org' };
            const result = createExceptionCssRule(rule, event);
            expect(result).toBe('example.org#@$#body { background-color: #333!important; }');
        });

        it('creates exception rule for element hiding rules', () => {
            const rule = {
                appliedRuleText: 'example.org###adblock',
            };
            const event = { frameDomain: 'example.org' };
            const result = createExceptionCssRule(rule, event);
            expect(result).toBe('example.org#@##adblock');
        });

        it('creates exception rule for extcss element hiding rules', () => {
            const rule = {
                appliedRuleText: 'example.org#?#.banner:matches-css(width: 360px)',
            };
            const event = { frameDomain: 'example.org' };
            const result = createExceptionCssRule(rule, event);
            expect(result).toBe('example.org#@?#.banner:matches-css(width: 360px)');
        });

        it('creates exception rule for extcss cosmetic rules', () => {
            const rule = {
                appliedRuleText: 'example.org#$?#h3:contains(cookies) { display: none!important; }',
            };
            const event = { frameDomain: 'example.org' };
            const result = createExceptionCssRule(rule, event);
            expect(result).toBe('example.org#@$?#h3:contains(cookies) { display: none!important; }');
        });

        it('creates exception rule for html filtering rules', () => {
            const rule = {
                appliedRuleText: 'example.org$$script[data-src="banner"]',
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
                appliedRuleText: 'example.org#%#window.__gaq = undefined;',
            };
            const event = { frameDomain: 'example.org' };
            const result = createExceptionScriptRule(rule, event);
            expect(result).toBe('example.org#@%#window.__gaq = undefined;');
        });

        it('creates exception js rule for ubo syntax', () => {
            const rule = {
                appliedRuleText: 'example.org##+js(nobab)',
            };
            const event = { frameDomain: 'example.org' };
            const result = createExceptionScriptRule(rule, event);
            expect(result).toBe('example.org#@#+js(nobab)');
        });
    });

    describe('createRuleFromParams', () => {
        it('creates rules from parameters', () => {
            let ruleParams;
            let expectedRule;

            // Creates rule with default params on startup
            ruleParams = {
                important: false,
                removeParam: false,
                thirdParty: false,
                urlDomain: 'forbes.com',
                urlPattern: '@@||adsense.com/js/ads',
            };
            expectedRule = '@@||adsense.com/js/ads$domain=forbes.com';
            expect(createRuleFromParams(ruleParams)).toBe(expectedRule);

            // Handles input with additional options
            ruleParams = {
                important: true,
                removeParam: true,
                thirdParty: false,
                urlDomain: 'example.com',
                urlPattern: '||ad.click.net/*',
            };
            expectedRule = '||ad.click.net/*$domain=example.com,important,removeparam';
            expect(createRuleFromParams(ruleParams)).toBe(expectedRule);

            ruleParams = {
                important: true,
                removeParam: false,
                thirdParty: false,
                urlDomain: null,
                urlPattern: '@@||mc.yandex.ru/metrika/',
            };
            expectedRule = '@@||mc.yandex.ru/metrika/$important';
            expect(createRuleFromParams(ruleParams)).toBe(expectedRule);

            // Handles input with existing modifier: joins modifiers correctly
            ruleParams = {
                important: false,
                removeParam: false,
                thirdParty: false,
                urlDomain: 'contextual.media.net',
                urlPattern: '@@||contextual.media.net$removeparam=cs',
            };
            expectedRule = '@@||contextual.media.net$removeparam=cs,domain=contextual.media.net';
            expect(createRuleFromParams(ruleParams)).toBe(expectedRule);
        });
    });

    describe('getRuleText', () => {
        it('creates rule text with getRuleText', () => {
            const eventBase = {
                eventId: 'id',
                filterName: 'filterName',
            };

            // Rule with csp modifier must be whitelisted correctly
            const rulePattern = '@@||example.com^$csp=style-src *';
            const selectedEvent = {
                ...eventBase,
                csp: true,
                requestUrl: 'https://example.com/',
                frameUrl: 'https://example.com/',
                frameDomain: 'example.com',
                requestType: 'csp',
                timestamp: 1694175957526,
                requestRule: {
                    filterId: 1000,
                    appliedRuleText: '||example.com$csp=style-src *',
                    allowlistRule: false,
                    cspRule: true,
                    cookieRule: false,
                    modifierValue: 'style-src *',
                },
                appliedRuleText: '||example.com$csp=style-src *',
            };
            const ruleOptions = {
                ruleDomain: {
                    checked: false,
                },
                ruleThirdParty: {
                    checked: false,
                },
                ruleImportant: {},
                ruleRemoveParam: {
                    checked: false,
                },
            };
            const result = getRuleText(selectedEvent, rulePattern, ruleOptions);
            const expected = '@@||example.com^$csp=style-src *,domain=example.com';
            expect(result).toBe(expected);
        });
    });
});
