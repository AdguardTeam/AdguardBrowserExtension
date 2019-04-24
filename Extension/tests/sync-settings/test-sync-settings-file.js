/* global checkManifestData, deleteFile, manifestPath, manifest, createFile */

QUnit.test('Test file sync provider', (assert) => {
    const fileSyncProvider = adguard.sync.syncProviders.getProvider('FILE');
    const done = assert.async();

    const onDataUpdated = function (data) {
        checkManifestData(assert, data);

        deleteFile(manifestPath, done);
    };

    const onDataSaved = function (result) {
        assert.ok(result);

        fileSyncProvider.load(manifestPath, onDataUpdated);
    };

    const onDataLoaded = function (data) {
        checkManifestData(assert, data);

        // Modify data
        data.timestamp += 1000;
        manifest.timestamp += 1000;
        // data["app-id"] = data["app-id"] + "2";
        // manifest["app-id"] = manifest["app-id"] + "2";

        fileSyncProvider.save(manifestPath, data, onDataSaved);
    };

    createFile(manifestPath, manifest, () => {
        fileSyncProvider.load(manifestPath, onDataLoaded);
    });
});
