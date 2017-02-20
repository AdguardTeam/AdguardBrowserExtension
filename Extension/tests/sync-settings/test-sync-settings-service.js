/**
 * Dummy settings provider
 */
(function () {

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

    adguard.sync.settingsProvider.loadSection = function (sectionName, callback) {
        callback(filters);
    };

    adguard.sync.settingsProvider.applySection = function (sectionName, section, callback) {
        filters = section;
        callback(true);
    };

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

            adguard.sync.syncService.setSyncProvider(adguard.sync.fileSyncProvider.name);
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

            adguard.sync.syncService.setSyncProvider(adguard.sync.fileSyncProvider.name);
            adguard.sync.syncService.syncSettings(onSettingSynced);
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
