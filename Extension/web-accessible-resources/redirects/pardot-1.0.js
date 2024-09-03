(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
    function Pardot(source) {
        window.piVersion = "1.0.2";
        window.piScriptNum = 0;
        window.piScriptObj = [];
        window.checkNamespace = noopFunc;
        window.getPardotUrl = noopStr;
        window.piGetParameter = noopNull;
        window.piSetCookie = noopFunc;
        window.piGetCookie = noopStr;
        function piTracker() {
            window.pi = {
                tracker: {
                    visitor_id: "",
                    visitor_id_sign: "",
                    pi_opt_in: "",
                    campaign_id: ""
                }
            };
            window.piScriptNum += 1;
        }
        window.piResponse = noopFunc;
        window.piTracker = piTracker;
        piTracker();
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
    function noopNull() {
        return null;
    }
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        Pardot.apply(this, updatedArgs);
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
    name: "pardot-1.0",
    args: []
}, []);