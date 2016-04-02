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

function Deferred() {
    this._done = [];
    this._fail = [];
}

Deferred.prototype = {
    execute: function (list, args) {
        var i = list.length;

        // convert arguments to an array
        // so they can be sent to the
        // callbacks via the apply method
        args = Array.prototype.slice.call(args);

        while (i--) {
            list[i].apply(null, args);
        }
    },
    resolve: function () {
        this.execute(this._done, arguments);
    },
    reject: function () {
        this.execute(this._fail, arguments);
    },
    done: function (callback) {
        this._done.push(callback);
    },
    fail: function (callback) {
        this._fail.push(callback);
    }
};