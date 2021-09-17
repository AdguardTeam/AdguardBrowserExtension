(function(source, args){
function metrikaYandexTag(source) {
    var asyncCallbackFromOptions = function asyncCallbackFromOptions(param) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var callback = options.callback;
      var ctx = options.ctx;

      if (typeof callback === 'function') {
        callback = ctx !== undefined ? callback.bind(ctx) : callback;
        setTimeout(function () {
          return callback();
        });
      }
    };

    var init = noopFunc;
    /**
     * https://yandex.ru/support/metrica/objects/addfileextension.html
     */

    var addFileExtension = noopFunc;
    /**
     * https://yandex.ru/support/metrica/objects/extlink.html
     */

    var extLink = asyncCallbackFromOptions;
    /**
     * https://yandex.ru/support/metrica/objects/file.html
     */

    var file = asyncCallbackFromOptions;
    /**
     * https://yandex.ru/support/metrica/objects/get-client-id.html
     * @param {Function} cb
     */

    var getClientID = function getClientID(cb) {
      setTimeout(cb(null));
    };
    /**
     * https://yandex.ru/support/metrica/objects/hit.html
     */


    var hitFunc = asyncCallbackFromOptions;
    /**
     * https://yandex.ru/support/metrica/objects/notbounce.html
     */

    var notBounce = asyncCallbackFromOptions;
    /**
     * https://yandex.ru/support/metrica/objects/params-method.html
     */

    var params = noopFunc;
    /**
     * https://yandex.ru/support/metrica/objects/reachgoal.html
     * @param {string} target
     * @param {Object} params
     * @param {Function} callback
     * @param {any} ctx
     */

    var reachGoal = function reachGoal(target, params, callback, ctx) {
      asyncCallbackFromOptions(null, {
        callback: callback,
        ctx: ctx
      });
    };
    /**
     * https://yandex.ru/support/metrica/objects/set-user-id.html
     */


    var setUserID = noopFunc;
    /**
     * https://yandex.ru/support/metrica/objects/user-params.html
     */

    var userParams = noopFunc;
    var api = {
      init: init,
      addFileExtension: addFileExtension,
      extLink: extLink,
      file: file,
      getClientID: getClientID,
      hit: hitFunc,
      notBounce: notBounce,
      params: params,
      reachGoal: reachGoal,
      setUserID: setUserID,
      userParams: userParams
    };

    function ym(id, funcName) {
      for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
      }

      return api[funcName] && api[funcName].apply(api, args);
    }

    window.ym = ym;
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
        metrikaYandexTag.apply(this, updatedArgs);
    
})({"name":"metrika-yandex-tag","args":[]}, []);