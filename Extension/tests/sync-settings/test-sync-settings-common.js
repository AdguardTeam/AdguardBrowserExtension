var manifestPath = 'manifest.json';
var filtersPath = 'filters.json';

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

var filters = {
    "filters": {
        "enabled-filters": [
            "1",
            "2",
            "4"
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