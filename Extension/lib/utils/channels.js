/* eslint-disable prefer-rest-params */
/**
 * Simple publish-subscribe implementation
 */
export const channels = (() => {
    const EventChannels = (() => {
        const EventChannel = function () {
            let listeners = null;
            let listenerCallback = null;

            const addListener = function (callback) {
                if (typeof callback !== 'function') {
                    throw new Error('Illegal callback');
                }
                if (listeners !== null) {
                    listeners.push(callback);
                    return;
                }
                if (listenerCallback !== null) {
                    listeners = [];
                    listeners.push(listenerCallback);
                    listeners.push(callback);
                    listenerCallback = null;
                } else {
                    listenerCallback = callback;
                }
            };

            const removeListener = function (callback) {
                if (listenerCallback !== null) {
                    listenerCallback = null;
                } else {
                    const index = listeners.indexOf(callback);
                    if (index >= 0) {
                        listeners.splice(index, 1);
                    }
                }
            };

            const notify = function () {
                if (listenerCallback !== null) {
                    return listenerCallback.apply(listenerCallback, arguments);
                }
                if (listeners !== null) {
                    for (let i = 0; i < listeners.length; i += 1) {
                        const listener = listeners[i];
                        listener.apply(listener, arguments);
                    }
                }
            };

            const notifyInReverseOrder = function () {
                if (listenerCallback !== null) {
                    return listenerCallback.apply(listenerCallback, arguments);
                }
                if (listeners !== null) {
                    for (let i = listeners.length - 1; i >= 0; i -= 1) {
                        const listener = listeners[i];
                        listener.apply(listener, arguments);
                    }
                }
            };

            return {
                addListener,
                removeListener,
                notify,
                notifyInReverseOrder,
            };
        };

        const namedChannels = Object.create(null);

        const newChannel = function () {
            return new EventChannel();
        };

        const newNamedChannel = function (name) {
            const channel = newChannel();
            namedChannels[name] = channel;
            return channel;
        };

        const getNamedChannel = function (name) {
            return namedChannels[name];
        };

        return {
            newChannel,
            newNamedChannel,
            getNamedChannel,
        };
    })();

    return EventChannels;
})();
