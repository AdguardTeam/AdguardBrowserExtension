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