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
            const log = console.log.bind(console);
            const trace = console.trace.bind(console);
            let prefix = source.ruleText || "";
            if (source.domainName) {
                const AG_SCRIPTLET_MARKER = "#%#//";
                const UBO_SCRIPTLET_MARKER = "##+js";
                let ruleStartIndex;
                if (source.ruleText.indexOf(AG_SCRIPTLET_MARKER) > -1) {
                    ruleStartIndex = source.ruleText.indexOf(AG_SCRIPTLET_MARKER);
                } else if (source.ruleText.indexOf(UBO_SCRIPTLET_MARKER) > -1) {
                    ruleStartIndex = source.ruleText.indexOf(UBO_SCRIPTLET_MARKER);
                }
                const rulePart = source.ruleText.slice(ruleStartIndex);
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
        let forced = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        let convertMessageToString = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
        const name = source.name, ruleText = source.ruleText, verbose = source.verbose;
        if (!forced && !verbose) {
            return;
        }
        const nativeConsole = console.log;
        if (!convertMessageToString) {
            nativeConsole("".concat(name, ":"), message);
            return;
        }
        let messageStr = "".concat(name, ": ").concat(message);
        if (ruleText) {
            const RULE_MARKER = "#%#//scriptlet";
            const markerIdx = ruleText.indexOf(RULE_MARKER);
            if (markerIdx > -1) {
                const ruleWithoutDomains = ruleText.slice(markerIdx, ruleText.length);
                messageStr += "; cannot apply rule: ".concat(ruleWithoutDomains);
            }
        }
        nativeConsole(messageStr);
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