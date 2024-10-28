import browser from 'sinon-chrome';

// implements some global function for 'webextension-polyfill' before mocking
browser.runtime.getURL.callsFake((url: string) => `chrome-extension://test/${url}`);
browser.runtime.getManifest.returns({ version: '0.0.0' });

browser.i18n.getUILanguage.returns('en');
browser.i18n.getMessage.callsFake((value: string) => value);

browser.tabs.query.returns([]);

const storageData: Record<string, string> = {};

Object.assign(browser, { storage: {
    // Basic `browser.storage.local` mock implementation
    local: {
        set: jest.fn(async (items: Record<string, any>) => {
            for (const [key, value] of Object.entries(items)) {
                storageData[key] = JSON.stringify(value);
            }
        }),

        get: jest.fn(async (keys?: string | string[] | null) => {
            if (keys === null) {
                const result: Record<string, any> = {};
                for (const [key, value] of Object.entries(storageData)) {
                    result[key] = JSON.parse(value);
                }
                return result;
            }

            if (typeof keys === 'string') {
                const data = storageData[keys];
                if (data !== undefined) {
                    return { [keys]: JSON.parse(data) };
                }
                return {};
            }

            if (Array.isArray(keys)) {
                return keys.reduce((result, key) => {
                    const data = storageData[key];
                    if (data !== undefined) {
                        result[key] = JSON.parse(data);
                    }
                    return result;
                }, {} as Record<string, any>);
            }

            return {};
        }),

        remove: jest.fn(async (keys: string | string[]) => {
            if (typeof keys === 'string') {
                delete storageData[keys];
            } else if (Array.isArray(keys)) {
                keys.forEach((key) => {
                    delete storageData[key];
                });
            }
        }),

        clear: jest.fn(async () => {
            Object.keys(storageData).forEach((key) => {
                delete storageData[key];
            });
        }),
    },
}
});

export default browser;
