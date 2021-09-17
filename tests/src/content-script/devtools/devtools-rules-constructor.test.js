/* eslint-disable max-len */
import { promises as fsp } from 'fs';
import path from 'path';
import { DevToolsRulesConstructor } from '../../../../Extension/src/content-script/devtools/devtools-rules-constructor';

describe('DevToolsRulesConstructor', () => {
    beforeAll(async () => {
        const html = await fsp.readFile(path.resolve(__dirname, './devtools-rules-constructor.html'), 'utf-8');
        document.documentElement.innerHTML = html.toString();
    });

    it('Rules Constructor for Assistant', () => {
        const element = document.getElementById('test-div');
        const elementHref = document.getElementsByClassName('a-test-class')[0];

        const options = {
            ruleType: 'CSS',
            urlMask: 'test.com/page',
            cssSelectorType: 'STRICT_FULL',
            isBlockOneDomain: false,
            url: 'http://example.org/test-page.html?param=p1',
        };

        let ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('example.org###test-div');

        options.ruleType = 'URL';
        ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('test.com/page$domain=example.org');

        options.ruleType = 'CSS';
        options.cssSelectorType = 'SIMILAR';
        options.isBlockOneDomain = false;
        ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('example.org##.test-class, .test-class-two');

        options.ruleType = 'CSS';
        options.cssSelectorType = 'STRICT_FULL';
        options.isBlockOneDomain = true;
        ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('###test-div');

        options.ruleType = 'CSS';
        options.cssSelectorType = 'STRICT_FULL';
        options.isBlockOneDomain = true;
        ruleText = DevToolsRulesConstructor.constructRuleText(elementHref, options);
        expect(ruleText).toBe('###test-div > a.a-test-class.a-test-class-two.a-test-class-three:first-child');
    });

    it('Rules Constructor for DevTools', () => {
        const element = document.getElementById('test-div');
        const elementHref = document.getElementsByClassName('a-test-class')[0];

        const options = {
            ruleType: 'CSS',
            urlMask: 'test.com/page',
            cssSelectorType: 'STRICT_FULL',
            isBlockOneDomain: false,
            url: 'http://example.org/test-page.html?param=p1',
            attributes: '',
            excludeId: false,
        };

        let ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('example.org###test-div');

        options.cssSelectorType = 'SIMILAR';
        options.classList = [];
        ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('example.org');

        options.classList = null;
        options.excludeTagName = false;
        ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('example.org##.test-class, .test-class-two');

        options.ruleType = 'CSS';
        options.cssSelectorType = 'SIMILAR';
        options.isBlockOneDomain = true;
        options.excludeTagName = true;
        ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('##.test-class, .test-class-two');

        options.classList = ['test-class-two'];
        ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('##.test-class-two');
        options.classList = null;

        options.ruleType = 'CSS';
        options.cssSelectorType = 'STRICT_FULL';
        options.isBlockOneDomain = true;
        options.attributes = '[title="Share on Twitter"][attribute="aValue"]';
        ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('###test-div[title="Share on Twitter"][attribute="aValue"]');

        options.ruleType = 'CSS';
        options.cssSelectorType = 'STRICT_FULL';
        options.isBlockOneDomain = true;
        options.attributes = '';
        options.excludeTagName = false;
        ruleText = DevToolsRulesConstructor.constructRuleText(elementHref, options);
        expect(ruleText).toBe('###test-div > a.a-test-class.a-test-class-two.a-test-class-three:first-child');

        options.excludeTagName = true;
        ruleText = DevToolsRulesConstructor.constructRuleText(elementHref, options);
        expect(ruleText).toBe('###test-div > .a-test-class.a-test-class-two.a-test-class-three:first-child');

        options.classList = ['a-test-class-two', 'a-test-class-three'];
        ruleText = DevToolsRulesConstructor.constructRuleText(elementHref, options);
        expect(ruleText).toBe('###test-div > .a-test-class-two.a-test-class-three:first-child');
    });

    it('Rules Constructor DevTools Id Elements Special Cases', () => {
        const element = document.getElementById('test-div');
        const elementHref = document.getElementsByClassName('a-test-class')[0];

        const options = {
            ruleType: 'CSS',
            urlMask: 'test.com/page',
            cssSelectorType: 'STRICT_FULL',
            isBlockOneDomain: false,
            url: 'http://example.org/test-page.html?param=p1',
            attributes: '',
            excludeId: false,
        };

        let ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('example.org###test-div');

        // Id attribute is checked
        options.attributes = '[title="Share on Twitter"]';
        options.excludeId = false;
        ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('example.org###test-div[title="Share on Twitter"]');

        // Element has id but it's not checked
        options.attributes = '[title="Share on Twitter"]';
        options.excludeId = true;
        ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('example.org##[title="Share on Twitter"]');

        // Element doesn't have id - option should not have any effect
        options.excludeId = false;
        ruleText = DevToolsRulesConstructor.constructRuleText(elementHref, options);
        expect(ruleText).toBe('example.org###test-div > a.a-test-class.a-test-class-two.a-test-class-three:first-child[title=\"Share on Twitter\"]');

        options.excludeId = true;
        ruleText = DevToolsRulesConstructor.constructRuleText(elementHref, options);
        expect(ruleText).toBe('example.org###test-div > a.a-test-class.a-test-class-two.a-test-class-three:first-child[title=\"Share on Twitter\"]');
    });

    it('Rules Constructor for special elements', () => {
        const elementHref = document.querySelector('#test-div h2');
        let options = {
            ruleType: 'CSS',
            urlMask: null,
            cssSelectorType: 'STRICT_FULL',
            isBlockOneDomain: false,
            url: 'https://lenta.ru/',
            attributes: '',
            excludeTagName: false,
            classList: null,
        };

        let ruleText = DevToolsRulesConstructor.constructRuleText(elementHref, options);
        expect(ruleText).toBe('lenta.ru###test-div > h2:last-child');

        const elementDivId = document.getElementById('test-id-div');
        options = {
            ruleType: 'CSS',
            urlMask: null,
            cssSelectorType: 'STRICT_FULL',
            isBlockOneDomain: false,
            url: 'https://lenta.ru/',
            attributes: '',
            excludeTagName: true,
            classList: null,
            excludeId: false,
        };

        ruleText = DevToolsRulesConstructor.constructRuleText(elementDivId, options);
        expect(ruleText).toBe('lenta.ru###test-id-div');

        options.excludeTagName = false;
        ruleText = DevToolsRulesConstructor.constructRuleText(elementDivId, options);
        expect(ruleText).toBe('lenta.ru##div#test-id-div');

        options.attributes = '[title="Share on Twitter"]';
        ruleText = DevToolsRulesConstructor.constructRuleText(elementDivId, options);
        expect(ruleText).toBe('lenta.ru##div#test-id-div[title="Share on Twitter"]');

        options.attributes = '[someAttr="some-attr-value"][title="Share on Twitter"]';
        ruleText = DevToolsRulesConstructor.constructRuleText(elementDivId, options);
        expect(ruleText).toBe('lenta.ru##div#test-id-div[someAttr="some-attr-value"][title="Share on Twitter"]');

        options.classList = ['test-class-two'];
        delete options.attributes;
        ruleText = DevToolsRulesConstructor.constructRuleText(elementDivId, options);
        expect(ruleText).toBe('lenta.ru##div#test-id-div.test-class-two');
    });

    it('Rules Constructor for CSS selector', () => {
        let selector;
        selector = DevToolsRulesConstructor.constructRuleCssSelector('lenta.ru##div.test-class-two#test-id-div$domain=example.org');
        expect(selector).toBe('div.test-class-two#test-id-div');

        selector = DevToolsRulesConstructor.constructRuleCssSelector('lenta.ru###test-div > h2:last-child');
        expect(selector).toBe('#test-div > h2:last-child');

        selector = DevToolsRulesConstructor.constructRuleCssSelector('##div#test-id-div[title="Share on Twitter"]');
        expect(selector).toBe('div#test-id-div[title="Share on Twitter"]');

        selector = DevToolsRulesConstructor.constructRuleCssSelector('http://test.com/page$domain=example.org');
        expect(selector).toBe('[src*="http://test.com/page"]');

        selector = DevToolsRulesConstructor.constructRuleCssSelector('||http://rutorads.com^$popup');
        expect(selector).toBe('[src*="http://rutorads.com"]');

        selector = DevToolsRulesConstructor.constructRuleCssSelector('#%#window.AG_onLoad = function(func) { if (window.addEventListener) { window.addEventListener(\'DOMContentLoaded\', func); } };');
        expect(selector).toBeFalsy();
    });

    it('SVG Elements', () => {
        const element = document.querySelector('.b-header-main__logo-icon use');
        expect(element).toBeTruthy();

        const options = {
            ruleType: 'CSS',
            urlMask: null,
            cssSelectorType: 'STRICT_FULL',
            isBlockOneDomain: false,
            url: 'https://lenta.ru/',
            attributes: '',
            excludeTagName: false,
            classList: null,
        };

        const ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('lenta.ru###test-id-div > svg.b-header-main__logo-icon:nth-child(2) > use');
    });

    it('Dot Classes', () => {
        let element = document.querySelector('.test-div-dot-class');
        const options = {
            ruleType: 'CSS',
            urlMask: null,
            cssSelectorType: 'STRICT_FULL',
            isBlockOneDomain: false,
            url: 'https://lenta.ru/',
            attributes: '',
            excludeTagName: false,
            classList: null,
        };

        const ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('lenta.ru###test-id-div > div.good-class.bad\\.class:last-child > div.test-div-dot-class');

        element = document.querySelector('.good-class');

        options.cssSelectorType = 'SIMILAR';
        const selector = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(selector).toBe('lenta.ru##.good-class, .bad\\.class');
    });

    it('Body selector', () => {
        const element = document.querySelector('body');
        const options = {
            ruleType: 'CSS',
            urlMask: null,
            cssSelectorType: 'STRICT_FULL',
            isBlockOneDomain: false,
            url: 'https://lenta.ru/',
            attributes: '',
            excludeTagName: false,
            classList: null,
        };

        const ruleText = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(ruleText).toBe('lenta.ru##body');

        options.attributes = '[bgcolor="#ffffff"]';
        const selector = DevToolsRulesConstructor.constructRuleText(element, options);
        expect(selector).toBe('lenta.ru##body[bgcolor="#ffffff"]');
    });
});
