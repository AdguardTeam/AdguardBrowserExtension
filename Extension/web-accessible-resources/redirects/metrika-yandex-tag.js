(function(source, args) {
    function metrikaYandexTag(source) {
        const asyncCallbackFromOptions = function asyncCallbackFromOptions(id, param) {
            let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
            let callback = options.callback;
            const ctx = options.ctx;
            if (typeof callback === "function") {
                callback = ctx !== undefined ? callback.bind(ctx) : callback;
                setTimeout((function() {
                    return callback();
                }));
            }
        };
        const addFileExtension = noopFunc;
        const extLink = asyncCallbackFromOptions;
        const file = asyncCallbackFromOptions;
        const getClientID = function getClientID(id, cb) {
            if (!cb) {
                return;
            }
            setTimeout(cb(null));
        };
        const hitFunc = asyncCallbackFromOptions;
        const notBounce = asyncCallbackFromOptions;
        const params = noopFunc;
        const reachGoal = function reachGoal(id, target, params, callback, ctx) {
            asyncCallbackFromOptions(null, null, {
                callback: callback,
                ctx: ctx
            });
        };
        const setUserID = noopFunc;
        const userParams = noopFunc;
        const destruct = noopFunc;
        const api = {
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
        function ym(id, funcName) {
            for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                args[_key - 2] = arguments[_key];
            }
            return api[funcName] && api[funcName](id, ...args);
        }
        function init(id) {
            window["yaCounter".concat(id)] = api;
            document.dispatchEvent(new Event("yacounter".concat(id, "inited")));
        }
        if (typeof window.ym === "undefined") {
            window.ym = ym;
            ym.a = [];
        } else if (window.ym && window.ym.a) {
            ym.a = window.ym.a;
            window.ym = ym;
            window.ym.a.forEach((function(params) {
                const id = params[0];
                init(id);
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
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        metrikaYandexTag.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "metrika-yandex-tag",
    args: []
}, []);