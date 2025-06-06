(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
    function metrikaYandexTag(source) {
        var asyncCallbackFromOptions = function asyncCallbackFromOptions(id, param) {
            var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
            var {callback: callback} = options;
            var {ctx: ctx} = options;
            if (typeof callback === "function") {
                callback = ctx !== undefined ? callback.bind(ctx) : callback;
                setTimeout((function() {
                    return callback();
                }));
            }
        };
        var addFileExtension = noopFunc;
        var extLink = asyncCallbackFromOptions;
        var file = asyncCallbackFromOptions;
        var getClientID = function getClientID(id, cb) {
            if (!cb) {
                return;
            }
            setTimeout(cb(null));
        };
        var hitFunc = asyncCallbackFromOptions;
        var notBounce = asyncCallbackFromOptions;
        var params = noopFunc;
        var reachGoal = function reachGoal(id, target, params, callback, ctx) {
            asyncCallbackFromOptions(null, null, {
                callback: callback,
                ctx: ctx
            });
        };
        var setUserID = noopFunc;
        var userParams = noopFunc;
        var destruct = noopFunc;
        var api = {
            addFileExtension: addFileExtension,
            extLink: extLink,
            file: file,
            getClientID: getClientID,
            hit: hitFunc,
            notBounce: notBounce,
            params: params,
            reachGoal: reachGoal,
            setUserID: setUserID,
            userParams: userParams,
            destruct: destruct
        };
        function init(id) {
            window[`yaCounter${id}`] = api;
            document.dispatchEvent(new Event(`yacounter${id}inited`));
        }
        function ym(id, funcName) {
            if (funcName === "init") {
                return init(id);
            }
            for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                args[_key - 2] = arguments[_key];
            }
            return api[funcName] && api[funcName](id, ...args);
        }
        if (typeof window.ym === "undefined") {
            window.ym = ym;
            ym.a = [];
        } else if (window.ym && window.ym.a) {
            ym.a = window.ym.a;
            window.ym = ym;
            window.ym.a.forEach((function(params) {
                var id = params[0];
                init(id);
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
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        metrikaYandexTag.apply(this, updatedArgs);
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
    name: "metrika-yandex-tag",
    args: []
}, []);