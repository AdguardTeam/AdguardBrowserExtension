/* global require, exports */
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
var setTimeout = require('sdk/timers').setTimeout;

/**
 * Simple mediator
 */
var EventNotifier = exports.EventNotifier = {

	listenersMap: Object.create(null),
	listenersEventsMap: Object.create(null),
	listenerId: 0,

	/**
	 * Subscribes listener to the specified events
	 *
	 * @param events    List of event types listener will be notified of
	 * @param listener  Listener object
	 * @returns Index of the listener
	 */
	addSpecifiedListener: function (events, listener) {
		var listenerId = this.listenerId++;
		this.listenersMap[listenerId] = listener;
		this.listenersEventsMap[listenerId] = events;
		return listenerId;
	},

	/**
	 * Subscribe specified listener to all events
	 *
	 * @param listener Listener
	 * @returns Index of the listener
	 */
	addListener: function (listener) {
		var listenerId = this.listenerId++;
		this.listenersMap[listenerId] = listener;
		return listenerId;
	},

	/**
	 * Unsubscribe listener
	 * @param listenerId Index of listener to unsubscribe
	 */
	removeListener: function (listenerId) {
		delete this.listenersMap[listenerId];
		delete this.listenersEventsMap[listenerId];
	},

	/**
	 * Notifies listeners about the events passed as arguments of this function.
	 */
	notifyListeners: function () {
		for (var listenerId in this.listenersMap) { // jshint ignore:line
			var events = this.listenersEventsMap[listenerId];
			if (events && events.length > 0 && events.indexOf(arguments[0]) < 0) {
				continue;
			}
			try {
				var listener = this.listenersMap[listenerId];
				listener.apply(listener, arguments);
			} catch (ex) {
				Log.error("Error invoking listener for {0} cause: {1}", arguments[0], ex);
			}
		}
	},
	
	/**
	 * Asynchronously notifies all listeners about the events passed as arguments of this function.
	 * Some events should be dispatched asynchronously, for instance this is very important for Safari:
	 * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/251 
	 */
	notifyListenersAsync: function() {
		var args = arguments;
		setTimeout(function() {
			EventNotifier.notifyListeners.apply(EventNotifier, args);
		}, 500);
	}
};