(function(source, args) {
    function GoogleAnalytics(source) {
        var Tracker = function Tracker() {};
        var proto = Tracker.prototype;
        proto.get = noopFunc;
        proto.set = noopFunc;
        proto.send = noopFunc;
        var googleAnalyticsName = window.GoogleAnalyticsObject || "ga";
        function ga(a) {
            var len = arguments.length;
            if (len === 0) {
                return;
            }
            var lastArg = arguments[len - 1];
            var replacer;
            if (lastArg instanceof Object && lastArg !== null && typeof lastArg.hitCallback === "function") {
                replacer = lastArg.hitCallback;
            } else if (typeof lastArg === "function") {
                replacer = function replacer() {
                    lastArg(ga.create());
                };
            }
            try {
                setTimeout(replacer, 1);
            } catch (ex) {}
        }
        ga.create = function() {
            return new Tracker;
        };
        ga.getByName = function() {
            return new Tracker;
        };
        ga.getAll = function() {
            return [ new Tracker ];
        };
        ga.remove = noopFunc;
        ga.loaded = true;
        window[googleAnalyticsName] = ga;
        var _window = window, dataLayer = _window.dataLayer, google_optimize = _window.google_optimize;
        if (dataLayer instanceof Object === false) {
            return;
        }
        if (dataLayer.hide instanceof Object && typeof dataLayer.hide.end === "function") {
            dataLayer.hide.end();
        }
        var handleCallback = function handleCallback(dataObj, funcName) {
            if (dataObj && typeof dataObj[funcName] === "function") {
                setTimeout(dataObj[funcName]);
            }
        };
        if (typeof dataLayer.push === "function") {
            dataLayer.push = function(data) {
                if (data instanceof Object) {
                    handleCallback(data, "eventCallback");
                    for (var key in data) {
                        handleCallback(data[key], "event_callback");
                    }
                    if (!data.hasOwnProperty("eventCallback") && !data.hasOwnProperty("eventCallback")) {
                        [].push.call(window.dataLayer, data);
                    }
                }
                if (Array.isArray(data)) {
                    data.forEach((function(arg) {
                        handleCallback(arg, "callback");
                    }));
                }
                return noopFunc;
            };
        }
        if (google_optimize instanceof Object && typeof google_optimize.get === "function") {
            var googleOptimizeWrapper = {
                get: noopFunc
            };
            window.google_optimize = googleOptimizeWrapper;
        }
        hit(source);
    }
    function hit(source, message) {
        if (source.verbose !== true) {
            return;
        }
        try {
            var log = console.log.bind(console);
            var trace = console.trace.bind(console);
            var prefix = source.ruleText || "";
            if (source.domainName) {
                var AG_SCRIPTLET_MARKER = "#%#//";
                var UBO_SCRIPTLET_MARKER = "##+js";
                var ruleStartIndex;
                if (source.ruleText.indexOf(AG_SCRIPTLET_MARKER) > -1) {
                    ruleStartIndex = source.ruleText.indexOf(AG_SCRIPTLET_MARKER);
                } else if (source.ruleText.indexOf(UBO_SCRIPTLET_MARKER) > -1) {
                    ruleStartIndex = source.ruleText.indexOf(UBO_SCRIPTLET_MARKER);
                }
                var rulePart = source.ruleText.slice(ruleStartIndex);
                prefix = "".concat(source.domainName).concat(rulePart);
            }
            var LOG_MARKER = "log: ";
            if (message) {
                if (message.indexOf(LOG_MARKER) === -1) {
                    log("".concat(prefix, " message:\n").concat(message));
                } else {
                    log(message.slice(LOG_MARKER.length));
                }
            }
            log("".concat(prefix, " trace start"));
            if (trace) {
                trace();
            }
            log("".concat(prefix, " trace end"));
        } catch (e) {}
        if (typeof window.__debug === "function") {
            window.__debug(source);
        }
    }
    function noopFunc() {}
    function noopNull() {
        return null;
    }
    function noopArray() {
        return [];
    }
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        GoogleAnalytics.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "google-analytics",
    args: []
}, []);