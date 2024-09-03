(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
    function Prebid(source) {
        var pushFunction = function pushFunction(arg) {
            if (typeof arg === "function") {
                try {
                    arg.call();
                } catch (ex) {}
            }
        };
        var pbjsWrapper = {
            addAdUnits() {},
            adServers: {
                dfp: {
                    buildVideoUrl: noopStr
                }
            },
            adUnits: [],
            aliasBidder() {},
            cmd: [],
            enableAnalytics() {},
            getHighestCpmBids: noopArray,
            libLoaded: true,
            que: [],
            requestBids(arg) {
                if (arg instanceof Object && arg.bidsBackHandler) {
                    try {
                        arg.bidsBackHandler.call();
                    } catch (ex) {}
                }
            },
            removeAdUnit() {},
            setBidderConfig() {},
            setConfig() {},
            setTargetingForGPTAsync() {}
        };
        pbjsWrapper.cmd.push = pushFunction;
        pbjsWrapper.que.push = pushFunction;
        window.pbjs = pbjsWrapper;
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
    function noopStr() {
        return "";
    }
    function noopArray() {
        return [];
    }
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        Prebid.apply(this, updatedArgs);
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
    name: "prebid",
    args: []
}, []);