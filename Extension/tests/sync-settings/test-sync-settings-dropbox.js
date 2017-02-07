
var token;
adguard.sync.dropboxSyncProvider.setAccessToken(token);

QUnit.test("Test Dropbox sync provider", function (assert) {
    var done = assert.async();

    if (!adguard.sync.dropboxSyncProvider.isAuthorized()) {
        assert.ok(true);
        done();
        return;
    }

    var onDataUpdated = function (data) {
        checkManifestData(assert, data);

        done();
    };

    var onDataSaved = function (result) {
        assert.ok(result);

        adguard.sync.dropboxSyncProvider.load(manifestPath, onDataUpdated);
    };

    var onDataLoaded = function (data) {
        checkManifestData(assert, data);

        //Modify data
        data.timestamp += 1000;
        manifest.timestamp += 1000;
        data["app-id"] = data["app-id"] + "2";
        manifest["app-id"] = manifest["app-id"] + "2";

        adguard.sync.dropboxSyncProvider.save(manifestPath, data, onDataSaved);
    };

    adguard.sync.dropboxSyncProvider.save(manifestPath, manifest, function () {
        adguard.sync.dropboxSyncProvider.load(manifestPath, onDataLoaded);
    });
});