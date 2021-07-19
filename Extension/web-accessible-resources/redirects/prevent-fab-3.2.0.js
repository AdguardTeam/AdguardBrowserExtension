(function(source, args){
function preventFab(source) {
    hit(source); // redefines Fab function for adblock detection

    var Fab = function Fab() {};

    Fab.prototype.check = noopFunc;
    Fab.prototype.clearEvent = noopFunc;
    Fab.prototype.emitEvent = noopFunc;

    Fab.prototype.on = function (a, b) {
      if (!a) {
        b();
      }

      return this;
    };

    Fab.prototype.onDetected = noopThis;

    Fab.prototype.onNotDetected = function (a) {
      a();
      return this;
    };

    Fab.prototype.setOption = noopFunc;
    Fab.prototype.options = {
      set: noopFunc,
      get: noopFunc
    };
    var fab = new Fab();
    var getSetFab = {
      get: function get() {
        return Fab;
      },
      set: function set() {}
    };
    var getsetfab = {
      get: function get() {
        return fab;
      },
      set: function set() {}
    }; // redefined Fab data properties which if 'FuckAdBlock' variable exists

    if (Object.prototype.hasOwnProperty.call(window, 'FuckAdBlock')) {
      window.FuckAdBlock = Fab;
    } else {
      // or redefined Fab accessor properties
      Object.defineProperty(window, 'FuckAdBlock', getSetFab);
    }

    if (Object.prototype.hasOwnProperty.call(window, 'BlockAdBlock')) {
      window.BlockAdBlock = Fab;
    } else {
      Object.defineProperty(window, 'BlockAdBlock', getSetFab);
    }

    if (Object.prototype.hasOwnProperty.call(window, 'SniffAdBlock')) {
      window.SniffAdBlock = Fab;
    } else {
      Object.defineProperty(window, 'SniffAdBlock', getSetFab);
    }

    if (Object.prototype.hasOwnProperty.call(window, 'fuckAdBlock')) {
      window.fuckAdBlock = fab;
    } else {
      Object.defineProperty(window, 'fuckAdBlock', getsetfab);
    }

    if (Object.prototype.hasOwnProperty.call(window, 'blockAdBlock')) {
      window.blockAdBlock = fab;
    } else {
      Object.defineProperty(window, 'blockAdBlock', getsetfab);
    }

    if (Object.prototype.hasOwnProperty.call(window, 'sniffAdBlock')) {
      window.sniffAdBlock = fab;
    } else {
      Object.defineProperty(window, 'sniffAdBlock', getsetfab);
    }
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
  };
        const updatedArgs = args ? [].concat(source).concat(args) : [source];
        preventFab.apply(this, updatedArgs);
    
})({"name":"prevent-fab-3.2.0","args":[]}, []);