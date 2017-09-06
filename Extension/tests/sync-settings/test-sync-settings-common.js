var manifestPath = 'manifest.json';

var manifest = {
    "timestamp": "1472817032841",
    "protocol-version": "1.0",
    "min-compatible-version": "1.0",
    "app-id": "adguard-browser-extension",
    "sections": [
        {
            "name": "filters.json",
            "timestamp": 123123123213
        }
    ]
};

var filtersPath = 'filters.json';

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

adguard.i18n = {
    getMessage: function () {
        return '';
    }
};

adguard.listeners = {
    notifyListeners: function () {
        //Do nothing
    }
};

var checkManifestData = function (assert, data) {
    assert.ok(data != null);
    assert.equal(data.timestamp, manifest.timestamp);
    assert.equal(data["protocol-version"], manifest["protocol-version"]);
    assert.equal(data["min-compatible-version"], manifest["min-compatible-version"]);
    assert.equal(data["app-id"], manifest["app-id"]);
    assert.equal(data["sections"].length, 1);
    assert.equal(data["sections"][0].name, manifest["sections"][0].name);
    assert.equal(data["sections"][0].timestamp, manifest["sections"][0].timestamp);
};


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