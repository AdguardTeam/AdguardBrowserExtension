(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
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
            var label = `${ADGUARD_PREFIX} `;
            if (source.engine === "corelibs") {
                label += source.ruleText;
            } else {
                if (source.domainName) {
                    label += `${source.domainName}`;
                }
                if (source.args) {
                    label += `#%#//scriptlet('${source.name}', '${source.args.join("', '")}')`;
                } else {
                    label += `#%#//scriptlet('${source.name}')`;
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
    name: "set-popads-dummy",
    args: []
}, []);