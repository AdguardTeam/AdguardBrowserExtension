
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
     * Set getter and setter to property if it's configurable
     * @param {Object} object target object with property
     * @param {string} property property name
     * @param {Object} descriptor contains getter and setter functions
     * @returns {boolean} is operation successful
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
     * TODO think about nested dependecies, but be carefull with dependency loops
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

    /* eslint-disable no-new-func */
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

      var hit = source.hit ? new Function(source.hit) : function () {};
      var rid = randomId();

      var abort = function abort() {
        hit();
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

    /* eslint-disable no-new-func */
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

      var hit = source.hit ? new Function(source.hit) : function () {};
      var rid = randomId();

      var abort = function abort() {
        hit();
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

    function preventSetTimeout(source, match, delay) {
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
    preventSetTimeout.names = ['prevent-setTimeout', 'ubo-setTimeout-defuser.js'];
    preventSetTimeout.injections = [toRegExp];

    /* eslint-disable no-new-func */
    /**
     * Prevent calls to setInterval for specified matching in passed callback and delay
     * by setting callback to empty function
     *
     * @param {Source} source
     * @param {string|RegExp} match matching in string of callback function
     * @param {string|number} interval matching interval
     */

    function preventSetInterval(source, match, interval) {
      var hit = source.hit ? new Function(source.hit) : function () {};
      var nativeInterval = window.setInterval;
      interval = parseInt(interval, 10);
      interval = Number.isNaN(interval) ? null : interval;
      match = match ? toRegExp(match) : toRegExp('/.?/');

      var intervalWrapper = function intervalWrapper(cb, d) {
        if ((!interval || d === interval) && match.test(cb.toString())) {
          hit();
          return nativeInterval(function () {}, d);
        }

        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        return nativeInterval.apply(window, [cb, d].concat(args));
      };

      window.setInterval = intervalWrapper;
    }
    preventSetInterval.names = ['prevent-setInterval', 'ubo-setInterval-defuser.js'];
    preventSetInterval.injections = [toRegExp];

    /* eslint-disable no-new-func */
    /**
     * Prevent calls `window.open` when URL match or not match with passed params
     * @param {Source} source
     * @param {number|string} [inverse] inverse matching
     * @param {string} [match] matching with URL
     */

    function preventWindowOpen(source) {
      var inverse = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var match = arguments.length > 2 ? arguments[2] : undefined;
      var nativeOpen = window.open;
      var hit = source.hit ? new Function(source.hit) : function () {};
      inverse = inverse ? !+inverse : inverse;
      match = match ? toRegExp(match) : toRegExp('/.?/'); // eslint-disable-next-line consistent-return

      var openWrapper = function openWrapper(str) {
        if (inverse === match.test(str)) {
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          return nativeOpen.apply(window, [str].concat(args));
        }

        hit();
      };

      window.open = openWrapper;
    }
    preventWindowOpen.names = ['prevent-window-open', 'ubo-window.open-defuser.js'];
    preventWindowOpen.injections = [toRegExp];

    /* eslint-disable no-new-func */
    function abortCurrentInlineScript(source, property) {
      var _this = this;

      var search = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var regex = search ? toRegExp(search) : null;
      var rid = randomId();
      var hit = source.hit ? new Function(source.hit) : function () {};

      var getCurrentScript = function getCurrentScript() {
        if (!document.currentScript) {
          var scripts = document.getElementsByTagName('script');
          return scripts[scripts.length - 1];
        }

        return document.currentScript;
      };

      var ourScript = getCurrentScript();

      var abort = function abort() {
        var scriptEl = getCurrentScript();

        if (scriptEl instanceof HTMLScriptElement && scriptEl.textContent.length > 0 && scriptEl !== ourScript && (!regex || regex.test(scriptEl.textContent))) {
          hit();
          throw new ReferenceError(rid);
        }
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
          set: function set(value) {
            abort();
            base = value;
          },
          get: function get() {
            abort();
            return base;
          }
        });
      };

      setChainPropAccess(window, property);
      var onerrorOriginal = window.onerror; // eslint-disable-next-line consistent-return

      window.onerror = function (error) {
        if (typeof error === 'string' && error.indexOf(rid) !== -1) {
          return true;
        }

        if (onerrorOriginal instanceof Function) {
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          return onerrorOriginal.apply(_this, [error].concat(args));
        }
      };
    }
    abortCurrentInlineScript.names = ['abort-current-inline-script', 'ubo-abort-current-inline-script.js', 'abp-abort-current-inline-script'];
    abortCurrentInlineScript.injections = [randomId, setPropertyAccess, getPropertyInChain, toRegExp];

    /* eslint-disable no-new-func */
    function setConstant(source, property, value) {
      if (!property) {
        return;
      }

      var constantValue;

      if (value === 'undefined') {
        constantValue = undefined;
      } else if (value === 'false') {
        constantValue = false;
      } else if (value === 'true') {
        constantValue = true;
      } else if (value === 'null') {
        constantValue = null;
      } else if (value === 'noopFunc') {
        constantValue = function constantValue() {};
      } else if (value === 'trueFunc') {
        constantValue = function constantValue() {
          return true;
        };
      } else if (value === 'falseFunc') {
        constantValue = function constantValue() {
          return false;
        };
      } else if (/^\d+$/.test(value)) {
        constantValue = parseFloat(value);

        if (Number.isNaN(constantValue)) {
          return;
        }

        if (Math.abs(constantValue) > 0x7FFF) {
          return;
        }
      } else if (value === '') {
        constantValue = '';
      } else {
        return;
      }

      var hit = source.hit ? new Function(source.hit) : function () {};
      var canceled = false;

      var mustCancel = function mustCancel(value) {
        if (canceled) {
          return canceled;
        }

        canceled = value !== undefined && constantValue !== undefined && typeof value !== typeof constantValue;
        return canceled;
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

        if (mustCancel(base[prop])) {
          return;
        }

        hit();
        setPropertyAccess(base, prop, {
          get: function get() {
            return constantValue;
          },
          set: function set(a) {
            if (mustCancel(a)) {
              constantValue = a;
            }
          }
        });
      };

      setChainPropAccess(window, property);
    }
    setConstant.names = ['set-constant', 'ubo-set-constant.js'];
    setConstant.injections = [getPropertyInChain, setPropertyAccess];

    /* eslint-disable no-new-func */
    /**
     * Prevents adding event listeners
     *
     * @param {Source} source
     * @param {string|RegExp} [event] - event name or regexp matching event name
     * @param {string|RegExp} [funcStr] - string or regexp matching stringified handler function
     */

    function preventAddEventListener(source, event, funcStr) {
      var hit = source.hit ? new Function(source.hit) : function () {};
      event = event ? toRegExp(event) : toRegExp('/.?/');
      funcStr = funcStr ? toRegExp(funcStr) : toRegExp('/.?/');
      var nativeAddEventListener = window.EventTarget.prototype.addEventListener;

      function addEventListenerWrapper(eventName, callback) {
        if (event.test(eventName.toString()) && funcStr.test(callback.toString())) {
          hit();
          return undefined;
        }

        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        return nativeAddEventListener.apply(this, [eventName, callback].concat(args));
      }

      window.EventTarget.prototype.addEventListener = addEventListenerWrapper;
    }
    preventAddEventListener.names = ['prevent-addEventListener', 'ubo-addEventListener-defuser.js'];
    preventAddEventListener.injections = [toRegExp];

    /* eslint-disable no-new-func, consistent-return, no-eval */

    /**
     * Prevents BlockAdblock
     *
     * @param {Source} source
     */
    function preventBab(source) {
      var _this = this;

      var hit = source.hit ? new Function(source.hit) : function () {};
      var nativeSetTimeout = window.setTimeout;
      var babRegex = /\.bab_elementid.$/;

      window.setTimeout = function (callback) {
        if (typeof callback !== 'string' || !babRegex.test(callback)) {
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          return nativeSetTimeout.call.apply(nativeSetTimeout, [_this, callback].concat(args));
        }

        hit();
      };

      var signatures = [['blockadblock'], ['babasbm'], [/getItem\('babn'\)/], ['getElementById', 'String.fromCharCode', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 'charAt', 'DOMContentLoaded', 'AdBlock', 'addEventListener', 'doScroll', 'fromCharCode', '<<2|r>>4', 'sessionStorage', 'clientWidth', 'localStorage', 'Math', 'random']];

      var check = function check(str) {
        for (var i = 0; i < signatures.length; i += 1) {
          var tokens = signatures[i];
          var match = 0;

          for (var j = 0; j < tokens.length; j += 1) {
            var token = tokens[j];
            var found = token instanceof RegExp ? token.test(str) : str.includes(token);

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

      window.eval = function (str) {
        if (!check(str)) {
          return nativeEval(str);
        }

        hit();
        var bodyEl = document.body;

        if (bodyEl) {
          bodyEl.style.removeProperty('visibility');
        }

        var el = document.getElementById('babasbmsgx');

        if (el) {
          el.parentNode.removeChild(el);
        }
      };
    }
    preventBab.names = ['prevent-bab', 'ubo-bab-defuser.js'];

    /**
     * This file must export all scriptlets which should be accessible
     */

    var scriptletList = /*#__PURE__*/Object.freeze({
        log: log,
        abortOnPropertyRead: abortOnPropertyRead,
        abortOnPropertyWrite: abortOnPropertyWrite,
        preventSetTimeout: preventSetTimeout,
        preventSetInterval: preventSetInterval,
        preventWindowOpen: preventWindowOpen,
        abortCurrentInlineScript: abortCurrentInlineScript,
        setConstant: setConstant,
        preventAddEventListener: preventAddEventListener,
        preventBab: preventBab
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
      return "".concat(code, ";\n        const updatedArgs = args ? [].concat(source).concat(args) : [source];\n        ").concat(scriptlet.name, ".apply(this, updatedArgs);\n    ");
    }
    /**
     * Wrap function into IIFE
     * @param {Source} source
     * @param {string} code
     */

    function wrapInIIFE(source, code) {
      if (source.hit) {
        source.hit = "(".concat(source.hit.toString(), ")()");
      }

      var sourceString = JSON.stringify(source);
      var argsString = source.args ? "[".concat(source.args.map(JSON.stringify), "]") : undefined;
      var params = argsString ? "".concat(sourceString, ", ").concat(argsString) : sourceString;
      return "(function(source, args){\n".concat(code, "\n})(").concat(params, ");");
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
