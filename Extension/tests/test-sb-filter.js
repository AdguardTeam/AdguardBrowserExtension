function testCalcHash() {

    var filter = new SafebrowsingFilter();
    var host = UrlUtils.getHost("http://test.yandex.ru/someurl.html");
    var hosts = filter._extractHosts(host);

    assertEquals("test.yandex.ru", hosts[0]);
    assertEquals("yandex.ru", hosts[1]);

    var hashes = filter._createHashesMap(hosts);

    assertEquals("test.yandex.ru", hashes["7FF9C98C9AABC19DDB67F8A0030B0691451738E7B8E75393BC6C9F6137F269BB"]);
    assertEquals("yandex.ru", hashes["A42653DA210A54B6874F37F0D4A12DA5E89BB436F2C6A01F83246E71CDB544E5"]);
}

addTestCase(testCalcHash);

function testProcessResponse() {
    var filter = new SafebrowsingFilter();

    var host = UrlUtils.getHost("http://theballoonboss.com");
    var hosts = filter._extractHosts(host);
    var hashes = filter._createHashesMap(hosts);

    var sbList = filter._processSbResponse("adguard-phishing-shavar:37654:B8DC93970348F0A3E6856C32AC5C04D5655E5EE17D4169EC51A2102FB6D5E12A\nadguard-malware-shavar:35176:AE617C8343E1C79E27515B3F6D6D26413FCE47AE32A73488F9D033B4D2A46B3D\nadguard-phishing-shavar:35071:AE617C8343E1C79E27515B3F6D6D26413FCE47AE32A73488F9D033B4D2A46B3D", hashes);

    assertEquals("adguard-phishing-shavar", sbList.list);
    assertEquals("theballoonboss.com", sbList.host);
}

addTestCase(testProcessResponse);
