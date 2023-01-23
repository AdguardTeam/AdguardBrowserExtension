(function(source, args) {
    function preventFab(source) {
        hit(source);
        const Fab = function Fab() {};
        Fab.prototype.check = noopFunc;
        Fab.prototype.clearEvent = noopFunc;
        Fab.prototype.emitEvent = noopFunc;
        Fab.prototype.on = function(a, b) {
            if (!a) {
                b();
            }
            return this;
        };
        Fab.prototype.onDetected = noopThis;
        Fab.prototype.onNotDetected = function(a) {
            a();
            return this;
        };
        Fab.prototype.setOption = noopFunc;
        Fab.prototype.options = {
            set: noopFunc,
            get: noopFunc
        };
        const fab = new Fab;
        const getSetFab = {
            get() {
                return Fab;
            },
            set() {}
        };
        const getsetfab = {
            get() {
                return fab;
            },
            set() {}
        };
        if (Object.prototype.hasOwnProperty.call(window, "FuckAdBlock")) {
            window.FuckAdBlock = Fab;
        } else {
            Object.defineProperty(window, "FuckAdBlock", getSetFab);
        }
        if (Object.prototype.hasOwnProperty.call(window, "BlockAdBlock")) {
            window.BlockAdBlock = Fab;
        } else {
            Object.defineProperty(window, "BlockAdBlock", getSetFab);
        }
        if (Object.prototype.hasOwnProperty.call(window, "SniffAdBlock")) {
            window.SniffAdBlock = Fab;
        } else {
            Object.defineProperty(window, "SniffAdBlock", getSetFab);
        }
        if (Object.prototype.hasOwnProperty.call(window, "fuckAdBlock")) {
            window.fuckAdBlock = fab;
        } else {
            Object.defineProperty(window, "fuckAdBlock", getsetfab);
        }
        if (Object.prototype.hasOwnProperty.call(window, "blockAdBlock")) {
            window.blockAdBlock = fab;
        } else {
            Object.defineProperty(window, "blockAdBlock", getsetfab);
        }
        if (Object.prototype.hasOwnProperty.call(window, "sniffAdBlock")) {
            window.sniffAdBlock = fab;
        } else {
            Object.defineProperty(window, "sniffAdBlock", getsetfab);
        }
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
    function noopFunc() {}
    function noopThis() {
        return this;
    }
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        preventFab.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "prevent-fab-3.2.0",
    args: []
}, []);