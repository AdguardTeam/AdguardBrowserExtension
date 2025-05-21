(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
    function ATInternetSmartTag(source) {
        var setNoopFuncWrapper = {
            set: noopFunc
        };
        var sendNoopFuncWrapper = {
            send: noopFunc
        };
        var ecommerceWrapper = {
            displayCart: {
                products: setNoopFuncWrapper,
                cart: setNoopFuncWrapper
            },
            updateCart: {
                cart: setNoopFuncWrapper
            },
            displayProduct: {
                products: setNoopFuncWrapper
            },
            displayPageProduct: {
                products: setNoopFuncWrapper
            },
            addProduct: {
                products: setNoopFuncWrapper
            },
            removeProduct: {
                products: setNoopFuncWrapper
            }
        };
        var tag = function tag() {};
        tag.prototype = {
            setConfig: noopFunc,
            setParam: noopFunc,
            dispatch: noopFunc,
            customVars: setNoopFuncWrapper,
            publisher: setNoopFuncWrapper,
            order: setNoopFuncWrapper,
            click: sendNoopFuncWrapper,
            clickListener: sendNoopFuncWrapper,
            internalSearch: {
                set: noopFunc,
                send: noopFunc
            },
            ecommerce: ecommerceWrapper,
            identifiedVisitor: {
                unset: noopFunc
            },
            page: {
                set: noopFunc,
                send: noopFunc
            },
            selfPromotion: {
                add: noopFunc,
                send: noopFunc
            },
            privacy: {
                setVisitorMode: noopFunc,
                getVisitorMode: noopFunc,
                hit: noopFunc
            },
            richMedia: {
                add: noopFunc,
                send: noopFunc,
                remove: noopFunc,
                removeAll: noopFunc
            }
        };
        var smartTagWrapper = {
            Tracker: {
                Tag: tag
            }
        };
        window.ATInternet = smartTagWrapper;
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
        ATInternetSmartTag.apply(this, updatedArgs);
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
    name: "ati-smarttag",
    args: []
}, []);