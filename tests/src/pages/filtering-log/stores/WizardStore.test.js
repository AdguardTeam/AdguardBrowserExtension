import { RootStore } from '../../../../../Extension/src/pages/filtering-log/stores/RootStore';

describe('WizardStore', () => {
    const { wizardStore } = new RootStore();

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
                ruleText: '||example.com$csp=style-src *',
                allowlistRule: false,
                cspRule: true,
                cookieRule: false,
                modifierValue: 'style-src *',
            },
            ruleText: '||example.com$csp=style-src *',
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
        const result = wizardStore.getRuleText(selectedEvent, rulePattern, ruleOptions);
        const expected = '@@||example.com^$csp=style-src *,domain=example.com';
        expect(result).toBe(expected);
    });
});
