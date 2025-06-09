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
    function hit(e) {
        if (e.verbose) {
            try {
                var n = console.trace.bind(console), i = "[AdGuard] ";
                "corelibs" === e.engine ? i += e.ruleText : (e.domainName && (i += `${e.domainName}`), 
                e.args ? i += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : i += `#%#//scriptlet('${e.name}')`), 
                n && n(i);
            } catch (e) {}
            "function" == typeof window.__debug && window.__debug(e);
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