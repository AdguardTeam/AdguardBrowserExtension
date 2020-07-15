QUnit.test('Calculate hash', (assert) => {
    const host = adguard.utils.url.getHost('http://test.yandex.ru/someurl.html');
    const hosts = adguard.safebrowsing.extractHosts(host);

    assert.equal('test.yandex.ru', hosts[0]);
    assert.equal('yandex.ru', hosts[1]);

    const hashes = adguard.safebrowsing.createHashesMap(hosts);

    assert.equal('test.yandex.ru', hashes['7FF9C98C9AABC19DDB67F8A0030B0691451738E7B8E75393BC6C9F6137F269BB']);
    assert.equal('yandex.ru', hashes['A42653DA210A54B6874F37F0D4A12DA5E89BB436F2C6A01F83246E71CDB544E5']);
});

QUnit.test('Process response', (assert) => {
    const host = adguard.utils.url.getHost('http://theballoonboss.com');
    const hosts = adguard.safebrowsing.extractHosts(host);
    const hashes = adguard.safebrowsing.createHashesMap(hosts);

    // eslint-disable-next-line max-len
    const sbList = adguard.safebrowsing.processSbResponse('adguard-phishing-shavar:37654:B8DC93970348F0A3E6856C32AC5C04D5655E5EE17D4169EC51A2102FB6D5E12A\nadguard-malware-shavar:35176:AE617C8343E1C79E27515B3F6D6D26413FCE47AE32A73488F9D033B4D2A46B3D\nadguard-phishing-shavar:35071:AE617C8343E1C79E27515B3F6D6D26413FCE47AE32A73488F9D033B4D2A46B3D', hashes);

    assert.equal('adguard-phishing-shavar', sbList);
});

QUnit.test('Test cache', (assert) => {
    let counter = 0;
    // Mock backend request
    adguard.backend.lookupSafebrowsing = (shortHashes, successCallback) => {
        counter += 1;

        successCallback({
            status: 204,
        });
    };

    const done = assert.async();

    const testUrl = 'http://google.com';
    adguard.safebrowsing.lookupUrlWithCallback(testUrl, (response) => {
        assert.ok(!response);
        assert.equal(counter, 1);

        adguard.safebrowsing.lookupUrlWithCallback(testUrl, (response) => {
            assert.ok(!response);
            // Check there was only one request to backend
            assert.equal(counter, 1);

            done();
        });
    });
});

QUnit.test('Test requests cache', (assert) => {
    let counter = 0;
    let hashesChecked = [];

    // Mock backend request
    adguard.backend.lookupSafebrowsing = (shortHashes, successCallback) => {
        counter += 1;
        hashesChecked = shortHashes;

        successCallback({
            status: 204,
        });
    };

    const done = assert.async();

    const testUrlOne = 'http://google.co.jp';
    const testUrlTwo = 'http://yahoo.co.jp';
    const testUrlThree = 'http://co.jp';
    adguard.safebrowsing.lookupUrlWithCallback(testUrlOne, (response) => {
        assert.ok(!response);
        assert.equal(counter, 1);
        assert.equal(hashesChecked.length, 2);
        assert.equal(hashesChecked[0], '6830');
        assert.equal(hashesChecked[1], 'D617');

        hashesChecked = [];

        adguard.safebrowsing.lookupUrlWithCallback(testUrlTwo, (response) => {
            assert.ok(!response);
            // One new hash added
            assert.equal(counter, 2);
            assert.equal(hashesChecked.length, 1);
            assert.equal(hashesChecked[0], '20E4');

            hashesChecked = [];

            adguard.safebrowsing.lookupUrlWithCallback(testUrlThree, (response) => {
                assert.ok(!response);
                // All hashes have been checked already - so there was no request to backend
                assert.equal(counter, 2);
                assert.equal(hashesChecked.length, 0);

                done();
            });
        });
    });
});
