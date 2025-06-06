(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
    function Fingerprintjs2(source) {
        var browserId = "";
        for (var i = 0; i < 8; i += 1) {
            browserId += (Math.random() * 65536 + 4096).toString(16).slice(-4);
        }
        var Fingerprint2 = function Fingerprint2() {};
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
        Fingerprintjs2.apply(this, updatedArgs);
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
    name: "fingerprintjs2",
    args: []
}, []);