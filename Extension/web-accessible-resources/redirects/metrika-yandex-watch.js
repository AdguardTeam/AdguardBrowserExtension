(function(source, args){
function metrikaYandexWatch(source) {
    var cbName = 'yandex_metrika_callbacks';
    /**
     * Gets callback and its context from options and call it in async way
     * @param {Object} options Yandex Metrika API options
     */

    var asyncCallbackFromOptions = function asyncCallbackFromOptions() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var callback = options.callback;
      var ctx = options.ctx;

      if (typeof callback === 'function') {
        callback = ctx !== undefined ? callback.bind(ctx) : callback;
        setTimeout(function () {
          return callback();
        });
      }
    };

    function Metrika() {} // constructor
    // Methods without options


    Metrika.prototype.addFileExtension = noopFunc;
    Metrika.prototype.getClientID = noopFunc;
    Metrika.prototype.setUserID = noopFunc;
    Metrika.prototype.userParams = noopFunc; // Methods with options
    // The order of arguments should be kept in according to API

    Metrika.prototype.extLink = function (url, options) {
      asyncCallbackFromOptions(options);
    };

    Metrika.prototype.file = function (url, options) {
      asyncCallbackFromOptions(options);
    };

    Metrika.prototype.hit = function (url, options) {
      asyncCallbackFromOptions(options);
    };

    Metrika.prototype.reachGoal = function (target, params, cb, ctx) {
      asyncCallbackFromOptions({
        callback: cb,
        ctx: ctx
      });
    };

    Metrika.prototype.notBounce = asyncCallbackFromOptions;

    if (window.Ya) {
      window.Ya.Metrika = Metrika;
    } else {
      window.Ya = {
        Metrika: Metrika
      };
    }

    if (window[cbName] && Array.isArray(window[cbName])) {
      window[cbName].forEach(function (func) {
        if (typeof func === 'function') {
          func();
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
function noopFunc() {};
        const updatedArgs = args ? [].concat(source).concat(args) : [source];
        metrikaYandexWatch.apply(this, updatedArgs);
    
})({"name":"metrika-yandex-watch","args":[]}, []);