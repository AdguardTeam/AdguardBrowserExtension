(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
    function GoogleAnalytics(source) {
        var _window$googleAnalyti;
        var Tracker = function Tracker() {};
        var proto = Tracker.prototype;
        proto.get = noopFunc;
        proto.set = noopFunc;
        proto.send = noopFunc;
        var googleAnalyticsName = window.GoogleAnalyticsObject || "ga";
        var queue = (_window$googleAnalyti = window[googleAnalyticsName]) === null || _window$googleAnalyti === void 0 ? void 0 : _window$googleAnalyti.q;
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
        if (Array.isArray(queue)) {
            var push = function push(arg) {
                ga(...arg);
            };
            queue.push = push;
            queue.forEach(push);
        }
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
    function hit(source) {
        var ADGUARD_PREFIX = "[AdGuard]";
        if (!source.verbose) {
            return;
        }
        try {
            var trace = console.trace.bind(console);
            var label = "".concat(ADGUARD_PREFIX, " ");
            if (source.engine === "corelibs") {
                label += source.ruleText;
            } else {
                if (source.domainName) {
                    label += "".concat(source.domainName);
                }
                if (source.args) {
                    label += "#%#//scriptlet('".concat(source.name, "', '").concat(source.args.join("', '"), "')");
                } else {
                    label += "#%#//scriptlet('".concat(source.name, "')");
                }
            }
            if (trace) {
                trace(label);
            }
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
        if (source.uniqueId) {
            Object.defineProperty(Window.prototype.toString, uniqueIdentifier, {
                value: flag,
                enumerable: false,
                writable: false,
                configurable: false
            });
        }
    } catch (e) {
        console.log(e);
    }
})({
    name: "google-analytics",
    args: []
}, []);