/* eslint-disable no-unused-vars */
/**
 * This function patches if necessary browser.windows implementation for Firefox for Android
 */
export const patchWindows = function (browser) {
    // Make compatible with Android WebExt
    if (typeof browser.windows === 'undefined') {
        browser.windows = (function () {
            const defaultWindow = {
                id: 1,
                type: 'normal',
            };

            const emptyListener = {
                addListener() {
                    // Doing nothing
                },
            };

            const create = function (createData) {
                return Promise.resolve(defaultWindow);
            };

            const update = function (windowId, data) {
                return Promise.resolve();
            };

            const getAll = function (query) {
                return Promise.resolve(defaultWindow);
            };

            const getLastFocused = function () {
                return Promise.resolve(defaultWindow);
            };

            return {
                onCreated: emptyListener,
                onRemoved: emptyListener,
                onFocusChanged: emptyListener,
                create,
                update,
                getAll,
                getLastFocused,
            };
        })();
    }
};
