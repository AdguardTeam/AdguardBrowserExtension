var manifestPath = 'manifest.json';

var manifest = {
    "timestamp": "1472817032841",
    "protocol-version": "1.0",
    "min-compatible-version": "1.0",
    "app-id": "test_id",
    "sections": [
        {
            "name": "filters.json",
            "timestamp": 123123123213
        }
    ]
};

var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;


function checkManifestData(assert, data) {
    assert.ok(data != null);
    assert.equal(data.timestamp, manifest.timestamp);
    assert.equal(data["protocol-version"], manifest["protocol-version"]);
    assert.equal(data["min-compatible-version"], manifest["min-compatible-version"]);
    assert.equal(data["app-id"], manifest["app-id"]);
    assert.equal(data["sections"].length, 1);
    assert.equal(data["sections"][0].name, manifest["sections"][0].name);
    assert.equal(data["sections"][0].timestamp, manifest["sections"][0].timestamp);
}


function errorHandler(e) {
    console.error(e);
}

function createManifest(callback) {
    var onInitFs = function (fs) {
        fs.root.getFile(manifestPath, {create: true}, function(fileEntry) {

            // Create a FileWriter object for our FileEntry (log.txt).
            fileEntry.createWriter(function(fileWriter) {

                fileWriter.onwriteend = function(e) {
                    callback();
                };

                fileWriter.onerror = function(e) {
                    console.log('Write failed: ' + e.toString());
                };

                var blob = new Blob([JSON.stringify(manifest)], {type: 'text/plain'});

                fileWriter.write(blob);

            }, errorHandler);
        }, errorHandler);
    };

    cleanUp(function () {
        requestFileSystem(window.TEMPORARY, 1024 * 1024, onInitFs, errorHandler);
    });
}

function cleanUp(successCallback) {
    var onInitFs = function (fs) {
        fs.root.getFile(manifestPath, {create: true}, function(fileEntry) {
            fileEntry.remove(successCallback, errorHandler);
        }, errorHandler);
    };

    requestFileSystem(window.TEMPORARY, 1024 * 1024, onInitFs, errorHandler);
}


QUnit.test("Test file sync provider", function (assert) {
    var done = assert.async();

    var onDataUpdated = function (data) {
        checkManifestData(assert, data);

        cleanUp(done);
    };

    var onDataSaved = function (result) {
        assert.ok(result);

        SyncProvider.get(manifestPath, onDataUpdated);
    };

    var onDataLoaded = function (data) {
        checkManifestData(assert, data);

        //Modify data
        data.timestamp += 1000;
        manifest.timestamp += 1000;
        data["app-id"] = data["app-id"] + "2";
        manifest["app-id"] = manifest["app-id"] + "2";

        SyncProvider.save(manifestPath, data, onDataSaved);
    };

    createManifest(function () {
        SyncProvider.get(manifestPath, onDataLoaded);
    });
});