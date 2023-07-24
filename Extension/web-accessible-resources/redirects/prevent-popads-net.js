(function(source, args) {
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