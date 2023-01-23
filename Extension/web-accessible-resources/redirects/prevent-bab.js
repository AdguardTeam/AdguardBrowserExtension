(function(source, args) {
    function preventBab$1(source) {
        const nativeSetTimeout = window.setTimeout;
        const babRegex = /\.bab_elementid.$/;
        const timeoutWrapper = function timeoutWrapper(callback) {
            if (typeof callback !== "string" || !babRegex.test(callback)) {
                for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    args[_key - 1] = arguments[_key];
                }
                return nativeSetTimeout.apply(window, [ callback, ...args ]);
            }
            hit(source);
        };
        window.setTimeout = timeoutWrapper;
        const signatures = [ [ "blockadblock" ], [ "babasbm" ], [ /getItem\('babn'\)/ ], [ "getElementById", "String.fromCharCode", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", "charAt", "DOMContentLoaded", "AdBlock", "addEventListener", "doScroll", "fromCharCode", "<<2|r>>4", "sessionStorage", "clientWidth", "localStorage", "Math", "random" ] ];
        const check = function check(str) {
            if (typeof str !== "string") {
                return false;
            }
            for (let i = 0; i < signatures.length; i += 1) {
                const tokens = signatures[i];
                let match = 0;
                for (let j = 0; j < tokens.length; j += 1) {
                    const token = tokens[j];
                    const found = token instanceof RegExp ? token.test(str) : str.indexOf(token) > -1;
                    if (found) {
                        match += 1;
                    }
                }
                if (match / tokens.length >= .8) {
                    return true;
                }
            }
            return false;
        };
        const nativeEval = window.eval;
        const evalWrapper = function evalWrapper(str) {
            if (!check(str)) {
                return nativeEval(str);
            }
            hit(source);
            const bodyEl = document.body;
            if (bodyEl) {
                bodyEl.style.removeProperty("visibility");
            }
            const el = document.getElementById("babasbmsgx");
            if (el) {
                el.parentNode.removeChild(el);
            }
        };
        window.eval = evalWrapper.bind(window);
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
        preventBab$1.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "prevent-bab",
    args: []
}, []);