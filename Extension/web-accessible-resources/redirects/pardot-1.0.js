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