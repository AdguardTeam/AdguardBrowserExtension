import { Storage } from 'webextension-polyfill';
import sinon from 'sinon';

import { APP_VERSION_KEY } from '../../../../../Extension/src/common/constants';
import { mockLocalStorage } from '../../../../helpers';
import { App } from '../../../../../Extension/src/background/app';
import { FiltersApi } from '../../../../../Extension/src/background/api';
import { i18nMetadataStorage } from '../../../../../Extension/src/background/storages';
import {
    type I18nMetadata,
    type Metadata,
    i18nMetadataValidator,
    metadataValidator,
} from '../../../../../Extension/src/background/schema';
import {
    LOCAL_I18N_METADATA_FILE_NAME,
    LOCAL_METADATA_FILE_NAME,
    REMOTE_I18N_METADATA_FILE_NAME,
} from '../../../../../constants';

jest.mock('../../../../../Extension/src/background/engine');

const server = sinon.fakeServer.create({
    respondImmediately: true,
});

const initI18nMetadata: I18nMetadata = i18nMetadataValidator.parse({
    filters: {},
    groups: {},
    tags: {},
});

const initMetadata: Metadata = metadataValidator.parse({
    filters: [],
    groups: [],
    tags: [],
});

const remoteI18nMetadata: I18nMetadata = i18nMetadataValidator.parse({
    filters: {},
    groups: {
        1: {
            en: { name: 'REMOTE' },
        },
    },
    tags: {},
});

const localI18nMetadata: I18nMetadata = i18nMetadataValidator.parse({
    filters: {},
    groups: {
        1: {
            en: { name: 'LOCAL' },
        },
    },
    tags: {},
});

/**
 * Mocks initial test metadata for server to respond with.
 */
const mockInitMetadata = () => {
    // should be set before App.init() call
    server.respondWith('GET', new RegExp(`/${LOCAL_I18N_METADATA_FILE_NAME}`), [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(initI18nMetadata),
    ]);

    server.respondWith('GET', new RegExp(`/${LOCAL_METADATA_FILE_NAME}`), [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(initMetadata),
    ]);
};

let storage: Storage.StorageArea;

describe('tests filter metadata loading', () => {
    beforeEach(async () => {
        storage = mockLocalStorage({
            [APP_VERSION_KEY]: '4.4.0.0',
        });
        // should be set before App.init() call
        mockInitMetadata();
        await App.init();
    });

    afterEach(async () => {
        await storage.clear();
        // reset metadata to init test values
        mockInitMetadata();
    });

    it('load local assets, no remote', async () => {
        server.respondWith('GET', new RegExp(`/${LOCAL_I18N_METADATA_FILE_NAME}`), [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify(localI18nMetadata),
        ]);

        // first arg is 'false' to not remote load
        await FiltersApi.loadMetadata(false);

        const i18nMetadata = i18nMetadataStorage.getData();
        expect(i18nMetadata).toStrictEqual(localI18nMetadata);
    });

    it('remote metadata is available, no local assets usage', async () => {
        server.respondWith('GET', new RegExp(`/${REMOTE_I18N_METADATA_FILE_NAME}`), [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify(remoteI18nMetadata),
        ]);

        // first arg is 'true' for remote load, second arg is 'false' for no local assets usage
        await FiltersApi.loadMetadata(true, false);

        const i18nMetadata = i18nMetadataStorage.getData();
        expect(i18nMetadata).toStrictEqual(remoteI18nMetadata);
    });

    it('remote metadata is not available, no local assets usage', async () => {
        server.respondWith('GET', new RegExp(`/${REMOTE_I18N_METADATA_FILE_NAME}`), [
            404,
            {},
            '',
        ]);

        // first arg is 'true' for remote load, second arg is 'false' for no local assets usage
        await FiltersApi.loadMetadata(true, false);

        const i18nMetadata = i18nMetadataStorage.getData();
        expect(i18nMetadata).toStrictEqual(initI18nMetadata);
    });

    it('remote metadata is not available, use local assets', async () => {
        server.respondWith('GET', new RegExp(`/${REMOTE_I18N_METADATA_FILE_NAME}`), [
            404,
            {},
            '',
        ]);

        server.respondWith('GET', new RegExp(`/${LOCAL_I18N_METADATA_FILE_NAME}`), [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify(localI18nMetadata),
        ]);

        // first arg is 'true' for remote load,
        // second arg is 'true' to use local assets if remote is not available
        await FiltersApi.loadMetadata(true, true);

        const i18nMetadata = i18nMetadataStorage.getData();
        expect(i18nMetadata).toStrictEqual(localI18nMetadata);
    });
});
