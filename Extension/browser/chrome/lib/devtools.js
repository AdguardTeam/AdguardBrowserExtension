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
(function () {

    /**
     * This function gonna be executed in inspected page's context
     * Selected element can be accessed through $0
     */
    var updateSidebarPanelElements = function () {
        console.log($0);
    };

    //TODO: Try to move it to first cell
    chrome.devtools.panels.elements.createSidebarPane("Adguard",
        function (sidebar) {
            "use strict";
            function updateSidebarPanel() {
                //pass a function as a string that will be executed later on by chrome
                //sidebar.setExpression("(" + page_getKnockoutInfo.toString() + ")("+shouldDoKOtoJS+")");

                chrome.devtools.inspectedWindow.eval("(" + updateSidebarPanelElements.toString() + ")()");
            }

            sidebar.setPage("pages/devtools-elements-sidebar.html");

            //initial
            updateSidebarPanel();
            //attach to chrome events so that the sidebarPane refreshes (contains up to date info)
            chrome.devtools.panels.elements.onSelectionChanged.addListener(updateSidebarPanel);
            sidebar.onShown.addListener(updateSidebarPanel);

            //listen to a message send by the background page (when the chrome windows's focus changes)
            //chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
            //    updateSidebarPanel();
            //});
        });

})();
