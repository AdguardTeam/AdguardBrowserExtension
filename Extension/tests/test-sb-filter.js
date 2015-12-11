function testCalcHash() {

    var filter = new SafebrowsingFilter();
    var host = UrlUtils.getHost("http://test.yandex.ru/someurl.html");
    var hosts = filter._extractHosts(host);

    assertEquals("test.yandex.ru", hosts[0]);
    assertEquals("yandex.ru", hosts[1]);

    var hashes = filter._calcHashes(hosts);
    console.log(hashes);
}

addTestCase(testCalcHash);