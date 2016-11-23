/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Filter rules storage implementation.
 *
 * Edge storage has a weird 1MB limit per value. Also Edge does not support "unlimitedStorage" permission.
 * The weird thing is that local storage does not limited like that so we just use it instead.
 *
 * TODO[Edge]: There is still a possibility to exceed local storage quota.
 * Consider using http://pieroxy.net/blog/pages/lz-string/index.html
 */
adguard.rulesStorageImpl = (function () {

    var read = function (path, callback) {
        try {
            var value = adguard.localStorageImpl.getItem(path);
            var lines = [];
            if (value) {
                lines = value.split(/[\r\n]+/);
            }
            callback(null, lines);
        } catch (ex) {
            callback(ex);
        }
    };

    var write = function (path, data, callback) {
        var value = data.join('\n');
        try {
            adguard.localStorageImpl.setItem(path, value);
            callback();
        } catch (ex) {
            callback(ex);
        }
    };

    var remove = function (path, successCallback) {
        adguard.localStorageImpl.removeItem(path);
        successCallback();
    };

    return {
        write: write,
        read: read,
        remove: remove
    };

})();