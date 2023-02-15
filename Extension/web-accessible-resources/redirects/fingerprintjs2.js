(function(source, args) {
    function Fingerprintjs2(source) {
        let browserId = "";
        for (let i = 0; i < 8; i += 1) {
            browserId += (Math.random() * 65536 + 4096).toString(16).slice(-4);
        }
        const Fingerprint2 = function Fingerprint2() {};
        Fingerprint2.get = function(options, callback) {
            if (!callback) {
                callback = options;
            }
            setTimeout((function() {
                if (callback) {
                    callback(browserId, []);
                }
            }), 1);
        };
        Fingerprint2.prototype = {
            get: Fingerprint2.get
        };
        window.Fingerprint2 = Fingerprint2;
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
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        Fingerprintjs2.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "fingerprintjs2",
    args: []
}, []);