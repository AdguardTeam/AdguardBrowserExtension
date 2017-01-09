var manifestPath = 'manifest.json';
var filtersPath = 'filters.json';

var manifest = {
    "timestamp": "1472817032841",
    "protocol-version": "1.0",
    "min-compatible-version": "1.0",
    "app-id": "test_id",
    "sections": [
        {
            "name": "filters.json",
            "timestamp": 123123123213
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


function checkManifestData(assert, data) {
    assert.ok(data != null);
    assert.equal(data.timestamp, manifest.timestamp);
    assert.equal(data["protocol-version"], manifest["protocol-version"]);
    assert.equal(data["min-compatible-version"], manifest["min-compatible-version"]);
    assert.equal(data["app-id"], manifest["app-id"]);
    assert.equal(data["sections"].length, 1);
    assert.equal(data["sections"][0].name, manifest["sections"][0].name);
    assert.equal(data["sections"][0].timestamp, manifest["sections"][0].timestamp);
}


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

QUnit.test("Test settings provider", function (assert) {
    var done = assert.async();

    LS.setItem(FilterLSUtils.FILTERS_STATE_PROP, JSON.stringify([]));

    LS.setItem('white-list-domains', JSON.stringify(['whitelisted-domain-one.com']));
    LS.setItem('default-whitelist-mode', true);

    LS.setItem('filterrules_0.txt', '||ongkidcasarv.com^$third-party\n' +
        '||dashgreen.online^$third-party\n' +
        '||adzos.com^$third-party\n' +
        '||mxtads.com:8040');

    FilterLSUtils.updateFilterStateInfo({
        filterId: 1,
        loaded: true,
        enabled: true,
        installed: true
    });

    FilterLSUtils.updateFilterStateInfo({
        filterId: 3,
        loaded: true,
        enabled: true,
        installed: true
    });

    FilterLSUtils.updateFilterStateInfo({
        filterId: 5,
        loaded: true,
        enabled: false,
        installed: true
    });

    FilterLSUtils.updateFilterStateInfo({
        filterId: 7,
        loaded: true,
        enabled: false,
        installed: true
    });

    LS.setItem('sync.settings.timestamp', new Date().getTime() - 10000);

    var before = SettingsProvider.loadSettingsManifest();
    assert.ok(before != null);
    assert.ok(before.timestamp);
    assert.ok(before["protocol-version"]);
    assert.ok(before["min-compatible-version"]);
    assert.ok(before["app-id"]);
    assert.ok(before["sections"].length > 0);

    //before.timestamp = new Date().getTime();
    SettingsProvider.saveSettingsManifest(before);

    var updated = SettingsProvider.loadSettingsManifest();
    assert.ok(updated != null);
    assert.notEqual(updated.timestamp, before.timestamp);
    assert.equal(updated["protocol-version"], before["protocol-version"]);
    assert.equal(updated["min-compatible-version"], before["min-compatible-version"]);
    assert.equal(updated["app-id"], before["app-id"]);
    assert.equal(updated["sections"].length, before["sections"].length);

    var onSectionUpdated = function (section) {
        assert.ok(section);
        assert.equal(section.filters["enabled-filters"].length, 3);
        assert.equal(section.filters["enabled-filters"][0], 1);
        assert.equal(section.filters["enabled-filters"][1], 5);
        assert.equal(section.filters["enabled-filters"][2], 7);

        var userRules = section.filters["user-filter"].rules.split('\n');
        assert.equal(userRules.length, 5);
        assert.equal(userRules[0], "||ongkidcasarv.com^$third-party");
        assert.equal(userRules[1], "||dashgreen.online^$third-party");
        assert.equal(userRules[2], "||adzos.com^$third-party");
        assert.equal(userRules[3], "||mxtads.com:8040");
        assert.equal(userRules[4], "test-add-rule");

        assert.equal(section.filters["whitelist"].domains.length, 2);
        assert.equal(section.filters["whitelist"].domains[0], 'whitelisted-domain-one.com');
        assert.equal(section.filters["whitelist"].domains[1], 'whitelisted-domain-two.com');
        assert.equal(section.filters["whitelist"].inverted, true);

        done();
    };

    var onSectionSaved = function (result) {
        assert.ok(result);
        SettingsProvider.loadSettingsSection(filtersPath, onSectionUpdated);
    };

    var onSectionLoaded = function (section) {
        assert.ok(section);
        assert.equal(section.filters["enabled-filters"].length, 2);
        assert.equal(section.filters["enabled-filters"][0], 1);
        assert.equal(section.filters["enabled-filters"][1], 3);

        var userRules = section.filters["user-filter"].rules.split('\n');
        assert.equal(userRules.length, 4);
        assert.equal(userRules[0], "||ongkidcasarv.com^$third-party");
        assert.equal(userRules[1], "||dashgreen.online^$third-party");
        assert.equal(userRules[2], "||adzos.com^$third-party");
        assert.equal(userRules[3], "||mxtads.com:8040");

        assert.equal(section.filters["whitelist"].domains.length, 1);
        assert.equal(section.filters["whitelist"].domains[0], 'whitelisted-domain-one.com');
        assert.equal(section.filters["whitelist"].inverted, false);

        //Modify
        section.filters["user-filter"].rules += '\ntest-add-rule';
        section.filters["enabled-filters"].splice(1);
        section.filters["enabled-filters"].push(5);
        section.filters["enabled-filters"].push(7);
        section.filters["whitelist"].domains.push('whitelisted-domain-two.com');
        section.filters["whitelist"].inverted = true;

        SettingsProvider.saveSettingsSection(filtersPath, section, onSectionSaved);
    };

    SettingsProvider.loadSettingsSection(filtersPath, onSectionLoaded);
});

QUnit.test("Test file sync provider", function (assert) {
    var done = assert.async();

    var onDataUpdated = function (data) {
        checkManifestData(assert, data);

        deleteFile(manifestPath, done);
    };

    var onDataSaved = function (result) {
        assert.ok(result);

        SyncProvider.load(manifestPath, onDataUpdated);
    };

    var onDataLoaded = function (data) {
        checkManifestData(assert, data);

        //Modify data
        data.timestamp += 1000;
        manifest.timestamp += 1000;
        data["app-id"] = data["app-id"] + "2";
        manifest["app-id"] = manifest["app-id"] + "2";

        SyncProvider.save(manifestPath, data, onDataSaved);
    };

    createFile(manifestPath, manifest, function () {
        SyncProvider.load(manifestPath, onDataLoaded);
    });
});

QUnit.test("Test sync service local to remote", function (assert) {
    var done = assert.async();

    var cleanUp = function () {
        deleteFile(manifestPath, function () {
            deleteFile(filtersPath, done);
        });
    };

    createFile(manifestPath, manifest, function () {
        createFile(filtersPath, filters, function () {

            //Remote settings should be updated

            var onFiltersSectionLoaded = function (section) {
                assert.ok(section != null);

                assert.equal(section.filters["enabled-filters"].length, 3);
                assert.equal(section.filters["enabled-filters"][0], 1);
                assert.equal(section.filters["enabled-filters"][1], 5);
                assert.equal(section.filters["enabled-filters"][2], 7);

                var userRules = section.filters["user-filter"].rules.split('\n');
                assert.equal(userRules.length, 5);
                assert.equal(userRules[0], "||ongkidcasarv.com^$third-party");
                assert.equal(userRules[1], "||dashgreen.online^$third-party");
                assert.equal(userRules[2], "||adzos.com^$third-party");
                assert.equal(userRules[3], "||mxtads.com:8040");
                assert.equal(userRules[4], "test-add-rule");

                assert.equal(section.filters["whitelist"].domains.length, 2);
                assert.equal(section.filters["whitelist"].domains[0], 'whitelisted-domain-one.com');
                assert.equal(section.filters["whitelist"].domains[1], 'whitelisted-domain-two.com');
                assert.equal(section.filters["whitelist"].inverted, true);

                cleanUp();
            };

            var onManifestLoaded = function (data) {
                assert.ok(data != null);
                assert.notEqual(data.timestamp, manifest.timestamp);
                assert.equal(data["protocol-version"], manifest["protocol-version"]);
                assert.equal(data["min-compatible-version"], manifest["min-compatible-version"]);
                assert.equal(data["app-id"], manifest["app-id"]);
                assert.equal(data["sections"].length, 1);
                assert.equal(data["sections"][0].name, manifest["sections"][0].name);
                assert.notEqual(data["sections"][0].timestamp, manifest["sections"][0].timestamp);

                SyncProvider.load(filtersPath, onFiltersSectionLoaded);
            };

            var onSettingSynced = function (result) {
                assert.ok(result);

                //Check updated manifest
                manifest["app-id"] = "adguard-browser-extension";

                SyncProvider.load(manifestPath, onManifestLoaded);
            };

            SyncService.setSyncProvider(SyncProvider);
            SyncService.syncSettings(onSettingSynced);
        });
    });
});

QUnit.test("Test sync service remote to local", function (assert) {
    var done = assert.async();

    var cleanUp = function (callback) {
        deleteFile(manifestPath, function () {
            deleteFile(filtersPath, callback);
        });
    };

    var settingsManifest = SettingsProvider.loadSettingsManifest();

    manifest.timestamp = new Date().getTime() + 100000;
    manifest.sections[0].timestamp = new Date().getTime() + 100000;

    createFile(manifestPath, manifest, function () {
        createFile(filtersPath, filters, function () {

            var onSettingSynced = function (result) {
                assert.ok(result);

                //Local settings should be updated
                //App settings should be modified
                var updatedSettingsManifest = SettingsProvider.loadSettingsManifest();
                assert.ok(updatedSettingsManifest != null);
                assert.notEqual(updatedSettingsManifest.timestamp, settingsManifest.timestamp);
                assert.equal(updatedSettingsManifest["protocol-version"], settingsManifest["protocol-version"]);
                assert.equal(updatedSettingsManifest["min-compatible-version"], settingsManifest["min-compatible-version"]);
                assert.equal(updatedSettingsManifest["app-id"], settingsManifest["app-id"]);
                assert.equal(updatedSettingsManifest["sections"].length, settingsManifest["sections"].length);
                assert.equal(updatedSettingsManifest["sections"][0].name, settingsManifest["sections"][0].name);
                assert.notEqual(updatedSettingsManifest["sections"][0].timestamp, settingsManifest["sections"][0].timestamp);

                SettingsProvider.loadSettingsSection(filtersPath, function (section) {
                    assert.ok(section);
                    assert.equal(section.filters["enabled-filters"].length, 1);
                    assert.equal(section.filters["enabled-filters"][0], 1);

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

            SyncService.setSyncProvider(SyncProvider);
            SyncService.syncSettings(onSettingSynced);
        });
    });
});

QUnit.test("Test sync service protocol versions", function (assert) {
    var done = assert.async();

    var cleanUp = function (callback) {
        deleteFile(manifestPath, function () {
            deleteFile(filtersPath, callback);
        });
    };

    var testPartlyCompatibleVersions = function (callback) {
        manifest["protocol-version"] = "3.0";
        manifest["min-compatible-version"] = "1.0";
        manifest.timestamp = new Date().getTime() + 100000;
        manifest.sections[0].timestamp = new Date().getTime() + 100000;

        var settingsManifest = SettingsProvider.loadSettingsManifest();

        createFile(manifestPath, manifest, function () {
            createFile(filtersPath, filters, function () {
                SyncService.setSyncProvider(SyncProvider);

                SyncService.syncSettings(function (result) {
                    assert.ok(result);

                    //App settings should be modified
                    var updatedSettingsManifest = SettingsProvider.loadSettingsManifest();
                    assert.ok(updatedSettingsManifest != null);
                    assert.notEqual(updatedSettingsManifest.timestamp, settingsManifest.timestamp);
                    assert.equal(updatedSettingsManifest["protocol-version"], settingsManifest["protocol-version"]);
                    assert.equal(updatedSettingsManifest["min-compatible-version"], settingsManifest["min-compatible-version"]);
                    assert.equal(updatedSettingsManifest["app-id"], settingsManifest["app-id"]);
                    assert.equal(updatedSettingsManifest["sections"].length, settingsManifest["sections"].length);
                    assert.equal(updatedSettingsManifest["sections"][0].name, settingsManifest["sections"][0].name);
                    assert.notEqual(updatedSettingsManifest["sections"][0].timestamp, settingsManifest["sections"][0].timestamp);

                    //Manifest should not be updated
                    var onManifestLoaded = function (data) {
                        assert.ok(data != null);
                        assert.equal(data.timestamp, manifest.timestamp);
                        assert.equal(data["protocol-version"], manifest["protocol-version"]);
                        assert.equal(data["min-compatible-version"], manifest["min-compatible-version"]);
                        assert.equal(data["app-id"], manifest["app-id"]);
                        assert.equal(data["sections"].length, 1);
                        assert.equal(data["sections"][0].name, manifest["sections"][0].name);
                        assert.equal(data["sections"][0].timestamp, manifest["sections"][0].timestamp);

                        callback();
                    };

                    SyncProvider.load(manifestPath, onManifestLoaded);
                });
            });
        });
    };

    var testInCompatibleVersions = function () {
        manifest["protocol-version"] = "3.0";
        manifest["min-compatible-version"] = "2.0";
        manifest.timestamp = new Date().getTime() + 100000;
        manifest.sections[0].timestamp = new Date().getTime() + 100000;

        var settingsManifest = SettingsProvider.loadSettingsManifest();

        createFile(manifestPath, manifest, function () {
            createFile(filtersPath, filters, function () {
                SyncService.setSyncProvider(SyncProvider);

                SyncService.syncSettings(function (result) {
                    assert.notOk(result);

                    //App settings should not be modified
                    var updatedSettingsManifest = SettingsProvider.loadSettingsManifest();
                    assert.ok(updatedSettingsManifest != null);
                    assert.equal(updatedSettingsManifest.timestamp, settingsManifest.timestamp);
                    assert.equal(updatedSettingsManifest["protocol-version"], settingsManifest["protocol-version"]);
                    assert.equal(updatedSettingsManifest["min-compatible-version"], settingsManifest["min-compatible-version"]);
                    assert.equal(updatedSettingsManifest["app-id"], settingsManifest["app-id"]);
                    assert.equal(updatedSettingsManifest["sections"].length, settingsManifest["sections"].length);
                    assert.equal(updatedSettingsManifest["sections"][0].name, settingsManifest["sections"][0].name);
                    assert.equal(updatedSettingsManifest["sections"][0].timestamp, settingsManifest["sections"][0].timestamp);

                    //Manifest should not be updated
                    var onManifestLoaded = function (data) {
                        assert.ok(data != null);
                        assert.equal(data.timestamp, manifest.timestamp);
                        assert.equal(data["protocol-version"], manifest["protocol-version"]);
                        assert.equal(data["min-compatible-version"], manifest["min-compatible-version"]);
                        assert.equal(data["app-id"], manifest["app-id"]);
                        assert.equal(data["sections"].length, 1);
                        assert.equal(data["sections"][0].name, manifest["sections"][0].name);
                        assert.equal(data["sections"][0].timestamp, manifest["sections"][0].timestamp);

                        cleanUp(done);
                    };

                    SyncProvider.load(manifestPath, onManifestLoaded);
                });
            });
        });
    };

    testPartlyCompatibleVersions(function () {
        testInCompatibleVersions();
    });
});