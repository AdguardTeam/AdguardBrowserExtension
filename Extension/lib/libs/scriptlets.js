
/**
 * AdGuard Scriptlets
 * Version 1.0.0
 */

(function () {
    function log () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      console.log(args);
    }



    var dependencies = /*#__PURE__*/Object.freeze({
        log: log
    });

    /**
     * Concat dependencies to scriptlet code
     * @param {string} scriptlet string view of scriptlet
     */

    function attachdependencies(scriptlet) {
      var scriptletDeps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      return scriptletDeps.reduce(function (accum, dep) {
        return accum += dependencies[dep.name];
      }, scriptlet);
    }
    /**
     * Wrap function into IIFE
     * @param {Function} func injectable function
     * @param  {...any} args arguments for function
     */


    function wrapInIIFE(func, args) {
      return '"use strict";(' + func + ')(' + args.map(JSON.stringify).join(',') + ');';
    }
    /**
     * Add dependencies code to scriptlet
     * @param {Function} scriptlet scriptlet function
     */


    function resolveDependencies(scriptlet) {
      return function (args) {
        return attachdependencies(wrapInIIFE(scriptlet, args), scriptlet.injections);
      };
    }

    /**
     * Test function to check is scriptlet works
     * Log an array of passed arguments
     * @param {string} args test arguments
     */

    function test() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      log(args);
    }

    test.injections = [log];



    var scriptletList = /*#__PURE__*/Object.freeze({
        test: test
    });

    /**
     * Global scriptlet variable
     */

    scriptlets = function () {
      /**
       * Public method to run scriptlet execution
       * 
       * @param {Object} data params object
       * @property {string}  data.name Scriptlets name
       * @property {'extension'|'corelibs'}  data.engine Platform where scriptlet will be executed
       * @property {string}  data.version Engine version
       * @property {Function}  data.hit This function needs to be called when scriptlet was executed and done its work
       * @property {Array<string>}  data.args Arguments which need to pass in scriptlet
       */
      var invoke = function invoke(data) {
        if (!data.name) {
          return;
        }

        if (!scriptletList[data.name]) {
          return;
        }

        var result = resolveDependencies(scriptletList[data.name]);
        return result(data.args);
      };

      return {
        invoke: invoke
      };
    }();

}());

/**
 * -------------------------------------------
 * |                                         |
 * |  If you want to add your own scriptlet  |
 * |  please put your code below             |
 * |                                         |
 * -------------------------------------------
 */
