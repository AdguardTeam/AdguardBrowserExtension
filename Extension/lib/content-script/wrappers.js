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
 * @param shouldOverrideWebRTC If true we should override WebRTC objects
 * @param isInjected True means that we've already injected scripts in the contentWindow, i.e. wrapped request objects and passed message channel
 */
function injectPageScriptAPI(scriptName, shouldOverrideWebRTC, isInjected) {
    'use strict';

    /**
     * If script have been injected into a frame via contentWindow then we can simply take the copy of messageChannel left for us by parent document
     * Otherwise creates new message channel that sends a message to the content-script to check if request should be allowed or not.
     */
    const messageChannel = isInjected ? window[scriptName] : (function () {
        // Save original postMessage and addEventListener functions to prevent webpage from tampering both.
        const postMessage = window.postMessage;
        const addEventListener = window.addEventListener;

        // Current request ID (incremented every time we send a new message)
        let currentRequestId = 0;
        const requestsMap = {};

        /**
         * Handles messages sent from the content script back to the page script.
         *
         * @param event Event with necessary data
         */
        const onMessageReceived = function (event) {
            if (!event.data || !event.data.direction || event.data.direction !== 'to-page-script@adguard') {
                return;
            }

            const requestData = requestsMap[event.data.requestId];
            if (requestData) {
                const wrapper = requestData.wrapper;
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
        const sendMessage = function (url, requestType, wrapper, onResponseReceived) {
            if (currentRequestId === 0) {
                // Subscribe to response when this method is called for the first time
                addEventListener.call(window, 'message', onMessageReceived, false);
            }

            const requestId = ++currentRequestId;
            requestsMap[requestId] = {
                wrapper: wrapper,
                onResponseReceived: onResponseReceived,
            };

            const message = {
                requestId: requestId,
                direction: 'from-page-script@adguard',
                elementUrl: url,
                documentUrl: document.URL,
                requestType: requestType,
            };

            // Send a message to the background page to check if the request should be blocked
            postMessage.call(window, message, '*');
        };

        return {
            sendMessage: sendMessage,
        };
    })();

    /*
     * In some case Chrome won't run content scripts inside frames.
     * So we have to intercept access to contentWindow/contentDocument and manually inject wrapper script into this context
     *
     * Based on: https://github.com/adblockplus/adblockpluschrome/commit/1aabfb3346dc0821c52dd9e97f7d61b8c99cd707
     */
    const injectedToString = Function.prototype.toString.bind(injectPageScriptAPI);

    let injectedFramesAdd;
    let injectedFramesHas;
    if (window.WeakSet instanceof Function) {
        const injectedFrames = new WeakSet();
        injectedFramesAdd = WeakSet.prototype.add.bind(injectedFrames);
        injectedFramesHas = WeakSet.prototype.has.bind(injectedFrames);
    } else {
        const frames = [];
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
                const args = `'${scriptName}', ${shouldOverrideWebRTC}, true`;
                contentWindow.eval(`(${injectedToString()})(${args});`);
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
        const contentWindowDescriptor = Object.getOwnPropertyDescriptor(iface.prototype, 'contentWindow');
        const contentDocumentDescriptor = Object.getOwnPropertyDescriptor(iface.prototype, 'contentDocument');

        // Apparently in HTMLObjectElement.prototype.contentWindow does not exist
        // in older versions of Chrome such as 42.
        if (!contentWindowDescriptor) {
            return;
        }

        const getContentWindow = Function.prototype.call.bind(contentWindowDescriptor.get);
        const getContentDocument = Function.prototype.call.bind(contentDocumentDescriptor.get);

        contentWindowDescriptor.get = function () {
            const contentWindow = getContentWindow(this);
            injectPageScriptAPIInWindow(contentWindow);
            return contentWindow;
        };
        contentDocumentDescriptor.get = function () {
            injectPageScriptAPIInWindow(getContentWindow(this));
            return getContentDocument(this);
        };

        Object.defineProperty(iface.prototype, 'contentWindow', contentWindowDescriptor);
        Object.defineProperty(iface.prototype, 'contentDocument', contentDocumentDescriptor);
    }

    const interfaces = [HTMLFrameElement, HTMLIFrameElement, HTMLObjectElement];
    for (let i = 0; i < interfaces.length; i += 1) {
        overrideContentAccess(interfaces[i]);
    }

    /**
     * Defines properties in destination object
     * @param src Source object
     * @param dest Destination object
     * @param properties Properties to copy
     */
    const copyProperties = function (src, dest, properties) {
        for (let i = 0; i < properties.length; i += 1) {
            const prop = properties[i];
            const descriptor = Object.getOwnPropertyDescriptor(src, prop);
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
    const checkRequest = function (url, type, callback) {
        messageChannel.sendMessage(url, type, this, function (wrapper, blockConnection) {
            callback(blockConnection);
        });
    };

    /**
     * The function overrides window.RTCPeerConnection with our wrapper, that will check ice servers URLs with filters through messaging with content-script.
     *
     * IMPORTANT NOTE:
     * This function is first loaded as a content script. The only purpose of it is to call
     * the "toString" method and use resulting string as a text content for injected script.
     */
    const overrideWebRTC = function () {
        if (!(window.RTCPeerConnection instanceof Function)
            && !(window.webkitRTCPeerConnection instanceof Function)) {
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

        const RealRTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
        const closeRTCPeerConnection = Function.prototype.call.bind(RealRTCPeerConnection.prototype.close);

        const RealArray = Array;
        const RealString = String;
        const createObject = Object.create;
        const defineProperty = Object.defineProperty;

        /**
         * Convert passed url to string
         * @param url URL
         * @returns {string}
         */
        function urlToString(url) {
            if (typeof url !== 'undefined') {
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
            if (original === null || typeof original !== 'object') {
                return original;
            }

            const immutable = RealArray(original.length);
            for (let i = 0; i < immutable.length; i += 1) {
                defineProperty(immutable, i, {
                    configurable: false,
                    enumerable: false,
                    writable: false,
                    value: transform(original[i]),
                });
            }
            defineProperty(immutable, 'length', {
                configurable: false,
                enumerable: false,
                writable: false,
                value: immutable.length,
            });
            return immutable;
        }

        /**
         * Protect configuration from mutations
         * @param configuration RTCPeerConnection configuration object
         * @returns {*}
         */
        function protectConfiguration(configuration) {
            if (configuration === null || typeof configuration !== 'object') {
                return configuration;
            }

            const iceServers = safeCopyArray(
                configuration.iceServers,
                function (iceServer) {
                    let { url, urls } = iceServer;

                    // RTCPeerConnection doesn't iterate through pseudo Arrays of urls.
                    if (typeof urls !== 'undefined' && !(urls instanceof RealArray)) {
                        urls = [urls];
                    }

                    return createObject(iceServer, {
                        url: {
                            configurable: false,
                            enumerable: false,
                            writable: false,
                            value: urlToString(url),
                        },
                        urls: {
                            configurable: false,
                            enumerable: false,
                            writable: false,
                            value: safeCopyArray(urls, urlToString),
                        },
                    });
                }
            );

            return createObject(configuration, {
                iceServers: {
                    configurable: false,
                    enumerable: false,
                    writable: false,
                    value: iceServers,
                },
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

            const iceServers = configuration.iceServers;
            for (let i = 0; i < iceServers.length; i += 1) {
                const iceServer = iceServers[i];

                if (!iceServer) {
                    continue;
                }

                if (iceServer.url) {
                    checkWebRTCRequest(connection, iceServer.url);
                }

                if (iceServer.urls) {
                    for (let j = 0; j < iceServer.urls.length; j += 1) {
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
            const realSetConfiguration = Function.prototype.call.bind(RealRTCPeerConnection.prototype.setConfiguration);

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
            const connection = new RealRTCPeerConnection(configuration, arg);
            checkConfiguration(connection, configuration);
            return connection;
        }

        WrappedRTCPeerConnection.prototype = RealRTCPeerConnection.prototype;

        const boundWrappedRTCPeerConnection = WrappedRTCPeerConnection.bind();
        copyProperties(RealRTCPeerConnection, boundWrappedRTCPeerConnection, ['caller', 'generateCertificate', 'name', 'prototype']);
        RealRTCPeerConnection.prototype.constructor = boundWrappedRTCPeerConnection;

        if ('RTCPeerConnection' in window) {
            window.RTCPeerConnection = boundWrappedRTCPeerConnection;
        }
        if ('webkitRTCPeerConnection' in window) {
            window.webkitRTCPeerConnection = boundWrappedRTCPeerConnection;
        }
    };

    if (shouldOverrideWebRTC) {
        overrideWebRTC();
    }
}

/**
 * This function is executed in the content script. It starts listening to events from the page script and passes them further to the background page.
 */
const initPageMessageListener = function () {
    'use strict';

    /**
     * Listener for websocket wrapper messages.
     *
     * @param event
     */
    function pageMessageListener(event) {
        if (!(event.source === window
            && event.data.direction
            && event.data.direction === 'from-page-script@adguard'
            && event.data.elementUrl
            && event.data.documentUrl)) {
            return;
        }

        const message = {
            type: 'checkPageScriptWrapperRequest',
            elementUrl: event.data.elementUrl,
            documentUrl: event.data.documentUrl,
            requestType: event.data.requestType,
            requestId: event.data.requestId,
        };

        contentPage.sendMessage(message, function (response) {
            if (!response) {
                return;
            }

            const message = {
                direction: 'to-page-script@adguard',
                elementUrl: event.data.elementUrl,
                documentUrl: event.data.documentUrl,
                requestType: event.data.requestType,
                requestId: response.requestId,
                block: response.block,
            };

            event.source.postMessage(message, event.origin);
        });
    }

    window.addEventListener('message', pageMessageListener, false);
};
