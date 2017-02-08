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


QUnit.test("Test file sync provider", function (assert) {
    var done = assert.async();

    var onDataUpdated = function (data) {
        checkManifestData(assert, data);

        deleteFile(manifestPath, done);
    };

    var onDataSaved = function (result) {
        assert.ok(result);

        adguard.sync.fileSyncProvider.load(manifestPath, onDataUpdated);
    };

    var onDataLoaded = function (data) {
        checkManifestData(assert, data);

        //Modify data
        data.timestamp += 1000;
        manifest.timestamp += 1000;
        data["app-id"] = data["app-id"] + "2";
        manifest["app-id"] = manifest["app-id"] + "2";

        adguard.sync.fileSyncProvider.save(manifestPath, data, onDataSaved);
    };

    createFile(manifestPath, manifest, function () {
        adguard.sync.fileSyncProvider.load(manifestPath, onDataLoaded);
    });
});

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