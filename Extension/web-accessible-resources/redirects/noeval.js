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
            logMessage(source, "AdGuard has prevented eval:\n".concat(s), true);
        }.bind();
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
    function logMessage(source, message) {
        var forced = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var convertMessageToString = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
        var name = source.name, verbose = source.verbose;
        if (!forced && !verbose) {
            return;
        }
        var nativeConsole = console.log;
        if (!convertMessageToString) {
            nativeConsole("".concat(name, ":"), message);
            return;
        }
        nativeConsole("".concat(name, ": ").concat(message));
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