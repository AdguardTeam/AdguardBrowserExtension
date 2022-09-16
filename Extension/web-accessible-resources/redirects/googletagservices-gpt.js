(function(source, args) {
    function GoogleTagServicesGpt(source) {
        var slots = new Map;
        var slotsById = new Map;
        var eventCallbacks = new Map;
        var addEventListener = function addEventListener(name, listener) {
            if (!eventCallbacks.has(name)) {
                eventCallbacks.set(name, new Set);
            }
            eventCallbacks.get(name).add(listener);
            return this;
        };
        var removeEventListener = function removeEventListener(name, listener) {
            if (eventCallbacks.has(name)) {
                return eventCallbacks.get(name).delete(listener);
            }
            return false;
        };
        var fireSlotEvent = function fireSlotEvent(name, slot) {
            return new Promise((function(resolve) {
                requestAnimationFrame((function() {
                    var size = [ 0, 0 ];
                    var callbacksSet = eventCallbacks.get(name) || [];
                    var callbackArray = Array.from(callbacksSet);
                    for (var i = 0; i < callbackArray.length; i += 1) {
                        callbackArray[i]({
                            isEmpty: true,
                            size: size,
                            slot: slot
                        });
                    }
                    resolve();
                }));
            }));
        };
        var displaySlot = function displaySlot(slot) {
            if (!slot) {
                return;
            }
            var id = slot.getSlotElementId();
            if (!document.getElementById(id)) {
                return;
            }
            var parent = document.getElementById(id);
            if (parent) {
                parent.appendChild(document.createElement("div"));
            }
            fireSlotEvent("slotRenderEnded", slot);
            fireSlotEvent("slotRequested", slot);
            fireSlotEvent("slotResponseReceived", slot);
            fireSlotEvent("slotOnload", slot);
            fireSlotEvent("impressionViewable", slot);
        };
        var companionAdsService = {
            addEventListener: addEventListener,
            removeEventListener: removeEventListener,
            enableSyncLoading: noopFunc,
            setRefreshUnfilledSlots: noopFunc,
            getSlots: noopArray
        };
        var contentService = {
            addEventListener: addEventListener,
            removeEventListener: removeEventListener,
            setContent: noopFunc
        };
        function PassbackSlot() {}
        PassbackSlot.prototype.display = noopFunc;
        PassbackSlot.prototype.get = noopNull;
        PassbackSlot.prototype.set = noopThis;
        PassbackSlot.prototype.setClickUrl = noopThis;
        PassbackSlot.prototype.setTagForChildDirectedTreatment = noopThis;
        PassbackSlot.prototype.setTargeting = noopThis;
        PassbackSlot.prototype.updateTargetingFromMap = noopThis;
        function SizeMappingBuilder() {}
        SizeMappingBuilder.prototype.addSize = noopThis;
        SizeMappingBuilder.prototype.build = noopNull;
        function Slot(adUnitPath, creatives, optDiv) {
            this.adUnitPath = adUnitPath;
            this.creatives = creatives;
            this.optDiv = optDiv;
            if (slotsById.has(optDiv)) {
                var _document$getElementB;
                (_document$getElementB = document.getElementById(optDiv)) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.remove();
                return slotsById.get(optDiv);
            }
            slotsById.set(optDiv, this);
        }
        Slot.prototype.addService = noopThis;
        Slot.prototype.clearCategoryExclusions = noopThis;
        Slot.prototype.clearTargeting = noopThis;
        Slot.prototype.defineSizeMapping = noopThis;
        Slot.prototype.get = noopNull;
        Slot.prototype.getAdUnitPath = function() {
            return this.adUnitPath;
        };
        Slot.prototype.getAttributeKeys = noopArray;
        Slot.prototype.getCategoryExclusions = noopArray;
        Slot.prototype.getDomId = function() {
            return this.optDiv;
        };
        Slot.prototype.getSlotElementId = function() {
            return this.optDiv;
        };
        Slot.prototype.getSlotId = noopThis;
        Slot.prototype.getSizes = noopArray;
        Slot.prototype.getTargeting = noopArray;
        Slot.prototype.getTargetingKeys = noopArray;
        Slot.prototype.set = noopThis;
        Slot.prototype.setCategoryExclusion = noopThis;
        Slot.prototype.setClickUrl = noopThis;
        Slot.prototype.setCollapseEmptyDiv = noopThis;
        Slot.prototype.setTargeting = noopThis;
        var pubAdsService = {
            addEventListener: addEventListener,
            removeEventListener: removeEventListener,
            clear: noopFunc,
            clearCategoryExclusions: noopThis,
            clearTagForChildDirectedTreatment: noopThis,
            clearTargeting: noopThis,
            collapseEmptyDivs: noopFunc,
            defineOutOfPagePassback: function defineOutOfPagePassback() {
                return new PassbackSlot;
            },
            definePassback: function definePassback() {
                return new PassbackSlot;
            },
            disableInitialLoad: noopFunc,
            display: noopFunc,
            enableAsyncRendering: noopFunc,
            enableLazyLoad: noopFunc,
            enableSingleRequest: noopFunc,
            enableSyncRendering: noopFunc,
            enableVideoAds: noopFunc,
            get: noopNull,
            getAttributeKeys: noopArray,
            getTargeting: noopArray,
            getTargetingKeys: noopArray,
            getSlots: noopArray,
            isInitialLoadDisabled: trueFunc,
            refresh: noopFunc,
            set: noopThis,
            setCategoryExclusion: noopThis,
            setCentering: noopFunc,
            setCookieOptions: noopThis,
            setForceSafeFrame: noopThis,
            setLocation: noopThis,
            setPublisherProvidedId: noopThis,
            setRequestNonPersonalizedAds: noopThis,
            setSafeFrameConfig: noopThis,
            setTagForChildDirectedTreatment: noopThis,
            setTargeting: noopThis,
            setVideoContent: noopThis,
            updateCorrelator: noopFunc
        };
        var getNewSlot = function getNewSlot(adUnitPath, creatives, optDiv) {
            return new Slot(adUnitPath, creatives, optDiv);
        };
        var _window = window, _window$googletag = _window.googletag, googletag = _window$googletag === void 0 ? {} : _window$googletag;
        var _googletag$cmd = googletag.cmd, cmd = _googletag$cmd === void 0 ? [] : _googletag$cmd;
        googletag.apiReady = true;
        googletag.cmd = [];
        googletag.cmd.push = function(a) {
            try {
                a();
            } catch (ex) {}
            return 1;
        };
        googletag.companionAds = function() {
            return companionAdsService;
        };
        googletag.content = function() {
            return contentService;
        };
        googletag.defineOutOfPageSlot = getNewSlot;
        googletag.defineSlot = getNewSlot;
        googletag.destroySlots = function() {
            slots.clear();
            slotsById.clear();
        };
        googletag.disablePublisherConsole = noopFunc;
        googletag.display = function(arg) {
            var id;
            if (arg !== null && arg !== void 0 && arg.getSlotElementId) {
                id = arg.getSlotElementId();
            } else if (arg !== null && arg !== void 0 && arg.nodeType) {
                id = arg.id;
            } else {
                id = String(arg);
            }
            displaySlot(slotsById.get(id));
        };
        googletag.enableServices = noopFunc;
        googletag.getVersion = noopStr;
        googletag.pubads = function() {
            return pubAdsService;
        };
        googletag.pubadsReady = true;
        googletag.setAdIframeTitle = noopFunc;
        googletag.sizeMapping = function() {
            return new SizeMappingBuilder;
        };
        window.googletag = googletag;
        while (cmd.length !== 0) {
            googletag.cmd.push(cmd.shift());
        }
        hit(source);
    }
    function hit(source, message) {
        if (source.verbose !== true) {
            return;
        }
        try {
            var log = console.log.bind(console);
            var trace = console.trace.bind(console);
            var prefix = source.ruleText || "";
            if (source.domainName) {
                var AG_SCRIPTLET_MARKER = "#%#//";
                var UBO_SCRIPTLET_MARKER = "##+js";
                var ruleStartIndex;
                if (source.ruleText.indexOf(AG_SCRIPTLET_MARKER) > -1) {
                    ruleStartIndex = source.ruleText.indexOf(AG_SCRIPTLET_MARKER);
                } else if (source.ruleText.indexOf(UBO_SCRIPTLET_MARKER) > -1) {
                    ruleStartIndex = source.ruleText.indexOf(UBO_SCRIPTLET_MARKER);
                }
                var rulePart = source.ruleText.slice(ruleStartIndex);
                prefix = "".concat(source.domainName).concat(rulePart);
            }
            var LOG_MARKER = "log: ";
            if (message) {
                if (message.indexOf(LOG_MARKER) === -1) {
                    log("".concat(prefix, " message:\n").concat(message));
                } else {
                    log(message.slice(LOG_MARKER.length));
                }
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
    function noopNull() {
        return null;
    }
    function noopArray() {
        return [];
    }
    function noopStr() {
        return "";
    }
    function trueFunc() {
        return true;
    }
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        GoogleTagServicesGpt.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "googletagservices-gpt",
    args: []
}, []);