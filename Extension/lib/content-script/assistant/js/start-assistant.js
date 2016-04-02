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
if (window.top === window && document.documentElement instanceof HTMLElement) {

    var adguard;

    //save right-clicked element for assistant
    var clickedEl = null;
    document.addEventListener('mousedown', function (event) {
        if (event.button == 2) {
            clickedEl = event.target;
        }
    });

    contentPage.onMessage.addListener(function (message) {
        switch (message.type) {
            case 'initAssistant':
                if (adguard) {
                    adguard.destroy();
                } else {
                    adguard = new AdguardAssistant(balalaika);
                }
                var selectedElement;
                var options = message.options;
                if (options.cssSelector) {
                    selectedElement = document.querySelector(options.cssSelector);
                } else if (clickedEl && options.selectElement) {
                    selectedElement = clickedEl;
                }
                adguard.init({selectedElement: selectedElement});
                break;
            case 'destroyAssistant':
                if (adguard) {
                    adguard.destroy();
                    adguard = null;
                }
                break;
        }
    });
}