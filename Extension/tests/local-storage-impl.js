/**
 * `adguard.localStorageImpl` implementation contains chrome API, so we can't use it in tests.
 *  As the decision, we write implementation for `adguard.localStorageImpl` using wingow.localStorage
 */
adguard.localStorageImpl = (function () {

    var getItem = function (key) {
        return localStorage.getItem(key);
    };

    var setItem = function (key, value) {
        localStorage.setItem(key, value);
    };

    var removeItem = function (key) {
        localStorage.removeItem(key);
    };

    var hasItem = function (key) {
        return key in localStorage;
    };

    return {
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        hasItem: hasItem,
    };

})();