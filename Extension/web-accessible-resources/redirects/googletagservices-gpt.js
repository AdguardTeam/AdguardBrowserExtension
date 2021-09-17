(function(source, args){
function GoogleTagServicesGpt(source) {
    var companionAdsService = {
      addEventListener: noopThis,
      enableSyncLoading: noopFunc,
      setRefreshUnfilledSlots: noopFunc
    };
    var contentService = {
      addEventListener: noopThis,
      setContent: noopFunc
    };

    function PassbackSlot() {} // constructor


    PassbackSlot.prototype.display = noopFunc;
    PassbackSlot.prototype.get = noopNull;
    PassbackSlot.prototype.set = noopThis;
    PassbackSlot.prototype.setClickUrl = noopThis;
    PassbackSlot.prototype.setTagForChildDirectedTreatment = noopThis;
    PassbackSlot.prototype.setTargeting = noopThis;
    PassbackSlot.prototype.updateTargetingFromMap = noopThis;

    function SizeMappingBuilder() {} // constructor


    SizeMappingBuilder.prototype.addSize = noopThis;
    SizeMappingBuilder.prototype.build = noopNull;

    function Slot() {} // constructor


    Slot.prototype.addService = noopThis;
    Slot.prototype.clearCategoryExclusions = noopThis;
    Slot.prototype.clearTargeting = noopThis;
    Slot.prototype.defineSizeMapping = noopThis;
    Slot.prototype.get = noopNull;
    Slot.prototype.getAdUnitPath = noopArray;
    Slot.prototype.getAttributeKeys = noopArray;
    Slot.prototype.getCategoryExclusions = noopArray;
    Slot.prototype.getDomId = noopStr;
    Slot.prototype.getSlotElementId = noopStr;
    Slot.prototype.getSlotId = noopThis;
    Slot.prototype.getTargeting = noopArray;
    Slot.prototype.getTargetingKeys = noopArray;
    Slot.prototype.set = noopThis;
    Slot.prototype.setCategoryExclusion = noopThis;
    Slot.prototype.setClickUrl = noopThis;
    Slot.prototype.setCollapseEmptyDiv = noopThis;
    Slot.prototype.setTargeting = noopThis;
    var pubAdsService = {
      addEventListener: noopThis,
      clear: noopFunc,
      clearCategoryExclusions: noopThis,
      clearTagForChildDirectedTreatment: noopThis,
      clearTargeting: noopThis,
      collapseEmptyDivs: noopFunc,
      defineOutOfPagePassback: function defineOutOfPagePassback() {
        return new PassbackSlot();
      },
      definePassback: function definePassback() {
        return new PassbackSlot();
      },
      disableInitialLoad: noopFunc,
      display: noopFunc,
      enableAsyncRendering: noopFunc,
      enableSingleRequest: noopFunc,
      enableSyncRendering: noopFunc,
      enableVideoAds: noopFunc,
      get: noopNull,
      getAttributeKeys: noopArray,
      getTargeting: noopFunc,
      getTargetingKeys: noopArray,
      getSlots: noopArray,
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
    var _window = window,
        _window$googletag = _window.googletag,
        googletag = _window$googletag === void 0 ? {} : _window$googletag;
    var _googletag$cmd = googletag.cmd,
        cmd = _googletag$cmd === void 0 ? [] : _googletag$cmd;
    googletag.apiReady = true;
    googletag.cmd = [];

    googletag.cmd.push = function (a) {
      try {
        a(); // eslint-disable-next-line no-empty
      } catch (ex) {}

      return 1;
    };

    googletag.companionAds = function () {
      return companionAdsService;
    };

    googletag.content = function () {
      return contentService;
    };

    googletag.defineOutOfPageSlot = function () {
      return new Slot();
    };

    googletag.defineSlot = function () {
      return new Slot();
    };

    googletag.destroySlots = noopFunc;
    googletag.disablePublisherConsole = noopFunc;
    googletag.display = noopFunc;
    googletag.enableServices = noopFunc;
    googletag.getVersion = noopStr;

    googletag.pubads = function () {
      return pubAdsService;
    };

    googletag.pubadsReady = true;
    googletag.setAdIframeTitle = noopFunc;

    googletag.sizeMapping = function () {
      return new SizeMappingBuilder();
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
    return '';
  };
        const updatedArgs = args ? [].concat(source).concat(args) : [source];
        GoogleTagServicesGpt.apply(this, updatedArgs);
    
})({"name":"googletagservices-gpt","args":[]}, []);