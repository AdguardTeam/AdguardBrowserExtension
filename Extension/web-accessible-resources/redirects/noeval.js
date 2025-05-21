(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
    function noeval(source) {
        window.eval = function evalWrapper(s) {
            hit(source);
            logMessage(source, `AdGuard has prevented eval:\n${s}`, true);
        }.bind();
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
    function logMessage(e, o) {
        var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2], g = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3], {name: l, verbose: v} = e;
        if (n || v) {
            var a = console.log;
            g ? a(`${l}: ${o}`) : a(`${l}:`, o);
        }
    }
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        noeval.apply(this, updatedArgs);
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
    name: "noeval",
    args: []
}, []);