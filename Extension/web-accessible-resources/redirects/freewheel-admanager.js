(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
    function FreewheelAdManager(source) {
        var eventsMap = new Map;
        var adManagerFunc = noopFunc;
        adManagerFunc.prototype.addEventListener = function(type, callback) {
            if (type) {
                eventsMap.set(type, callback);
            }
        };
        adManagerFunc.prototype.addKeyValue = noopFunc;
        adManagerFunc.prototype.addTemporalSlot = noopFunc;
        adManagerFunc.prototype.dispose = noopFunc;
        adManagerFunc.prototype.newContext = noopThis;
        adManagerFunc.prototype.registerCustomPlayer = noopFunc;
        adManagerFunc.prototype.registerVideoDisplayBase = noopFunc;
        adManagerFunc.prototype.removeEventListener = noopFunc;
        adManagerFunc.prototype.resize = noopFunc;
        adManagerFunc.prototype.setCapability = noopFunc;
        adManagerFunc.prototype.setContentVideoElement = noopFunc;
        adManagerFunc.prototype.setLogLevel = noopFunc;
        adManagerFunc.prototype.setNetwork = noopFunc;
        adManagerFunc.prototype.setParameter = noopFunc;
        adManagerFunc.prototype.setProfile = noopFunc;
        adManagerFunc.prototype.setServer = noopFunc;
        adManagerFunc.prototype.setSiteSection = noopFunc;
        adManagerFunc.prototype.setVideoAsset = noopFunc;
        adManagerFunc.prototype.setVideoDisplaySize = noopFunc;
        adManagerFunc.prototype.submitRequest = function() {
            var event = {
                type: window.tv.freewheel.SDK.EVENT_SLOT_ENDED
            };
            var callbackFunc = eventsMap.get("EVENT_SLOT_ENDED");
            if (callbackFunc && typeof callbackFunc === "function") {
                setTimeout((function() {
                    try {
                        callbackFunc(event);
                    } catch (ex) {}
                }), 1);
            }
        };
        window.tv = {
            freewheel: {
                SDK: {
                    _instanceQueue: {},
                    Ad: noopFunc,
                    AdListener: noopFunc,
                    AdManager: adManagerFunc,
                    EVENT_SLOT_ENDED: "EVENT_SLOT_ENDED",
                    setLogLevel: noopFunc
                }
            }
        };
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
    function noopThis() {
        return this;
    }
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        FreewheelAdManager.apply(this, updatedArgs);
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
    name: "freewheel-admanager",
    args: []
}, []);