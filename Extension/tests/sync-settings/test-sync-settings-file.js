QUnit.test("Test file sync provider", function (assert) {
    var fileSyncProvider = adguard.sync.syncProviders.getProvider('FILE');
    var done = assert.async();

    var onDataUpdated = function (data) {
        checkManifestData(assert, data);

        deleteFile(manifestPath, done);
    };

    var onDataSaved = function (result) {
        assert.ok(result);

        fileSyncProvider.load(manifestPath, onDataUpdated);
    };

    var onDataLoaded = function (data) {
        checkManifestData(assert, data);

        //Modify data
        data.timestamp += 1000;
        manifest.timestamp += 1000;
        // data["app-id"] = data["app-id"] + "2";
        // manifest["app-id"] = manifest["app-id"] + "2";

        fileSyncProvider.save(manifestPath, data, onDataSaved);
    };

    createFile(manifestPath, manifest, function () {
        fileSyncProvider.load(manifestPath, onDataLoaded);
    });
});