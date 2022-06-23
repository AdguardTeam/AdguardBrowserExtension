(function(source, args) {
    function Prebid(source) {
        var pushFunction = function pushFunction(arg) {
            if (typeof arg === "function") {
                try {
                    arg.call();
                } catch (ex) {}
            }
        };
        var pbjsWrapper = {
            addAdUnits: function addAdUnits() {},
            adServers: {
                dfp: {
                    buildVideoUrl: noopStr
                }
            },
            adUnits: [],
            aliasBidder: function aliasBidder() {},
            cmd: [],
            enableAnalytics: function enableAnalytics() {},
            getHighestCpmBids: noopArray,
            libLoaded: true,
            que: [],
            requestBids: function requestBids(arg) {
                if (arg instanceof Object && arg.bidsBackHandler) {
                    try {
                        arg.bidsBackHandler.call();
                    } catch (ex) {}
                }
            },
            removeAdUnit: function removeAdUnit() {},
            setBidderConfig: function setBidderConfig() {},
            setConfig: function setConfig() {},
            setTargetingForGPTAsync: function setTargetingForGPTAsync() {}
        };
        pbjsWrapper.cmd.push = pushFunction;
        pbjsWrapper.que.push = pushFunction;
        window.pbjs = pbjsWrapper;
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
    function noopStr() {
        return "";
    }
    function noopArray() {
        return [];
    }
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        Prebid.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "prebid",
    args: []
}, []);