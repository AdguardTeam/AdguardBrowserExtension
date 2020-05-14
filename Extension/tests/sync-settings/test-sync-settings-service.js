/**
 * Dummy settings provider
 */
(function () {

    var localFilters = {
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

    var localGeneralSettings = {
        "general-settings": {
            "app-language": "en-Gb",
            "allow-acceptable-ads": false,
            "show-blocked-ads-count": false,
            "autodetect-filters": false,
            "safebrowsing-enabled": true,
        }
    };

    adguard.sync.settingsProvider.isSectionSupported = function (sectionName) {
        return sectionName === filtersPath || sectionName === generalSettingsPath;
    };

    adguard.sync.settingsProvider.loadSection = function (sectionName, callback) {
        switch (sectionName) {
            case filtersPath:
                callback(localFilters);
                break;
            case generalSettingsPath:
                callback(localGeneralSettings);
                break;
        }
    };

    adguard.sync.settingsProvider.applySection = function (sectionName, section, callback) {
        switch (sectionName) {
            case filtersPath:
                localFilters = section;
                callback(true);
                break;
            case generalSettingsPath:
                localGeneralSettings = section;
                callback(true);
                break;
        }
    };

})();

var cleanUp = function (callback) {
    deleteFile(manifestPath, function () {
        deleteFile(filtersPath, callback);
    });
};

QUnit.test("Test local to remote", function (assert) {
    var fileSyncProvider = adguard.sync.syncProviders.getProvider('FILE');
    var done = assert.async();

    var localManifest = adguard.sync.settingsProvider.loadLocalManifest();

    createFile(manifestPath, manifest, function () {
        createFile(generalSettingsPath, generalSettings, function () {
            createFile(filtersPath, filters, function () {

                //Remote settings should be updated
                var onGeneralSectionLoaded = function (section) {
                    assert.ok(section);

                    // Should be equal to localGeneralSettings
                    assert.equal(section['general-settings']["app-language"], 'en-Gb');
                    assert.equal(section['general-settings']["allow-acceptable-ads"], false);
                    assert.equal(section['general-settings']["autodetect-filters"], false);
                    assert.equal(section['general-settings']["safebrowsing-enabled"], true);
                    assert.equal(section['general-settings']["show-blocked-ads-count"], false);

                    cleanUp(done);
                };

                var onFiltersSectionLoaded = function (section) {
                    assert.ok(section);

                    // Should be equal to localFilters
                    assert.ok(section.filters["enabled-filters"]);
                    assert.ok(section.filters["user-filter"]);
                    assert.ok(section.filters["whitelist"].domains);

                    fileSyncProvider.load(generalSettingsPath, onGeneralSectionLoaded);
                };

                var onManifestLoaded = function (data) {
                    assert.ok(data != null);

                    //assert.notEqual(data.timestamp, localManifest.timestamp);
                    assert.equal(data["protocol-version"], localManifest["protocol-version"]);
                    assert.equal(data["min-compatible-version"], localManifest["min-compatible-version"]);
                    assert.equal(data["app-id"], localManifest["app-id"]);
                    assert.equal(data["sections"].length, 2);
                    assert.equal(data["sections"][0].name, localManifest["sections"][0].name);
                    assert.equal(data["sections"][0].timestamp, localManifest["sections"][0].timestamp);
                    assert.equal(data["sections"][1].name, localManifest["sections"][1].name);
                    assert.equal(data["sections"][1].timestamp, localManifest["sections"][1].timestamp);

                    fileSyncProvider.load(filtersPath, onFiltersSectionLoaded);
                };

                var onSettingSynced = function (result) {
                    assert.ok(result);

                    fileSyncProvider.load(manifestPath, onManifestLoaded);
                };

                adguard.sync.syncService.toggleSyncStatus(true);
                adguard.sync.syncService.setSyncProvider('FILE');
                adguard.sync.syncService.syncSettings(onSettingSynced);
            });
        });
    });
});

QUnit.test("Test remote to local", function (assert) {
    var done = assert.async();

    var localManifest = adguard.sync.settingsProvider.loadLocalManifest();

    manifest.timestamp = new Date().getTime() + 100000;
    manifest.sections[0].timestamp = new Date().getTime() + 100000;
    manifest.sections[1].timestamp = new Date().getTime() + 100000;

    createFile(manifestPath, manifest, function () {
        createFile(generalSettingsPath, generalSettings, function () {
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
                    assert.equal(updatedSettingsManifest["sections"][0].timestamp, manifest["sections"][0].timestamp);
                    assert.equal(updatedSettingsManifest["sections"][1].name, localManifest["sections"][1].name);
                    assert.equal(updatedSettingsManifest["sections"][1].timestamp, manifest["sections"][1].timestamp);

                    adguard.sync.settingsProvider.loadSection(filtersPath, function (section) {
                        assert.ok(section);

                        // Should be equal to remote filters
                        assert.equal(section.filters["enabled-filters"].length, 3);

                        var userRules = section.filters["user-filter"].rules.split('\n');
                        assert.equal(userRules.length, 2);
                        assert.equal(userRules[0], "||test1.org/$script");
                        assert.equal(userRules[1], "||test2.org/$script");

                        assert.equal(section.filters["whitelist"].domains.length, 1);
                        assert.equal(section.filters["whitelist"].domains[0], 'whitelisted-domain');
                        assert.equal(section.filters["whitelist"].inverted, false);

                        adguard.sync.settingsProvider.loadSection(generalSettingsPath, function (section) {
                            assert.ok(section);

                            // Should be equal to remote general settings
                            assert.equal(section['general-settings']["app-language"], 'en-US');
                            assert.equal(section['general-settings']["allow-acceptable-ads"], true);
                            assert.equal(section['general-settings']["autodetect-filters"], true);
                            assert.equal(section['general-settings']["safebrowsing-enabled"], true);
                            assert.equal(section['general-settings']["show-blocked-ads-count"], true);

                            cleanUp(done);
                        });
                    });
                };

                adguard.sync.syncService.toggleSyncStatus(true);
                adguard.sync.syncService.setSyncProvider('FILE');
                adguard.sync.syncService.syncSettings(onSettingSynced);
            });
        });
    });
});

QUnit.test("Test section revisions", function (assert) {
    var done = assert.async();

    adguard.sync.sections.loadLocalSection(filtersPath, function (section) {
        assert.ok(section);

        var updated = adguard.sync.sections.isSectionUpdated(filtersPath, section);
        assert.notOk(updated);

        updated = adguard.sync.sections.isSectionUpdated(filtersPath, {});
        assert.ok(updated);

        done();
    });
});

QUnit.test("Test sync options changes", function (assert) {
    var status = adguard.sync.syncService.getSyncStatus();

    assert.ok(status.syncOptions);

    adguard.sync.syncService.setSyncOptions({
        syncGeneral: false,
        syncFilters: false,
        syncExtensionSpecific: true
    });

    status = adguard.sync.syncService.getSyncStatus();

    assert.ok(status.syncOptions);
    assert.notOk(status.syncOptions.syncGeneral);
    assert.notOk(status.syncOptions.syncFilters);
    assert.ok(status.syncOptions.syncExtensionSpecific);

    adguard.sync.syncService.setSyncOptions({
        syncGeneral: true,
        syncFilters: true,
        syncExtensionSpecific: true
    });
});
