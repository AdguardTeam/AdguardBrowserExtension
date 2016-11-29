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

/* global Cc, Ci */

adguard.runtime = (function (adguard, api) {

    'use strict';

    var onMessageChannel = adguard.utils.channels.newChannel();

    var MSG_CHANNEL = 'Adguard:send-message-channel';

    var adguardMessageChannelListener = (function () {

        function getTabFromTarget(target) {
            var tab = adguard.tabsImpl.getTabForBrowser(target);
            if (!tab) {
                // Legacy browsers support. For PaleMoon and old Firefox getTabForBrowser returns null
                tab = adguard.tabsImpl.getTabForContentWindow(target.contentWindow);
            }
            return tab;
        }

        function wrapResponseResult(result, message) {
            // Passing callbackId to response
            return {
                type: message.data.type,
                callbackId: message.data.callbackId,
                result: result
            };
        }

        /**
         * Receives a message from the frame script
         * https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMessageListener#receiveMessage()
         *
         * @message Message object
         */
        var receiveMessage = function (message) {

            var messageManager;
            try {
                // Get the message manager of the sender frame script
                messageManager = message.target
                    .QueryInterface(Ci.nsIFrameLoaderOwner)
                    .frameLoader
                    .messageManager;
            } catch (ex) {
            }

            if (!messageManager) {
                // Message came from a popup, and its message manager is not usable.
                messageManager = adguard.windowsImpl.getOwnerWindow(message.target).messageManager;
            }

            if (!messageManager) {
                adguard.console.error('Unable to retrieve messageManager for {0}', message.target);
                return;
            }

            var tab = getTabFromTarget(message.target);
            var tabId = tab ? adguard.tabsImpl.getTabIdForTab(tab) : -1;

            // Message sender identification
            var sender = {
                tab: {tabId: tabId}
            };

            var sendResponse = null;
            if ('callbackId' in message.data) {
                sendResponse = function (result) {
                    messageManager.sendAsyncMessage('Adguard:send-message-channel', wrapResponseResult(result, message));
                };
            } else {
                // Caller does not expect to get a response
                sendResponse = function () {
                    // Empty
                };
            }

            var result = onMessageChannel.notify(message.data, sender, sendResponse);
            var async = result === true;

            if (async) {
                // If async is true sendResponse will be invoked later
                return;
            }

            if (message.sync) {
                // Message was sent with a "sendSyncMessage" call
                // Returning response immediately
                return wrapResponseResult(result, message);
            } else {
                sendResponse(result);
            }
        };

        // Expose listener interface
        return {
            receiveMessage: receiveMessage
        };

    })();

    var globalMessageManager = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
    globalMessageManager.addMessageListener(MSG_CHANNEL, adguardMessageChannelListener);

    adguard.unload.when(function () {
        globalMessageManager.removeMessageListener(MSG_CHANNEL, adguardMessageChannelListener);
    });

    api.onMessage = onMessageChannel;

    return api;

})(adguard, adguard.runtime || {});
