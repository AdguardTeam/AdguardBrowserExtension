var adguard = {};

adguard.tabsImpl = (function () {

    'use strict';

    function noOpFunc() {
        throw new Error('Not implemented');
    }

    return {

        onCreated: noOpFunc,
        onRemoved: noOpFunc,
        onUpdated: noOpFunc,
        onActivated: noOpFunc,

        create: noOpFunc,
        remove: noOpFunc,
        activate: noOpFunc,
        reload: noOpFunc,
        sendMessage: noOpFunc,
        getAll: noOpFunc
    };

})();

adguard.tabs = (function (tabsImpl) {

    'use strict';

    var AdguardTab = {
        tabId: 1,
        url: 'url',
        title: 'Title',
        active: false,
        incognito: false,
        status: null,   // 'loading' or 'complete'
        frames: null,   // Collection of frames inside tab
        metadata: null  // Contains info about integration, white list rule is applied to tab.
    };

    var AdguardTabFrame = {
        frameId: 1,
        url: 'url',
        domainName: 'domainName'
    };

    var tabs = Object.create(null);

    // --------- Events ---------

    var eventListeners = Object.create(null);

    function callEventListeners(eventName, arg) {
        var listeners = eventListeners[eventName];
        if (listeners) {
            for (var i = 0; i < listeners.length; i++) {
                listeners[i](arg);
            }
        }
    }

    function addEventListener(eventName, callback) {
        var listeners = eventListeners[eventName];
        if (listeners === undefined) {
            eventListeners[eventName] = listeners = [];
        }
        listeners.push(callback);
    }

    // Synchronize opened tabs
    tabsImpl.getAll(function (aTabs) {
        for (var i = 0; i < aTabs.length; i++) {
            var aTab = aTabs[i];
            tabs[aTab.tabId] = aTab;
        }
    });

    tabsImpl.onCreated(function (tab) {
        tabs[tab.tabId] = tab;
        callEventListeners('create', tab);
    });

    tabsImpl.onRemoved(function (tabId) {
        var tab = tabs[tabId];
        callEventListeners('remove', tab);
        delete tabs[tabId];
    });

    tabsImpl.onUpdated(function (tab) {
        var aTab = tabs[tab.tabId];
        if (aTab) {
            aTab.url = tab.url;
            aTab.title = tab.title;
            aTab.status = tab.status;
            callEventListeners('update', aTab);
        }
    });

    tabsImpl.onActivated(function (tabId) {
        var tab = tabs[tabId];
        callEventListeners('activate', tab);
    });

    // Fired when a tab is created. Note that the tab's URL may not be set at the time this event fired, but you can listen to onUpdated events to be notified when a URL is set.
    var onCreated = {
        addListener: function (callback) {
            addEventListener('create', callback);
        }
    };

    // Fired when a tab is closed.
    var onRemoved = {
        addListener: function (callback) {
            addEventListener('remove', callback);
        }
    };

    // Fired when a tab is updated.
    var onUpdated = {
        addListener: function (callback) {
            addEventListener('update', callback);
        }
    };

    // Fires when the active tab in a window changes.
    var onActivated = {
        addListener: function (callback) {
            addEventListener('activate', callback);
        }
    };

    // --------- Actions ---------

    // Creates a new tab.
    var create = function (details, callback) {
        tabsImpl.create(details, callback);
    };

    // Closes tab.
    var remove = function (tabId, callback) {
        tabsImpl.remove(tabId, callback);
    };

    // Activates tab (Also makes tab's window in focus).
    var activate = function (tabId, callback) {
        tabsImpl.activate(tabId, callback);
    };

    // Reloads tab.
    var reload = function (tabId, url) {
        tabsImpl.reload(tabId, url);
    };

    // Sends message to tab
    var sendMessage = function (tabId, message, responseCallback) {
        tabsImpl.sendMessage(tabId, message, responseCallback);
    };

    // Gets all opened tabs
    var getAll = function (callback) {
        tabsImpl.getAll(function (aTabs) {
            var result = [];
            for (var i = 0; i < aTabs.length; i++) {
                var aTab = aTabs[i];
                var tab = tabs[aTab.tabId];
                if (tab === undefined) {
                    // Synchronize state
                    tabs[aTab.tabId] = tab = aTab;
                }
                result.push(tab);
            }
            callback(result);
        });
    };

    // Records tab's frame
    var recordTabFrame = function (tabId, frameId, frameUrl, requestType) {
        //TODO: implement
    };

    // Gets tab's frame by id
    var getTabFrameUrl = function (tabId, frameId) {
        //TODO: implement
    };

    // Update tab metadata
    var updateTabMetadata = function (tabId, key, value) {
        var tab = tabs[tabId];
        if (tab) {
            if (tab.metadata === null) {
                tab.metadata = Object.create(null);
            }
            tab.metadata[key] = value;
        }
    };

    // Gets tab metadata
    var getTabMetadata = function (tabId, key) {
        var tab = tabs[tabId];
        if (tab && tab.metadata !== null) {
            return tab.metadata[key];
        }
        return null;
    };

    return {

        // Events
        onCreated: onCreated,
        onRemoved: onRemoved,
        onUpdated: onUpdated,
        onActivated: onActivated,

        // Actions
        create: create,
        remove: remove,
        activate: activate,
        reload: reload,
        sendMessage: sendMessage,
        getAll: getAll,

        // Frames
        recordTabFrame: recordTabFrame,
        getTabFrameUrl: getTabFrameUrl,
        
        // Other
        updateTabMetadata: updateTabMetadata,
        getTabMetadata: getTabMetadata
    };

})(adguard.tabsImpl);
