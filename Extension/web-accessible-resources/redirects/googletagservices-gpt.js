(function(source, args) {
    function GoogleTagServicesGpt(source) {
        const slots = new Map;
        const slotsById = new Map;
        const slotsPerPath = new Map;
        const slotCreatives = new Map;
        const eventCallbacks = new Map;
        const gTargeting = new Map;
        const addEventListener = function addEventListener(name, listener) {
            if (!eventCallbacks.has(name)) {
                eventCallbacks.set(name, new Set);
            }
            eventCallbacks.get(name).add(listener);
            return this;
        };
        const removeEventListener = function removeEventListener(name, listener) {
            if (eventCallbacks.has(name)) {
                return eventCallbacks.get(name).delete(listener);
            }
            return false;
        };
        const fireSlotEvent = function fireSlotEvent(name, slot) {
            return new Promise((function(resolve) {
                requestAnimationFrame((function() {
                    const size = [ 0, 0 ];
                    const callbacksSet = eventCallbacks.get(name) || [];
                    const callbackArray = Array.from(callbacksSet);
                    for (let i = 0; i < callbackArray.length; i += 1) {
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
        const emptySlotElement = function emptySlotElement(slot) {
            const node = document.getElementById(slot.getSlotElementId());
            while (node !== null && node !== void 0 && node.lastChild) {
                node.lastChild.remove();
            }
        };
        const recreateIframeForSlot = function recreateIframeForSlot(slot) {
            var _document$getElementB;
            const eid = "google_ads_iframe_".concat(slot.getId());
            (_document$getElementB = document.getElementById(eid)) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.remove();
            const node = document.getElementById(slot.getSlotElementId());
            if (node) {
                const f = document.createElement("iframe");
                f.id = eid;
                f.srcdoc = "<body></body>";
                f.style = "position:absolute; width:0; height:0; left:0; right:0; z-index:-1; border:0";
                f.setAttribute("width", 0);
                f.setAttribute("height", 0);
                f.setAttribute("data-load-complete", true);
                f.setAttribute("data-google-container-id", true);
                f.setAttribute("sandbox", true);
                node.appendChild(f);
            }
        };
        const displaySlot = function displaySlot(slot) {
            if (!slot) {
                return;
            }
            const id = slot.getSlotElementId();
            if (!document.getElementById(id)) {
                return;
            }
            const parent = document.getElementById(id);
            if (parent) {
                parent.appendChild(document.createElement("div"));
            }
            emptySlotElement(slot);
            recreateIframeForSlot(slot);
            fireSlotEvent("slotRenderEnded", slot);
            fireSlotEvent("slotRequested", slot);
            fireSlotEvent("slotResponseReceived", slot);
            fireSlotEvent("slotOnload", slot);
            fireSlotEvent("impressionViewable", slot);
        };
        const companionAdsService = {
            addEventListener: addEventListener,
            removeEventListener: removeEventListener,
            enableSyncLoading: noopFunc,
            setRefreshUnfilledSlots: noopFunc,
            getSlots: noopArray
        };
        const contentService = {
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
        const getTargetingValue = function getTargetingValue(v) {
            if (typeof v === "string") {
                return [ v ];
            }
            try {
                return [ Array.prototype.flat.call(v)[0] ];
            } catch (_unused) {}
            return [];
        };
        const updateTargeting = function updateTargeting(targeting, map) {
            if (typeof map === "object") {
                const entries = Object.entries(map || {});
                for (var _i = 0, _entries = entries; _i < _entries.length; _i++) {
                    const _entries$_i = slicedToArray(_entries[_i], 2), k = _entries$_i[0], v = _entries$_i[1];
                    targeting.set(k, getTargetingValue(v));
                }
            }
        };
        const defineSlot = function defineSlot(adUnitPath, creatives, optDiv) {
            if (slotsById.has(optDiv)) {
                var _document$getElementB2;
                (_document$getElementB2 = document.getElementById(optDiv)) === null || _document$getElementB2 === void 0 ? void 0 : _document$getElementB2.remove();
                return slotsById.get(optDiv);
            }
            const attributes = new Map;
            const targeting = new Map;
            const exclusions = new Set;
            const response = {
                advertiserId: undefined,
                campaignId: undefined,
                creativeId: undefined,
                creativeTemplateId: undefined,
                lineItemId: undefined
            };
            const sizes = [ {
                getHeight: function getHeight() {
                    return 2;
                },
                getWidth: function getWidth() {
                    return 2;
                }
            } ];
            const num = (slotsPerPath.get(adUnitPath) || 0) + 1;
            slotsPerPath.set(adUnitPath, num);
            const id = "".concat(adUnitPath, "_").concat(num);
            let clickUrl = "";
            let collapseEmptyDiv = null;
            const services = new Set;
            const slot = {
                addService(e) {
                    services.add(e);
                    return slot;
                },
                clearCategoryExclusions: noopThis,
                clearTargeting(k) {
                    if (k === undefined) {
                        targeting.clear();
                    } else {
                        targeting.delete(k);
                    }
                },
                defineSizeMapping(mapping) {
                    slotCreatives.set(optDiv, mapping);
                    return this;
                },
                get: function get(k) {
                    return attributes.get(k);
                },
                getAdUnitPath: function getAdUnitPath() {
                    return adUnitPath;
                },
                getAttributeKeys: function getAttributeKeys() {
                    return Array.from(attributes.keys());
                },
                getCategoryExclusions: function getCategoryExclusions() {
                    return Array.from(exclusions);
                },
                getClickUrl: function getClickUrl() {
                    return clickUrl;
                },
                getCollapseEmptyDiv: function getCollapseEmptyDiv() {
                    return collapseEmptyDiv;
                },
                getContentUrl: function getContentUrl() {
                    return "";
                },
                getDivStartsCollapsed: function getDivStartsCollapsed() {
                    return null;
                },
                getDomId: function getDomId() {
                    return optDiv;
                },
                getEscapedQemQueryId: function getEscapedQemQueryId() {
                    return "";
                },
                getFirstLook: function getFirstLook() {
                    return 0;
                },
                getId: function getId() {
                    return id;
                },
                getHtml: function getHtml() {
                    return "";
                },
                getName: function getName() {
                    return id;
                },
                getOutOfPage: function getOutOfPage() {
                    return false;
                },
                getResponseInformation: function getResponseInformation() {
                    return response;
                },
                getServices: function getServices() {
                    return Array.from(services);
                },
                getSizes: function getSizes() {
                    return sizes;
                },
                getSlotElementId: function getSlotElementId() {
                    return optDiv;
                },
                getSlotId: function getSlotId() {
                    return slot;
                },
                getTargeting: function getTargeting(k) {
                    return targeting.get(k) || gTargeting.get(k) || [];
                },
                getTargetingKeys: function getTargetingKeys() {
                    return Array.from(new Set(Array.of(...gTargeting.keys(), ...targeting.keys())));
                },
                getTargetingMap: function getTargetingMap() {
                    return Object.assign(Object.fromEntries(gTargeting.entries()), Object.fromEntries(targeting.entries()));
                },
                set(k, v) {
                    attributes.set(k, v);
                    return slot;
                },
                setCategoryExclusion(e) {
                    exclusions.add(e);
                    return slot;
                },
                setClickUrl(u) {
                    clickUrl = u;
                    return slot;
                },
                setCollapseEmptyDiv(v) {
                    collapseEmptyDiv = !!v;
                    return slot;
                },
                setSafeFrameConfig: noopThis,
                setTagForChildDirectedTreatment: noopThis,
                setTargeting(k, v) {
                    targeting.set(k, getTargetingValue(v));
                    return slot;
                },
                toString: function toString() {
                    return id;
                },
                updateTargetingFromMap(map) {
                    updateTargeting(targeting, map);
                    return slot;
                }
            };
            slots.set(adUnitPath, slot);
            slotsById.set(optDiv, slot);
            slotCreatives.set(optDiv, creatives);
            return slot;
        };
        const pubAdsService = {
            addEventListener: addEventListener,
            removeEventListener: removeEventListener,
            clear: noopFunc,
            clearCategoryExclusions: noopThis,
            clearTagForChildDirectedTreatment: noopThis,
            clearTargeting(k) {
                if (k === undefined) {
                    gTargeting.clear();
                } else {
                    gTargeting.delete(k);
                }
            },
            collapseEmptyDivs: noopFunc,
            defineOutOfPagePassback() {
                return new PassbackSlot;
            },
            definePassback() {
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
        const _window = window, _window$googletag = _window.googletag, googletag = _window$googletag === void 0 ? {} : _window$googletag;
        const _googletag$cmd = googletag.cmd, cmd = _googletag$cmd === void 0 ? [] : _googletag$cmd;
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
        googletag.defineOutOfPageSlot = defineSlot;
        googletag.defineSlot = defineSlot;
        googletag.destroySlots = function() {
            slots.clear();
            slotsById.clear();
        };
        googletag.disablePublisherConsole = noopFunc;
        googletag.display = function(arg) {
            let id;
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