(function(source, args){
function GoogleTagManagerGtm(source) {
    window.ga = window.ga || noopFunc;
    var _window = window,
        dataLayer = _window.dataLayer,
        google_optimize = _window.google_optimize; // eslint-disable-line camelcase

    if (dataLayer instanceof Object === false) {
      return;
    }

    if (dataLayer.hide instanceof Object && typeof dataLayer.hide.end === 'function') {
      dataLayer.hide.end();
    }

    if (typeof dataLayer.push === 'function') {
      dataLayer.push = function (data) {
        if (data instanceof Object && typeof data.eventCallback === 'function') {
          setTimeout(data.eventCallback, 1);
        }
      };
    } // https://github.com/AdguardTeam/Scriptlets/issues/81


    if (google_optimize instanceof Object && typeof google_optimize.get === 'function') {
      // eslint-disable-line camelcase
      var googleOptimizeWrapper = {};
      googleOptimizeWrapper.get = noopFunc;
      window.google_optimize = googleOptimizeWrapper;
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
function noopFunc() {};
        const updatedArgs = args ? [].concat(source).concat(args) : [source];
        GoogleTagManagerGtm.apply(this, updatedArgs);
    
})({"name":"googletagmanager-gtm","args":[]}, []);