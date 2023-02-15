(function(source, args) {
    function metrikaYandexWatch(source) {
        const cbName = "yandex_metrika_callbacks";
        const asyncCallbackFromOptions = function asyncCallbackFromOptions() {
            let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
            let callback = options.callback;
            const ctx = options.ctx;
            if (typeof callback === "function") {
                callback = ctx !== undefined ? callback.bind(ctx) : callback;
                setTimeout((function() {
                    return callback();
                }));
            }
        };
        function Metrika() {}
        Metrika.counters = noopArray;
        Metrika.prototype.addFileExtension = noopFunc;
        Metrika.prototype.getClientID = noopFunc;
        Metrika.prototype.setUserID = noopFunc;
        Metrika.prototype.userParams = noopFunc;
        Metrika.prototype.params = noopFunc;
        Metrika.prototype.counters = noopArray;
        Metrika.prototype.extLink = function(url, options) {
            asyncCallbackFromOptions(options);
        };
        Metrika.prototype.file = function(url, options) {
            asyncCallbackFromOptions(options);
        };
        Metrika.prototype.hit = function(url, options) {
            asyncCallbackFromOptions(options);
        };
        Metrika.prototype.reachGoal = function(target, params, cb, ctx) {
            asyncCallbackFromOptions({
                callback: cb,
                ctx: ctx
            });
        };
        Metrika.prototype.notBounce = asyncCallbackFromOptions;
        if (window.Ya) {
            window.Ya.Metrika = Metrika;
        } else {
            window.Ya = {
                Metrika: Metrika
            };
        }
        if (window[cbName] && Array.isArray(window[cbName])) {
            window[cbName].forEach((function(func) {
                if (typeof func === "function") {
                    func();
                }
            }));
        }
        hit(source);
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
    function noopArray() {
        return [];
    }
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        metrikaYandexWatch.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "metrika-yandex-watch",
    args: []
}, []);