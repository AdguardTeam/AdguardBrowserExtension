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
/* global chrome */

var debug = function (message) {
    var div = document.getElementById("debugDiv");
    if (div) {
        div.innerHTML += message;
        div.innerHTML += '<br/>';
    }
};

var initPanel = function () {
    debug('Initializing panel..');

    chrome.devtools.panels.elements.onSelectionChanged.addListener(function() {
        chrome.devtools.inspectedWindow.eval("$0", function(result) {
            updatePanel(result);
        });
    });

    // expecting request from panel here
    //chrome.extension.onMessage.addListener(function (msg, _, sendResponse) {
    //    console.log(msg, _, sendResponse);
    //});

    bindEvents();

    debug('Initializing panel..finished');
};

var updatePanel = function (selectedElement) {
    debug('Updating panel..');
    debug('Selected element:' + selectedElement);

    //TODO: Customize panel elements
    //TODO: Construct rule
};

var bindEvents = function () {
    document.getElementById("preview-rule-button").addEventListener("click", function(e) {
        e.preventDefault();

        debug('Preview');
        //TODO: Send rule to background page
    });
};

document.addEventListener('DOMContentLoaded', function () {
    initPanel();
});


