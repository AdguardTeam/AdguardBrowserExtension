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
            "rules": "||test1.org/$script\n||test1.org/$script",
            "disabled-rules": ""
        },
        "whitelist": {
            "inverted": false,
            "domains": [
                "whitelisted-domain"
            ]
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

    deleteFile(manifestPath, function () {
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

    var before = SettingsProvider.loadSettings();
    assert.ok(before != null);
    assert.ok(before.timestamp);
    assert.ok(before["protocol-version"]);
    assert.ok(before["min-compatible-version"]);
    assert.ok(before["app-id"]);
    assert.ok(before["sections"].length > 0);

    SettingsProvider.saveSettings(before);

    var updated = SettingsProvider.loadSettings();
    assert.ok(updated != null);
    assert.ok(updated.timestamp > before.timestamp);
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

        assert.equal(section.filters["user-filter"].rules.length, 4);
        assert.equal(section.filters["user-filter"].rules[0], "||ongkidcasarv.com^$third-party");
        assert.equal(section.filters["user-filter"].rules[1], "||dashgreen.online^$third-party");
        assert.equal(section.filters["user-filter"].rules[2], "||adzos.com^$third-party");
        assert.equal(section.filters["user-filter"].rules[3], "||mxtads.com:8040");
        //assert.equal(section.filters["user-filter"].rules[4], "test-add-rule");

        assert.equal(section.filters["whitelist"].domains.length, 2);
        assert.equal(section.filters["whitelist"].domains[0], 'whitelisted-domain-one.com');
        assert.equal(section.filters["whitelist"].domains[1], 'whitelisted-domain-two.com');
        assert.equal(section.filters["whitelist"].inverted, true);

        done();
    };

    var onSectionSaved = function (result) {
        assert.ok(result);
        SettingsProvider.loadSettingsSection(onSectionUpdated);
    };

    var onSectionLoaded = function (section) {
        assert.ok(section);
        assert.equal(section.filters["enabled-filters"].length, 2);
        assert.equal(section.filters["enabled-filters"][0], 1);
        assert.equal(section.filters["enabled-filters"][1], 3);

        assert.equal(section.filters["user-filter"].rules.length, 4);
        assert.equal(section.filters["user-filter"].rules[0], "||ongkidcasarv.com^$third-party");
        assert.equal(section.filters["user-filter"].rules[1], "||dashgreen.online^$third-party");
        assert.equal(section.filters["user-filter"].rules[2], "||adzos.com^$third-party");
        assert.equal(section.filters["user-filter"].rules[3], "||mxtads.com:8040");

        assert.equal(section.filters["whitelist"].domains.length, 1);
        assert.equal(section.filters["whitelist"].domains[0], 'whitelisted-domain-one.com');
        assert.equal(section.filters["whitelist"].inverted, false);

        //Modify
        //section.filters["user-filter"].rules.push('test-add-rule');
        section.filters["enabled-filters"].splice(1);
        section.filters["enabled-filters"].push(5);
        section.filters["enabled-filters"].push(7);
        section.filters["whitelist"].domains.push('whitelisted-domain-two.com');
        section.filters["whitelist"].inverted = true;

        SettingsProvider.saveSettingsSection(section, onSectionSaved);
    };

    SettingsProvider.loadSettingsSection(onSectionLoaded);
});

QUnit.test("Test file sync provider", function (assert) {
    var done = assert.async();

    var onDataUpdated = function (data) {
        checkManifestData(assert, data);

        deleteFile(manifestPath, done);
    };

    var onDataSaved = function (result) {
        assert.ok(result);

        SyncProvider.get(manifestPath, onDataUpdated);
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
        SyncProvider.get(manifestPath, onDataLoaded);
    });
});

QUnit.test("Test sync service", function (assert) {
    var done = assert.async();

    var cleanUp = function () {
        deleteFile(manifestPath, function () {
            done();
        });
    };

    createFile(manifestPath, manifest, function () {
        SyncService.setSyncProvider(SyncProvider);

        SyncService.syncSettings(function () {
            //TODO: Check app settings

            //Check updated manifest
            manifest["app-id"] = "adguard-browser-extension";

            var onManifestLoaded = function (data) {
                assert.ok(data != null);
                assert.notEqual(data.timestamp, manifest.timestamp);
                assert.equal(data["protocol-version"], manifest["protocol-version"]);
                assert.equal(data["min-compatible-version"], manifest["min-compatible-version"]);
                assert.equal(data["app-id"], manifest["app-id"]);
                assert.equal(data["sections"].length, 1);
                assert.equal(data["sections"][0].name, manifest["sections"][0].name);
                assert.notEqual(data["sections"][0].timestamp, manifest["sections"][0].timestamp);

                cleanUp();
            };

            SyncProvider.get(manifestPath, onManifestLoaded);
        });
    });
});

QUnit.test("Test sync service protocol versions", function (assert) {
    var done = assert.async();

    var cleanUp = function (callback) {
        deleteFile(manifestPath, function () {
            callback();
        });
    };

    var testPartlyCompatibleVersions = function (callback) {
        manifest["protocol-version"] = "3.0";
        manifest["min-compatible-version"] = "1.0";

        createFile(manifestPath, manifest, function () {
            SyncService.setSyncProvider(SyncProvider);

            SyncService.syncSettings(function () {
                //TODO: Check app settings
                //App settings should be modified

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

                SyncProvider.get(manifestPath, onManifestLoaded);
            });
        });
    };

    var testInCompatibleVersions = function () {
        manifest["protocol-version"] = "3.0";
        manifest["min-compatible-version"] = "2.0";

        createFile(manifestPath, manifest, function () {
            SyncService.setSyncProvider(SyncProvider);

            SyncService.syncSettings(function () {
                //TODO: Check app settings
                //App settings should not be modified

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

                SyncProvider.get(manifestPath, onManifestLoaded);
            });
        });
    };

    testPartlyCompatibleVersions(function () {
        testInCompatibleVersions();
    });
});

QUnit.test("Test sync service general", function (assert) {
    var done = assert.async();

    var cleanUp = function () {
        deleteFile(manifestPath, function () {
            deleteFile(filtersPath, done);
        });
    };

    createFile(manifestPath, manifest, function () {
        createFile(filtersPath, filters, function () {
            SyncService.setSyncProvider(SyncProvider);

            SyncService.syncSettings(function () {
                //TODO: Check app settings

                //Check updated manifest
                manifest["app-id"] = "adguard-browser-extension";

                var onManifestLoaded = function (data) {
                    assert.ok(data != null);
                    assert.notEqual(data.timestamp, manifest.timestamp);
                    assert.equal(data["protocol-version"], manifest["protocol-version"]);
                    assert.equal(data["min-compatible-version"], manifest["min-compatible-version"]);
                    assert.equal(data["app-id"], manifest["app-id"]);
                    assert.equal(data["sections"].length, 1);
                    assert.equal(data["sections"][0].name, manifest["sections"][0].name);
                    assert.notEqual(data["sections"][0].timestamp, manifest["sections"][0].timestamp);

                    cleanUp();
                };

                SyncProvider.get(manifestPath, onManifestLoaded);
            });
        });
    });
});