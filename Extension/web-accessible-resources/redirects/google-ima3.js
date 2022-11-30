(function(source, args) {
    function GoogleIma3(source) {
        var VERSION = "3.453.0";
        var ima = {};
        var AdDisplayContainer = function AdDisplayContainer() {};
        AdDisplayContainer.prototype.destroy = noopFunc;
        AdDisplayContainer.prototype.initialize = noopFunc;
        var ImaSdkSettings = function ImaSdkSettings() {};
        ImaSdkSettings.CompanionBackfillMode = {
            ALWAYS: "always",
            ON_MASTER_AD: "on_master_ad"
        };
        ImaSdkSettings.VpaidMode = {
            DISABLED: 0,
            ENABLED: 1,
            INSECURE: 2
        };
        ImaSdkSettings.prototype = {
            c: true,
            f: {},
            i: false,
            l: "",
            p: "",
            r: 0,
            t: "",
            v: "",
            getCompanionBackfill: noopFunc,
            getDisableCustomPlaybackForIOS10Plus: function getDisableCustomPlaybackForIOS10Plus() {
                return this.i;
            },
            getDisabledFlashAds: function getDisabledFlashAds() {
                return true;
            },
            getFeatureFlags: function getFeatureFlags() {
                return this.f;
            },
            getLocale: function getLocale() {
                return this.l;
            },
            getNumRedirects: function getNumRedirects() {
                return this.r;
            },
            getPlayerType: function getPlayerType() {
                return this.t;
            },
            getPlayerVersion: function getPlayerVersion() {
                return this.v;
            },
            getPpid: function getPpid() {
                return this.p;
            },
            getVpaidMode: function getVpaidMode() {
                return this.C;
            },
            isCookiesEnabled: function isCookiesEnabled() {
                return this.c;
            },
            isVpaidAdapter: function isVpaidAdapter() {
                return this.M;
            },
            setCompanionBackfill: noopFunc,
            setAutoPlayAdBreaks: function setAutoPlayAdBreaks(a) {
                this.K = a;
            },
            setCookiesEnabled: function setCookiesEnabled(c) {
                this.c = !!c;
            },
            setDisableCustomPlaybackForIOS10Plus: function setDisableCustomPlaybackForIOS10Plus(i) {
                this.i = !!i;
            },
            setDisableFlashAds: noopFunc,
            setFeatureFlags: function setFeatureFlags(f) {
                this.f = !!f;
            },
            setIsVpaidAdapter: function setIsVpaidAdapter(a) {
                this.M = a;
            },
            setLocale: function setLocale(l) {
                this.l = !!l;
            },
            setNumRedirects: function setNumRedirects(r) {
                this.r = !!r;
            },
            setPageCorrelator: function setPageCorrelator(a) {
                this.R = a;
            },
            setPlayerType: function setPlayerType(t) {
                this.t = !!t;
            },
            setPlayerVersion: function setPlayerVersion(v) {
                this.v = !!v;
            },
            setPpid: function setPpid(p) {
                this.p = !!p;
            },
            setVpaidMode: function setVpaidMode(a) {
                this.C = a;
            },
            setSessionId: noopFunc,
            setStreamCorrelator: noopFunc,
            setVpaidAllowed: noopFunc,
            CompanionBackfillMode: {
                ALWAYS: "always",
                ON_MASTER_AD: "on_master_ad"
            },
            VpaidMode: {
                DISABLED: 0,
                ENABLED: 1,
                INSECURE: 2
            }
        };
        var managerLoaded = false;
        var EventHandler = function EventHandler() {
            this.listeners = new Map;
            this._dispatch = function(e) {
                var listeners = this.listeners.get(e.type) || [];
                for (var _i = 0, _Array$from = Array.from(listeners); _i < _Array$from.length; _i++) {
                    var listener = _Array$from[_i];
                    try {
                        listener(e);
                    } catch (r) {
                        console.error(r);
                    }
                }
            };
            this.addEventListener = function(t, c) {
                if (!this.listeners.has(t)) {
                    this.listeners.set(t, new Set);
                }
                this.listeners.get(t).add(c);
            };
            this.removeEventListener = function(t, c) {
                var _this$listeners$get;
                (_this$listeners$get = this.listeners.get(t)) === null || _this$listeners$get === void 0 ? void 0 : _this$listeners$get.delete(c);
            };
        };
        var AdsManager = new EventHandler;
        AdsManager.volume = 1;
        AdsManager.collapse = noopFunc;
        AdsManager.configureAdsManager = noopFunc;
        AdsManager.destroy = noopFunc;
        AdsManager.discardAdBreak = noopFunc;
        AdsManager.expand = noopFunc;
        AdsManager.focus = noopFunc;
        AdsManager.getAdSkippableState = function() {
            return false;
        };
        AdsManager.getCuePoints = function() {
            return [ 0 ];
        };
        AdsManager.getCurrentAd = function() {
            return currentAd;
        };
        AdsManager.getCurrentAdCuePoints = function() {
            return [];
        };
        AdsManager.getRemainingTime = function() {
            return 0;
        };
        AdsManager.getVolume = function() {
            return this.volume;
        };
        AdsManager.init = noopFunc;
        AdsManager.isCustomClickTrackingUsed = function() {
            return false;
        };
        AdsManager.isCustomPlaybackUsed = function() {
            return false;
        };
        AdsManager.pause = noopFunc;
        AdsManager.requestNextAdBreak = noopFunc;
        AdsManager.resize = noopFunc;
        AdsManager.resume = noopFunc;
        AdsManager.setVolume = function(v) {
            this.volume = v;
        };
        AdsManager.skip = noopFunc;
        AdsManager.start = function() {
            for (var _i2 = 0, _arr = [ AdEvent.Type.ALL_ADS_COMPLETED, AdEvent.Type.CONTENT_RESUME_REQUESTED ]; _i2 < _arr.length; _i2++) {
                var type = _arr[_i2];
                try {
                    this._dispatch(new ima.AdEvent(type));
                } catch (e) {
                    console.error(e);
                }
            }
        };
        AdsManager.stop = noopFunc;
        AdsManager.updateAdsRenderingSettings = noopFunc;
        var manager = Object.create(AdsManager);
        var AdsManagerLoadedEvent = function AdsManagerLoadedEvent(type, adsRequest, userRequestContext) {
            this.type = type;
            this.adsRequest = adsRequest;
            this.userRequestContext = userRequestContext;
        };
        AdsManagerLoadedEvent.prototype = {
            getAdsManager: function getAdsManager() {
                return manager;
            },
            getUserRequestContext: function getUserRequestContext() {
                if (this.userRequestContext) {
                    return this.userRequestContext;
                }
                return {};
            }
        };
        AdsManagerLoadedEvent.Type = {
            ADS_MANAGER_LOADED: "adsManagerLoaded"
        };
        var AdsLoader = EventHandler;
        AdsLoader.prototype.settings = new ImaSdkSettings;
        AdsLoader.prototype.contentComplete = noopFunc;
        AdsLoader.prototype.destroy = noopFunc;
        AdsLoader.prototype.getSettings = function() {
            return this.settings;
        };
        AdsLoader.prototype.getVersion = function() {
            return VERSION;
        };
        AdsLoader.prototype.requestAds = function(adsRequest, userRequestContext) {
            var _this = this;
            if (!managerLoaded) {
                managerLoaded = true;
                requestAnimationFrame((function() {
                    var ADS_MANAGER_LOADED = AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED;
                    _this._dispatch(new ima.AdsManagerLoadedEvent(ADS_MANAGER_LOADED, adsRequest, userRequestContext));
                }));
                var e = new ima.AdError("adPlayError", 1205, 1205, "The browser prevented playback initiated without user interaction.", adsRequest, userRequestContext);
                requestAnimationFrame((function() {
                    _this._dispatch(new ima.AdErrorEvent(e));
                }));
            }
        };
        var AdsRenderingSettings = noopFunc;
        var AdsRequest = function AdsRequest() {};
        AdsRequest.prototype = {
            setAdWillAutoPlay: noopFunc,
            setAdWillPlayMuted: noopFunc,
            setContinuousPlayback: noopFunc
        };
        var AdPodInfo = function AdPodInfo() {};
        AdPodInfo.prototype = {
            getAdPosition: function getAdPosition() {
                return 1;
            },
            getIsBumper: function getIsBumper() {
                return false;
            },
            getMaxDuration: function getMaxDuration() {
                return -1;
            },
            getPodIndex: function getPodIndex() {
                return 1;
            },
            getTimeOffset: function getTimeOffset() {
                return 0;
            },
            getTotalAds: function getTotalAds() {
                return 1;
            }
        };
        var Ad = function Ad() {};
        Ad.prototype = {
            pi: new AdPodInfo,
            getAdId: function getAdId() {
                return "";
            },
            getAdPodInfo: function getAdPodInfo() {
                return this.pi;
            },
            getAdSystem: function getAdSystem() {
                return "";
            },
            getAdvertiserName: function getAdvertiserName() {
                return "";
            },
            getApiFramework: function getApiFramework() {
                return null;
            },
            getCompanionAds: function getCompanionAds() {
                return [];
            },
            getContentType: function getContentType() {
                return "";
            },
            getCreativeAdId: function getCreativeAdId() {
                return "";
            },
            getDealId: function getDealId() {
                return "";
            },
            getDescription: function getDescription() {
                return "";
            },
            getDuration: function getDuration() {
                return 8.5;
            },
            getHeight: function getHeight() {
                return 0;
            },
            getMediaUrl: function getMediaUrl() {
                return null;
            },
            getMinSuggestedDuration: function getMinSuggestedDuration() {
                return -2;
            },
            getSkipTimeOffset: function getSkipTimeOffset() {
                return -1;
            },
            getSurveyUrl: function getSurveyUrl() {
                return null;
            },
            getTitle: function getTitle() {
                return "";
            },
            getTraffickingParametersString: function getTraffickingParametersString() {
                return "";
            },
            getUiElements: function getUiElements() {
                return [ "" ];
            },
            getUniversalAdIdRegistry: function getUniversalAdIdRegistry() {
                return "unknown";
            },
            getUniversalAdIds: function getUniversalAdIds() {
                return [ "" ];
            },
            getUniversalAdIdValue: function getUniversalAdIdValue() {
                return "unknown";
            },
            getVastMediaBitrate: function getVastMediaBitrate() {
                return 0;
            },
            getVastMediaHeight: function getVastMediaHeight() {
                return 0;
            },
            getVastMediaWidth: function getVastMediaWidth() {
                return 0;
            },
            getWidth: function getWidth() {
                return 0;
            },
            getWrapperAdIds: function getWrapperAdIds() {
                return [ "" ];
            },
            getWrapperAdSystems: function getWrapperAdSystems() {
                return [ "" ];
            },
            getWrapperCreativeIds: function getWrapperCreativeIds() {
                return [ "" ];
            },
            isLinear: function isLinear() {
                return true;
            },
            isSkippable: function isSkippable() {
                return true;
            }
        };
        var CompanionAd = function CompanionAd() {};
        CompanionAd.prototype = {
            getAdSlotId: function getAdSlotId() {
                return "";
            },
            getContent: function getContent() {
                return "";
            },
            getContentType: function getContentType() {
                return "";
            },
            getHeight: function getHeight() {
                return 1;
            },
            getWidth: function getWidth() {
                return 1;
            }
        };
        var AdError = function AdError(type, code, vast, message, adsRequest, userRequestContext) {
            this.errorCode = code;
            this.message = message;
            this.type = type;
            this.adsRequest = adsRequest;
            this.userRequestContext = userRequestContext;
            this.getErrorCode = function() {
                return this.errorCode;
            };
            this.getInnerError = function() {};
            this.getMessage = function() {
                return this.message;
            };
            this.getType = function() {
                return this.type;
            };
            this.getVastErrorCode = function() {
                return this.vastErrorCode;
            };
            this.toString = function() {
                return "AdError ".concat(this.errorCode, ": ").concat(this.message);
            };
        };
        AdError.ErrorCode = {};
        AdError.Type = {};
        var isEngadget = function isEngadget() {
            try {
                for (var _i3 = 0, _Object$values = Object.values(window.vidible._getContexts()); _i3 < _Object$values.length; _i3++) {
                    var _ctx$getPlayer, _ctx$getPlayer$div;
                    var ctx = _Object$values[_i3];
                    if ((_ctx$getPlayer = ctx.getPlayer()) !== null && _ctx$getPlayer !== void 0 && (_ctx$getPlayer$div = _ctx$getPlayer.div) !== null && _ctx$getPlayer$div !== void 0 && _ctx$getPlayer$div.innerHTML.includes("www.engadget.com")) {
                        return true;
                    }
                }
            } catch (e) {}
            return false;
        };
        var currentAd = isEngadget() ? undefined : new Ad;
        var AdEvent = function AdEvent(type) {
            this.type = type;
        };
        AdEvent.prototype = {
            getAd: function getAd() {
                return currentAd;
            },
            getAdData: function getAdData() {}
        };
        AdEvent.Type = {
            AD_BREAK_READY: "adBreakReady",
            AD_BUFFERING: "adBuffering",
            AD_CAN_PLAY: "adCanPlay",
            AD_METADATA: "adMetadata",
            AD_PROGRESS: "adProgress",
            ALL_ADS_COMPLETED: "allAdsCompleted",
            CLICK: "click",
            COMPLETE: "complete",
            CONTENT_PAUSE_REQUESTED: "contentPauseRequested",
            CONTENT_RESUME_REQUESTED: "contentResumeRequested",
            DURATION_CHANGE: "durationChange",
            EXPANDED_CHANGED: "expandedChanged",
            FIRST_QUARTILE: "firstQuartile",
            IMPRESSION: "impression",
            INTERACTION: "interaction",
            LINEAR_CHANGE: "linearChange",
            LINEAR_CHANGED: "linearChanged",
            LOADED: "loaded",
            LOG: "log",
            MIDPOINT: "midpoint",
            PAUSED: "pause",
            RESUMED: "resume",
            SKIPPABLE_STATE_CHANGED: "skippableStateChanged",
            SKIPPED: "skip",
            STARTED: "start",
            THIRD_QUARTILE: "thirdQuartile",
            USER_CLOSE: "userClose",
            VIDEO_CLICKED: "videoClicked",
            VIDEO_ICON_CLICKED: "videoIconClicked",
            VIEWABLE_IMPRESSION: "viewable_impression",
            VOLUME_CHANGED: "volumeChange",
            VOLUME_MUTED: "mute"
        };
        var AdErrorEvent = function AdErrorEvent(error) {
            this.error = error;
            this.type = "adError";
            this.getError = function() {
                return this.error;
            };
            this.getUserRequestContext = function() {
                var _this$error;
                if ((_this$error = this.error) !== null && _this$error !== void 0 && _this$error.userRequestContext) {
                    return this.error.userRequestContext;
                }
                return {};
            };
        };
        AdErrorEvent.Type = {
            AD_ERROR: "adError"
        };
        var CustomContentLoadedEvent = function CustomContentLoadedEvent() {};
        CustomContentLoadedEvent.Type = {
            CUSTOM_CONTENT_LOADED: "deprecated-event"
        };
        var CompanionAdSelectionSettings = function CompanionAdSelectionSettings() {};
        CompanionAdSelectionSettings.CreativeType = {
            ALL: "All",
            FLASH: "Flash",
            IMAGE: "Image"
        };
        CompanionAdSelectionSettings.ResourceType = {
            ALL: "All",
            HTML: "Html",
            IFRAME: "IFrame",
            STATIC: "Static"
        };
        CompanionAdSelectionSettings.SizeCriteria = {
            IGNORE: "IgnoreSize",
            SELECT_EXACT_MATCH: "SelectExactMatch",
            SELECT_NEAR_MATCH: "SelectNearMatch"
        };
        var AdCuePoints = function AdCuePoints() {};
        AdCuePoints.prototype = {
            getCuePoints: function getCuePoints() {
                return [];
            },
            getAdIdRegistry: function getAdIdRegistry() {
                return "";
            },
            getAdIsValue: function getAdIsValue() {
                return "";
            }
        };
        var AdProgressData = noopFunc;
        var UniversalAdIdInfo = function UniversalAdIdInfo() {};
        Object.assign(ima, {
            AdCuePoints: AdCuePoints,
            AdDisplayContainer: AdDisplayContainer,
            AdError: AdError,
            AdErrorEvent: AdErrorEvent,
            AdEvent: AdEvent,
            AdPodInfo: AdPodInfo,
            AdProgressData: AdProgressData,
            AdsLoader: AdsLoader,
            AdsManager: manager,
            AdsManagerLoadedEvent: AdsManagerLoadedEvent,
            AdsRenderingSettings: AdsRenderingSettings,
            AdsRequest: AdsRequest,
            CompanionAd: CompanionAd,
            CompanionAdSelectionSettings: CompanionAdSelectionSettings,
            CustomContentLoadedEvent: CustomContentLoadedEvent,
            gptProxyInstance: {},
            ImaSdkSettings: ImaSdkSettings,
            OmidAccessMode: {
                DOMAIN: "domain",
                FULL: "full",
                LIMITED: "limited"
            },
            settings: new ImaSdkSettings,
            UiElements: {
                AD_ATTRIBUTION: "adAttribution",
                COUNTDOWN: "countdown"
            },
            UniversalAdIdInfo: UniversalAdIdInfo,
            VERSION: VERSION,
            ViewMode: {
                FULLSCREEN: "fullscreen",
                NORMAL: "normal"
            }
        });
        if (!window.google) {
            window.google = {};
        }
        window.google.ima = ima;
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
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        GoogleIma3.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "google-ima3",
    args: []
}, []);