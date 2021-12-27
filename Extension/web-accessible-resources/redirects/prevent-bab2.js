(function(source, args){
function preventBab2(source) {
    // eslint-disable-next-line compat/compat
    var script = document.currentScript;

    if (script === null) {
      return;
    }

    var url = script.src;

    if (typeof url !== 'string') {
      return;
    }

    var domainsStr = ['adclixx\\.net', 'adnetasia\\.com', 'adtrackers\\.net', 'bannertrack\\.net'].join('|');
    var matchStr = "^https?://[\\w-]+\\.(".concat(domainsStr, ")/.");
    var domainsRegex = new RegExp(matchStr);

    if (domainsRegex.test(url) === false) {
      return;
    }

    window.nH7eXzOsG = 858;
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
  };
        const updatedArgs = args ? [].concat(source).concat(args) : [source];
        try {
            preventBab2.apply(this, updatedArgs);
        } catch (e) {
            console.log(e);
        }
    
})({"name":"prevent-bab2","args":[]}, []);