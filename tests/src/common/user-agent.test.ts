/* eslint-disable max-len */
describe('UserAgent', () => {
    beforeEach(() => {
        // Clear the require cache for modules to avoid state persisting between tests
        jest.resetModules();
    });

    const testCases = [
        {
            browser: 'chrome',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
            expectedVersion: 113,
        },
        {
            browser: 'firefox',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/113.0',
            expectedVersion: 113,
        },
        {
            browser: 'opera',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 OPR/98.0.0.0',
            expectedVersion: 98,
        },
        {
            browser: 'edge',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.50',
            expectedVersion: 113,
        },
        {
            browser: 'yandex',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 YaBrowser/23.3.3.762 Yowser/2.5 Safari/537.36',
            expectedVersion: 23,
        },
        {
            browser: 'invalid',
            userAgent: 'invalid',
            expectedVersion: undefined,
        },
    ];

    test.each(testCases)('correctly determines version for $browser', ({
        userAgent,
        expectedVersion,
    }) => {
        // Create a spy on window.navigator.userAgent and provide a mock return value
        jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent);

        // The require function is used here to avoid ES6 import hoisting issue. It is placed after
        // the mock setup so that when the module is required, the mock is already in place. This is
        // necessary because ES6 imports would be hoisted above the mock and use an unmocked value.

        // eslint-disable-next-line global-require
        const { UserAgent } = require('../../../Extension/src/common/user-agent');

        expect(UserAgent.version).toBe(expectedVersion);
    });
});

// Ensure the file is treated as a module by exporting an empty object
export {};
