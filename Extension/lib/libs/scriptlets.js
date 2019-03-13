
/**
 * AdGuard Scriptlets
 * Version 1.0.0
 */

(function () {
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
     * @typedef Chain
     * @property {Object} base
     * @property {string} prop
     * @property {string} [chain]
     */

    /**
     * Check is property exist in base object recursively
     *
     * If property doesn't exist in base object
     * defines this property and returns base, property name and remaining part of property chain
     *
     * @param {Object} base
     * @param {string} chain
     * @returns {Chain}
     */
    function getPropertyInChain(base, chain) {
      var pos = chain.indexOf('.');

      if (pos === -1) {
        return {
          base: base,
          prop: chain
        };
      }

      var prop = chain.slice(0, pos);
      var own = base[prop];
      chain = chain.slice(pos + 1);

      if (own !== undefined) {
        return getPropertyInChain(own, chain);
      }

      Object.defineProperty(base, prop, {
        configurable: true
      });
      return {
        base: own,
        prop: prop,
        chain: chain
      };
    }

    /**
     * Escapes special chars in string
     * @param {string} str
     * @returns {string}
     */
    var escapeRegExp = function escapeRegExp(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    /**
     * Converts search string to the regexp
     * TODO think about nested dependecies, but be carefull with cicle deps
     * @param {string} str search string
     * @returns {RegExp}
     */

    var toRegExp = function toRegExp(str) {
      if (str[0] === '/' && str[str.length - 1] === '/') {
        return new RegExp(str.slice(1, -1));
      }

      var escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(escaped);
    };

    /**
     * This file must export all used dependencies
     */

    var dependencies = /*#__PURE__*/Object.freeze({
        randomId: randomId,
        setPropertyAccess: setPropertyAccess,
        getPropertyInChain: getPropertyInChain,
        escapeRegExp: escapeRegExp,
        toRegExp: toRegExp
    });

    /**
     * Log an array of passed arguments
     * @param {string} args test arguments
     */
    function log() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      console.log(args); // eslint-disable-line no-console
    }
    log.names = ['log'];

    /**
     * Abort property reading even if it doesn't exist in execution moment
     *
     * @param {Source} source
     * @param {string} property propery name
     */

    function abortOnPropertyRead(source, property) {
      if (!property) {
        return;
      }

      var rid = randomId();

      var abort = function abort() {
        if (source.hit) {
          source.hit();
        }

        throw new ReferenceError(rid);
      };

      var setChainPropAccess = function setChainPropAccess(owner, property) {
        var chainInfo = getPropertyInChain(owner, property);
        var base = chainInfo.base;
        var prop = chainInfo.prop,
            chain = chainInfo.chain;

        if (chain) {
          var setter = function setter(a) {
            base = a;

            if (a instanceof Object) {
              setChainPropAccess(a, chain);
            }
          };

          Object.defineProperty(owner, prop, {
            get: function get() {
              return base;
            },
            set: setter
          });
          return;
        }

        setPropertyAccess(base, prop, {
          get: abort,
          set: function set() {}
        });
      };

      setChainPropAccess(window, property);
    }
    abortOnPropertyRead.names = ['abort-on-property-read', 'ubo-abort-on-property-read.js', 'abp-abort-on-property-read'];
    abortOnPropertyRead.injections = [randomId, setPropertyAccess, getPropertyInChain];

    /**
     * Abort property writing
     *
     * @param {Source} source
     * @param {string} property propery name
     */

    function abortOnPropertyWrite(source, property) {
      if (!property) {
        return;
      }

      var rid = randomId();

      var abort = function abort() {
        if (source.hit) {
          source.hit();
        }

        throw new ReferenceError(rid);
      };

      var setChainPropAccess = function setChainPropAccess(owner, property) {
        var chainInfo = getPropertyInChain(owner, property);
        var base = chainInfo.base;
        var prop = chainInfo.prop,
            chain = chainInfo.chain;

        if (chain) {
          var setter = function setter(a) {
            base = a;

            if (a instanceof Object) {
              setChainPropAccess(a, chain);
            }
          };

          Object.defineProperty(owner, prop, {
            get: function get() {
              return base;
            },
            set: setter
          });
          return;
        }

        setPropertyAccess(base, prop, {
          set: abort
        });
      };

      setChainPropAccess(window, property);
    }
    abortOnPropertyWrite.names = ['abort-on-property-write', 'ubo-abort-on-property-write.js', 'abp-abort-on-property-write'];
    abortOnPropertyWrite.injections = [randomId, setPropertyAccess, getPropertyInChain];

    /* eslint-disable no-new-func */
    /**
     * Prevent calls to setTimeout for specified matching in passed callback and delay
     * by setting callback to empty function
     *
     * @param {Source} source
     * @param {string|RegExp} match matching in string of callback function
     * @param {string|number} delay matching delay
     */

    function setTimeoutDefuser(source, match, delay) {
      var hit = source.hit ? new Function(source.hit) : function () {};
      var nativeTimeout = window.setTimeout;
      delay = parseInt(delay, 10);
      delay = Number.isNaN(delay) ? null : delay;
      match = match ? toRegExp(match) : toRegExp('/.?/');

      var timeoutWrapper = function timeoutWrapper(cb, d) {
        if ((!delay || d === delay) && match.test(cb.toString())) {
          hit();
          return nativeTimeout(function () {}, d);
        }

        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        return nativeTimeout.apply(window, [cb, d].concat(args));
      };

      window.setTimeout = timeoutWrapper;
    }
    setTimeoutDefuser.names = ['prevent-setTimeout', 'ubo-setTimeout-defuser.js'];
    setTimeoutDefuser.injections = [toRegExp];

    /**
     * This file must export all scriptlets which should be accessible
     */

    var scriptletList = /*#__PURE__*/Object.freeze({
        log: log,
        abortOnPropertyRead: abortOnPropertyRead,
        abortOnPropertyWrite: abortOnPropertyWrite,
        setTimeoutDefuser: setTimeoutDefuser
    });

    /**
     * Concat dependencies to scriptlet code
     * @param {string} scriptlet string view of scriptlet
     */

    function attachDependencies(scriptlet) {
      var _scriptlet$injections = scriptlet.injections,
          injections = _scriptlet$injections === void 0 ? [] : _scriptlet$injections;
      return injections.reduce(function (accum, dep) {
        return "".concat(accum, "\n").concat(dependencies[dep.name]);
      }, scriptlet.toString());
    }
    /**
     * Add scriptlet call to existing code
     * @param {Function} scriptlet
     * @param {string} code
     */

    function addScriptletCall(scriptlet, code) {
      return "".concat(code, "\n").concat(scriptlet.name, "(source, args.join(','))");
    }
    /**
     * Wrap function into IIFE
     * @param {Source} source
     * @param {string} code
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
     * Find scriptlet by it's name
     * @param {string} name
     */

    function getScriptletByName(name) {
      return Object.values(scriptletList).find(function (s) {
        return s.names && s.names.includes(name);
      });
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
    * Returns scriptlet code by param
    * @param {Source} source
    */

    function getScriptletCode(source) {
      if (!isValidScriptletSource(source)) {
        return null;
      }

      var scriptlet = getScriptletByName(source.name);
      var result = attachDependencies(scriptlet);
      result = addScriptletCall(scriptlet, result);
      result = source.engine === 'corelibs' ? wrapInNonameFunc(result) : wrapInIIFE(source, result);
      return result;
    }

    /**
     * @typedef {Object} Source
     * @property {string} name Scriptlet name
     * @property {Array<string>} args Arguments for scriptlet function
     * @property {'extension'|'corelibs'} engine Defines the final form of scriptlet string presentation
     * @property {string} [version]
     * @property {Function} [hit] Will be executed when target action is triggered
     */

    /**
     * Global scriptlet variable
     *
     * @returns {Object} object with method `invoke`
     * `invoke` method recieves one argument with `Source` type
     */

    scriptlets = function () {
      return {
        invoke: getScriptletCode
      };
    }(); // eslint-disable-line no-undef

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
