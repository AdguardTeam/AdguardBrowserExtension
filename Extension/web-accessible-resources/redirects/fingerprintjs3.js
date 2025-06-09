(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
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
    function noopStr() {
        return "";
    }
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        Fingerprintjs3.apply(this, updatedArgs);
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
    name: "fingerprintjs3",
    args: []
}, []);