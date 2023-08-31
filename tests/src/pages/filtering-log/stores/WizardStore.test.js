import { RootStore } from '../../../../../Extension/src/pages/filtering-log/stores/RootStore';

describe('WizardStore', () => {
    const rootStore = new RootStore();
    const { wizardStore } = rootStore;

    it('creates rules from parameters', () => {
        const { createRuleFromParams } = wizardStore;
        let ruleParams;
        let expectedRule;

        // Creates rule with default params on startup
        ruleParams = {
            important: false,
            mandatoryOptions: null,
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
            mandatoryOptions: null,
            removeParam: true,
            thirdParty: false,
            urlDomain: 'example.com',
            urlPattern: '||ad.click.net/*',
        };
        expectedRule = '||ad.click.net/*$domain=example.com,important,removeparam';
        expect(createRuleFromParams(ruleParams)).toBe(expectedRule);

        ruleParams = {
            important: true,
            mandatoryOptions: null,
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
            mandatoryOptions: null,
            removeParam: false,
            thirdParty: false,
            urlDomain: 'contextual.media.net',
            urlPattern: '@@||contextual.media.net$removeparam=cs',
        };
        expectedRule = '@@||contextual.media.net$removeparam=cs,domain=contextual.media.net';
        expect(createRuleFromParams(ruleParams)).toBe(expectedRule);
    });
});
