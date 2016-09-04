QUnit.test("Test settings", function (assert) {
    var url = 'sync.json';
    assert.ok(url != null);

    var done = assert.async();

    var callback = function (current) {
        assert.ok(current != null);
        assert.ok(current.timestamp != null);
        assert.ok(current.filters != null);
        assert.ok(current.filters["enabled-filters"] != null);
        assert.ok(current.filters["enabled-filters"].length > 0);

        var syncSettingsDTO = {
            "timestamp": current.timestamp + 100,
            "filters": {
                "use-mobile-filters": !current.filters["use-mobile-filters"],
                "enabled-filters": [
                    {
                        "id": 2
                    },
                    {
                        "id": 3
                    },
                    {
                        "url": "http://filter-url-updated"
                    }
                ]
            }
        };

        //Sync.update(syncSettingsDTO, url);
        //
        //var updated = Sync.load(url);
        //assert.ok(updated != null);
        //assert.equal(updated.timestamp, syncSettingsDTO.timestamp);
        //assert.ok(updated.filters != null);
        //assert.equal(updated.filters["use-mobile-filters"], syncSettingsDTO.filters["use-mobile-filters"]);
        //assert.ok(updated.filters["enabled-filters"] != null);
        //assert.equal(updated.filters["enabled-filters"].length, syncSettingsDTO.filters["enabled-filters"].length);

        done();
    };

    Sync.load(url, callback);
});