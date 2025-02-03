(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
    function preventFab(source) {
        hit(source);
        var Fab = function Fab() {};
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
        var fab = new Fab;
        var getSetFab = {
            get() {
                return Fab;
            },
            set() {}
        };
        var getsetfab = {
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
        var ADGUARD_PREFIX = "[AdGuard]";
        if (!source.verbose) {
            return;
        }
        try {
            var trace = console.trace.bind(console);
            var label = `${ADGUARD_PREFIX} `;
            if (source.engine === "corelibs") {
                label += source.ruleText;
            } else {
                if (source.domainName) {
                    label += `${source.domainName}`;
                }
                if (source.args) {
                    label += `#%#//scriptlet('${source.name}', '${source.args.join("', '")}')`;
                } else {
                    label += `#%#//scriptlet('${source.name}')`;
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
    function noopFunc() {}
    function noopThis() {
        return this;
    }
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        preventFab.apply(this, updatedArgs);
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
    name: "prevent-fab-3.2.0",
    args: []
}, []);