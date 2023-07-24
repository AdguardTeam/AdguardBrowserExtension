(function(source, args) {
    function noeval(source) {
        window.eval = function evalWrapper(s) {
            hit(source);
            logMessage(source, "AdGuard has prevented eval:\n".concat(s), true);
        }.bind();
    }
    function hit(source) {
        if (source.verbose !== true) {
            return;
        }
        try {
            var log = console.log.bind(console);
            var trace = console.trace.bind(console);
            var prefix = source.ruleText || "";
            if (source.domainName) {
                var AG_SCRIPTLET_MARKER = "#%#//";
                var UBO_SCRIPTLET_MARKER = "##+js";
                var ruleStartIndex;
                if (source.ruleText.includes(AG_SCRIPTLET_MARKER)) {
                    ruleStartIndex = source.ruleText.indexOf(AG_SCRIPTLET_MARKER);
                } else if (source.ruleText.includes(UBO_SCRIPTLET_MARKER)) {
                    ruleStartIndex = source.ruleText.indexOf(UBO_SCRIPTLET_MARKER);
                }
                var rulePart = source.ruleText.slice(ruleStartIndex);
                prefix = "".concat(source.domainName).concat(rulePart);
            }
            log("".concat(prefix, " trace start"));
            if (trace) {
                trace();
            }
            log("".concat(prefix, " trace end"));
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
    } catch (e) {
        console.log(e);
    }
})({
    name: "noeval",
    args: []
}, []);