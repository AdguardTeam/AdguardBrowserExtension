/**
 * Dummy settings provider
 */
adguard.sync.settingsProvider = (function () {
    var PROTOCOL_VERSION = "1.0";
    var APP_ID = "adguard-browser-extension";

    var FILTERS_SECTION = "filters.json";

    var manifest = {
        "timestamp": "1472817032850",
        "protocol-version": "1.0",
        "min-compatible-version": "1.0",
        "app-id": APP_ID,
        "sections": [
            {
                "name": "filters.json",
                "timestamp": 1472817032850
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

    var loadLocalManifest = function () {
        return manifest;
    };

    var getEmptyLocalManifest = function () {
        return {
            "protocol-version": PROTOCOL_VERSION,
            "min-compatible-version": PROTOCOL_VERSION,
            "app-id": APP_ID,
            "timestamp": 0,
            "sections": [
                {
                    "name": FILTERS_SECTION,
                    "timestamp": 0
                }
            ]
        };
    };

    var syncLocalManifest = function (manifest, syncTime) {
        if (syncTime) {
            manifest.timestamp = syncTime;
            for (var i = 0; i < manifest.sections.length; i++) {
                manifest.sections[i].timestamp = syncTime;
            }
        }
    };

    var loadSection = function (sectionName, callback) {
        callback(filters);
    };

    var applySection = function (sectionName, section, callback) {
        filters = section;
        callback(true);
    };

    return {
        /**
         * Loads app settings manifest
         */
        loadLocalManifest: loadLocalManifest,
        /**
         * Gets empty settings manifest
         */
        getEmptyLocalManifest: getEmptyLocalManifest,
        /**
         * Loads section of app settings
         */
        loadSection: loadSection,

        /**
         * Saves manifest to local storage
         */
        syncLocalManifest: syncLocalManifest,

        /**
         * Apply section to application
         */
        applySection: applySection
    }
})();

var cleanUp = function (callback) {
    deleteFile(manifestPath, function () {
        deleteFile(filtersPath, callback);
    });
};


QUnit.test("Test local to remote", function (assert) {
    var done = assert.async();

    var localManifest = adguard.sync.settingsProvider.loadLocalManifest();

    createFile(manifestPath, manifest, function () {
        createFile(filtersPath, filters, function () {

            //Remote settings should be updated
            var onFiltersSectionLoaded = function (section) {
                assert.ok(section);

                assert.ok(section.filters["enabled-filters"]);
                assert.ok(section.filters["user-filter"]);
                assert.ok(section.filters["whitelist"].domains);

                cleanUp(done);
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
});

QUnit.test("Test remote to local", function (assert) {
    var done = assert.async();

    var localManifest = adguard.sync.settingsProvider.loadLocalManifest();

    manifest.timestamp = new Date().getTime() + 100000;
    manifest.sections[0].timestamp = new Date().getTime() + 100000;

    createFile(manifestPath, manifest, function () {
        createFile(filtersPath, filters, function () {

            var onSettingSynced = function (result) {
                assert.ok(result);

                //Local settings should be updated
                //App settings should be modified
                var updatedSettingsManifest = adguard.sync.settingsProvider.loadLocalManifest();
                assert.ok(updatedSettingsManifest);
                //assert.notEqual(updatedSettingsManifest.timestamp, localManifest.timestamp);
                //assert.equal(updatedSettingsManifest.timestamp, manifest.timestamp);
                assert.equal(updatedSettingsManifest["protocol-version"], localManifest["protocol-version"]);
                assert.equal(updatedSettingsManifest["min-compatible-version"], localManifest["min-compatible-version"]);
                assert.equal(updatedSettingsManifest["app-id"], localManifest["app-id"]);
                assert.equal(updatedSettingsManifest["sections"].length, localManifest["sections"].length);
                assert.equal(updatedSettingsManifest["sections"][0].name, localManifest["sections"][0].name);
                //assert.notEqual(updatedSettingsManifest["sections"][0].timestamp, localManifest["sections"][0].timestamp);
                assert.equal(updatedSettingsManifest["sections"][0].timestamp, manifest["sections"][0].timestamp);

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
});
