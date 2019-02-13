
/**
 * AdGuard Scriptlets
 * Version 1.0.0
 */

(function () {
    /**
     * Log args in standard output
     * @param  {any} args any args
     */
    function log() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      console.log(args);
    }

    /**
     * Generate random six symbols id
     */
    function randomId() {
      return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Set getter and setter to propety if it's configurable
     * @param {Object} object target object with proprty
     * @param {string} property property name
     * @param {Object} descriptor contains getter and setter functions
     * @returns {boolean} is operation successfull
     */
    function setPropertyAccess(object, property, descriptor) {
      var currentDescriptor = Object.getOwnPropertyDescriptor(object, property);

      if (currentDescriptor && !currentDescriptor.configurable) {
        return false;
      }

      Object.defineProperty(object, property, descriptor);
      return true;
    }

    /**
     * Check is passed property available in base object
     * @param {Object} base
     * @param {string} property
     * @returns {{base: Object, property: string}|boolean}
     */
    function getChainProperty(base, property) {
      var isPropertyExists = function isPropertyExists(base, prop) {
        try {
          if (base.hasOwnProperty(prop)) {
            base = base[prop];
            return true;
          }

          return false;
        } catch (e) {
          return false;
        }
      };

      var getPathArray = function getPathArray(property) {
        return property.split('.');
      };

      var currentBase = base;
      var pathOk = true;
      var path = getPathArray(property);

      for (var i = 0; i < path.length - 1; i++) {
        if (isPropertyExists(currentBase, path[i])) {
          currentBase = currentBase[path[i]];
        } else {
          pathOk = false;
          break;
        }
      }

      var lastProp = path[path.length - 1];
      pathOk = pathOk && isPropertyExists(currentBase, lastProp);
      return pathOk ? {
        base: currentBase,
        property: lastProp
      } : false;
    }

    /**
     * This file must export all used dependencies
     */

    var dependencies = /*#__PURE__*/Object.freeze({
        log: log,
        randomId: randomId,
        setPropertyAccess: setPropertyAccess,
        getChainProperty: getChainProperty
    });

    /**
     * Test function to check is scriptlet works
     * Log an array of passed arguments
     * @param {string} args test arguments
     */

    function testLog() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      log(args);
    }

    testLog.sName = 'test-log';
    testLog.injections = [log];

    /**
     * Abort access to property if exists
     * @param {string} property propery name
     */

    function abortOnPropertyRead(source, property) {
      var rid = randomId();

      if (!property) {
        return;
      }

      var descriptor = {
        get: function get() {
          source.hit && source.hit();
          throw new ReferenceError(rid);
        },
        set: function set() {}
      };
      var chain = getChainProperty(window, property);

      if (!chain) {
        return;
      }

      setPropertyAccess(chain.base, chain.property, descriptor);
    }

    abortOnPropertyRead.sName = 'abort-on-property-read';
    abortOnPropertyRead.injections = [randomId, setPropertyAccess, getChainProperty];

    /**
     * This file must export all scriptlets which should be accessible
     */

    var scriptletList = /*#__PURE__*/Object.freeze({
        testLog: testLog,
        abortOnPropertyRead: abortOnPropertyRead
    });

    /**
     * Concat dependencies to scriptlet code
     * @param {string} scriptlet string view of scriptlet
     */

    function attachdependencies(scriptlet) {
      return scriptlet.injections.reduce(function (accum, dep) {
        return accum += '\n' + dependencies[dep.name];
      }, scriptlet.toString());
    }
    /**
     * Add scriptlet call to existing code
     * @param {Add } scriptlet 
     */

    function addScriptletCall(scriptlet, code) {
      return "".concat(code, "\n").concat(scriptlet.name, "(source, args.join(','))");
    }
    /**
     * Wrap function into IIFE
     * @param {Function} func injectable function
     * @param  {...any} args arguments for function
     */

    function wrapInIIFE(source, code) {
      var sourcString = JSON.stringify(source);
      var argsString = "[".concat(source.args.map(JSON.stringify), "]");
      return "(function(source, args){\n".concat(code, "\n})(").concat(sourcString, ", ").concat(argsString, ")");
    }
    /**
     * Wrap code in no name function
     * @param {string} code which must be wrapped
     */

    function wrapInNonameFunc(code) {
      return "function(source, args){\n".concat(code, "\n}");
    }
    /**
     * Check is scriptlet params valid
     * @param {Object} source 
     */

    function isValidScriptletSource(source) {
      if (!source.name) {
        return false;
      }

      var scriptlet = getScriptletByName(source.name);

      if (!scriptlet) {
        return false;
      }

      return true;
    }
    /**
     * Find scriptlet by it's name
     * @param {string} name 
     */

    function getScriptletByName(name) {
      return Object.values(scriptletList).find(function (s) {
        return s.sName === name;
      });
    }
    /**
    * Returns scriptlet code by params
    * 
    * @param {Object} source params object
    * @property {string}  source.name Scriptlets name
    * @property {'extension'|'corelibs'}  source.engine Platform where scriptlet will be executed
    * @property {string}  source.version Engine version
    * @property {Function}  source.hit This function needs to be called when scriptlet was executed and done its work
    * @property {Array<string>}  source.args Arguments which need to pass in scriptlet
    */

    function getScriptletCode(source) {
      if (!isValidScriptletSource(source)) {
        return;
      }

      var scriptlet = getScriptletByName(source.name);
      var result = attachdependencies(scriptlet);
      result = addScriptletCall(scriptlet, result);
      result = source.engine === 'corelibs' ? wrapInNonameFunc(result) : wrapInIIFE(source, result);
      return result;
    }

    /**
     * Global scriptlet variable
     */

    scriptlets = function () {
      return {
        invoke: getScriptletCode
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
//# sourceMappingURL=scriptlets.js.map
