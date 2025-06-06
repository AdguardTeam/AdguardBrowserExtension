(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
    function metrikaYandexWatch(source) {
        var cbName = "yandex_metrika_callbacks";
        var asyncCallbackFromOptions = function asyncCallbackFromOptions() {
            var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
            var {callback: callback} = options;
            var {ctx: ctx} = options;
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
    function hit(e) {
        if (e.verbose) {
            try {
                var n = console.trace.bind(console), i = "[AdGuard] ";
                "corelibs" === e.engine ? i += e.ruleText : (e.domainName && (i += `${e.domainName}`), 
                e.args ? i += `#%#//scriptlet('${e.name}', '${e.args.join("', '")}')` : i += `#%#//scriptlet('${e.name}')`), 
                n && n(i);
            } catch (e) {}
            "function" == typeof window.__debug && window.__debug(e);
        }
    }
    function noopFunc() {}
    function noopArray() {
        return [];
    }
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        metrikaYandexWatch.apply(this, updatedArgs);
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
    name: "metrika-yandex-watch",
    args: []
}, []);