var filtersPath = 'filters.json';

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

// QUnit.test("Test sync service local to remote", function (assert) {
//     var done = assert.async();
//
//     var cleanUp = function () {
//         deleteFile(manifestPath, function () {
//             deleteFile(filtersPath, done);
//         });
//     };
//
//     var localManifest = SettingsProvider.loadSettingsManifest();
//
//     createFile(manifestPath, manifest, function () {
//         createFile(filtersPath, filters, function () {
//
//             //Remote settings should be updated
//
//             var onFiltersSectionLoaded = function (section) {
//                 assert.ok(section != null);
//
//                 assert.equal(section.filters["enabled-filters"].length, 3);
//                 assert.equal(section.filters["enabled-filters"][0], 1);
//                 assert.equal(section.filters["enabled-filters"][1], 5);
//                 assert.equal(section.filters["enabled-filters"][2], 7);
//
//                 var userRules = section.filters["user-filter"].rules.split('\n');
//                 assert.equal(userRules.length, 5);
//                 assert.equal(userRules[0], "||ongkidcasarv.com^$third-party");
//                 assert.equal(userRules[1], "||dashgreen.online^$third-party");
//                 assert.equal(userRules[2], "||adzos.com^$third-party");
//                 assert.equal(userRules[3], "||mxtads.com:8040");
//                 assert.equal(userRules[4], "test-add-rule");
//
//                 assert.equal(section.filters["whitelist"].domains.length, 2);
//                 assert.equal(section.filters["whitelist"].domains[0], 'whitelisted-domain-one.com');
//                 assert.equal(section.filters["whitelist"].domains[1], 'whitelisted-domain-two.com');
//                 assert.equal(section.filters["whitelist"].inverted, true);
//
//                 cleanUp();
//             };
//
//             var onManifestLoaded = function (data) {
//                 assert.ok(data != null);
//                 assert.notEqual(data.timestamp, localManifest.timestamp);
//                 assert.equal(data["protocol-version"], localManifest["protocol-version"]);
//                 assert.equal(data["min-compatible-version"], localManifest["min-compatible-version"]);
//                 assert.equal(data["app-id"], localManifest["app-id"]);
//                 assert.equal(data["sections"].length, 1);
//                 assert.equal(data["sections"][0].name, localManifest["sections"][0].name);
//                 assert.equal(data["sections"][0].timestamp, localManifest["sections"][0].timestamp);
//
//                 FileSyncProvider.load(filtersPath, onFiltersSectionLoaded);
//             };
//
//             var onSettingSynced = function (result) {
//                 assert.ok(result);
//
//                 //Check updated manifest
//                 manifest["app-id"] = "adguard-browser-extension";
//
//                 FileSyncProvider.load(manifestPath, onManifestLoaded);
//             };
//
//             SyncService.setSyncProvider(FileSyncProvider);
//             SyncService.syncSettings(onSettingSynced);
//         });
//     });
// });
//
// QUnit.test("Test sync service remote to local", function (assert) {
//     var done = assert.async();
//
//     var cleanUp = function (callback) {
//         deleteFile(manifestPath, function () {
//             deleteFile(filtersPath, callback);
//         });
//     };
//
//     var settingsManifest = SettingsProvider.loadSettingsManifest();
//
//     manifest.timestamp = new Date().getTime() + 100000;
//     manifest.sections[0].timestamp = new Date().getTime() + 100000;
//
//     createFile(manifestPath, manifest, function () {
//         createFile(filtersPath, filters, function () {
//
//             var onSettingSynced = function (result) {
//                 assert.ok(result);
//
//                 //Local settings should be updated
//                 //App settings should be modified
//                 var updatedSettingsManifest = SettingsProvider.loadSettingsManifest();
//                 assert.ok(updatedSettingsManifest != null);
//                 assert.notEqual(updatedSettingsManifest.timestamp, settingsManifest.timestamp);
//                 //assert.equal(updatedSettingsManifest.timestamp, manifest.timestamp);
//                 assert.equal(updatedSettingsManifest["protocol-version"], settingsManifest["protocol-version"]);
//                 assert.equal(updatedSettingsManifest["min-compatible-version"], settingsManifest["min-compatible-version"]);
//                 assert.equal(updatedSettingsManifest["app-id"], settingsManifest["app-id"]);
//                 assert.equal(updatedSettingsManifest["sections"].length, settingsManifest["sections"].length);
//                 assert.equal(updatedSettingsManifest["sections"][0].name, settingsManifest["sections"][0].name);
//                 assert.notEqual(updatedSettingsManifest["sections"][0].timestamp, settingsManifest["sections"][0].timestamp);
//                 assert.equal(updatedSettingsManifest["sections"][0].timestamp, manifest["sections"][0].timestamp);
//
//                 SettingsProvider.loadSection(filtersPath, function (section) {
//                     assert.ok(section);
//                     assert.equal(section.filters["enabled-filters"].length, 1);
//                     assert.equal(section.filters["enabled-filters"][0], 1);
//
//                     var userRules = section.filters["user-filter"].rules.split('\n');
//                     assert.equal(userRules.length, 2);
//                     assert.equal(userRules[0], "||test1.org/$script");
//                     assert.equal(userRules[1], "||test2.org/$script");
//
//                     assert.equal(section.filters["whitelist"].domains.length, 1);
//                     assert.equal(section.filters["whitelist"].domains[0], 'whitelisted-domain');
//                     assert.equal(section.filters["whitelist"].inverted, false);
//
//                     cleanUp(done);
//                 });
//             };
//
//             SyncService.setSyncProvider(FileSyncProvider);
//             SyncService.syncSettings(onSettingSynced);
//         });
//     });
// });
//
// QUnit.test("Test sync service protocol versions", function (assert) {
//     var done = assert.async();
//
//     var cleanUp = function (callback) {
//         deleteFile(manifestPath, function () {
//             deleteFile(filtersPath, callback);
//         });
//     };
//
//     var testPartlyCompatibleVersions = function (callback) {
//         manifest["protocol-version"] = "3.0";
//         manifest["min-compatible-version"] = "1.0";
//         manifest.timestamp = new Date().getTime() + 100000;
//         manifest.sections[0].timestamp = new Date().getTime() + 100000;
//
//         var settingsManifest = SettingsProvider.loadSettingsManifest();
//
//         createFile(manifestPath, manifest, function () {
//             createFile(filtersPath, filters, function () {
//                 SyncService.setSyncProvider(FileSyncProvider);
//
//                 SyncService.syncSettings(function (result) {
//                     assert.ok(result);
//
//                     //App settings should be modified
//                     var updatedSettingsManifest = SettingsProvider.loadSettingsManifest();
//                     assert.ok(updatedSettingsManifest != null);
//                     assert.notEqual(updatedSettingsManifest.timestamp, settingsManifest.timestamp);
//                     assert.equal(updatedSettingsManifest["protocol-version"], settingsManifest["protocol-version"]);
//                     assert.equal(updatedSettingsManifest["min-compatible-version"], settingsManifest["min-compatible-version"]);
//                     assert.equal(updatedSettingsManifest["app-id"], settingsManifest["app-id"]);
//                     assert.equal(updatedSettingsManifest["sections"].length, settingsManifest["sections"].length);
//                     assert.equal(updatedSettingsManifest["sections"][0].name, settingsManifest["sections"][0].name);
//                     assert.notEqual(updatedSettingsManifest["sections"][0].timestamp, settingsManifest["sections"][0].timestamp);
//
//                     //Manifest should not be updated
//                     var onManifestLoaded = function (data) {
//                         assert.ok(data != null);
//                         assert.equal(data.timestamp, manifest.timestamp);
//                         assert.equal(data["protocol-version"], manifest["protocol-version"]);
//                         assert.equal(data["min-compatible-version"], manifest["min-compatible-version"]);
//                         assert.equal(data["app-id"], manifest["app-id"]);
//                         assert.equal(data["sections"].length, 1);
//                         assert.equal(data["sections"][0].name, manifest["sections"][0].name);
//                         assert.equal(data["sections"][0].timestamp, manifest["sections"][0].timestamp);
//
//                         callback();
//                     };
//
//                     FileSyncProvider.load(manifestPath, onManifestLoaded);
//                 });
//             });
//         });
//     };
//
//     var testInCompatibleVersions = function () {
//         manifest["protocol-version"] = "3.0";
//         manifest["min-compatible-version"] = "2.0";
//         manifest.timestamp = new Date().getTime() + 100000;
//         manifest.sections[0].timestamp = new Date().getTime() + 100000;
//
//         var settingsManifest = SettingsProvider.loadSettingsManifest();
//
//         createFile(manifestPath, manifest, function () {
//             createFile(filtersPath, filters, function () {
//                 SyncService.setSyncProvider(FileSyncProvider);
//
//                 SyncService.syncSettings(function (result) {
//                     assert.notOk(result);
//
//                     //App settings should not be modified
//                     var updatedSettingsManifest = SettingsProvider.loadSettingsManifest();
//                     assert.ok(updatedSettingsManifest != null);
//                     assert.equal(updatedSettingsManifest.timestamp, settingsManifest.timestamp);
//                     assert.equal(updatedSettingsManifest["protocol-version"], settingsManifest["protocol-version"]);
//                     assert.equal(updatedSettingsManifest["min-compatible-version"], settingsManifest["min-compatible-version"]);
//                     assert.equal(updatedSettingsManifest["app-id"], settingsManifest["app-id"]);
//                     assert.equal(updatedSettingsManifest["sections"].length, settingsManifest["sections"].length);
//                     assert.equal(updatedSettingsManifest["sections"][0].name, settingsManifest["sections"][0].name);
//                     assert.equal(updatedSettingsManifest["sections"][0].timestamp, settingsManifest["sections"][0].timestamp);
//
//                     //Manifest should not be updated
//                     var onManifestLoaded = function (data) {
//                         assert.ok(data != null);
//                         assert.equal(data.timestamp, manifest.timestamp);
//                         assert.equal(data["protocol-version"], manifest["protocol-version"]);
//                         assert.equal(data["min-compatible-version"], manifest["min-compatible-version"]);
//                         assert.equal(data["app-id"], manifest["app-id"]);
//                         assert.equal(data["sections"].length, 1);
//                         assert.equal(data["sections"][0].name, manifest["sections"][0].name);
//                         assert.equal(data["sections"][0].timestamp, manifest["sections"][0].timestamp);
//
//                         cleanUp(done);
//                     };
//
//                     FileSyncProvider.load(manifestPath, onManifestLoaded);
//                 });
//             });
//         });
//     };
//
//     testPartlyCompatibleVersions(function () {
//         testInCompatibleVersions();
//     });
// });


testSettingsProvider(function (r) {
    console.log(r);
});