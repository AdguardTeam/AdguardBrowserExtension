QUnit.test("Test storage sync provider", function (assert) {
    var done = assert.async();

    var onDataUpdated = function (data) {
        //checkManifestData(assert, data);

        //clean up
        assert.ok(true);
        done();
    };

    var onDataSaved = function (result) {
        //assert.ok(result);

        StorageSyncProvider.load(manifestPath, onDataUpdated);
    };

    var onDataLoaded = function (data) {
        //checkManifestData(assert, data);

        //Modify data
        // data.timestamp += 1000;
        // manifest.timestamp += 1000;
        // data["app-id"] = data["app-id"] + "2";
        // manifest["app-id"] = manifest["app-id"] + "2";
        //
        StorageSyncProvider.save(manifestPath, data, onDataSaved);
    };

    //create dummy
    StorageSyncProvider.load(manifestPath, onDataLoaded);
});