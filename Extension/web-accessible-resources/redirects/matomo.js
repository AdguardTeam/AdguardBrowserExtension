(function(source, args) {
    function Matomo(source) {
        var Tracker = function Tracker() {};
        Tracker.prototype.setDoNotTrack = noopFunc;
        Tracker.prototype.setDomains = noopFunc;
        Tracker.prototype.setCustomDimension = noopFunc;
        Tracker.prototype.trackPageView = noopFunc;
        var AsyncTracker = function AsyncTracker() {};
        AsyncTracker.prototype.addListener = noopFunc;
        var matomoWrapper = {
            getTracker: function getTracker() {
                return new Tracker;
            },
            getAsyncTracker: function getAsyncTracker() {
                return new AsyncTracker;
            }
        };
        window.Piwik = matomoWrapper;
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
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        Matomo.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "matomo",
    args: []
}, []);