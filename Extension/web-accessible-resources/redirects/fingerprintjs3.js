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