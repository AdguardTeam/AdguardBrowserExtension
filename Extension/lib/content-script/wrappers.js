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

/* global contentPage, WeakSet */

/**
 * Function for injecting some helper API into page context, that is used by request wrappers.
 *
 * @param scriptName Unique script name
 * @param shouldOverrideWebSocket If true we should override WebSocket object
 * @param shouldOverrideWebRTC If true we should override WebRTC objects
 * @param isInjected True means that we've already injected scripts in the contentWindow, i.e. wrapped request objects and passed message channel
 */
function injectPageScriptAPI(scriptName, shouldOverrideWebSocket, shouldOverrideWebRTC, isInjected) { // jshint ignore:line

    'use strict';

    /**
     * If script have been injected into a frame via contentWindow then we can simply take the copy of messageChannel left for us by parent document
     * Otherwise creates new message channel that sends a message to the content-script to check if request should be allowed or not.
     */
    var messageChannel = isInjected ? window[scriptName] : (function () {

        // Save original postMessage and addEventListener functions to prevent webpage from tampering both.
        var postMessage = window.postMessage;
        var addEventListener = window.addEventListener;

        // Current request ID (incremented every time we send a new message)
        var currentRequestId = 0;
        var requestsMap = {};

        /**
         * Handles messages sent from the content script back to the page script.
         *
         * @param event Event with necessary data
         */
        var onMessageReceived = function (event) {

            if (!event.data || !event.data.direction || event.data.direction !== "to-page-script@adguard") {
                return;
            }

            var requestData = requestsMap[event.data.requestId];
            if (requestData) {
                var wrapper = requestData.wrapper;
                requestData.onResponseReceived(wrapper, event.data.block);
                delete requestsMap[event.data.requestId];
            }
        };

        /**
         * @param url                The URL to which wrapped object is willing to connect
         * @param requestType        Request type ( WEBSOCKET or WEBRTC)
         * @param wrapper            WebSocket wrapper instance
         * @param onResponseReceived Called when response is received
         */
        var sendMessage = function (url, requestType, wrapper, onResponseReceived) {

            if (currentRequestId === 0) {
                // Subscribe to response when this method is called for the first time
                addEventListener.call(window, "message", onMessageReceived, false);
            }

            var requestId = ++currentRequestId;
            requestsMap[requestId] = {
                wrapper: wrapper,
                onResponseReceived: onResponseReceived
            };

            var message = {
                requestId: requestId,
                direction: 'from-page-script@adguard',
                elementUrl: url,
                documentUrl: document.URL,
                requestType: requestType
            };

            // Send a message to the background page to check if the request should be blocked
            postMessage.call(window, message, "*");
        };

        return {
            sendMessage: sendMessage
        };

    })();

    /*
     * In some case Chrome won't run content scripts inside frames.
     * So we have to intercept access to contentWindow/contentDocument and manually inject wrapper script into this context
     *
     * Based on: https://github.com/adblockplus/adblockpluschrome/commit/1aabfb3346dc0821c52dd9e97f7d61b8c99cd707
     */
    var injectedToString = Function.prototype.toString.bind(injectPageScriptAPI);

    var injectedFramesAdd;
    var injectedFramesHas;
    if (window.WeakSet instanceof Function) {
        var injectedFrames = new WeakSet();
        injectedFramesAdd = WeakSet.prototype.add.bind(injectedFrames);
        injectedFramesHas = WeakSet.prototype.has.bind(injectedFrames);
    } else {
        var frames = [];
        injectedFramesAdd = function (el) {
            if (frames.indexOf(el) < 0) {
                frames.push(el);
            }
        };
        injectedFramesHas = function (el) {
            return frames.indexOf(el) >= 0;
        };
    }

    /**
     * Injects wrapper's script into passed window
     * @param contentWindow Frame's content window
     */
    function injectPageScriptAPIInWindow(contentWindow) {
        try {
            if (contentWindow && !injectedFramesHas(contentWindow)) {
                injectedFramesAdd(contentWindow);
                contentWindow[scriptName] = messageChannel; // Left message channel for the injected script
                var args = "'" + scriptName + "', " + shouldOverrideWebSocket + ", " + shouldOverrideWebRTC + ", true";
                contentWindow.eval("(" + injectedToString() + ")(" + args + ");");
                delete contentWindow[scriptName];
            }
        } catch (e) {
        }
    }

    /**
     * Overrides access to contentWindow/contentDocument for the passed HTML element's interface (iframe, frame, object)
     * If the content of one of these objects is requested we will inject our wrapper script.
     * @param iface HTML element's interface
     */
    function overrideContentAccess(iface) {

        var contentWindowDescriptor = Object.getOwnPropertyDescriptor(iface.prototype, "contentWindow");
        var contentDocumentDescriptor = Object.getOwnPropertyDescriptor(iface.prototype, "contentDocument");

        // Apparently in HTMLObjectElement.prototype.contentWindow does not exist
        // in older versions of Chrome such as 42.
        if (!contentWindowDescriptor) {
            return;
        }

        var getContentWindow = Function.prototype.call.bind(contentWindowDescriptor.get);
        var getContentDocument = Function.prototype.call.bind(contentDocumentDescriptor.get);

        contentWindowDescriptor.get = function () {
            var contentWindow = getContentWindow(this);
            injectPageScriptAPIInWindow(contentWindow);
            return contentWindow;
        };
        contentDocumentDescriptor.get = function () {
            injectPageScriptAPIInWindow(getContentWindow(this));
            return getContentDocument(this);
        };

        Object.defineProperty(iface.prototype, "contentWindow", contentWindowDescriptor);
        Object.defineProperty(iface.prototype, "contentDocument", contentDocumentDescriptor);
    }

    var interfaces = [HTMLFrameElement, HTMLIFrameElement, HTMLObjectElement];
    for (var i = 0; i < interfaces.length; i++) {
        overrideContentAccess(interfaces[i]);
    }

    /**
     * Defines properties in destination object
     * @param src Source object
     * @param dest Destination object
     * @param properties Properties to copy
     */
    var copyProperties = function (src, dest, properties) {
        for (var i = 0; i < properties.length; i++) {
            var prop = properties[i];
            var descriptor = Object.getOwnPropertyDescriptor(src, prop);
            // Passed property may be undefined
            if (descriptor) {
                Object.defineProperty(dest, prop, descriptor);
            }
        }
    };

    /**
     * Check request by sending message to content script
     * @param url URL to block
     * @param type Request type
     * @param callback Result callback
     */
    var checkRequest = function (url, type, callback) {
        messageChannel.sendMessage(url, type, this, function (wrapper, blockConnection) {
            callback(blockConnection);
        });
    };

    /**
     * The function overrides window.WebSocket with our wrapper, that will check url with filters through messaging with content-script.
     *
     * IMPORTANT NOTE:
     * This function is first loaded as a content script. The only purpose of it is to call
     * the "toString" method and use resulting string as a text content for injected script.
     */
    var overrideWebSocket = function () { // jshint ignore:line

        if (!(window.WebSocket instanceof Function)) {
            return;
        }

        /**
         * WebSocket wrapper implementation.
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/349
         *
         * Based on:
         * https://github.com/adblockplus/adblockpluschrome/commit/457a336ee55a433217c3ffe5d363e5c6980f26f4
         */

        /**
         * As far as possible we must track everything we use that could be sabotaged by the website later in order to circumvent us.
         */
        var RealWebSocket = WebSocket;
        var closeWebSocket = Function.prototype.call.bind(RealWebSocket.prototype.close);

        function WrappedWebSocket(url, protocols) {
            // Throw correct exceptions if the constructor is used improperly.
            if (!(this instanceof WrappedWebSocket)) {
                return RealWebSocket();
            }
            if (arguments.length < 1) {
                return new RealWebSocket();
            }

            /**
             * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1090
             * undefined 'protocols', somehow broke websocket wrapper on spotify
             */
            var websocket;
            if (protocols) {
                websocket = new RealWebSocket(url, protocols);
            } else {
                websocket = new RealWebSocket(url);
            }

            // This is the key point: checking if this WS should be blocked or not
            // Don't forget that the type of 'websocket.url' is String, but 'url 'parameter might have another type.
            checkRequest(websocket.url, 'WEBSOCKET', function (blocked) {
                if (blocked) {
                    closeWebSocket(websocket);
                }
            });

            return websocket;
        }

        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/488
        WrappedWebSocket.prototype = RealWebSocket.prototype;
        window.WebSocket = WrappedWebSocket.bind();

        copyProperties(RealWebSocket, WebSocket, ["CONNECTING", "OPEN", "CLOSING", "CLOSED", "name", "prototype"]);

        RealWebSocket.prototype.constructor = WebSocket;

    };

    /**
     * The function overrides window.RTCPeerConnection with our wrapper, that will check ice servers URLs with filters through messaging with content-script.
     *
     * IMPORTANT NOTE:
     * This function is first loaded as a content script. The only purpose of it is to call
     * the "toString" method and use resulting string as a text content for injected script.
     */
    var overrideWebRTC = function () { // jshint ignore:line


        if (!(window.RTCPeerConnection instanceof Function) &&
            !(window.webkitRTCPeerConnection instanceof Function)) {
            return;
        }

        /**
         * RTCPeerConnection wrapper implementation.
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/588
         *
         * Based on:
         * https://github.com/adblockplus/adblockpluschrome/commit/af0585137be19011eace1cf68bf61eed2e6db974
         *
         * Chromium webRequest API doesn't allow the blocking of WebRTC connections
         * https://bugs.chromium.org/p/chromium/issues/detail?id=707683
         */

        var RealRTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
        var closeRTCPeerConnection = Function.prototype.call.bind(RealRTCPeerConnection.prototype.close);

        var RealArray = Array;
        var RealString = String;
        var createObject = Object.create;
        var defineProperty = Object.defineProperty;

        /**
         * Convert passed url to string
         * @param url URL
         * @returns {string}
         */
        function urlToString(url) {
            if (typeof url !== "undefined") {
                return RealString(url);
            }
        }

        /**
         * Creates new immutable array from original with some transform function
         * @param original
         * @param transform
         * @returns {*}
         */
        function safeCopyArray(original, transform) {

            if (original === null || typeof original !== "object") {
                return original;
            }

            var immutable = RealArray(original.length);
            for (var i = 0; i < immutable.length; i++) {
                defineProperty(immutable, i, {
                    configurable: false, enumerable: false, writable: false,
                    value: transform(original[i])
                });
            }
            defineProperty(immutable, "length", {
                configurable: false, enumerable: false, writable: false,
                value: immutable.length
            });
            return immutable;
        }

        /**
         * Protect configuration from mutations
         * @param configuration RTCPeerConnection configuration object
         * @returns {*}
         */
        function protectConfiguration(configuration) {

            if (configuration === null || typeof configuration !== "object") {
                return configuration;
            }

            var iceServers = safeCopyArray(
                configuration.iceServers,
                function (iceServer) {

                    var url = iceServer.url;
                    var urls = iceServer.urls;

                    // RTCPeerConnection doesn't iterate through pseudo Arrays of urls.
                    if (typeof urls !== "undefined" && !(urls instanceof RealArray)) {
                        urls = [urls];
                    }

                    return createObject(iceServer, {
                        url: {
                            configurable: false, enumerable: false, writable: false,
                            value: urlToString(url)
                        },
                        urls: {
                            configurable: false, enumerable: false, writable: false,
                            value: safeCopyArray(urls, urlToString)
                        }
                    });
                }
            );

            return createObject(configuration, {
                iceServers: {
                    configurable: false, enumerable: false, writable: false,
                    value: iceServers
                }
            });
        }

        /**
         * Check WebRTC connection's URL and close if it's blocked by rule
         * @param connection Connection
         * @param url URL to check
         */
        function checkWebRTCRequest(connection, url) {
            checkRequest(url, 'WEBRTC', function (blocked) {
                if (blocked) {
                    try {
                        closeRTCPeerConnection(connection);
                    } catch (e) {
                        // Ignore exceptions
                    }
                }
            });
        }

        /**
         * Check each URL of ice server in configuration for blocking.
         *
         * @param connection RTCPeerConnection
         * @param configuration Configuration for RTCPeerConnection
         * https://developer.mozilla.org/en-US/docs/Web/API/RTCConfiguration
         */
        function checkConfiguration(connection, configuration) {

            if (!configuration || !configuration.iceServers) {
                return;
            }

            var iceServers = configuration.iceServers;
            for (var i = 0; i < iceServers.length; i++) {

                var iceServer = iceServers[i];
                if (!iceServer) {
                    continue;
                }

                if (iceServer.url) {
                    checkWebRTCRequest(connection, iceServer.url);
                }

                if (iceServer.urls) {
                    for (var j = 0; j < iceServer.urls.length; j++) {
                        checkWebRTCRequest(connection, iceServer.urls[j]);
                    }
                }
            }
        }

        /**
         * Overrides setConfiguration method
         * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/setConfiguration
         */
        if (RealRTCPeerConnection.prototype.setConfiguration) {

            var realSetConfiguration = Function.prototype.call.bind(RealRTCPeerConnection.prototype.setConfiguration);

            RealRTCPeerConnection.prototype.setConfiguration = function (configuration) {
                configuration = protectConfiguration(configuration);
                // Call the real method first, so that validates the configuration
                realSetConfiguration(this, configuration);
                checkConfiguration(this, configuration);
            };
        }

        function WrappedRTCPeerConnection(configuration, arg) {

            if (!(this instanceof WrappedRTCPeerConnection)) {
                return RealRTCPeerConnection();
            }

            configuration = protectConfiguration(configuration);

            /**
             * The old webkitRTCPeerConnection constructor takes an optional second argument and we must pass it.
             */
            var connection = new RealRTCPeerConnection(configuration, arg);
            checkConfiguration(connection, configuration);
            return connection;
        }

        WrappedRTCPeerConnection.prototype = RealRTCPeerConnection.prototype;

        var boundWrappedRTCPeerConnection = WrappedRTCPeerConnection.bind();
        copyProperties(RealRTCPeerConnection, boundWrappedRTCPeerConnection, ["caller", "generateCertificate", "name", "prototype"]);
        RealRTCPeerConnection.prototype.constructor = boundWrappedRTCPeerConnection;

        if ("RTCPeerConnection" in window) {
            window.RTCPeerConnection = boundWrappedRTCPeerConnection;
        }
        if ("webkitRTCPeerConnection" in window) {
            window.webkitRTCPeerConnection = boundWrappedRTCPeerConnection;
        }
    };

    if (shouldOverrideWebSocket) {
        overrideWebSocket();
    }

    if (shouldOverrideWebRTC) {
        overrideWebRTC();
    }
}

/**
 * This function is executed in the content script. It starts listening to events from the page script and passes them further to the background page.
 */
var initPageMessageListener = function () { // jshint ignore:line

    'use strict';

    /**
     * Listener for websocket wrapper messages.
     *
     * @param event
     */
    function pageMessageListener(event) {
        if (!(event.source === window &&
            event.data.direction &&
            event.data.direction === "from-page-script@adguard" &&
            event.data.elementUrl &&
            event.data.documentUrl)) {
            return;
        }

        var message = {
            type: 'checkPageScriptWrapperRequest',
            elementUrl: event.data.elementUrl,
            documentUrl: event.data.documentUrl,
            requestType: event.data.requestType,
            requestId: event.data.requestId
        };

        contentPage.sendMessage(message, function (response) {
            if (!response) {
                return;
            }

            var message = {
                direction: 'to-page-script@adguard',
                elementUrl: event.data.elementUrl,
                documentUrl: event.data.documentUrl,
                requestType: event.data.requestType,
                requestId: response.requestId,
                block: response.block
            };

            event.source.postMessage(message, event.origin);
        });
    }

    window.addEventListener("message", pageMessageListener, false);
};