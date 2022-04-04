(function(source, args){
function GoogleAnalytics(source) {
    // eslint-disable-next-line func-names
    var Tracker = function Tracker() {}; // constructor


    var proto = Tracker.prototype;
    proto.get = noopFunc;
    proto.set = noopFunc;
    proto.send = noopFunc;
    var googleAnalyticsName = window.GoogleAnalyticsObject || 'ga'; // a -- fake arg for 'ga.length < 1' antiadblock checking
    // eslint-disable-next-line no-unused-vars

    function ga(a) {
      var len = arguments.length;

      if (len === 0) {
        return;
      } // eslint-disable-next-line prefer-rest-params


      var lastArg = arguments[len - 1];
      var replacer;

      if (lastArg instanceof Object && lastArg !== null && typeof lastArg.hitCallback === 'function') {
        replacer = lastArg.hitCallback;
      } else if (typeof lastArg === 'function') {
        // https://github.com/AdguardTeam/Scriptlets/issues/98
        replacer = function replacer() {
          lastArg(ga.create());
        };
      }

      try {
        setTimeout(replacer, 1); // eslint-disable-next-line no-empty
      } catch (ex) {}
    }

    ga.create = function () {
      return new Tracker();
    }; // https://github.com/AdguardTeam/Scriptlets/issues/134


    ga.getByName = function () {
      return new Tracker();
    };

    ga.getAll = function () {
      return [new Tracker()];
    };

    ga.remove = noopFunc;
    ga.loaded = true;
    window[googleAnalyticsName] = ga;
    var _window = window,
        dataLayer = _window.dataLayer,
        google_optimize = _window.google_optimize; // eslint-disable-line camelcase

    if (dataLayer instanceof Object === false) {
      return;
    }

    if (dataLayer.hide instanceof Object && typeof dataLayer.hide.end === 'function') {
      dataLayer.hide.end();
    }
    /**
     * checks data object and delays callback
     * @param {Object|Array} data gtag payload
     * @param {string} funcName callback prop name
     * @returns
     */


    var handleCallback = function handleCallback(dataObj, funcName) {
      if (dataObj && typeof dataObj[funcName] === 'function') {
        setTimeout(dataObj[funcName]);
      }
    };

    if (typeof dataLayer.push === 'function') {
      dataLayer.push = function (data) {
        if (data instanceof Object) {
          handleCallback(data, 'eventCallback'); // eslint-disable-next-line no-restricted-syntax, guard-for-in

          for (var key in data) {
            handleCallback(data[key], 'event_callback');
          } // eslint-disable-next-line no-prototype-builtins


          if (!data.hasOwnProperty('eventCallback') && !data.hasOwnProperty('eventCallback')) {
            [].push.call(window.dataLayer, data);
          }
        }

        if (Array.isArray(data)) {
          data.forEach(function (arg) {
            handleCallback(arg, 'callback');
          });
        }

        return noopFunc;
      };
    } // https://github.com/AdguardTeam/Scriptlets/issues/81


    if (google_optimize instanceof Object && typeof google_optimize.get === 'function') {
      // eslint-disable-line camelcase
      var googleOptimizeWrapper = {
        get: noopFunc
      };
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
function noopFunc() {}
function noopNull() {
    return null;
  }
function noopArray() {
    return [];
  };
        const updatedArgs = args ? [].concat(source).concat(args) : [source];
        try {
            GoogleAnalytics.apply(this, updatedArgs);
        } catch (e) {
            console.log(e);
        }
    
})({"name":"google-analytics","args":[]}, []);