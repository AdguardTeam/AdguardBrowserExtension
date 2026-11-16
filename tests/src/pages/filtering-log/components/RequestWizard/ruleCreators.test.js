/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import { ContentType } from 'tswebextension';

import {
    createDocumentLevelBlockRule,
    createExceptionCookieRules,
    createExceptionCssRule,
    createExceptionScriptRule,
    createExceptionUrlTransformRules,
    isDocumentLevelExceptionRule,
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

    describe('isDocumentLevelExceptionRule', () => {
        const createRule = (appliedRuleText, options = {}) => ({
            filterId: 1,
            ruleIndex: 0,
            appliedRuleText,
            allowlistRule: true,
            documentLevelRule: false,
            ...options,
        });

        it('returns false if rule is not defined', () => {
            expect(isDocumentLevelExceptionRule(undefined)).toBe(false);
            expect(isDocumentLevelExceptionRule(null)).toBe(false);
        });

        it('returns true for engine-marked document level rules', () => {
            const rule = createRule('@@||example.org^$urlblock', { documentLevelRule: true });

            expect(isDocumentLevelExceptionRule(rule)).toBe(true);
        });
        it('returns true for document level exceptions detected by rule text', () => {
            const modifiers = [
                'elemhide',
                'generichide',
                'specifichide',
                'jsinject',
                'urlblock',
                'genericblock',
                'content',
                'document',
                'doc',
            ];

            modifiers.forEach((modifier) => {
                const rule = createRule(`@@||example.org^$${modifier}`);

                expect(isDocumentLevelExceptionRule(rule), modifier).toBe(true);
            });
        });

        it('returns false for request level exception rules', () => {
            const rules = [
                createRule('@@||example.org^'),
                createRule('@@||example.org^$removeparam=utm_source'),
            ];

            rules.forEach((rule) => {
                expect(isDocumentLevelExceptionRule(rule), rule.appliedRuleText).toBe(false);
            });
        });

        it('returns true for cookie exceptions', () => {
            const rules = [
                createRule('@@||example.org^$cookie'),
                createRule('@@||example.org^$cookie=_ga'),
            ];

            rules.forEach((rule) => {
                expect(isDocumentLevelExceptionRule(rule, ContentType.Cookie), rule.appliedRuleText).toBe(true);
            });
        });

        it('returns false for blocking rules', () => {
            const rule = createRule('||example.org^$document', { allowlistRule: false });

            expect(isDocumentLevelExceptionRule(rule)).toBe(false);
        });

        it('returns true for cosmetic exceptions of document requests', () => {
            const rule = createRule('@@||example.org^$generichide');

            expect(isDocumentLevelExceptionRule(rule, ContentType.Document)).toBe(true);
        });

        it('returns false for cosmetic exceptions of subdocument requests that a blocking rule can counter', () => {
            const rule = createRule('@@||example.org^$generichide');

            expect(isDocumentLevelExceptionRule(rule, ContentType.Subdocument)).toBe(false);
        });

        it('returns false for engine-marked document level rules of subdocument requests that a blocking rule can counter', () => {
            const rule = createRule('@@||example.org^$urlblock', { documentLevelRule: true });

            expect(isDocumentLevelExceptionRule(rule, ContentType.Subdocument)).toBe(false);
        });

        it('returns true for engine-marked document level rules of document requests', () => {
            const rule = createRule('@@||example.org^$urlblock', { documentLevelRule: true });

            expect(isDocumentLevelExceptionRule(rule, ContentType.Document)).toBe(true);
        });

        it('returns true for important exceptions of subdocument requests', () => {
            const rules = [
                createRule('@@||example.org^$generichide,important'),
                createRule('@@||example.org^$urlblock,important', { documentLevelRule: true }),
                createRule('@@||example.org/ad.js$domain=example.org,important'),
            ];

            rules.forEach((rule) => {
                expect(isDocumentLevelExceptionRule(rule, ContentType.Subdocument), rule.appliedRuleText).toBe(true);
            });
        });

        it('returns false if rule text is missing or cannot be parsed', () => {
            expect(isDocumentLevelExceptionRule(createRule(undefined))).toBe(false);
            expect(isDocumentLevelExceptionRule(createRule('<rule text is not specified> (1:0)'))).toBe(false);
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
        const createRuleOptions = (overrides = {}) => ({
            ruleDomain: {
                checked: false,
            },
            ruleThirdParty: {
                checked: true,
            },
            ruleImportant: {
                checked: true,
            },
            ruleRemoveParam: {
                checked: false,
            },
            ...overrides,
        });

        const createEvent = (overrides = {}) => ({
            eventId: 'id',
            requestUrl: 'https://example.org/',
            frameUrl: 'https://example.org/',
            frameDomain: 'example.org',
            requestType: 'document',
            timestamp: 1694175957526,
            ...overrides,
        });

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

        it('does not append options to a document level exception rule detected by the rule text', () => {
            const ruleOptions = createRuleOptions();

            const selectedEvent = createEvent({
                requestRule: {
                    filterId: 1,
                    ruleIndex: 0,
                    appliedRuleText: '@@||example.org^$generichide',
                    allowlistRule: true,
                    documentLevelRule: false,
                },
            });

            const result = getRuleText(
                selectedEvent,
                '@@||example.org^$generichide,badfilter',
                ruleOptions,
            );

            expect(result).toBe('@@||example.org^$generichide,badfilter');
        });

        it('does not append options to a cookie exception rule', () => {
            const ruleOptions = createRuleOptions();

            const selectedEvent = createEvent({
                requestType: 'cookie',
                cookieName: '_ga',
                requestRule: {
                    filterId: 1,
                    ruleIndex: 0,
                    appliedRuleText: '@@||example.org^$cookie=_ga',
                    allowlistRule: true,
                    documentLevelRule: false,
                    cookieRule: true,
                },
            });

            const result = getRuleText(
                selectedEvent,
                '@@||example.org^$cookie=_ga,badfilter',
                ruleOptions,
            );

            expect(result).toBe('@@||example.org^$cookie=_ga,badfilter');
        });
    });

    describe('createExceptionUrlTransformRules', () => {
        it('creates exception rules with modifier value', () => {
            const event = {
                frameDomain: 'example.org',
                requestRule: {
                    filterId: 1,
                    ruleIndex: 0,
                    appliedRuleText: '||example.org^$urltransform=/old/new/',
                    modifierValue: '/old/new/',
                },
            };

            const result = createExceptionUrlTransformRules(event);
            expect(result).toHaveLength(2);
            expect(result[0]).toBe('@@||example.org^$urltransform=/old/new/');
            expect(result[1]).toBe('@@||example.org^$urltransform');
        });

        it('creates exception rule without modifier value', () => {
            const event = {
                frameDomain: 'example.org',
                requestRule: {
                    filterId: 1,
                    ruleIndex: 0,
                    appliedRuleText: '||example.org^$urltransform',
                },
            };

            const result = createExceptionUrlTransformRules(event);
            expect(result).toHaveLength(1);
            expect(result[0]).toBe('@@||example.org^$urltransform');
        });
    });
});
