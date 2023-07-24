(function(source, args) {
    function Fingerprintjs3(source) {
        var visitorId = function() {
            var id = "";
            for (var i = 0; i < 8; i += 1) {
                id += (Math.random() * 65536 + 4096).toString(16).slice(-4);
            }
            return id;
        }();
        var FingerprintJS = function FingerprintJS() {};
        FingerprintJS.prototype = {
            load() {
                return Promise.resolve(new FingerprintJS);
            },
            get() {
                return Promise.resolve({
                    visitorId: visitorId
                });
            },
            hashComponents: noopStr
        };
        window.FingerprintJS = new FingerprintJS;
        hit(source);
    }
    function hit(source) {
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
                if (source.ruleText.includes(AG_SCRIPTLET_MARKER)) {
                    ruleStartIndex = source.ruleText.indexOf(AG_SCRIPTLET_MARKER);
                } else if (source.ruleText.includes(UBO_SCRIPTLET_MARKER)) {
                    ruleStartIndex = source.ruleText.indexOf(UBO_SCRIPTLET_MARKER);
                }
                var rulePart = source.ruleText.slice(ruleStartIndex);
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
    function noopStr() {
        return "";
    }
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        Fingerprintjs3.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "fingerprintjs3",
    args: []
}, []);