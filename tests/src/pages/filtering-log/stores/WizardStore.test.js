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

import {
    describe,
    it,
    expect,
} from 'vitest';

import { WizardStore } from '../../../../../Extension/src/pages/filtering-log/stores/WizardStore';
import {
    RULE_CREATION_OPTION,
} from '../../../../../Extension/src/pages/filtering-log/components/RequestWizard/constants';

/**
 * Creates a wizard store with the specified selected event.
 *
 * @param selectedEvent Filtering log event selected by the user.
 *
 * @returns Wizard store.
 */
const createWizardStore = (selectedEvent) => {
    const rootStore = {
        logStore: {
            selectedEvent,
            removeSelectedEvent: () => {},
        },
    };

    return new WizardStore(rootStore);
};

/**
 * Creates a filtering log event with the applied rule.
 *
 * @param appliedRuleText Applied rule text.
 * @param options Additional event data: `ruleOptions` is merged into the applied
 * rule data, the rest is merged into the event itself.
 *
 * @returns Filtering log event.
 */
const createEvent = (appliedRuleText, options = {}) => {
    const { ruleOptions = {}, ...eventOptions } = options;

    return {
        eventId: 'id',
        requestUrl: 'https://example.org/',
        requestDomain: 'example.org',
        frameUrl: 'https://example.org/',
        frameDomain: 'example.org',
        requestType: 'document',
        timestamp: 1694175957526,
        ...eventOptions,
        requestRule: {
            filterId: 1,
            ruleIndex: 0,
            appliedRuleText,
            allowlistRule: true,
            documentLevelRule: false,
            ...ruleOptions,
        },
    };
};

describe('WizardStore', () => {
    describe('block rule suggestions', () => {
        it('suggests badfilter rule for cosmetic document level exceptions', () => {
            const modifiers = [
                'elemhide',
                'generichide',
                'specifichide',
                'jsinject',
            ];

            modifiers.forEach((modifier) => {
                const wizardStore = createWizardStore(createEvent(`@@||example.org^$${modifier}`));
                wizardStore.openModal();
                wizardStore.setBlockState();

                const rule = `@@||example.org^$${modifier},badfilter`;

                expect(wizardStore.rulePatterns, modifier).toEqual([rule]);
                expect(wizardStore.rule, modifier).toBe(rule);
            });
        });

        it('suggests badfilter rule for cookie exceptions', () => {
            const wizardStore = createWizardStore(createEvent('@@||example.org^$cookie=_ga', {
                requestType: 'cookie',
                cookieName: '_ga',
                ruleOptions: { cookieRule: true },
            }));
            wizardStore.openModal();
            wizardStore.setBlockState();

            expect(wizardStore.rulePatterns).toEqual(['@@||example.org^$cookie=_ga,badfilter']);
            expect(wizardStore.rule).toBe('@@||example.org^$cookie=_ga,badfilter');
        });

        it('suggests badfilter rule for engine-marked document level rules', () => {
            const wizardStore = createWizardStore(createEvent('@@||example.org^$urlblock', {
                ruleOptions: { documentLevelRule: true },
            }));
            wizardStore.openModal();
            wizardStore.setBlockState();

            expect(wizardStore.rulePatterns).toEqual(['@@||example.org^$urlblock,badfilter']);
            expect(wizardStore.rule).toBe('@@||example.org^$urlblock,badfilter');
        });

        it('keeps blocking patterns for request level exceptions', () => {
            const wizardStore = createWizardStore(createEvent('@@||example.org/ads.js', {
                requestUrl: 'https://example.org/ads.js',
            }));
            wizardStore.openModal();
            wizardStore.setBlockState();

            expect(wizardStore.rulePatterns).toEqual(['||example.org/ads.js', '||example.org^']);
            expect(wizardStore.rule).toBe('||example.org/ads.js$domain=example.org,important');
        });

        it('keeps blocking patterns for cosmetic exceptions of subdocument requests', () => {
            const wizardStore = createWizardStore(createEvent('@@||example.org^$generichide', {
                requestType: 'subdocument',
                requestUrl: 'https://example.org/frame.html',
            }));
            wizardStore.openModal();
            wizardStore.setBlockState();

            expect(wizardStore.rulePatterns).toEqual(['||example.org/frame.html', '||example.org^']);
            expect(wizardStore.rule).toBe('||example.org/frame.html$domain=example.org,important');
        });
    });

    describe('rule options', () => {
        it('pre-checks the important option only for exceptions a blocking rule can counter', () => {
            const documentLevelStore = createWizardStore(createEvent('@@||example.org^$generichide'));
            documentLevelStore.openModal();

            const requestLevelStore = createWizardStore(createEvent('@@||example.org/ads.js'));
            requestLevelStore.openModal();

            expect(documentLevelStore.ruleOptions[RULE_CREATION_OPTION.IMPORTANT].checked).toBe(false);
            expect(requestLevelStore.ruleOptions[RULE_CREATION_OPTION.IMPORTANT].checked).toBe(true);
        });
    });
});
