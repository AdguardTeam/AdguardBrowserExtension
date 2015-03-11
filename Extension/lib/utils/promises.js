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

var defer = require('sdk/core/promise').defer;
var deferAll = require('sdk/core/promise').all;

/**
 * Promise wrapper
 * @type {Promise}
 */
var Promise = exports.Promise = function () {

	var deferred = defer();
	var promise;
	if (typeof deferred.promise == 'function') {
		promise = deferred.promise();
	} else {
		promise = deferred.promise;
	}
	this.promise = promise;

	this.resolve = function () {
		deferred.resolve();
	};

	this.reject = function () {
		deferred.reject();
	};

	this.then = function (onSuccess, onReject) {
		promise.then(onSuccess, onReject);
	};
};

Promise.all = function (promises) {
	var defers = [];
	for (var i = 0; i < promises.length; i++) {
		defers.push(promises[i].promise);
	}
	return deferAll(defers);
};