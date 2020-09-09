/**
 * `adguard.localStorageImpl` implementation contains chrome API, so we can't use it in tests.
 *  As the decision, we write implementation for `adguard.localStorageImpl`
 *  using window.localStorage
 */
adguard.localStorageImpl = (function () {
    const getItem = function (key) {
        return localStorage.getItem(key);
    };

    const setItem = function (key, value) {
        localStorage.setItem(key, value);
    };

    const removeItem = function (key) {
        localStorage.removeItem(key);
    };

    const hasItem = function (key) {
        return key in localStorage;
    };

    return {
        getItem,
        setItem,
        removeItem,
        hasItem,
    };
})();
