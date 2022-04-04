(function(source, args){
function GoogleIma3(source) {
    var _this = this;

    var VERSION = '3.453.0';
    var ima = {};

    var AdDisplayContainer = function AdDisplayContainer() {};

    AdDisplayContainer.prototype.destroy = noopFunc;
    AdDisplayContainer.prototype.initialize = noopFunc;

    var ImaSdkSettings = function ImaSdkSettings() {};

    ImaSdkSettings.CompanionBackfillMode = {
      ALWAYS: 'always',
      ON_MASTER_AD: 'on_master_ad'
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
      l: '',
      p: '',
      r: 0,
      t: '',
      v: '',
      getCompanionBackfill: noopFunc,
      getDisableCustomPlaybackForIOS10Plus: function getDisableCustomPlaybackForIOS10Plus() {
        return _this.i;
      },
      getDisabledFlashAds: function getDisabledFlashAds() {
        return true;
      },
      getFeatureFlags: function getFeatureFlags() {
        return _this.f;
      },
      getLocale: function getLocale() {
        return _this.l;
      },
      getNumRedirects: function getNumRedirects() {
        return _this.r;
      },
      getPlayerType: function getPlayerType() {
        return _this.t;
      },
      getPlayerVersion: function getPlayerVersion() {
        return _this.v;
      },
      getPpid: function getPpid() {
        return _this.p;
      },
      getVpaidMode: function getVpaidMode() {
        return _this.C;
      },
      isCookiesEnabled: function isCookiesEnabled() {
        return _this.c;
      },
      isVpaidAdapter: function isVpaidAdapter() {
        return _this.M;
      },
      setCompanionBackfill: noopFunc,
      setAutoPlayAdBreaks: function setAutoPlayAdBreaks(a) {
        _this.K = a;
      },
      setCookiesEnabled: function setCookiesEnabled(c) {
        _this.c = !!c;
      },
      setDisableCustomPlaybackForIOS10Plus: function setDisableCustomPlaybackForIOS10Plus(i) {
        _this.i = !!i;
      },
      setDisableFlashAds: noopFunc,
      setFeatureFlags: function setFeatureFlags(f) {
        _this.f = !!f;
      },
      setIsVpaidAdapter: function setIsVpaidAdapter(a) {
        _this.M = a;
      },
      setLocale: function setLocale(l) {
        _this.l = !!l;
      },
      setNumRedirects: function setNumRedirects(r) {
        _this.r = !!r;
      },
      setPageCorrelator: function setPageCorrelator(a) {
        _this.R = a;
      },
      setPlayerType: function setPlayerType(t) {
        _this.t = !!t;
      },
      setPlayerVersion: function setPlayerVersion(v) {
        _this.v = !!v;
      },
      setPpid: function setPpid(p) {
        _this.p = !!p;
      },
      setVpaidMode: function setVpaidMode(a) {
        _this.C = a;
      },
      setSessionId: noopFunc,
      setStreamCorrelator: noopFunc,
      setVpaidAllowed: noopFunc,
      CompanionBackfillMode: {
        ALWAYS: 'always',
        ON_MASTER_AD: 'on_master_ad'
      },
      VpaidMode: {
        DISABLED: 0,
        ENABLED: 1,
        INSECURE: 2
      }
    };
    var managerLoaded = false;

    var EventHandler = function EventHandler() {};

    EventHandler.prototype = {
      listeners: new Map(),
      _dispatch: function _dispatch(e) {
        var listeners = this.listeners.get(e.type) || []; // eslint-disable-next-line no-restricted-syntax

        for (var _i = 0, _Array$from = Array.from(listeners); _i < _Array$from.length; _i++) {
          var listener = _Array$from[_i];

          try {
            listener(e);
          } catch (r) {
            // eslint-disable-next-line no-console
            console.error(r);
          }
        }
      },
      addEventListener: function addEventListener(t, c) {
        if (!this.listeners.has(t)) {
          this.listeners.set(t, new Set());
        }

        this.listeners.get(t).add(c);
      },
      removeEventListener: function removeEventListener(t, c) {
        var _this$listeners$get;

        (_this$listeners$get = this.listeners.get(t)) === null || _this$listeners$get === void 0 ? void 0 : _this$listeners$get.delete(c);
      }
    };
    var AdsManager = EventHandler;
    /* eslint-disable no-use-before-define */

    AdsManager.prototype.volume = 1;
    AdsManager.prototype.collapse = noopFunc;
    AdsManager.prototype.configureAdsManager = noopFunc;
    AdsManager.prototype.destroy = noopFunc;
    AdsManager.prototype.discardAdBreak = noopFunc;
    AdsManager.prototype.expand = noopFunc;
    AdsManager.prototype.focus = noopFunc;

    AdsManager.prototype.getAdSkippableState = function () {
      return false;
    };

    AdsManager.prototype.getCuePoints = function () {
      return [0];
    };

    AdsManager.prototype.getCurrentAd = function () {
      return currentAd;
    };

    AdsManager.prototype.getCurrentAdCuePoints = function () {
      return [];
    };

    AdsManager.prototype.getRemainingTime = function () {
      return 0;
    };

    AdsManager.prototype.getVolume = function () {
      return _this.volume;
    };

    AdsManager.prototype.init = noopFunc;

    AdsManager.prototype.isCustomClickTrackingUsed = function () {
      return false;
    };

    AdsManager.prototype.isCustomPlaybackUsed = function () {
      return false;
    };

    AdsManager.prototype.pause = noopFunc;
    AdsManager.prototype.requestNextAdBreak = noopFunc;
    AdsManager.prototype.resize = noopFunc;
    AdsManager.prototype.resume = noopFunc;

    AdsManager.prototype.setVolume = function (v) {
      _this.volume = v;
    };

    AdsManager.prototype.skip = noopFunc;

    AdsManager.prototype.start = function () {
      // eslint-disable-next-line no-restricted-syntax
      for (var _i2 = 0, _arr = [AdEvent.Type.LOADED, AdEvent.Type.STARTED, AdEvent.Type.AD_BUFFERING, AdEvent.Type.FIRST_QUARTILE, AdEvent.Type.MIDPOINT, AdEvent.Type.THIRD_QUARTILE, AdEvent.Type.COMPLETE, AdEvent.Type.ALL_ADS_COMPLETED]; _i2 < _arr.length; _i2++) {
        var type = _arr[_i2];

        try {
          _this._dispatch(new ima.AdEvent(type));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e);
        }
      }
    };

    AdsManager.prototype.stop = noopFunc;
    AdsManager.prototype.updateAdsRenderingSettings = noopFunc;
    /* eslint-enable no-use-before-define */

    var manager = Object.create(AdsManager);

    var AdsManagerLoadedEvent = function AdsManagerLoadedEvent() {};

    AdsManagerLoadedEvent.prototype = {
      constructor: function constructor(type) {
        _this.type = type;
      },
      getAdsManager: function getAdsManager() {
        return manager;
      },
      getUserRequestContext: noopFunc
    };
    AdsManagerLoadedEvent.Type = {
      ADS_MANAGER_LOADED: 'adsManagerLoaded'
    };
    var AdsLoader = EventHandler;
    AdsLoader.prototype.settings = new ImaSdkSettings();
    AdsLoader.prototype.contentComplete = noopFunc;
    AdsLoader.prototype.destroy = noopFunc;

    AdsLoader.prototype.getSettings = function () {
      return this.settings;
    };

    AdsLoader.prototype.getVersion = function () {
      return VERSION;
    };

    AdsLoader.prototype.requestAds = function () {
      var _this2 = this;

      if (!managerLoaded) {
        managerLoaded = true;
        requestAnimationFrame(function () {
          var ADS_MANAGER_LOADED = AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED;

          _this2._dispatch(new ima.AdsManagerLoadedEvent(ADS_MANAGER_LOADED));
        });
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
      pi: new AdPodInfo(),
      getAdId: function getAdId() {
        return '';
      },
      getAdPodInfo: function getAdPodInfo() {
        return _this.pi;
      },
      getAdSystem: function getAdSystem() {
        return '';
      },
      getAdvertiserName: function getAdvertiserName() {
        return '';
      },
      getApiFramework: function getApiFramework() {
        return null;
      },
      getCompanionAds: function getCompanionAds() {
        return [];
      },
      getContentType: function getContentType() {
        return '';
      },
      getCreativeAdId: function getCreativeAdId() {
        return '';
      },
      getDealId: function getDealId() {
        return '';
      },
      getDescription: function getDescription() {
        return '';
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
        return '';
      },
      getTraffickingParametersString: function getTraffickingParametersString() {
        return '';
      },
      getUiElements: function getUiElements() {
        return [''];
      },
      getUniversalAdIdRegistry: function getUniversalAdIdRegistry() {
        return 'unknown';
      },
      getUniversalAdIds: function getUniversalAdIds() {
        return [''];
      },
      getUniversalAdIdValue: function getUniversalAdIdValue() {
        return 'unknown';
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
        return [''];
      },
      getWrapperAdSystems: function getWrapperAdSystems() {
        return [''];
      },
      getWrapperCreativeIds: function getWrapperCreativeIds() {
        return [''];
      },
      isLinear: function isLinear() {
        return true;
      }
    };

    var CompanionAd = function CompanionAd() {};

    CompanionAd.prototype = {
      getAdSlotId: function getAdSlotId() {
        return '';
      },
      getContent: function getContent() {
        return '';
      },
      getContentType: function getContentType() {
        return '';
      },
      getHeight: function getHeight() {
        return 1;
      },
      getWidth: function getWidth() {
        return 1;
      }
    };

    var AdError = function AdError() {};

    AdError.prototype = {
      getErrorCode: function getErrorCode() {
        return 0;
      },
      getInnerError: noopFunc,
      getMessage: function getMessage() {
        return '';
      },
      getType: function getType() {
        return 1;
      },
      getVastErrorCode: function getVastErrorCode() {
        return 0;
      },
      toString: function toString() {
        return '';
      }
    };
    AdError.ErrorCode = {};
    AdError.Type = {};

    var isEngadget = function isEngadget() {
      try {
        // eslint-disable-next-line no-restricted-syntax
        for (var _i3 = 0, _Object$values = Object.values(window.vidible._getContexts()); _i3 < _Object$values.length; _i3++) {
          var _ctx$getPlayer, _ctx$getPlayer$div;

          var ctx = _Object$values[_i3]; // eslint-disable-next-line no-restricted-properties

          if ((_ctx$getPlayer = ctx.getPlayer()) !== null && _ctx$getPlayer !== void 0 && (_ctx$getPlayer$div = _ctx$getPlayer.div) !== null && _ctx$getPlayer$div !== void 0 && _ctx$getPlayer$div.innerHTML.includes('www.engadget.com')) {
            return true;
          }
        }
      } catch (e) {} // eslint-disable-line no-empty


      return false;
    };

    var currentAd = isEngadget() ? undefined : new Ad();

    var AdEvent = function AdEvent() {};

    AdEvent.prototype = {
      constructor: function constructor(type) {
        _this.type = type;
      },
      getAd: function getAd() {
        return currentAd;
      },
      getAdData: function getAdData() {}
    };
    AdEvent.Type = {
      AD_BREAK_READY: 'adBreakReady',
      AD_BUFFERING: 'adBuffering',
      AD_CAN_PLAY: 'adCanPlay',
      AD_METADATA: 'adMetadata',
      AD_PROGRESS: 'adProgress',
      ALL_ADS_COMPLETED: 'allAdsCompleted',
      CLICK: 'click',
      COMPLETE: 'complete',
      CONTENT_PAUSE_REQUESTED: 'contentPauseRequested',
      CONTENT_RESUME_REQUESTED: 'contentResumeRequested',
      DURATION_CHANGE: 'durationChange',
      EXPANDED_CHANGED: 'expandedChanged',
      FIRST_QUARTILE: 'firstQuartile',
      IMPRESSION: 'impression',
      INTERACTION: 'interaction',
      LINEAR_CHANGE: 'linearChange',
      LINEAR_CHANGED: 'linearChanged',
      LOADED: 'loaded',
      LOG: 'log',
      MIDPOINT: 'midpoint',
      PAUSED: 'pause',
      RESUMED: 'resume',
      SKIPPABLE_STATE_CHANGED: 'skippableStateChanged',
      SKIPPED: 'skip',
      STARTED: 'start',
      THIRD_QUARTILE: 'thirdQuartile',
      USER_CLOSE: 'userClose',
      VIDEO_CLICKED: 'videoClicked',
      VIDEO_ICON_CLICKED: 'videoIconClicked',
      VIEWABLE_IMPRESSION: 'viewable_impression',
      VOLUME_CHANGED: 'volumeChange',
      VOLUME_MUTED: 'mute'
    };

    var AdErrorEvent = function AdErrorEvent() {};

    AdErrorEvent.prototype = {
      getError: noopFunc,
      getUserRequestContext: function getUserRequestContext() {}
    };
    AdErrorEvent.Type = {
      AD_ERROR: 'adError'
    };

    var CustomContentLoadedEvent = function CustomContentLoadedEvent() {};

    CustomContentLoadedEvent.Type = {
      CUSTOM_CONTENT_LOADED: 'deprecated-event'
    };

    var CompanionAdSelectionSettings = function CompanionAdSelectionSettings() {};

    CompanionAdSelectionSettings.CreativeType = {
      ALL: 'All',
      FLASH: 'Flash',
      IMAGE: 'Image'
    };
    CompanionAdSelectionSettings.ResourceType = {
      ALL: 'All',
      HTML: 'Html',
      IFRAME: 'IFrame',
      STATIC: 'Static'
    };
    CompanionAdSelectionSettings.SizeCriteria = {
      IGNORE: 'IgnoreSize',
      SELECT_EXACT_MATCH: 'SelectExactMatch',
      SELECT_NEAR_MATCH: 'SelectNearMatch'
    };

    var AdCuePoints = function AdCuePoints() {};

    AdCuePoints.prototype = {
      getCuePoints: function getCuePoints() {
        return [];
      },
      getAdIdRegistry: function getAdIdRegistry() {
        return '';
      },
      getAdIsValue: function getAdIsValue() {
        return '';
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
        DOMAIN: 'domain',
        FULL: 'full',
        LIMITED: 'limited'
      },
      settings: new ImaSdkSettings(),
      UiElements: {
        AD_ATTRIBUTION: 'adAttribution',
        COUNTDOWN: 'countdown'
      },
      UniversalAdIdInfo: UniversalAdIdInfo,
      VERSION: VERSION,
      ViewMode: {
        FULLSCREEN: 'fullscreen',
        NORMAL: 'normal'
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
      var trace = console.trace.bind(console); // eslint-disable-line compat/compat

      var prefix = source.ruleText || '';

      if (source.domainName) {
        var AG_SCRIPTLET_MARKER = '#%#//';
        var UBO_SCRIPTLET_MARKER = '##+js';
        var ruleStartIndex;

        if (source.ruleText.indexOf(AG_SCRIPTLET_MARKER) > -1) {
          ruleStartIndex = source.ruleText.indexOf(AG_SCRIPTLET_MARKER);
        } else if (source.ruleText.indexOf(UBO_SCRIPTLET_MARKER) > -1) {
          ruleStartIndex = source.ruleText.indexOf(UBO_SCRIPTLET_MARKER);
        } // delete all domains from ruleText and leave just rule part


        var rulePart = source.ruleText.slice(ruleStartIndex); // prepare applied scriptlet rule for specific domain

        prefix = "".concat(source.domainName).concat(rulePart);
      } // Used to check if scriptlet uses 'hit' function for logging


      var LOG_MARKER = 'log: ';

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
    } catch (e) {// try catch for Edge 15
      // In according to this issue https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/14495220/
      // console.log throws an error
    } // This is necessary for unit-tests only!


    if (typeof window.__debug === 'function') {
      window.__debug(source);
    }
  }
function noopFunc() {};
        const updatedArgs = args ? [].concat(source).concat(args) : [source];
        try {
            GoogleIma3.apply(this, updatedArgs);
        } catch (e) {
            console.log(e);
        }
    
})({"name":"google-ima3","args":[]}, []);