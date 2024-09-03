(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
    function Matomo(source) {
        var Tracker = function Tracker() {};
        Tracker.prototype.setDoNotTrack = noopFunc;
        Tracker.prototype.setDomains = noopFunc;
        Tracker.prototype.setCustomDimension = noopFunc;
        Tracker.prototype.trackPageView = noopFunc;
        var AsyncTracker = function AsyncTracker() {};
        AsyncTracker.prototype.addListener = noopFunc;
        var matomoWrapper = {
            getTracker: Tracker,
            getAsyncTracker: AsyncTracker
        };
        window.Piwik = matomoWrapper;
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
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        Matomo.apply(this, updatedArgs);
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
    name: "matomo",
    args: []
}, []);