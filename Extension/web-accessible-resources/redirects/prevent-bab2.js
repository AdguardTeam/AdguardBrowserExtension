(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
    function preventBab2(source) {
        var script = document.currentScript;
        if (script === null) {
            return;
        }
        var url = script.src;
        if (typeof url !== "string") {
            return;
        }
        var domainsStr = [ "adclixx\\.net", "adnetasia\\.com", "adtrackers\\.net", "bannertrack\\.net" ].join("|");
        var matchStr = `^https?://[\\w-]+\\.(${domainsStr})/.`;
        var domainsRegex = new RegExp(matchStr);
        if (domainsRegex.test(url) === false) {
            return;
        }
        window.nH7eXzOsG = 858;
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
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        preventBab2.apply(this, updatedArgs);
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
    name: "prevent-bab2",
    args: []
}, []);