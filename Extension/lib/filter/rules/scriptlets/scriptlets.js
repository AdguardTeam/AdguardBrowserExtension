
/**
 * AdGuard Scriptlets
 * Version 1.3.0
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
     * Check if the property exists in the base object (recursively)
     *
     * If property doesn't exist in base object,
     * defines this property as 'undefined'
     * and returns base, property name and remaining part of property chain
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
      var nextBase = base[prop];
      chain = chain.slice(pos + 1);

      if (nextBase !== undefined) {
        return getPropertyInChain(nextBase, chain);
      }

      Object.defineProperty(base, prop, {
        configurable: true
      });
      return {
        base: nextBase,
        prop: prop,
        chain: chain
      };
    }

    /**
     * @typedef Chain
     * @property {Object} base
     * @property {string} prop
     * @property {string} [chain]
     */

    /**
     * Check if the property exists in the base object (recursively).
     * Similar to getPropertyInChain but upgraded for json-prune:
     * handle wildcard properties and does not define nonexistent base property as 'undefined'
     *
     * @param {Object} base
     * @param {string} chain
     * @param {boolean} [lookThrough=false]
     * should the method look through it's props in order to wildcard
     * @param {Array} [output=[]] result acc
     * @returns {Chain[]} array of objects
     */
    function getWildcardPropertyInChain(base, chain) {
      var lookThrough = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var output = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
      var pos = chain.indexOf('.');

      if (pos === -1) {
        // for paths like 'a.b.*' every final nested prop should be processed
        if (chain === '*') {
          Object.keys(base).forEach(function (key) {
            output.push({
              base: base,
              prop: key
            });
          });
        } else {
          output.push({
            base: base,
            prop: chain
          });
        }

        return output;
      }

      var prop = chain.slice(0, pos);
      var shouldLookThrough = prop === '[]' && Array.isArray(base) || prop === '*' && base instanceof Object;

      if (shouldLookThrough) {
        var nextProp = chain.slice(pos + 1);
        var baseKeys = Object.keys(base); // if there is a wildcard prop in input chain (e.g. 'ad.*.src' for 'ad.0.src ad.1.src'),
        // each one of base keys should be considered as a potential chain prop in final path

        baseKeys.forEach(function (key) {
          var item = base[key];
          getWildcardPropertyInChain(item, nextProp, lookThrough, output);
        });
      }

      var nextBase = base[prop];
      chain = chain.slice(pos + 1);

      if (nextBase !== undefined) {
        getWildcardPropertyInChain(nextBase, chain, lookThrough, output);
      }

      return output;
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
     * TODO think about nested dependencies, but be careful with dependency loops
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
     * Get string before regexp first match
     * @param {string} str
     * @param {RegExp} rx
     */

    var getBeforeRegExp = function getBeforeRegExp(str, rx) {
      var index = str.search(rx);
      return str.substring(0, index);
    };
    var startsWith = function startsWith(str, prefix) {
      return str && str.indexOf(prefix) === 0;
    };
    var endsWith = function endsWith(str, prefix) {
      return str && str.indexOf(prefix) === str.length - 1;
    };
    var substringAfter = function substringAfter(str, separator) {
      if (!str) {
        return str;
      }

      var index = str.indexOf(separator);
      return index < 0 ? '' : str.substring(index + separator.length);
    };
    var substringBefore = function substringBefore(str, separator) {
      if (!str || !separator) {
        return str;
      }

      var index = str.indexOf(separator);
      return index < 0 ? str : str.substring(0, index);
    };
    /**
     * Wrap str in single qoutes and replaces single quotes to doudle one
     * @param {string} str
     */

    var wrapInSingleQuotes = function wrapInSingleQuotes(str) {
      if (str[0] === '\'' && str[str.length - 1] === '\'' || str[0] === '"' && str[str.length - 1] === '"') {
        str = str.substring(1, str.length - 1);
      } // eslint-disable-next-line no-useless-escape


      str = str.replace(/\'/g, '"');
      return "'".concat(str, "'");
    };
    /**
     * Returns substring enclosed in the widest braces
     * @param {string} str
     */

    var getStringInBraces = function getStringInBraces(str) {
      var firstIndex = str.indexOf('(');
      var lastIndex = str.lastIndexOf(')');
      return str.substring(firstIndex + 1, lastIndex);
    };

    /**
     * Generates function which silents global errors on page generated by scriptlet
     * If error doesn't belong to our error we transfer it to the native onError handler
     * @param {string} rid - unique identifier of scriptlet
     * @return {onError}
     */
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

    /**
     * Noop function
     */
    var noopFunc = function noopFunc() {};
    /**
     * Function returns null
     */

    var noopNull = function noopNull() {
      return null;
    };
    /**
     * Function returns true
     */

    var trueFunc = function trueFunc() {
      return true;
    };
    /**
     * Function returns false
     */

    var falseFunc = function falseFunc() {
      return false;
    };
    /**
     * Function returns this
     */

    function noopThis() {
      return this;
    }
    /**
     * Function returns empty array
     */

    var noopArray = function noopArray() {
      return [];
    };
    /**
     * Function returns empty string
     */

    var noopStr = function noopStr() {
      return '';
    };

    /* eslint-disable no-console, no-underscore-dangle */

    /**
     * Hit used only for debug purposes now
     * @param {Source} source
     * @param {string} [message] - optional message;
     * use LOG_MARKER = 'log: ' at the start of a message
     * for logging scriptlets
     */
    var hit = function hit(source, message) {
      if (source.verbose !== true) {
        return;
      }

      try {
        var log = console.log.bind(console);
        var trace = console.trace.bind(console);
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

    /**
     * DOM tree changes observer. Used for 'remove-attr' and 'remove-class' scriptlets
     * @param {Function} callback
     * @param {Boolean} observeAttrs - optional parameter - should observer check attibutes changes
     */
    var observeDOMChanges = function observeDOMChanges(callback) {
      var observeAttrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var attrsToObserv = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

      /**
       * Returns a wrapper, passing the call to 'method' at maximum once per 'delay' milliseconds.
       * Those calls that fall into the "cooldown" period, are ignored
       * @param {Function} method
       * @param {Number} delay - milliseconds
       */
      var throttle = function throttle(method, delay) {
        var wait = false;
        var savedArgs;

        var wrapper = function wrapper() {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          if (wait) {
            savedArgs = args;
            return;
          }

          method.apply(void 0, args);
          wait = true;
          setTimeout(function () {
            wait = false;

            if (savedArgs) {
              wrapper(savedArgs);
              savedArgs = null;
            }
          }, delay);
        };

        return wrapper;
      };
      /**
       * 'delay' in milliseconds for 'throttle' method
       */


      var THROTTLE_DELAY_MS = 20;
      /**
       * Used for remove-class
       */
      // eslint-disable-next-line no-use-before-define

      var observer = new MutationObserver(throttle(callbackWrapper, THROTTLE_DELAY_MS));

      var connect = function connect() {
        if (attrsToObserv.length > 0) {
          observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: observeAttrs,
            attributeFilter: attrsToObserv
          });
        } else {
          observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: observeAttrs
          });
        }
      };

      var disconnect = function disconnect() {
        observer.disconnect();
      };

      function callbackWrapper() {
        disconnect();
        callback();
        connect();
      }

      connect();
    };

    /**
     * Checks if the stackTrace contains stackRegexp
     * // https://github.com/AdguardTeam/Scriptlets/issues/82
     * @param {string} stackRegexp - stack regexp
     * @param {string} stackTrace - script error stack trace
     * @returns {boolean}
     */
    var matchStackTrace = function matchStackTrace(stackRegexp, stackTrace) {
      var refinedStackTrace = stackTrace.split('\n').slice(2) // get rid of our own functions in the stack trace
      .map(function (line) {
        return line.trim();
      }) // trim the lines
      .join('\n');
      return stackRegexp.test(refinedStackTrace);
    };

    /**
     * Some browsers do not support Array.prototype.flat()
     * for example, Opera 42 which is used for browserstack tests
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
     * @param {Array} input
     */
    var flatten = function flatten(input) {
      var stack = [];
      input.forEach(function (el) {
        return stack.push(el);
      });
      var res = [];

      while (stack.length) {
        // pop value from stack
        var next = stack.pop();

        if (Array.isArray(next)) {
          // push back array items, won't modify the original input
          next.forEach(function (el) {
            return stack.push(el);
          });
        } else {
          res.push(next);
        }
      } // reverse to restore input order


      return res.reverse();
    };

    /**
     * This file must export all used dependencies
     */

    var dependencies = /*#__PURE__*/Object.freeze({
        __proto__: null,
        randomId: randomId,
        setPropertyAccess: setPropertyAccess,
        getPropertyInChain: getPropertyInChain,
        getWildcardPropertyInChain: getWildcardPropertyInChain,
        escapeRegExp: escapeRegExp,
        toRegExp: toRegExp,
        getBeforeRegExp: getBeforeRegExp,
        startsWith: startsWith,
        endsWith: endsWith,
        substringAfter: substringAfter,
        substringBefore: substringBefore,
        wrapInSingleQuotes: wrapInSingleQuotes,
        getStringInBraces: getStringInBraces,
        createOnErrorHandler: createOnErrorHandler,
        noopFunc: noopFunc,
        noopNull: noopNull,
        trueFunc: trueFunc,
        falseFunc: falseFunc,
        noopThis: noopThis,
        noopArray: noopArray,
        noopStr: noopStr,
        hit: hit,
        observeDOMChanges: observeDOMChanges,
        matchStackTrace: matchStackTrace,
        flatten: flatten
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

    function addCall(scriptlet, code) {
      return "".concat(code, ";\n        const updatedArgs = args ? [].concat(source).concat(args) : [source];\n        ").concat(scriptlet.name, ".apply(this, updatedArgs);\n    ");
    }
    /**
     * Wrap function into IIFE (Immediately invoked function expression)
     *
     * @param {Source} source - object with scriptlet properties
     * @param {string} code - scriptlet source code with dependencies
     *
     * @returns {string} full scriptlet code
     *
     * @example
     * const source = {
     *      args: ["aaa", "bbb"],
     *      name: 'noeval',
     * };
     * const code = "function noeval(source, args) { alert(source); } noeval.apply(this, args);"
     * const result = wrapInIIFE(source, code);
     *
     * // result
     * `(function(source, args) {
     *      function noeval(source) { alert(source); }
     *      noeval.apply(this, args);
     * )({"args": ["aaa", "bbb"], "name":"noeval"}, ["aaa", "bbb"])`
     */

    function passSourceAndProps(source, code) {
      if (source.hit) {
        source.hit = source.hit.toString();
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

    function _arrayWithHoles(arr) {
      if (Array.isArray(arr)) return arr;
    }

    var arrayWithHoles = _arrayWithHoles;

    function _iterableToArrayLimit(arr, i) {
      if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"] != null) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    var iterableToArrayLimit = _iterableToArrayLimit;

    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;

      for (var i = 0, arr2 = new Array(len); i < len; i++) {
        arr2[i] = arr[i];
      }

      return arr2;
    }

    var arrayLikeToArray = _arrayLikeToArray;

    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === "string") return arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor) n = o.constructor.name;
      if (n === "Map" || n === "Set") return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return arrayLikeToArray(o, minLen);
    }

    var unsupportedIterableToArray = _unsupportedIterableToArray;

    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }

    var nonIterableRest = _nonIterableRest;

    function _slicedToArray(arr, i) {
      return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || unsupportedIterableToArray(arr, i) || nonIterableRest();
    }

    var slicedToArray = _slicedToArray;

    function _defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }

      return obj;
    }

    var defineProperty = _defineProperty;

    /**
     * Iterate over iterable argument and evaluate current state with transitions
     * @param {string} init first transition name
     * @param {Array|Collection|string} iterable
     * @param {Object} transitions transtion functions
     * @param {any} args arguments which should be passed to transition functions
     */
    function iterateWithTransitions(iterable, transitions, init, args) {
      var state = init || Object.keys(transitions)[0];

      for (var i = 0; i < iterable.length; i += 1) {
        state = transitions[state](iterable, i, args);
      }

      return state;
    }
    /**
     * AdGuard scriptlet rule mask
     */


    var ADG_SCRIPTLET_MASK = '#//scriptlet';
    /**
     * Helper to accumulate an array of strings char by char
     */

    var wordSaver = function wordSaver() {
      var str = '';
      var strs = [];

      var saveSymb = function saveSymb(s) {
        str += s;
        return str;
      };

      var saveStr = function saveStr() {
        strs.push(str);
        str = '';
      };

      var getAll = function getAll() {
        return [].concat(strs);
      };

      return {
        saveSymb: saveSymb,
        saveStr: saveStr,
        getAll: getAll
      };
    };

    var substringAfter$1 = function substringAfter(str, separator) {
      if (!str) {
        return str;
      }

      var index = str.indexOf(separator);
      return index < 0 ? '' : str.substring(index + separator.length);
    };
    /**
     * Parse and validate scriptlet rule
     * @param {*} ruleText
     * @returns {{name: string, args: Array<string>}}
     */


    var parseRule = function parseRule(ruleText) {
      var _transitions;

      ruleText = substringAfter$1(ruleText, ADG_SCRIPTLET_MASK);
      /**
       * Transition names
       */

      var TRANSITION = {
        OPENED: 'opened',
        PARAM: 'param',
        CLOSED: 'closed'
      };
      /**
       * Transition function: the current index position in start, end or between params
       * @param {string} rule
       * @param {number} index
       * @param {Object} Object
       * @property {Object} Object.sep contains prop symb with current separator char
       */

      var opened = function opened(rule, index, _ref) {
        var sep = _ref.sep;
        var char = rule[index];
        var transition;

        switch (char) {
          case ' ':
          case '(':
          case ',':
            {
              transition = TRANSITION.OPENED;
              break;
            }

          case '\'':
          case '"':
            {
              sep.symb = char;
              transition = TRANSITION.PARAM;
              break;
            }

          case ')':
            {
              transition = index === rule.length - 1 ? TRANSITION.CLOSED : TRANSITION.OPENED;
              break;
            }

          default:
            {
              throw new Error('The rule is not a scriptlet');
            }
        }

        return transition;
      };
      /**
       * Transition function: the current index position inside param
       * @param {string} rule
       * @param {number} index
       * @param {Object} Object
       * @property {Object} Object.sep contains prop `symb` with current separator char
       * @property {Object} Object.saver helper which allow to save strings by car by char
       */


      var param = function param(rule, index, _ref2) {
        var saver = _ref2.saver,
            sep = _ref2.sep;
        var char = rule[index];

        switch (char) {
          case '\'':
          case '"':
            {
              var preIndex = index - 1;
              var before = rule[preIndex];

              if (char === sep.symb && before !== '\\') {
                sep.symb = null;
                saver.saveStr();
                return TRANSITION.OPENED;
              }
            }
          // eslint-disable-next-line no-fallthrough

          default:
            {
              saver.saveSymb(char);
              return TRANSITION.PARAM;
            }
        }
      };

      var transitions = (_transitions = {}, defineProperty(_transitions, TRANSITION.OPENED, opened), defineProperty(_transitions, TRANSITION.PARAM, param), defineProperty(_transitions, TRANSITION.CLOSED, function () {}), _transitions);
      var sep = {
        symb: null
      };
      var saver = wordSaver();
      var state = iterateWithTransitions(ruleText, transitions, TRANSITION.OPENED, {
        sep: sep,
        saver: saver
      });

      if (state !== 'closed') {
        throw new Error("Invalid scriptlet rule ".concat(ruleText));
      }

      var args = saver.getAll();
      return {
        name: args[0],
        args: args.slice(1)
      };
    };

    /* eslint-disable max-len */

    /**
     * @scriptlet abort-on-property-read
     *
     * @description
     * Aborts a script when it attempts to **read** the specified property.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#abort-on-property-readjs-
     *
     * Related ABP source:
     * https://github.com/adblockplus/adblockpluscore/blob/6b2a309054cc23432102b85d13f12559639ef495/lib/content/snippets.js#L864
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('abort-on-property-read', property[, stack])
     * ```
     *
     * - `property` - required, path to a property (joined with `.` if needed). The property must be attached to `window`
     * - `stack` - optional, string or regular expression that must match the current function call stack trace
     *
     * **Examples**
     * ```
     * ! Aborts script when it tries to access `window.alert`
     * example.org#%#//scriptlet('abort-on-property-read', 'alert')
     *
     * ! Aborts script when it tries to access `navigator.language`
     * example.org#%#//scriptlet('abort-on-property-read', 'navigator.language')
     *
     * ! Aborts script when it tries to access `window.adblock` and it's error stack trace contains `test.js`
     * example.org#%#//scriptlet('abort-on-property-read', 'adblock', 'test.js')
     * ```
     */

    /* eslint-enable max-len */

    function abortOnPropertyRead(source, property, stack) {
      var stackRegexp = stack ? toRegExp(stack) : toRegExp('/.?/');

      if (!property || !matchStackTrace(stackRegexp, new Error().stack)) {
        return;
      }

      var rid = randomId();

      var abort = function abort() {
        hit(source);
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
      window.onerror = createOnErrorHandler(rid).bind();
    }
    abortOnPropertyRead.names = ['abort-on-property-read', // aliases are needed for matching the related scriptlet converted into our syntax
    'abort-on-property-read.js', 'ubo-abort-on-property-read.js', 'aopr.js', 'ubo-aopr.js', 'ubo-abort-on-property-read', 'ubo-aopr', 'abp-abort-on-property-read'];
    abortOnPropertyRead.injections = [randomId, toRegExp, setPropertyAccess, getPropertyInChain, createOnErrorHandler, hit, matchStackTrace];

    /* eslint-disable max-len */

    /**
     * @scriptlet abort-on-property-write
     *
     * @description
     * Aborts a script when it attempts to **write** the specified property.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#abort-on-property-writejs-
     *
     * Related ABP source:
     * https://github.com/adblockplus/adblockpluscore/blob/6b2a309054cc23432102b85d13f12559639ef495/lib/content/snippets.js#L896
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('abort-on-property-write', property[, stack])
     * ```
     *
     * - `property` - required, path to a property (joined with `.` if needed). The property must be attached to `window`
     * - `stack` - optional, string or regular expression that must match the current function call stack trace
     *
     * **Examples**
     * ```
     * ! Aborts script when it tries to set `window.adblock` value
     * example.org#%#//scriptlet('abort-on-property-write', 'adblock')
     *
     * ! Aborts script when it tries to set `window.adblock` value and it's error stack trace contains `checking.js`
     * example.org#%#//scriptlet('abort-on-property-write', 'adblock', 'checking.js')
     * ```
     */

    /* eslint-enable max-len */

    function abortOnPropertyWrite(source, property, stack) {
      var stackRegexp = stack ? toRegExp(stack) : toRegExp('/.?/');

      if (!property || !matchStackTrace(stackRegexp, new Error().stack)) {
        return;
      }

      var rid = randomId();

      var abort = function abort() {
        hit(source);
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
      window.onerror = createOnErrorHandler(rid).bind();
    }
    abortOnPropertyWrite.names = ['abort-on-property-write', // aliases are needed for matching the related scriptlet converted into our syntax
    'abort-on-property-write.js', 'ubo-abort-on-property-write.js', 'aopw.js', 'ubo-aopw.js', 'ubo-abort-on-property-write', 'ubo-aopw', 'abp-abort-on-property-write'];
    abortOnPropertyWrite.injections = [randomId, setPropertyAccess, getPropertyInChain, createOnErrorHandler, hit, toRegExp, matchStackTrace];

    /* eslint-disable max-len */

    /**
     * @scriptlet prevent-setTimeout
     *
     * @description
     * Prevents a `setTimeout` call if:
     * 1) the text of the callback is matching the specified search string/regexp which does not start with `!`;
     * otherwise mismatched calls should be defused;
     * 2) the timeout is matching the specified delay; otherwise mismatched calls should be defused.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#no-settimeout-ifjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('prevent-setTimeout'[, search[, delay]])
     * ```
     *
     * Call with no arguments will log calls to setTimeout while debugging (`log-setTimeout` superseding),
     * so production filter lists' rules definitely require at least one of the parameters:
     * - `search` - optional, string or regular expression.
     * If starts with `!`, scriptlet will not match the stringified callback but all other will be defused.
     * If do not start with `!`, the stringified callback will be matched.
     * If not set, prevents all `setTimeout` calls due to specified `delay`.
     * - `delay` - optional, must be an integer.
     * If starts with `!`, scriptlet will not match the delay but all other will be defused.
     * If do not start with `!`, the delay passed to the `setTimeout` call will be matched.
     *
     * **Examples**
     * 1. Prevents `setTimeout` calls if the callback matches `/\.test/` regardless of the delay.
     *     ```bash
     *     example.org#%#//scriptlet('prevent-setTimeout', '/\.test/')
     *     ```
     *
     *     For instance, the following call will be prevented:
     *     ```javascript
     *     setTimeout(function () {
     *         window.test = "value";
     *     }, 100);
     *     ```
     *
     * 2. Prevents `setTimeout` calls if the callback does not contain `value`.
     *     ```
     *     example.org#%#//scriptlet('prevent-setTimeout', '!value')
     *     ```
     *
     *     For instance, only the first of the following calls will be prevented:
     *     ```javascript
     *     setTimeout(function () {
     *         window.test = "test -- prevented";
     *     }, 300);
     *     setTimeout(function () {
     *         window.test = "value -- executed";
     *     }, 400);
     *     setTimeout(function () {
     *         window.value = "test -- executed";
     *     }, 500);
     *     ```
     *
     * 3. Prevents `setTimeout` calls if the callback contains `value` and the delay is not set to `300`.
     *     ```
     *     example.org#%#//scriptlet('prevent-setTimeout', 'value', '!300')
     *     ```
     *
     *     For instance, only the first of the following calls will not be prevented:
     *     ```javascript
     *     setTimeout(function () {
     *         window.test = "value 1 -- executed";
     *     }, 300);
     *     setTimeout(function () {
     *         window.test = "value 2 -- prevented";
     *     }, 400);
     *     setTimeout(function () {
     *         window.test = "value 3 -- prevented";
     *     }, 500);
     *     ```
     *
     * 4. Prevents `setTimeout` calls if the callback does not contain `value` and the delay is not set to `300`.
     *     ```
     *     example.org#%#//scriptlet('prevent-setTimeout', '!value', '!300')
     *     ```
     *
     *     For instance, only the second of the following calls will be prevented:
     *     ```javascript
     *     setTimeout(function () {
     *         window.test = "test -- executed";
     *     }, 300);
     *     setTimeout(function () {
     *         window.test = "test -- prevented";
     *     }, 400);
     *     setTimeout(function () {
     *         window.test = "value -- executed";
     *     }, 400);
     *     setTimeout(function () {
     *         window.value = "test -- executed";
     *     }, 500);
     *     ```
     */

    /* eslint-enable max-len */

    function preventSetTimeout(source, match, delay) {
      var nativeTimeout = window.setTimeout;
      var nativeIsNaN = Number.isNaN || window.isNaN; // eslint-disable-line compat/compat

      var log = console.log.bind(console); // eslint-disable-line no-console
      // logs setTimeouts to console if no arguments have been specified

      var shouldLog = typeof match === 'undefined' && typeof delay === 'undefined';
      var INVERT_MARKER = '!';
      var isNotMatch = startsWith(match, INVERT_MARKER);

      if (isNotMatch) {
        match = match.slice(1);
      }

      var isNotDelay = startsWith(delay, INVERT_MARKER);

      if (isNotDelay) {
        delay = delay.slice(1);
      }

      delay = parseInt(delay, 10);
      delay = nativeIsNaN(delay) ? null : delay;
      match = match ? toRegExp(match) : toRegExp('/.?/');

      var timeoutWrapper = function timeoutWrapper(callback, timeout) {
        var shouldPrevent = false;

        if (shouldLog) {
          hit(source);
          log("setTimeout(\"".concat(callback.toString(), "\", ").concat(timeout, ")"));
        } else if (!delay) {
          shouldPrevent = match.test(callback.toString()) !== isNotMatch;
        } else if (match === '/.?/') {
          shouldPrevent = timeout === delay !== isNotDelay;
        } else {
          shouldPrevent = match.test(callback.toString()) !== isNotMatch && timeout === delay !== isNotDelay;
        }

        if (shouldPrevent) {
          hit(source);
          return nativeTimeout(noopFunc, timeout);
        }

        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        return nativeTimeout.apply(window, [callback, timeout].concat(args));
      };

      window.setTimeout = timeoutWrapper;
    }
    preventSetTimeout.names = ['prevent-setTimeout', // aliases are needed for matching the related scriptlet converted into our syntax
    'no-setTimeout-if.js', // new implementation of setTimeout-defuser.js
    'ubo-no-setTimeout-if.js', 'setTimeout-defuser.js', // old name should be supported as well
    'ubo-setTimeout-defuser.js', 'nostif.js', // new short name of no-setTimeout-if
    'ubo-nostif.js', 'std.js', // old short scriptlet name
    'ubo-std.js', 'ubo-no-setTimeout-if', 'ubo-setTimeout-defuser', 'ubo-nostif', 'ubo-std'];
    preventSetTimeout.injections = [toRegExp, startsWith, hit, noopFunc];

    /* eslint-disable max-len */

    /**
     * @scriptlet prevent-setInterval
     *
     * @description
     * Prevents a `setInterval` call if:
     * 1) the text of the callback is matching the specified `search` string/regexp which does not start with `!`;
     * otherwise mismatched calls should be defused;
     * 2) the interval is matching the specified `delay`; otherwise mismatched calls should be defused.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#no-setinterval-ifjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('prevent-setInterval'[, search[, delay]])
     * ```
     *
     * Call with no arguments will log calls to setInterval while debugging (`log-setInterval` superseding),
     * so production filter lists' rules definitely require at least one of the parameters:
     * - `search` - optional, string or regular expression.
     * If starts with `!`, scriptlet will not match the stringified callback but all other will be defused.
     * If do not start with `!`, the stringified callback will be matched.
     * If not set, prevents all `setInterval` calls due to specified `delay`.
     * - `delay` - optional, must be an integer.
     * If starts with `!`, scriptlet will not match the delay but all other will be defused.
     * If do not start with `!`, the delay passed to the `setInterval` call will be matched.
     *
     *  **Examples**
     * 1. Prevents `setInterval` calls if the callback matches `/\.test/` regardless of the delay.
     *     ```bash
     *     example.org#%#//scriptlet('prevent-setInterval', '/\.test/')
     *     ```
     *
     *     For instance, the following call will be prevented:
     *     ```javascript
     *     setInterval(function () {
     *         window.test = "value";
     *     }, 100);
     *     ```
     *
     * 2. Prevents `setInterval` calls if the callback does not contain `value`.
     *     ```
     *     example.org#%#//scriptlet('prevent-setInterval', '!value')
     *     ```
     *
     *     For instance, only the first of the following calls will be prevented:
     *     ```javascript
     *     setInterval(function () {
     *         window.test = "test -- prevented";
     *     }, 300);
     *     setInterval(function () {
     *         window.test = "value -- executed";
     *     }, 400);
     *     setInterval(function () {
     *         window.value = "test -- executed";
     *     }, 500);
     *     ```
     *
     * 3. Prevents `setInterval` calls if the callback contains `value` and the delay is not set to `300`.
     *     ```
     *     example.org#%#//scriptlet('prevent-setInterval', 'value', '!300')
     *     ```
     *
     *     For instance, only the first of the following calls will not be prevented:
     *     ```javascript
     *     setInterval(function () {
     *         window.test = "value 1 -- executed";
     *     }, 300);
     *     setInterval(function () {
     *         window.test = "value 2 -- prevented";
     *     }, 400);
     *     setInterval(function () {
     *         window.test = "value 3 -- prevented";
     *     }, 500);
     *     ```
     *
     * 4. Prevents `setInterval` calls if the callback does not contain `value` and the delay is not set to `300`.
     *     ```
     *     example.org#%#//scriptlet('prevent-setInterval', '!value', '!300')
     *     ```
     *
     *     For instance, only the second of the following calls will be prevented:
     *     ```javascript
     *     setInterval(function () {
     *         window.test = "test -- executed";
     *     }, 300);
     *     setInterval(function () {
     *         window.test = "test -- prevented";
     *     }, 400);
     *     setInterval(function () {
     *         window.test = "value -- executed";
     *     }, 400);
     *     setInterval(function () {
     *         window.value = "test -- executed";
     *     }, 500);
     *     ```
     */

    /* eslint-enable max-len */

    function preventSetInterval(source, match, delay) {
      var nativeInterval = window.setInterval;
      var nativeIsNaN = Number.isNaN || window.isNaN; // eslint-disable-line compat/compat

      var log = console.log.bind(console); // eslint-disable-line no-console
      // logs setIntervals to console if no arguments have been specified

      var shouldLog = typeof match === 'undefined' && typeof delay === 'undefined';
      var INVERT_MARKER = '!';
      var isNotMatch = startsWith(match, INVERT_MARKER);

      if (isNotMatch) {
        match = match.slice(1);
      }

      var isNotDelay = startsWith(delay, INVERT_MARKER);

      if (isNotDelay) {
        delay = delay.slice(1);
      }

      delay = parseInt(delay, 10);
      delay = nativeIsNaN(delay) ? null : delay;
      match = match ? toRegExp(match) : toRegExp('/.?/');

      var intervalWrapper = function intervalWrapper(callback, interval) {
        var shouldPrevent = false;

        if (shouldLog) {
          hit(source);
          log("setInterval(\"".concat(callback.toString(), "\", ").concat(interval, ")"));
        } else if (!delay) {
          shouldPrevent = match.test(callback.toString()) !== isNotMatch;
        } else if (match === '/.?/') {
          shouldPrevent = interval === delay !== isNotDelay;
        } else {
          shouldPrevent = match.test(callback.toString()) !== isNotMatch && interval === delay !== isNotDelay;
        }

        if (shouldPrevent) {
          hit(source);
          return nativeInterval(noopFunc, interval);
        }

        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        return nativeInterval.apply(window, [callback, interval].concat(args));
      };

      window.setInterval = intervalWrapper;
    }
    preventSetInterval.names = ['prevent-setInterval', // aliases are needed for matching the related scriptlet converted into our syntax
    'no-setInterval-if.js', // new implementation of setInterval-defuser.js
    'ubo-no-setInterval-if.js', 'setInterval-defuser.js', // old name should be supported as well
    'ubo-setInterval-defuser.js', 'nosiif.js', // new short name of no-setInterval-if
    'ubo-nosiif.js', 'sid.js', // old short scriptlet name
    'ubo-sid.js', 'ubo-no-setInterval-if', 'ubo-setInterval-defuser', 'ubo-nosiif', 'ubo-sid'];
    preventSetInterval.injections = [toRegExp, startsWith, hit, noopFunc];

    /* eslint-disable max-len */

    /**
     * @scriptlet prevent-window-open
     *
     * @description
     * Prevents `window.open` calls when URL either matches or not matches the specified string/regexp. Using it without parameters prevents all `window.open` calls.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#windowopen-defuserjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('prevent-window-open'[, match[, search[, replacement]]])
     * ```
     *
     * - `match` - optional, defaults to "matching", any positive number or nothing for "matching", 0 or empty string for "not matching"
     * - `search` - optional, string or regexp for matching the URL passed to `window.open` call; defaults to search all `window.open` call
     * - `replacement` - optional, string to return prop value or property instead of window.open; defaults to return noopFunc
     *
     * **Example**
     * 1. Prevent all `window.open` calls:
     * ```
     *     example.org#%#//scriptlet('prevent-window-open')
     * ```
     *
     * 2. Prevent `window.open` for all URLs containing `example`:
     * ```
     *     example.org#%#//scriptlet('prevent-window-open', '1', 'example')
     * ```
     *
     * 3. Prevent `window.open` for all URLs matching RegExp `/example\./`:
     * ```
     *     example.org#%#//scriptlet('prevent-window-open', '1', '/example\./')
     * ```
     *
     * 4. Prevent `window.open` for all URLs **NOT** containing `example`:
     * ```
     *     example.org#%#//scriptlet('prevent-window-open', '0', 'example')
     * ```
     * 5. Prevent all `window.open` calls and return 'trueFunc' instead of it if website checks it:
     * ```
     *     example.org#%#//scriptlet('prevent-window-open', '', '', 'trueFunc')
     * ```
     * 6. Prevent all `window.open` and returns callback
     * which returns object with property 'propName'=noopFunc
     * as a property of window.open if website checks it:
     * ```
     *     example.org#%#//scriptlet('prevent-window-open', '1', '', '{propName=noopFunc}')
     * ```
     */

    /* eslint-enable max-len */

    function preventWindowOpen(source) {
      var match = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      var search = arguments.length > 2 ? arguments[2] : undefined;
      var replacement = arguments.length > 3 ? arguments[3] : undefined;
      // Default value of 'match' is needed to prevent all `window.open` calls
      // if the scriptlet is used without parameters
      var nativeOpen = window.open; // unary plus converts 'match' to a number
      // e.g.: +'1' -> 1; +false -> 0

      match = +match > 0;
      search = search ? toRegExp(search) : toRegExp('/.?/'); // eslint-disable-next-line consistent-return

      var openWrapper = function openWrapper(str) {
        if (match !== search.test(str)) {
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          return nativeOpen.apply(window, [str].concat(args));
        }

        hit(source);
        var result; // defaults to return noopFunc instead of window.open

        if (!replacement) {
          result = noopFunc;
        } else if (replacement === 'trueFunc') {
          result = trueFunc;
        } else if (replacement.indexOf('=') > -1) {
          // We should return noopFunc instead of window.open
          // but with some property if website checks it (examples 5, 6)
          // https://github.com/AdguardTeam/Scriptlets/issues/71
          var isProp = startsWith(replacement, '{') && endsWith(replacement, '}');

          if (isProp) {
            var propertyPart = replacement.slice(1, -1);
            var propertyName = substringBefore(propertyPart, '=');
            var propertyValue = substringAfter(propertyPart, '=');

            if (propertyValue === 'noopFunc') {
              result = function result() {
                var resObj = {};
                resObj[propertyName] = noopFunc;
                return resObj;
              };
            }
          }
        }

        return result;
      };

      window.open = openWrapper;
    }
    preventWindowOpen.names = ['prevent-window-open', // aliases are needed for matching the related scriptlet converted into our syntax
    'window.open-defuser.js', 'ubo-window.open-defuser.js', 'ubo-window.open-defuser'];
    preventWindowOpen.injections = [toRegExp, startsWith, endsWith, substringBefore, substringAfter, hit, noopFunc, trueFunc];

    /* eslint-disable max-len */

    /**
     * @scriptlet abort-current-inline-script
     *
     * @description
     * Aborts an inline script when it attempts to **read** the specified property
     * AND when the contents of the `<script>` element contains the specified
     * text or matches the regular expression.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#abort-current-inline-scriptjs-
     *
     * Related ABP source:
     * https://github.com/adblockplus/adblockpluscore/blob/6b2a309054cc23432102b85d13f12559639ef495/lib/content/snippets.js#L928
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('abort-current-inline-script', property[, search])
     * ```
     *
     * - `property` - required, path to a property (joined with `.` if needed). The property must be attached to `window`
     * - `search` - optional, string or regular expression that must match the inline script contents. If not set, abort all inline scripts which are trying to access the specified property
     *
     * > Note please that for inline script with addEventListener in it
     * `property` should be set as `EventTarget.prototype.addEventListener`,
     * not just `addEventListener`.
     *
     * **Examples**
     * 1. Aborts all inline scripts trying to access `window.alert`
     *     ```
     *     example.org#%#//scriptlet('abort-current-inline-script', 'alert')
     *     ```
     *
     * 2. Aborts inline scripts which are trying to access `window.alert` and contain `Hello, world`.
     *     ```
     *     example.org#%#//scriptlet('abort-current-inline-script', 'alert', 'Hello, world')
     *     ```
     *
     *     For instance, the following script will be aborted
     *     ```html
     *     <script>alert("Hello, world");</script>
     *     ```
     *
     * 3. Aborts inline scripts which are trying to access `window.alert` and match this regexp: `/Hello.+world/`.
     *     ```
     *     example.org#%#//scriptlet('abort-current-inline-script', 'alert', '/Hello.+world/')
     *     ```
     *
     *     For instance, the following scripts will be aborted:
     *     ```html
     *     <script>alert("Hello, big world");</script>
     *     ```
     *     ```html
     *     <script>alert("Hello, little world");</script>
     *     ```
     *
     *     This script will not be aborted:
     *     ```html
     *     <script>alert("Hi, little world");</script>
     *     ```
     */

    /* eslint-enable max-len */

    function abortCurrentInlineScript(source, property, search) {
      var searchRegexp = search ? toRegExp(search) : toRegExp('/.?/');
      var rid = randomId();

      var getCurrentScript = function getCurrentScript() {
        if (!document.currentScript) {
          // eslint-disable-line compat/compat
          var scripts = document.getElementsByTagName('script');
          return scripts[scripts.length - 1];
        }

        return document.currentScript; // eslint-disable-line compat/compat
      };

      var ourScript = getCurrentScript();

      var abort = function abort() {
        var scriptEl = getCurrentScript();

        if (!scriptEl) {
          return;
        }

        var content = scriptEl.textContent; // We are using Node.prototype.textContent property descriptor
        // to get the real script content
        // even when document.currentScript.textContent is replaced.
        // https://github.com/AdguardTeam/Scriptlets/issues/57#issuecomment-593638991

        try {
          var textContentGetter = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent').get;
          content = textContentGetter.call(scriptEl);
        } catch (e) {} // eslint-disable-line no-empty


        if (scriptEl instanceof HTMLScriptElement && content.length > 0 && scriptEl !== ourScript && searchRegexp.test(content)) {
          hit(source);
          throw new ReferenceError(rid);
        }
      };

      var setChainPropAccess = function setChainPropAccess(owner, property) {
        var chainInfo = getPropertyInChain(owner, property);
        var base = chainInfo.base;
        var prop = chainInfo.prop,
            chain = chainInfo.chain; // The scriptlet might be executed before the chain property has been created
        // (for instance, document.body before the HTML body was loaded).
        // In this case we're checking whether the base element exists or not
        // and if not, we simply exit without overriding anything.
        // e.g. https://github.com/AdguardTeam/Scriptlets/issues/57#issuecomment-575841092

        if (base instanceof Object === false && base === null) {
          var props = property.split('.');
          var propIndex = props.indexOf(prop);
          var baseName = props[propIndex - 1];
          console.log("The scriptlet had been executed before the ".concat(baseName, " was loaded.")); // eslint-disable-line no-console

          return;
        }

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

        var currentValue = base[prop];
        setPropertyAccess(base, prop, {
          set: function set(value) {
            abort();
            currentValue = value;
          },
          get: function get() {
            abort();
            return currentValue;
          }
        });
      };

      setChainPropAccess(window, property);
      window.onerror = createOnErrorHandler(rid).bind();
    }
    abortCurrentInlineScript.names = ['abort-current-inline-script', // aliases are needed for matching the related scriptlet converted into our syntax
    'abort-current-inline-script.js', 'ubo-abort-current-inline-script.js', 'acis.js', 'ubo-acis.js', 'ubo-abort-current-inline-script', 'ubo-acis', 'abp-abort-current-inline-script'];
    abortCurrentInlineScript.injections = [randomId, setPropertyAccess, getPropertyInChain, toRegExp, createOnErrorHandler, hit];

    /* eslint-disable max-len */

    /**
     * @scriptlet set-constant
     *
     * @description
     * Creates a constant property and assigns it one of the values from the predefined list.
     *
     * > Actually, it's not a constant. Please note, that it can be rewritten with a value of a different type.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#set-constantjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('set-constant', property, value[, stack])
     * ```
     *
     * - `property` - required, path to a property (joined with `.` if needed). The property must be attached to `window`.
     * - `value` - required. Possible values:
     *     - positive decimal integer `<= 32767`
     *     - one of the predefined constants:
     *         - `undefined`
     *         - `false`
     *         - `true`
     *         - `null`
     *         - `noopFunc` - function with empty body
     *         - `trueFunc` - function returning true
     *         - `falseFunc` - function returning false
     *         - `''` - empty string
     *         - `-1` - number value `-1`
     * - `stack` - optional, string or regular expression that must match the current function call stack trace
     *
     * **Examples**
     * ```
     * ! window.firstConst === false // this comparision will return false
     * example.org#%#//scriptlet('set-constant', 'firstConst', 'false')
     *
     * ! window.second() === trueFunc // 'second' call will return true
     * example.org#%#//scriptlet('set-constant', 'secondConst', 'trueFunc')
     *
     * ! document.third() === falseFunc  // 'third' call will return false if the method is related to checking.js
     * example.org#%#//scriptlet('set-constant', 'secondConst', 'trueFunc', 'checking.js')
     * ```
     */

    /* eslint-enable max-len */

    function setConstant(source, property, value, stack) {
      var stackRegexp = stack ? toRegExp(stack) : toRegExp('/.?/');

      if (!property || !matchStackTrace(stackRegexp, new Error().stack)) {
        return;
      }

      var nativeIsNaN = Number.isNaN || window.isNaN; // eslint-disable-line compat/compat

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
        constantValue = noopFunc;
      } else if (value === 'trueFunc') {
        constantValue = trueFunc;
      } else if (value === 'falseFunc') {
        constantValue = falseFunc;
      } else if (/^\d+$/.test(value)) {
        constantValue = parseFloat(value);

        if (nativeIsNaN(constantValue)) {
          return;
        }

        if (Math.abs(constantValue) > 0x7FFF) {
          return;
        }
      } else if (value === '-1') {
        constantValue = -1;
      } else if (value === '') {
        constantValue = '';
      } else {
        return;
      }

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
            chain = chainInfo.chain; // The scriptlet might be executed before the chain property has been created.
        // In this case we're checking whether the base element exists or not
        // and if not, we simply exit without overriding anything

        if (base instanceof Object === false && base === null) {
          // log the reason only while debugging
          if (source.verbose) {
            var props = property.split('.');
            var propIndex = props.indexOf(prop);
            var baseName = props[propIndex - 1];
            console.log("set-constant failed because the property '".concat(baseName, "' does not exist")); // eslint-disable-line no-console
          }

          return;
        }

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

        hit(source);
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
    setConstant.names = ['set-constant', // aliases are needed for matching the related scriptlet converted into our syntax
    'set-constant.js', 'ubo-set-constant.js', 'set.js', 'ubo-set.js', 'ubo-set-constant', 'ubo-set'];
    setConstant.injections = [getPropertyInChain, setPropertyAccess, toRegExp, matchStackTrace, hit, noopFunc, trueFunc, falseFunc];

    /* eslint-disable max-len */

    /**
     * @scriptlet remove-cookie
     *
     * @description
     * Removes current page cookies by passed string matching with name. For current domain and subdomains. Runs on load and before unload.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#cookie-removerjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('remove-cookie'[, match])
     * ```
     *
     * - `match` - optional, string or regex matching the cookie name. If not specified all accessible cookies will be removed.
     *
     * **Examples**
     * 1. Removes all cookies:
     * ```
     *     example.org#%#//scriptlet('remove-cookie')
     * ```
     *
     * 2. Removes cookies which name contains `example` string.
     * ```
     *     example.org#%#//scriptlet('remove-cookie', 'example')
     * ```
     *
     *     For instance this cookie will be removed
     *     ```javascript
     *     document.cookie = '__example=randomValue';
     *     ```
     */

    /* eslint-enable max-len */

    function removeCookie(source, match) {
      var regex = match ? toRegExp(match) : toRegExp('/.?/');

      var removeCookieFromHost = function removeCookieFromHost(cookieName, hostName) {
        var cookieSpec = "".concat(cookieName, "=");
        var domain1 = "; domain=".concat(hostName);
        var domain2 = "; domain=.".concat(hostName);
        var path = '; path=/';
        var expiration = '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = cookieSpec + expiration;
        document.cookie = cookieSpec + domain1 + expiration;
        document.cookie = cookieSpec + domain2 + expiration;
        document.cookie = cookieSpec + path + expiration;
        document.cookie = cookieSpec + domain1 + path + expiration;
        document.cookie = cookieSpec + domain2 + path + expiration;
        hit(source);
      };

      var rmCookie = function rmCookie() {
        document.cookie.split(';').forEach(function (cookieStr) {
          var pos = cookieStr.indexOf('=');

          if (pos === -1) {
            return;
          }

          var cookieName = cookieStr.slice(0, pos).trim();

          if (!regex.test(cookieName)) {
            return;
          }

          var hostParts = document.location.hostname.split('.');

          for (var i = 0; i <= hostParts.length - 1; i += 1) {
            var hostName = hostParts.slice(i).join('.');

            if (hostName) {
              removeCookieFromHost(cookieName, hostName);
            }
          }
        });
      };

      rmCookie();
      window.addEventListener('beforeunload', rmCookie);
    }
    removeCookie.names = ['remove-cookie', // aliases are needed for matching the related scriptlet converted into our syntax
    'cookie-remover.js', 'ubo-cookie-remover.js', 'ubo-cookie-remover'];
    removeCookie.injections = [toRegExp, hit];

    /* eslint-disable max-len */

    /**
     * @scriptlet prevent-addEventListener
     *
     * @description
     * Prevents adding event listeners for the specified events and callbacks.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#addeventlistener-defuserjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('prevent-addEventListener'[, eventSearch[, functionSearch]])
     * ```
     *
     * - `eventSearch` - optional, string or regex matching the event name. If not specified, the scriptlets prevents all event listeners
     * - `functionSearch` - optional, string or regex matching the event listener function body. If not set, the scriptlet prevents all event listeners with event name matching `eventSearch`
     *
     * **Examples**
     * 1. Prevent all `click` listeners:
     * ```
     *     example.org#%#//scriptlet('prevent-addEventListener', 'click')
     * ```

    2. Prevent 'click' listeners with the callback body containing `searchString`.
     * ```
     *     example.org#%#//scriptlet('prevent-addEventListener', 'click', 'searchString')
     * ```
     *
     *     For instance, this listener will not be called:
     * ```javascript
     *     el.addEventListener('click', () => {
     *         window.test = 'searchString';
     *     });
     * ```
     */

    /* eslint-enable max-len */

    function preventAddEventListener(source, eventSearch, funcSearch) {
      var eventSearchRegexp = eventSearch ? toRegExp(eventSearch) : toRegExp('/.?/');
      var funcSearchRegexp = funcSearch ? toRegExp(funcSearch) : toRegExp('/.?/');
      var nativeAddEventListener = window.EventTarget.prototype.addEventListener;

      function addEventListenerWrapper(eventName, callback) {
        // The scriptlet might cause a website broke
        // if the website uses test addEventListener with callback = null
        // https://github.com/AdguardTeam/Scriptlets/issues/76
        var funcToCheck = callback;

        if (callback && typeof callback === 'function') {
          funcToCheck = callback.toString();
        }

        if (eventSearchRegexp.test(eventName.toString()) && funcSearchRegexp.test(funcToCheck)) {
          hit(source);
          return undefined;
        }

        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        return nativeAddEventListener.apply(this, [eventName, callback].concat(args));
      }

      window.EventTarget.prototype.addEventListener = addEventListenerWrapper;
    }
    preventAddEventListener.names = ['prevent-addEventListener', // aliases are needed for matching the related scriptlet converted into our syntax
    'addEventListener-defuser.js', 'ubo-addEventListener-defuser.js', 'aeld.js', 'ubo-aeld.js', 'ubo-addEventListener-defuser', 'ubo-aeld'];
    preventAddEventListener.injections = [toRegExp, hit];

    /* eslint-disable consistent-return, no-eval */
    /**
     * @scriptlet prevent-bab
     *
     * @description
     * Prevents BlockAdblock script from detecting an ad blocker.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#bab-defuserjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('prevent-bab')
     * ```
     */

    function preventBab(source) {
      var _this = this;

      var nativeSetTimeout = window.setTimeout;
      var babRegex = /\.bab_elementid.$/;

      window.setTimeout = function (callback) {
        if (typeof callback !== 'string' || !babRegex.test(callback)) {
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          return nativeSetTimeout.call.apply(nativeSetTimeout, [_this, callback].concat(args));
        }

        hit(source);
      };

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

      window.eval = function (str) {
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
    }
    preventBab.names = ['prevent-bab', // aliases are needed for matching the related scriptlet converted into our syntax
    'nobab.js', 'ubo-nobab.js', 'bab-defuser.js', 'ubo-bab-defuser.js', 'ubo-nobab', 'ubo-bab-defuser'];
    preventBab.injections = [hit];

    /* eslint-disable no-unused-vars, no-extra-bind, func-names */
    /* eslint-disable max-len */

    /**
     * @scriptlet nowebrtc
     *
     * @description
     * Disables WebRTC by overriding `RTCPeerConnection`. The overriden function will log every attempt to create a new connection.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#nowebrtcjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('nowebrtc')
     * ```
     */

    /* eslint-enable max-len */

    function nowebrtc(source) {
      var propertyName = '';

      if (window.RTCPeerConnection) {
        propertyName = 'RTCPeerConnection';
      } else if (window.webkitRTCPeerConnection) {
        propertyName = 'webkitRTCPeerConnection';
      }

      if (propertyName === '') {
        return;
      }

      var rtcReplacement = function rtcReplacement(config) {
        hit(source, "Document tried to create an RTCPeerConnection: ".concat(config));
      };

      rtcReplacement.prototype = {
        close: noopFunc,
        createDataChannel: noopFunc,
        createOffer: noopFunc,
        setRemoteDescription: noopFunc
      };
      var rtc = window[propertyName];
      window[propertyName] = rtcReplacement;

      if (rtc.prototype) {
        rtc.prototype.createDataChannel = function (a, b) {
          return {
            close: noopFunc,
            send: noopFunc
          };
        }.bind(null);
      }
    }
    nowebrtc.names = ['nowebrtc', // aliases are needed for matching the related scriptlet converted into our syntax
    'nowebrtc.js', 'ubo-nowebrtc.js', 'ubo-nowebrtc'];
    nowebrtc.injections = [hit, noopFunc];

    /* eslint-disable no-console */
    /**
     * @scriptlet log-addEventListener
     *
     * @description
     * Logs all addEventListener calls to the console.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#addeventlistener-loggerjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('log-addEventListener')
     * ```
     */

    function logAddEventListener(source) {
      var log = console.log.bind(console);
      var nativeAddEventListener = window.EventTarget.prototype.addEventListener;

      function addEventListenerWrapper(eventName, callback) {
        hit(source); // The scriptlet might cause a website broke
        // if the website uses test addEventListener with callback = null
        // https://github.com/AdguardTeam/Scriptlets/issues/76

        var callbackToLog = callback;

        if (callback && typeof callback === 'function') {
          callbackToLog = callback.toString();
        }

        log("addEventListener(\"".concat(eventName, "\", ").concat(callbackToLog, ")"));

        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        return nativeAddEventListener.apply(this, [eventName, callback].concat(args));
      }

      window.EventTarget.prototype.addEventListener = addEventListenerWrapper;
    }
    logAddEventListener.names = ['log-addEventListener', // aliases are needed for matching the related scriptlet converted into our syntax
    'addEventListener-logger.js', 'ubo-addEventListener-logger.js', 'aell.js', 'ubo-aell.js', 'ubo-addEventListener-logger', 'ubo-aell'];
    logAddEventListener.injections = [hit];

    /* eslint-disable no-console, no-eval */
    /**
     * @scriptlet log-eval
     *
     * @description
     * Logs all `eval()` or `new Function()` calls to the console.
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('log-eval')
     * ```
     */

    function logEval(source) {
      var log = console.log.bind(console); // wrap eval function

      var nativeEval = window.eval;

      function evalWrapper(str) {
        hit(source);
        log("eval(\"".concat(str, "\")"));
        return nativeEval(str);
      }

      window.eval = evalWrapper; // wrap new Function

      var nativeFunction = window.Function;

      function FunctionWrapper() {
        hit(source);

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        log("new Function(".concat(args.join(', '), ")"));
        return nativeFunction.apply(this, [].concat(args));
      }

      FunctionWrapper.prototype = Object.create(nativeFunction.prototype);
      FunctionWrapper.prototype.constructor = FunctionWrapper;
      window.Function = FunctionWrapper;
    }
    logEval.names = ['log-eval'];
    logEval.injections = [hit];

    /**
     * @scriptlet log
     *
     * @description
     * A simple scriptlet which only purpose is to print arguments to console.
     * This scriptlet can be helpful for debugging and troubleshooting other scriptlets.
     *
     * **Example**
     * ```
     * example.org#%#//scriptlet('log', 'arg1', 'arg2')
     * ```
     */
    function log() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      console.log(args); // eslint-disable-line no-console
    }
    log.names = ['log'];

    /* eslint-disable no-eval, no-extra-bind */
    /**
     * @scriptlet noeval
     *
     * @description
     * Prevents page to use eval.
     * Notifies about attempts in the console
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#noevaljs-
     *
     * It also can be used as `$redirect` rules sometimes.
     * See [redirect description](../wiki/about-redirects.md#noeval).
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('noeval')
     * ```
     */

    function noeval(source) {
      window.eval = function evalWrapper(s) {
        hit(source, "AdGuard has prevented eval:\n".concat(s));
      }.bind();
    }
    noeval.names = ['noeval', // aliases are needed for matching the related scriptlet converted into our syntax
    'noeval.js', 'silent-noeval.js', 'ubo-noeval.js', 'ubo-silent-noeval.js', 'ubo-noeval', 'ubo-silent-noeval'];
    noeval.injections = [hit];

    /* eslint-disable no-eval, no-extra-bind, func-names */
    /**
     * @scriptlet prevent-eval-if
     *
     * @description
     * Prevents page to use eval matching payload.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#noeval-ifjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('prevent-eval-if'[, search])
     * ```
     *
     * - `search` - optional, string or regexp for matching stringified eval payload.
     * If 'search is not specified — all stringified eval payload will be matched
     *
     * **Examples**
     * ```
     * ! Prevents eval if it matches 'test'
     * example.org#%#//scriptlet('prevent-eval-if', 'test')
     * ```
     *
     * @param {string|RegExp} [search] string or regexp matching stringified eval payload
     */

    function preventEvalIf(source, search) {
      search = search ? toRegExp(search) : toRegExp('/.?/');
      var nativeEval = window.eval;

      window.eval = function (payload) {
        if (!search.test(payload.toString())) {
          return nativeEval.call(window, payload);
        }

        hit(source, payload);
        return undefined;
      }.bind(window);
    }
    preventEvalIf.names = ['prevent-eval-if', // aliases are needed for matching the related scriptlet converted into our syntax
    'noeval-if.js', 'ubo-noeval-if.js', 'ubo-noeval-if'];
    preventEvalIf.injections = [toRegExp, hit];

    /* eslint-disable no-console, func-names, no-multi-assign */
    /**
     * @scriptlet prevent-fab-3.2.0
     *
     * @description
     * Prevents execution of the FAB script v3.2.0.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#fuckadblockjs-320-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('prevent-fab-3.2.0')
     * ```
     */

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
    preventFab.names = ['prevent-fab-3.2.0', // aliases are needed for matching the related scriptlet converted into our syntax
    'nofab.js', 'ubo-nofab.js', 'fuckadblock.js-3.2.0', 'ubo-fuckadblock.js-3.2.0', 'ubo-nofab'];
    preventFab.injections = [hit, noopFunc, noopThis];

    /* eslint-disable no-console, func-names, no-multi-assign */
    /**
     * @scriptlet set-popads-dummy
     *
     * @description
     * Sets static properties PopAds and popns.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#popads-dummyjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('set-popads-dummy')
     * ```
     */

    function setPopadsDummy(source) {
      delete window.PopAds;
      delete window.popns;
      Object.defineProperties(window, {
        PopAds: {
          get: function get() {
            hit(source);
            return {};
          }
        },
        popns: {
          get: function get() {
            hit(source);
            return {};
          }
        }
      });
    }
    setPopadsDummy.names = ['set-popads-dummy', // aliases are needed for matching the related scriptlet converted into our syntax
    'popads-dummy.js', 'ubo-popads-dummy.js', 'ubo-popads-dummy'];
    setPopadsDummy.injections = [hit];

    /**
     * @scriptlet prevent-popads-net
     *
     * @description
     * Aborts on property write (PopAds, popns), throws reference error with random id.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#popadsnetjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('prevent-popads-net')
     * ```
     */

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
    preventPopadsNet.names = ['prevent-popads-net', // aliases are needed for matching the related scriptlet converted into our syntax
    'popads.net.js', 'ubo-popads.net.js', 'ubo-popads.net'];
    preventPopadsNet.injections = [createOnErrorHandler, randomId, hit];

    /* eslint-disable func-names */
    /**
     * @scriptlet prevent-adfly
     *
     * @description
     * Prevents anti-adblock scripts on adfly short links.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#adfly-defuserjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('prevent-adfly')
     * ```
     */

    function preventAdfly(source) {
      var isDigit = function isDigit(data) {
        return /^\d$/.test(data);
      };

      var handler = function handler(encodedURL) {
        var evenChars = '';
        var oddChars = '';

        for (var i = 0; i < encodedURL.length; i += 1) {
          if (i % 2 === 0) {
            evenChars += encodedURL.charAt(i);
          } else {
            oddChars = encodedURL.charAt(i) + oddChars;
          }
        }

        var data = (evenChars + oddChars).split('');

        for (var _i = 0; _i < data.length; _i += 1) {
          if (isDigit(data[_i])) {
            for (var ii = _i + 1; ii < data.length; ii += 1) {
              if (isDigit(data[ii])) {
                // eslint-disable-next-line no-bitwise
                var temp = parseInt(data[_i], 10) ^ parseInt(data[ii], 10);

                if (temp < 10) {
                  data[_i] = temp.toString();
                }

                _i = ii;
                break;
              }
            }
          }
        }

        data = data.join('');
        var decodedURL = window.atob(data).slice(16, -16);
        /* eslint-disable compat/compat */

        if (window.stop) {
          window.stop();
        }
        /* eslint-enable compat/compat */


        window.onbeforeunload = null;
        window.location.href = decodedURL;
      };

      var val; // Do not apply handler more than one time

      var applyHandler = true;
      var result = setPropertyAccess(window, 'ysmm', {
        configurable: false,
        set: function set(value) {
          if (applyHandler) {
            applyHandler = false;

            try {
              if (typeof value === 'string') {
                handler(value);
              }
            } catch (err) {} // eslint-disable-line no-empty

          }

          val = value;
        },
        get: function get() {
          return val;
        }
      });

      if (result) {
        hit(source);
      } else {
        window.console.error('Failed to set up prevent-adfly scriptlet');
      }
    }
    preventAdfly.names = ['prevent-adfly', // aliases are needed for matching the related scriptlet converted into our syntax
    'adfly-defuser.js', 'ubo-adfly-defuser.js', 'ubo-adfly-defuser'];
    preventAdfly.injections = [setPropertyAccess, hit];

    /* eslint-disable max-len */

    /**
     * @scriptlet debug-on-property-read
     *
     * @description
     * This scriptlet is basically the same as [abort-on-property-read](#abort-on-property-read), but instead of aborting it starts the debugger.
     *
     * **It is not supposed to be used in production filter lists!**
     *
     * **Syntax**
     * ```
     * ! Debug script if it tries to access `window.alert`
     * example.org#%#//scriptlet('debug-on-property-read', 'alert')
     * ! of `window.open`
     * example.org#%#//scriptlet('debug-on-property-read', 'open')
     * ```
     */

    /* eslint-enable max-len */

    function debugOnPropertyRead(source, property, stack) {
      var stackRegexp = stack ? toRegExp(stack) : toRegExp('/.?/');

      if (!property || !matchStackTrace(stackRegexp, new Error().stack)) {
        return;
      }

      var rid = randomId();

      var abort = function abort() {
        hit(source);
        debugger; // eslint-disable-line no-debugger
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
          set: noopFunc
        });
      };

      setChainPropAccess(window, property);
      window.onerror = createOnErrorHandler(rid).bind();
    }
    debugOnPropertyRead.names = ['debug-on-property-read'];
    debugOnPropertyRead.injections = [randomId, setPropertyAccess, getPropertyInChain, createOnErrorHandler, hit, toRegExp, matchStackTrace, noopFunc];

    /* eslint-disable max-len */

    /**
     * @scriptlet debug-on-property-write
     *
     * @description
     * This scriptlet is basically the same as [abort-on-property-write](#abort-on-property-write), but instead of aborting it starts the debugger.
     *
     * **It is not supposed to be used in production filter lists!**
     *
     * **Syntax**
     * ```
     * ! Aborts script when it tries to write in property `window.test`
     * example.org#%#//scriptlet('debug-on-property-write', 'test')
     * ```
     */

    /* eslint-enable max-len */

    function debugOnPropertyWrite(source, property, stack) {
      var stackRegexp = stack ? toRegExp(stack) : toRegExp('/.?/');

      if (!property || !matchStackTrace(stackRegexp, new Error().stack)) {
        return;
      }

      var rid = randomId();

      var abort = function abort() {
        hit(source);
        debugger; // eslint-disable-line no-debugger
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
      window.onerror = createOnErrorHandler(rid).bind();
    }
    debugOnPropertyWrite.names = ['debug-on-property-write'];
    debugOnPropertyWrite.injections = [randomId, setPropertyAccess, getPropertyInChain, createOnErrorHandler, hit, toRegExp, matchStackTrace];

    /* eslint-disable max-len */

    /**
     * @scriptlet debug-current-inline-script
     *
     * @description
     * This scriptlet is basically the same as [abort-current-inline-script](#abort-current-inline-script), but instead of aborting it starts the debugger.
     *
     * **It is not supposed to be used in production filter lists!**
     *
     * **Syntax**
     *```
     * ! Aborts script when it tries to access `window.alert`
     * example.org#%#//scriptlet('debug-current-inline-script', 'alert')
     * ```
     */

    /* eslint-enable max-len */

    function debugCurrentInlineScript(source, property) {
      var search = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var regex = search ? toRegExp(search) : null;
      var rid = randomId();

      var getCurrentScript = function getCurrentScript() {
        if (!document.currentScript) {
          // eslint-disable-line compat/compat
          var scripts = document.getElementsByTagName('script');
          return scripts[scripts.length - 1];
        }

        return document.currentScript; // eslint-disable-line compat/compat
      };

      var ourScript = getCurrentScript();

      var abort = function abort() {
        var scriptEl = getCurrentScript();

        if (scriptEl instanceof HTMLScriptElement && scriptEl.textContent.length > 0 && scriptEl !== ourScript && (!regex || regex.test(scriptEl.textContent))) {
          hit(source);
          debugger; // eslint-disable-line no-debugger
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

        var currentValue = base[prop];
        setPropertyAccess(base, prop, {
          set: function set(value) {
            abort();
            currentValue = value;
          },
          get: function get() {
            abort();
            return currentValue;
          }
        });
      };

      setChainPropAccess(window, property);
      window.onerror = createOnErrorHandler(rid).bind();
    }
    debugCurrentInlineScript.names = ['debug-current-inline-script'];
    debugCurrentInlineScript.injections = [randomId, setPropertyAccess, getPropertyInChain, toRegExp, createOnErrorHandler, hit];

    /* eslint-disable max-len */

    /**
     * @scriptlet remove-attr
     *
     * @description
     * Removes the specified attributes from DOM nodes. This scriptlet runs once when the page loads
     * and after that periodically in order to DOM tree changes.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#remove-attrjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('remove-attr', attrs[, selector])
     * ```
     *
     * - `attrs` — required, attribute or list of attributes joined by '|'
     * - `selector` — optional, CSS selector, specifies DOM nodes from which the attributes will be removed
     *
     * **Examples**
     * 1.  Removes by attribute
     *     ```
     *     example.org#%#//scriptlet('remove-attr', 'example|test')
     *     ```
     *
     *     ```html
     *     <!-- before  -->
     *     <div example="true" test="true">Some text</div>
     *
     *     <!-- after -->
     *     <div>Some text</div>
     *     ```
     *
     * 2. Removes with specified selector
     *     ```
     *     example.org#%#//scriptlet('remove-attr', 'example', 'div[class="inner"]')
     *     ```
     *
     *     ```html
     *     <!-- before -->
     *     <div class="wrapper" example="true">
     *         <div class="inner" example="true">Some text</div>
     *     </div>
     *
     *     <!-- after -->
     *     <div class="wrapper" example="true">
     *         <div class="inner">Some text</div>
     *     </div>
     *     ```
     */

    /* eslint-enable max-len */

    function removeAttr(source, attrs, selector) {
      if (!attrs) {
        return;
      }

      attrs = attrs.split(/\s*\|\s*/);

      if (!selector) {
        selector = "[".concat(attrs.join('],['), "]");
      }

      var rmattr = function rmattr() {
        var nodes = [].slice.call(document.querySelectorAll(selector));
        var removed = false;
        nodes.forEach(function (node) {
          attrs.forEach(function (attr) {
            node.removeAttribute(attr);
            removed = true;
          });
        });

        if (removed) {
          hit(source);
        }
      };

      rmattr(); // 'true' for observing attributes

      observeDOMChanges(rmattr, true);
    }
    removeAttr.names = ['remove-attr', // aliases are needed for matching the related scriptlet converted into our syntax
    'remove-attr.js', 'ubo-remove-attr.js', 'ra.js', 'ubo-ra.js', 'ubo-remove-attr', 'ubo-ra'];
    removeAttr.injections = [hit, observeDOMChanges];

    /* eslint-disable max-len */

    /**
     * @scriptlet remove-class
     *
     * @description
     * Removes the specified classes from DOM nodes. This scriptlet runs once after the page loads
     * and after that periodically in order to DOM tree changes.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#remove-classjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('remove-class', classes[, selector])
     * ```
     *
     * - `classes` — required, class or list of classes separated by '|'
     * - `selector` — optional, CSS selector, specifies DOM nodes from which the classes will be removed.
     * If there is no `selector`, each class of `classes` independently will be removed from all nodes which has one
     *
     * **Examples**
     * 1.  Removes by classes
     *     ```
     *     example.org#%#//scriptlet('remove-class', 'example|test')
     *     ```
     *
     *     ```html
     *     <!-- before  -->
     *     <div id="first" class="nice test">Some text</div>
     *     <div id="second" class="rare example for test">Some text</div>
     *     <div id="third" class="testing better example">Some text</div>
     *
     *     <!-- after -->
     *     <div id="first" class="nice">Some text</div>
     *     <div id="second" class="rare for">Some text</div>
     *     <div id="third" class="testing better">Some text</div>
     *     ```
     *
     * 2. Removes with specified selector
     *     ```
     *     example.org#%#//scriptlet('remove-class', 'branding', 'div[class^="inner"]')
     *     ```
     *
     *     ```html
     *     <!-- before -->
     *     <div class="wrapper true branding">
     *         <div class="inner bad branding">Some text</div>
     *     </div>
     *
     *     <!-- after -->
     *     <div class="wrapper true branding">
     *         <div class="inner bad">Some text</div>
     *     </div>
     *     ```
     */

    /* eslint-enable max-len */

    function removeClass(source, classNames, selector) {
      if (!classNames) {
        return;
      }

      classNames = classNames.split(/\s*\|\s*/);
      var selectors = [];

      if (!selector) {
        selectors = classNames.map(function (className) {
          return ".".concat(className);
        });
      }

      var removeClassHandler = function removeClassHandler() {
        var nodes = new Set();

        if (selector) {
          var foundedNodes = [].slice.call(document.querySelectorAll(selector));
          foundedNodes.forEach(function (n) {
            return nodes.add(n);
          });
        } else if (selectors.length > 0) {
          selectors.forEach(function (s) {
            var elements = document.querySelectorAll(s);

            for (var i = 0; i < elements.length; i += 1) {
              var element = elements[i];
              nodes.add(element);
            }
          });
        }

        var removed = false;
        nodes.forEach(function (node) {
          classNames.forEach(function (className) {
            if (node.classList.contains(className)) {
              node.classList.remove(className);
              removed = true;
            }
          });
        });

        if (removed) {
          hit(source);
        }
      };

      removeClassHandler();
      var CLASS_ATTR_NAME = ['class']; // 'true' for observing attributes
      // 'class' for observing only classes

      observeDOMChanges(removeClassHandler, true, CLASS_ATTR_NAME);
    }
    removeClass.names = ['remove-class', // aliases are needed for matching the related scriptlet converted into our syntax
    'remove-class.js', 'ubo-remove-class.js', 'rc.js', 'ubo-rc.js', 'ubo-remove-class', 'ubo-rc'];
    removeClass.injections = [hit, observeDOMChanges];

    /**
     * @scriptlet disable-newtab-links
     *
     * @description
     * Prevents opening new tabs and windows if there is `target` attribute in element.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#disable-newtab-linksjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('disable-newtab-links')
     * ```
     */

    function disableNewtabLinks(source) {
      document.addEventListener('click', function (ev) {
        var target = ev.target;

        while (target !== null) {
          if (target.localName === 'a' && target.hasAttribute('target')) {
            ev.stopPropagation();
            ev.preventDefault();
            hit(source);
            break;
          }

          target = target.parentNode;
        }
      });
    }
    disableNewtabLinks.names = ['disable-newtab-links', // aliases are needed for matching the related scriptlet converted into our syntax
    'disable-newtab-links.js', 'ubo-disable-newtab-links.js', 'ubo-disable-newtab-links'];
    disableNewtabLinks.injections = [hit];

    /* eslint-disable max-len */

    /**
     * @scriptlet adjust-setInterval
     *
     * @description
     * Adjusts interval for specified setInterval() callbacks.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#nano-setinterval-boosterjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('adjust-setInterval'[, match [, interval[, boost]]])
     * ```
     *
     * - `match` - optional, string/regular expression, matching in stringified callback function
     * - `interval` - optional, defaults to 1000, decimal integer, matching setInterval delay
     * - `boost` - optional, default to 0.05, float, capped at 50 times for up and down (0.02...50), interval multiplier
     *
     * **Examples**
     * 1. Adjust all setInterval() x20 times where interval equal 1000ms:
     *     ```
     *     example.org#%#//scriptlet('adjust-setInterval')
     *     ```
     *
     * 2. Adjust all setInterval() x20 times where callback mathed with `example` and interval equal 1000ms
     *     ```
     *     example.org#%#//scriptlet('adjust-setInterval', 'example')
     *     ```
     *
     * 3. Adjust all setInterval() x20 times where callback mathed with `example` and interval equal 400ms
     *     ```
     *     example.org#%#//scriptlet('adjust-setInterval', 'example', '400')
     *     ```
     *
     * 4. Slow down setInterval() x2 times where callback matched with `example` and interval equal 1000ms
     *     ```
     *     example.org#%#//scriptlet('adjust-setInterval', 'example', '', '2')
     *     ```
     * 5.  Adjust all setInterval() x50 times where interval equal 2000ms
     *     ```
     *     example.org#%#//scriptlet('adjust-setInterval', '', '2000', '0.02')
     *     ```
     */

    /* eslint-enable max-len */

    function adjustSetInterval(source, match, interval, boost) {
      var nativeInterval = window.setInterval;
      var nativeIsNaN = Number.isNaN || window.isNaN; // eslint-disable-line compat/compat

      var nativeIsFinite = Number.isFinite || window.isFinite; // eslint-disable-line compat/compat

      interval = parseInt(interval, 10);
      interval = nativeIsNaN(interval) ? 1000 : interval;
      boost = parseFloat(boost);
      boost = nativeIsNaN(boost) || !nativeIsFinite(boost) ? 0.05 : boost;
      match = match ? toRegExp(match) : toRegExp('/.?/');

      if (boost < 0.02) {
        boost = 0.02;
      }

      if (boost > 50) {
        boost = 50;
      }

      var intervalWrapper = function intervalWrapper(cb, d) {
        if (d === interval && match.test(cb.toString())) {
          d *= boost;
          hit(source);
        }

        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        return nativeInterval.apply(window, [cb, d].concat(args));
      };

      window.setInterval = intervalWrapper;
    }
    adjustSetInterval.names = ['adjust-setInterval', // aliases are needed for matching the related scriptlet converted into our syntax
    'nano-setInterval-booster.js', 'ubo-nano-setInterval-booster.js', 'nano-sib.js', 'ubo-nano-sib.js', 'ubo-nano-setInterval-booster', 'ubo-nano-sib'];
    adjustSetInterval.injections = [toRegExp, hit];

    /* eslint-disable max-len */

    /**
     * @scriptlet adjust-setTimeout
     *
     * @description
     * Adjusts timeout for specified setTimout() callbacks.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#nano-settimeout-boosterjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('adjust-setTimeout'[, match [, timeout[, boost]]])
     * ```
     *
     * - `match` - optional, string/regular expression, matching in stringified callback function
     * - `timeout` - optional, defaults to 1000, decimal integer, matching setTimout delay
     * - `boost` - optional, default to 0.05, float, capped at 50 times for up and down (0.02...50), timeout multiplier
     *
     * **Examples**
     * 1. Adjust all setTimeout() x20 times where timeout equal 1000ms:
     *     ```
     *     example.org#%#//scriptlet('adjust-setTimeout')
     *     ```
     *
     * 2. Adjust all setTimeout() x20 times where callback mathed with `example` and timeout equal 1000ms
     *     ```
     *     example.org#%#//scriptlet('adjust-setTimeout', 'example')
     *     ```
     *
     * 3. Adjust all setTimeout() x20 times where callback mathed with `example` and timeout equal 400ms
     *     ```
     *     example.org#%#//scriptlet('adjust-setTimeout', 'example', '400')
     *     ```
     *
     * 4. Slow down setTimeout() x2 times where callback matched with `example` and timeout equal 1000ms
     *     ```
     *     example.org#%#//scriptlet('adjust-setTimeout', 'example', '', '2')
     *     ```
     * 5.  Adjust all setTimeout() x50 times where timeout equal 2000ms
     *     ```
     *     example.org#%#//scriptlet('adjust-setTimeout', '', '2000', '0.02')
     *     ```
     */

    /* eslint-enable max-len */

    function adjustSetTimeout(source, match, timeout, boost) {
      var nativeTimeout = window.setTimeout;
      var nativeIsNaN = Number.isNaN || window.isNaN; // eslint-disable-line compat/compat

      var nativeIsFinite = Number.isFinite || window.isFinite; // eslint-disable-line compat/compat

      timeout = parseInt(timeout, 10);
      timeout = nativeIsNaN(timeout) ? 1000 : timeout;
      boost = parseFloat(boost);
      boost = nativeIsNaN(boost) || !nativeIsFinite(boost) ? 0.05 : boost;
      match = match ? toRegExp(match) : toRegExp('/.?/');

      if (boost < 0.02) {
        boost = 0.02;
      }

      if (boost > 50) {
        boost = 50;
      }

      var timeoutWrapper = function timeoutWrapper(cb, d) {
        if (d === timeout && match.test(cb.toString())) {
          d *= boost;
          hit(source);
        }

        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        return nativeTimeout.apply(window, [cb, d].concat(args));
      };

      window.setTimeout = timeoutWrapper;
    }
    adjustSetTimeout.names = ['adjust-setTimeout', // aliases are needed for matching the related scriptlet converted into our syntax
    'nano-setTimeout-booster.js', 'ubo-nano-setTimeout-booster.js', 'nano-stb.js', 'ubo-nano-stb.js', 'ubo-nano-setTimeout-booster', 'ubo-nano-stb'];
    adjustSetTimeout.injections = [toRegExp, hit];

    /* eslint-disable max-len */

    /**
     * @scriptlet dir-string
     *
     * @description
     * Wraps the `console.dir` API to call the `toString` method of the argument.
     * There are several adblock circumvention systems that detect browser devtools
     * and hide themselves. Therefore, if we force them to think
     * that devtools are open (using this scrciptlet),
     * it will automatically disable the adblock circumvention script.
     *
     * Related ABP source:
     * https://github.com/adblockplus/adblockpluscore/blob/6b2a309054cc23432102b85d13f12559639ef495/lib/content/snippets.js#L766
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('dir-string'[, times])
     * ```
     * - `times` - optional, the number of times to call the `toString` method of the argument to `console.dir`
     *
     * **Example**
     * ```
     * ! Run 2 times
     * example.org#%#//scriptlet('dir-string', '2')
     * ```
     */

    /* eslint-enable max-len */

    function dirString(source, times) {
      var _console = console,
          dir = _console.dir;
      times = parseInt(times, 10);

      function dirWrapper(object) {
        // eslint-disable-next-line no-unused-vars
        var temp;

        for (var i = 0; i < times; i += 1) {
          // eslint-disable-next-line no-unused-expressions
          temp = "".concat(object);
        }

        if (typeof dir === 'function') {
          dir.call(this, object);
        }

        hit(source, temp);
      } // eslint-disable-next-line no-console


      console.dir = dirWrapper;
    }
    dirString.names = ['dir-string', 'abp-dir-string'];
    dirString.injections = [hit];

    /* eslint-disable max-len */

    /**
     * @scriptlet json-prune
     *
     * @description
     * Removes specified properties from the result of calling JSON.parse and returns the caller
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#json-prunejs-
     *
     * Related ABP source:
     * https://github.com/adblockplus/adblockpluscore/blob/master/lib/content/snippets.js#L1285
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('json-prune'[, propsToRemove [, obligatoryProps [, stack]]])
     * ```
     *
     * - `propsToRemove` - optional, string of space-separated properties to remove
     * - `obligatoryProps` - optional, string of space-separated properties which must be all present for the pruning to occur
     * - `stack` - optional, string or regular expression that must match the current function call stack trace
     *
     * > Note please that you can use wildcard `*` for chain property name.
     * e.g. 'ad.*.src' instead of 'ad.0.src ad.1.src ad.2.src ...'
     *
     * **Examples**
     * 1. Removes property `example` from the results of JSON.parse call
     *     ```
     *     example.org#%#//scriptlet('json-prune', 'example')
     *     ```
     *
     *     For instance, the following call will return `{ one: 1}`
     *
     *     ```html
     *     JSON.parse('{"one":1,"example":true}')
     *     ```
     *
     * 2. If there are no specified properties in the result of JSON.parse call, pruning will NOT occur
     *     ```
     *     example.org#%#//scriptlet('json-prune', 'one', 'obligatoryProp')
     *     ```
     *
     *     For instance, the following call will return `{ one: 1, two: 2}`
     *
     *     ```html
     *     JSON.parse('{"one":1,"two":2}')
     *     ```
     *
     * 3. A property in a list of properties can be a chain of properties
     *
     *     ```
     *     example.org#%#//scriptlet('json-prune', 'a.b', 'adpath.url.first')
     *     ```
     *
     * 4. Removes property `content.ad` from the results of JSON.parse call it's error stack trace contains `test.js`
     *     ```
     *     example.org#%#//scriptlet('json-prune', 'content.ad', '', 'test.js')
     *     ```
     *
     * 5. A property in a list of properties can be a chain of properties with wildcard in it
     *
     *     ```
     *     example.org#%#//scriptlet('json-prune', 'content.*.media.src', 'content.*.media.preroll')
     *     ```
     *
     * 6. Call with no arguments will log the current hostname and json payload at the console
     *     ```
     *     example.org#%#//scriptlet('json-prune')
     *     ```
     */

    /* eslint-enable max-len */

    function jsonPrune(source, propsToRemove, requiredInitialProps, stack) {
      var stackRegexp = stack ? toRegExp(stack) : toRegExp('/.?/');

      if (!matchStackTrace(stackRegexp, new Error().stack)) {
        return;
      } // eslint-disable-next-line no-console


      var log = console.log.bind(console);
      var prunePaths = propsToRemove !== undefined && propsToRemove !== '' ? propsToRemove.split(/ +/) : [];
      var requiredPaths = requiredInitialProps !== undefined && requiredInitialProps !== '' ? requiredInitialProps.split(/ +/) : [];

      function isPruningNeeded(root) {
        if (!root) {
          return false;
        }

        var shouldProcess;

        for (var i = 0; i < requiredPaths.length; i += 1) {
          var requiredPath = requiredPaths[i];
          var lastNestedPropName = requiredPath.split('.').pop();
          var hasWildcard = requiredPath.indexOf('.*.') > -1 || requiredPath.indexOf('*.') > -1 || requiredPath.indexOf('.*') > -1; // if the path has wildcard, getPropertyInChain should 'look through' chain props

          var details = getWildcardPropertyInChain(root, requiredPath, hasWildcard); // start value of 'shouldProcess' due to checking below

          shouldProcess = !hasWildcard;

          for (var _i = 0; _i < details.length; _i += 1) {
            if (hasWildcard) {
              // if there is a wildcard,
              // at least one (||) of props chain should be present in object
              shouldProcess = !(details[_i].base[lastNestedPropName] === undefined) || shouldProcess;
            } else {
              // otherwise each one (&&) of them should be there
              shouldProcess = !(details[_i].base[lastNestedPropName] === undefined) && shouldProcess;
            }
          }
        }

        return shouldProcess;
      }

      var nativeParse = JSON.parse;

      var parseWrapper = function parseWrapper() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var root = nativeParse.apply(window, args);

        if (prunePaths.length === 0) {
          log(window.location.hostname, root);
          return root;
        }

        if (isPruningNeeded(root) === false) {
          return root;
        } // if pruning is needed, we check every input pathToRemove
        // and delete it if root has it


        prunePaths.forEach(function (path) {
          var ownerObjArr = getWildcardPropertyInChain(root, path, true);
          ownerObjArr.forEach(function (ownerObj) {
            if (ownerObj !== undefined && ownerObj.base) {
              delete ownerObj.base[ownerObj.prop];
            }
          });
        });
        hit(source);
        return root;
      };

      JSON.parse = parseWrapper;
    }
    jsonPrune.names = ['json-prune', // aliases are needed for matching the related scriptlet converted into our syntax
    'json-prune.js', 'ubo-json-prune.js', 'ubo-json-prune', 'abp-json-prune'];
    jsonPrune.injections = [hit, toRegExp, matchStackTrace, getWildcardPropertyInChain];

    /* eslint-disable max-len */

    /**
     * @scriptlet prevent-requestAnimationFrame
     *
     * @description
     * Prevents a `requestAnimationFrame` call
     * if the text of the callback is matching the specified search string which does not start with `!`;
     * otherwise mismatched calls should be defused.
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#no-requestanimationframe-ifjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('prevent-requestAnimationFrame'[, search])
     * ```
     *
     * - `search` - optional, string or regular expression.
     * If starts with `!`, scriptlet will not match the stringified callback but all other will be defused.
     * If do not start with `!`, the stringified callback will be matched.
     *
     * Call with no argument will log all requestAnimationFrame calls while debugging.
     * So do not use the scriptlet without any parameter in production filter lists.
     *
     * **Examples**
     * 1. Prevents `requestAnimationFrame` calls if the callback matches `/\.test/`.
     *     ```bash
     *     example.org#%#//scriptlet('prevent-requestAnimationFrame', '/\.test/')
     *     ```
     *
     *     For instance, the following call will be prevented:
     *     ```javascript
     *     var times = 0;
     *     requestAnimationFrame(function change() {
     *         window.test = 'new value';
     *         if (times < 2) {
     *             times += 1;
     *             requestAnimationFrame(change);
     *         }
     *     });
     *     ```
     * 2. Prevents `requestAnimationFrame` calls if **does not match** 'check'.
     *     ```bash
     *     example.org#%#//scriptlet('prevent-requestAnimationFrame', '!check')
     *     ```
     *
     *     For instance, only the first call will be prevented:
     *
     *     ```javascript
     *     var timesFirst = 0;
     *     requestAnimationFrame(function changeFirst() {
     *         window.check = 'should not be prevented';
     *         if (timesFirst < 2) {
     *             timesFirst += 1;
     *             requestAnimationFrame(changeFirst);
     *         }
     *     });
     *
     *     var timesSecond = 0;
     *     requestAnimationFrame(function changeSecond() {
     *         window.second = 'should be prevented';
     *         if (timesSecond < 2) {
     *             timesSecond += 1;
     *             requestAnimationFrame(changeSecond);
     *         }
     *     });
     *     ```
     */

    /* eslint-enable max-len */

    function preventRequestAnimationFrame(source, match) {
      var nativeRequestAnimationFrame = window.requestAnimationFrame; // logs requestAnimationFrame to console if no arguments have been specified

      var shouldLog = typeof match === 'undefined';
      var INVERT_MARKER = '!';
      var doNotMatch = startsWith(match, INVERT_MARKER);

      if (doNotMatch) {
        match = match.slice(1);
      }

      match = match ? toRegExp(match) : toRegExp('/.?/');

      var rafWrapper = function rafWrapper(callback) {
        var shouldPrevent = false;

        if (shouldLog) {
          var logMessage = "log: requestAnimationFrame(\"".concat(callback.toString(), "\")");
          hit(source, logMessage);
        } else {
          shouldPrevent = match.test(callback.toString()) !== doNotMatch;
        }

        if (shouldPrevent) {
          hit(source);
          return nativeRequestAnimationFrame(noopFunc);
        }

        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        return nativeRequestAnimationFrame.apply(window, [callback].concat(args));
      };

      window.requestAnimationFrame = rafWrapper;
    }
    preventRequestAnimationFrame.names = ['prevent-requestAnimationFrame', // aliases are needed for matching the related scriptlet converted into our syntax
    'no-requestAnimationFrame-if.js', 'ubo-no-requestAnimationFrame-if.js', 'norafif.js', 'ubo-norafif.js', 'ubo-no-requestAnimationFrame-if', 'ubo-norafif'];
    preventRequestAnimationFrame.injections = [hit, startsWith, toRegExp, noopFunc];

    /* eslint-disable max-len */

    /**
     * @scriptlet set-cookie
     *
     * @description
     * Sets a cookie with the specified name and value. Cookie path defaults to root.
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('set-cookie', name, value)
     * ```
     *
     * - `name` - required, cookie name to be set
     * - `value` - required, cookie value; possible values:
     *     - number `>= 0 && <= 15`
     *     - one of the predefined constants:
     *         - `true` / `True`
     *         - `false` / `False`
     *         - `yes` / `Yes` / `Y`
     *         - `no`
     *         - `ok` / `OK`
     *
     * **Examples**
     * ```
     * example.org#%#//scriptlet('set-cookie', 'checking', 'ok')
     *
     * example.org#%#//scriptlet('set-cookie', 'gdpr-settings-cookie', '1')
     * ```
     */

    /* eslint-enable max-len */

    function setCookie(source, name, value) {
      if (!name || !value) {
        return;
      }

      var nativeIsNaN = Number.isNaN || window.isNaN; // eslint-disable-line compat/compat

      var valueToSet;

      if (value === 'true') {
        valueToSet = 'true';
      } else if (value === 'True') {
        valueToSet = 'True';
      } else if (value === 'false') {
        valueToSet = 'false';
      } else if (value === 'False') {
        valueToSet = 'False';
      } else if (value === 'yes') {
        valueToSet = 'yes';
      } else if (value === 'Yes') {
        valueToSet = 'Yes';
      } else if (value === 'Y') {
        valueToSet = 'Y';
      } else if (value === 'no') {
        valueToSet = 'no';
      } else if (value === 'ok') {
        valueToSet = 'ok';
      } else if (value === 'OK') {
        valueToSet = 'OK';
      } else if (/^\d+$/.test(value)) {
        valueToSet = parseFloat(value);

        if (nativeIsNaN(valueToSet)) {
          return;
        }

        if (Math.abs(valueToSet) < 0 || Math.abs(valueToSet) > 15) {
          return;
        }
      } else {
        return;
      }

      var pathToSet = 'path=/;';
      var cookieData = "".concat(encodeURIComponent(name), "=").concat(encodeURIComponent(valueToSet), "; ").concat(pathToSet);
      hit(source);
      document.cookie = cookieData;
    }
    setCookie.names = ['set-cookie'];
    setCookie.injections = [hit];

    /**
     * @scriptlet hide-in-shadow-dom
     *
     * @description
     * Hides elements inside open shadow DOM elements.
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('hide-in-shadow-dom', selector[, baseSelector])
     * ```
     *
     * - `selector` — required, CSS selector of element in shadow-dom to hide
     * - `baseSelector` — optional, selector of specific page DOM element,
     * narrows down the part of the page DOM where shadow-dom host supposed to be,
     * defaults to document.documentElement
     *
     * > `baseSelector` should match element of the page DOM, but not of shadow DOM
     *
     * **Examples**
     * ```
     * ! hides menu bar
     * virustotal.com#%#//scriptlet('hide-in-shadow-dom', 'iron-pages', 'vt-virustotal-app')
     *
     * ! hides floating element
     * virustotal.com#%#//scriptlet('hide-in-shadow-dom', 'vt-ui-contact-fab')
     * ```
     */

    function hideInShadowDom(source, selector, baseSelector) {
      // do nothing if browser does not support ShadowRoot
      // https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot
      if (!Element.prototype.attachShadow) {
        return;
      }
      /**
       * Finds shadow-dom host (elements with shadowRoot property) in DOM of rootElement.
       * @param {HTMLElement} rootElement
       * @returns {nodeList[]} shadow-dom hosts
       */


      var findHostElements = function findHostElements(rootElement) {
        var hosts = []; // Element.querySelectorAll() returns list of elements
        // which are defined in DOM of Element.
        // Meanwhile, inner DOM of the element with shadowRoot property
        // is absolutely another DOM and which can not be reached by querySelectorAll('*')

        var domElems = rootElement.querySelectorAll('*');
        domElems.forEach(function (el) {
          if (el.shadowRoot) {
            hosts.push(el);
          }
        });
        return hosts;
      };
      /**
       * @typedef {Object} PierceData
       * @property {Array} targets found elements
       * @property {Array} innerHosts inner shadow-dom hosts
       */

      /**
       * Pierces open shadow-dom in order to find:
       * - elements by 'selector' matching
       * - inner shadow-dom hosts
       * @param {string} selector
       * @param {nodeList[]} hostElements
       * @returns {PierceData}
       */


      var pierceShadowDom = function pierceShadowDom(selector, hostElements) {
        var targets = [];
        var innerHostsAcc = [];

        var collectTargets = function collectTargets(arr) {
          if (arr.length !== 0) {
            arr.forEach(function (el) {
              return targets.push(el);
            });
          }
        }; // it's possible to get a few hostElements found by baseSelector on the page


        hostElements.forEach(function (host) {
          // check presence of selector element inside base element if it's not in shadow-dom
          var simpleElems = host.querySelectorAll(selector);
          collectTargets(simpleElems);
          var shadowRootElem = host.shadowRoot;
          var shadowChildren = shadowRootElem.querySelectorAll(selector);
          collectTargets(shadowChildren); // find inner shadow-dom hosts inside processing shadow-dom

          innerHostsAcc.push(findHostElements(shadowRootElem));
        }); // if there were more than one host element,
        // innerHostsAcc is an array of arrays and should be flatten

        var innerHosts = flatten(innerHostsAcc);
        return {
          targets: targets,
          innerHosts: innerHosts
        };
      };
      /**
       * Handles shadow-dom piercing and hiding of found elements
       */


      var hideHandler = function hideHandler() {
        // start value of shadow-dom hosts for the page dom
        var hostElements = !baseSelector ? findHostElements(document.documentElement) : document.querySelectorAll(baseSelector); // if there is shadow-dom host, they should be explored

        var _loop = function _loop() {
          var hidden = false;
          var DISPLAY_NONE_CSS = 'display:none!important;';

          var _pierceShadowDom = pierceShadowDom(selector, hostElements),
              targets = _pierceShadowDom.targets,
              innerHosts = _pierceShadowDom.innerHosts;

          targets.forEach(function (targetEl) {
            targetEl.style.cssText = DISPLAY_NONE_CSS;
            hidden = true;
          });

          if (hidden) {
            hit(source);
          } // continue to pierce for inner shadow-dom hosts
          // and search inside them while the next iteration


          hostElements = innerHosts;
        };

        while (hostElements.length !== 0) {
          _loop();
        }
      };

      hideHandler();
      observeDOMChanges(hideHandler, true);
    }
    hideInShadowDom.names = ['hide-in-shadow-dom'];
    hideInShadowDom.injections = [hit, observeDOMChanges, flatten];

    /**
     * This file must export all scriptlets which should be accessible
     */

    var scriptletList = /*#__PURE__*/Object.freeze({
        __proto__: null,
        abortOnPropertyRead: abortOnPropertyRead,
        abortOnPropertyWrite: abortOnPropertyWrite,
        preventSetTimeout: preventSetTimeout,
        preventSetInterval: preventSetInterval,
        preventWindowOpen: preventWindowOpen,
        abortCurrentInlineScript: abortCurrentInlineScript,
        setConstant: setConstant,
        removeCookie: removeCookie,
        preventAddEventListener: preventAddEventListener,
        preventBab: preventBab,
        nowebrtc: nowebrtc,
        logAddEventListener: logAddEventListener,
        logEval: logEval,
        log: log,
        noeval: noeval,
        preventEvalIf: preventEvalIf,
        preventFab: preventFab,
        setPopadsDummy: setPopadsDummy,
        preventPopadsNet: preventPopadsNet,
        preventAdfly: preventAdfly,
        debugOnPropertyRead: debugOnPropertyRead,
        debugOnPropertyWrite: debugOnPropertyWrite,
        debugCurrentInlineScript: debugCurrentInlineScript,
        removeAttr: removeAttr,
        removeClass: removeClass,
        disableNewtabLinks: disableNewtabLinks,
        adjustSetInterval: adjustSetInterval,
        adjustSetTimeout: adjustSetTimeout,
        dirString: dirString,
        jsonPrune: jsonPrune,
        preventRequestAnimationFrame: preventRequestAnimationFrame,
        setCookie: setCookie,
        hideInShadowDom: hideInShadowDom
    });

    const redirects=[{adg:"1x1-transparent.gif",ubo:"1x1.gif",abp:"1x1-transparent-gif"},{adg:"2x2-transparent.png",ubo:"2x2.png",abp:"2x2-transparent-png"},{adg:"3x2-transparent.png",ubo:"3x2.png",abp:"3x2-transparent-png"},{adg:"32x32-transparent.png",ubo:"32x32.png",abp:"32x32-transparent-png"},{adg:"amazon-apstag",ubo:"amazon_apstag.js"},{adg:"google-analytics",ubo:"google-analytics_analytics.js"},{adg:"google-analytics-ga",ubo:"google-analytics_ga.js"},{adg:"googlesyndication-adsbygoogle",ubo:"googlesyndication_adsbygoogle.js"},{adg:"googletagmanager-gtm",ubo:"googletagmanager_gtm.js"},{adg:"googletagservices-gpt",ubo:"googletagservices_gpt.js"},{adg:"metrika-yandex-watch"},{adg:"metrika-yandex-tag"},{adg:"noeval",ubo:"noeval-silent.js"},{adg:"noopcss",abp:"blank-css"},{adg:"noopframe",ubo:"noop.html",abp:"blank-html"},{adg:"noopjs",ubo:"noop.js",abp:"blank-js"},{adg:"nooptext",ubo:"noop.txt",abp:"blank-text"},{adg:"noopmp3-0.1s",ubo:"noop-0.1s.mp3",abp:"blank-mp3"},{adg:"noopmp4-1s",ubo:"noop-1s.mp4",abp:"blank-mp4"},{adg:"noopvmap-1.0"},{adg:"noopvast-2.0"},{adg:"noopvast-3.0"},{adg:"prevent-fab-3.2.0",ubo:"nofab.js"},{adg:"prevent-popads-net",ubo:"popads.js"},{adg:"scorecardresearch-beacon",ubo:"scorecardresearch_beacon.js"},{adg:"set-popads-dummy",ubo:"popads-dummy.js"},{ubo:"addthis_widget.js"},{ubo:"amazon_ads.js"},{ubo:"ampproject_v0.js"},{ubo:"chartbeat.js"},{ubo:"disqus_embed.js"},{ubo:"disqus_forums_embed.js"},{ubo:"doubleclick_instream_ad_status.js"},{ubo:"empty"},{ubo:"google-analytics_cx_api.js"},{ubo:"google-analytics_inpage_linkid.js"},{ubo:"hd-main.js"},{ubo:"ligatus_angular-tag.js"},{ubo:"monkeybroker.js"},{ubo:"outbrain-widget.js"},{ubo:"window.open-defuser.js"},{ubo:"nobab.js"},{ubo:"noeval.js"}];

    var JS_RULE_MARKER = '#%#';
    var COMMENT_MARKER = '!';
    /**
     * Checks if rule text is comment e.g. !!example.org##+js(set-constant.js, test, false)
     * @param {string} rule
     * @return {boolean}
     */

    var isComment = function isComment(rule) {
      return startsWith(rule, COMMENT_MARKER);
    };
    /* ************************************************************************
     *
     * Scriptlets
     *
     ************************************************************************** */

    /**
     * uBlock scriptlet rule mask
     */


    var UBO_SCRIPTLET_MASK_REG = /#@?#script:inject|#@?#\s*\+js/;
    var UBO_SCRIPTLET_MASK_1 = '##+js';
    var UBO_SCRIPTLET_MASK_2 = '##script:inject';
    var UBO_SCRIPTLET_EXCEPTION_MASK_1 = '#@#+js';
    var UBO_SCRIPTLET_EXCEPTION_MASK_2 = '#@#script:inject';
    /**
     * AdBlock Plus snippet rule mask
     */

    var ABP_SCRIPTLET_MASK = '#$#';
    var ABP_SCRIPTLET_EXCEPTION_MASK = '#@$#';
    /**
     * AdGuard CSS rule mask
     */

    var ADG_CSS_MASK_REG = /#@?\$#.+?\s*\{.*\}\s*$/g;
    /**
     * Checks if the `rule` is AdGuard scriptlet rule
     * @param {string} rule - rule text
     */

    var isAdgScriptletRule = function isAdgScriptletRule(rule) {
      return !isComment(rule) && rule.indexOf(ADG_SCRIPTLET_MASK) > -1;
    };
    /**
     * Checks if the `rule` is uBO scriptlet rule
     * @param {string} rule rule text
     */


    var isUboScriptletRule = function isUboScriptletRule(rule) {
      return (rule.indexOf(UBO_SCRIPTLET_MASK_1) > -1 || rule.indexOf(UBO_SCRIPTLET_MASK_2) > -1 || rule.indexOf(UBO_SCRIPTLET_EXCEPTION_MASK_1) > -1 || rule.indexOf(UBO_SCRIPTLET_EXCEPTION_MASK_2) > -1) && UBO_SCRIPTLET_MASK_REG.test(rule) && !isComment(rule);
    };
    /**
     * Checks if the `rule` is AdBlock Plus snippet
     * @param {string} rule rule text
     */


    var isAbpSnippetRule = function isAbpSnippetRule(rule) {
      return (rule.indexOf(ABP_SCRIPTLET_MASK) > -1 || rule.indexOf(ABP_SCRIPTLET_EXCEPTION_MASK) > -1) && rule.search(ADG_CSS_MASK_REG) === -1 && !isComment(rule);
    };
    /**
     * Finds scriptlet by it's name
     * @param {string} name - scriptlet name
     */


    var getScriptletByName = function getScriptletByName(name) {
      var scriptlets = Object.keys(scriptletList).map(function (key) {
        return scriptletList[key];
      });
      return scriptlets.find(function (s) {
        return s.names // full match name checking
        && (s.names.indexOf(name) > -1 // or check ubo alias name without '.js' at the end
        || !endsWith(name, '.js') && s.names.indexOf("".concat(name, ".js")) > -1);
      });
    };
    /**
     * Checks if the scriptlet name is valid
     * @param {string} name - Scriptlet name
     */


    var isValidScriptletName = function isValidScriptletName(name) {
      if (!name) {
        return false;
      }

      var scriptlet = getScriptletByName(name);

      if (!scriptlet) {
        return false;
      }

      return true;
    };
    /* ************************************************************************
     *
     * Redirects
     *
     ************************************************************************** */

    /**
     * Redirect resources markers
     */


    var ADG_UBO_REDIRECT_MARKER = 'redirect=';
    var ABP_REDIRECT_MARKER = 'rewrite=abp-resource:';
    var VALID_SOURCE_TYPES = ['image', 'subdocument', 'stylesheet', 'script', 'xmlhttprequest', 'media'];
    var validAdgRedirects = redirects.filter(function (el) {
      return el.adg;
    });
    /**
     * Converts array of pairs to object.
     * Sort of Object.fromEntries() polyfill.
     * @param {Array} pairs - array of pairs
     * @returns {Object}
     */

    var objFromEntries = function objFromEntries(pairs) {
      var output = pairs.reduce(function (acc, el) {
        var _el = slicedToArray(el, 2),
            key = _el[0],
            value = _el[1];

        acc[key] = value;
        return acc;
      }, {});
      return output;
    };
    /**
     * Compatibility object where KEYS = UBO redirect names and VALUES = ADG redirect names
     * It's used for UBO -> ADG converting
     */


    var uboToAdgCompatibility = objFromEntries(validAdgRedirects.filter(function (el) {
      return el.ubo;
    }).map(function (el) {
      return [el.ubo, el.adg];
    }));
    /**
     * Compatibility object where KEYS = ABP redirect names and VALUES = ADG redirect names
     * It's used for ABP -> ADG converting
     */

    var abpToAdgCompatibility = objFromEntries(validAdgRedirects.filter(function (el) {
      return el.abp;
    }).map(function (el) {
      return [el.abp, el.adg];
    }));
    /**
     * Compatibility object where KEYS = UBO redirect names and VALUES = ADG redirect names
     * It's used for ADG -> UBO converting
     */

    var adgToUboCompatibility = objFromEntries(validAdgRedirects.filter(function (el) {
      return el.ubo;
    }).map(function (el) {
      return [el.adg, el.ubo];
    }));
    /**
     * Needed for AdGuard redirect names validation where KEYS = **valid** AdGuard redirect names
     * 'adgToUboCompatibility' is still needed for ADG -> UBO converting
     */

    var validAdgCompatibility = objFromEntries(validAdgRedirects.map(function (el) {
      return [el.adg, 'valid adg redirect'];
    }));
    var REDIRECT_RULE_TYPES = {
      VALID_ADG: {
        marker: ADG_UBO_REDIRECT_MARKER,
        compatibility: validAdgCompatibility
      },
      ADG: {
        marker: ADG_UBO_REDIRECT_MARKER,
        compatibility: adgToUboCompatibility
      },
      UBO: {
        marker: ADG_UBO_REDIRECT_MARKER,
        compatibility: uboToAdgCompatibility
      },
      ABP: {
        marker: ABP_REDIRECT_MARKER,
        compatibility: abpToAdgCompatibility
      }
    };
    /**
     * Parses redirect rule modifiers
     * @param {string} rule
     * @returns {Array}
     */

    var parseModifiers = function parseModifiers(rule) {
      return substringAfter(rule, '$').split(',');
    };
    /**
     * Gets redirect resource name
     * @param {string} rule
     * @param {string} marker - specific Adg/Ubo or Abp redirect resources marker
     * @returns {string} - redirect resource name
     */


    var getRedirectName = function getRedirectName(rule, marker) {
      var ruleModifiers = parseModifiers(rule);
      var redirectNamePart = ruleModifiers.find(function (el) {
        return el.indexOf(marker) > -1;
      });
      return substringAfter(redirectNamePart, marker);
    };
    /**
     * Checks if the `rule` is AdGuard redirect rule.
     * Discards comments and JS rules and checks if the `rule` has 'redirect' modifier.
     * @param {string} rule - rule text
     */


    var isAdgRedirectRule = function isAdgRedirectRule(rule) {
      var MARKER_IN_BASE_PART_MASK = '/((?!\\$|\\,).{1})redirect=(.{0,}?)\\$(popup)?/';
      return !isComment(rule) && rule.indexOf(REDIRECT_RULE_TYPES.ADG.marker) > -1 // some js rules may have 'redirect=' in it, so we should get rid of them
      && rule.indexOf(JS_RULE_MARKER) === -1 // get rid of rules like '_redirect=*://look.$popup'
      && !toRegExp(MARKER_IN_BASE_PART_MASK).test(rule);
    };
    /**
     * Checks if the `rule` satisfies the `type`
     * @param {string} rule - rule text
     * @param {'VALID_ADG'|'ADG'|'UBO'|'ABP'} type - type of a redirect rule
     */


    var isRedirectRuleByType = function isRedirectRuleByType(rule, type) {
      var _REDIRECT_RULE_TYPES$ = REDIRECT_RULE_TYPES[type],
          marker = _REDIRECT_RULE_TYPES$.marker,
          compatibility = _REDIRECT_RULE_TYPES$.compatibility;

      if (rule && !isComment(rule) && rule.indexOf(marker) > -1) {
        var redirectName = getRedirectName(rule, marker);
        return redirectName === Object.keys(compatibility).find(function (el) {
          return el === redirectName;
        });
      }

      return false;
    };
    /**
    * Checks if the `rule` is **valid** AdGuard redirect resource rule
    * @param {string} rule - rule text
    * @returns {boolean}
    */


    var isValidAdgRedirectRule = function isValidAdgRedirectRule(rule) {
      return isRedirectRuleByType(rule, 'VALID_ADG');
    };
    /**
    * Checks if the AdGuard redirect `rule` has Ubo analog. Needed for Adg->Ubo conversion
    * @param {string} rule - AdGuard rule text
    * @returns {boolean} - true if the rule can be converted to Ubo
    */


    var isAdgRedirectCompatibleWithUbo = function isAdgRedirectCompatibleWithUbo(rule) {
      return isAdgRedirectRule(rule) && isRedirectRuleByType(rule, 'ADG');
    };
    /**
    * Checks if the Ubo redirect `rule` has AdGuard analog. Needed for Ubo->Adg conversion
    * @param {string} rule - Ubo rule text
    * @returns {boolean} - true if the rule can be converted to AdGuard
    */


    var isUboRedirectCompatibleWithAdg = function isUboRedirectCompatibleWithAdg(rule) {
      return isRedirectRuleByType(rule, 'UBO');
    };
    /**
    * Checks if the Abp redirect `rule` has AdGuard analog. Needed for Abp->Adg conversion
    * @param {string} rule - Abp rule text
    * @returns {boolean} - true if the rule can be converted to AdGuard
    */


    var isAbpRedirectCompatibleWithAdg = function isAbpRedirectCompatibleWithAdg(rule) {
      return isRedirectRuleByType(rule, 'ABP');
    };
    /**
     * Checks if the rule has specified content type before Adg -> Ubo conversion.
     *
     * Used ONLY for Adg -> Ubo conversion
     * because Ubo redirect rules must contain content type, but Adg and Abp must not.
     *
     * Also source type can not be added automatically because of such valid rules:
     * ! Abp:
     * $rewrite=abp-resource:blank-js,xmlhttprequest
     * ! Adg:
     * $script,redirect=noopvast-2.0
     * $xmlhttprequest,redirect=noopvast-2.0
     *
     * @param {string} rule
     * @returns {boolean}
     */


    var hasValidContentType = function hasValidContentType(rule) {
      if (isRedirectRuleByType(rule, 'ADG')) {
        var ruleModifiers = parseModifiers(rule);
        var sourceType = ruleModifiers.find(function (el) {
          return VALID_SOURCE_TYPES.indexOf(el) > -1;
        });
        return sourceType !== undefined;
      }

      return false;
    };

    var validator = {
      UBO_SCRIPTLET_MASK_REG: UBO_SCRIPTLET_MASK_REG,
      ABP_SCRIPTLET_MASK: ABP_SCRIPTLET_MASK,
      ABP_SCRIPTLET_EXCEPTION_MASK: ABP_SCRIPTLET_EXCEPTION_MASK,
      isComment: isComment,
      isAdgScriptletRule: isAdgScriptletRule,
      isUboScriptletRule: isUboScriptletRule,
      isAbpSnippetRule: isAbpSnippetRule,
      getScriptletByName: getScriptletByName,
      isValidScriptletName: isValidScriptletName,
      REDIRECT_RULE_TYPES: REDIRECT_RULE_TYPES,
      isAdgRedirectRule: isAdgRedirectRule,
      isValidAdgRedirectRule: isValidAdgRedirectRule,
      isAdgRedirectCompatibleWithUbo: isAdgRedirectCompatibleWithUbo,
      isUboRedirectCompatibleWithAdg: isUboRedirectCompatibleWithAdg,
      isAbpRedirectCompatibleWithAdg: isAbpRedirectCompatibleWithAdg,
      parseModifiers: parseModifiers,
      getRedirectName: getRedirectName,
      hasValidContentType: hasValidContentType
    };

    function _iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
    }

    var iterableToArray = _iterableToArray;

    function _toArray(arr) {
      return arrayWithHoles(arr) || iterableToArray(arr) || unsupportedIterableToArray(arr) || nonIterableRest();
    }

    var toArray = _toArray;

    /**
     * AdGuard scriptlet rule
     */

    var ADGUARD_SCRIPTLET_MASK_REG = /#@?%#\/\/scriptlet\(.+\)/; // eslint-disable-next-line no-template-curly-in-string

    var ADGUARD_SCRIPTLET_TEMPLATE = '${domains}#%#//scriptlet(${args})'; // eslint-disable-next-line no-template-curly-in-string

    var ADGUARD_SCRIPTLET_EXCEPTION_TEMPLATE = '${domains}#@%#//scriptlet(${args})';
    /**
     * uBlock scriptlet rule mask
     */
    // eslint-disable-next-line no-template-curly-in-string

    var UBO_SCRIPTLET_TEMPLATE = '${domains}##+js(${args})'; // eslint-disable-next-line no-template-curly-in-string

    var UBO_SCRIPTLET_EXCEPTION_TEMPLATE = '${domains}#@#+js(${args})';
    var UBO_ALIAS_NAME_MARKER = 'ubo-'; // https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#xhr

    var UBO_XHR_TYPE = 'xhr';
    var ADG_XHR_TYPE = 'xmlhttprequest';
    /**
     * Returns array of strings separated by space which not in quotes
     * @param {string} str
     */

    var getSentences = function getSentences(str) {
      var reg = /'.*?'|".*?"|\S+/g;
      return str.match(reg);
    };
    /**
     * Replaces string with data by placeholders
     * @param {string} str
     * @param {Object} data - where keys are placeholders names
     */


    var replacePlaceholders = function replacePlaceholders(str, data) {
      return Object.keys(data).reduce(function (acc, key) {
        var reg = new RegExp("\\$\\{".concat(key, "\\}"), 'g');
        acc = acc.replace(reg, data[key]);
        return acc;
      }, str);
    };
    /**
     * Converts string of UBO scriptlet rule to AdGuard scritlet rule
     * @param {string} rule - UBO scriptlet rule
     * @returns {Array} - array with one AdGuard scriptlet rule
     */


    var convertUboScriptletToAdg = function convertUboScriptletToAdg(rule) {
      var domains = getBeforeRegExp(rule, validator.UBO_SCRIPTLET_MASK_REG);
      var mask = rule.match(validator.UBO_SCRIPTLET_MASK_REG)[0];
      var template;

      if (mask.indexOf('@') > -1) {
        template = ADGUARD_SCRIPTLET_EXCEPTION_TEMPLATE;
      } else {
        template = ADGUARD_SCRIPTLET_TEMPLATE;
      }

      var args = getStringInBraces(rule).split(/, /g).map(function (arg, index) {
        var outputArg;

        if (index === 0) {
          outputArg = arg.indexOf('.js') > -1 ? "ubo-".concat(arg) : "ubo-".concat(arg, ".js");
        } else {
          outputArg = arg;
        } // for example: dramaserial.xyz##+js(abort-current-inline-script, $, popup)


        if (arg === '$') {
          outputArg = '$$';
        }

        return outputArg;
      }).map(function (arg) {
        return wrapInSingleQuotes(arg);
      }).join(', ');
      var adgRule = replacePlaceholders(template, {
        domains: domains,
        args: args
      });
      return [adgRule];
    };
    /**
     * Convert string of ABP snippet rule to AdGuard scritlet rule
     * @param {string} rule - ABP snippet rule
     * @returns {Array} - array of AdGuard scriptlet rules -
     * one or few items depends on Abp-rule
     */

    var convertAbpSnippetToAdg = function convertAbpSnippetToAdg(rule) {
      var SEMICOLON_DIVIDER = /;(?=(?:(?:[^"]*"){2})*[^"]*$)/g;
      var mask = rule.indexOf(validator.ABP_SCRIPTLET_MASK) > -1 ? validator.ABP_SCRIPTLET_MASK : validator.ABP_SCRIPTLET_EXCEPTION_MASK;
      var template = mask === validator.ABP_SCRIPTLET_MASK ? ADGUARD_SCRIPTLET_TEMPLATE : ADGUARD_SCRIPTLET_EXCEPTION_TEMPLATE;
      var domains = substringBefore(rule, mask);
      var args = substringAfter(rule, mask);
      return args.split(SEMICOLON_DIVIDER).map(function (args) {
        return getSentences(args).filter(function (arg) {
          return arg;
        }).map(function (arg, index) {
          return index === 0 ? "abp-".concat(arg) : arg;
        }).map(function (arg) {
          return wrapInSingleQuotes(arg);
        }).join(', ');
      }).map(function (args) {
        return replacePlaceholders(template, {
          domains: domains,
          args: args
        });
      });
    };
    /**
     * Converts scriptlet rule to AdGuard one
     * @param {string} rule
     * @returns {Array} - array of AdGuard scriptlet rules -
     * one item for Adg and Ubo or few items for Abp
     */

    var convertScriptletToAdg = function convertScriptletToAdg(rule) {
      var result;

      if (validator.isUboScriptletRule(rule)) {
        result = convertUboScriptletToAdg(rule);
      } else if (validator.isAbpSnippetRule(rule)) {
        result = convertAbpSnippetToAdg(rule);
      } else if (validator.isAdgScriptletRule(rule) || validator.isComment(rule)) {
        result = [rule];
      }

      return result;
    };
    /**
     * Converts UBO scriptlet rule to AdGuard one
     * @param {string} rule - AdGuard scriptlet rule
     * @returns {string} - UBO scriptlet rule
     */

    var convertAdgScriptletToUbo = function convertAdgScriptletToUbo(rule) {
      var res;

      if (validator.isAdgScriptletRule(rule)) {
        var _parseRule = parseRule(rule),
            parsedName = _parseRule.name,
            parsedParams = _parseRule.args; // object of name and aliases for the Adg-scriptlet


        var adgScriptletObject = Object.keys(scriptletList).map(function (el) {
          return scriptletList[el];
        }).map(function (s) {
          var _s$names = toArray(s.names),
              name = _s$names[0],
              aliases = _s$names.slice(1);

          return {
            name: name,
            aliases: aliases
          };
        }).find(function (el) {
          return el.name === parsedName || el.aliases.indexOf(parsedName) >= 0;
        });
        var aliases = adgScriptletObject.aliases;

        if (aliases.length > 0) {
          var uboAlias = adgScriptletObject.aliases // eslint-disable-next-line no-restricted-properties
          .find(function (alias) {
            return alias.includes(UBO_ALIAS_NAME_MARKER);
          });

          if (uboAlias) {
            var mask = rule.match(ADGUARD_SCRIPTLET_MASK_REG)[0];
            var template;

            if (mask.indexOf('@') > -1) {
              template = UBO_SCRIPTLET_EXCEPTION_TEMPLATE;
            } else {
              template = UBO_SCRIPTLET_TEMPLATE;
            }

            var domains = getBeforeRegExp(rule, ADGUARD_SCRIPTLET_MASK_REG);
            var uboName = uboAlias.replace(UBO_ALIAS_NAME_MARKER, '') // '.js' in the Ubo scriptlet name can be omitted
            // https://github.com/gorhill/uBlock/wiki/Resources-Library#general-purpose-scriptlets
            .replace('.js', '');
            var args = parsedParams.length > 0 ? "".concat(uboName, ", ").concat(parsedParams.join(', ')) : uboName;
            var uboRule = replacePlaceholders(template, {
              domains: domains,
              args: args
            });
            res = uboRule;
          }
        }
      }

      return res;
    };
    /**
     * Validates any scriptlet rule
     * @param {string} input - can be Adguard or Ubo or Abp scriptlet rule
     */

    var isValidScriptletRule = function isValidScriptletRule(input) {
      if (!input) {
        return false;
      } // ABP 'input' rule may contain more than one snippet


      var rulesArray = convertScriptletToAdg(input); // checking if each of parsed scriptlets is valid
      // if at least one of them is not valid - whole 'input' rule is not valid too

      var isValid = rulesArray.reduce(function (acc, rule) {
        var parsedRule = parseRule(rule);
        return validator.isValidScriptletName(parsedRule.name) && acc;
      }, true);
      return isValid;
    };
    /**
     * Converts Ubo redirect rule to Adg one
     * @param {string} rule
     * @returns {string}
     */

    var convertUboRedirectToAdg = function convertUboRedirectToAdg(rule) {
      var firstPartOfRule = substringBefore(rule, '$');
      var uboModifiers = validator.parseModifiers(rule);
      var adgModifiers = uboModifiers.map(function (el) {
        if (el.indexOf(validator.REDIRECT_RULE_TYPES.UBO.marker) > -1) {
          var uboName = substringAfter(el, validator.REDIRECT_RULE_TYPES.UBO.marker);
          var adgName = validator.REDIRECT_RULE_TYPES.UBO.compatibility[uboName];
          return "".concat(validator.REDIRECT_RULE_TYPES.ADG.marker).concat(adgName);
        }

        if (el === UBO_XHR_TYPE) {
          return ADG_XHR_TYPE;
        }

        return el;
      }).join(',');
      return "".concat(firstPartOfRule, "$").concat(adgModifiers);
    };
    /**
     * Converts Abp redirect rule to Adg one
     * @param {string} rule
     * @returns {string}
     */

    var convertAbpRedirectToAdg = function convertAbpRedirectToAdg(rule) {
      var firstPartOfRule = substringBefore(rule, '$');
      var abpModifiers = validator.parseModifiers(rule);
      var adgModifiers = abpModifiers.map(function (el) {
        if (el.indexOf(validator.REDIRECT_RULE_TYPES.ABP.marker) > -1) {
          var abpName = substringAfter(el, validator.REDIRECT_RULE_TYPES.ABP.marker);
          var adgName = validator.REDIRECT_RULE_TYPES.ABP.compatibility[abpName];
          return "".concat(validator.REDIRECT_RULE_TYPES.ADG.marker).concat(adgName);
        }

        return el;
      }).join(',');
      return "".concat(firstPartOfRule, "$").concat(adgModifiers);
    };
    /**
     * Converts redirect rule to AdGuard one
     * @param {string} rule
     * @returns {string}
     */

    var convertRedirectToAdg = function convertRedirectToAdg(rule) {
      var result;

      if (validator.isUboRedirectCompatibleWithAdg(rule)) {
        result = convertUboRedirectToAdg(rule);
      } else if (validator.isAbpRedirectCompatibleWithAdg(rule)) {
        result = convertAbpRedirectToAdg(rule);
      } else if (validator.isValidAdgRedirectRule(rule)) {
        result = rule;
      }

      return result;
    };
    /**
     * Converts Adg redirect rule to Ubo one
     * @param {string} rule
     * @returns {string}
     */

    var convertAdgRedirectToUbo = function convertAdgRedirectToUbo(rule) {
      if (!validator.hasValidContentType(rule)) {
        throw new Error("Rule is not valid for converting to Ubo. Source type is not specified in the rule: ".concat(rule));
      } else {
        var firstPartOfRule = substringBefore(rule, '$');
        var uboModifiers = validator.parseModifiers(rule);
        var adgModifiers = uboModifiers.map(function (el) {
          if (el.indexOf(validator.REDIRECT_RULE_TYPES.ADG.marker) > -1) {
            var adgName = substringAfter(el, validator.REDIRECT_RULE_TYPES.ADG.marker);
            var uboName = validator.REDIRECT_RULE_TYPES.ADG.compatibility[adgName];
            return "".concat(validator.REDIRECT_RULE_TYPES.UBO.marker).concat(uboName);
          }

          return el;
        }).join(',');
        return "".concat(firstPartOfRule, "$").concat(adgModifiers);
      }
    };

    /**
     * @redirect google-analytics
     *
     * @description
     * Mocks Google Analytics API.
     *
     * Related UBO redirect resource:
     * https://github.com/gorhill/uBlock/blob/a94df7f3b27080ae2dcb3b914ace39c0c294d2f6/src/web_accessible_resources/google-analytics_analytics.js
     *
     * **Example**
     * ```
     * ||google-analytics.com/analytics.js$script,redirect=google-analytics
     * ```
     */

    function GoogleAnalytics(source) {
      // eslint-disable-next-line func-names
      var Tracker = function Tracker() {}; // constructor


      var proto = Tracker.prototype;
      proto.get = noopFunc;
      proto.set = noopFunc;
      proto.send = noopFunc;
      var googleAnalyticsName = window.GoogleAnalyticsObject || 'ga'; // a -- fake arg for 'ga.length < 1' antiadblock checking
      // eslint-disable-next-line no-unused-vars

      function ga(a) {
        var len = arguments.length;

        if (len === 0) {
          return;
        } // eslint-disable-next-line prefer-rest-params


        var lastArg = arguments[len - 1];

        if (typeof lastArg !== 'object' || lastArg === null || typeof lastArg.hitCallback !== 'function') {
          return;
        }

        try {
          lastArg.hitCallback(); // eslint-disable-next-line no-empty
        } catch (ex) {}
      }

      ga.create = function () {
        return new Tracker();
      };

      ga.getByName = noopNull;
      ga.getAll = noopArray;
      ga.remove = noopFunc;
      ga.loaded = true;
      window[googleAnalyticsName] = ga;
      var _window = window,
          dataLayer = _window.dataLayer;

      if (dataLayer instanceof Object && dataLayer.hide instanceof Object && typeof dataLayer.hide.end === 'function') {
        dataLayer.hide.end();
      }

      hit(source);
    }
    GoogleAnalytics.names = ['google-analytics', 'ubo-google-analytics_analytics.js', 'google-analytics_analytics.js'];
    GoogleAnalytics.injections = [hit, noopFunc, noopNull, noopArray];

    /* eslint-disable no-underscore-dangle */
    /**
     * @redirect google-analytics-ga
     *
     * @description
     * Mocks old Google Analytics API.
     *
     * Related UBO redirect resource:
     * https://github.com/gorhill/uBlock/blob/a94df7f3b27080ae2dcb3b914ace39c0c294d2f6/src/web_accessible_resources/google-analytics_ga.js
     *
     * **Example**
     * ```
     * ||google-analytics.com/ga.js$script,redirect=google-analytics-ga
     * ```
     */

    function GoogleAnalyticsGa(source) {
      // Gaq constructor
      function Gaq() {}

      Gaq.prototype.Na = noopFunc;
      Gaq.prototype.O = noopFunc;
      Gaq.prototype.Sa = noopFunc;
      Gaq.prototype.Ta = noopFunc;
      Gaq.prototype.Va = noopFunc;
      Gaq.prototype._createAsyncTracker = noopFunc;
      Gaq.prototype._getAsyncTracker = noopFunc;
      Gaq.prototype._getPlugin = noopFunc;

      Gaq.prototype.push = function (data) {
        if (typeof data === 'function') {
          data();
          return;
        }

        if (Array.isArray(data) === false) {
          return;
        } // https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiDomainDirectory#_gat.GA_Tracker_._link


        if (data[0] === '_link' && typeof data[1] === 'string') {
          window.location.assign(data[1]);
        } // https://github.com/gorhill/uBlock/issues/2162


        if (data[0] === '_set' && data[1] === 'hitCallback' && typeof data[2] === 'function') {
          data[2]();
        }
      };

      var gaq = new Gaq();
      var asyncTrackers = window._gaq || [];

      if (Array.isArray(asyncTrackers)) {
        while (asyncTrackers[0]) {
          gaq.push(asyncTrackers.shift());
        }
      } // eslint-disable-next-line no-multi-assign


      window._gaq = gaq.qf = gaq; // Gat constructor

      function Gat() {} // Mock tracker api


      var api = ['_addIgnoredOrganic', '_addIgnoredRef', '_addItem', '_addOrganic', '_addTrans', '_clearIgnoredOrganic', '_clearIgnoredRef', '_clearOrganic', '_cookiePathCopy', '_deleteCustomVar', '_getName', '_setAccount', '_getAccount', '_getClientInfo', '_getDetectFlash', '_getDetectTitle', '_getLinkerUrl', '_getLocalGifPath', '_getServiceMode', '_getVersion', '_getVisitorCustomVar', '_initData', '_link', '_linkByPost', '_setAllowAnchor', '_setAllowHash', '_setAllowLinker', '_setCampContentKey', '_setCampMediumKey', '_setCampNameKey', '_setCampNOKey', '_setCampSourceKey', '_setCampTermKey', '_setCampaignCookieTimeout', '_setCampaignTrack', '_setClientInfo', '_setCookiePath', '_setCookiePersistence', '_setCookieTimeout', '_setCustomVar', '_setDetectFlash', '_setDetectTitle', '_setDomainName', '_setLocalGifPath', '_setLocalRemoteServerMode', '_setLocalServerMode', '_setReferrerOverride', '_setRemoteServerMode', '_setSampleRate', '_setSessionTimeout', '_setSiteSpeedSampleRate', '_setSessionCookieTimeout', '_setVar', '_setVisitorCookieTimeout', '_trackEvent', '_trackPageLoadTime', '_trackPageview', '_trackSocial', '_trackTiming', '_trackTrans', '_visitCode'];
      var tracker = api.reduce(function (res, funcName) {
        res[funcName] = noopFunc;
        return res;
      }, {});

      tracker._getLinkerUrl = function (a) {
        return a;
      };

      Gat.prototype._anonymizeIP = noopFunc;
      Gat.prototype._createTracker = noopFunc;
      Gat.prototype._forceSSL = noopFunc;
      Gat.prototype._getPlugin = noopFunc;

      Gat.prototype._getTracker = function () {
        return tracker;
      };

      Gat.prototype._getTrackerByName = function () {
        return tracker;
      };

      Gat.prototype._getTrackers = noopFunc;
      Gat.prototype.aa = noopFunc;
      Gat.prototype.ab = noopFunc;
      Gat.prototype.hb = noopFunc;
      Gat.prototype.la = noopFunc;
      Gat.prototype.oa = noopFunc;
      Gat.prototype.pa = noopFunc;
      Gat.prototype.u = noopFunc;
      var gat = new Gat();
      window._gat = gat;
      hit(source);
    }
    GoogleAnalyticsGa.names = ['google-analytics-ga', 'ubo-google-analytics_ga.js', 'google-analytics_ga.js'];
    GoogleAnalyticsGa.injections = [hit, noopFunc];

    /* eslint-disable max-len */

    /**
     * @redirect googlesyndication-adsbygoogle
     *
     * @description
     * Mocks Google AdSense API.
     *
     * Related UBO redirect resource:
     * https://github.com/gorhill/uBlock/blob/a94df7f3b27080ae2dcb3b914ace39c0c294d2f6/src/web_accessible_resources/googlesyndication_adsbygoogle.js
     *
     * **Example**
     * ```
     * ||pagead2.googlesyndication.com/pagead/js/adsbygoogle.js$script,redirect=googlesyndication-adsbygoogle
     * ```
     */

    /* eslint-enable max-len */

    function GoogleSyndicationAdsByGoogle(source) {
      window.adsbygoogle = {
        length: 0,
        loaded: true,
        push: function push() {
          this.length += 1;
        }
      };
      var adElems = document.querySelectorAll('.adsbygoogle');
      var css = 'height:1px!important;max-height:1px!important;max-width:1px!important;width:1px!important;';
      var statusAttrName = 'data-adsbygoogle-status';
      var ASWIFT_IFRAME_MARKER = 'aswift_';
      var GOOGLE_ADS_IFRAME_MARKER = 'google_ads_iframe_';
      var executed = false;

      for (var i = 0; i < adElems.length; i += 1) {
        var adElemChildNodes = adElems[i].childNodes;
        var childNodesQuantity = adElemChildNodes.length; // childNodes of .adsbygoogle can be defined if scriptlet was executed before
        // so we should check are that childNodes exactly defined by us
        // TODO: remake after scriptlets context developing in 1.3

        var areIframesDefined = false;

        if (childNodesQuantity > 0) {
          // it should be only 2 child iframes if scriptlet was executed
          areIframesDefined = childNodesQuantity === 2 // the first of child nodes should be aswift iframe
          && adElemChildNodes[0].tagName.toLowerCase() === 'iframe' && adElemChildNodes[0].id.indexOf(ASWIFT_IFRAME_MARKER) > -1 // the second of child nodes should be google_ads iframe
          && adElemChildNodes[1].tagName.toLowerCase() === 'iframe' && adElemChildNodes[1].id.indexOf(GOOGLE_ADS_IFRAME_MARKER) > -1;
        }

        if (!areIframesDefined) {
          // here we do the job if scriptlet has not been executed earlier
          adElems[i].setAttribute(statusAttrName, 'done');
          var aswiftIframe = document.createElement('iframe');
          aswiftIframe.id = "".concat(ASWIFT_IFRAME_MARKER).concat(i + 1);
          aswiftIframe.style = css;
          adElems[i].appendChild(aswiftIframe);
          var innerAswiftIframe = document.createElement('iframe');
          aswiftIframe.contentWindow.document.body.appendChild(innerAswiftIframe);
          var googleadsIframe = document.createElement('iframe');
          googleadsIframe.id = "".concat(GOOGLE_ADS_IFRAME_MARKER).concat(i + 1);
          googleadsIframe.style = css;
          adElems[i].appendChild(googleadsIframe);
          var innerGoogleadsIframe = document.createElement('iframe');
          googleadsIframe.contentWindow.document.body.appendChild(innerGoogleadsIframe);
          executed = true;
        }
      }

      if (executed) {
        hit(source);
      }
    }
    GoogleSyndicationAdsByGoogle.names = ['googlesyndication-adsbygoogle', 'ubo-googlesyndication_adsbygoogle.js', 'googlesyndication_adsbygoogle.js'];
    GoogleSyndicationAdsByGoogle.injections = [hit];

    /**
     * @redirect googletagmanager-gtm
     *
     * @description
     * Mocks Google Tag Manager API.
     *
     * Related UBO redirect resource:
     * https://github.com/gorhill/uBlock/blob/a94df7f3b27080ae2dcb3b914ace39c0c294d2f6/src/web_accessible_resources/googletagmanager_gtm.js
     *
     * **Example**
     * ```
     * ||googletagmanager.com/gtm.js$script,redirect=googletagmanager-gtm
     * ```
     */

    function GoogleTagManagerGtm(source) {
      window.ga = window.ga || noopFunc;
      var _window = window,
          dataLayer = _window.dataLayer,
          google_optimize = _window.google_optimize; // eslint-disable-line camelcase

      if (dataLayer instanceof Object === false) {
        return;
      }

      if (dataLayer.hide instanceof Object && typeof dataLayer.hide.end === 'function') {
        dataLayer.hide.end();
      }

      if (typeof dataLayer.push === 'function') {
        dataLayer.push = function (data) {
          if (data instanceof Object && typeof data.eventCallback === 'function') {
            setTimeout(data.eventCallback, 1);
          }
        };
      } // https://github.com/AdguardTeam/Scriptlets/issues/81


      if (google_optimize instanceof Object && typeof google_optimize.get === 'function') {
        // eslint-disable-line camelcase
        var googleOptimizeWrapper = {};
        googleOptimizeWrapper.get = noopFunc;
        window.google_optimize = googleOptimizeWrapper;
      }

      hit(source);
    }
    GoogleTagManagerGtm.names = ['googletagmanager-gtm', 'ubo-googletagmanager_gtm.js', 'googletagmanager_gtm.js'];
    GoogleTagManagerGtm.injections = [hit, noopFunc];

    /**
     * @redirect googletagservices-gpt
     *
     * @description
     * Mocks Google Publisher Tag API.
     *
     * Related UBO redirect resource:
     * https://github.com/gorhill/uBlock/blob/a94df7f3b27080ae2dcb3b914ace39c0c294d2f6/src/web_accessible_resources/googletagservices_gpt.js
     *
     * **Example**
     * ```
     * ||googletagservices.com/tag/js/gpt.js$script,redirect=googletagservices-gpt
     * ```
     */

    function GoogleTagServicesGpt(source) {
      var companionAdsService = {
        addEventListener: noopThis,
        enableSyncLoading: noopFunc,
        setRefreshUnfilledSlots: noopFunc
      };
      var contentService = {
        addEventListener: noopThis,
        setContent: noopFunc
      };

      function PassbackSlot() {} // constructor


      PassbackSlot.prototype.display = noopFunc;
      PassbackSlot.prototype.get = noopNull;
      PassbackSlot.prototype.set = noopThis;
      PassbackSlot.prototype.setClickUrl = noopThis;
      PassbackSlot.prototype.setTagForChildDirectedTreatment = noopThis;
      PassbackSlot.prototype.setTargeting = noopThis;
      PassbackSlot.prototype.updateTargetingFromMap = noopThis;

      function SizeMappingBuilder() {} // constructor


      SizeMappingBuilder.prototype.addSize = noopThis;
      SizeMappingBuilder.prototype.build = noopNull;

      function Slot() {} // constructor


      Slot.prototype.addService = noopThis;
      Slot.prototype.clearCategoryExclusions = noopThis;
      Slot.prototype.clearTargeting = noopThis;
      Slot.prototype.defineSizeMapping = noopThis;
      Slot.prototype.get = noopNull;
      Slot.prototype.getAdUnitPath = noopArray;
      Slot.prototype.getAttributeKeys = noopArray;
      Slot.prototype.getCategoryExclusions = noopArray;
      Slot.prototype.getDomId = noopStr;
      Slot.prototype.getSlotElementId = noopStr;
      Slot.prototype.getSlotId = noopThis;
      Slot.prototype.getTargeting = noopArray;
      Slot.prototype.getTargetingKeys = noopArray;
      Slot.prototype.set = noopThis;
      Slot.prototype.setCategoryExclusion = noopThis;
      Slot.prototype.setClickUrl = noopThis;
      Slot.prototype.setCollapseEmptyDiv = noopThis;
      Slot.prototype.setTargeting = noopThis;
      var pubAdsService = {
        addEventListener: noopThis,
        clear: noopFunc,
        clearCategoryExclusions: noopThis,
        clearTagForChildDirectedTreatment: noopThis,
        clearTargeting: noopThis,
        collapseEmptyDivs: noopFunc,
        defineOutOfPagePassback: function defineOutOfPagePassback() {
          return new PassbackSlot();
        },
        definePassback: function definePassback() {
          return new PassbackSlot();
        },
        disableInitialLoad: noopFunc,
        display: noopFunc,
        enableAsyncRendering: noopFunc,
        enableSingleRequest: noopFunc,
        enableSyncRendering: noopFunc,
        enableVideoAds: noopFunc,
        get: noopNull,
        getAttributeKeys: noopArray,
        getTargeting: noopFunc,
        getTargetingKeys: noopArray,
        getSlots: noopArray,
        refresh: noopFunc,
        set: noopThis,
        setCategoryExclusion: noopThis,
        setCentering: noopFunc,
        setCookieOptions: noopThis,
        setForceSafeFrame: noopThis,
        setLocation: noopThis,
        setPublisherProvidedId: noopThis,
        setRequestNonPersonalizedAds: noopThis,
        setSafeFrameConfig: noopThis,
        setTagForChildDirectedTreatment: noopThis,
        setTargeting: noopThis,
        setVideoContent: noopThis,
        updateCorrelator: noopFunc
      };
      var _window = window,
          _window$googletag = _window.googletag,
          googletag = _window$googletag === void 0 ? {} : _window$googletag;
      var _googletag$cmd = googletag.cmd,
          cmd = _googletag$cmd === void 0 ? [] : _googletag$cmd;
      googletag.apiReady = true;
      googletag.cmd = [];

      googletag.cmd.push = function (a) {
        try {
          a(); // eslint-disable-next-line no-empty
        } catch (ex) {}

        return 1;
      };

      googletag.companionAds = function () {
        return companionAdsService;
      };

      googletag.content = function () {
        return contentService;
      };

      googletag.defineOutOfPageSlot = function () {
        return new Slot();
      };

      googletag.defineSlot = function () {
        return new Slot();
      };

      googletag.destroySlots = noopFunc;
      googletag.disablePublisherConsole = noopFunc;
      googletag.display = noopFunc;
      googletag.enableServices = noopFunc;
      googletag.getVersion = noopStr;

      googletag.pubads = function () {
        return pubAdsService;
      };

      googletag.pubadsReady = true;
      googletag.setAdIframeTitle = noopFunc;

      googletag.sizeMapping = function () {
        return new SizeMappingBuilder();
      };

      window.googletag = googletag;

      while (cmd.length !== 0) {
        googletag.cmd.push(cmd.shift());
      }

      hit(source);
    }
    GoogleTagServicesGpt.names = ['googletagservices-gpt', 'ubo-googletagservices_gpt.js', 'googletagservices_gpt.js'];
    GoogleTagServicesGpt.injections = [hit, noopFunc, noopThis, noopNull, noopArray, noopStr];

    /**
     * @redirect scorecardresearch-beacon
     *
     * @description
     * Mocks Scorecard Research API.
     *
     * Related UBO redirect resource:
     * https://github.com/gorhill/uBlock/blob/a94df7f3b27080ae2dcb3b914ace39c0c294d2f6/src/web_accessible_resources/scorecardresearch_beacon.js
     *
     * **Example**
     * ```
     * ||sb.scorecardresearch.com/beacon.js$script,redirect=scorecardresearch-beacon
     * ```
     */

    function ScoreCardResearchBeacon(source) {
      window.COMSCORE = {
        purge: function purge() {
          // eslint-disable-next-line no-underscore-dangle
          window._comscore = [];
        },
        beacon: function beacon() {}
      };
      hit(source);
    }
    ScoreCardResearchBeacon.names = ['scorecardresearch-beacon', 'ubo-scorecardresearch_beacon.js', 'scorecardresearch_beacon.js'];
    ScoreCardResearchBeacon.injections = [hit];

    /**
     * @redirect metrika-yandex-tag
     *
     * @description
     * Mocks Yandex Metrika API.
     * https://yandex.ru/support/metrica/objects/method-reference.html
     *
     * **Example**
     * ```
     * ||mc.yandex.ru/metrika/tag.js$script,redirect=metrika-yandex-tag
     * ```
     */

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
    metrikaYandexTag.names = ['metrika-yandex-tag'];
    metrikaYandexTag.injections = [hit, noopFunc];

    /**
     * @redirect metrika-yandex-watch
     *
     * @description
     * Mocks the old Yandex Metrika API.
     * https://yandex.ru/support/metrica/objects/_method-reference.html
     *
     * **Example**
     * ```
     * ||mc.yandex.ru/metrika/watch.js$script,redirect=metrika-yandex-watch
     * ```
     */

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
    metrikaYandexWatch.names = ['metrika-yandex-watch'];
    metrikaYandexWatch.injections = [hit, noopFunc];

    /**
     * @redirect amazon-apstag
     *
     * @description
     * Mocks Amazon's apstag.js
     *
     * Related UBO redirect resource:
     * https://github.com/gorhill/uBlock/blob/f842ab6d3c1cf0394f95d27092bf59627262da40/src/web_accessible_resources/amazon_apstag.js
     *
     * **Example**
     * ```
     * ||amazon-adsystem.com/aax2/apstag.js$script,redirect=amazon-apstag
     * ```
     */

    function AmazonApstag(source) {
      var apstagWrapper = {
        fetchBids: function fetchBids(a, b) {
          if (typeof b === 'function') {
            b([]);
          }
        },
        init: noopFunc,
        setDisplayBids: noopFunc,
        targetingKeys: noopFunc
      };
      window.apstag = apstagWrapper;
      hit(source);
    }
    AmazonApstag.names = ['amazon-apstag', 'ubo-amazon_apstag.js', 'amazon_apstag.js'];
    AmazonApstag.injections = [hit, noopFunc];

    var redirectsList = /*#__PURE__*/Object.freeze({
        __proto__: null,
        noeval: noeval,
        GoogleAnalytics: GoogleAnalytics,
        GoogleAnalyticsGa: GoogleAnalyticsGa,
        GoogleSyndicationAdsByGoogle: GoogleSyndicationAdsByGoogle,
        GoogleTagManagerGtm: GoogleTagManagerGtm,
        GoogleTagServicesGpt: GoogleTagServicesGpt,
        ScoreCardResearchBeacon: ScoreCardResearchBeacon,
        metrikaYandexTag: metrikaYandexTag,
        metrikaYandexWatch: metrikaYandexWatch,
        preventFab: preventFab,
        setPopadsDummy: setPopadsDummy,
        preventPopadsNet: preventPopadsNet,
        AmazonApstag: AmazonApstag
    });

    /**
     * Finds redirect resource by it's name
     * @param {string} name - redirect name
     */

    var getRedirectByName = function getRedirectByName(name) {
      var redirects = Object.keys(redirectsList).map(function (key) {
        return redirectsList[key];
      });
      return redirects.find(function (r) {
        return r.names && r.names.indexOf(name) > -1;
      });
    };
    /**
     * @typedef {Object} Source - redirect properties
     * @property {string} name redirect name
     * @property {Array<string>} args Arguments for redirect function
     * @property {'extension'|'test'} [engine] -
     * Defines the final form of redirect string presentation
     * @property {boolean} [verbose] flag to enable printing to console debug information
     */

    /**
     * Returns redirect code by param
     * @param {Source} source
     * @returns {string} redirect code
     */


    var getRedirectCode = function getRedirectCode(source) {
      var redirect = getRedirectByName(source.name);
      var result = attachDependencies(redirect);
      result = addCall(redirect, result); // redirect code for different sources is checked in tests
      // so it should be just a code without any source and props passed

      result = source.engine === 'test' ? wrapInNonameFunc(result) : passSourceAndProps(source, result);
      return result;
    };

    var redirectsCjs = {
      getCode: getRedirectCode,
      isAdgRedirectRule: validator.isAdgRedirectRule,
      isValidAdgRedirectRule: validator.isValidAdgRedirectRule,
      isAdgRedirectCompatibleWithUbo: validator.isAdgRedirectCompatibleWithUbo,
      isUboRedirectCompatibleWithAdg: validator.isUboRedirectCompatibleWithAdg,
      isAbpRedirectCompatibleWithAdg: validator.isAbpRedirectCompatibleWithAdg,
      convertUboRedirectToAdg: convertUboRedirectToAdg,
      convertAbpRedirectToAdg: convertAbpRedirectToAdg,
      convertRedirectToAdg: convertRedirectToAdg,
      convertAdgRedirectToUbo: convertAdgRedirectToUbo
    };

    /**
     * @typedef {Object} Source - scriptlet properties
     * @property {string} name Scriptlet name
     * @property {Array<string>} args Arguments for scriptlet function
     * @property {'extension'|'corelibs'|'test'} engine -
     * Defines the final form of scriptlet string presentation
     * @property {string} [version]
     * @property {boolean} [verbose] flag to enable printing to console debug information
     * @property {string} [ruleText] Source rule text is used for debugging purposes
     * @property {string} [domainName] domain name where scriptlet is applied; for debugging purposes
     */

    /**
     * Returns scriptlet code by param
     * @param {Source} source
     * @returns {string} scriptlet code
     */

    function getScriptletCode(source) {
      if (!validator.isValidScriptletName(source.name)) {
        return null;
      }

      var scriptlet = validator.getScriptletByName(source.name);
      var result = attachDependencies(scriptlet);
      result = addCall(scriptlet, result);
      result = source.engine === 'corelibs' || source.engine === 'test' ? wrapInNonameFunc(result) : passSourceAndProps(source, result);
      return result;
    }
    /**
     * Scriptlets variable
     *
     * @returns {Object} object with methods:
     * `invoke` method receives one argument with `Source` type
     * `validate` method receives one argument with `String` type
     */


    var scriptletsObject = function () {
      return {
        invoke: getScriptletCode,
        isValidScriptletName: validator.isValidScriptletName,
        isValidScriptletRule: isValidScriptletRule,
        isAdgScriptletRule: validator.isAdgScriptletRule,
        isUboScriptletRule: validator.isUboScriptletRule,
        isAbpSnippetRule: validator.isAbpSnippetRule,
        convertUboToAdg: convertUboScriptletToAdg,
        convertAbpToAdg: convertAbpSnippetToAdg,
        convertScriptletToAdg: convertScriptletToAdg,
        convertAdgToUbo: convertAdgScriptletToUbo,
        redirects: redirectsCjs
      };
    }();

    /**
     * Expose scriptlets to global
     */
    // eslint-disable-next-line no-undef

    scriptlets = scriptletsObject;

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
