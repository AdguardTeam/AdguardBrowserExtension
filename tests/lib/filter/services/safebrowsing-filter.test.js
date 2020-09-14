import { utils } from '../../../../Extension/lib/utils/common';
import safebrowsing from '../../../../Extension/lib/filter/services/safebrowsing/safebrowsing.browsers';
import { backend } from '../../../../Extension/lib/filter/filters/service-client';

describe('safebrowsing', () => {
    it('Calculate hash', () => {
        const host = utils.url.getHost('http://test.yandex.ru/someurl.html');
        const hosts = safebrowsing.extractHosts(host);

        expect(hosts[0]).toBe('test.yandex.ru');
        expect('yandex.ru').toBe(hosts[1]);

        const hashes = safebrowsing.createHashesMap(hosts);

        expect(hashes['7FF9C98C9AABC19DDB67F8A0030B0691451738E7B8E75393BC6C9F6137F269BB']).toBe('test.yandex.ru');
        expect(hashes['A42653DA210A54B6874F37F0D4A12DA5E89BB436F2C6A01F83246E71CDB544E5']).toBe('yandex.ru');
    });

    it('Process response', () => {
        const host = utils.url.getHost('http://theballoonboss.com');
        const hosts = safebrowsing.extractHosts(host);
        const hashes = safebrowsing.createHashesMap(hosts);

        // eslint-disable-next-line max-len
        const sbList = safebrowsing.processSbResponse('adguard-phishing-shavar:37654:B8DC93970348F0A3E6856C32AC5C04D5655E5EE17D4169EC51A2102FB6D5E12A\nadguard-malware-shavar:35176:AE617C8343E1C79E27515B3F6D6D26413FCE47AE32A73488F9D033B4D2A46B3D\nadguard-phishing-shavar:35071:AE617C8343E1C79E27515B3F6D6D26413FCE47AE32A73488F9D033B4D2A46B3D', hashes);

        expect(sbList).toBe('adguard-phishing-shavar');
    });

    it('Test cache', (done) => {
        let counter = 0;
        // Mock backend request
        jest.spyOn(backend, 'lookupSafebrowsing').mockImplementation((shortHashes, successCallback) => {
            counter += 1;

            successCallback({
                status: 204,
            });
        });

        const testUrl = 'http://google.com';
        safebrowsing.lookupUrlWithCallback(testUrl, (response) => {
            expect(response).toBeFalsy();
            expect(counter).toBe(1);

            safebrowsing.lookupUrlWithCallback(testUrl, (response) => {
                expect(response).toBeFalsy();
                // Check there was only one request to backend
                expect(counter).toBe(1);
                done();
            });
        });
    });

    it('Test requests cache', (done) => {
        let counter = 0;
        let hashesChecked = [];

        // Mock backend request
        jest.spyOn(backend, 'lookupSafebrowsing').mockImplementation((shortHashes, successCallback) => {
            counter += 1;
            hashesChecked = shortHashes;

            successCallback({
                status: 204,
            });
        });

        const testUrlOne = 'http://google.co.jp';
        const testUrlTwo = 'http://yahoo.co.jp';
        const testUrlThree = 'http://co.jp';
        safebrowsing.lookupUrlWithCallback(testUrlOne, (response) => {
            expect(!response).toBeTruthy();
            expect(counter).toBe(1);
            expect(hashesChecked.length).toBe(2);
            expect(hashesChecked[0]).toBe('6830');
            expect(hashesChecked[1]).toBe('D617');

            hashesChecked = [];

            safebrowsing.lookupUrlWithCallback(testUrlTwo, (response) => {
                expect(!response).toBeTruthy();
                // One new hash added
                expect(counter).toBe(2);
                expect(hashesChecked.length).toBe(1);
                expect(hashesChecked[0]).toBe('20E4');

                hashesChecked = [];

                safebrowsing.lookupUrlWithCallback(testUrlThree, (response) => {
                    expect(!response).toBeTruthy();
                    // All hashes have been checked already - so there was no request to backend
                    expect(counter).toBe(2);
                    expect(hashesChecked.length).toBe(0);

                    done();
                });
            });
        });
    });
});
