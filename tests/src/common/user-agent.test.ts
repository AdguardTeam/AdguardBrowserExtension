/* eslint-disable max-len */
describe('UserAgent', () => {
    beforeEach(() => {
        // Clear the require cache for modules to avoid state persisting between tests
        jest.resetModules();
    });

    const testCases = [
        {
            userAgent: 'Mozilla/5.0 (Android 10; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0',
            expectedBrowserName: 'Firefox Mobile',
            expectedVersion: 121,
            expectedSystemInfo: 'Android 10',
        },
        {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
            expectedBrowserName: 'Chrome',
            expectedVersion: 113,
            expectedSystemInfo: 'Mac OS 10.15.7',
        },
        {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/113.0',
            expectedBrowserName: 'Firefox',
            expectedVersion: 113,
            expectedSystemInfo: 'Mac OS 10.15',
        },
        {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 OPR/98.0.0.0',
            expectedBrowserName: 'Opera',
            expectedVersion: 98,
            expectedSystemInfo: 'Mac OS 10.15.7',
        },
        {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.50',
            expectedBrowserName: 'Edge',
            expectedVersion: 113,
            expectedSystemInfo: 'Mac OS 10.15.7',
        },
        {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 YaBrowser/23.3.3.762 Yowser/2.5 Safari/537.36',
            expectedBrowserName: 'Yandex',
            expectedVersion: 23,
            expectedSystemInfo: 'Mac OS 10.15.7',
        },
        {
            userAgent: 'invalid',
            expectedBrowserName: undefined,
            expectedVersion: undefined,
            expectedSystemInfo: undefined,
        },
        {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.31',
            expectedBrowserName: 'Edge',
            expectedVersion: 117,
            expectedSystemInfo: 'Windows 10',
        },
    ];

    test.each(testCases)('correctly determines version for $expectedBrowserName', async ({
        userAgent,
        expectedBrowserName,
        expectedVersion,
        expectedSystemInfo,
    }) => {
        // Create a spy on window.navigator.userAgent and provide a mock return value
        jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent);

        // The require function is used here to avoid ES6 import hoisting issue. It is placed after
        // the mock setup so that when the module is required, the mock is already in place. This is
        // necessary because ES6 imports would be hoisted above the mock and use an unmocked value.

        // eslint-disable-next-line global-require
        const { UserAgent } = require('../../../Extension/src/common/user-agent');

        expect(UserAgent.browserName).toBe(expectedBrowserName);
        expect(UserAgent.version).toBe(expectedVersion);

        const systemInfo = await UserAgent.getSystemInfo();
        expect(systemInfo).toBe(expectedSystemInfo);
    });
});

// Ensure the file is treated as a module by exporting an empty object
export {};
