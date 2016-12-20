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
 * adguard.integration is used for integration of Adguard extension and Adguard for Windows/Mac/Android versions.
 * Communication is based on websocket.
 * Protocol details see here: https://gist.github.com/atropnikov/479d8c7a6d83b5fd93f40b02797f8301 (TODO: change link)
 */
adguard.integration = (function (adguard, api) {

    /**
     * Simple api for working with websocket.
     * Connect, disconnect, read, write.
     * Subscribe to websocket lifecycle events.
     */
    var wsWrapper = (function (adguard, options) {

        var websocket;

        var onWsLifecycleChannel = adguard.utils.channels.newChannel();
        var onMessageChannel = adguard.utils.channels.newChannel();

        /**
         * Prevents from stuck websocket in CONNECTING status.
         * Timeout is 5 seconds.
         * @param ws
         */
        function timeoutConnection(ws) {
            setTimeout(function () {
                if (!ws) {
                    return;
                }
                if (ws && ws.readyState === 0) {
                    // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
                    ws.close(4000, 'Connection timeout');
                }
            }, 5000);
        }

        /**
         * Checks connection is open
         */
        function isConnected() {
            // https://developer.mozilla.org/ru/docs/Web/API/WebSocket#Ready_state_constants
            return websocket && websocket.readyState === 1;
        }

        /**
         * Try to establish websocket connection on certain port
         * @param port
         */
        function connect(port) {

            if (isConnected()) {
                return;
            }

            var url = (options.secure ? 'wss' : 'ws') + '://' + options.host + ':' + port + (options.path ? '/' + options.path : '' );

            try {

                if (websocket) {
                    websocket.close();
                }

                websocket = new WebSocket(url);

                websocket.onopen = function () {
                    adguard.console.debug('Websocket open event. Adguard application is running on "{0}"', this.url);
                    onWsLifecycleChannel.notify('open');
                };

                websocket.onmessage = function (event) {
                    adguard.console.debug('Websocket message event. Message received: {0}', event.data);
                    if (event && event.data) {
                        try {
                            var message = JSON.parse(event.data);
                            onMessageChannel.notify(decode(message));
                        } catch (ex) {
                            //TODO: print error
                        }
                    }
                };

                websocket.onerror = function () {
                    adguard.console.debug('Websocket error event. ReadyState "{0}". Adguard application is not running on "{1}" or is shutting down?', this.readyState, this.url);
                    onWsLifecycleChannel.notify('error');
                };

                websocket.onclose = function (event) {
                    if (event) {
                        adguard.console.debug('Websocket close event. Code "{0}" and reason "{1}" received.', event.code, event.reason);
                    } else {
                        adguard.console.debug('Websocket close event.');
                    }
                    onWsLifecycleChannel.notify('close');
                };

                timeoutConnection(websocket);

            } catch (ex) {
                adguard.console.debug('Websocket connection error: {0}', ex);
                onWsLifecycleChannel.notify('close');
            }
        }

        /**
         * Disconnect websocket
         * @param code
         * @param reason
         */
        var disconnect = function (code, reason) {
            if (websocket) {
                websocket.onclose = function () {
                };
                websocket.close(code, reason);
            }
        };

        /**
         * Encode all object properties with encodeURIComponent
         */
        function encode(object) {
            if (typeof object === 'object') {
                for (var property in object) { // jshint ignore:line
                    object[property] = encode(object[property]);
                }
                return object;
            }
            if (object !== null && object !== undefined) {
                return encodeURIComponent(object);
            }
            return object;
        }

        /**
         * Decode all object properties with decodeURIComponent
         */
        function decode(object) {
            if (typeof object === 'object') {
                for (var property in object) { // jshint ignore:line
                    object[property] = decode(object[property]);
                }
                return object;
            }
            if (object !== null && object !== undefined) {
                return decodeURIComponent(object);
            }
            return object;
        }

        /**
         * Send message to websocket
         * @param message
         */
        var send = function (message) {
            if (isConnected()) {
                websocket.send(JSON.stringify(encode(message)));
            }
        };

        return {

            connect: connect,
            disconnect: disconnect,
            send: send,

            onWsLifecycle: onWsLifecycleChannel, // websocket lifecycle events: open, close, error
            onMessage: onMessageChannel    // Proxy for incoming messages
        };

    })(adguard, {
        host: '127.0.0.1',
        path: 'adguard',
        secure: false
    });

    // TODO: define ports
    var ports = [6263, 10196, 14826, 24866, 25012, 38156, 46365, 49806, 55735, 59488]; // Discovery port feature

    var nextPortIndex = 0; // Current index for ports discovery
    var connectionTimeout = 50; // Timeout between connection attempts
    var connectionTimeoutId = 0;

    var authToken = null;
    var integrationInfo = Object.create(null);

    var CONNECTED_STATE = 'connected'; // Connection to websocket was established
    var ACTIVE_STATE = 'active';    // Authorization passed. Integation is enabled
    var REJECTED_STATE = 'rejected'; // Authorization failed or integration disabled by user or application.
    var AUTH_PENDING_STATE = 'auth_pending'; // Pending authorization
    var CLOSE_STATE = 'close'; // Connection to websocket was closed
    var NONE_STATE = 'none'; // Default state. In this state we are trying to connect to websocket if it's possible

    var integrationState = null; // Current integration state

    /**
     * Support for messages with callback
     */
    var nextActionId = 0;
    var actionCallbacks = Object.create(null);

    /**
     * Notifications for integration state changes.
     * Possible states are: active (integration is active), rejected (integration rejected by user or application), none (state is unknown)
     */
    var onStateChangedChannel = adguard.utils.channels.newChannel();

    var STATES = {
        ACTIVE: 'active',
        REJECTED: 'rejected',
        NONE: 'none'
    };

    /**
     * Fired when application send auth_pending message
     */
    var onAuthPendingChannel = adguard.utils.channels.newChannel();

    /**
     * Returns next port or null if ports were ended.
     */
    function getNextPort() {
        if (nextPortIndex >= ports.length) {
            return null;
        }
        return ports[nextPortIndex++];
    }

    /**
     * Token generation function
     * @returns {string}
     */
    function generateToken() {

        function gen() {
            return (65536 * (1 + Math.random()) | 0).toString(16).substring(1).toUpperCase(); // jshint ignore:line
        }

        return [gen(), gen(), gen(), gen(), gen(), gen(), gen(), gen()].join('');
    }

    /**
     * Get or generate authorization token.
     * Token is generated only once and saved to local storage.
     */
    function getOrGenerateToken() {
        var token = adguard.localStorage.getItem('integration-token');
        if (!token) {
            token = generateToken();
            adguard.localStorage.setItem('integration-token', token);
        }
        return token;
    }

    /**
     * Removes authorization token
     */
    function removeToken() {
        adguard.localStorage.removeItem('integration-token');
        authToken = null;
    }

    /**
     * Sends message to websocket
     * @param type Message type
     * @param payload Message payload
     */
    function send(type, payload) {
        payload = payload || Object.create(null);
        var message = {
            type: type,
            payload: payload
        };
        wsWrapper.send(message);
    }

    /**
     * Sends 'auth_request' message to websocket.
     * We generate (or get existing) token here and pass to application.
     * After that we are waiting for incoming 'auth_request' message with authorization result.
     */
    function sendAuthRequest() {
        send('auth_request', {
            token: getOrGenerateToken()
        });
    }

    function sendAction(action, payload, callback) {
        if (!isActive()) {
            adguard.console.error('Unable to send {0} message in {1} state', action, integrationState);
            return;
        }
        var actionId = ++nextActionId;
        if (typeof callback === 'function') {
            actionCallbacks[actionId] = callback;
        }
        payload = payload || Object.create(null);
        payload.token = authToken;
        payload.action = action;
        payload.actionId = actionId;
        send('action', payload);
    }

    /**
     * Handles 'auth_request' message.
     * @param payload Message payload property
     */
    function handleAuthRequestMessage(payload) {
        var status = payload.status;
        switch (status) {
            case 'auth_denied':
                transitionState(REJECTED_STATE);
                break;
            case 'auth_request':
                transitionState(AUTH_PENDING_STATE);
                break;
            case 'auth_success':
                transitionState(ACTIVE_STATE);
                break;
            default:
                adguard.console.error('Unknown auth_request message status: {0}', status);
                break;
        }
    }

    /**
     * Handles 'action' incoming message
     * @param payload Message payload property
     */
    function handleActionRequestMessage(payload) {
        var callback = actionCallbacks[payload.actionId];
        if (typeof callback === 'function') {
            callback(payload);
        }
    }

    /**
     * Handles 'welcome' message. Stores application metadata.
     * @param payload Application metadata
     */
    function handleWelcomeMessage(payload) {
        integrationInfo.version = payload.version;
        integrationInfo.name = payload.name;
        integrationInfo.capabilites = payload.capabilites;
    }

    /**
     * Handles websocket incoming message
     * @param message
     */
    function handleMessage(message) {

        var payload = message.payload || Object.create(null);

        switch (message.type) {
            case 'auth_request':
                handleAuthRequestMessage(payload);
                break;
            case 'action':
                handleActionRequestMessage(payload);
                break;
            case 'welcome':
                handleWelcomeMessage(payload);
                break;
        }
    }

    /**
     * Handles websocket lifecycle event
     * @param event
     */
    function handleLifecycleEvent(event) {
        switch (event) {
            case 'open':
                transitionState(CONNECTED_STATE);
                break;
            case 'close':
                transitionState(CLOSE_STATE);
                break;
            case 'error':
                // Do nothing
                break;
        }
    }

    function transitionState(newState) {

        if (newState === integrationState) {
            return;
        }

        adguard.console.debug('Transition to state {0}', newState);

        integrationState = newState;

        switch (newState) {
            case CONNECTED_STATE:
                // reset port discovery index
                nextPortIndex = 0;
                sendAuthRequest();
                break;
            case ACTIVE_STATE:
                authToken = getOrGenerateToken();
                break;
            case REJECTED_STATE:
                authToken = null;
                if (connectionTimeoutId) {
                    clearTimeout(connectionTimeoutId);
                }
                wsWrapper.disconnect(4001, 'Force disconnect'); // Force disconnect websocket. In this case we don't receive 'close' websocket event.
                break;
            case AUTH_PENDING_STATE:
                onAuthPendingChannel.notify();
                break;
            case CLOSE_STATE:
                transitionState(NONE_STATE);
                break;
            case NONE_STATE:
                // Try to connect
                var port = getNextPort();
                if (port) {
                    if (connectionTimeoutId) {
                        clearTimeout(connectionTimeoutId);
                    }
                    connectionTimeoutId = setTimeout(wsWrapper.connect.bind(null, port), connectionTimeout);
                } else {
                    transitionState(REJECTED_STATE);
                }
                break;
            default:
                adguard.console.error('Unknown integration state {0}', newState);
                break;
        }

        if (newState === ACTIVE_STATE) {
            onStateChangedChannel.notify(STATES.ACTIVE);
        } else if (newState === REJECTED_STATE) {
            onStateChangedChannel.notify(STATES.REJECTED);
        }
    }

    wsWrapper.onWsLifecycle.addListener(handleLifecycleEvent);
    wsWrapper.onMessage.addListener(handleMessage);

    /**
     * Checks integration is in active state
     * @returns {boolean}
     */
    var isActive = function () {
        return integrationState === ACTIVE_STATE;
    };

    /**
     * Returns integration state. See STATES object
     */
    var getState = function () {
        if (integrationState === ACTIVE_STATE) {
            return STATES.ACTIVE;
        } else if (integrationState === REJECTED_STATE) {
            return STATES.REJECTED;
        } else {
            return STATES.NONE;
        }
    };

    /**
     * Returns desktop Adguard application info
     */
    var getAppInfo = function () {
        return {name: integrationInfo.name || 'Adguard'};
    };

    /**
     * Enable integration and try to find Adguard application
     */
    var enable = function () {
        adguard.settings.changeIntegrationEnabled(true);
        // reset port discovery index
        nextPortIndex = 0;
        transitionState(NONE_STATE);
    };

    /**
     * Disable integration and disconnect from Adguard application
     */
    var disable = function () {
        adguard.settings.changeIntegrationEnabled(false);
        // Clear token
        removeToken();
        transitionState(REJECTED_STATE);
    };

    /**
     * Adds rule to desctop application
     * Do not encode rule text!
     * @param ruleText
     * @param callback
     */
    var addRule = function (ruleText, callback) {
        sendAction('add-rule', {
            data: ruleText
        }, callback);
    };

    /**
     * Removes rule from desktop application
     * Do not encode rule text!
     * @param ruleText
     * @param callback
     */
    var removeRule = function (ruleText, callback) {
        sendAction('remove-rule', {
            data: ruleText
        }, callback);
    };

    /**
     * Find rules in Adguard application.
     * @param requestUrl    Request Url
     * @param referrerUrl   Referrer Url
     * @param requestType   Request type
     * @param callback  If rule is found, callback contains instance one of types adguard.rules.*Rule (actually adguard.rules.UrlFilterRule)
     */
    var findRule = function (requestUrl, referrerUrl, requestType, callback) {
        sendAction('find-rule', {
            requestUrl: requestUrl,
            referrerUrl: referrerUrl,
            requestType: requestType
        }, function (payload) {
            if (payload.rule) {
                callback(adguard.rules.builder.createRule(payload.rule, payload.filterId - 0));
            }
        });
    };

    /**
     * Try to find DOCUMENT whitelist rule for tab.
     * If it was found then store rule to tab metadata.
     * @param tab Tab
     * @param url Tab Url
     */
    var checkTabWhiteListRule = function (tab, url) {

        if (url.indexOf('http') !== 0) {
            return;
        }

        findRule(url, null, 'DOCUMENT', function (rule) {

            var documentWhiteListRule = null;

            if (rule && rule.whiteListRule &&
                rule instanceof adguard.rules.UrlFilterRule &&
                rule.isFiltered(url, false, adguard.RequestTypes.DOCUMENT) &&
                rule.checkContentTypeIncluded('DOCUMENT')) {

                documentWhiteListRule = rule;
            }

            // Save whitelist rule to framesMap
            adguard.frames.recordTabAdguardDocumentWhiteListRule(tab, documentWhiteListRule);
        });
    };

    adguard.listeners.addListener(function (event) {
        if (event === adguard.listeners.APPLICATION_INITIALIZED) {
            if (!adguard.settings.isIntegrationEnabled()) {
                transitionState(REJECTED_STATE);
            } else {
                transitionState(NONE_STATE);
            }
        }
    });

    adguard.unload.when(function () {
        transitionState(REJECTED_STATE);
    });

    api.isActive = isActive;
    api.getAppInfo = getAppInfo;
    api.getState = getState;

    api.enable = enable;
    api.disable = disable;

    api.addRule = addRule;
    api.removeRule = removeRule;
    api.findRule = findRule;
    api.checkTabWhiteListRule = checkTabWhiteListRule;

    api.onStateChanged = onStateChangedChannel;
    api.onAuthPending = onAuthPendingChannel;
    api.states = STATES;

    return api;

})(adguard, adguard.integration || {});
