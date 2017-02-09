/**
 * The contents of this file should be pasted to extension background console.
 */

var manifestPath = 'manifest.json';
var filtersPath = 'filters.json';

var remoteManifest = {
    "timestamp": 1,
    "protocol-version": "1.0",
    "min-compatible-version": "1.0",
    "app-id": "test_id",
    "sections": [
        {
            "name": "filters.json",
            "timestamp": 1
        }
    ]
};

var filters = {
    "filters": {
        "enabled-filters": [
            1,
            2,
            4
        ],
        "custom-filters": [
            "http://filter-url"
        ],
        "user-filter": {
            "rules": "||test1.org/$script\n||test2.org/$script",
            "disabled-rules": ""
        },
        "whitelist": {
            "inverted": false,
            "domains": [
                "whitelisted-domain"
            ],
            "inverted-domains": []
        }
    }
};

var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

function errorHandler(e) {
    console.error(e);
}

function createFile(path, data, callback) {
    var onInitFs = function (fs) {
        fs.root.getFile(path, {create: true}, function (fileEntry) {

            // Create a FileWriter object for our FileEntry (log.txt).
            fileEntry.createWriter(function (fileWriter) {

                fileWriter.onwriteend = function (e) {
                    callback();
                };

                fileWriter.onerror = function (e) {
                    console.log('Write failed: ' + e.toString());
                };

                var blob = new Blob([JSON.stringify(data)], {type: 'text/plain'});

                fileWriter.write(blob);

            }, errorHandler);
        }, errorHandler);
    };

    deleteFile(path, function () {
        requestFileSystem(window.TEMPORARY, 1024 * 1024, onInitFs, errorHandler);
    });
}

function deleteFile(path, successCallback) {
    var onInitFs = function (fs) {
        fs.root.getFile(path, {create: true}, function (fileEntry) {
            fileEntry.remove(successCallback, errorHandler);
        }, errorHandler);
    };

    requestFileSystem(window.TEMPORARY, 1024 * 1024, onInitFs, errorHandler);
}

var assert = {
    ok: function (v) {
        if (!v) {
            console.error('Assert failed!');
        }
    },
    equal: function (a, b) {
        if (a != b) {
            console.error('Assert failed: ' + a + ' != ' + b);
        }
    }
};

var testSettingsProvider = function (callback) {

    var before = adguard.sync.settingsProvider.loadLocalManifest();
    assert.ok(before != null);
    //assert.ok(before.timestamp);
    assert.ok(before["protocol-version"]);
    assert.ok(before["min-compatible-version"]);
    assert.ok(before["app-id"]);
    assert.ok(before["sections"].length > 0);

    var timestamp = Date.now();
    adguard.sync.settingsProvider.syncLocalManifest(before, timestamp);

    var updated = adguard.sync.settingsProvider.loadLocalManifest();
    assert.ok(updated != null);
    assert.equal(updated.timestamp, timestamp);
    assert.equal(updated["protocol-version"], before["protocol-version"]);
    assert.equal(updated["min-compatible-version"], before["min-compatible-version"]);
    assert.equal(updated["app-id"], before["app-id"]);
    assert.equal(updated["sections"].length, before["sections"].length);

    var onSectionUpdated = function (section) {
        assert.ok(section);
        assert.ok(section.filters["enabled-filters"].length > 0);

        var userRules = section.filters["user-filter"].rules.split('\n');
        assert.ok(userRules.length > 0);
        assert.ok(userRules.indexOf('test-add-rule') > -1);

        assert.ok(section.filters["whitelist"].domains.length > 0);
        assert.ok(section.filters["whitelist"].domains.indexOf('whitelisted-domain-two.com') > -1);
        assert.equal(section.filters["whitelist"].inverted, true);

        // Return back
        var rules = section.filters["user-filter"].rules;
        section.filters["user-filter"].rules = rules.substring(rules.lastIndexOf('test-add-rule'));
        section.filters["enabled-filters"].pop();
        var i = section.filters["whitelist"].domains.indexOf('whitelisted-domain-two.com');
        section.filters["whitelist"].domains.splice(i, 1);
        section.filters["whitelist"].inverted = false;

        adguard.sync.settingsProvider.applySection(filtersPath, section, function () {
            callback('OK!');
        });
    };

    var onSectionSaved = function (result) {
        assert.ok(result);

        adguard.sync.settingsProvider.loadSection(filtersPath, onSectionUpdated);
    };

    var onSectionLoaded = function (section) {
        console.log(section);

        assert.ok(section);
        assert.ok(section.filters);
        assert.ok(section.filters["custom-filters"]);
        assert.ok(section.filters["enabled-filters"]);
        assert.ok(section.filters["user-filter"]);
        assert.ok(section.filters["whitelist"]);

        // Modify
        section.filters["user-filter"].rules += '\ntest-add-rule';
        section.filters["enabled-filters"].push(1);
        section.filters["enabled-filters"].push(2);
        section.filters["whitelist"].domains.push('whitelisted-domain-two.com');
        section.filters["whitelist"].inverted = true;

        adguard.sync.settingsProvider.applySection(filtersPath, section, onSectionSaved);
    };

    adguard.sync.settingsProvider.loadSection(filtersPath, onSectionLoaded);
};

var testLocalToRemote = function (callback) {

    var done = function () {
        callback('OK!');
    };

    var cleanUp = function () {
        deleteFile(manifestPath, function () {
            deleteFile(filtersPath, done);
        });
    };

    var localManifest = adguard.sync.settingsProvider.loadLocalManifest();

    createFile(manifestPath, remoteManifest, function () {
        createFile(filtersPath, filters, function () {

            //Remote settings should be updated
            var onFiltersSectionLoaded = function (section) {
                assert.ok(section);

                assert.ok(section.filters["enabled-filters"]);
                assert.ok(section.filters["user-filter"]);

                assert.ok(section.filters["whitelist"].domains);

                cleanUp();
            };

            var onManifestLoaded = function (data) {
                assert.ok(data != null);

                //assert.notEqual(data.timestamp, localManifest.timestamp);
                assert.equal(data["protocol-version"], localManifest["protocol-version"]);
                assert.equal(data["min-compatible-version"], localManifest["min-compatible-version"]);
                assert.equal(data["app-id"], localManifest["app-id"]);
                assert.equal(data["sections"].length, 1);
                assert.equal(data["sections"][0].name, localManifest["sections"][0].name);
                assert.equal(data["sections"][0].timestamp, localManifest["sections"][0].timestamp);

                adguard.sync.fileSyncProvider.load(filtersPath, onFiltersSectionLoaded);
            };

            var onSettingSynced = function (result) {
                assert.ok(result);

                adguard.sync.fileSyncProvider.load(manifestPath, onManifestLoaded);
            };

            adguard.sync.syncService.setSyncProvider(adguard.sync.fileSyncProvider);
            adguard.sync.syncService.syncSettings(onSettingSynced);
        });
    });
};

var testRemoteToLocal = function (callback) {
    var done = function () {
        callback('OK');
    };

    var cleanUp = function (callback) {
        deleteFile(manifestPath, function () {
            deleteFile(filtersPath, callback);
        });
    };

    var localManifest = adguard.sync.settingsProvider.loadLocalManifest();

    remoteManifest.timestamp = new Date().getTime() + 100000;
    remoteManifest.sections[0].timestamp = new Date().getTime() + 100000;

    createFile(manifestPath, remoteManifest, function () {
        createFile(filtersPath, filters, function () {

            var onSettingSynced = function (result) {
                assert.ok(result);

                //Local settings should be updated
                //App settings should be modified
                var updatedSettingsManifest = adguard.sync.settingsProvider.loadLocalManifest();
                assert.ok(updatedSettingsManifest);
                //assert.notEqual(updatedSettingsManifest.timestamp, settingsManifest.timestamp);
                //assert.equal(updatedSettingsManifest.timestamp, manifest.timestamp);
                assert.equal(updatedSettingsManifest["protocol-version"], localManifest["protocol-version"]);
                assert.equal(updatedSettingsManifest["min-compatible-version"], localManifest["min-compatible-version"]);
                assert.equal(updatedSettingsManifest["app-id"], localManifest["app-id"]);
                assert.equal(updatedSettingsManifest["sections"].length, localManifest["sections"].length);
                assert.equal(updatedSettingsManifest["sections"][0].name, localManifest["sections"][0].name);
                assert.ok(updatedSettingsManifest["sections"][0].timestamp != localManifest["sections"][0].timestamp);
                assert.equal(updatedSettingsManifest["sections"][0].timestamp, remoteManifest["sections"][0].timestamp);

                adguard.sync.settingsProvider.loadSection(filtersPath, function (section) {
                    assert.ok(section);
                    assert.equal(section.filters["enabled-filters"].length, 3);

                    var userRules = section.filters["user-filter"].rules.split('\n');
                    assert.equal(userRules.length, 2);
                    assert.equal(userRules[0], "||test1.org/$script");
                    assert.equal(userRules[1], "||test2.org/$script");

                    assert.equal(section.filters["whitelist"].domains.length, 1);
                    assert.equal(section.filters["whitelist"].domains[0], 'whitelisted-domain');
                    assert.equal(section.filters["whitelist"].inverted, false);

                    cleanUp(done);
                });
            };

            adguard.sync.syncService.setSyncProvider(adguard.sync.fileSyncProvider);
            adguard.sync.syncService.syncSettings(onSettingSynced);
        });
    });
};

testSettingsProvider(function (r) {
    console.log(r);

    testLocalToRemote(function (r) {
        console.log(r);

        testRemoteToLocal(function (r) {
            console.log(r);
        })
    });
});