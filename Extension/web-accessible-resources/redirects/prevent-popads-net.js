(function(source, args) {
    function preventPopadsNet(source) {
        const rid = randomId();
        const throwError = function throwError() {
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
        const nativeOnError = window.onerror;
        return function onError(error) {
            if (typeof error === "string" && error.indexOf(rid) !== -1) {
                return true;
            }
            if (nativeOnError instanceof Function) {
                for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    args[_key - 1] = arguments[_key];
                }
                return nativeOnError.apply(this, [ error, ...args ]);
            }
            return false;
        };
    }
    function randomId() {
        return Math.random().toString(36).slice(2, 9);
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
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        preventPopadsNet.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "prevent-popads-net",
    args: []
}, []);