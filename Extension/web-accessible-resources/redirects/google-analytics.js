(function(source, args) {
    function GoogleAnalytics(source) {
        const Tracker = function Tracker() {};
        const proto = Tracker.prototype;
        proto.get = noopFunc;
        proto.set = noopFunc;
        proto.send = noopFunc;
        const googleAnalyticsName = window.GoogleAnalyticsObject || "ga";
        function ga(a) {
            const len = arguments.length;
            if (len === 0) {
                return;
            }
            const lastArg = arguments[len - 1];
            let replacer;
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
        const _window = window, dataLayer = _window.dataLayer, google_optimize = _window.google_optimize;
        if (dataLayer instanceof Object === false) {
            return;
        }
        if (dataLayer.hide instanceof Object && typeof dataLayer.hide.end === "function") {
            dataLayer.hide.end();
        }
        const handleCallback = function handleCallback(dataObj, funcName) {
            if (dataObj && typeof dataObj[funcName] === "function") {
                setTimeout(dataObj[funcName]);
            }
        };
        if (typeof dataLayer.push === "function") {
            dataLayer.push = function(data) {
                if (data instanceof Object) {
                    handleCallback(data, "eventCallback");
                    for (const key in data) {
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
            const googleOptimizeWrapper = {
                get: noopFunc
            };
            window.google_optimize = googleOptimizeWrapper;
        }
        hit(source);
    }
    function hit(source) {
        if (source.verbose !== true) {
            return;
        }
        try {
            const log = console.log.bind(console);
            const trace = console.trace.bind(console);
            let prefix = source.ruleText || "";
            if (source.domainName) {
                const AG_SCRIPTLET_MARKER = "#%#//";
                const UBO_SCRIPTLET_MARKER = "##+js";
                let ruleStartIndex;
                if (source.ruleText.indexOf(AG_SCRIPTLET_MARKER) > -1) {
                    ruleStartIndex = source.ruleText.indexOf(AG_SCRIPTLET_MARKER);
                } else if (source.ruleText.indexOf(UBO_SCRIPTLET_MARKER) > -1) {
                    ruleStartIndex = source.ruleText.indexOf(UBO_SCRIPTLET_MARKER);
                }
                const rulePart = source.ruleText.slice(ruleStartIndex);
                prefix = "".concat(source.domainName).concat(rulePart);
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