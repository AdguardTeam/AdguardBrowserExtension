/* eslint-disable no-console, no-unused-vars */

const manifestPath = 'manifest.json';

const manifest = {
    'timestamp': '1472817032841',
    'protocol-version': '1.0',
    'min-compatible-version': '1.0',
    'app-id': 'adguard-browser-extension',
    'sections': [
        {
            'name': 'filters.json',
            'timestamp': 123123123213,
        },
        {
            'name': 'general-settings.json',
            'timestamp': 123123123213,
        },
    ],
};

const filtersPath = 'filters.json';

const filters = {
    'filters': {
        'enabled-filters': [
            1,
            2,
            4,
        ],
        'custom-filters': [
            'http://filter-url',
        ],
        'user-filter': {
            'rules': '||test1.org/$script\n||test2.org/$script',
            'disabled-rules': '',
        },
        'whitelist': {
            'inverted': false,
            'domains': [
                'whitelisted-domain',
            ],
            'inverted-domains': [],
        },
    },
};

const generalSettingsPath = 'general-settings.json';

const generalSettings = {
    'general-settings': {
        'app-language': 'en-US',
        'allow-acceptable-ads': true,
        'show-blocked-ads-count': true,
        'autodetect-filters': true,
        'safebrowsing-enabled': true,
    },
};

adguard.i18n = {
    getMessage() {
        return '';
    },
};

adguard.listeners = {
    notifyListeners() {
        // Do nothing
    },
};

const checkManifestData = function (assert, data) {
    assert.ok(data != null);
    assert.equal(data.timestamp, manifest.timestamp);
    assert.equal(data['protocol-version'], manifest['protocol-version']);
    assert.equal(data['min-compatible-version'], manifest['min-compatible-version']);
    assert.equal(data['app-id'], manifest['app-id']);
    assert.equal(data['sections'].length, 2);
    assert.equal(data['sections'][0].name, manifest['sections'][0].name);
    assert.equal(data['sections'][0].timestamp, manifest['sections'][0].timestamp);
    assert.equal(data['sections'][1].name, manifest['sections'][1].name);
    assert.equal(data['sections'][1].timestamp, manifest['sections'][1].timestamp);
};

const requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

function errorHandler(e) {
    console.error(e);
}

function deleteFile(path, successCallback) {
    const onInitFs = function (fs) {
        fs.root.getFile(path, { create: true }, (fileEntry) => {
            fileEntry.remove(successCallback, errorHandler);
        }, errorHandler);
    };

    requestFileSystem(window.TEMPORARY, 1024 * 1024, onInitFs, errorHandler);
}

function createFile(path, data, callback) {
    const onInitFs = function (fs) {
        fs.root.getFile(path, { create: true }, (fileEntry) => {
            // Create a FileWriter object for our FileEntry (log.txt).
            fileEntry.createWriter((fileWriter) => {
                fileWriter.onwriteend = function () {
                    callback();
                };

                fileWriter.onerror = function (e) {
                    console.log(`Write failed: ${e.toString()}`);
                };

                const blob = new Blob([JSON.stringify(data)], { type: 'text/plain' });

                fileWriter.write(blob);
            }, errorHandler);
        }, errorHandler);
    };

    deleteFile(path, () => {
        requestFileSystem(window.TEMPORARY, 1024 * 1024, onInitFs, errorHandler);
    });
}
