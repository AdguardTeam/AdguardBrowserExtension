(function(source, args) {
    const flag = "done";
    const uniqueIdentifier = source.uniqueId + source.name + "_" + (Array.isArray(args) ? args.join("_") : "");
    if (source.uniqueId) {
        if (Window.prototype.toString[uniqueIdentifier] === flag) {
            return;
        }
    }
    function GoogleTagServicesGpt(source) {
        var slots = new Map;
        var slotsById = new Map;
        var slotsPerPath = new Map;
        var slotCreatives = new Map;
        var eventCallbacks = new Map;
        var gTargeting = new Map;
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
        var emptySlotElement = function emptySlotElement(slot) {
            var node = document.getElementById(slot.getSlotElementId());
            while (node !== null && node !== void 0 && node.lastChild) {
                node.lastChild.remove();
            }
        };
        var recreateIframeForSlot = function recreateIframeForSlot(slot) {
            var _document$getElementB;
            var eid = `google_ads_iframe_${slot.getId()}`;
            (_document$getElementB = document.getElementById(eid)) === null || _document$getElementB === void 0 || _document$getElementB.remove();
            var node = document.getElementById(slot.getSlotElementId());
            if (node) {
                var f = document.createElement("iframe");
                f.id = eid;
                f.srcdoc = "<body></body>";
                f.style = "position:absolute; width:0; height:0; left:0; right:0; z-index:-1; border:0";
                f.setAttribute("width", 0);
                f.setAttribute("height", 0);
                f.setAttribute("data-load-complete", true);
                f.setAttribute("data-google-container-id", true);
                f.setAttribute("sandbox", "");
                node.appendChild(f);
            }
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
            emptySlotElement(slot);
            recreateIframeForSlot(slot);
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
        var getTargetingValue = function getTargetingValue(v) {
            if (typeof v === "string") {
                return [ v ];
            }
            try {
                return Array.prototype.flat.call(v);
            } catch (_unused) {}
            return [];
        };
        var updateTargeting = function updateTargeting(targeting, map) {
            if (typeof map === "object") {
                for (var key in map) {
                    if (Object.prototype.hasOwnProperty.call(map, key)) {
                        targeting.set(key, getTargetingValue(map[key]));
                    }
                }
            }
        };
        var defineSlot = function defineSlot(adUnitPath, creatives, optDiv) {
            if (slotsById.has(optDiv)) {
                var _document$getElementB2;
                (_document$getElementB2 = document.getElementById(optDiv)) === null || _document$getElementB2 === void 0 || _document$getElementB2.remove();
                return slotsById.get(optDiv);
            }
            var attributes = new Map;
            var targeting = new Map;
            var exclusions = new Set;
            var response = {
                advertiserId: undefined,
                campaignId: undefined,
                creativeId: undefined,
                creativeTemplateId: undefined,
                lineItemId: undefined
            };
            var sizes = [ {
                getHeight: function getHeight() {
                    return 2;
                },
                getWidth: function getWidth() {
                    return 2;
                }
            } ];
            var num = (slotsPerPath.get(adUnitPath) || 0) + 1;
            slotsPerPath.set(adUnitPath, num);
            var id = `${adUnitPath}_${num}`;
            var clickUrl = "";
            var collapseEmptyDiv = null;
            var services = new Set;
            var slot = {
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
        var pubAdsService = {
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
            setPrivacySettings: noopThis,
            setPublisherProvidedId: noopThis,
            setRequestNonPersonalizedAds: noopThis,
            setSafeFrameConfig: noopThis,
            setTagForChildDirectedTreatment: noopThis,
            setTargeting: noopThis,
            setVideoContent: noopThis,
            updateCorrelator: noopFunc
        };
        var {googletag: googletag = {}} = window;
        var {cmd: cmd = []} = googletag;
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
        return !0;
    }
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        GoogleTagServicesGpt.apply(this, updatedArgs);
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
    name: "googletagservices-gpt",
    args: []
}, []);