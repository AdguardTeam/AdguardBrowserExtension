var auth = DropboxSyncProvider.isAuthenticated();
console.log(auth);

if (auth) {
    QUnit.test("Test file sync provider", function (assert) {
        var done = assert.async();

        var onDataUpdated = function (data) {
            checkManifestData(assert, data);

            done();
        };

        var onDataSaved = function (result) {
            assert.ok(result);

            DropboxSyncProvider.load(manifestPath, onDataUpdated);
        };

        var onDataLoaded = function (data) {
            // checkManifestData(assert, data);
            //
            // //Modify data
            // data.timestamp += 1000;
            // manifest.timestamp += 1000;
            // data["app-id"] = data["app-id"] + "2";
            // manifest["app-id"] = manifest["app-id"] + "2";
            //
            // DropboxSyncProvider.save(manifestPath, data, onDataSaved);
            done();
        };

        DropboxSyncProvider.load(manifestPath, onDataLoaded);
    });
} else {
    console.error('App is not authorized');
}