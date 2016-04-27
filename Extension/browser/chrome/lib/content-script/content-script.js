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
var contentPage = {
    sendMessage: SendMessageFunction,
    onMessage: new OnMessageEvent()
};

var i18n = chrome.i18n;


function pageMessageListener(event) {
    if (!(event.source == window &&
        event.data.direction &&
        event.data.direction == "from-page-script" &&
        event.data.elementUrl &&
        event.data.documentUrl)) {
        return;
    }

    console.log('--- content script received message');
    console.log(event.data);

    var message = {
        type: 'processShouldCollapse',
        elementUrl: event.data.elementUrl,
        documentUrl: event.data.documentUrl,
        requestType: "SUBDOCUMENT",
        requestId: 0
    };

    contentPage.sendMessage(message, function(response) {
        if (!response) {
            return;
        }

        event.source.postMessage({
            direction: 'to-page-script',
            elementUrl: event.data.elementUrl,
            documentUrl: event.data.documentUrl,
            collapse: response.collapse
        }, event.origin);
    });
}

window.addEventListener("message", pageMessageListener, false);