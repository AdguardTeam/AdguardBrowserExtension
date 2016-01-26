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
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var Log = require('../../lib/utils/log').Log;
var LS = require('../../lib/utils/local-storage').LS;

/**
 * Cache with maxCacheSize stored in local storage.
 *
 * @param lsProperty    Name of the local storage property.
 * @param size          Max cache size
 */
var LocalStorageCache = exports.LocalStorageCache = function (lsProperty, size) {
	this.lsProperty = lsProperty;
	this.maxCacheSize = size || this.CACHE_SIZE;
	this.load();
	this.cleanup();
};

LocalStorageCache.prototype = {

	CACHE_SIZE: 1000,
	CLEANUP_TTL: 3 * 60 * 1000,

	load: function () {
		this.cache = this._getCache();
		this.cacheSize = Object.keys(this.cache).length;
	},

	cleanup: function () {
		var cache = this.cache, key;
		for (key in cache) {
			var foundItem = this._getItem(cache, key);
			if (!foundItem) {
				delete cache[key];
				this.cacheSize--;
			}
		}
		if (this.cacheSize > this.maxCacheSize / 2) {
			for (key in cache) {
				delete cache[key];
				this.cacheSize--;
				if (this.cacheSize <= this.maxCacheSize / 2) {
					break;
				}
			}
		}
		this._saveCache(cache);
	},

	getValue: function (value) {
		var foundItem = this._getItem(this.cache, value);
		return foundItem ? foundItem.match : null;
	},

	saveValue: function (value, match, expired) {
		if (!value) {
			return;
		}
		if (this.cacheSize > this.maxCacheSize) {
			this.cleanup();
		}
		var cache = this.cache;
		cache[value] = {
			match: match,
			expired: expired
		};
		this.cacheSize++;

		if (this.cacheSize % 20 == 0) {
			this._saveCache(cache);
		}
	},

	_getCache: function () {
		var cache = Object.create(null);
		try {
			var json = LS.getItem(this.lsProperty);
			if (json) {
				cache = JSON.parse(json);
			}
		} catch (ex) {
			//ignore
			Log.error("Error read from {0} cache, cause: {1}", this.lsProperty, ex);
			LS.removeItem(this.lsProperty);
		}
		return cache;
	},

	_saveCache: function (cache) {
		try {
			LS.setItem(this.lsProperty, JSON.stringify(cache));
		} catch (ex) {
			Log.error("Error save to {0} cache, cause: {1}", this.lsProperty, ex);
		}
	},

	_getItem: function (cache, key, ttl) {
		ttl = isNaN(ttl) ? 0 : ttl;
		var value = cache[key];
		if (value != undefined) {
			var expired = value.expired - 0;
			if (Date.now() >= expired - ttl) {
				return null;
			}
			return value;
		}
		return null;
	}
};