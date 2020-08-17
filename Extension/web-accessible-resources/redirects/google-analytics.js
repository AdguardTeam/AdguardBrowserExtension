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

      if (typeof lastArg !== 'object' || lastArg === null || typeof lastArg.hitCallback !== 'function') {
        return;
      }

      try {
        lastArg.hitCallback(); // eslint-disable-next-line no-empty
      } catch (ex) {}
    }

    ga.create = function () {
      return new Tracker();
    };

    ga.getByName = noopNull;
    ga.getAll = noopArray;
    ga.remove = noopFunc;
    ga.loaded = true;
    window[googleAnalyticsName] = ga;
    var _window = window,
        dataLayer = _window.dataLayer;

    if (dataLayer instanceof Object && dataLayer.hide instanceof Object && typeof dataLayer.hide.end === 'function') {
      dataLayer.hide.end();
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
        GoogleAnalytics.apply(this, updatedArgs);
    
})({"name":"google-analytics","args":[]}, []);