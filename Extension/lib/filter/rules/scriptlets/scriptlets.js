
/**
 * AdGuard Scriptlets
 * Version 1.4.3
 */

(function () {

    /**
     * Returns wildcard symbol
     * @returns {string} '*'
     */
    var getWildcardSymbol = function getWildcardSymbol() {
      return '*';
    };

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

      var prop = chain.slice(0, pos); // https://github.com/AdguardTeam/Scriptlets/issues/128

      if (base === null) {
        // if base is null, return 'null' as base.
        // it's needed for triggering the reason logging while debugging
        return {
          base: base,
          prop: prop,
          chain: chain
        };
      }

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
        if (chain === getWildcardSymbol() || chain === '[]') {
          // eslint-disable-next-line no-restricted-syntax
          for (var key in base) {
            // to process each key in base except inherited ones
            if (Object.prototype.hasOwnProperty.call(base, key)) {
              output.push({
                base: base,
                prop: key
              });
            }
          }
        } else {
          output.push({
            base: base,
            prop: chain
          });
        }

        return output;
      }

      var prop = chain.slice(0, pos);
      var shouldLookThrough = prop === '[]' && Array.isArray(base) || prop === getWildcardSymbol() && base instanceof Object;

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
     * Determines whether the passed value is NaN
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
     * @param {*} num
     * @returns {boolean}
     */
    var nativeIsNaN = function nativeIsNaN(num) {
      var native = Number.isNaN || window.isNaN; // eslint-disable-line compat/compat

      return native(num);
    };
    /**
     * Determines whether the passed value is a finite number
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite
     * @param {*} num
     * @returns {boolean}
     */

    var nativeIsFinite = function nativeIsFinite(num) {
      var native = Number.isFinite || window.isFinite; // eslint-disable-line compat/compat

      return native(num);
    };

    /**
     * Converts object to array of pairs.
     * Object.entries() polyfill because it is not supported by IE
     * https://caniuse.com/?search=Object.entries
     * @param {Object} object
     * @returns {Array} array of pairs
     */
    var getObjectEntries = function getObjectEntries(object) {
      var keys = Object.keys(object);
      var entries = [];
      keys.forEach(function (key) {
        return entries.push([key, object[key]]);
      });
      return entries;
    };
    /**
     * Converts array of pairs to object.
     * Object.fromEntries() polyfill because it is not supported by IE
     * https://caniuse.com/?search=Object.fromEntries
     * @param {Array} entries - array of pairs
     * @returns {Object}
     */

    var getObjectFromEntries = function getObjectFromEntries(entries) {
      var output = entries.reduce(function (acc, el) {
        var key = el[0];
        var value = el[1];
        acc[key] = value;
        return acc;
      }, {});
      return output;
    };
    /**
     * Checks whether the obj is an empty object
     * @param {Object} obj
     * @returns {boolean}
     */

    var isEmptyObject = function isEmptyObject(obj) {
      return Object.keys(obj).length === 0;
    };

    /**
     * String.prototype.replaceAll polifill
     * @param {string} input input string
     * @param {string} substr to look for
     * @param {string} newSubstr replacement
     * @returns {string}
     */

    var replaceAll = function replaceAll(input, substr, newSubstr) {
      return input.split(substr).join(newSubstr);
    };
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
      if (!str || str === '') {
        var DEFAULT_VALUE = '.?';
        return new RegExp(DEFAULT_VALUE);
      }

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
    /**
     * Checks whether the string starts with the substring
     * @param {string} str full string
     * @param {string} prefix substring
     * @returns {boolean}
     */

    var startsWith = function startsWith(str, prefix) {
      // if str === '', (str && false) will return ''
      // that's why it has to be !!str
      return !!str && str.indexOf(prefix) === 0;
    };
    /**
     * Checks whether the string ends with the substring
     * @param {string} str full string
     * @param {string} ending substring
     * @returns {boolean}
     */

    var endsWith = function endsWith(str, ending) {
      // if str === '', (str && false) will return ''
      // that's why it has to be !!str
      return !!str && str.indexOf(ending) === str.length - ending.length;
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
     * Prepares RTCPeerConnection config as string for proper logging
     * @param {*} config
     * @returns {string} stringified config
    */

    var convertRtcConfigToString = function convertRtcConfigToString(config) {
      var UNDEF_STR = 'undefined';
      var str = UNDEF_STR;

      if (config === null) {
        str = 'null';
      } else if (config instanceof Object) {
        var SERVERS_PROP_NAME = 'iceServers';
        var URLS_PROP_NAME = 'urls';
        /*
            const exampleConfig = {
                'iceServers': [
                    'urls': ['stun:35.66.206.188:443'],
                ],
            };
        */

        if (Object.prototype.hasOwnProperty.call(config, SERVERS_PROP_NAME) && Object.prototype.hasOwnProperty.call(config[SERVERS_PROP_NAME][0], URLS_PROP_NAME) && !!config[SERVERS_PROP_NAME][0][URLS_PROP_NAME]) {
          str = config[SERVERS_PROP_NAME][0][URLS_PROP_NAME].toString();
        }
      }

      return str;
    };
    /**
     * @typedef {Object} MatchData
     * @property {boolean} isInvertedMatch
     * @property {RegExp} matchRegexp
     */

    /**
     * Parses match arg with possible negation for no matching.
     * Needed for prevent-setTimeout, prevent-setInterval,
     * prevent-requestAnimationFrame and prevent-window-open
     * @param {string} match
     * @returns {MatchData}
     */

    var parseMatchArg = function parseMatchArg(match) {
      var INVERT_MARKER = '!';
      var isInvertedMatch = startsWith(match, INVERT_MARKER);
      var matchValue = isInvertedMatch ? match.slice(1) : match;
      var matchRegexp = toRegExp(matchValue);
      return {
        isInvertedMatch: isInvertedMatch,
        matchRegexp: matchRegexp
      };
    };
    /**
     * @typedef {Object} DelayData
     * @property {boolean} isInvertedDelayMatch
     * @property {number|null} delayMatch
     */

    /**
     * Parses delay arg with possible negation for no matching.
     * Needed for prevent-setTimeout and prevent-setInterval
     * @param {string} delay
     * @returns {DelayData}
     */

    var parseDelayArg = function parseDelayArg(delay) {
      var INVERT_MARKER = '!';
      var isInvertedDelayMatch = startsWith(delay, INVERT_MARKER);
      var delayValue = isInvertedDelayMatch ? delay.slice(1) : delay;
      delayValue = parseInt(delayValue, 10);
      var delayMatch = nativeIsNaN(delayValue) ? null : delayValue;
      return {
        isInvertedDelayMatch: isInvertedDelayMatch,
        delayMatch: delayMatch
      };
    };
    /**
     * Converts object to string for logging
     * @param {Object} obj data object
     * @returns {string}
     */

    var objectToString = function objectToString(obj) {
      return isEmptyObject(obj) ? '{}' : getObjectEntries(obj).map(function (pair) {
        var key = pair[0];
        var value = pair[1];
        var recordValueStr = value;

        if (value instanceof Object) {
          recordValueStr = "{ ".concat(objectToString(value), " }");
        }

        return "".concat(key, ":\"").concat(recordValueStr, "\"");
      }).join(' ');
    };
    /**
     * Converts types into a string
     * @param {*} value
     * @returns {string}
     */

    var convertTypeToString = function convertTypeToString(value) {
      var output;

      if (typeof value === 'undefined') {
        output = 'undefined';
      } else if (typeof value === 'object') {
        if (value === null) {
          output = 'null';
        } else {
          output = objectToString(value);
        }
      } else {
        output = value.toString();
      }

      return output;
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
     * @return {undefined} undefined
     */
    var noopFunc = function noopFunc() {};
    /**
     * Function returns null
     * @return {null} null
     */

    var noopNull = function noopNull() {
      return null;
    };
    /**
     * Function returns true
     * @return {boolean} true
     */

    var trueFunc = function trueFunc() {
      return true;
    };
    /**
     * Function returns false
     * @return {boolean} false
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
     * Function returns empty string
     * @return {string} empty string
     */

    var noopStr = function noopStr() {
      return '';
    };
    /**
     * Function returns empty array
     * @return {Array} empty array
     */

    var noopArray = function noopArray() {
      return [];
    };
    /**
     * Function returns empty object
     * @return {Object} empty object
     */

    var noopObject = function noopObject() {
      return {};
    };
    /**
     * Function returns Promise.reject()
     */

    var noopPromiseReject = function noopPromiseReject() {
      return Promise.reject();
    }; // eslint-disable-line compat/compat

    /**
     * Returns Promise object that is resolved with an empty response
     */
    // eslint-disable-next-line compat/compat

    var noopPromiseResolve = function noopPromiseResolve() {
      return Promise.resolve(new Response());
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
      // eslint-disable-next-line no-use-before-define, compat/compat

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
     * @param {string|undefined} stackMatch - input stack value to match
     * @param {string} stackTrace - script error stack trace
     * @returns {boolean}
     */

    var matchStackTrace = function matchStackTrace(stackMatch, stackTrace) {
      if (!stackMatch || stackMatch === '') {
        return true;
      }

      var stackRegexp = toRegExp(stackMatch);
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
     * Finds shadow-dom host (elements with shadowRoot property) in DOM of rootElement.
     * @param {HTMLElement} rootElement
     * @returns {HTMLElement[]} shadow-dom hosts
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
     * A collection of nodes.
     *
     * @external NodeList
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/NodeList NodeList}
     */

    /**
     * @typedef {Object} PierceData
     * @property {HTMLElement[]} targets found elements that match the specified selector
     * @property {HTMLElement[]} innerHosts inner shadow-dom hosts
     */

    /**
     * Pierces open shadow-dom in order to find:
     * - elements by 'selector' matching
     * - inner shadow-dom hosts
     * @param {string} selector
     * @param {HTMLElement[]|external:NodeList} hostElements
     * @returns {PierceData}
     */

    var pierceShadowDom = function pierceShadowDom(selector, hostElements) {
      var targets = [];
      var innerHostsAcc = []; // it's possible to get a few hostElements found by baseSelector on the page

      hostElements.forEach(function (host) {
        // check presence of selector element inside base element if it's not in shadow-dom
        var simpleElems = host.querySelectorAll(selector);
        targets = targets.concat([].slice.call(simpleElems));
        var shadowRootElem = host.shadowRoot;
        var shadowChildren = shadowRootElem.querySelectorAll(selector);
        targets = targets.concat([].slice.call(shadowChildren)); // find inner shadow-dom hosts inside processing shadow-dom

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
     * Prepares cookie string if given parameters are ok
     * @param {string} name cookie name to set
     * @param {string} value cookie value to set
     * @returns {string|null} cookie string if ok OR null if not
     */

    var prepareCookie = function prepareCookie(name, value) {
      if (!name || !value) {
        return null;
      }

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
          return null;
        }

        if (Math.abs(valueToSet) < 0 || Math.abs(valueToSet) > 15) {
          return null;
        }
      } else {
        return null;
      }

      var pathToSet = 'path=/;';
      var cookieData = "".concat(encodeURIComponent(name), "=").concat(encodeURIComponent(valueToSet), "; ").concat(pathToSet);
      return cookieData;
    };

    var shouldMatchAnyDelay = function shouldMatchAnyDelay(delay) {
      return delay === getWildcardSymbol();
    };
    /**
     * Handles input delay value
     * @param {*} delay
     * @returns {number} proper number delay value
     */

    var getMatchDelay = function getMatchDelay(delay) {
      var DEFAULT_DELAY = 1000;
      var parsedDelay = parseInt(delay, 10);
      var delayMatch = nativeIsNaN(parsedDelay) ? DEFAULT_DELAY // default scriptlet value
      : parsedDelay;
      return delayMatch;
    };
    /**
     * Checks delay match condition
     * @param {*} inputDelay
     * @param {number} realDelay
     * @returns {boolean}
     */

    var isDelayMatched = function isDelayMatched(inputDelay, realDelay) {
      return shouldMatchAnyDelay(inputDelay) || realDelay === getMatchDelay(inputDelay);
    };
    /**
     * Handles input boost value
     * @param {*} boost
     * @returns {number} proper number boost multiplier value
     */

    var getBoostMultiplier = function getBoostMultiplier(boost) {
      var DEFAULT_MULTIPLIER = 0.05;
      var MIN_MULTIPLIER = 0.02;
      var MAX_MULTIPLIER = 50;
      var parsedBoost = parseFloat(boost);
      var boostMultiplier = nativeIsNaN(parsedBoost) || !nativeIsFinite(parsedBoost) ? DEFAULT_MULTIPLIER // default scriptlet value
      : parsedBoost;

      if (boostMultiplier < MIN_MULTIPLIER) {
        boostMultiplier = MIN_MULTIPLIER;
      }

      if (boostMultiplier > MAX_MULTIPLIER) {
        boostMultiplier = MAX_MULTIPLIER;
      }

      return boostMultiplier;
    };

    /**
     * Collects Request options to object
     * @param {Request} request
     * @returns {Object} data object
     */

    var getRequestData = function getRequestData(request) {
      var REQUEST_INIT_OPTIONS = ['url', 'method', 'headers', 'body', 'mode', 'credentials', 'cache', 'redirect', 'referrer', 'integrity'];
      var entries = REQUEST_INIT_OPTIONS.map(function (key) {
        // if request has no such option, value will be undefined
        var value = request[key];
        return [key, value];
      });
      return getObjectFromEntries(entries);
    };
    /**
     * Collects fetch args to object
     * @param {*} args fetch args
     * @returns {Object} data object
     */

    var getFetchData = function getFetchData(args) {
      var fetchPropsObj = {};
      var fetchUrl;
      var fetchInit;

      if (args[0] instanceof Request) {
        // if Request passed to fetch, it will be in array
        var requestData = getRequestData(args[0]);
        fetchUrl = requestData.url;
        fetchInit = requestData;
      } else {
        fetchUrl = args[0]; // eslint-disable-line prefer-destructuring

        fetchInit = args[1]; // eslint-disable-line prefer-destructuring
      }

      fetchPropsObj.url = fetchUrl;

      if (fetchInit instanceof Object) {
        Object.keys(fetchInit).forEach(function (prop) {
          fetchPropsObj[prop] = fetchInit[prop];
        });
      }

      return fetchPropsObj;
    };
    /**
     * Converts prevent-fetch propsToMatch input string to object
     * @param {string} propsToMatchStr
     * @returns {Object} object where 'key' is prop name and 'value' is prop value
     */

    var convertMatchPropsToObj = function convertMatchPropsToObj(propsToMatchStr) {
      var PROPS_DIVIDER = ' ';
      var PAIRS_MARKER = ':';
      var propsObj = {};
      var props = propsToMatchStr.split(PROPS_DIVIDER);
      props.forEach(function (prop) {
        var dividerInd = prop.indexOf(PAIRS_MARKER);

        if (dividerInd === -1) {
          propsObj.url = toRegExp(prop);
        } else {
          var key = prop.slice(0, dividerInd);
          var value = prop.slice(dividerInd + 1);
          propsObj[key] = toRegExp(value);
        }
      });
      return propsObj;
    };

    var handleOldReplacement = function handleOldReplacement(replacement) {
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
            result = {};
            result[propertyName] = noopFunc;
          }
        }
      }

      return result;
    };
    var createDecoy = function createDecoy(args) {
      var OBJECT_TAG_NAME = 'object';
      var OBJECT_URL_PROP_NAME = 'data';
      var IFRAME_TAG_NAME = 'iframe';
      var IFRAME_URL_PROP_NAME = 'src';
      var replacement = args.replacement,
          url = args.url,
          delay = args.delay;
      var tag;
      var urlProp;

      if (replacement === 'obj') {
        tag = OBJECT_TAG_NAME;
        urlProp = OBJECT_URL_PROP_NAME;
      } else {
        tag = IFRAME_TAG_NAME;
        urlProp = IFRAME_URL_PROP_NAME;
      }

      var decoy = document.createElement(tag);
      decoy[urlProp] = url;
      decoy.style.setProperty('height', '1px', 'important');
      decoy.style.setProperty('position', 'fixed', 'important');
      decoy.style.setProperty('top', '-1px', 'important');
      decoy.style.setProperty('width', '1px', 'important');
      document.body.appendChild(decoy);
      setTimeout(function () {
        return decoy.remove();
      }, delay * 1000);
      return decoy;
    };
    var getPreventGetter = function getPreventGetter(nativeGetter) {
      var preventGetter = function preventGetter(target, prop) {
        if (prop && prop === 'closed') {
          return false;
        }

        if (typeof nativeGetter === 'function') {
          return noopFunc;
        }

        return prop && target[prop];
      };

      return preventGetter;
    };

    /**
     * Validates event type
     * @param {*} type
     * @returns {boolean}
     */
    var validateType = function validateType(type) {
      // https://github.com/AdguardTeam/Scriptlets/issues/125
      return typeof type !== 'undefined';
    };
    /**
     * Validates event listener
     * @param {*} listener
     * @returns {boolean}
     */

    var validateListener = function validateListener(listener) {
      // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#parameters
      return typeof listener !== 'undefined' && (typeof listener === 'function' || typeof listener === 'object' // https://github.com/AdguardTeam/Scriptlets/issues/76
      && listener !== null && typeof listener.handleEvent === 'function');
    };
    /**
     * Serialize valid event listener
     * https://developer.mozilla.org/en-US/docs/Web/API/EventListener
     * @param {EventListener} listener valid listener
     * @returns {string}
     */

    var listenerToString = function listenerToString(listener) {
      return typeof listener === 'function' ? listener.toString() : listener.handleEvent.toString();
    };

    /**
     * This file must export all used dependencies
     */

    var dependencies = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getWildcardSymbol: getWildcardSymbol,
        randomId: randomId,
        setPropertyAccess: setPropertyAccess,
        getPropertyInChain: getPropertyInChain,
        getWildcardPropertyInChain: getWildcardPropertyInChain,
        replaceAll: replaceAll,
        escapeRegExp: escapeRegExp,
        toRegExp: toRegExp,
        getBeforeRegExp: getBeforeRegExp,
        startsWith: startsWith,
        endsWith: endsWith,
        substringAfter: substringAfter,
        substringBefore: substringBefore,
        wrapInSingleQuotes: wrapInSingleQuotes,
        getStringInBraces: getStringInBraces,
        convertRtcConfigToString: convertRtcConfigToString,
        parseMatchArg: parseMatchArg,
        parseDelayArg: parseDelayArg,
        objectToString: objectToString,
        convertTypeToString: convertTypeToString,
        createOnErrorHandler: createOnErrorHandler,
        noopFunc: noopFunc,
        noopNull: noopNull,
        trueFunc: trueFunc,
        falseFunc: falseFunc,
        noopThis: noopThis,
        noopStr: noopStr,
        noopArray: noopArray,
        noopObject: noopObject,
        noopPromiseReject: noopPromiseReject,
        noopPromiseResolve: noopPromiseResolve,
        hit: hit,
        observeDOMChanges: observeDOMChanges,
        matchStackTrace: matchStackTrace,
        findHostElements: findHostElements,
        pierceShadowDom: pierceShadowDom,
        flatten: flatten,
        prepareCookie: prepareCookie,
        nativeIsNaN: nativeIsNaN,
        nativeIsFinite: nativeIsFinite,
        shouldMatchAnyDelay: shouldMatchAnyDelay,
        getMatchDelay: getMatchDelay,
        isDelayMatched: isDelayMatched,
        getBoostMultiplier: getBoostMultiplier,
        getRequestData: getRequestData,
        getFetchData: getFetchData,
        convertMatchPropsToObj: convertMatchPropsToObj,
        getObjectEntries: getObjectEntries,
        getObjectFromEntries: getObjectFromEntries,
        isEmptyObject: isEmptyObject,
        handleOldReplacement: handleOldReplacement,
        createDecoy: createDecoy,
        getPreventGetter: getPreventGetter,
        validateType: validateType,
        validateListener: validateListener,
        listenerToString: listenerToString
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
      if (!property || !matchStackTrace(stack, new Error().stack)) {
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
      if (!property || !matchStackTrace(stack, new Error().stack)) {
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
     * > If `prevent-setTimeout` without parameters logs smth like `setTimeout(undefined, 1000)`,
     * it means that no callback was passed to setTimeout() and that's not scriptlet issue
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
      // if browser does not support Proxy (e.g. Internet Explorer),
      // we use none-proxy "legacy" wrapper for preventing
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
      var isProxySupported = typeof Proxy !== 'undefined';
      var nativeTimeout = window.setTimeout;
      var log = console.log.bind(console); // eslint-disable-line no-console
      // logs setTimeouts to console if no arguments have been specified

      var shouldLog = typeof match === 'undefined' && typeof delay === 'undefined';

      var _parseMatchArg = parseMatchArg(match),
          isInvertedMatch = _parseMatchArg.isInvertedMatch,
          matchRegexp = _parseMatchArg.matchRegexp;

      var _parseDelayArg = parseDelayArg(delay),
          isInvertedDelayMatch = _parseDelayArg.isInvertedDelayMatch,
          delayMatch = _parseDelayArg.delayMatch;

      var getShouldPrevent = function getShouldPrevent(callbackStr, timeout) {
        var shouldPrevent = false;

        if (!delayMatch) {
          shouldPrevent = matchRegexp.test(callbackStr) !== isInvertedMatch;
        } else if (!match) {
          shouldPrevent = timeout === delayMatch !== isInvertedDelayMatch;
        } else {
          shouldPrevent = matchRegexp.test(callbackStr) !== isInvertedMatch && timeout === delayMatch !== isInvertedDelayMatch;
        }

        return shouldPrevent;
      };

      var legacyTimeoutWrapper = function legacyTimeoutWrapper(callback, timeout) {
        var shouldPrevent = false; // https://github.com/AdguardTeam/Scriptlets/issues/105

        var cbString = String(callback);

        if (shouldLog) {
          hit(source);
          log("setTimeout(".concat(cbString, ", ").concat(timeout, ")"));
        } else {
          shouldPrevent = getShouldPrevent(cbString, timeout);
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

      var handlerWrapper = function handlerWrapper(target, thisArg, args) {
        var callback = args[0];
        var timeout = args[1];
        var shouldPrevent = false; // https://github.com/AdguardTeam/Scriptlets/issues/105

        var cbString = String(callback);

        if (shouldLog) {
          hit(source);
          log("setTimeout(".concat(cbString, ", ").concat(timeout, ")"));
        } else {
          shouldPrevent = getShouldPrevent(cbString, timeout);
        }

        if (shouldPrevent) {
          hit(source);
          args[0] = noopFunc;
        }

        return target.apply(thisArg, args);
      };

      var setTimeoutHandler = {
        apply: handlerWrapper
      };
      window.setTimeout = isProxySupported ? new Proxy(window.setTimeout, setTimeoutHandler) : legacyTimeoutWrapper;
    }
    preventSetTimeout.names = ['prevent-setTimeout', // aliases are needed for matching the related scriptlet converted into our syntax
    'no-setTimeout-if.js', // new implementation of setTimeout-defuser.js
    'ubo-no-setTimeout-if.js', 'nostif.js', // new short name of no-setTimeout-if
    'ubo-nostif.js', 'ubo-no-setTimeout-if', 'ubo-nostif', // old scriptlet names which should be supported as well.
    // should be removed eventually.
    // do not remove until other filter lists maintainers use them
    'setTimeout-defuser.js', 'ubo-setTimeout-defuser.js', 'ubo-setTimeout-defuser', 'std.js', 'ubo-std.js', 'ubo-std'];
    preventSetTimeout.injections = [hit, noopFunc, parseMatchArg, parseDelayArg, toRegExp, startsWith, nativeIsNaN];

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
     * > If `prevent-setInterval` without parameters logs smth like `setInterval(undefined, 1000)`,
     * it means that no callback was passed to setInterval() and that's not scriptlet issue

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
      // if browser does not support Proxy (e.g. Internet Explorer),
      // we use none-proxy "legacy" wrapper for preventing
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
      var isProxySupported = typeof Proxy !== 'undefined';
      var nativeInterval = window.setInterval;
      var log = console.log.bind(console); // eslint-disable-line no-console
      // logs setIntervals to console if no arguments have been specified

      var shouldLog = typeof match === 'undefined' && typeof delay === 'undefined';

      var _parseMatchArg = parseMatchArg(match),
          isInvertedMatch = _parseMatchArg.isInvertedMatch,
          matchRegexp = _parseMatchArg.matchRegexp;

      var _parseDelayArg = parseDelayArg(delay),
          isInvertedDelayMatch = _parseDelayArg.isInvertedDelayMatch,
          delayMatch = _parseDelayArg.delayMatch;

      var getShouldPrevent = function getShouldPrevent(callbackStr, interval) {
        var shouldPrevent = false;

        if (!delayMatch) {
          shouldPrevent = matchRegexp.test(callbackStr) !== isInvertedMatch;
        } else if (!match) {
          shouldPrevent = interval === delayMatch !== isInvertedDelayMatch;
        } else {
          shouldPrevent = matchRegexp.test(callbackStr) !== isInvertedMatch && interval === delayMatch !== isInvertedDelayMatch;
        }

        return shouldPrevent;
      };

      var legachyIntervalWrapper = function legachyIntervalWrapper(callback, interval) {
        var shouldPrevent = false; // https://github.com/AdguardTeam/Scriptlets/issues/105

        var cbString = String(callback);

        if (shouldLog) {
          hit(source);
          log("setInterval(".concat(cbString, ", ").concat(interval, ")"));
        } else {
          shouldPrevent = getShouldPrevent(cbString, interval);
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

      var handlerWrapper = function handlerWrapper(target, thisArg, args) {
        var callback = args[0];
        var interval = args[1];
        var shouldPrevent = false; // https://github.com/AdguardTeam/Scriptlets/issues/105

        var cbString = String(callback);

        if (shouldLog) {
          hit(source);
          log("setTimeout(".concat(cbString, ", ").concat(interval, ")"));
        } else {
          shouldPrevent = getShouldPrevent(cbString, interval);
        }

        if (shouldPrevent) {
          hit(source);
          args[0] = noopFunc;
        }

        return target.apply(thisArg, args);
      };

      var setIntervalHandler = {
        apply: handlerWrapper
      };
      window.setInterval = isProxySupported ? new Proxy(window.setInterval, setIntervalHandler) : legachyIntervalWrapper;
    }
    preventSetInterval.names = ['prevent-setInterval', // aliases are needed for matching the related scriptlet converted into our syntax
    'no-setInterval-if.js', // new implementation of setInterval-defuser.js
    'ubo-no-setInterval-if.js', 'setInterval-defuser.js', // old name should be supported as well
    'ubo-setInterval-defuser.js', 'nosiif.js', // new short name of no-setInterval-if
    'ubo-nosiif.js', 'sid.js', // old short scriptlet name
    'ubo-sid.js', 'ubo-no-setInterval-if', 'ubo-setInterval-defuser', 'ubo-nosiif', 'ubo-sid'];
    preventSetInterval.injections = [hit, noopFunc, parseMatchArg, parseDelayArg, toRegExp, startsWith, nativeIsNaN];

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
     * example.org#%#//scriptlet('prevent-window-open'[, match[, delay[, replacement]]])
     * ```
     *
     * - `match` - optional, string or regular expression. If not set, all window.open calls will be matched.
     * If starts with `!`, scriptlet will not match the stringified callback but all other will be defused.
     * If do not start with `!`, the stringified callback will be matched.
     * - `delay` - optional, number of seconds. If not set, scriptlet will return `null`,
     * otherwise valid sham window object as injected `iframe` will be returned
     * for accessing it's methods (blur(), focus() etc.) and will be removed after the delay.
     * - `replacement` - optional, string; one of the predefined constants:
     *     - `obj` - for returning an object instead of default iframe;
     *        for cases when the page requires a valid `window` instance to be returned
     *     - `log` - for logging window.open calls; permitted for production filter lists.
     *
     * **Examples**
     * 1. Prevent all `window.open` calls:
     * ```
     *     example.org#%#//scriptlet('prevent-window-open')
     * ```
     *
     * 2. Prevent `window.open` for all URLs containing `example`:
     * ```
     *     example.org#%#//scriptlet('prevent-window-open', 'example')
     * ```
     *
     * 3. Prevent `window.open` for all URLs matching RegExp `/example\./`:
     * ```
     *     example.org#%#//scriptlet('prevent-window-open', '/example\./')
     * ```
     *
     * 4. Prevent `window.open` for all URLs **NOT** containing `example`:
     * ```
     *     example.org#%#//scriptlet('prevent-window-open', '!example')
     * ```
     *
     * Old syntax of prevent-window-open parameters:
     * - `match` - optional, defaults to "matching", any positive number or nothing for "matching", 0 or empty string for "not matching"
     * - `search` - optional, string or regexp for matching the URL passed to `window.open` call; defaults to search all `window.open` call
     * - `replacement` - optional, string to return prop value or property instead of window.open; defaults to return noopFunc.
     * **Examples**
     * ```
     *     example.org#%#//scriptlet('prevent-window-open', '1', '/example\./'
     *     example.org#%#//scriptlet('prevent-window-open', '0', 'example')
     *     example.org#%#//scriptlet('prevent-window-open', '', '', 'trueFunc')
     *     example.org#%#//scriptlet('prevent-window-open', '1', '', '{propName=noopFunc}')
     * ```
     *
     * > For better compatibility with uBO, old syntax is not recommended to use.
     */

    /* eslint-enable max-len */

    function preventWindowOpen(source) {
      var match = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : getWildcardSymbol();
      var delay = arguments.length > 2 ? arguments[2] : undefined;
      var replacement = arguments.length > 3 ? arguments[3] : undefined;
      // default match value is needed for preventing all window.open calls
      // if scriptlet runs without args
      var nativeOpen = window.open;
      var isNewSyntax = match !== '0' && match !== '1';

      var oldOpenWrapper = function oldOpenWrapper(str) {
        match = Number(match) > 0; // 'delay' was 'search' prop for matching in old syntax

        var searchRegexp = toRegExp(delay);

        if (match !== searchRegexp.test(str)) {
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          return nativeOpen.apply(window, [str].concat(args));
        }

        hit(source);
        return handleOldReplacement(replacement);
      };

      var newOpenWrapper = function newOpenWrapper(url) {
        var shouldLog = replacement && replacement.indexOf('log') > -1;

        for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        if (shouldLog) {
          var argsStr = args && args.length > 0 ? ", ".concat(args.join(', ')) : '';
          var logMessage = "log: window-open: ".concat(url).concat(argsStr);
          hit(source, logMessage);
        }

        var shouldPrevent = false;

        if (match === getWildcardSymbol()) {
          shouldPrevent = true;
        } else {
          var _parseMatchArg = parseMatchArg(match),
              isInvertedMatch = _parseMatchArg.isInvertedMatch,
              matchRegexp = _parseMatchArg.matchRegexp;

          shouldPrevent = matchRegexp.test(url) !== isInvertedMatch;
        }

        if (shouldPrevent) {
          var parsedDelay = parseInt(delay, 10);
          var result;

          if (nativeIsNaN(parsedDelay)) {
            result = noopNull();
          } else {
            var decoyArgs = {
              replacement: replacement,
              url: url,
              delay: parsedDelay
            };
            var decoy = createDecoy(decoyArgs);
            var popup = decoy.contentWindow;

            if (typeof popup === 'object' && popup !== null) {
              Object.defineProperty(popup, 'closed', {
                value: false
              });
            } else {
              var nativeGetter = decoy.contentWindow && decoy.contentWindow.get;
              Object.defineProperty(decoy, 'contentWindow', {
                get: getPreventGetter(nativeGetter)
              });
              popup = decoy.contentWindow;
            }

            result = popup;
          }

          hit(source);
          return result;
        }

        return nativeOpen.apply(window, [url].concat(args));
      };

      window.open = isNewSyntax ? newOpenWrapper : oldOpenWrapper;
    }
    preventWindowOpen.names = ['prevent-window-open', // aliases are needed for matching the related scriptlet converted into our syntax
    'window.open-defuser.js', 'ubo-window.open-defuser.js', 'ubo-window.open-defuser', 'nowoif.js', 'ubo-nowoif.js', 'ubo-nowoif'];
    preventWindowOpen.injections = [hit, toRegExp, nativeIsNaN, parseMatchArg, handleOldReplacement, createDecoy, getPreventGetter, noopNull, getWildcardSymbol, noopFunc, trueFunc, startsWith, endsWith, substringBefore, substringAfter];

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
      var searchRegexp = toRegExp(search);
      var rid = randomId();

      var getCurrentScript = function getCurrentScript() {
        if ('currentScript' in document) {
          return document.currentScript; // eslint-disable-line compat/compat
        }

        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
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
     * Related ABP snippet:
     * https://github.com/adblockplus/adblockpluscore/blob/adblockpluschrome-3.9.4/lib/content/snippets.js#L1361
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
     *         - `emptyObj` - empty object
     *         - `emptyArr` - empty array
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
      if (!property || !matchStackTrace(stack, new Error().stack)) {
        return;
      }

      var emptyArr = noopArray();
      var emptyObj = noopObject();
      var constantValue;

      if (value === 'undefined') {
        constantValue = undefined;
      } else if (value === 'false') {
        constantValue = false;
      } else if (value === 'true') {
        constantValue = true;
      } else if (value === 'null') {
        constantValue = null;
      } else if (value === 'emptyArr') {
        constantValue = emptyArr;
      } else if (value === 'emptyObj') {
        constantValue = emptyObj;
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
    'set-constant.js', 'ubo-set-constant.js', 'set.js', 'ubo-set.js', 'ubo-set-constant', 'ubo-set', 'abp-override-property-read'];
    setConstant.injections = [hit, noopArray, noopObject, noopFunc, trueFunc, falseFunc, getPropertyInChain, setPropertyAccess, toRegExp, matchStackTrace, nativeIsNaN];

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
      var matchRegexp = toRegExp(match);

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

          if (!matchRegexp.test(cookieName)) {
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
      var eventSearchRegexp = toRegExp(eventSearch);
      var funcSearchRegexp = toRegExp(funcSearch);
      var nativeAddEventListener = window.EventTarget.prototype.addEventListener;

      function addEventListenerWrapper(type, listener) {
        var shouldPrevent = false;

        if (validateType(type) && validateListener(listener)) {
          shouldPrevent = eventSearchRegexp.test(type.toString()) && funcSearchRegexp.test(listenerToString(listener));
        }

        if (shouldPrevent) {
          hit(source);
          return undefined;
        }

        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        return nativeAddEventListener.apply(this, [type, listener].concat(args));
      }

      window.EventTarget.prototype.addEventListener = addEventListenerWrapper;
    }
    preventAddEventListener.names = ['prevent-addEventListener', // aliases are needed for matching the related scriptlet converted into our syntax
    'addEventListener-defuser.js', 'ubo-addEventListener-defuser.js', 'aeld.js', 'ubo-aeld.js', 'ubo-addEventListener-defuser', 'ubo-aeld'];
    preventAddEventListener.injections = [hit, toRegExp, validateType, validateListener, listenerToString];

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
     * It also can be used as `$redirect` sometimes.
     * See [redirect description](../wiki/about-redirects.md#prevent-bab).
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('prevent-bab')
     * ```
     */

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
        hit(source, "Document tried to create an RTCPeerConnection: ".concat(convertRtcConfigToString(config)));
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
    nowebrtc.injections = [hit, noopFunc, convertRtcConfigToString];

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
      // eslint-disable-next-line no-console
      var log = console.log.bind(console);
      var nativeAddEventListener = window.EventTarget.prototype.addEventListener;

      function addEventListenerWrapper(type, listener) {
        if (validateType(type) && validateListener(listener)) {
          var logMessage = "log: addEventListener(\"".concat(type, "\", ").concat(listenerToString(listener), ")");
          hit(source, logMessage);
        } else if (source.verbose) {
          // logging while debugging
          var _logMessage = "Invalid event type or listener passed to addEventListener:\ntype: ".concat(convertTypeToString(type), "\nlistener: ").concat(convertTypeToString(listener));

          log(_logMessage);
        }

        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        return nativeAddEventListener.apply(this, [type, listener].concat(args));
      }

      window.EventTarget.prototype.addEventListener = addEventListenerWrapper;
    }
    logAddEventListener.names = ['log-addEventListener', // aliases are needed for matching the related scriptlet converted into our syntax
    'addEventListener-logger.js', 'ubo-addEventListener-logger.js', 'aell.js', 'ubo-aell.js', 'ubo-addEventListener-logger', 'ubo-aell'];
    logAddEventListener.injections = [hit, validateType, validateListener, listenerToString, convertTypeToString, objectToString, isEmptyObject, getObjectEntries];

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
      var searchRegexp = toRegExp(search);
      var nativeEval = window.eval;

      window.eval = function (payload) {
        if (!searchRegexp.test(payload.toString())) {
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
      if (!property || !matchStackTrace(stack, new Error().stack)) {
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
      if (!property || !matchStackTrace(stack, new Error().stack)) {
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
      var searchRegexp = toRegExp(search);
      var rid = randomId();

      var getCurrentScript = function getCurrentScript() {
        if ('currentScript' in document) {
          return document.currentScript; // eslint-disable-line compat/compat
        }

        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
      };

      var ourScript = getCurrentScript();

      var abort = function abort() {
        var scriptEl = getCurrentScript();

        if (scriptEl instanceof HTMLScriptElement && scriptEl.textContent.length > 0 && scriptEl !== ourScript && (!search || searchRegexp.test(scriptEl.textContent))) {
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
     * - `interval` - optional, defaults to 1000, matching setInterval delay; decimal integer OR '*' for any delay
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
     * 5. Adjust all setInterval() x50 times where interval equal 2000ms
     *     ```
     *     example.org#%#//scriptlet('adjust-setInterval', '', '2000', '0.02')
     *     ```
     * 6. Adjust all setInterval() x50 times where interval is randomized
     *     ```
     *     example.org#%#//scriptlet('adjust-setInterval', '', '*', '0.02')
     *     ```
     */

    /* eslint-enable max-len */

    function adjustSetInterval(source, match, interval, boost) {
      var nativeSetInterval = window.setInterval;
      var matchRegexp = toRegExp(match);

      var intervalWrapper = function intervalWrapper(cb, d) {
        if (matchRegexp.test(cb.toString()) && isDelayMatched(interval, d)) {
          d *= getBoostMultiplier(boost);
          hit(source);
        }

        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        return nativeSetInterval.apply(window, [cb, d].concat(args));
      };

      window.setInterval = intervalWrapper;
    }
    adjustSetInterval.names = ['adjust-setInterval', // aliases are needed for matching the related scriptlet converted into our syntax
    'nano-setInterval-booster.js', 'ubo-nano-setInterval-booster.js', 'nano-sib.js', 'ubo-nano-sib.js', 'ubo-nano-setInterval-booster', 'ubo-nano-sib'];
    adjustSetInterval.injections = [hit, toRegExp, getBoostMultiplier, isDelayMatched, nativeIsNaN, nativeIsFinite, getMatchDelay, getWildcardSymbol, shouldMatchAnyDelay];

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
     * - `timeout` - optional, defaults to 1000, matching setTimout delay; decimal integer OR '*' for any delay
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
     * 5. Adjust all setTimeout() x50 times where timeout equal 2000ms
     *     ```
     *     example.org#%#//scriptlet('adjust-setTimeout', '', '2000', '0.02')
     *     ```
     * 6. Adjust all setTimeout() x20 times where callback mathed with `test` and timeout is randomized
     *     ```
     *     example.org#%#//scriptlet('adjust-setTimeout', 'test', '*')
     *     ```
     */

    /* eslint-enable max-len */

    function adjustSetTimeout(source, match, timeout, boost) {
      var nativeSetTimeout = window.setTimeout;
      var matchRegexp = toRegExp(match);

      var timeoutWrapper = function timeoutWrapper(cb, d) {
        if (matchRegexp.test(cb.toString()) && isDelayMatched(timeout, d)) {
          d *= getBoostMultiplier(boost);
          hit(source);
        }

        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        return nativeSetTimeout.apply(window, [cb, d].concat(args));
      };

      window.setTimeout = timeoutWrapper;
    }
    adjustSetTimeout.names = ['adjust-setTimeout', // aliases are needed for matching the related scriptlet converted into our syntax
    'nano-setTimeout-booster.js', 'ubo-nano-setTimeout-booster.js', 'nano-stb.js', 'ubo-nano-stb.js', 'ubo-nano-setTimeout-booster', 'ubo-nano-stb'];
    adjustSetTimeout.injections = [hit, toRegExp, getBoostMultiplier, isDelayMatched, nativeIsNaN, nativeIsFinite, getMatchDelay, getWildcardSymbol, shouldMatchAnyDelay];

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
      if (!!stack && !matchStackTrace(stack, new Error().stack)) {
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
          var hasWildcard = requiredPath.indexOf('.*.') > -1 || requiredPath.indexOf('*.') > -1 || requiredPath.indexOf('.*') > -1 || requiredPath.indexOf('.[].') > -1 || requiredPath.indexOf('[].') > -1 || requiredPath.indexOf('.[]') > -1; // if the path has wildcard, getPropertyInChain should 'look through' chain props

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
      /**
       * Prunes properties of 'root' object
       * @param {Object} root
       */


      var jsonPruner = function jsonPruner(root) {
        if (prunePaths.length === 0) {
          log(window.location.hostname, root);
          return root;
        }

        try {
          if (isPruningNeeded(root) === false) {
            return root;
          } // if pruning is needed, we check every input pathToRemove
          // and delete it if root has it


          prunePaths.forEach(function (path) {
            var ownerObjArr = getWildcardPropertyInChain(root, path, true);
            ownerObjArr.forEach(function (ownerObj) {
              if (ownerObj !== undefined && ownerObj.base) {
                delete ownerObj.base[ownerObj.prop];
                hit(source);
              }
            });
          });
        } catch (e) {
          log(e.toString());
        }

        return root;
      };

      var nativeJSONParse = JSON.parse;

      var jsonParseWrapper = function jsonParseWrapper() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        // dealing with stringified json in args, which should be parsed.
        // so we call nativeJSONParse as JSON.parse which is bound to JSON object
        var root = nativeJSONParse.apply(JSON, args);
        return jsonPruner(root);
      }; // JSON.parse mocking


      jsonParseWrapper.toString = nativeJSONParse.toString.bind(nativeJSONParse);
      JSON.parse = jsonParseWrapper; // eslint-disable-next-line compat/compat

      var nativeResponseJson = Response.prototype.json; // eslint-disable-next-line func-names

      var responseJsonWrapper = function responseJsonWrapper() {
        var promise = nativeResponseJson.apply(this);
        return promise.then(function (obj) {
          return jsonPruner(obj);
        });
      }; // do nothing if browser does not support Response (e.g. Internet Explorer)
      // https://developer.mozilla.org/en-US/docs/Web/API/Response


      if (typeof Response === 'undefined') {
        return;
      } // eslint-disable-next-line compat/compat


      Response.prototype.json = responseJsonWrapper;
    }
    jsonPrune.names = ['json-prune', // aliases are needed for matching the related scriptlet converted into our syntax
    'json-prune.js', 'ubo-json-prune.js', 'ubo-json-prune', 'abp-json-prune'];
    jsonPrune.injections = [hit, matchStackTrace, getWildcardPropertyInChain, toRegExp, getWildcardSymbol];

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

      var _parseMatchArg = parseMatchArg(match),
          isInvertedMatch = _parseMatchArg.isInvertedMatch,
          matchRegexp = _parseMatchArg.matchRegexp;

      var rafWrapper = function rafWrapper(callback) {
        var shouldPrevent = false;

        if (shouldLog) {
          var logMessage = "log: requestAnimationFrame(\"".concat(callback.toString(), "\")");
          hit(source, logMessage);
        } else {
          shouldPrevent = matchRegexp.test(callback.toString()) !== isInvertedMatch;
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
    preventRequestAnimationFrame.injections = [hit, noopFunc, parseMatchArg, toRegExp, startsWith];

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
     * example.org#%#//scriptlet('set-cookie', 'ReadlyCookieConsent', '1'
     *
     * example.org#%#//scriptlet('set-cookie', 'gdpr-settings-cookie', 'true')
     * ```
     */

    /* eslint-enable max-len */

    function setCookie(source, name, value) {
      var cookieData = prepareCookie(name, value);

      if (cookieData) {
        hit(source);
        document.cookie = cookieData;
      }
    }
    setCookie.names = ['set-cookie'];
    setCookie.injections = [hit, nativeIsNaN, prepareCookie];

    /**
     * @scriptlet set-cookie-reload
     *
     * @description
     * Sets a cookie with the specified name and value, and then reloads the current page.
     * If reloading option is not needed, use [set-cookie](#set-cookie) scriptlet.
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('set-cookie-reload', name, value)
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
     * example.org#%#//scriptlet('set-cookie-reload', 'checking', 'ok')
     *
     * example.org#%#//scriptlet('set-cookie-reload', 'gdpr-settings-cookie', '1')
     * ```
     */

    function setCookieReload(source, name, value) {
      var isCookieAlreadySet = document.cookie.split(';').some(function (cookieStr) {
        var pos = cookieStr.indexOf('=');

        if (pos === -1) {
          return false;
        }

        var cookieName = cookieStr.slice(0, pos).trim();
        var cookieValue = cookieStr.slice(pos + 1).trim();
        return name === cookieName && value === cookieValue;
      });
      var shouldReload = !isCookieAlreadySet;
      var cookieData = prepareCookie(name, value);

      if (cookieData) {
        hit(source);
        document.cookie = cookieData;

        if (shouldReload) {
          window.location.reload();
        }
      }
    }
    setCookieReload.names = ['set-cookie-reload'];
    setCookieReload.injections = [hit, nativeIsNaN, prepareCookie];

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

      var hideElement = function hideElement(targetElement) {
        var DISPLAY_NONE_CSS = 'display:none!important;';
        targetElement.style.cssText = DISPLAY_NONE_CSS;
      };
      /**
       * Handles shadow-dom piercing and hiding of found elements
       */


      var hideHandler = function hideHandler() {
        // start value of shadow-dom hosts for the page dom
        var hostElements = !baseSelector ? findHostElements(document.documentElement) : document.querySelectorAll(baseSelector); // if there is shadow-dom host, they should be explored

        while (hostElements.length !== 0) {
          var isHidden = false;

          var _pierceShadowDom = pierceShadowDom(selector, hostElements),
              targets = _pierceShadowDom.targets,
              innerHosts = _pierceShadowDom.innerHosts;

          targets.forEach(function (targetEl) {
            hideElement(targetEl);
            isHidden = true;
          });

          if (isHidden) {
            hit(source);
          } // continue to pierce for inner shadow-dom hosts
          // and search inside them while the next iteration


          hostElements = innerHosts;
        }
      };

      hideHandler();
      observeDOMChanges(hideHandler, true);
    }
    hideInShadowDom.names = ['hide-in-shadow-dom'];
    hideInShadowDom.injections = [hit, observeDOMChanges, flatten, findHostElements, pierceShadowDom];

    /**
     * @scriptlet remove-in-shadow-dom
     *
     * @description
     * Removes elements inside open shadow DOM elements.
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('remove-in-shadow-dom', selector[, baseSelector])
     * ```
     *
     * - `selector` — required, CSS selector of element in shadow-dom to remove
     * - `baseSelector` — optional, selector of specific page DOM element,
     * narrows down the part of the page DOM where shadow-dom host supposed to be,
     * defaults to document.documentElement
     *
     * > `baseSelector` should match element of the page DOM, but not of shadow DOM
     *
     * **Examples**
     * ```
     * ! removes menu bar
     * virustotal.com#%#//scriptlet('remove-in-shadow-dom', 'iron-pages', 'vt-virustotal-app')
     *
     * ! removes floating element
     * virustotal.com#%#//scriptlet('remove-in-shadow-dom', 'vt-ui-contact-fab')
     * ```
     */

    function removeInShadowDom(source, selector, baseSelector) {
      // do nothing if browser does not support ShadowRoot
      // https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot
      if (!Element.prototype.attachShadow) {
        return;
      }

      var removeElement = function removeElement(targetElement) {
        targetElement.remove();
      };
      /**
       * Handles shadow-dom piercing and removing of found elements
       */


      var removeHandler = function removeHandler() {
        // start value of shadow-dom hosts for the page dom
        var hostElements = !baseSelector ? findHostElements(document.documentElement) : document.querySelectorAll(baseSelector); // if there is shadow-dom host, they should be explored

        while (hostElements.length !== 0) {
          var isRemoved = false;

          var _pierceShadowDom = pierceShadowDom(selector, hostElements),
              targets = _pierceShadowDom.targets,
              innerHosts = _pierceShadowDom.innerHosts;

          targets.forEach(function (targetEl) {
            removeElement(targetEl);
            isRemoved = true;
          });

          if (isRemoved) {
            hit(source);
          } // continue to pierce for inner shadow-dom hosts
          // and search inside them while the next iteration


          hostElements = innerHosts;
        }
      };

      removeHandler();
      observeDOMChanges(removeHandler, true);
    }
    removeInShadowDom.names = ['remove-in-shadow-dom'];
    removeInShadowDom.injections = [hit, observeDOMChanges, flatten, findHostElements, pierceShadowDom];

    /**
     * @scriptlet no-floc
     *
     * @description
     * Prevents using Google Chrome tracking feature called Federated Learning of Cohorts (aka "FLoC")
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#no-flocjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('no-floc')
     * ```
     */

    function noFloc(source) {
      var FLOC_PROPERTY_NAME = 'interestCohort';

      if (Document instanceof Object === false) {
        return;
      }

      if (!Object.prototype.hasOwnProperty.call(Document.prototype, FLOC_PROPERTY_NAME) || Document.prototype[FLOC_PROPERTY_NAME] instanceof Function === false) {
        return;
      } // document.interestCohort() is async function so it's better to return Promise.reject()
      // https://github.com/WICG/floc/blob/dcd4c042fa6a81b048e04a78b184ea4203a75219/README.md


      Document.prototype[FLOC_PROPERTY_NAME] = noopPromiseReject;
      hit(source);
    }
    noFloc.names = ['no-floc', // aliases are needed for matching the related scriptlet converted into our syntax
    'no-floc.js', 'ubo-no-floc.js', 'ubo-no-floc'];
    noFloc.injections = [hit, noopPromiseReject];

    /* eslint-disable max-len */

    /**
     * @scriptlet prevent-fetch
     *
     * @description
     * Prevents `fetch` calls if **all** given parameters match
     *
     * Related UBO scriptlet:
     * https://github.com/gorhill/uBlock/wiki/Resources-Library#no-fetch-ifjs-
     *
     * **Syntax**
     * ```
     * example.org#%#//scriptlet('prevent-fetch'[, propsToMatch])
     * ```
     *
     * - `propsToMatch` - optional, string of space-separated properties to match; possible props:
     *   - string or regular expression for matching the URL passed to fetch call; empty string or wildcard `*` for all fetch calls match
     *   - colon-separated pairs `name:value` where
     *     - `name` is [`init` option name](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#parameters)
     *     - `value` is string or regular expression for matching the value of the option passed to fetch call
     *
     * > Usage with no arguments will log fetch calls to browser console;
     * which is usefull for debugging but permitted for production filter lists.
     *
     * **Examples**
     * 1. Prevent all fetch calls
     *     ```
     *     example.org#%#//scriptlet('prevent-fetch', '*')
     *     ```
     *
     * 2. Prevent fetch call for specific url
     *     ```
     *     example.org#%#//scriptlet('prevent-fetch', '/url\\.part/')
     *     ```
     *
     * 3. Prevent fetch call for specific request method
     *     ```
     *     example.org#%#//scriptlet('prevent-fetch', 'method:HEAD')
     *     ```
     *
     * 4. Prevent fetch call for specific url and request method
     *     ```
     *     example.org#%#//scriptlet('prevent-fetch', '/specified_url_part/ method:/HEAD|GET/')
     *     ```
     */

    /* eslint-enable max-len */

    function preventFetch(source, propsToMatch) {
      // do nothing if browser does not support fetch or Proxy (e.g. Internet Explorer)
      // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
      if (typeof fetch === 'undefined' || typeof Proxy === 'undefined') {
        return;
      }

      var handlerWrapper = function handlerWrapper(target, thisArg, args) {
        var shouldPrevent = false;
        var fetchData = getFetchData(args);

        if (typeof propsToMatch === 'undefined') {
          // log if no propsToMatch given
          var logMessage = "log: fetch( ".concat(objectToString(fetchData), " )");
          hit(source, logMessage);
        } else if (propsToMatch === '' || propsToMatch === getWildcardSymbol()) {
          // prevent all fetch calls
          shouldPrevent = true;
        } else {
          var matchData = convertMatchPropsToObj(propsToMatch); // prevent only if all props match

          shouldPrevent = Object.keys(matchData).every(function (matchKey) {
            var matchValue = matchData[matchKey];
            return Object.prototype.hasOwnProperty.call(fetchData, matchKey) && matchValue.test(fetchData[matchKey]);
          });
        }

        if (shouldPrevent) {
          hit(source);
          return noopPromiseResolve();
        }

        return Reflect.apply(target, thisArg, args);
      };

      var fetchHandler = {
        apply: handlerWrapper
      };
      fetch = new Proxy(fetch, fetchHandler); // eslint-disable-line no-global-assign
    }
    preventFetch.names = ['prevent-fetch', // aliases are needed for matching the related scriptlet converted into our syntax
    'no-fetch-if.js', 'ubo-no-fetch-if.js', 'ubo-no-fetch-if'];
    preventFetch.injections = [hit, getFetchData, objectToString, convertMatchPropsToObj, noopPromiseResolve, getWildcardSymbol, toRegExp, isEmptyObject, getRequestData, getObjectEntries, getObjectFromEntries];

    /* eslint-disable max-len */

    /**
     * @scriptlet set-local-storage-item
     *
     * @description
     * Adds specified key and its value to localStorage object, or updates the value of the key if it already exists.
     *
     * **Syntax**
     * ```
     * example.com#%#//scriptlet('set-local-storage-item', 'key', 'value')
     * ```
     *
     * - `key` — required, key name to be set.
     * - `value` - required, key value; possible values:
     *     - positive decimal integer `<= 32767`
     *     - one of the predefined constants:
     *         - `undefined`
     *         - `false`
     *         - `true`
     *         - `null`
     *         - `emptyObj` - empty object
     *         - `emptyArr` - empty array
     *         - `''` - empty string
     *
     * **Examples**
     * ```
     * example.org#%#//scriptlet('set-local-storage-item', 'player.live.current.mute', 'false')
     *
     * example.org#%#//scriptlet('set-local-storage-item', 'exit-intent-marketing', '1')
     * ```
     */

    /* eslint-enable max-len */

    function setLocalStorageItem(source, key, value) {
      if (!key || !value && value !== '') {
        return;
      }

      var keyValue;

      if (value === 'undefined') {
        keyValue = undefined;
      } else if (value === 'false') {
        keyValue = false;
      } else if (value === 'true') {
        keyValue = true;
      } else if (value === 'null') {
        keyValue = null;
      } else if (value === 'emptyArr') {
        keyValue = '[]';
      } else if (value === 'emptyObj') {
        keyValue = '{}';
      } else if (value === '') {
        keyValue = '';
      } else if (/^\d+$/.test(value)) {
        keyValue = parseFloat(value);

        if (nativeIsNaN(keyValue)) {
          return;
        }

        if (Math.abs(keyValue) > 0x7FFF) {
          return;
        }
      } else {
        return;
      }

      var setItem = function setItem(key, value) {
        var _window = window,
            localStorage = _window.localStorage; // setItem() may throw an exception if the storage is full.

        try {
          localStorage.setItem(key, value);
          hit(source);
        } catch (e) {
          if (source.verbose) {
            // eslint-disable-next-line no-console
            console.log("Was unable to set localStorage item due to: ".concat(e.message));
          }
        }
      };

      setItem(key, keyValue);
    }
    setLocalStorageItem.names = ['set-local-storage-item'];
    setLocalStorageItem.injections = [hit, nativeIsNaN];

    /* eslint-disable max-len */

    /**
     * @scriptlet set-session-storage-item
     *
     * @description
     * Adds specified key and its value to sessionStorage object, or updates the value of the key if it already exists.
     *
     * **Syntax**
     * ```
     * example.com#%#//scriptlet('set-session-storage-item', 'key', 'value')
     * ```
     *
     * - `key` — required, key name to be set.
     * - `value` - required, key value; possible values:
     *     - positive decimal integer `<= 32767`
     *     - one of the predefined constants:
     *         - `undefined`
     *         - `false`
     *         - `true`
     *         - `null`
     *         - `emptyObj` - empty object
     *         - `emptyArr` - empty array
     *         - `''` - empty string
     *
     * **Examples**
     * ```
     * example.org#%#//scriptlet('set-session-storage-item', 'player.live.current.mute', 'false')
     *
     * example.org#%#//scriptlet('set-session-storage-item', 'exit-intent-marketing', '1')
     * ```
     */

    /* eslint-enable max-len */

    function setSessionStorageItem(source, key, value) {
      if (!key || !value && value !== '') {
        return;
      }

      var keyValue;

      if (value === 'undefined') {
        keyValue = undefined;
      } else if (value === 'false') {
        keyValue = false;
      } else if (value === 'true') {
        keyValue = true;
      } else if (value === 'null') {
        keyValue = null;
      } else if (value === 'emptyArr') {
        keyValue = '[]';
      } else if (value === 'emptyObj') {
        keyValue = '{}';
      } else if (value === '') {
        keyValue = '';
      } else if (/^\d+$/.test(value)) {
        keyValue = parseFloat(value);

        if (nativeIsNaN(keyValue)) {
          return;
        }

        if (Math.abs(keyValue) > 0x7FFF) {
          return;
        }
      } else {
        return;
      }

      var setItem = function setItem(key, value) {
        var _window = window,
            sessionStorage = _window.sessionStorage; // setItem() may throw an exception if the storage is full.

        try {
          sessionStorage.setItem(key, value);
          hit(source);
        } catch (e) {
          if (source.verbose) {
            // eslint-disable-next-line no-console
            console.log("Was unable to set sessionStorage item due to: ".concat(e.message));
          }
        }
      };

      setItem(key, keyValue);
    }
    setSessionStorageItem.names = ['set-session-storage-item'];
    setSessionStorageItem.injections = [hit, nativeIsNaN];

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
        setCookieReload: setCookieReload,
        hideInShadowDom: hideInShadowDom,
        removeInShadowDom: removeInShadowDom,
        noFloc: noFloc,
        preventFetch: preventFetch,
        setLocalStorageItem: setLocalStorageItem,
        setSessionStorageItem: setSessionStorageItem
    });

    /**
     * Store of ADG redirects names and thier analogs.
     * As it is not a compatibility table, no need to keep in redirects array third-party redirects.
     *
     * Needed only for converion purposes.
     * e.g. googletagmanager-gtm is removed and should be removed from compatibility table as well
     * but now it works as alias for google-analytics so it should stay valid for compiler
     */
    var redirects = [{
      adg: '1x1-transparent.gif',
      ubo: '1x1.gif',
      abp: '1x1-transparent-gif'
    }, {
      adg: '2x2-transparent.png',
      ubo: '2x2.png',
      abp: '2x2-transparent-png'
    }, {
      adg: '3x2-transparent.png',
      ubo: '3x2.png',
      abp: '3x2-transparent-png'
    }, {
      adg: '32x32-transparent.png',
      ubo: '32x32.png',
      abp: '32x32-transparent-png'
    }, {
      adg: 'amazon-apstag',
      ubo: 'amazon_apstag.js'
    }, {
      adg: 'google-analytics',
      ubo: 'google-analytics_analytics.js'
    }, {
      adg: 'google-analytics-ga',
      ubo: 'google-analytics_ga.js'
    }, {
      adg: 'googlesyndication-adsbygoogle',
      ubo: 'googlesyndication_adsbygoogle.js'
    }, {
      // https://github.com/AdguardTeam/Scriptlets/issues/127
      adg: 'googletagmanager-gtm',
      ubo: 'google-analytics_ga.js'
    }, {
      adg: 'googletagservices-gpt',
      ubo: 'googletagservices_gpt.js'
    }, {
      adg: 'metrika-yandex-watch'
    }, {
      adg: 'metrika-yandex-tag'
    }, {
      adg: 'noeval',
      ubo: 'noeval-silent.js'
    }, {
      adg: 'noopcss',
      abp: 'blank-css'
    }, {
      adg: 'noopframe',
      ubo: 'noop.html',
      abp: 'blank-html'
    }, {
      adg: 'noopjs',
      ubo: 'noop.js',
      abp: 'blank-js'
    }, {
      adg: 'nooptext',
      ubo: 'noop.txt',
      abp: 'blank-text'
    }, {
      adg: 'noopmp3-0.1s',
      ubo: 'noop-0.1s.mp3',
      abp: 'blank-mp3'
    }, {
      adg: 'noopmp4-1s',
      ubo: 'noop-1s.mp4',
      abp: 'blank-mp4'
    }, {
      adg: 'noopvmap-1.0',
      ubo: 'noop-vmap1.0.xml'
    }, {
      adg: 'noopvast-2.0'
    }, {
      adg: 'noopvast-3.0'
    }, {
      adg: 'prevent-bab',
      ubo: 'nobab.js'
    }, {
      adg: 'prevent-fab-3.2.0',
      ubo: 'nofab.js'
    }, {
      adg: 'prevent-popads-net',
      ubo: 'popads.js'
    }, {
      adg: 'scorecardresearch-beacon',
      ubo: 'scorecardresearch_beacon.js'
    }, {
      adg: 'set-popads-dummy',
      ubo: 'popads-dummy.js'
    }, {
      adg: 'empty',
      ubo: 'empty'
    }];

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
    var EMPTY_REDIRECT_MARKER = 'empty';
    var VALID_SOURCE_TYPES = ['image', 'media', 'subdocument', 'stylesheet', 'script', 'xmlhttprequest', 'other'];
    /**
     * Source types for redirect rules if there is no one of them.
     * Used for ADG -> UBO conversion.
     */

    var ABSENT_SOURCE_TYPE_REPLACEMENT = [{
      NAME: 'nooptext',
      TYPES: VALID_SOURCE_TYPES
    }, {
      NAME: 'noopjs',
      TYPES: ['script']
    }, {
      NAME: 'noopframe',
      TYPES: ['subdocument']
    }, {
      NAME: '1x1-transparent.gif',
      TYPES: ['image']
    }, {
      NAME: 'noopmp3-0.1s',
      TYPES: ['media']
    }, {
      NAME: 'noopmp4-1s',
      TYPES: ['media']
    }, {
      NAME: 'googlesyndication-adsbygoogle',
      TYPES: ['xmlhttprequest', 'script']
    }, {
      NAME: 'google-analytics',
      TYPES: ['script']
    }, {
      NAME: 'googletagservices-gpt',
      TYPES: ['script']
    }];
    var validAdgRedirects = redirects.filter(function (el) {
      return el.adg;
    });
    /**
     * Compatibility object where KEYS = UBO redirect names and VALUES = ADG redirect names
     * It's used for UBO -> ADG converting
     */

    var uboToAdgCompatibility = getObjectFromEntries(validAdgRedirects.filter(function (el) {
      return el.ubo;
    }).map(function (el) {
      return [el.ubo, el.adg];
    }));
    /**
     * Compatibility object where KEYS = ABP redirect names and VALUES = ADG redirect names
     * It's used for ABP -> ADG converting
     */

    var abpToAdgCompatibility = getObjectFromEntries(validAdgRedirects.filter(function (el) {
      return el.abp;
    }).map(function (el) {
      return [el.abp, el.adg];
    }));
    /**
     * Compatibility object where KEYS = UBO redirect names and VALUES = ADG redirect names
     * It's used for ADG -> UBO converting
     */

    var adgToUboCompatibility = getObjectFromEntries(validAdgRedirects.filter(function (el) {
      return el.ubo;
    }).map(function (el) {
      return [el.adg, el.ubo];
    }));
    /**
     * Needed for AdGuard redirect names validation where KEYS = **valid** AdGuard redirect names
     * 'adgToUboCompatibility' is still needed for ADG -> UBO converting
     */

    var validAdgCompatibility = getObjectFromEntries(validAdgRedirects.map(function (el) {
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

        if (!redirectName) {
          return false;
        }

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
      var ruleModifiers = parseModifiers(rule); // rule can have more than one source type modifier

      var sourceTypes = ruleModifiers.filter(function (el) {
        return VALID_SOURCE_TYPES.indexOf(el) > -1;
      });
      var isSourceTypeSpecified = sourceTypes.length > 0;
      var isEmptyRedirect = ruleModifiers.indexOf("".concat(ADG_UBO_REDIRECT_MARKER).concat(EMPTY_REDIRECT_MARKER)) > -1;

      if (isEmptyRedirect) {
        // no source type for 'empty' is allowed
        return true;
      }

      return isSourceTypeSpecified;
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
      ABSENT_SOURCE_TYPE_REPLACEMENT: ABSENT_SOURCE_TYPE_REPLACEMENT,
      isAdgRedirectRule: isAdgRedirectRule,
      isValidAdgRedirectRule: isValidAdgRedirectRule,
      isAdgRedirectCompatibleWithUbo: isAdgRedirectCompatibleWithUbo,
      isUboRedirectCompatibleWithAdg: isUboRedirectCompatibleWithAdg,
      isAbpRedirectCompatibleWithAdg: isAbpRedirectCompatibleWithAdg,
      parseModifiers: parseModifiers,
      getRedirectName: getRedirectName,
      hasValidContentType: hasValidContentType
    };

    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;

      for (var i = 0, arr2 = new Array(len); i < len; i++) {
        arr2[i] = arr[i];
      }

      return arr2;
    }

    var arrayLikeToArray = _arrayLikeToArray;

    function _arrayWithoutHoles(arr) {
      if (Array.isArray(arr)) return arrayLikeToArray(arr);
    }

    var arrayWithoutHoles = _arrayWithoutHoles;

    function _iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
    }

    var iterableToArray = _iterableToArray;

    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === "string") return arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor) n = o.constructor.name;
      if (n === "Map" || n === "Set") return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return arrayLikeToArray(o, minLen);
    }

    var unsupportedIterableToArray = _unsupportedIterableToArray;

    function _nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }

    var nonIterableSpread = _nonIterableSpread;

    function _toConsumableArray(arr) {
      return arrayWithoutHoles(arr) || iterableToArray(arr) || unsupportedIterableToArray(arr) || nonIterableSpread();
    }

    var toConsumableArray = _toConsumableArray;

    function _arrayWithHoles(arr) {
      if (Array.isArray(arr)) return arr;
    }

    var arrayWithHoles = _arrayWithHoles;

    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }

    var nonIterableRest = _nonIterableRest;

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
    var UBO_ALIAS_NAME_MARKER = 'ubo-';
    var UBO_SCRIPTLET_JS_ENDING = '.js'; // https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#xhr

    var UBO_XHR_TYPE = 'xhr';
    var ADG_XHR_TYPE = 'xmlhttprequest';
    var ADG_SET_CONSTANT_NAME = 'set-constant';
    var ADG_SET_CONSTANT_EMPTY_STRING = '';
    var UBO_SET_CONSTANT_EMPTY_STRING = '\'\'';
    var ADG_PREVENT_FETCH_NAME = 'prevent-fetch';
    var ADG_PREVENT_FETCH_EMPTY_STRING = '';
    var ADG_PREVENT_FETCH_WILDCARD = getWildcardSymbol();
    var UBO_NO_FETCH_IF_WILDCARD = '/^/';
    var ESCAPED_COMMA_SEPARATOR = '\\,';
    var COMMA_SEPARATOR = ',';
    var MAX_REMOVE_ATTR_CLASS_ARGS_COUNT = 3;
    var REMOVE_ATTR_METHOD = 'removeAttr';
    var REMOVE_CLASS_METHOD = 'removeClass';
    var REMOVE_ATTR_ALIASES = scriptletList[REMOVE_ATTR_METHOD].names;
    var REMOVE_CLASS_ALIASES = scriptletList[REMOVE_CLASS_METHOD].names;
    var ADG_REMOVE_ATTR_NAME = REMOVE_ATTR_ALIASES[0];
    var ADG_REMOVE_CLASS_NAME = REMOVE_CLASS_ALIASES[0];
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

      var parsedArgs = getStringInBraces(rule).split(/,\s/g);

      if (parsedArgs.length === 1) {
        // Most probably this is not correct separator, in this case we use ','
        parsedArgs = getStringInBraces(rule).split(/,/g);
      }

      var scriptletName = parsedArgs[0].indexOf(UBO_SCRIPTLET_JS_ENDING) > -1 ? "ubo-".concat(parsedArgs[0]) : "ubo-".concat(parsedArgs[0]).concat(UBO_SCRIPTLET_JS_ENDING);

      if ((REMOVE_ATTR_ALIASES.indexOf(scriptletName) > -1 || REMOVE_CLASS_ALIASES.indexOf(scriptletName) > -1) && parsedArgs.length > MAX_REMOVE_ATTR_CLASS_ARGS_COUNT) {
        parsedArgs = [parsedArgs[0], parsedArgs[1], // if there are more than 3 args for remove-attr/class scriptlet,
        // ubo rule has maltiple selector separated by comma. so we should:
        // 1. join them into a single string
        // 2. replace escaped commas by regular ones
        // https://github.com/AdguardTeam/Scriptlets/issues/133
        replaceAll(parsedArgs.slice(2).join("".concat(COMMA_SEPARATOR, " ")), ESCAPED_COMMA_SEPARATOR, COMMA_SEPARATOR)];
      }

      var args = parsedArgs.map(function (arg, index) {
        var outputArg = arg;

        if (index === 0) {
          outputArg = scriptletName;
        } // for example: dramaserial.xyz##+js(abort-current-inline-script, $, popup)


        if (arg === '$') {
          outputArg = '$$';
        }

        return outputArg;
      }).map(function (arg) {
        return wrapInSingleQuotes(arg);
      }).join("".concat(COMMA_SEPARATOR, " "));
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
        }).join("".concat(COMMA_SEPARATOR, " "));
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
            parsedParams = _parseRule.args;

        var preparedParams; // https://github.com/AdguardTeam/FiltersCompiler/issues/102

        if (parsedName === ADG_SET_CONSTANT_NAME && parsedParams[1] === ADG_SET_CONSTANT_EMPTY_STRING) {
          preparedParams = [parsedParams[0], UBO_SET_CONSTANT_EMPTY_STRING];
        } else if (parsedName === ADG_PREVENT_FETCH_NAME // https://github.com/AdguardTeam/Scriptlets/issues/109
        && (parsedParams[0] === ADG_PREVENT_FETCH_WILDCARD || parsedParams[0] === ADG_PREVENT_FETCH_EMPTY_STRING)) {
          preparedParams = [UBO_NO_FETCH_IF_WILDCARD];
        } else if ((parsedName === ADG_REMOVE_ATTR_NAME || parsedName === ADG_REMOVE_CLASS_NAME) && parsedParams[1] && parsedParams[1].indexOf(COMMA_SEPARATOR) > -1) {
          preparedParams = [parsedParams[0], replaceAll(parsedParams[1], COMMA_SEPARATOR, ESCAPED_COMMA_SEPARATOR)];
        } else {
          preparedParams = parsedParams;
        } // object of name and aliases for the Adg-scriptlet


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
            .replace(UBO_SCRIPTLET_JS_ENDING, '');
            var args = preparedParams.length > 0 ? "".concat(uboName, ", ").concat(preparedParams.join("".concat(COMMA_SEPARATOR, " "))) : uboName;
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
     * Checks whether the ADG scriptlet exists or UBO/ABP scriptlet is compatible to ADG
     * @param {string} input - can be ADG or UBO or ABP scriptlet rule
     * @returns {boolean}
     */

    var isValidScriptletRule = function isValidScriptletRule(input) {
      if (!input) {
        return false;
      } // ABP 'input' rule may contain more than one snippet


      var rulesArray = convertScriptletToAdg(input); // checking if each of parsed scriptlets is valid
      // if at least one of them is not valid - whole 'input' rule is not valid too

      var isValid = rulesArray.every(function (rule) {
        var parsedRule = parseRule(rule);
        return validator.isValidScriptletName(parsedRule.name);
      });
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
      }).join(COMMA_SEPARATOR);
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
      }).join(COMMA_SEPARATOR);
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
     * 1. Checks if there is Ubo analog for Adg rule
     * 2. Parses the rule and chechs if there are any source type modifiers which are required by Ubo
     *    and if there are no one we add it manually to the end.
     *    Source types are chosen according to redirect name
     *    e.g. ||ad.com^$redirect=<name>,important  ->>  ||ad.com^$redirect=<name>,important,script
     * 3. Replaces Adg redirect name by Ubo analog
     * @param {string} rule
     * @returns {string}
     */

    var convertAdgRedirectToUbo = function convertAdgRedirectToUbo(rule) {
      if (!validator.isAdgRedirectCompatibleWithUbo(rule)) {
        throw new Error("Unable to convert for uBO - unsupported redirect in rule: ".concat(rule));
      }

      var basePart = substringBefore(rule, '$');
      var adgModifiers = validator.parseModifiers(rule);
      var adgRedirectModifier = adgModifiers.find(function (el) {
        return el.indexOf(validator.REDIRECT_RULE_TYPES.ADG.marker) > -1;
      });
      var adgRedirectName = adgRedirectModifier.slice(validator.REDIRECT_RULE_TYPES.ADG.marker.length);
      var uboRedirectName = validator.REDIRECT_RULE_TYPES.ADG.compatibility[adgRedirectName];
      var uboRedirectModifier = "".concat(validator.REDIRECT_RULE_TYPES.UBO.marker).concat(uboRedirectName);

      if (!validator.hasValidContentType(rule)) {
        // add missed source types as content type modifiers
        var sourceTypesData = validator.ABSENT_SOURCE_TYPE_REPLACEMENT.find(function (el) {
          return el.NAME === adgRedirectName;
        });

        if (typeof sourceTypesData === 'undefined') {
          throw new Error("Unable to convert for uBO - no types to add for specific redirect in rule: ".concat(rule));
        }

        var additionModifiers = sourceTypesData.TYPES;
        adgModifiers.push.apply(adgModifiers, toConsumableArray(additionModifiers));
      }

      var uboModifiers = adgModifiers.map(function (el) {
        if (el === adgRedirectModifier) {
          return uboRedirectModifier;
        }

        return el;
      }).join(COMMA_SEPARATOR);
      return "".concat(basePart, "$").concat(uboModifiers);
    };

    /**
     * @redirect google-analytics
     *
     * @description
     * Mocks Google's Analytics and Tag Manager APIs.
     * [Covers obsolete googletagmanager-gtm redirect functionality](https://github.com/AdguardTeam/Scriptlets/issues/127).
     *
     * Related UBO redirect resource:
     * https://github.com/gorhill/uBlock/blob/8cd2a1d263a96421487b39040c1d23eb01169484/src/web_accessible_resources/google-analytics_analytics.js
     *
     * **Example**
     * ```
     * ||google-analytics.com/analytics.js$script,redirect=google-analytics
     * ||googletagmanager.com/gtm.js$script,redirect=googletagmanager-gtm
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
        var replacer;

        if (lastArg instanceof Object && lastArg !== null && typeof lastArg.hitCallback === 'function') {
          replacer = lastArg.hitCallback;
        } else if (typeof lastArg === 'function') {
          // https://github.com/AdguardTeam/Scriptlets/issues/98
          replacer = function replacer() {
            lastArg(ga.create());
          };
        }

        try {
          setTimeout(replacer, 1); // eslint-disable-next-line no-empty
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
    GoogleAnalytics.names = ['google-analytics', 'ubo-google-analytics_analytics.js', 'google-analytics_analytics.js', // https://github.com/AdguardTeam/Scriptlets/issues/127
    'googletagmanager-gtm', 'ubo-googletagmanager_gtm.js', 'googletagmanager_gtm.js'];
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
        // https://github.com/AdguardTeam/Scriptlets/issues/113
        // length: 0,
        loaded: true,
        push: function push() {
          if (typeof this.length === 'undefined') {
            this.length = 0;
            this.length += 1;
          }
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
          aswiftIframe.id = "".concat(ASWIFT_IFRAME_MARKER).concat(i);
          aswiftIframe.style = css;
          adElems[i].appendChild(aswiftIframe);
          var innerAswiftIframe = document.createElement('iframe');
          aswiftIframe.contentWindow.document.body.appendChild(innerAswiftIframe);
          var googleadsIframe = document.createElement('iframe');
          googleadsIframe.id = "".concat(GOOGLE_ADS_IFRAME_MARKER).concat(i);
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
        GoogleTagServicesGpt: GoogleTagServicesGpt,
        ScoreCardResearchBeacon: ScoreCardResearchBeacon,
        metrikaYandexTag: metrikaYandexTag,
        metrikaYandexWatch: metrikaYandexWatch,
        preventFab: preventFab,
        preventBab: preventBab,
        setPopadsDummy: setPopadsDummy,
        preventPopadsNet: preventPopadsNet,
        AmazonApstag: AmazonApstag
    });

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }

    var classCallCheck = _classCallCheck;

    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps) _defineProperties(Constructor.prototype, protoProps);
      if (staticProps) _defineProperties(Constructor, staticProps);
      return Constructor;
    }

    var createClass = _createClass;

    function isNothing(subject) {
      return typeof subject === 'undefined' || subject === null;
    }

    function isObject(subject) {
      return typeof subject === 'object' && subject !== null;
    }

    function toArray$1(sequence) {
      if (Array.isArray(sequence)) return sequence;else if (isNothing(sequence)) return [];
      return [sequence];
    }

    function extend(target, source) {
      var index, length, key, sourceKeys;

      if (source) {
        sourceKeys = Object.keys(source);

        for (index = 0, length = sourceKeys.length; index < length; index += 1) {
          key = sourceKeys[index];
          target[key] = source[key];
        }
      }

      return target;
    }

    function repeat(string, count) {
      var result = '',
          cycle;

      for (cycle = 0; cycle < count; cycle += 1) {
        result += string;
      }

      return result;
    }

    function isNegativeZero(number) {
      return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
    }

    var isNothing_1 = isNothing;
    var isObject_1 = isObject;
    var toArray_1 = toArray$1;
    var repeat_1 = repeat;
    var isNegativeZero_1 = isNegativeZero;
    var extend_1 = extend;
    var common = {
      isNothing: isNothing_1,
      isObject: isObject_1,
      toArray: toArray_1,
      repeat: repeat_1,
      isNegativeZero: isNegativeZero_1,
      extend: extend_1
    };

    // YAML error class. http://stackoverflow.com/questions/8458984

    function YAMLException(reason, mark) {
      // Super constructor
      Error.call(this);
      this.name = 'YAMLException';
      this.reason = reason;
      this.mark = mark;
      this.message = (this.reason || '(unknown reason)') + (this.mark ? ' ' + this.mark.toString() : ''); // Include stack trace in error object

      if (Error.captureStackTrace) {
        // Chrome and NodeJS
        Error.captureStackTrace(this, this.constructor);
      } else {
        // FF, IE 10+ and Safari 6+. Fallback for others
        this.stack = new Error().stack || '';
      }
    } // Inherit from Error


    YAMLException.prototype = Object.create(Error.prototype);
    YAMLException.prototype.constructor = YAMLException;

    YAMLException.prototype.toString = function toString(compact) {
      var result = this.name + ': ';
      result += this.reason || '(unknown reason)';

      if (!compact && this.mark) {
        result += ' ' + this.mark.toString();
      }

      return result;
    };

    var exception = YAMLException;

    function Mark(name, buffer, position, line, column) {
      this.name = name;
      this.buffer = buffer;
      this.position = position;
      this.line = line;
      this.column = column;
    }

    Mark.prototype.getSnippet = function getSnippet(indent, maxLength) {
      var head, start, tail, end, snippet;
      if (!this.buffer) return null;
      indent = indent || 4;
      maxLength = maxLength || 75;
      head = '';
      start = this.position;

      while (start > 0 && "\0\r\n\x85\u2028\u2029".indexOf(this.buffer.charAt(start - 1)) === -1) {
        start -= 1;

        if (this.position - start > maxLength / 2 - 1) {
          head = ' ... ';
          start += 5;
          break;
        }
      }

      tail = '';
      end = this.position;

      while (end < this.buffer.length && "\0\r\n\x85\u2028\u2029".indexOf(this.buffer.charAt(end)) === -1) {
        end += 1;

        if (end - this.position > maxLength / 2 - 1) {
          tail = ' ... ';
          end -= 5;
          break;
        }
      }

      snippet = this.buffer.slice(start, end);
      return common.repeat(' ', indent) + head + snippet + tail + '\n' + common.repeat(' ', indent + this.position - start + head.length) + '^';
    };

    Mark.prototype.toString = function toString(compact) {
      var snippet,
          where = '';

      if (this.name) {
        where += 'in "' + this.name + '" ';
      }

      where += 'at line ' + (this.line + 1) + ', column ' + (this.column + 1);

      if (!compact) {
        snippet = this.getSnippet();

        if (snippet) {
          where += ':\n' + snippet;
        }
      }

      return where;
    };

    var mark = Mark;

    var TYPE_CONSTRUCTOR_OPTIONS = ['kind', 'resolve', 'construct', 'instanceOf', 'predicate', 'represent', 'defaultStyle', 'styleAliases'];
    var YAML_NODE_KINDS = ['scalar', 'sequence', 'mapping'];

    function compileStyleAliases(map) {
      var result = {};

      if (map !== null) {
        Object.keys(map).forEach(function (style) {
          map[style].forEach(function (alias) {
            result[String(alias)] = style;
          });
        });
      }

      return result;
    }

    function Type(tag, options) {
      options = options || {};
      Object.keys(options).forEach(function (name) {
        if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
          throw new exception('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
        }
      }); // TODO: Add tag format check.

      this.tag = tag;
      this.kind = options['kind'] || null;

      this.resolve = options['resolve'] || function () {
        return true;
      };

      this.construct = options['construct'] || function (data) {
        return data;
      };

      this.instanceOf = options['instanceOf'] || null;
      this.predicate = options['predicate'] || null;
      this.represent = options['represent'] || null;
      this.defaultStyle = options['defaultStyle'] || null;
      this.styleAliases = compileStyleAliases(options['styleAliases'] || null);

      if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
        throw new exception('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
      }
    }

    var type = Type;

    /*eslint-disable max-len*/


    function compileList(schema, name, result) {
      var exclude = [];
      schema.include.forEach(function (includedSchema) {
        result = compileList(includedSchema, name, result);
      });
      schema[name].forEach(function (currentType) {
        result.forEach(function (previousType, previousIndex) {
          if (previousType.tag === currentType.tag && previousType.kind === currentType.kind) {
            exclude.push(previousIndex);
          }
        });
        result.push(currentType);
      });
      return result.filter(function (type, index) {
        return exclude.indexOf(index) === -1;
      });
    }

    function compileMap()
    /* lists... */
    {
      var result = {
        scalar: {},
        sequence: {},
        mapping: {},
        fallback: {}
      },
          index,
          length;

      function collectType(type) {
        result[type.kind][type.tag] = result['fallback'][type.tag] = type;
      }

      for (index = 0, length = arguments.length; index < length; index += 1) {
        arguments[index].forEach(collectType);
      }

      return result;
    }

    function Schema(definition) {
      this.include = definition.include || [];
      this.implicit = definition.implicit || [];
      this.explicit = definition.explicit || [];
      this.implicit.forEach(function (type) {
        if (type.loadKind && type.loadKind !== 'scalar') {
          throw new exception('There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.');
        }
      });
      this.compiledImplicit = compileList(this, 'implicit', []);
      this.compiledExplicit = compileList(this, 'explicit', []);
      this.compiledTypeMap = compileMap(this.compiledImplicit, this.compiledExplicit);
    }

    Schema.DEFAULT = null;

    Schema.create = function createSchema() {
      var schemas, types;

      switch (arguments.length) {
        case 1:
          schemas = Schema.DEFAULT;
          types = arguments[0];
          break;

        case 2:
          schemas = arguments[0];
          types = arguments[1];
          break;

        default:
          throw new exception('Wrong number of arguments for Schema.create function');
      }

      schemas = common.toArray(schemas);
      types = common.toArray(types);

      if (!schemas.every(function (schema) {
        return schema instanceof Schema;
      })) {
        throw new exception('Specified list of super schemas (or a single Schema object) contains a non-Schema object.');
      }

      if (!types.every(function (type$1) {
        return type$1 instanceof type;
      })) {
        throw new exception('Specified list of YAML types (or a single Type object) contains a non-Type object.');
      }

      return new Schema({
        include: schemas,
        explicit: types
      });
    };

    var schema = Schema;

    var str = new type('tag:yaml.org,2002:str', {
      kind: 'scalar',
      construct: function construct(data) {
        return data !== null ? data : '';
      }
    });

    var seq = new type('tag:yaml.org,2002:seq', {
      kind: 'sequence',
      construct: function construct(data) {
        return data !== null ? data : [];
      }
    });

    var map = new type('tag:yaml.org,2002:map', {
      kind: 'mapping',
      construct: function construct(data) {
        return data !== null ? data : {};
      }
    });

    var failsafe = new schema({
      explicit: [str, seq, map]
    });

    function resolveYamlNull(data) {
      if (data === null) return true;
      var max = data.length;
      return max === 1 && data === '~' || max === 4 && (data === 'null' || data === 'Null' || data === 'NULL');
    }

    function constructYamlNull() {
      return null;
    }

    function isNull(object) {
      return object === null;
    }

    var _null = new type('tag:yaml.org,2002:null', {
      kind: 'scalar',
      resolve: resolveYamlNull,
      construct: constructYamlNull,
      predicate: isNull,
      represent: {
        canonical: function canonical() {
          return '~';
        },
        lowercase: function lowercase() {
          return 'null';
        },
        uppercase: function uppercase() {
          return 'NULL';
        },
        camelcase: function camelcase() {
          return 'Null';
        }
      },
      defaultStyle: 'lowercase'
    });

    function resolveYamlBoolean(data) {
      if (data === null) return false;
      var max = data.length;
      return max === 4 && (data === 'true' || data === 'True' || data === 'TRUE') || max === 5 && (data === 'false' || data === 'False' || data === 'FALSE');
    }

    function constructYamlBoolean(data) {
      return data === 'true' || data === 'True' || data === 'TRUE';
    }

    function isBoolean(object) {
      return Object.prototype.toString.call(object) === '[object Boolean]';
    }

    var bool = new type('tag:yaml.org,2002:bool', {
      kind: 'scalar',
      resolve: resolveYamlBoolean,
      construct: constructYamlBoolean,
      predicate: isBoolean,
      represent: {
        lowercase: function lowercase(object) {
          return object ? 'true' : 'false';
        },
        uppercase: function uppercase(object) {
          return object ? 'TRUE' : 'FALSE';
        },
        camelcase: function camelcase(object) {
          return object ? 'True' : 'False';
        }
      },
      defaultStyle: 'lowercase'
    });

    function isHexCode(c) {
      return 0x30
      /* 0 */
      <= c && c <= 0x39
      /* 9 */
      || 0x41
      /* A */
      <= c && c <= 0x46
      /* F */
      || 0x61
      /* a */
      <= c && c <= 0x66
      /* f */
      ;
    }

    function isOctCode(c) {
      return 0x30
      /* 0 */
      <= c && c <= 0x37
      /* 7 */
      ;
    }

    function isDecCode(c) {
      return 0x30
      /* 0 */
      <= c && c <= 0x39
      /* 9 */
      ;
    }

    function resolveYamlInteger(data) {
      if (data === null) return false;
      var max = data.length,
          index = 0,
          hasDigits = false,
          ch;
      if (!max) return false;
      ch = data[index]; // sign

      if (ch === '-' || ch === '+') {
        ch = data[++index];
      }

      if (ch === '0') {
        // 0
        if (index + 1 === max) return true;
        ch = data[++index]; // base 2, base 8, base 16

        if (ch === 'b') {
          // base 2
          index++;

          for (; index < max; index++) {
            ch = data[index];
            if (ch === '_') continue;
            if (ch !== '0' && ch !== '1') return false;
            hasDigits = true;
          }

          return hasDigits && ch !== '_';
        }

        if (ch === 'x') {
          // base 16
          index++;

          for (; index < max; index++) {
            ch = data[index];
            if (ch === '_') continue;
            if (!isHexCode(data.charCodeAt(index))) return false;
            hasDigits = true;
          }

          return hasDigits && ch !== '_';
        } // base 8


        for (; index < max; index++) {
          ch = data[index];
          if (ch === '_') continue;
          if (!isOctCode(data.charCodeAt(index))) return false;
          hasDigits = true;
        }

        return hasDigits && ch !== '_';
      } // base 10 (except 0) or base 60
      // value should not start with `_`;


      if (ch === '_') return false;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (ch === ':') break;

        if (!isDecCode(data.charCodeAt(index))) {
          return false;
        }

        hasDigits = true;
      } // Should have digits and should not end with `_`


      if (!hasDigits || ch === '_') return false; // if !base60 - done;

      if (ch !== ':') return true; // base60 almost not used, no needs to optimize

      return /^(:[0-5]?[0-9])+$/.test(data.slice(index));
    }

    function constructYamlInteger(data) {
      var value = data,
          sign = 1,
          ch,
          base,
          digits = [];

      if (value.indexOf('_') !== -1) {
        value = value.replace(/_/g, '');
      }

      ch = value[0];

      if (ch === '-' || ch === '+') {
        if (ch === '-') sign = -1;
        value = value.slice(1);
        ch = value[0];
      }

      if (value === '0') return 0;

      if (ch === '0') {
        if (value[1] === 'b') return sign * parseInt(value.slice(2), 2);
        if (value[1] === 'x') return sign * parseInt(value, 16);
        return sign * parseInt(value, 8);
      }

      if (value.indexOf(':') !== -1) {
        value.split(':').forEach(function (v) {
          digits.unshift(parseInt(v, 10));
        });
        value = 0;
        base = 1;
        digits.forEach(function (d) {
          value += d * base;
          base *= 60;
        });
        return sign * value;
      }

      return sign * parseInt(value, 10);
    }

    function isInteger(object) {
      return Object.prototype.toString.call(object) === '[object Number]' && object % 1 === 0 && !common.isNegativeZero(object);
    }

    var int = new type('tag:yaml.org,2002:int', {
      kind: 'scalar',
      resolve: resolveYamlInteger,
      construct: constructYamlInteger,
      predicate: isInteger,
      represent: {
        binary: function binary(obj) {
          return obj >= 0 ? '0b' + obj.toString(2) : '-0b' + obj.toString(2).slice(1);
        },
        octal: function octal(obj) {
          return obj >= 0 ? '0' + obj.toString(8) : '-0' + obj.toString(8).slice(1);
        },
        decimal: function decimal(obj) {
          return obj.toString(10);
        },

        /* eslint-disable max-len */
        hexadecimal: function hexadecimal(obj) {
          return obj >= 0 ? '0x' + obj.toString(16).toUpperCase() : '-0x' + obj.toString(16).toUpperCase().slice(1);
        }
      },
      defaultStyle: 'decimal',
      styleAliases: {
        binary: [2, 'bin'],
        octal: [8, 'oct'],
        decimal: [10, 'dec'],
        hexadecimal: [16, 'hex']
      }
    });

    var YAML_FLOAT_PATTERN = new RegExp( // 2.5e4, 2.5 and integers
    '^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?' + // .2e4, .2
    // special case, seems not from spec
    '|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?' + // 20:59
    '|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*' + // .inf
    '|[-+]?\\.(?:inf|Inf|INF)' + // .nan
    '|\\.(?:nan|NaN|NAN))$');

    function resolveYamlFloat(data) {
      if (data === null) return false;

      if (!YAML_FLOAT_PATTERN.test(data) || // Quick hack to not allow integers end with `_`
      // Probably should update regexp & check speed
      data[data.length - 1] === '_') {
        return false;
      }

      return true;
    }

    function constructYamlFloat(data) {
      var value, sign, base, digits;
      value = data.replace(/_/g, '').toLowerCase();
      sign = value[0] === '-' ? -1 : 1;
      digits = [];

      if ('+-'.indexOf(value[0]) >= 0) {
        value = value.slice(1);
      }

      if (value === '.inf') {
        return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      } else if (value === '.nan') {
        return NaN;
      } else if (value.indexOf(':') >= 0) {
        value.split(':').forEach(function (v) {
          digits.unshift(parseFloat(v, 10));
        });
        value = 0.0;
        base = 1;
        digits.forEach(function (d) {
          value += d * base;
          base *= 60;
        });
        return sign * value;
      }

      return sign * parseFloat(value, 10);
    }

    var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;

    function representYamlFloat(object, style) {
      var res;

      if (isNaN(object)) {
        switch (style) {
          case 'lowercase':
            return '.nan';

          case 'uppercase':
            return '.NAN';

          case 'camelcase':
            return '.NaN';
        }
      } else if (Number.POSITIVE_INFINITY === object) {
        switch (style) {
          case 'lowercase':
            return '.inf';

          case 'uppercase':
            return '.INF';

          case 'camelcase':
            return '.Inf';
        }
      } else if (Number.NEGATIVE_INFINITY === object) {
        switch (style) {
          case 'lowercase':
            return '-.inf';

          case 'uppercase':
            return '-.INF';

          case 'camelcase':
            return '-.Inf';
        }
      } else if (common.isNegativeZero(object)) {
        return '-0.0';
      }

      res = object.toString(10); // JS stringifier can build scientific format without dots: 5e-100,
      // while YAML requres dot: 5.e-100. Fix it with simple hack

      return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace('e', '.e') : res;
    }

    function isFloat(object) {
      return Object.prototype.toString.call(object) === '[object Number]' && (object % 1 !== 0 || common.isNegativeZero(object));
    }

    var float = new type('tag:yaml.org,2002:float', {
      kind: 'scalar',
      resolve: resolveYamlFloat,
      construct: constructYamlFloat,
      predicate: isFloat,
      represent: representYamlFloat,
      defaultStyle: 'lowercase'
    });

    var json = new schema({
      include: [failsafe],
      implicit: [_null, bool, int, float]
    });

    var core = new schema({
      include: [json]
    });

    var YAML_DATE_REGEXP = new RegExp('^([0-9][0-9][0-9][0-9])' + // [1] year
    '-([0-9][0-9])' + // [2] month
    '-([0-9][0-9])$'); // [3] day

    var YAML_TIMESTAMP_REGEXP = new RegExp('^([0-9][0-9][0-9][0-9])' + // [1] year
    '-([0-9][0-9]?)' + // [2] month
    '-([0-9][0-9]?)' + // [3] day
    '(?:[Tt]|[ \\t]+)' + // ...
    '([0-9][0-9]?)' + // [4] hour
    ':([0-9][0-9])' + // [5] minute
    ':([0-9][0-9])' + // [6] second
    '(?:\\.([0-9]*))?' + // [7] fraction
    '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' + // [8] tz [9] tz_sign [10] tz_hour
    '(?::([0-9][0-9]))?))?$'); // [11] tz_minute

    function resolveYamlTimestamp(data) {
      if (data === null) return false;
      if (YAML_DATE_REGEXP.exec(data) !== null) return true;
      if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
      return false;
    }

    function constructYamlTimestamp(data) {
      var match,
          year,
          month,
          day,
          hour,
          minute,
          second,
          fraction = 0,
          delta = null,
          tz_hour,
          tz_minute,
          date;
      match = YAML_DATE_REGEXP.exec(data);
      if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
      if (match === null) throw new Error('Date resolve error'); // match: [1] year [2] month [3] day

      year = +match[1];
      month = +match[2] - 1; // JS month starts with 0

      day = +match[3];

      if (!match[4]) {
        // no hour
        return new Date(Date.UTC(year, month, day));
      } // match: [4] hour [5] minute [6] second [7] fraction


      hour = +match[4];
      minute = +match[5];
      second = +match[6];

      if (match[7]) {
        fraction = match[7].slice(0, 3);

        while (fraction.length < 3) {
          // milli-seconds
          fraction += '0';
        }

        fraction = +fraction;
      } // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute


      if (match[9]) {
        tz_hour = +match[10];
        tz_minute = +(match[11] || 0);
        delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds

        if (match[9] === '-') delta = -delta;
      }

      date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
      if (delta) date.setTime(date.getTime() - delta);
      return date;
    }

    function representYamlTimestamp(object
    /*, style*/
    ) {
      return object.toISOString();
    }

    var timestamp = new type('tag:yaml.org,2002:timestamp', {
      kind: 'scalar',
      resolve: resolveYamlTimestamp,
      construct: constructYamlTimestamp,
      instanceOf: Date,
      represent: representYamlTimestamp
    });

    function resolveYamlMerge(data) {
      return data === '<<' || data === null;
    }

    var merge = new type('tag:yaml.org,2002:merge', {
      kind: 'scalar',
      resolve: resolveYamlMerge
    });

    function commonjsRequire (target) {
    	throw new Error('Could not dynamically require "' + target + '". Please configure the dynamicRequireTargets option of @rollup/plugin-commonjs appropriately for this require call to behave properly.');
    }

    /*eslint-disable no-bitwise*/


    var NodeBuffer;

    try {
      // A trick for browserified version, to not include `Buffer` shim
      var _require = commonjsRequire;
      NodeBuffer = _require('buffer').Buffer;
    } catch (__) {} // [ 64, 65, 66 ] -> [ padding, CR, LF ]


    var BASE64_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r';

    function resolveYamlBinary(data) {
      if (data === null) return false;
      var code,
          idx,
          bitlen = 0,
          max = data.length,
          map = BASE64_MAP; // Convert one by one.

      for (idx = 0; idx < max; idx++) {
        code = map.indexOf(data.charAt(idx)); // Skip CR/LF

        if (code > 64) continue; // Fail on illegal characters

        if (code < 0) return false;
        bitlen += 6;
      } // If there are any bits left, source was corrupted


      return bitlen % 8 === 0;
    }

    function constructYamlBinary(data) {
      var idx,
          tailbits,
          input = data.replace(/[\r\n=]/g, ''),
          // remove CR/LF & padding to simplify scan
      max = input.length,
          map = BASE64_MAP,
          bits = 0,
          result = []; // Collect by 6*4 bits (3 bytes)

      for (idx = 0; idx < max; idx++) {
        if (idx % 4 === 0 && idx) {
          result.push(bits >> 16 & 0xFF);
          result.push(bits >> 8 & 0xFF);
          result.push(bits & 0xFF);
        }

        bits = bits << 6 | map.indexOf(input.charAt(idx));
      } // Dump tail


      tailbits = max % 4 * 6;

      if (tailbits === 0) {
        result.push(bits >> 16 & 0xFF);
        result.push(bits >> 8 & 0xFF);
        result.push(bits & 0xFF);
      } else if (tailbits === 18) {
        result.push(bits >> 10 & 0xFF);
        result.push(bits >> 2 & 0xFF);
      } else if (tailbits === 12) {
        result.push(bits >> 4 & 0xFF);
      } // Wrap into Buffer for NodeJS and leave Array for browser


      if (NodeBuffer) {
        // Support node 6.+ Buffer API when available
        return NodeBuffer.from ? NodeBuffer.from(result) : new NodeBuffer(result);
      }

      return result;
    }

    function representYamlBinary(object
    /*, style*/
    ) {
      var result = '',
          bits = 0,
          idx,
          tail,
          max = object.length,
          map = BASE64_MAP; // Convert every three bytes to 4 ASCII characters.

      for (idx = 0; idx < max; idx++) {
        if (idx % 3 === 0 && idx) {
          result += map[bits >> 18 & 0x3F];
          result += map[bits >> 12 & 0x3F];
          result += map[bits >> 6 & 0x3F];
          result += map[bits & 0x3F];
        }

        bits = (bits << 8) + object[idx];
      } // Dump tail


      tail = max % 3;

      if (tail === 0) {
        result += map[bits >> 18 & 0x3F];
        result += map[bits >> 12 & 0x3F];
        result += map[bits >> 6 & 0x3F];
        result += map[bits & 0x3F];
      } else if (tail === 2) {
        result += map[bits >> 10 & 0x3F];
        result += map[bits >> 4 & 0x3F];
        result += map[bits << 2 & 0x3F];
        result += map[64];
      } else if (tail === 1) {
        result += map[bits >> 2 & 0x3F];
        result += map[bits << 4 & 0x3F];
        result += map[64];
        result += map[64];
      }

      return result;
    }

    function isBinary(object) {
      return NodeBuffer && NodeBuffer.isBuffer(object);
    }

    var binary = new type('tag:yaml.org,2002:binary', {
      kind: 'scalar',
      resolve: resolveYamlBinary,
      construct: constructYamlBinary,
      predicate: isBinary,
      represent: representYamlBinary
    });

    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var _toString = Object.prototype.toString;

    function resolveYamlOmap(data) {
      if (data === null) return true;
      var objectKeys = [],
          index,
          length,
          pair,
          pairKey,
          pairHasKey,
          object = data;

      for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];
        pairHasKey = false;
        if (_toString.call(pair) !== '[object Object]') return false;

        for (pairKey in pair) {
          if (_hasOwnProperty.call(pair, pairKey)) {
            if (!pairHasKey) pairHasKey = true;else return false;
          }
        }

        if (!pairHasKey) return false;
        if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);else return false;
      }

      return true;
    }

    function constructYamlOmap(data) {
      return data !== null ? data : [];
    }

    var omap = new type('tag:yaml.org,2002:omap', {
      kind: 'sequence',
      resolve: resolveYamlOmap,
      construct: constructYamlOmap
    });

    var _toString$1 = Object.prototype.toString;

    function resolveYamlPairs(data) {
      if (data === null) return true;
      var index,
          length,
          pair,
          keys,
          result,
          object = data;
      result = new Array(object.length);

      for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];
        if (_toString$1.call(pair) !== '[object Object]') return false;
        keys = Object.keys(pair);
        if (keys.length !== 1) return false;
        result[index] = [keys[0], pair[keys[0]]];
      }

      return true;
    }

    function constructYamlPairs(data) {
      if (data === null) return [];
      var index,
          length,
          pair,
          keys,
          result,
          object = data;
      result = new Array(object.length);

      for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];
        keys = Object.keys(pair);
        result[index] = [keys[0], pair[keys[0]]];
      }

      return result;
    }

    var pairs = new type('tag:yaml.org,2002:pairs', {
      kind: 'sequence',
      resolve: resolveYamlPairs,
      construct: constructYamlPairs
    });

    var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;

    function resolveYamlSet(data) {
      if (data === null) return true;
      var key,
          object = data;

      for (key in object) {
        if (_hasOwnProperty$1.call(object, key)) {
          if (object[key] !== null) return false;
        }
      }

      return true;
    }

    function constructYamlSet(data) {
      return data !== null ? data : {};
    }

    var set = new type('tag:yaml.org,2002:set', {
      kind: 'mapping',
      resolve: resolveYamlSet,
      construct: constructYamlSet
    });

    var default_safe = new schema({
      include: [core],
      implicit: [timestamp, merge],
      explicit: [binary, omap, pairs, set]
    });

    function resolveJavascriptUndefined() {
      return true;
    }

    function constructJavascriptUndefined() {
      /*eslint-disable no-undefined*/
      return undefined;
    }

    function representJavascriptUndefined() {
      return '';
    }

    function isUndefined(object) {
      return typeof object === 'undefined';
    }

    var _undefined = new type('tag:yaml.org,2002:js/undefined', {
      kind: 'scalar',
      resolve: resolveJavascriptUndefined,
      construct: constructJavascriptUndefined,
      predicate: isUndefined,
      represent: representJavascriptUndefined
    });

    function resolveJavascriptRegExp(data) {
      if (data === null) return false;
      if (data.length === 0) return false;
      var regexp = data,
          tail = /\/([gim]*)$/.exec(data),
          modifiers = ''; // if regexp starts with '/' it can have modifiers and must be properly closed
      // `/foo/gim` - modifiers tail can be maximum 3 chars

      if (regexp[0] === '/') {
        if (tail) modifiers = tail[1];
        if (modifiers.length > 3) return false; // if expression starts with /, is should be properly terminated

        if (regexp[regexp.length - modifiers.length - 1] !== '/') return false;
      }

      return true;
    }

    function constructJavascriptRegExp(data) {
      var regexp = data,
          tail = /\/([gim]*)$/.exec(data),
          modifiers = ''; // `/foo/gim` - tail can be maximum 4 chars

      if (regexp[0] === '/') {
        if (tail) modifiers = tail[1];
        regexp = regexp.slice(1, regexp.length - modifiers.length - 1);
      }

      return new RegExp(regexp, modifiers);
    }

    function representJavascriptRegExp(object
    /*, style*/
    ) {
      var result = '/' + object.source + '/';
      if (object.global) result += 'g';
      if (object.multiline) result += 'm';
      if (object.ignoreCase) result += 'i';
      return result;
    }

    function isRegExp(object) {
      return Object.prototype.toString.call(object) === '[object RegExp]';
    }

    var regexp = new type('tag:yaml.org,2002:js/regexp', {
      kind: 'scalar',
      resolve: resolveJavascriptRegExp,
      construct: constructJavascriptRegExp,
      predicate: isRegExp,
      represent: representJavascriptRegExp
    });

    var esprima; // Browserified version does not have esprima
    //
    // 1. For node.js just require module as deps
    // 2. For browser try to require mudule via external AMD system.
    //    If not found - try to fallback to window.esprima. If not
    //    found too - then fail to parse.
    //

    try {
      // workaround to exclude package from browserify list.
      var _require$1 = commonjsRequire;
      esprima = _require$1('esprima');
    } catch (_) {
      /* eslint-disable no-redeclare */

      /* global window */
      if (typeof window !== 'undefined') esprima = window.esprima;
    }

    function resolveJavascriptFunction(data) {
      if (data === null) return false;

      try {
        var source = '(' + data + ')',
            ast = esprima.parse(source, {
          range: true
        });

        if (ast.type !== 'Program' || ast.body.length !== 1 || ast.body[0].type !== 'ExpressionStatement' || ast.body[0].expression.type !== 'ArrowFunctionExpression' && ast.body[0].expression.type !== 'FunctionExpression') {
          return false;
        }

        return true;
      } catch (err) {
        return false;
      }
    }

    function constructJavascriptFunction(data) {
      /*jslint evil:true*/
      var source = '(' + data + ')',
          ast = esprima.parse(source, {
        range: true
      }),
          params = [],
          body;

      if (ast.type !== 'Program' || ast.body.length !== 1 || ast.body[0].type !== 'ExpressionStatement' || ast.body[0].expression.type !== 'ArrowFunctionExpression' && ast.body[0].expression.type !== 'FunctionExpression') {
        throw new Error('Failed to resolve function');
      }

      ast.body[0].expression.params.forEach(function (param) {
        params.push(param.name);
      });
      body = ast.body[0].expression.body.range; // Esprima's ranges include the first '{' and the last '}' characters on
      // function expressions. So cut them out.

      if (ast.body[0].expression.body.type === 'BlockStatement') {
        /*eslint-disable no-new-func*/
        return new Function(params, source.slice(body[0] + 1, body[1] - 1));
      } // ES6 arrow functions can omit the BlockStatement. In that case, just return
      // the body.

      /*eslint-disable no-new-func*/


      return new Function(params, 'return ' + source.slice(body[0], body[1]));
    }

    function representJavascriptFunction(object
    /*, style*/
    ) {
      return object.toString();
    }

    function isFunction(object) {
      return Object.prototype.toString.call(object) === '[object Function]';
    }

    var _function = new type('tag:yaml.org,2002:js/function', {
      kind: 'scalar',
      resolve: resolveJavascriptFunction,
      construct: constructJavascriptFunction,
      predicate: isFunction,
      represent: representJavascriptFunction
    });

    var default_full = schema.DEFAULT = new schema({
      include: [default_safe],
      explicit: [_undefined, regexp, _function]
    });

    /*eslint-disable max-len,no-use-before-define*/


    var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;
    var CONTEXT_FLOW_IN = 1;
    var CONTEXT_FLOW_OUT = 2;
    var CONTEXT_BLOCK_IN = 3;
    var CONTEXT_BLOCK_OUT = 4;
    var CHOMPING_CLIP = 1;
    var CHOMPING_STRIP = 2;
    var CHOMPING_KEEP = 3;
    var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
    var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
    var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
    var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
    var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;

    function _class(obj) {
      return Object.prototype.toString.call(obj);
    }

    function is_EOL(c) {
      return c === 0x0A
      /* LF */
      || c === 0x0D
      /* CR */
      ;
    }

    function is_WHITE_SPACE(c) {
      return c === 0x09
      /* Tab */
      || c === 0x20
      /* Space */
      ;
    }

    function is_WS_OR_EOL(c) {
      return c === 0x09
      /* Tab */
      || c === 0x20
      /* Space */
      || c === 0x0A
      /* LF */
      || c === 0x0D
      /* CR */
      ;
    }

    function is_FLOW_INDICATOR(c) {
      return c === 0x2C
      /* , */
      || c === 0x5B
      /* [ */
      || c === 0x5D
      /* ] */
      || c === 0x7B
      /* { */
      || c === 0x7D
      /* } */
      ;
    }

    function fromHexCode(c) {
      var lc;

      if (0x30
      /* 0 */
      <= c && c <= 0x39
      /* 9 */
      ) {
        return c - 0x30;
      }
      /*eslint-disable no-bitwise*/


      lc = c | 0x20;

      if (0x61
      /* a */
      <= lc && lc <= 0x66
      /* f */
      ) {
        return lc - 0x61 + 10;
      }

      return -1;
    }

    function escapedHexLen(c) {
      if (c === 0x78
      /* x */
      ) {
          return 2;
        }

      if (c === 0x75
      /* u */
      ) {
          return 4;
        }

      if (c === 0x55
      /* U */
      ) {
          return 8;
        }

      return 0;
    }

    function fromDecimalCode(c) {
      if (0x30
      /* 0 */
      <= c && c <= 0x39
      /* 9 */
      ) {
        return c - 0x30;
      }

      return -1;
    }

    function simpleEscapeSequence(c) {
      /* eslint-disable indent */
      return c === 0x30
      /* 0 */
      ? '\x00' : c === 0x61
      /* a */
      ? '\x07' : c === 0x62
      /* b */
      ? '\x08' : c === 0x74
      /* t */
      ? '\x09' : c === 0x09
      /* Tab */
      ? '\x09' : c === 0x6E
      /* n */
      ? '\x0A' : c === 0x76
      /* v */
      ? '\x0B' : c === 0x66
      /* f */
      ? '\x0C' : c === 0x72
      /* r */
      ? '\x0D' : c === 0x65
      /* e */
      ? '\x1B' : c === 0x20
      /* Space */
      ? ' ' : c === 0x22
      /* " */
      ? '\x22' : c === 0x2F
      /* / */
      ? '/' : c === 0x5C
      /* \ */
      ? '\x5C' : c === 0x4E
      /* N */
      ? '\x85' : c === 0x5F
      /* _ */
      ? '\xA0' : c === 0x4C
      /* L */
      ? "\u2028" : c === 0x50
      /* P */
      ? "\u2029" : '';
    }

    function charFromCodepoint(c) {
      if (c <= 0xFFFF) {
        return String.fromCharCode(c);
      } // Encode UTF-16 surrogate pair
      // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF


      return String.fromCharCode((c - 0x010000 >> 10) + 0xD800, (c - 0x010000 & 0x03FF) + 0xDC00);
    }

    var simpleEscapeCheck = new Array(256); // integer, for fast access

    var simpleEscapeMap = new Array(256);

    for (var i = 0; i < 256; i++) {
      simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
      simpleEscapeMap[i] = simpleEscapeSequence(i);
    }

    function State(input, options) {
      this.input = input;
      this.filename = options['filename'] || null;
      this.schema = options['schema'] || default_full;
      this.onWarning = options['onWarning'] || null;
      this.legacy = options['legacy'] || false;
      this.json = options['json'] || false;
      this.listener = options['listener'] || null;
      this.implicitTypes = this.schema.compiledImplicit;
      this.typeMap = this.schema.compiledTypeMap;
      this.length = input.length;
      this.position = 0;
      this.line = 0;
      this.lineStart = 0;
      this.lineIndent = 0;
      this.documents = [];
      /*
      this.version;
      this.checkLineBreaks;
      this.tagMap;
      this.anchorMap;
      this.tag;
      this.anchor;
      this.kind;
      this.result;*/
    }

    function generateError(state, message) {
      return new exception(message, new mark(state.filename, state.input, state.position, state.line, state.position - state.lineStart));
    }

    function throwError(state, message) {
      throw generateError(state, message);
    }

    function throwWarning(state, message) {
      if (state.onWarning) {
        state.onWarning.call(null, generateError(state, message));
      }
    }

    var directiveHandlers = {
      YAML: function handleYamlDirective(state, name, args) {
        var match, major, minor;

        if (state.version !== null) {
          throwError(state, 'duplication of %YAML directive');
        }

        if (args.length !== 1) {
          throwError(state, 'YAML directive accepts exactly one argument');
        }

        match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

        if (match === null) {
          throwError(state, 'ill-formed argument of the YAML directive');
        }

        major = parseInt(match[1], 10);
        minor = parseInt(match[2], 10);

        if (major !== 1) {
          throwError(state, 'unacceptable YAML version of the document');
        }

        state.version = args[0];
        state.checkLineBreaks = minor < 2;

        if (minor !== 1 && minor !== 2) {
          throwWarning(state, 'unsupported YAML version of the document');
        }
      },
      TAG: function handleTagDirective(state, name, args) {
        var handle, prefix;

        if (args.length !== 2) {
          throwError(state, 'TAG directive accepts exactly two arguments');
        }

        handle = args[0];
        prefix = args[1];

        if (!PATTERN_TAG_HANDLE.test(handle)) {
          throwError(state, 'ill-formed tag handle (first argument) of the TAG directive');
        }

        if (_hasOwnProperty$2.call(state.tagMap, handle)) {
          throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
        }

        if (!PATTERN_TAG_URI.test(prefix)) {
          throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive');
        }

        state.tagMap[handle] = prefix;
      }
    };

    function captureSegment(state, start, end, checkJson) {
      var _position, _length, _character, _result;

      if (start < end) {
        _result = state.input.slice(start, end);

        if (checkJson) {
          for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
            _character = _result.charCodeAt(_position);

            if (!(_character === 0x09 || 0x20 <= _character && _character <= 0x10FFFF)) {
              throwError(state, 'expected valid JSON character');
            }
          }
        } else if (PATTERN_NON_PRINTABLE.test(_result)) {
          throwError(state, 'the stream contains non-printable characters');
        }

        state.result += _result;
      }
    }

    function mergeMappings(state, destination, source, overridableKeys) {
      var sourceKeys, key, index, quantity;

      if (!common.isObject(source)) {
        throwError(state, 'cannot merge mappings; the provided source object is unacceptable');
      }

      sourceKeys = Object.keys(source);

      for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
        key = sourceKeys[index];

        if (!_hasOwnProperty$2.call(destination, key)) {
          destination[key] = source[key];
          overridableKeys[key] = true;
        }
      }
    }

    function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startPos) {
      var index, quantity; // The output is a plain object here, so keys can only be strings.
      // We need to convert keyNode to a string, but doing so can hang the process
      // (deeply nested arrays that explode exponentially using aliases).

      if (Array.isArray(keyNode)) {
        keyNode = Array.prototype.slice.call(keyNode);

        for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
          if (Array.isArray(keyNode[index])) {
            throwError(state, 'nested arrays are not supported inside keys');
          }

          if (typeof keyNode === 'object' && _class(keyNode[index]) === '[object Object]') {
            keyNode[index] = '[object Object]';
          }
        }
      } // Avoid code execution in load() via toString property
      // (still use its own toString for arrays, timestamps,
      // and whatever user schema extensions happen to have @@toStringTag)


      if (typeof keyNode === 'object' && _class(keyNode) === '[object Object]') {
        keyNode = '[object Object]';
      }

      keyNode = String(keyNode);

      if (_result === null) {
        _result = {};
      }

      if (keyTag === 'tag:yaml.org,2002:merge') {
        if (Array.isArray(valueNode)) {
          for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
            mergeMappings(state, _result, valueNode[index], overridableKeys);
          }
        } else {
          mergeMappings(state, _result, valueNode, overridableKeys);
        }
      } else {
        if (!state.json && !_hasOwnProperty$2.call(overridableKeys, keyNode) && _hasOwnProperty$2.call(_result, keyNode)) {
          state.line = startLine || state.line;
          state.position = startPos || state.position;
          throwError(state, 'duplicated mapping key');
        }

        _result[keyNode] = valueNode;
        delete overridableKeys[keyNode];
      }

      return _result;
    }

    function readLineBreak(state) {
      var ch;
      ch = state.input.charCodeAt(state.position);

      if (ch === 0x0A
      /* LF */
      ) {
          state.position++;
        } else if (ch === 0x0D
      /* CR */
      ) {
          state.position++;

          if (state.input.charCodeAt(state.position) === 0x0A
          /* LF */
          ) {
              state.position++;
            }
        } else {
        throwError(state, 'a line break is expected');
      }

      state.line += 1;
      state.lineStart = state.position;
    }

    function skipSeparationSpace(state, allowComments, checkIndent) {
      var lineBreaks = 0,
          ch = state.input.charCodeAt(state.position);

      while (ch !== 0) {
        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }

        if (allowComments && ch === 0x23
        /* # */
        ) {
            do {
              ch = state.input.charCodeAt(++state.position);
            } while (ch !== 0x0A
            /* LF */
            && ch !== 0x0D
            /* CR */
            && ch !== 0);
          }

        if (is_EOL(ch)) {
          readLineBreak(state);
          ch = state.input.charCodeAt(state.position);
          lineBreaks++;
          state.lineIndent = 0;

          while (ch === 0x20
          /* Space */
          ) {
            state.lineIndent++;
            ch = state.input.charCodeAt(++state.position);
          }
        } else {
          break;
        }
      }

      if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
        throwWarning(state, 'deficient indentation');
      }

      return lineBreaks;
    }

    function testDocumentSeparator(state) {
      var _position = state.position,
          ch;
      ch = state.input.charCodeAt(_position); // Condition state.position === state.lineStart is tested
      // in parent on each call, for efficiency. No needs to test here again.

      if ((ch === 0x2D
      /* - */
      || ch === 0x2E
      /* . */
      ) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
        _position += 3;
        ch = state.input.charCodeAt(_position);

        if (ch === 0 || is_WS_OR_EOL(ch)) {
          return true;
        }
      }

      return false;
    }

    function writeFoldedLines(state, count) {
      if (count === 1) {
        state.result += ' ';
      } else if (count > 1) {
        state.result += common.repeat('\n', count - 1);
      }
    }

    function readPlainScalar(state, nodeIndent, withinFlowCollection) {
      var preceding,
          following,
          captureStart,
          captureEnd,
          hasPendingContent,
          _line,
          _lineStart,
          _lineIndent,
          _kind = state.kind,
          _result = state.result,
          ch;

      ch = state.input.charCodeAt(state.position);

      if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 0x23
      /* # */
      || ch === 0x26
      /* & */
      || ch === 0x2A
      /* * */
      || ch === 0x21
      /* ! */
      || ch === 0x7C
      /* | */
      || ch === 0x3E
      /* > */
      || ch === 0x27
      /* ' */
      || ch === 0x22
      /* " */
      || ch === 0x25
      /* % */
      || ch === 0x40
      /* @ */
      || ch === 0x60
      /* ` */
      ) {
          return false;
        }

      if (ch === 0x3F
      /* ? */
      || ch === 0x2D
      /* - */
      ) {
          following = state.input.charCodeAt(state.position + 1);

          if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
            return false;
          }
        }

      state.kind = 'scalar';
      state.result = '';
      captureStart = captureEnd = state.position;
      hasPendingContent = false;

      while (ch !== 0) {
        if (ch === 0x3A
        /* : */
        ) {
            following = state.input.charCodeAt(state.position + 1);

            if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
              break;
            }
          } else if (ch === 0x23
        /* # */
        ) {
            preceding = state.input.charCodeAt(state.position - 1);

            if (is_WS_OR_EOL(preceding)) {
              break;
            }
          } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
          break;
        } else if (is_EOL(ch)) {
          _line = state.line;
          _lineStart = state.lineStart;
          _lineIndent = state.lineIndent;
          skipSeparationSpace(state, false, -1);

          if (state.lineIndent >= nodeIndent) {
            hasPendingContent = true;
            ch = state.input.charCodeAt(state.position);
            continue;
          } else {
            state.position = captureEnd;
            state.line = _line;
            state.lineStart = _lineStart;
            state.lineIndent = _lineIndent;
            break;
          }
        }

        if (hasPendingContent) {
          captureSegment(state, captureStart, captureEnd, false);
          writeFoldedLines(state, state.line - _line);
          captureStart = captureEnd = state.position;
          hasPendingContent = false;
        }

        if (!is_WHITE_SPACE(ch)) {
          captureEnd = state.position + 1;
        }

        ch = state.input.charCodeAt(++state.position);
      }

      captureSegment(state, captureStart, captureEnd, false);

      if (state.result) {
        return true;
      }

      state.kind = _kind;
      state.result = _result;
      return false;
    }

    function readSingleQuotedScalar(state, nodeIndent) {
      var ch, captureStart, captureEnd;
      ch = state.input.charCodeAt(state.position);

      if (ch !== 0x27
      /* ' */
      ) {
          return false;
        }

      state.kind = 'scalar';
      state.result = '';
      state.position++;
      captureStart = captureEnd = state.position;

      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 0x27
        /* ' */
        ) {
            captureSegment(state, captureStart, state.position, true);
            ch = state.input.charCodeAt(++state.position);

            if (ch === 0x27
            /* ' */
            ) {
                captureStart = state.position;
                state.position++;
                captureEnd = state.position;
              } else {
              return true;
            }
          } else if (is_EOL(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, 'unexpected end of the document within a single quoted scalar');
        } else {
          state.position++;
          captureEnd = state.position;
        }
      }

      throwError(state, 'unexpected end of the stream within a single quoted scalar');
    }

    function readDoubleQuotedScalar(state, nodeIndent) {
      var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
      ch = state.input.charCodeAt(state.position);

      if (ch !== 0x22
      /* " */
      ) {
          return false;
        }

      state.kind = 'scalar';
      state.result = '';
      state.position++;
      captureStart = captureEnd = state.position;

      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 0x22
        /* " */
        ) {
            captureSegment(state, captureStart, state.position, true);
            state.position++;
            return true;
          } else if (ch === 0x5C
        /* \ */
        ) {
            captureSegment(state, captureStart, state.position, true);
            ch = state.input.charCodeAt(++state.position);

            if (is_EOL(ch)) {
              skipSeparationSpace(state, false, nodeIndent); // TODO: rework to inline fn with no type cast?
            } else if (ch < 256 && simpleEscapeCheck[ch]) {
              state.result += simpleEscapeMap[ch];
              state.position++;
            } else if ((tmp = escapedHexLen(ch)) > 0) {
              hexLength = tmp;
              hexResult = 0;

              for (; hexLength > 0; hexLength--) {
                ch = state.input.charCodeAt(++state.position);

                if ((tmp = fromHexCode(ch)) >= 0) {
                  hexResult = (hexResult << 4) + tmp;
                } else {
                  throwError(state, 'expected hexadecimal character');
                }
              }

              state.result += charFromCodepoint(hexResult);
              state.position++;
            } else {
              throwError(state, 'unknown escape sequence');
            }

            captureStart = captureEnd = state.position;
          } else if (is_EOL(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, 'unexpected end of the document within a double quoted scalar');
        } else {
          state.position++;
          captureEnd = state.position;
        }
      }

      throwError(state, 'unexpected end of the stream within a double quoted scalar');
    }

    function readFlowCollection(state, nodeIndent) {
      var readNext = true,
          _line,
          _tag = state.tag,
          _result,
          _anchor = state.anchor,
          following,
          terminator,
          isPair,
          isExplicitPair,
          isMapping,
          overridableKeys = {},
          keyNode,
          keyTag,
          valueNode,
          ch;

      ch = state.input.charCodeAt(state.position);

      if (ch === 0x5B
      /* [ */
      ) {
          terminator = 0x5D;
          /* ] */

          isMapping = false;
          _result = [];
        } else if (ch === 0x7B
      /* { */
      ) {
          terminator = 0x7D;
          /* } */

          isMapping = true;
          _result = {};
        } else {
        return false;
      }

      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }

      ch = state.input.charCodeAt(++state.position);

      while (ch !== 0) {
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);

        if (ch === terminator) {
          state.position++;
          state.tag = _tag;
          state.anchor = _anchor;
          state.kind = isMapping ? 'mapping' : 'sequence';
          state.result = _result;
          return true;
        } else if (!readNext) {
          throwError(state, 'missed comma between flow collection entries');
        }

        keyTag = keyNode = valueNode = null;
        isPair = isExplicitPair = false;

        if (ch === 0x3F
        /* ? */
        ) {
            following = state.input.charCodeAt(state.position + 1);

            if (is_WS_OR_EOL(following)) {
              isPair = isExplicitPair = true;
              state.position++;
              skipSeparationSpace(state, true, nodeIndent);
            }
          }

        _line = state.line;
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        keyTag = state.tag;
        keyNode = state.result;
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);

        if ((isExplicitPair || state.line === _line) && ch === 0x3A
        /* : */
        ) {
            isPair = true;
            ch = state.input.charCodeAt(++state.position);
            skipSeparationSpace(state, true, nodeIndent);
            composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
            valueNode = state.result;
          }

        if (isMapping) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode);
        } else if (isPair) {
          _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode));
        } else {
          _result.push(keyNode);
        }

        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);

        if (ch === 0x2C
        /* , */
        ) {
            readNext = true;
            ch = state.input.charCodeAt(++state.position);
          } else {
          readNext = false;
        }
      }

      throwError(state, 'unexpected end of the stream within a flow collection');
    }

    function readBlockScalar(state, nodeIndent) {
      var captureStart,
          folding,
          chomping = CHOMPING_CLIP,
          didReadContent = false,
          detectedIndent = false,
          textIndent = nodeIndent,
          emptyLines = 0,
          atMoreIndented = false,
          tmp,
          ch;
      ch = state.input.charCodeAt(state.position);

      if (ch === 0x7C
      /* | */
      ) {
          folding = false;
        } else if (ch === 0x3E
      /* > */
      ) {
          folding = true;
        } else {
        return false;
      }

      state.kind = 'scalar';
      state.result = '';

      while (ch !== 0) {
        ch = state.input.charCodeAt(++state.position);

        if (ch === 0x2B
        /* + */
        || ch === 0x2D
        /* - */
        ) {
            if (CHOMPING_CLIP === chomping) {
              chomping = ch === 0x2B
              /* + */
              ? CHOMPING_KEEP : CHOMPING_STRIP;
            } else {
              throwError(state, 'repeat of a chomping mode identifier');
            }
          } else if ((tmp = fromDecimalCode(ch)) >= 0) {
          if (tmp === 0) {
            throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one');
          } else if (!detectedIndent) {
            textIndent = nodeIndent + tmp - 1;
            detectedIndent = true;
          } else {
            throwError(state, 'repeat of an indentation width identifier');
          }
        } else {
          break;
        }
      }

      if (is_WHITE_SPACE(ch)) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (is_WHITE_SPACE(ch));

        if (ch === 0x23
        /* # */
        ) {
            do {
              ch = state.input.charCodeAt(++state.position);
            } while (!is_EOL(ch) && ch !== 0);
          }
      }

      while (ch !== 0) {
        readLineBreak(state);
        state.lineIndent = 0;
        ch = state.input.charCodeAt(state.position);

        while ((!detectedIndent || state.lineIndent < textIndent) && ch === 0x20
        /* Space */
        ) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }

        if (!detectedIndent && state.lineIndent > textIndent) {
          textIndent = state.lineIndent;
        }

        if (is_EOL(ch)) {
          emptyLines++;
          continue;
        } // End of the scalar.


        if (state.lineIndent < textIndent) {
          // Perform the chomping.
          if (chomping === CHOMPING_KEEP) {
            state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
          } else if (chomping === CHOMPING_CLIP) {
            if (didReadContent) {
              // i.e. only if the scalar is not empty.
              state.result += '\n';
            }
          } // Break this `while` cycle and go to the funciton's epilogue.


          break;
        } // Folded style: use fancy rules to handle line breaks.


        if (folding) {
          // Lines starting with white space characters (more-indented lines) are not folded.
          if (is_WHITE_SPACE(ch)) {
            atMoreIndented = true; // except for the first content line (cf. Example 8.1)

            state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines); // End of more-indented block.
          } else if (atMoreIndented) {
            atMoreIndented = false;
            state.result += common.repeat('\n', emptyLines + 1); // Just one line break - perceive as the same line.
          } else if (emptyLines === 0) {
            if (didReadContent) {
              // i.e. only if we have already read some scalar content.
              state.result += ' ';
            } // Several line breaks - perceive as different lines.

          } else {
            state.result += common.repeat('\n', emptyLines);
          } // Literal style: just add exact number of line breaks between content lines.

        } else {
          // Keep all line breaks except the header line break.
          state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
        }

        didReadContent = true;
        detectedIndent = true;
        emptyLines = 0;
        captureStart = state.position;

        while (!is_EOL(ch) && ch !== 0) {
          ch = state.input.charCodeAt(++state.position);
        }

        captureSegment(state, captureStart, state.position, false);
      }

      return true;
    }

    function readBlockSequence(state, nodeIndent) {
      var _line,
          _tag = state.tag,
          _anchor = state.anchor,
          _result = [],
          following,
          detected = false,
          ch;

      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }

      ch = state.input.charCodeAt(state.position);

      while (ch !== 0) {
        if (ch !== 0x2D
        /* - */
        ) {
            break;
          }

        following = state.input.charCodeAt(state.position + 1);

        if (!is_WS_OR_EOL(following)) {
          break;
        }

        detected = true;
        state.position++;

        if (skipSeparationSpace(state, true, -1)) {
          if (state.lineIndent <= nodeIndent) {
            _result.push(null);

            ch = state.input.charCodeAt(state.position);
            continue;
          }
        }

        _line = state.line;
        composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);

        _result.push(state.result);

        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);

        if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
          throwError(state, 'bad indentation of a sequence entry');
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      }

      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = 'sequence';
        state.result = _result;
        return true;
      }

      return false;
    }

    function readBlockMapping(state, nodeIndent, flowIndent) {
      var following,
          allowCompact,
          _line,
          _pos,
          _tag = state.tag,
          _anchor = state.anchor,
          _result = {},
          overridableKeys = {},
          keyTag = null,
          keyNode = null,
          valueNode = null,
          atExplicitKey = false,
          detected = false,
          ch;

      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }

      ch = state.input.charCodeAt(state.position);

      while (ch !== 0) {
        following = state.input.charCodeAt(state.position + 1);
        _line = state.line; // Save the current line.

        _pos = state.position; //
        // Explicit notation case. There are two separate blocks:
        // first for the key (denoted by "?") and second for the value (denoted by ":")
        //

        if ((ch === 0x3F
        /* ? */
        || ch === 0x3A
        /* : */
        ) && is_WS_OR_EOL(following)) {
          if (ch === 0x3F
          /* ? */
          ) {
              if (atExplicitKey) {
                storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
                keyTag = keyNode = valueNode = null;
              }

              detected = true;
              atExplicitKey = true;
              allowCompact = true;
            } else if (atExplicitKey) {
            // i.e. 0x3A/* : */ === character after the explicit key.
            atExplicitKey = false;
            allowCompact = true;
          } else {
            throwError(state, 'incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line');
          }

          state.position += 1;
          ch = following; //
          // Implicit notation case. Flow-style node as the key first, then ":", and the value.
          //
        } else if (composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
          if (state.line === _line) {
            ch = state.input.charCodeAt(state.position);

            while (is_WHITE_SPACE(ch)) {
              ch = state.input.charCodeAt(++state.position);
            }

            if (ch === 0x3A
            /* : */
            ) {
                ch = state.input.charCodeAt(++state.position);

                if (!is_WS_OR_EOL(ch)) {
                  throwError(state, 'a whitespace character is expected after the key-value separator within a block mapping');
                }

                if (atExplicitKey) {
                  storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
                  keyTag = keyNode = valueNode = null;
                }

                detected = true;
                atExplicitKey = false;
                allowCompact = false;
                keyTag = state.tag;
                keyNode = state.result;
              } else if (detected) {
              throwError(state, 'can not read an implicit mapping pair; a colon is missed');
            } else {
              state.tag = _tag;
              state.anchor = _anchor;
              return true; // Keep the result of `composeNode`.
            }
          } else if (detected) {
            throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key');
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true; // Keep the result of `composeNode`.
          }
        } else {
            break; // Reading is done. Go to the epilogue.
          } //
        // Common reading code for both explicit and implicit notations.
        //


        if (state.line === _line || state.lineIndent > nodeIndent) {
          if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
            if (atExplicitKey) {
              keyNode = state.result;
            } else {
              valueNode = state.result;
            }
          }

          if (!atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _pos);
            keyTag = keyNode = valueNode = null;
          }

          skipSeparationSpace(state, true, -1);
          ch = state.input.charCodeAt(state.position);
        }

        if (state.lineIndent > nodeIndent && ch !== 0) {
          throwError(state, 'bad indentation of a mapping entry');
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      } //
      // Epilogue.
      //
      // Special case: last mapping's node contains only the key in explicit notation.


      if (atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
      } // Expose the resulting mapping.


      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = 'mapping';
        state.result = _result;
      }

      return detected;
    }

    function readTagProperty(state) {
      var _position,
          isVerbatim = false,
          isNamed = false,
          tagHandle,
          tagName,
          ch;

      ch = state.input.charCodeAt(state.position);
      if (ch !== 0x21
      /* ! */
      ) return false;

      if (state.tag !== null) {
        throwError(state, 'duplication of a tag property');
      }

      ch = state.input.charCodeAt(++state.position);

      if (ch === 0x3C
      /* < */
      ) {
          isVerbatim = true;
          ch = state.input.charCodeAt(++state.position);
        } else if (ch === 0x21
      /* ! */
      ) {
          isNamed = true;
          tagHandle = '!!';
          ch = state.input.charCodeAt(++state.position);
        } else {
        tagHandle = '!';
      }

      _position = state.position;

      if (isVerbatim) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && ch !== 0x3E
        /* > */
        );

        if (state.position < state.length) {
          tagName = state.input.slice(_position, state.position);
          ch = state.input.charCodeAt(++state.position);
        } else {
          throwError(state, 'unexpected end of the stream within a verbatim tag');
        }
      } else {
        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          if (ch === 0x21
          /* ! */
          ) {
              if (!isNamed) {
                tagHandle = state.input.slice(_position - 1, state.position + 1);

                if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
                  throwError(state, 'named tag handle cannot contain such characters');
                }

                isNamed = true;
                _position = state.position + 1;
              } else {
                throwError(state, 'tag suffix cannot contain exclamation marks');
              }
            }

          ch = state.input.charCodeAt(++state.position);
        }

        tagName = state.input.slice(_position, state.position);

        if (PATTERN_FLOW_INDICATORS.test(tagName)) {
          throwError(state, 'tag suffix cannot contain flow indicator characters');
        }
      }

      if (tagName && !PATTERN_TAG_URI.test(tagName)) {
        throwError(state, 'tag name cannot contain such characters: ' + tagName);
      }

      if (isVerbatim) {
        state.tag = tagName;
      } else if (_hasOwnProperty$2.call(state.tagMap, tagHandle)) {
        state.tag = state.tagMap[tagHandle] + tagName;
      } else if (tagHandle === '!') {
        state.tag = '!' + tagName;
      } else if (tagHandle === '!!') {
        state.tag = 'tag:yaml.org,2002:' + tagName;
      } else {
        throwError(state, 'undeclared tag handle "' + tagHandle + '"');
      }

      return true;
    }

    function readAnchorProperty(state) {
      var _position, ch;

      ch = state.input.charCodeAt(state.position);
      if (ch !== 0x26
      /* & */
      ) return false;

      if (state.anchor !== null) {
        throwError(state, 'duplication of an anchor property');
      }

      ch = state.input.charCodeAt(++state.position);
      _position = state.position;

      while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      if (state.position === _position) {
        throwError(state, 'name of an anchor node must contain at least one character');
      }

      state.anchor = state.input.slice(_position, state.position);
      return true;
    }

    function readAlias(state) {
      var _position, alias, ch;

      ch = state.input.charCodeAt(state.position);
      if (ch !== 0x2A
      /* * */
      ) return false;
      ch = state.input.charCodeAt(++state.position);
      _position = state.position;

      while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      if (state.position === _position) {
        throwError(state, 'name of an alias node must contain at least one character');
      }

      alias = state.input.slice(_position, state.position);

      if (!_hasOwnProperty$2.call(state.anchorMap, alias)) {
        throwError(state, 'unidentified alias "' + alias + '"');
      }

      state.result = state.anchorMap[alias];
      skipSeparationSpace(state, true, -1);
      return true;
    }

    function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
      var allowBlockStyles,
          allowBlockScalars,
          allowBlockCollections,
          indentStatus = 1,
          // 1: this>parent, 0: this=parent, -1: this<parent
      atNewLine = false,
          hasContent = false,
          typeIndex,
          typeQuantity,
          type,
          flowIndent,
          blockIndent;

      if (state.listener !== null) {
        state.listener('open', state);
      }

      state.tag = null;
      state.anchor = null;
      state.kind = null;
      state.result = null;
      allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;

      if (allowToSeek) {
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;

          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        }
      }

      if (indentStatus === 1) {
        while (readTagProperty(state) || readAnchorProperty(state)) {
          if (skipSeparationSpace(state, true, -1)) {
            atNewLine = true;
            allowBlockCollections = allowBlockStyles;

            if (state.lineIndent > parentIndent) {
              indentStatus = 1;
            } else if (state.lineIndent === parentIndent) {
              indentStatus = 0;
            } else if (state.lineIndent < parentIndent) {
              indentStatus = -1;
            }
          } else {
            allowBlockCollections = false;
          }
        }
      }

      if (allowBlockCollections) {
        allowBlockCollections = atNewLine || allowCompact;
      }

      if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
        if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
          flowIndent = parentIndent;
        } else {
          flowIndent = parentIndent + 1;
        }

        blockIndent = state.position - state.lineStart;

        if (indentStatus === 1) {
          if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
            hasContent = true;
          } else {
            if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
              hasContent = true;
            } else if (readAlias(state)) {
              hasContent = true;

              if (state.tag !== null || state.anchor !== null) {
                throwError(state, 'alias node should not have any properties');
              }
            } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
              hasContent = true;

              if (state.tag === null) {
                state.tag = '?';
              }
            }

            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
          }
        } else if (indentStatus === 0) {
          // Special case: block sequences are allowed to have same indentation level as the parent.
          // http://www.yaml.org/spec/1.2/spec.html#id2799784
          hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
        }
      }

      if (state.tag !== null && state.tag !== '!') {
        if (state.tag === '?') {
          // Implicit resolving is not allowed for non-scalar types, and '?'
          // non-specific tag is only automatically assigned to plain scalars.
          //
          // We only need to check kind conformity in case user explicitly assigns '?'
          // tag, for example like this: "!<?> [0]"
          //
          if (state.result !== null && state.kind !== 'scalar') {
            throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
          }

          for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
            type = state.implicitTypes[typeIndex];

            if (type.resolve(state.result)) {
              // `state.result` updated in resolver if matched
              state.result = type.construct(state.result);
              state.tag = type.tag;

              if (state.anchor !== null) {
                state.anchorMap[state.anchor] = state.result;
              }

              break;
            }
          }
        } else if (_hasOwnProperty$2.call(state.typeMap[state.kind || 'fallback'], state.tag)) {
          type = state.typeMap[state.kind || 'fallback'][state.tag];

          if (state.result !== null && type.kind !== state.kind) {
            throwError(state, 'unacceptable node kind for !<' + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
          }

          if (!type.resolve(state.result)) {
            // `state.result` updated in resolver if matched
            throwError(state, 'cannot resolve a node with !<' + state.tag + '> explicit tag');
          } else {
            state.result = type.construct(state.result);

            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
          }
        } else {
          throwError(state, 'unknown tag !<' + state.tag + '>');
        }
      }

      if (state.listener !== null) {
        state.listener('close', state);
      }

      return state.tag !== null || state.anchor !== null || hasContent;
    }

    function readDocument(state) {
      var documentStart = state.position,
          _position,
          directiveName,
          directiveArgs,
          hasDirectives = false,
          ch;

      state.version = null;
      state.checkLineBreaks = state.legacy;
      state.tagMap = {};
      state.anchorMap = {};

      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);

        if (state.lineIndent > 0 || ch !== 0x25
        /* % */
        ) {
            break;
          }

        hasDirectives = true;
        ch = state.input.charCodeAt(++state.position);
        _position = state.position;

        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }

        directiveName = state.input.slice(_position, state.position);
        directiveArgs = [];

        if (directiveName.length < 1) {
          throwError(state, 'directive name must not be less than one character in length');
        }

        while (ch !== 0) {
          while (is_WHITE_SPACE(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }

          if (ch === 0x23
          /* # */
          ) {
              do {
                ch = state.input.charCodeAt(++state.position);
              } while (ch !== 0 && !is_EOL(ch));

              break;
            }

          if (is_EOL(ch)) break;
          _position = state.position;

          while (ch !== 0 && !is_WS_OR_EOL(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }

          directiveArgs.push(state.input.slice(_position, state.position));
        }

        if (ch !== 0) readLineBreak(state);

        if (_hasOwnProperty$2.call(directiveHandlers, directiveName)) {
          directiveHandlers[directiveName](state, directiveName, directiveArgs);
        } else {
          throwWarning(state, 'unknown document directive "' + directiveName + '"');
        }
      }

      skipSeparationSpace(state, true, -1);

      if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 0x2D
      /* - */
      && state.input.charCodeAt(state.position + 1) === 0x2D
      /* - */
      && state.input.charCodeAt(state.position + 2) === 0x2D
      /* - */
      ) {
          state.position += 3;
          skipSeparationSpace(state, true, -1);
        } else if (hasDirectives) {
        throwError(state, 'directives end mark is expected');
      }

      composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
      skipSeparationSpace(state, true, -1);

      if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
        throwWarning(state, 'non-ASCII line breaks are interpreted as content');
      }

      state.documents.push(state.result);

      if (state.position === state.lineStart && testDocumentSeparator(state)) {
        if (state.input.charCodeAt(state.position) === 0x2E
        /* . */
        ) {
            state.position += 3;
            skipSeparationSpace(state, true, -1);
          }

        return;
      }

      if (state.position < state.length - 1) {
        throwError(state, 'end of the stream or a document separator is expected');
      } else {
        return;
      }
    }

    function loadDocuments(input, options) {
      input = String(input);
      options = options || {};

      if (input.length !== 0) {
        // Add tailing `\n` if not exists
        if (input.charCodeAt(input.length - 1) !== 0x0A
        /* LF */
        && input.charCodeAt(input.length - 1) !== 0x0D
        /* CR */
        ) {
            input += '\n';
          } // Strip BOM


        if (input.charCodeAt(0) === 0xFEFF) {
          input = input.slice(1);
        }
      }

      var state = new State(input, options);
      var nullpos = input.indexOf('\0');

      if (nullpos !== -1) {
        state.position = nullpos;
        throwError(state, 'null byte is not allowed in input');
      } // Use 0 as string terminator. That significantly simplifies bounds check.


      state.input += '\0';

      while (state.input.charCodeAt(state.position) === 0x20
      /* Space */
      ) {
        state.lineIndent += 1;
        state.position += 1;
      }

      while (state.position < state.length - 1) {
        readDocument(state);
      }

      return state.documents;
    }

    function loadAll(input, iterator, options) {
      if (iterator !== null && typeof iterator === 'object' && typeof options === 'undefined') {
        options = iterator;
        iterator = null;
      }

      var documents = loadDocuments(input, options);

      if (typeof iterator !== 'function') {
        return documents;
      }

      for (var index = 0, length = documents.length; index < length; index += 1) {
        iterator(documents[index]);
      }
    }

    function load(input, options) {
      var documents = loadDocuments(input, options);

      if (documents.length === 0) {
        /*eslint-disable no-undefined*/
        return undefined;
      } else if (documents.length === 1) {
        return documents[0];
      }

      throw new exception('expected a single document in the stream, but found more');
    }

    function safeLoadAll(input, iterator, options) {
      if (typeof iterator === 'object' && iterator !== null && typeof options === 'undefined') {
        options = iterator;
        iterator = null;
      }

      return loadAll(input, iterator, common.extend({
        schema: default_safe
      }, options));
    }

    function safeLoad(input, options) {
      return load(input, common.extend({
        schema: default_safe
      }, options));
    }

    var loadAll_1 = loadAll;
    var load_1 = load;
    var safeLoadAll_1 = safeLoadAll;
    var safeLoad_1 = safeLoad;
    var loader = {
      loadAll: loadAll_1,
      load: load_1,
      safeLoadAll: safeLoadAll_1,
      safeLoad: safeLoad_1
    };

    /*eslint-disable no-use-before-define*/


    var _toString$2 = Object.prototype.toString;
    var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
    var CHAR_TAB = 0x09;
    /* Tab */

    var CHAR_LINE_FEED = 0x0A;
    /* LF */

    var CHAR_CARRIAGE_RETURN = 0x0D;
    /* CR */

    var CHAR_SPACE = 0x20;
    /* Space */

    var CHAR_EXCLAMATION = 0x21;
    /* ! */

    var CHAR_DOUBLE_QUOTE = 0x22;
    /* " */

    var CHAR_SHARP = 0x23;
    /* # */

    var CHAR_PERCENT = 0x25;
    /* % */

    var CHAR_AMPERSAND = 0x26;
    /* & */

    var CHAR_SINGLE_QUOTE = 0x27;
    /* ' */

    var CHAR_ASTERISK = 0x2A;
    /* * */

    var CHAR_COMMA = 0x2C;
    /* , */

    var CHAR_MINUS = 0x2D;
    /* - */

    var CHAR_COLON = 0x3A;
    /* : */

    var CHAR_EQUALS = 0x3D;
    /* = */

    var CHAR_GREATER_THAN = 0x3E;
    /* > */

    var CHAR_QUESTION = 0x3F;
    /* ? */

    var CHAR_COMMERCIAL_AT = 0x40;
    /* @ */

    var CHAR_LEFT_SQUARE_BRACKET = 0x5B;
    /* [ */

    var CHAR_RIGHT_SQUARE_BRACKET = 0x5D;
    /* ] */

    var CHAR_GRAVE_ACCENT = 0x60;
    /* ` */

    var CHAR_LEFT_CURLY_BRACKET = 0x7B;
    /* { */

    var CHAR_VERTICAL_LINE = 0x7C;
    /* | */

    var CHAR_RIGHT_CURLY_BRACKET = 0x7D;
    /* } */

    var ESCAPE_SEQUENCES = {};
    ESCAPE_SEQUENCES[0x00] = '\\0';
    ESCAPE_SEQUENCES[0x07] = '\\a';
    ESCAPE_SEQUENCES[0x08] = '\\b';
    ESCAPE_SEQUENCES[0x09] = '\\t';
    ESCAPE_SEQUENCES[0x0A] = '\\n';
    ESCAPE_SEQUENCES[0x0B] = '\\v';
    ESCAPE_SEQUENCES[0x0C] = '\\f';
    ESCAPE_SEQUENCES[0x0D] = '\\r';
    ESCAPE_SEQUENCES[0x1B] = '\\e';
    ESCAPE_SEQUENCES[0x22] = '\\"';
    ESCAPE_SEQUENCES[0x5C] = '\\\\';
    ESCAPE_SEQUENCES[0x85] = '\\N';
    ESCAPE_SEQUENCES[0xA0] = '\\_';
    ESCAPE_SEQUENCES[0x2028] = '\\L';
    ESCAPE_SEQUENCES[0x2029] = '\\P';
    var DEPRECATED_BOOLEANS_SYNTAX = ['y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON', 'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'];

    function compileStyleMap(schema, map) {
      var result, keys, index, length, tag, style, type;
      if (map === null) return {};
      result = {};
      keys = Object.keys(map);

      for (index = 0, length = keys.length; index < length; index += 1) {
        tag = keys[index];
        style = String(map[tag]);

        if (tag.slice(0, 2) === '!!') {
          tag = 'tag:yaml.org,2002:' + tag.slice(2);
        }

        type = schema.compiledTypeMap['fallback'][tag];

        if (type && _hasOwnProperty$3.call(type.styleAliases, style)) {
          style = type.styleAliases[style];
        }

        result[tag] = style;
      }

      return result;
    }

    function encodeHex(character) {
      var string, handle, length;
      string = character.toString(16).toUpperCase();

      if (character <= 0xFF) {
        handle = 'x';
        length = 2;
      } else if (character <= 0xFFFF) {
        handle = 'u';
        length = 4;
      } else if (character <= 0xFFFFFFFF) {
        handle = 'U';
        length = 8;
      } else {
        throw new exception('code point within a string may not be greater than 0xFFFFFFFF');
      }

      return '\\' + handle + common.repeat('0', length - string.length) + string;
    }

    function State$1(options) {
      this.schema = options['schema'] || default_full;
      this.indent = Math.max(1, options['indent'] || 2);
      this.noArrayIndent = options['noArrayIndent'] || false;
      this.skipInvalid = options['skipInvalid'] || false;
      this.flowLevel = common.isNothing(options['flowLevel']) ? -1 : options['flowLevel'];
      this.styleMap = compileStyleMap(this.schema, options['styles'] || null);
      this.sortKeys = options['sortKeys'] || false;
      this.lineWidth = options['lineWidth'] || 80;
      this.noRefs = options['noRefs'] || false;
      this.noCompatMode = options['noCompatMode'] || false;
      this.condenseFlow = options['condenseFlow'] || false;
      this.implicitTypes = this.schema.compiledImplicit;
      this.explicitTypes = this.schema.compiledExplicit;
      this.tag = null;
      this.result = '';
      this.duplicates = [];
      this.usedDuplicates = null;
    } // Indents every line in a string. Empty lines (\n only) are not indented.


    function indentString(string, spaces) {
      var ind = common.repeat(' ', spaces),
          position = 0,
          next = -1,
          result = '',
          line,
          length = string.length;

      while (position < length) {
        next = string.indexOf('\n', position);

        if (next === -1) {
          line = string.slice(position);
          position = length;
        } else {
          line = string.slice(position, next + 1);
          position = next + 1;
        }

        if (line.length && line !== '\n') result += ind;
        result += line;
      }

      return result;
    }

    function generateNextLine(state, level) {
      return '\n' + common.repeat(' ', state.indent * level);
    }

    function testImplicitResolving(state, str) {
      var index, length, type;

      for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
        type = state.implicitTypes[index];

        if (type.resolve(str)) {
          return true;
        }
      }

      return false;
    } // [33] s-white ::= s-space | s-tab


    function isWhitespace(c) {
      return c === CHAR_SPACE || c === CHAR_TAB;
    } // Returns true if the character can be printed without escaping.
    // From YAML 1.2: "any allowed characters known to be non-printable
    // should also be escaped. [However,] This isn’t mandatory"
    // Derived from nb-char - \t - #x85 - #xA0 - #x2028 - #x2029.


    function isPrintable(c) {
      return 0x00020 <= c && c <= 0x00007E || 0x000A1 <= c && c <= 0x00D7FF && c !== 0x2028 && c !== 0x2029 || 0x0E000 <= c && c <= 0x00FFFD && c !== 0xFEFF
      /* BOM */
      || 0x10000 <= c && c <= 0x10FFFF;
    } // [34] ns-char ::= nb-char - s-white
    // [27] nb-char ::= c-printable - b-char - c-byte-order-mark
    // [26] b-char  ::= b-line-feed | b-carriage-return
    // [24] b-line-feed       ::=     #xA    /* LF */
    // [25] b-carriage-return ::=     #xD    /* CR */
    // [3]  c-byte-order-mark ::=     #xFEFF


    function isNsChar(c) {
      return isPrintable(c) && !isWhitespace(c) // byte-order-mark
      && c !== 0xFEFF // b-char
      && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
    } // Simplified test for values allowed after the first character in plain style.


    function isPlainSafe(c, prev) {
      // Uses a subset of nb-char - c-flow-indicator - ":" - "#"
      // where nb-char ::= c-printable - b-char - c-byte-order-mark.
      return isPrintable(c) && c !== 0xFEFF // - c-flow-indicator
      && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET // - ":" - "#"
      // /* An ns-char preceding */ "#"
      && c !== CHAR_COLON && (c !== CHAR_SHARP || prev && isNsChar(prev));
    } // Simplified test for values allowed as the first character in plain style.


    function isPlainSafeFirst(c) {
      // Uses a subset of ns-char - c-indicator
      // where ns-char = nb-char - s-white.
      return isPrintable(c) && c !== 0xFEFF && !isWhitespace(c) // - s-white
      // - (c-indicator ::=
      // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
      && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
      && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE // | “%” | “@” | “`”)
      && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
    } // Determines whether block indentation indicator is required.


    function needIndentIndicator(string) {
      var leadingSpaceRe = /^\n* /;
      return leadingSpaceRe.test(string);
    }

    var STYLE_PLAIN = 1,
        STYLE_SINGLE = 2,
        STYLE_LITERAL = 3,
        STYLE_FOLDED = 4,
        STYLE_DOUBLE = 5; // Determines which scalar styles are possible and returns the preferred style.
    // lineWidth = -1 => no limit.
    // Pre-conditions: str.length > 0.
    // Post-conditions:
    //    STYLE_PLAIN or STYLE_SINGLE => no \n are in the string.
    //    STYLE_LITERAL => no lines are suitable for folding (or lineWidth is -1).
    //    STYLE_FOLDED => a line > lineWidth and can be folded (and lineWidth != -1).

    function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType) {
      var i;
      var char, prev_char;
      var hasLineBreak = false;
      var hasFoldableLine = false; // only checked if shouldTrackWidth

      var shouldTrackWidth = lineWidth !== -1;
      var previousLineBreak = -1; // count the first line correctly

      var plain = isPlainSafeFirst(string.charCodeAt(0)) && !isWhitespace(string.charCodeAt(string.length - 1));

      if (singleLineOnly) {
        // Case: no block styles.
        // Check for disallowed characters to rule out plain and single.
        for (i = 0; i < string.length; i++) {
          char = string.charCodeAt(i);

          if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }

          prev_char = i > 0 ? string.charCodeAt(i - 1) : null;
          plain = plain && isPlainSafe(char, prev_char);
        }
      } else {
        // Case: block styles permitted.
        for (i = 0; i < string.length; i++) {
          char = string.charCodeAt(i);

          if (char === CHAR_LINE_FEED) {
            hasLineBreak = true; // Check if any line can be folded.

            if (shouldTrackWidth) {
              hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
              i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== ' ';
              previousLineBreak = i;
            }
          } else if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }

          prev_char = i > 0 ? string.charCodeAt(i - 1) : null;
          plain = plain && isPlainSafe(char, prev_char);
        } // in case the end is missing a \n


        hasFoldableLine = hasFoldableLine || shouldTrackWidth && i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== ' ';
      } // Although every style can represent \n without escaping, prefer block styles
      // for multiline, since they're more readable and they don't add empty lines.
      // Also prefer folding a super-long line.


      if (!hasLineBreak && !hasFoldableLine) {
        // Strings interpretable as another type have to be quoted;
        // e.g. the string 'true' vs. the boolean true.
        return plain && !testAmbiguousType(string) ? STYLE_PLAIN : STYLE_SINGLE;
      } // Edge case: block indentation indicator can only have one digit.


      if (indentPerLevel > 9 && needIndentIndicator(string)) {
        return STYLE_DOUBLE;
      } // At this point we know block styles are valid.
      // Prefer literal style unless we want to fold.


      return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
    } // Note: line breaking/folding is implemented for only the folded style.
    // NB. We drop the last trailing newline (if any) of a returned block scalar
    //  since the dumper adds its own newline. This always works:
    //    • No ending newline => unaffected; already using strip "-" chomping.
    //    • Ending newline    => removed then restored.
    //  Importantly, this keeps the "+" chomp indicator from gaining an extra line.


    function writeScalar(state, string, level, iskey) {
      state.dump = function () {
        if (string.length === 0) {
          return "''";
        }

        if (!state.noCompatMode && DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1) {
          return "'" + string + "'";
        }

        var indent = state.indent * Math.max(1, level); // no 0-indent scalars
        // As indentation gets deeper, let the width decrease monotonically
        // to the lower bound min(state.lineWidth, 40).
        // Note that this implies
        //  state.lineWidth ≤ 40 + state.indent: width is fixed at the lower bound.
        //  state.lineWidth > 40 + state.indent: width decreases until the lower bound.
        // This behaves better than a constant minimum width which disallows narrower options,
        // or an indent threshold which causes the width to suddenly increase.

        var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent); // Without knowing if keys are implicit/explicit, assume implicit for safety.

        var singleLineOnly = iskey // No block styles in flow mode.
        || state.flowLevel > -1 && level >= state.flowLevel;

        function testAmbiguity(string) {
          return testImplicitResolving(state, string);
        }

        switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity)) {
          case STYLE_PLAIN:
            return string;

          case STYLE_SINGLE:
            return "'" + string.replace(/'/g, "''") + "'";

          case STYLE_LITERAL:
            return '|' + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));

          case STYLE_FOLDED:
            return '>' + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));

          case STYLE_DOUBLE:
            return '"' + escapeString(string) + '"';

          default:
            throw new exception('impossible error: invalid scalar style');
        }
      }();
    } // Pre-conditions: string is valid for a block scalar, 1 <= indentPerLevel <= 9.


    function blockHeader(string, indentPerLevel) {
      var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : ''; // note the special case: the string '\n' counts as a "trailing" empty line.

      var clip = string[string.length - 1] === '\n';
      var keep = clip && (string[string.length - 2] === '\n' || string === '\n');
      var chomp = keep ? '+' : clip ? '' : '-';
      return indentIndicator + chomp + '\n';
    } // (See the note for writeScalar.)


    function dropEndingNewline(string) {
      return string[string.length - 1] === '\n' ? string.slice(0, -1) : string;
    } // Note: a long line without a suitable break point will exceed the width limit.
    // Pre-conditions: every char in str isPrintable, str.length > 0, width > 0.


    function foldString(string, width) {
      // In folded style, $k$ consecutive newlines output as $k+1$ newlines—
      // unless they're before or after a more-indented line, or at the very
      // beginning or end, in which case $k$ maps to $k$.
      // Therefore, parse each chunk as newline(s) followed by a content line.
      var lineRe = /(\n+)([^\n]*)/g; // first line (possibly an empty line)

      var result = function () {
        var nextLF = string.indexOf('\n');
        nextLF = nextLF !== -1 ? nextLF : string.length;
        lineRe.lastIndex = nextLF;
        return foldLine(string.slice(0, nextLF), width);
      }(); // If we haven't reached the first content line yet, don't add an extra \n.


      var prevMoreIndented = string[0] === '\n' || string[0] === ' ';
      var moreIndented; // rest of the lines

      var match;

      while (match = lineRe.exec(string)) {
        var prefix = match[1],
            line = match[2];
        moreIndented = line[0] === ' ';
        result += prefix + (!prevMoreIndented && !moreIndented && line !== '' ? '\n' : '') + foldLine(line, width);
        prevMoreIndented = moreIndented;
      }

      return result;
    } // Greedy line breaking.
    // Picks the longest line under the limit each time,
    // otherwise settles for the shortest line over the limit.
    // NB. More-indented lines *cannot* be folded, as that would add an extra \n.


    function foldLine(line, width) {
      if (line === '' || line[0] === ' ') return line; // Since a more-indented line adds a \n, breaks can't be followed by a space.

      var breakRe = / [^ ]/g; // note: the match index will always be <= length-2.

      var match; // start is an inclusive index. end, curr, and next are exclusive.

      var start = 0,
          end,
          curr = 0,
          next = 0;
      var result = ''; // Invariants: 0 <= start <= length-1.
      //   0 <= curr <= next <= max(0, length-2). curr - start <= width.
      // Inside the loop:
      //   A match implies length >= 2, so curr and next are <= length-2.

      while (match = breakRe.exec(line)) {
        next = match.index; // maintain invariant: curr - start <= width

        if (next - start > width) {
          end = curr > start ? curr : next; // derive end <= length-2

          result += '\n' + line.slice(start, end); // skip the space that was output as \n

          start = end + 1; // derive start <= length-1
        }

        curr = next;
      } // By the invariants, start <= length-1, so there is something left over.
      // It is either the whole string or a part starting from non-whitespace.


      result += '\n'; // Insert a break if the remainder is too long and there is a break available.

      if (line.length - start > width && curr > start) {
        result += line.slice(start, curr) + '\n' + line.slice(curr + 1);
      } else {
        result += line.slice(start);
      }

      return result.slice(1); // drop extra \n joiner
    } // Escapes a double-quoted string.


    function escapeString(string) {
      var result = '';
      var char, nextChar;
      var escapeSeq;

      for (var i = 0; i < string.length; i++) {
        char = string.charCodeAt(i); // Check for surrogate pairs (reference Unicode 3.0 section "3.7 Surrogates").

        if (char >= 0xD800 && char <= 0xDBFF
        /* high surrogate */
        ) {
            nextChar = string.charCodeAt(i + 1);

            if (nextChar >= 0xDC00 && nextChar <= 0xDFFF
            /* low surrogate */
            ) {
                // Combine the surrogate pair and store it escaped.
                result += encodeHex((char - 0xD800) * 0x400 + nextChar - 0xDC00 + 0x10000); // Advance index one extra since we already used that char here.

                i++;
                continue;
              }
          }

        escapeSeq = ESCAPE_SEQUENCES[char];
        result += !escapeSeq && isPrintable(char) ? string[i] : escapeSeq || encodeHex(char);
      }

      return result;
    }

    function writeFlowSequence(state, level, object) {
      var _result = '',
          _tag = state.tag,
          index,
          length;

      for (index = 0, length = object.length; index < length; index += 1) {
        // Write only valid elements.
        if (writeNode(state, level, object[index], false, false)) {
          if (index !== 0) _result += ',' + (!state.condenseFlow ? ' ' : '');
          _result += state.dump;
        }
      }

      state.tag = _tag;
      state.dump = '[' + _result + ']';
    }

    function writeBlockSequence(state, level, object, compact) {
      var _result = '',
          _tag = state.tag,
          index,
          length;

      for (index = 0, length = object.length; index < length; index += 1) {
        // Write only valid elements.
        if (writeNode(state, level + 1, object[index], true, true)) {
          if (!compact || index !== 0) {
            _result += generateNextLine(state, level);
          }

          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            _result += '-';
          } else {
            _result += '- ';
          }

          _result += state.dump;
        }
      }

      state.tag = _tag;
      state.dump = _result || '[]'; // Empty sequence if no valid values.
    }

    function writeFlowMapping(state, level, object) {
      var _result = '',
          _tag = state.tag,
          objectKeyList = Object.keys(object),
          index,
          length,
          objectKey,
          objectValue,
          pairBuffer;

      for (index = 0, length = objectKeyList.length; index < length; index += 1) {
        pairBuffer = '';
        if (index !== 0) pairBuffer += ', ';
        if (state.condenseFlow) pairBuffer += '"';
        objectKey = objectKeyList[index];
        objectValue = object[objectKey];

        if (!writeNode(state, level, objectKey, false, false)) {
          continue; // Skip this pair because of invalid key;
        }

        if (state.dump.length > 1024) pairBuffer += '? ';
        pairBuffer += state.dump + (state.condenseFlow ? '"' : '') + ':' + (state.condenseFlow ? '' : ' ');

        if (!writeNode(state, level, objectValue, false, false)) {
          continue; // Skip this pair because of invalid value.
        }

        pairBuffer += state.dump; // Both key and value are valid.

        _result += pairBuffer;
      }

      state.tag = _tag;
      state.dump = '{' + _result + '}';
    }

    function writeBlockMapping(state, level, object, compact) {
      var _result = '',
          _tag = state.tag,
          objectKeyList = Object.keys(object),
          index,
          length,
          objectKey,
          objectValue,
          explicitPair,
          pairBuffer; // Allow sorting keys so that the output file is deterministic

      if (state.sortKeys === true) {
        // Default sorting
        objectKeyList.sort();
      } else if (typeof state.sortKeys === 'function') {
        // Custom sort function
        objectKeyList.sort(state.sortKeys);
      } else if (state.sortKeys) {
        // Something is wrong
        throw new exception('sortKeys must be a boolean or a function');
      }

      for (index = 0, length = objectKeyList.length; index < length; index += 1) {
        pairBuffer = '';

        if (!compact || index !== 0) {
          pairBuffer += generateNextLine(state, level);
        }

        objectKey = objectKeyList[index];
        objectValue = object[objectKey];

        if (!writeNode(state, level + 1, objectKey, true, true, true)) {
          continue; // Skip this pair because of invalid key.
        }

        explicitPair = state.tag !== null && state.tag !== '?' || state.dump && state.dump.length > 1024;

        if (explicitPair) {
          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            pairBuffer += '?';
          } else {
            pairBuffer += '? ';
          }
        }

        pairBuffer += state.dump;

        if (explicitPair) {
          pairBuffer += generateNextLine(state, level);
        }

        if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
          continue; // Skip this pair because of invalid value.
        }

        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += ':';
        } else {
          pairBuffer += ': ';
        }

        pairBuffer += state.dump; // Both key and value are valid.

        _result += pairBuffer;
      }

      state.tag = _tag;
      state.dump = _result || '{}'; // Empty mapping if no valid pairs.
    }

    function detectType(state, object, explicit) {
      var _result, typeList, index, length, type, style;

      typeList = explicit ? state.explicitTypes : state.implicitTypes;

      for (index = 0, length = typeList.length; index < length; index += 1) {
        type = typeList[index];

        if ((type.instanceOf || type.predicate) && (!type.instanceOf || typeof object === 'object' && object instanceof type.instanceOf) && (!type.predicate || type.predicate(object))) {
          state.tag = explicit ? type.tag : '?';

          if (type.represent) {
            style = state.styleMap[type.tag] || type.defaultStyle;

            if (_toString$2.call(type.represent) === '[object Function]') {
              _result = type.represent(object, style);
            } else if (_hasOwnProperty$3.call(type.represent, style)) {
              _result = type.represent[style](object, style);
            } else {
              throw new exception('!<' + type.tag + '> tag resolver accepts not "' + style + '" style');
            }

            state.dump = _result;
          }

          return true;
        }
      }

      return false;
    } // Serializes `object` and writes it to global `result`.
    // Returns true on success, or false on invalid object.
    //


    function writeNode(state, level, object, block, compact, iskey) {
      state.tag = null;
      state.dump = object;

      if (!detectType(state, object, false)) {
        detectType(state, object, true);
      }

      var type = _toString$2.call(state.dump);

      if (block) {
        block = state.flowLevel < 0 || state.flowLevel > level;
      }

      var objectOrArray = type === '[object Object]' || type === '[object Array]',
          duplicateIndex,
          duplicate;

      if (objectOrArray) {
        duplicateIndex = state.duplicates.indexOf(object);
        duplicate = duplicateIndex !== -1;
      }

      if (state.tag !== null && state.tag !== '?' || duplicate || state.indent !== 2 && level > 0) {
        compact = false;
      }

      if (duplicate && state.usedDuplicates[duplicateIndex]) {
        state.dump = '*ref_' + duplicateIndex;
      } else {
        if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
          state.usedDuplicates[duplicateIndex] = true;
        }

        if (type === '[object Object]') {
          if (block && Object.keys(state.dump).length !== 0) {
            writeBlockMapping(state, level, state.dump, compact);

            if (duplicate) {
              state.dump = '&ref_' + duplicateIndex + state.dump;
            }
          } else {
            writeFlowMapping(state, level, state.dump);

            if (duplicate) {
              state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
            }
          }
        } else if (type === '[object Array]') {
          var arrayLevel = state.noArrayIndent && level > 0 ? level - 1 : level;

          if (block && state.dump.length !== 0) {
            writeBlockSequence(state, arrayLevel, state.dump, compact);

            if (duplicate) {
              state.dump = '&ref_' + duplicateIndex + state.dump;
            }
          } else {
            writeFlowSequence(state, arrayLevel, state.dump);

            if (duplicate) {
              state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
            }
          }
        } else if (type === '[object String]') {
          if (state.tag !== '?') {
            writeScalar(state, state.dump, level, iskey);
          }
        } else {
          if (state.skipInvalid) return false;
          throw new exception('unacceptable kind of an object to dump ' + type);
        }

        if (state.tag !== null && state.tag !== '?') {
          state.dump = '!<' + state.tag + '> ' + state.dump;
        }
      }

      return true;
    }

    function getDuplicateReferences(object, state) {
      var objects = [],
          duplicatesIndexes = [],
          index,
          length;
      inspectNode(object, objects, duplicatesIndexes);

      for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
        state.duplicates.push(objects[duplicatesIndexes[index]]);
      }

      state.usedDuplicates = new Array(length);
    }

    function inspectNode(object, objects, duplicatesIndexes) {
      var objectKeyList, index, length;

      if (object !== null && typeof object === 'object') {
        index = objects.indexOf(object);

        if (index !== -1) {
          if (duplicatesIndexes.indexOf(index) === -1) {
            duplicatesIndexes.push(index);
          }
        } else {
          objects.push(object);

          if (Array.isArray(object)) {
            for (index = 0, length = object.length; index < length; index += 1) {
              inspectNode(object[index], objects, duplicatesIndexes);
            }
          } else {
            objectKeyList = Object.keys(object);

            for (index = 0, length = objectKeyList.length; index < length; index += 1) {
              inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
            }
          }
        }
      }
    }

    function dump(input, options) {
      options = options || {};
      var state = new State$1(options);
      if (!state.noRefs) getDuplicateReferences(input, state);
      if (writeNode(state, 0, input, true, true)) return state.dump + '\n';
      return '';
    }

    function safeDump(input, options) {
      return dump(input, common.extend({
        schema: default_safe
      }, options));
    }

    var dump_1 = dump;
    var safeDump_1 = safeDump;
    var dumper = {
      dump: dump_1,
      safeDump: safeDump_1
    };

    function deprecated(name) {
      return function () {
        throw new Error('Function ' + name + ' is deprecated and cannot be used.');
      };
    }

    var Type$1 = type;
    var Schema$1 = schema;
    var FAILSAFE_SCHEMA = failsafe;
    var JSON_SCHEMA = json;
    var CORE_SCHEMA = core;
    var DEFAULT_SAFE_SCHEMA = default_safe;
    var DEFAULT_FULL_SCHEMA = default_full;
    var load$1 = loader.load;
    var loadAll$1 = loader.loadAll;
    var safeLoad$1 = loader.safeLoad;
    var safeLoadAll$1 = loader.safeLoadAll;
    var dump$1 = dumper.dump;
    var safeDump$1 = dumper.safeDump;
    var YAMLException$1 = exception; // Deprecated schema names from JS-YAML 2.0.x

    var MINIMAL_SCHEMA = failsafe;
    var SAFE_SCHEMA = default_safe;
    var DEFAULT_SCHEMA = default_full; // Deprecated functions from JS-YAML 1.x.x

    var scan = deprecated('scan');
    var parse = deprecated('parse');
    var compose = deprecated('compose');
    var addConstructor = deprecated('addConstructor');
    var jsYaml = {
      Type: Type$1,
      Schema: Schema$1,
      FAILSAFE_SCHEMA: FAILSAFE_SCHEMA,
      JSON_SCHEMA: JSON_SCHEMA,
      CORE_SCHEMA: CORE_SCHEMA,
      DEFAULT_SAFE_SCHEMA: DEFAULT_SAFE_SCHEMA,
      DEFAULT_FULL_SCHEMA: DEFAULT_FULL_SCHEMA,
      load: load$1,
      loadAll: loadAll$1,
      safeLoad: safeLoad$1,
      safeLoadAll: safeLoadAll$1,
      dump: dump$1,
      safeDump: safeDump$1,
      YAMLException: YAMLException$1,
      MINIMAL_SCHEMA: MINIMAL_SCHEMA,
      SAFE_SCHEMA: SAFE_SCHEMA,
      DEFAULT_SCHEMA: DEFAULT_SCHEMA,
      scan: scan,
      parse: parse,
      compose: compose,
      addConstructor: addConstructor
    };

    var jsYaml$1 = jsYaml;

    function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
    /**
     * Redirect - object used to redirect some requests
     * e.g.
     * {
     *      title: 1x1-transparent.gif
     *      comment: http://probablyprogramming.com/2009/03/15/the-tiniest-gif-ever
     *      contentType: image/gif;base64
     *      content: R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
     * }
     * @typedef {Object} Redirect
     * @property {string} title
     * @property {string} comment
     * @property {string} content
     * @property {string} contentType
     */

    var Redirects = /*#__PURE__*/function () {
      /**
       * Converts rawYaml into JS object with sources titles used as keys
       * @param rawYaml
       * @returns {Object<Redirect>} - return object with titles in the keys and RedirectSources
       * in the values
       */
      function Redirects(rawYaml) {
        classCallCheck(this, Redirects);

        try {
          var arrOfRedirects = jsYaml$1.safeLoad(rawYaml);
          this.redirects = arrOfRedirects.reduce(function (acc, redirect) {
            return _objectSpread(_objectSpread({}, acc), {}, defineProperty({}, redirect.title, redirect));
          }, {});
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log("Was unable to load YAML into JS due to: ".concat(e.message));
          throw e;
        }
      }
      /**
       * Returns redirect source object
       * @param {string} title
       * @return {Redirect}
       */


      createClass(Redirects, [{
        key: "getRedirect",
        value: function getRedirect(title) {
          var _this = this;

          if (Object.prototype.hasOwnProperty.call(this.redirects, title)) {
            return this.redirects[title];
          } // look title among aliases


          var values = Object.keys(this.redirects).map(function (key) {
            return _this.redirects[key];
          });
          return values.find(function (redirect) {
            var aliases = redirect.aliases;

            if (!aliases) {
              return false;
            }

            return aliases.indexOf(title) > -1;
          });
        }
      }]);

      return Redirects;
    }();

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
      Redirects: Redirects,
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
