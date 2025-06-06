(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
    function preventPopadsNet(source) {
        var rid = randomId();
        var throwError = function throwError() {
            throw new ReferenceError(rid);
        };
        delete window.PopAds;
        delete window.popns;
        Object.defineProperties(window, {
            PopAds: {
                set: throwError
            },
            popns: {
                set: throwError
            }
        });
        window.onerror = createOnErrorHandler(rid).bind();
        hit(source);
    }
    function createOnErrorHandler(r) {
        var n = window.onerror;
        return function(e) {
            if ("string" == typeof e && e.includes(r)) return !0;
            if (n instanceof Function) {
                for (var t = arguments.length, o = new Array(t > 1 ? t - 1 : 0), i = 1; i < t; i++) o[i - 1] = arguments[i];
                return n.apply(window, [ e, ...o ]);
            }
            return !1;
        };
    }
    function randomId() {
        return Math.random().toString(36).slice(2, 9);
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
        preventPopadsNet.apply(this, updatedArgs);
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
    name: "prevent-popads-net",
    args: []
}, []);