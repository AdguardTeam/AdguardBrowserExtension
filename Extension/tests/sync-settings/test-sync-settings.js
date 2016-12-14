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

    //TODO: Add sections checks
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
            //deleteFile(filtersPath, done);
            done();
        });
    };

    createFile(manifestPath, manifest, function () {
        // createFile(filtersPath, filters, function () {
        //
        // });

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