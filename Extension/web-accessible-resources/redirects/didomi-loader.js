(function(source, args){
function DidomiLoader(source) {
    function UserConsentStatusForVendorSubscribe() {}

    UserConsentStatusForVendorSubscribe.prototype.filter = function () {
      return new UserConsentStatusForVendorSubscribe();
    };

    UserConsentStatusForVendorSubscribe.prototype.subscribe = noopFunc;

    function UserConsentStatusForVendor() {}

    UserConsentStatusForVendor.prototype.first = function () {
      return new UserConsentStatusForVendorSubscribe();
    };

    UserConsentStatusForVendor.prototype.filter = function () {
      return new UserConsentStatusForVendorSubscribe();
    };

    UserConsentStatusForVendor.prototype.subscribe = noopFunc;
    var DidomiWrapper = {
      isConsentRequired: falseFunc,
      getUserConsentStatusForPurpose: trueFunc,
      getUserConsentStatus: trueFunc,
      getUserStatus: noopFunc,
      getRequiredPurposes: noopArray,
      getUserConsentStatusForVendor: trueFunc,
      Purposes: {
        Cookies: 'cookies'
      },
      notice: {
        configure: noopFunc,
        hide: noopFunc,
        isVisible: falseFunc,
        show: noopFunc,
        showDataProcessing: trueFunc
      },
      isUserConsentStatusPartial: falseFunc,
      on: function on() {
        return {
          actions: {},
          emitter: {},
          services: {},
          store: {}
        };
      },
      shouldConsentBeCollected: falseFunc,
      getUserConsentStatusForAll: noopFunc,
      getObservableOnUserConsentStatusForVendor: function getObservableOnUserConsentStatusForVendor() {
        return new UserConsentStatusForVendor();
      }
    };
    window.Didomi = DidomiWrapper;
    var didomiStateWrapper = {
      didomiExperimentId: '',
      didomiExperimentUserGroup: '',
      didomiGDPRApplies: 1,
      didomiIABConsent: '',
      didomiPurposesConsent: '',
      didomiPurposesConsentDenied: '',
      didomiPurposesConsentUnknown: '',
      didomiVendorsConsent: '',
      didomiVendorsConsentDenied: '',
      didomiVendorsConsentUnknown: '',
      didomiVendorsRawConsent: '',
      didomiVendorsRawConsentDenied: '',
      didomiVendorsRawConsentUnknown: ''
    };
    window.didomiState = didomiStateWrapper;
    var tcData = {
      eventStatus: 'tcloaded',
      gdprApplies: false,
      listenerId: noopFunc,
      vendor: {
        consents: []
      },
      purpose: {
        consents: []
      }
    };

    var __tcfapiWrapper = function __tcfapiWrapper() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      } // eslint-disable-next-line no-restricted-syntax


      for (var _i = 0, _args = args; _i < _args.length; _i++) {
        var arg = _args[_i];

        if (typeof arg === 'function') {
          try {
            setTimeout(arg(tcData, true));
          } catch (ex) {
            /* empty */
          }
        }
      }
    };

    window.__tcfapi = __tcfapiWrapper;
    var didomiEventListenersWrapper = {
      stub: true,
      push: noopFunc
    };
    window.didomiEventListeners = didomiEventListenersWrapper;
    var didomiOnReadyWrapper = {
      stub: true,
      push: function push(arg) {
        if (typeof arg !== 'function') {
          return;
        }

        if (document.readyState !== 'complete') {
          window.addEventListener('load', function () {
            setTimeout(arg(window.Didomi));
          });
        } else {
          setTimeout(arg(window.Didomi));
        }
      }
    };
    window.didomiOnReady = window.didomiOnReady || didomiOnReadyWrapper;

    if (Array.isArray(window.didomiOnReady)) {
      window.didomiOnReady.forEach(function (arg) {
        if (typeof arg === 'function') {
          try {
            setTimeout(arg(window.Didomi));
          } catch (e) {
            /* empty */
          }
        }
      });
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
function noopArray() {
    return [];
  }
function trueFunc() {
    return true;
  }
function falseFunc() {
    return false;
  };
        const updatedArgs = args ? [].concat(source).concat(args) : [source];
        try {
            DidomiLoader.apply(this, updatedArgs);
        } catch (e) {
            console.log(e);
        }
    
})({"name":"didomi-loader","args":[]}, []);