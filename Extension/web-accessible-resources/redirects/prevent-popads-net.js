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
    function createOnErrorHandler(rid) {
        var nativeOnError = window.onerror;
        return function onError(error) {
            if (typeof error === "string" && error.includes(rid)) {
                return true;
            }
            if (nativeOnError instanceof Function) {
                for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    args[_key - 1] = arguments[_key];
                }
                return nativeOnError.apply(window, [ error, ...args ]);
            }
            return false;
        };
    }
    function randomId() {
        return Math.random().toString(36).slice(2, 9);
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