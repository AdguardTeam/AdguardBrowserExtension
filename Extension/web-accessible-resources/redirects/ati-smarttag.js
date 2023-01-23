(function(source, args) {
    function ATInternetSmartTag(source) {
        const setNoopFuncWrapper = {
            set: noopFunc
        };
        const sendNoopFuncWrapper = {
            send: noopFunc
        };
        const ecommerceWrapper = {
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
        const tag = function tag() {};
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
        const smartTagWrapper = {
            Tracker: {
                Tag: tag
            }
        };
        window.ATInternet = smartTagWrapper;
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
        ATInternetSmartTag.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "ati-smarttag",
    args: []
}, []);