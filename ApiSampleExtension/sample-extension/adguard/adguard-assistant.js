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

(function (window, undefined) {

/**
 * Global object for content scripts
 */
var adguardContent = {}; // jshint ignore:line

(function (adguard, self) {

    'use strict';

    /**
     * https://bugs.chromium.org/p/project-zero/issues/detail?id=1225&desc=6
     * Page script can inject global variables into the DOM, so content script isolation doesn't work as expected
     * So we have to make additional check before accessing a global variable.
     */
    function isDefined(property) {
        return Object.prototype.hasOwnProperty.call(self, property);
    }

    var browserApi = isDefined('browser') ? self.browser : self.chrome;

    adguard.i18n = browserApi.i18n;

    adguard.runtimeImpl = (function () {

        var onMessage = (function () {
            if (browserApi.runtime && browserApi.runtime.onMessage) {
                // Chromium, Edge, Firefox WebExtensions
                return browserApi.runtime.onMessage;
            }
            // Old Chromium
            return browserApi.extension.onMessage || browserApi.extension.onRequest;
        })();

        var sendMessage = (function () {
            if (browserApi.runtime && browserApi.runtime.sendMessage) {
                // Chromium, Edge, Firefox WebExtensions
                return browserApi.runtime.sendMessage;
            }
            // Old Chromium
            return browserApi.extension.sendMessage || browserApi.extension.sendRequest;
        })();

        return {
            onMessage: onMessage,
            sendMessage: sendMessage
        };

    })();

})(typeof adguardContent !== 'undefined' ? adguardContent : adguard, this); // jshint ignore:line

/* global adguardContent */

(function (adguard) {

    'use strict';

    window.i18n = adguard.i18n;

    window.contentPage = {
        sendMessage: adguard.runtimeImpl.sendMessage,
        onMessage: adguard.runtimeImpl.onMessage
    };

})(adguardContent);

var I18nHelper = { // jshint ignore:line

    translateElement: function (element, message) {

        try {
            while (element.lastChild) {
                element.removeChild(element.lastChild);
            }

            this.processString(message, element);
        } catch (ex) {
            // Ignore exceptions
        }
    },

    processString: function (str, element) {

        var el;

        var match1 = /^([^]*?)<(a|strong|span|i)([^>]*)>(.*?)<\/\2>([^]*)$/m.exec(str);
        var match2 = /^([^]*?)<(br|input)([^>]*)\/?>([^]*)$/m.exec(str);
        if (match1) {

            this.processString(match1[1], element);

            el = this.createElement(match1[2], match1[3]);

            this.processString(match1[4], el);
            element.appendChild(el);

            this.processString(match1[5], element);

        } else if (match2) {

            this.processString(match2[1], element);

            el = this.createElement(match2[2], match2[3]);
            element.appendChild(el);

            this.processString(match2[4], element);

        } else {
            element.appendChild(document.createTextNode(str.replace(/&nbsp;/g, '\u00A0')));
        }
    },

    createElement: function (tagName, attributes) {

        var el = document.createElement(tagName);
        if (!attributes) {
            return el;
        }

        var attrs = attributes.split(/([a-z]+='[^']+')/);
        for (var i = 0; i < attrs.length; i++) {
            var attr = attrs[i].trim();
            if (!attr) {
                continue;
            }
            var index = attr.indexOf("=");
            var attrName;
            var attrValue;
            if (index > 0) {
                attrName = attr.substring(0, index);
                attrValue = attr.substring(index + 2, attr.length - 1);
            }
            if (attrName && attrValue) {
                el.setAttribute(attrName, attrValue);
            }
        }

        return el;
    }
};

/* global contentPage, adguardAssistant */

(function () {

    if (window.top !== window || !(document.documentElement instanceof HTMLElement)) {
        return;
    }

    /**
     * `contentPage` may be undefined on the extension startup in FF browser.
     *
     * Different browsers have different strategies of the content scripts injections on extension startup.
     * For example, FF injects content scripts in already opened tabs, but Chrome doesn't do it.
     * In the case of the FF browser, content scripts with the `document_start` option won't injected into opened tabs, so we have to directly check this case.
     */
    if (typeof contentPage === 'undefined') {
        return;
    }

    var assistant;

    //save right-clicked element for assistant
    var clickedEl = null;
    document.addEventListener('mousedown', function (event) {
        if (event.button === 2) {
            clickedEl = event.target;
        }
    });

    contentPage.onMessage.addListener(function (message) {
        switch (message.type) {
            case 'initAssistant':
                var options = message.options;
                var addRuleCallbackName = options.addRuleCallbackName;

                var selectedElement = null;
                if (clickedEl && options.selectElement) {
                    selectedElement = clickedEl;
                }

                if (!assistant) {
                    assistant = adguardAssistant();
                } else {
                    assistant.close();
                }

                assistant.start(selectedElement, function(rules) {
                    contentPage.sendMessage({type: addRuleCallbackName, ruleText: rules});
                });
            break;
        }
    });

})();

})(window);