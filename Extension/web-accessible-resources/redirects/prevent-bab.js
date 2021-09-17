(function(source, args){
function preventBab(source) {
    var nativeSetTimeout = window.setTimeout;
    var babRegex = /\.bab_elementid.$/;

    var timeoutWrapper = function timeoutWrapper(callback) {
      if (typeof callback !== 'string' || !babRegex.test(callback)) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        return nativeSetTimeout.apply(window, [callback].concat(args));
      }

      hit(source);
    };

    window.setTimeout = timeoutWrapper;
    var signatures = [['blockadblock'], ['babasbm'], [/getItem\('babn'\)/], ['getElementById', 'String.fromCharCode', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 'charAt', 'DOMContentLoaded', 'AdBlock', 'addEventListener', 'doScroll', 'fromCharCode', '<<2|r>>4', 'sessionStorage', 'clientWidth', 'localStorage', 'Math', 'random']];

    var check = function check(str) {
      for (var i = 0; i < signatures.length; i += 1) {
        var tokens = signatures[i];
        var match = 0;

        for (var j = 0; j < tokens.length; j += 1) {
          var token = tokens[j];
          var found = token instanceof RegExp ? token.test(str) : str.indexOf(token) > -1;

          if (found) {
            match += 1;
          }
        }

        if (match / tokens.length >= 0.8) {
          return true;
        }
      }

      return false;
    };

    var nativeEval = window.eval;

    var evalWrapper = function evalWrapper(str) {
      if (!check(str)) {
        return nativeEval(str);
      }

      hit(source);
      var bodyEl = document.body;

      if (bodyEl) {
        bodyEl.style.removeProperty('visibility');
      }

      var el = document.getElementById('babasbmsgx');

      if (el) {
        el.parentNode.removeChild(el);
      }
    };

    window.eval = evalWrapper.bind(window);
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
        preventBab.apply(this, updatedArgs);
    
})({"name":"prevent-bab","args":[]}, []);