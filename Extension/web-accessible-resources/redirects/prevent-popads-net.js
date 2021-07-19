(function(source, args){
function preventPopadsNet(source) {
    var rid = randomId();

    var throwError = function throwError() {
      throw new ReferenceError(rid);
    };

    delete window.PopAds;
    delete window.popns;
    Object.defineProperties(window, {
      PopAds: {
        set: throwError
      },
      popns: {
        set: throwError
      }
    });
    window.onerror = createOnErrorHandler(rid).bind();
    hit(source);
  }
function createOnErrorHandler(rid) {
    // eslint-disable-next-line consistent-return
    var nativeOnError = window.onerror;
    return function onError(error) {
      if (typeof error === 'string' && error.indexOf(rid) !== -1) {
        return true;
      }

      if (nativeOnError instanceof Function) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        return nativeOnError.apply(this, [error].concat(args));
      }

      return false;
    };
  }
function randomId() {
    return Math.random().toString(36).substr(2, 9);
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
  };
        const updatedArgs = args ? [].concat(source).concat(args) : [source];
        preventPopadsNet.apply(this, updatedArgs);
    
})({"name":"prevent-popads-net","args":[]}, []);