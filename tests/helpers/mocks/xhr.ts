import sinon from 'sinon';
import escapeStringRegexp from 'escape-string-regexp';

import { METADATA_RULESET_ID, MetadataRuleSet } from '@adguard/tsurlfilter/es/declarative-converter';
import { getRuleSetPath } from '@adguard/tsurlfilter/es/declarative-converter-utils';

import { RootOption, FiltersOption } from '../../../Extension/src/background/schema';
import { REMOTE_METADATA_FILE_NAME, REMOTE_I18N_METADATA_FILE_NAME } from '../../../constants';
import {
    getMetadataFixture,
    getI18nMetadataFixture,
    getFilterTextFixture,
    filterTextWithMetadataFixture,
    getExportedSettingsProtocolV1Fixture,
    getExportedSettingsProtocolV2Fixture,
    getSettingsV1,
} from '../fixtures';

const SETTINGS_V_1_0 = getSettingsV1();
const metadata = getMetadataFixture();
const i18nMetadata = getI18nMetadataFixture();
const filterText = getFilterTextFixture();
const metadataRuleSet = new MetadataRuleSet();
metadataRuleSet.setAdditionalProperty('metadata', metadata);
const serializedMetadataRuleSet = metadataRuleSet.serialize();
const metadataRuleSetPath = getRuleSetPath(METADATA_RULESET_ID, 'filters/declarative');

export const mockFilterPath = 'test-filter.txt';

/**
 * Mocks all xhr requests via {@link sinon.SinonFakeServer}
 *
 * TODO: Maybe it's better to split this server into small servers for each
 * test, where it's needed: create, setup mocks and delete after it.
 *
 * @returns xhr fake server
 */
export const mockXhrRequests = (): sinon.SinonFakeServer => {
    const server = sinon.fakeServer.create({
        respondImmediately: true,
    });

    if (__IS_MV3__) {
        server.respondWith('GET', new RegExp(escapeStringRegexp(metadataRuleSetPath)), [
            200,
            { 'Content-Type': 'application/json' },
            serializedMetadataRuleSet,
        ]);
    }

    server.respondWith('GET', new RegExp(`/(?:${escapeStringRegexp(REMOTE_METADATA_FILE_NAME)})`), [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(metadata),
    ]);

    server.respondWith('GET', new RegExp(`\/(?:${escapeStringRegexp(REMOTE_I18N_METADATA_FILE_NAME)})`), [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(i18nMetadata),
    ]);

    server.respondWith('GET', /\/alert-popup\.css/, [
        200,
        { 'Content-Type': 'text/plain' },
        '',
    ]);

    server.respondWith('GET', /\/alert-container\.css/, [
        200,
        { 'Content-Type': 'text/plain' },
        '',
    ]);

    server.respondWith('GET', /\/update-container\.css/, [
        200,
        { 'Content-Type': 'text/plain' },
        '',
    ]);

    server.respondWith('GET', new RegExp(`/${mockFilterPath}`), [
        200,
        { 'Content-Type': 'text/plain' },
        filterText,
    ]);

    // Simulate filters bodies for successfully emulate initialization of App
    // with provided enabled filters
    server.respondWith('GET', /\/filter_(mobile_)?\d+\.txt/, [
        200,
        { 'Content-Type': 'text/plain' },
        filterTextWithMetadataFixture,
    ]);

    // Simulate filters bodies for successfully emulate initialization of App
    // with provided enabled filters
    server.respondWith('GET', /\/filters\/\d+(_optimized)?.txt/, [
        200,
        { 'Content-Type': 'text/plain' },
        filterTextWithMetadataFixture,
    ]);

    // eslint-disable-next-line max-len
    const customFiltersFixture1 = getExportedSettingsProtocolV1Fixture()[RootOption.Filters][FiltersOption.CustomFilters];
    // eslint-disable-next-line max-len
    const customFiltersFixture2 = getExportedSettingsProtocolV2Fixture()[RootOption.Filters][FiltersOption.CustomFilters];
    const customFiltersFixture3 = SETTINGS_V_1_0['filters']['custom-filters'];

    const customFiltersUrls = [
        ...customFiltersFixture1.map(({ customUrl }) => customUrl),
        ...customFiltersFixture2.map(({ customUrl }) => customUrl),
        ...customFiltersFixture3.map(({ customUrl }) => customUrl),
    ];

    // Filter only uniq urls
    Array.from(new Set(customFiltersUrls))
        // Dynamically create mocks for each custom filter urls
        .forEach((customUrl: string) => {
            // Somehow exact mock with customUrl doesn't work, so create regexp-mask
            // with url part after last slash.
            const mockAddr = customUrl.slice(customUrl.lastIndexOf('/'));
            server.respondWith('GET', new RegExp(mockAddr), [
                200,
                { 'Content-Type': 'text/plain' },
                filterTextWithMetadataFixture,
            ]);
        });

    return server;
};
