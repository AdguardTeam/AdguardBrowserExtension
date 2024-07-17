(function(source, args) {
    function setPopadsDummy(source) {
        delete window.PopAds;
        delete window.popns;
        Object.defineProperties(window, {
            PopAds: {
                get: function get() {
                    hit(source);
                    return {};
                }
            },
            popns: {
                get: function get() {
                    hit(source);
                    return {};
                }
            }
        });
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
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        setPopadsDummy.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "set-popads-dummy",
    args: []
}, []);