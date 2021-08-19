/*! extended-css - v1.3.13 - Thu Jul 29 2021
* https://github.com/AdguardTeam/ExtendedCss
* Copyright (c) 2021 AdGuard. Licensed GPL-3.0
*/
var ExtendedCss = (function () {
  'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
  }

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

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  /**
   * Copyright 2016 Adguard Software Ltd
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  /* eslint-disable no-console */
  var utils = {};
  utils.MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  /**
   * Stores native Node textContent getter to be used for contains pseudo-class
   * because elements' 'textContent' and 'innerText' properties might be mocked
   * https://github.com/AdguardTeam/ExtendedCss/issues/127
   */

  utils.nodeTextContentGetter = function () {
    var nativeNode = window.Node || Node;
    return Object.getOwnPropertyDescriptor(nativeNode.prototype, 'textContent').get;
  }();

  utils.isSafariBrowser = function () {
    var isChrome = navigator.userAgent.indexOf('Chrome') > -1;
    var isSafari = navigator.userAgent.indexOf('Safari') > -1;

    if (isSafari) {
      if (isChrome) {
        // Chrome seems to have both Chrome and Safari userAgents
        return false;
      }

      return true;
    }

    return false;
  }();
  /**
   * Converts regular expressions passed as pseudo class arguments into RegExp instances.
   * Have to unescape doublequote " as well, because we escape them while enclosing such
   * arguments with doublequotes, and sizzle does not automatically unescapes them.
   */


  utils.pseudoArgToRegex = function (regexSrc, flag) {
    flag = flag || 'i';
    regexSrc = regexSrc.trim().replace(/\\(["\\])/g, '$1');
    return new RegExp(regexSrc, flag);
  };
  /**
   * Converts string to the regexp
   * @param {string} str
   * @returns {RegExp}
   */


  utils.toRegExp = function (str) {
    if (str[0] === '/' && str[str.length - 1] === '/') {
      return new RegExp(str.slice(1, -1));
    }

    var escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped);
  };

  utils.startsWith = function (str, prefix) {
    // if str === '', (str && false) will return ''
    // that's why it has to be !!str
    return !!str && str.indexOf(prefix) === 0;
  };

  utils.endsWith = function (str, postfix) {
    if (!str || !postfix) {
      return false;
    }

    if (str.endsWith) {
      return str.endsWith(postfix);
    }

    var t = String(postfix);
    var index = str.lastIndexOf(t);
    return index >= 0 && index === str.length - t.length;
  };
  /**
   * Helper function for creating regular expression from a url filter rule syntax.
   */


  utils.createURLRegex = function () {
    // Constants
    var regexConfiguration = {
      maskStartUrl: '||',
      maskPipe: '|',
      maskSeparator: '^',
      maskAnySymbol: '*',
      regexAnySymbol: '.*',
      regexSeparator: '([^ a-zA-Z0-9.%_-]|$)',
      regexStartUrl: '^(http|https|ws|wss)://([a-z0-9-_.]+\\.)?',
      regexStartString: '^',
      regexEndString: '$'
    }; // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/regexp
    // should be escaped . * + ? ^ $ { } ( ) | [ ] / \
    // except of * | ^

    var specials = ['.', '+', '?', '$', '{', '}', '(', ')', '[', ']', '\\', '/'];
    var specialsRegex = new RegExp("[".concat(specials.join('\\'), "]"), 'g');
    /**
     * Escapes regular expression string
     */

    var escapeRegExp = function escapeRegExp(str) {
      return str.replace(specialsRegex, '\\$&');
    };

    var replaceAll = function replaceAll(str, find, replace) {
      if (!str) {
        return str;
      }

      return str.split(find).join(replace);
    };
    /**
     * Main function that converts a url filter rule string to a regex.
     * @param {string} str
     * @return {RegExp}
     */


    var createRegexText = function createRegexText(str) {
      var regex = escapeRegExp(str);

      if (utils.startsWith(regex, regexConfiguration.maskStartUrl)) {
        regex = regex.substring(0, regexConfiguration.maskStartUrl.length) + replaceAll(regex.substring(regexConfiguration.maskStartUrl.length, regex.length - 1), '\|', '\\|') + regex.substring(regex.length - 1);
      } else if (utils.startsWith(regex, regexConfiguration.maskPipe)) {
        regex = regex.substring(0, regexConfiguration.maskPipe.length) + replaceAll(regex.substring(regexConfiguration.maskPipe.length, regex.length - 1), '\|', '\\|') + regex.substring(regex.length - 1);
      } else {
        regex = replaceAll(regex.substring(0, regex.length - 1), '\|', '\\|') + regex.substring(regex.length - 1);
      } // Replacing special url masks


      regex = replaceAll(regex, regexConfiguration.maskAnySymbol, regexConfiguration.regexAnySymbol);
      regex = replaceAll(regex, regexConfiguration.maskSeparator, regexConfiguration.regexSeparator);

      if (utils.startsWith(regex, regexConfiguration.maskStartUrl)) {
        regex = regexConfiguration.regexStartUrl + regex.substring(regexConfiguration.maskStartUrl.length);
      } else if (utils.startsWith(regex, regexConfiguration.maskPipe)) {
        regex = regexConfiguration.regexStartString + regex.substring(regexConfiguration.maskPipe.length);
      }

      if (utils.endsWith(regex, regexConfiguration.maskPipe)) {
        regex = regex.substring(0, regex.length - 1) + regexConfiguration.regexEndString;
      }

      return new RegExp(regex, 'i');
    };

    return createRegexText;
  }();
  /**
   * Creates an object implementing Location interface from a url.
   * An alternative to URL.
   * https://github.com/AdguardTeam/FingerprintingBlocker/blob/master/src/shared/url.ts#L64
   */


  utils.createLocation = function (href) {
    var anchor = document.createElement('a');
    anchor.href = href;

    if (anchor.host === '') {
      anchor.href = anchor.href; // eslint-disable-line no-self-assign
    }

    return anchor;
  };
  /**
   * Checks whether A has the same origin as B.
   * @param {string} urlA location.href of A.
   * @param {Location} locationB location of B.
   * @param {string} domainB document.domain of B.
   * @return {boolean}
   */


  utils.isSameOrigin = function (urlA, locationB, domainB) {
    var locationA = utils.createLocation(urlA); // eslint-disable-next-line no-script-url

    if (locationA.protocol === 'javascript:' || locationA.href === 'about:blank') {
      return true;
    }

    if (locationA.protocol === 'data:' || locationA.protocol === 'file:') {
      return false;
    }

    return locationA.hostname === domainB && locationA.port === locationB.port && locationA.protocol === locationB.protocol;
  };
  /**
   * A helper class to throttle function calls with setTimeout and requestAnimationFrame.
   */


  utils.AsyncWrapper = function () {
    /**
     * PhantomJS passes a wrong timestamp to the requestAnimationFrame callback and that breaks the AsyncWrapper logic
     * https://github.com/ariya/phantomjs/issues/14832
     */
    var supported = typeof window.requestAnimationFrame !== 'undefined' && !/phantom/i.test(navigator.userAgent);
    var rAF = supported ? requestAnimationFrame : setTimeout;
    var cAF = supported ? cancelAnimationFrame : clearTimeout;
    var perf = supported ? performance : Date;
    /**
     * @param {Function} callback
     * @param {number} throttle number, the provided callback should be executed twice
     * in this time frame.
     * @constructor
     */

    function AsyncWrapper(callback, throttle) {
      this.callback = callback;
      this.throttle = throttle;
      this.wrappedCallback = this.wrappedCallback.bind(this);

      if (this.wrappedAsapCallback) {
        this.wrappedAsapCallback = this.wrappedAsapCallback.bind(this);
      }
    }
    /** @private */


    AsyncWrapper.prototype.wrappedCallback = function (ts) {
      this.lastRun = isNumber(ts) ? ts : perf.now();
      delete this.rAFid;
      delete this.timerId;
      delete this.asapScheduled;
      this.callback();
    };
    /** @private Indicates whether there is a scheduled callback. */


    AsyncWrapper.prototype.hasPendingCallback = function () {
      return isNumber(this.rAFid) || isNumber(this.timerId);
    };
    /**
     * Schedules a function call before the next animation frame.
     */


    AsyncWrapper.prototype.run = function () {
      if (this.hasPendingCallback()) {
        // There is a pending execution scheduled.
        return;
      }

      if (typeof this.lastRun !== 'undefined') {
        var elapsed = perf.now() - this.lastRun;

        if (elapsed < this.throttle) {
          this.timerId = setTimeout(this.wrappedCallback, this.throttle - elapsed);
          return;
        }
      }

      this.rAFid = rAF(this.wrappedCallback);
    };
    /**
     * Schedules a function call in the most immenent microtask.
     * This cannot be canceled.
     */


    AsyncWrapper.prototype.runAsap = function () {
      if (this.asapScheduled) {
        return;
      }

      this.asapScheduled = true;
      cAF(this.rAFid);
      clearTimeout(this.timerId);

      if (utils.MutationObserver) {
        /**
         * Using MutationObservers to access microtask queue is a standard technique,
         * used in ASAP library
         * {@link https://github.com/kriskowal/asap/blob/master/browser-raw.js#L140}
         */
        if (!this.mo) {
          this.mo = new utils.MutationObserver(this.wrappedCallback);
          this.node = document.createTextNode(1);
          this.mo.observe(this.node, {
            characterData: true
          });
        }

        this.node.nodeValue = -this.node.nodeValue;
      } else {
        setTimeout(this.wrappedCallback);
      }
    };
    /**
     * Runs scheduled execution immediately, if there were any.
     */


    AsyncWrapper.prototype.runImmediately = function () {
      if (this.hasPendingCallback()) {
        cAF(this.rAFid);
        clearTimeout(this.timerId);
        delete this.rAFid;
        delete this.timerId;
        this.wrappedCallback();
      }
    };

    AsyncWrapper.now = function () {
      return perf.now();
    };

    return AsyncWrapper;
  }();
  /**
   * Stores native OdP to be used in WeakMap and Set polyfills.
   */


  utils.defineProperty = Object.defineProperty;
  utils.WeakMap = typeof WeakMap !== 'undefined' ? WeakMap : function () {
    /** Originally based on {@link https://github.com/Polymer/WeakMap} */
    var counter = Date.now() % 1e9;

    var WeakMap = function WeakMap() {
      this.name = "__st".concat(Math.random() * 1e9 >>> 0).concat(counter++, "__");
    };

    WeakMap.prototype = {
      set: function set(key, value) {
        var entry = key[this.name];

        if (entry && entry[0] === key) {
          entry[1] = value;
        } else {
          utils.defineProperty(key, this.name, {
            value: [key, value],
            writable: true
          });
        }

        return this;
      },
      get: function get(key) {
        var entry = key[this.name];
        return entry && entry[0] === key ? entry[1] : undefined;
      },
      delete: function _delete(key) {
        var entry = key[this.name];

        if (!entry) {
          return false;
        }

        var hasValue = entry[0] === key;
        delete entry[0];
        delete entry[1];
        return hasValue;
      },
      has: function has(key) {
        var entry = key[this.name];

        if (!entry) {
          return false;
        }

        return entry[0] === key;
      }
    };
    return WeakMap;
  }();
  utils.Set = typeof Set !== 'undefined' ? Set : function () {
    var counter = Date.now() % 1e9;
    /**
     * A polyfill which covers only the basic usage.
     * Only supports methods that are supported in IE11.
     * {@link https://docs.microsoft.com/en-us/scripting/javascript/reference/set-object-javascript}
     * Assumes that 'key's are all objects, not primitives such as a number.
     *
     * @param {Array} items Initial items in this set
     */

    var Set = function Set(items) {
      this.name = "__st".concat(Math.random() * 1e9 >>> 0).concat(counter++, "__");
      this.keys = [];

      if (items && items.length) {
        var iItems = items.length;

        while (iItems--) {
          this.add(items[iItems]);
        }
      }
    };

    Set.prototype = {
      add: function add(key) {
        if (!isNumber(key[this.name])) {
          var index = this.keys.push(key) - 1;
          utils.defineProperty(key, this.name, {
            value: index,
            writable: true
          });
        }
      },
      delete: function _delete(key) {
        if (isNumber(key[this.name])) {
          var index = key[this.name];
          delete this.keys[index];
          key[this.name] = undefined;
        }
      },
      has: function has(key) {
        return isNumber(key[this.name]);
      },
      clear: function clear() {
        this.keys.forEach(function (key) {
          key[this.name] = undefined;
        });
        this.keys.length = 0;
      },
      forEach: function forEach(cb) {
        var that = this;
        this.keys.forEach(function (value) {
          cb(value, value, that);
        });
      }
    };
    utils.defineProperty(Set.prototype, 'size', {
      get: function get() {
        // Skips holes.
        return this.keys.reduce(function (acc) {
          return acc + 1;
        }, 0);
      }
    });
    return Set;
  }();
  /**
   * Vendor-specific Element.prototype.matches
   */

  utils.matchesPropertyName = function () {
    var props = ['matches', 'matchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector', 'webkitMatchesSelector'];

    for (var i = 0; i < 6; i++) {
      if (Element.prototype.hasOwnProperty(props[i])) {
        return props[i];
      }
    }
  }();
  /**
   * Provides stats information
   */


  utils.Stats = function () {
    /** @member {Array<number>} */
    this.array = [];
    /** @member {number} */

    this.length = 0;
    var zeroDescriptor = {
      value: 0,
      writable: true
    };
    /** @member {number} @private */

    Object.defineProperty(this, 'sum', zeroDescriptor);
    /** @member {number} @private */

    Object.defineProperty(this, 'squaredSum', zeroDescriptor);
  };
  /**
   * @param {number} dataPoint data point
   */


  utils.Stats.prototype.push = function (dataPoint) {
    this.array.push(dataPoint);
    this.length++;
    this.sum += dataPoint;
    this.squaredSum += dataPoint * dataPoint;
    /** @member {number} */

    this.mean = this.sum / this.length;
    /** @member {number} */
    // eslint-disable-next-line no-restricted-properties

    this.stddev = Math.sqrt(this.squaredSum / this.length - Math.pow(this.mean, 2));
  };
  /** Safe console.error version */


  utils.logError = typeof console !== 'undefined' && console.error && Function.prototype.bind && console.error.bind ? console.error.bind(window.console) : console.error;
  /** Safe console.info version */

  utils.logInfo = typeof console !== 'undefined' && console.info && Function.prototype.bind && console.info.bind ? console.info.bind(window.console) : console.info;

  function isNumber(obj) {
    return typeof obj === 'number';
  }
  /**
   * Returns path to element we will use as element identifier
   * @param {Element} inputEl
   * @returns {string} - path to the element
   */


  utils.getNodeSelector = function (inputEl) {
    if (!(inputEl instanceof Element)) {
      throw new Error('Function received argument with wrong type');
    }

    var el = inputEl;
    var path = []; // we need to check '!!el' first because it is possible
    // that some ancestor of the inputEl was removed before it

    while (!!el && el.nodeType === Node.ELEMENT_NODE) {
      var selector = el.nodeName.toLowerCase();

      if (el.id && typeof el.id === 'string') {
        selector += "#".concat(el.id);
        path.unshift(selector);
        break;
      } else {
        var sibling = el;
        var nth = 1;

        while (sibling.previousSibling) {
          sibling = sibling.previousSibling;

          if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName.toLowerCase() === selector) {
            nth++;
          }
        }

        if (nth !== 1) {
          selector += ":nth-of-type(".concat(nth, ")");
        }
      }

      path.unshift(selector);
      el = el.parentNode;
    }

    return path.join(' > ');
  };

  /**
   * Copyright 2016 Adguard Software Ltd
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  /**
   * Helper class css utils
   *
   * @type {{normalize}}
   */
  var cssUtils = function () {
    /**
     * Regex that matches AdGuard's backward compatible syntaxes.
     */
    var reAttrFallback = /\[-(?:ext|abp)-([a-z-_]+)=(["'])((?:(?=(\\?))\4.)*?)\2\]/g;
    /**
     * Complex replacement function.
     * Unescapes quote characters inside of an extended selector.
     *
     * @param match     Whole matched string
     * @param name      Group 1
     * @param quoteChar Group 2
     * @param value     Group 3
     */

    var evaluateMatch = function evaluateMatch(match, name, quoteChar, value) {
      // Unescape quotes
      var re = new RegExp("([^\\\\]|^)\\\\".concat(quoteChar), 'g');
      value = value.replace(re, "$1".concat(quoteChar));
      return ":".concat(name, "(").concat(value, ")");
    }; // Sizzle's parsing of pseudo class arguments is buggy on certain circumstances
    // We support following form of arguments:
    // 1. for :matches-css, those of a form {propertyName}: /.*/
    // 2. for :contains, those of a form /.*/
    // We transform such cases in a way that Sizzle has no ambiguity in parsing arguments.


    var reMatchesCss = /\:(matches-css(?:-after|-before)?)\(([a-z-\s]*\:\s*\/(?:\\.|[^\/])*?\/\s*)\)/g;
    var reContains = /:(?:-abp-)?(contains|has-text)\((\s*\/(?:\\.|[^\/])*?\/\s*)\)/g;
    var reScope = /\(\:scope >/g; // Note that we require `/` character in regular expressions to be escaped.

    /**
     * Used for pre-processing pseudo-classes values with above two regexes.
     */

    var addQuotes = function addQuotes(_, c1, c2) {
      return ":".concat(c1, "(\"").concat(c2.replace(/["\\]/g, '\\$&'), "\")");
    };

    var SCOPE_REPLACER = '(>';
    /**
     * Normalizes specified css text in a form that can be parsed by the
     * Sizzle engine.
     * Normalization means
     *  1. transforming [-ext-*=""] attributes to pseudo classes
     *  2. enclosing possibly ambiguous arguments of `:contains`,
     *     `:matches-css` pseudo classes with quotes.
     * @param {string} cssText
     * @return {string}
     */

    var normalize = function normalize(cssText) {
      var normalizedCssText = cssText.replace(reAttrFallback, evaluateMatch).replace(reMatchesCss, addQuotes).replace(reContains, addQuotes).replace(reScope, SCOPE_REPLACER);
      return normalizedCssText;
    };

    var isSimpleSelectorValid = function isSimpleSelectorValid(selector) {
      try {
        document.querySelectorAll(selector);
      } catch (e) {
        return false;
      }

      return true;
    };

    return {
      normalize: normalize,
      isSimpleSelectorValid: isSimpleSelectorValid
    };
  }();

  /*!
   * Sizzle CSS Selector Engine v2.3.4-pre-adguard
   * https://sizzlejs.com/
   *
   * Copyright JS Foundation and other contributors
   * Released under the MIT license
   * https://js.foundation/
   *
   * Date: 2020-08-04
   */

  /**
   * Version of Sizzle patched by AdGuard in order to be used in the ExtendedCss module.
   * https://github.com/AdguardTeam/sizzle-extcss
   *
   * Look for [AdGuard Patch] and ADGUARD_EXTCSS markers to find out what exactly was changed by us.
   *
   * Global changes:
   * 1. Added additional parameters to the "Sizzle.tokenize" method so that it can be used for stylesheets parsing and validation.
   * 2. Added tokens re-sorting mechanism forcing slow pseudos to be matched last  (see sortTokenGroups).
   * 3. Fix the nonnativeSelectorCache caching -- there was no value corresponding to a key.
   * 4. Added Sizzle.compile call to the `:has` pseudo definition.
   *
   * Changes that are applied to the ADGUARD_EXTCSS build only:
   * 1. Do not expose Sizzle to the global scope. Initialize it lazily via initializeSizzle().
   * 2. Removed :contains pseudo declaration -- its syntax is changed and declared outside of Sizzle.
   * 3. Removed declarations for the following non-standard pseudo classes:
   * :parent, :header, :input, :button, :text, :first, :last, :eq,
   * :even, :odd, :lt, :gt, :nth, :radio, :checkbox, :file,
   * :password, :image, :submit, :reset
   * 4. Added es6 module export
   */
  var Sizzle;
  /**
   * Initializes Sizzle object.
   * In the case of AdGuard ExtendedCss we want to avoid initializing Sizzle right away
   * and exposing it to the global scope.
   */

  var initializeSizzle = function initializeSizzle() {
    // jshint ignore:line
    if (!Sizzle) {
      //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      Sizzle = function (window) {
        var support,
            Expr,
            getText,
            isXML,
            tokenize,
            compile,
            select,
            outermostContext,
            sortInput,
            hasDuplicate,
            // Local document vars
        setDocument,
            document,
            docElem,
            documentIsHTML,
            rbuggyQSA,
            rbuggyMatches,
            matches,
            contains,
            // Instance-specific data
        expando = "sizzle" + 1 * new Date(),
            preferredDoc = window.document,
            dirruns = 0,
            done = 0,
            classCache = createCache(),
            tokenCache = createCache(),
            compilerCache = createCache(),
            nonnativeSelectorCache = createCache(),
            sortOrder = function sortOrder(a, b) {
          if (a === b) {
            hasDuplicate = true;
          }

          return 0;
        },
            // Instance methods
        hasOwn = {}.hasOwnProperty,
            arr = [],
            pop = arr.pop,
            push_native = arr.push,
            push = arr.push,
            slice = arr.slice,
            // Use a stripped-down indexOf as it's faster than native
        // https://jsperf.com/thor-indexof-vs-for/5
        indexOf = function indexOf(list, elem) {
          var i = 0,
              len = list.length;

          for (; i < len; i++) {
            if (list[i] === elem) {
              return i;
            }
          }

          return -1;
        },
            booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
            // Regular expressions
        // http://www.w3.org/TR/css3-selectors/#whitespace
        whitespace = "[\\x20\\t\\r\\n\\f]",
            // http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
        identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",
            // Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
        attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace + // Operator (capture 2)
        "*([*^$|!~]?=)" + whitespace + // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
        "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace + "*\\]",
            pseudos = ":(" + identifier + ")(?:\\((" + // To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
        // 1. quoted (capture 3; capture 4 or capture 5)
        "('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" + // 2. simple (capture 6)
        "((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" + // 3. anything else (capture 2)
        ".*" + ")\\)|)",
            // Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
        rwhitespace = new RegExp(whitespace + "+", "g"),
            rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"),
            rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"),
            rcombinators = new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"),
            rpseudo = new RegExp(pseudos),
            ridentifier = new RegExp("^" + identifier + "$"),
            matchExpr = {
          "ID": new RegExp("^#(" + identifier + ")"),
          "CLASS": new RegExp("^\\.(" + identifier + ")"),
          "TAG": new RegExp("^(" + identifier + "|[*])"),
          "ATTR": new RegExp("^" + attributes),
          "PSEUDO": new RegExp("^" + pseudos),
          "CHILD": new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i"),
          "bool": new RegExp("^(?:" + booleans + ")$", "i"),
          // For use in libraries implementing .is()
          // We use this for POS matching in `select`
          "needsContext": new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
        },
            rnative = /^[^{]+\{\s*\[native \w/,
            // Easily-parseable/retrievable ID or TAG or CLASS selectors
        rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
            rsibling = /[+~]/,
            // CSS escapes
        // http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
        runescape = new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig"),
            funescape = function funescape(_, escaped, escapedWhitespace) {
          var high = "0x" + escaped - 0x10000; // NaN means non-codepoint
          // Support: Firefox<24
          // Workaround erroneous numeric interpretation of +"0x"

          return high !== high || escapedWhitespace ? escaped : high < 0 ? // BMP codepoint
          String.fromCharCode(high + 0x10000) : // Supplemental Plane codepoint (surrogate pair)
          String.fromCharCode(high >> 10 | 0xD800, high & 0x3FF | 0xDC00);
        },
            // CSS string/identifier serialization
        // https://drafts.csswg.org/cssom/#common-serializing-idioms
        rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
            fcssescape = function fcssescape(ch, asCodePoint) {
          if (asCodePoint) {
            // U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
            if (ch === "\0") {
              return "\uFFFD";
            } // Control characters and (dependent upon position) numbers get escaped as code points


            return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " ";
          } // Other potentially-special ASCII characters get backslash-escaped


          return "\\" + ch;
        },
            // Used for iframes
        // See setDocument()
        // Removing the function wrapper causes a "Permission Denied"
        // error in IE
        unloadHandler = function unloadHandler() {
          setDocument();
        },
            inDisabledFieldset = addCombinator(function (elem) {
          return elem.disabled === true && elem.nodeName.toLowerCase() === "fieldset";
        }, {
          dir: "parentNode",
          next: "legend"
        }); // Optimize for push.apply( _, NodeList )


        try {
          push.apply(arr = slice.call(preferredDoc.childNodes), preferredDoc.childNodes); // Support: Android<4.0
          // Detect silently failing push.apply

          arr[preferredDoc.childNodes.length].nodeType;
        } catch (e) {
          push = {
            apply: arr.length ? // Leverage slice if possible
            function (target, els) {
              push_native.apply(target, slice.call(els));
            } : // Support: IE<9
            // Otherwise append directly
            function (target, els) {
              var j = target.length,
                  i = 0; // Can't trust NodeList.length

              while (target[j++] = els[i++]) {}

              target.length = j - 1;
            }
          };
        }

        function Sizzle(selector, context, results, seed) {
          var m,
              i,
              elem,
              nid,
              match,
              groups,
              newSelector,
              newContext = context && context.ownerDocument,
              // nodeType defaults to 9, since context defaults to document
          nodeType = context ? context.nodeType : 9;
          results = results || []; // Return early from calls with invalid selector or context

          if (typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {
            return results;
          } // Try to shortcut find operations (as opposed to filters) in HTML documents


          if (!seed) {
            if ((context ? context.ownerDocument || context : preferredDoc) !== document) {
              setDocument(context);
            }

            context = context || document;

            if (documentIsHTML) {
              // If the selector is sufficiently simple, try using a "get*By*" DOM method
              // (excepting DocumentFragment context, where the methods don't exist)
              if (nodeType !== 11 && (match = rquickExpr.exec(selector))) {
                // ID selector
                if (m = match[1]) {
                  // Document context
                  if (nodeType === 9) {
                    if (elem = context.getElementById(m)) {
                      // Support: IE, Opera, Webkit
                      // TODO: identify versions
                      // getElementById can match elements by name instead of ID
                      if (elem.id === m) {
                        results.push(elem);
                        return results;
                      }
                    } else {
                      return results;
                    } // Element context

                  } else {
                    // Support: IE, Opera, Webkit
                    // TODO: identify versions
                    // getElementById can match elements by name instead of ID
                    if (newContext && (elem = newContext.getElementById(m)) && contains(context, elem) && elem.id === m) {
                      results.push(elem);
                      return results;
                    }
                  } // Type selector

                } else if (match[2]) {
                  push.apply(results, context.getElementsByTagName(selector));
                  return results; // Class selector
                } else if ((m = match[3]) && support.getElementsByClassName && context.getElementsByClassName) {
                  push.apply(results, context.getElementsByClassName(m));
                  return results;
                }
              } // Take advantage of querySelectorAll


              if (support.qsa && !nonnativeSelectorCache[selector + " "] && (!rbuggyQSA || !rbuggyQSA.test(selector))) {
                if (nodeType !== 1) {
                  newContext = context;
                  newSelector = selector; // qSA looks outside Element context, which is not what we want
                  // Thanks to Andrew Dupont for this workaround technique
                  // Support: IE <=8
                  // Exclude object elements
                } else if (context.nodeName.toLowerCase() !== "object") {
                  // Capture the context ID, setting it first if necessary
                  if (nid = context.getAttribute("id")) {
                    nid = nid.replace(rcssescape, fcssescape);
                  } else {
                    context.setAttribute("id", nid = expando);
                  } // Prefix every selector in the list


                  groups = tokenize(selector);
                  i = groups.length;

                  while (i--) {
                    groups[i] = "#" + nid + " " + toSelector(groups[i]);
                  }

                  newSelector = groups.join(","); // Expand context for sibling selectors

                  newContext = rsibling.test(selector) && testContext(context.parentNode) || context;
                }

                if (newSelector) {
                  try {
                    push.apply(results, newContext.querySelectorAll(newSelector));
                    return results;
                  } catch (qsaError) {
                    // [AdGuard Path]: Fix the cache value
                    nonnativeSelectorCache(selector, true);
                  } finally {
                    if (nid === expando) {
                      context.removeAttribute("id");
                    }
                  }
                }
              }
            }
          } // All others


          return select(selector.replace(rtrim, "$1"), context, results, seed);
        }
        /**
         * Create key-value caches of limited size
         * @returns {function(string, object)} Returns the Object data after storing it on itself with
         *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
         *	deleting the oldest entry
         */


        function createCache() {
          var keys = [];

          function cache(key, value) {
            // Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
            if (keys.push(key + " ") > Expr.cacheLength) {
              // Only keep the most recent entries
              delete cache[keys.shift()];
            }

            return cache[key + " "] = value;
          }

          return cache;
        }
        /**
         * Mark a function for special use by Sizzle
         * @param {Function} fn The function to mark
         */


        function markFunction(fn) {
          fn[expando] = true;
          return fn;
        }
        /**
         * Support testing using an element
         * @param {Function} fn Passed the created element and returns a boolean result
         */


        function assert(fn) {
          var el = document.createElement("fieldset");

          try {
            return !!fn(el);
          } catch (e) {
            return false;
          } finally {
            // Remove from its parent by default
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            } // release memory in IE


            el = null;
          }
        }
        /**
         * Adds the same handler for all of the specified attrs
         * @param {String} attrs Pipe-separated list of attributes
         * @param {Function} handler The method that will be applied
         */


        function addHandle(attrs, handler) {
          var arr = attrs.split("|"),
              i = arr.length;

          while (i--) {
            Expr.attrHandle[arr[i]] = handler;
          }
        }
        /**
         * Checks document order of two siblings
         * @param {Element} a
         * @param {Element} b
         * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
         */


        function siblingCheck(a, b) {
          var cur = b && a,
              diff = cur && a.nodeType === 1 && b.nodeType === 1 && a.sourceIndex - b.sourceIndex; // Use IE sourceIndex if available on both nodes

          if (diff) {
            return diff;
          } // Check if b follows a


          if (cur) {
            while (cur = cur.nextSibling) {
              if (cur === b) {
                return -1;
              }
            }
          }

          return a ? 1 : -1;
        }
        /**
         * Returns a function to use in pseudos for :enabled/:disabled
         * @param {Boolean} disabled true for :disabled; false for :enabled
         */


        function createDisabledPseudo(disabled) {
          // Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
          return function (elem) {
            // Only certain elements can match :enabled or :disabled
            // https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
            // https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
            if ("form" in elem) {
              // Check for inherited disabledness on relevant non-disabled elements:
              // * listed form-associated elements in a disabled fieldset
              //   https://html.spec.whatwg.org/multipage/forms.html#category-listed
              //   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
              // * option elements in a disabled optgroup
              //   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
              // All such elements have a "form" property.
              if (elem.parentNode && elem.disabled === false) {
                // Option elements defer to a parent optgroup if present
                if ("label" in elem) {
                  if ("label" in elem.parentNode) {
                    return elem.parentNode.disabled === disabled;
                  } else {
                    return elem.disabled === disabled;
                  }
                } // Support: IE 6 - 11
                // Use the isDisabled shortcut property to check for disabled fieldset ancestors


                return elem.isDisabled === disabled || // Where there is no isDisabled, check manually

                /* jshint -W018 */
                elem.isDisabled !== !disabled && inDisabledFieldset(elem) === disabled;
              }

              return elem.disabled === disabled; // Try to winnow out elements that can't be disabled before trusting the disabled property.
              // Some victims get caught in our net (label, legend, menu, track), but it shouldn't
              // even exist on them, let alone have a boolean value.
            } else if ("label" in elem) {
              return elem.disabled === disabled;
            } // Remaining elements are neither :enabled nor :disabled


            return false;
          };
        }
        /**
         * Checks a node for validity as a Sizzle context
         * @param {Element|Object=} context
         * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
         */


        function testContext(context) {
          return context && typeof context.getElementsByTagName !== "undefined" && context;
        } // Expose support vars for convenience


        support = Sizzle.support = {};
        /**
         * Detects XML nodes
         * @param {Element|Object} elem An element or a document
         * @returns {Boolean} True iff elem is a non-HTML XML node
         */

        isXML = Sizzle.isXML = function (elem) {
          // documentElement is verified for cases where it doesn't yet exist
          // (such as loading iframes in IE - #4833)
          var documentElement = elem && (elem.ownerDocument || elem).documentElement;
          return documentElement ? documentElement.nodeName !== "HTML" : false;
        };
        /**
         * Sets document-related variables once based on the current document
         * @param {Element|Object} [doc] An element or document object to use to set the document
         * @returns {Object} Returns the current document
         */


        setDocument = Sizzle.setDocument = function (node) {
          var hasCompare,
              subWindow,
              doc = node ? node.ownerDocument || node : preferredDoc; // Return early if doc is invalid or already selected

          if (doc === document || doc.nodeType !== 9 || !doc.documentElement) {
            return document;
          } // Update global variables


          document = doc;
          docElem = document.documentElement;
          documentIsHTML = !isXML(document); // Support: IE 9-11, Edge
          // Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)

          if (preferredDoc !== document && (subWindow = document.defaultView) && subWindow.top !== subWindow) {
            // Support: IE 11, Edge
            if (subWindow.addEventListener) {
              subWindow.addEventListener("unload", unloadHandler, false); // Support: IE 9 - 10 only
            } else if (subWindow.attachEvent) {
              subWindow.attachEvent("onunload", unloadHandler);
            }
          }
          /* Attributes
          ---------------------------------------------------------------------- */
          // Support: IE<8
          // Verify that getAttribute really returns attributes and not properties
          // (excepting IE8 booleans)


          support.attributes = assert(function (el) {
            el.className = "i";
            return !el.getAttribute("className");
          });
          /* getElement(s)By*
          ---------------------------------------------------------------------- */
          // Check if getElementsByTagName("*") returns only elements

          support.getElementsByTagName = assert(function (el) {
            el.appendChild(document.createComment(""));
            return !el.getElementsByTagName("*").length;
          }); // Support: IE<9

          support.getElementsByClassName = rnative.test(document.getElementsByClassName); // Support: IE<10
          // Check if getElementById returns elements by name
          // The broken getElementById methods don't pick up programmatically-set names,
          // so use a roundabout getElementsByName test

          support.getById = assert(function (el) {
            docElem.appendChild(el).id = expando;
            return !document.getElementsByName || !document.getElementsByName(expando).length;
          }); // ID filter and find

          if (support.getById) {
            Expr.filter["ID"] = function (id) {
              var attrId = id.replace(runescape, funescape);
              return function (elem) {
                return elem.getAttribute("id") === attrId;
              };
            };

            Expr.find["ID"] = function (id, context) {
              if (typeof context.getElementById !== "undefined" && documentIsHTML) {
                var elem = context.getElementById(id);
                return elem ? [elem] : [];
              }
            };
          } else {
            Expr.filter["ID"] = function (id) {
              var attrId = id.replace(runescape, funescape);
              return function (elem) {
                var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
                return node && node.value === attrId;
              };
            }; // Support: IE 6 - 7 only
            // getElementById is not reliable as a find shortcut


            Expr.find["ID"] = function (id, context) {
              if (typeof context.getElementById !== "undefined" && documentIsHTML) {
                var node,
                    i,
                    elems,
                    elem = context.getElementById(id);

                if (elem) {
                  // Verify the id attribute
                  node = elem.getAttributeNode("id");

                  if (node && node.value === id) {
                    return [elem];
                  } // Fall back on getElementsByName


                  elems = context.getElementsByName(id);
                  i = 0;

                  while (elem = elems[i++]) {
                    node = elem.getAttributeNode("id");

                    if (node && node.value === id) {
                      return [elem];
                    }
                  }
                }

                return [];
              }
            };
          } // Tag


          Expr.find["TAG"] = support.getElementsByTagName ? function (tag, context) {
            if (typeof context.getElementsByTagName !== "undefined") {
              return context.getElementsByTagName(tag); // DocumentFragment nodes don't have gEBTN
            } else if (support.qsa) {
              return context.querySelectorAll(tag);
            }
          } : function (tag, context) {
            var elem,
                tmp = [],
                i = 0,
                // By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
            results = context.getElementsByTagName(tag); // Filter out possible comments

            if (tag === "*") {
              while (elem = results[i++]) {
                if (elem.nodeType === 1) {
                  tmp.push(elem);
                }
              }

              return tmp;
            }

            return results;
          }; // Class

          Expr.find["CLASS"] = support.getElementsByClassName && function (className, context) {
            if (typeof context.getElementsByClassName !== "undefined" && documentIsHTML) {
              return context.getElementsByClassName(className);
            }
          };
          /* QSA/matchesSelector
          ---------------------------------------------------------------------- */
          // QSA and matchesSelector support
          // matchesSelector(:active) reports false when true (IE9/Opera 11.5)


          rbuggyMatches = []; // qSa(:focus) reports false when true (Chrome 21)
          // We allow this because of a bug in IE8/9 that throws an error
          // whenever `document.activeElement` is accessed on an iframe
          // So, we allow :focus to pass through QSA all the time to avoid the IE error
          // See https://bugs.jquery.com/ticket/13378

          rbuggyQSA = [];

          if (support.qsa = rnative.test(document.querySelectorAll)) {
            // Build QSA regex
            // Regex strategy adopted from Diego Perini
            assert(function (el) {
              // Select is set to empty string on purpose
              // This is to test IE's treatment of not explicitly
              // setting a boolean content attribute,
              // since its presence should be enough
              // https://bugs.jquery.com/ticket/12359
              docElem.appendChild(el).innerHTML = AGPolicy.createHTML("<a id='" + expando + "'></a>" + "<select id='" + expando + "-\r\\' msallowcapture=''>" + "<option selected=''></option></select>"); // Support: IE8, Opera 11-12.16
              // Nothing should be selected when empty strings follow ^= or $= or *=
              // The test attribute must be unknown in Opera but "safe" for WinRT
              // https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section

              if (el.querySelectorAll("[msallowcapture^='']").length) {
                rbuggyQSA.push("[*^$]=" + whitespace + "*(?:''|\"\")");
              } // Support: IE8
              // Boolean attributes and "value" are not treated correctly


              if (!el.querySelectorAll("[selected]").length) {
                rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");
              } // Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+


              if (!el.querySelectorAll("[id~=" + expando + "-]").length) {
                rbuggyQSA.push("~=");
              } // Webkit/Opera - :checked should return selected option elements
              // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
              // IE8 throws error here and will not see later tests


              if (!el.querySelectorAll(":checked").length) {
                rbuggyQSA.push(":checked");
              } // Support: Safari 8+, iOS 8+
              // https://bugs.webkit.org/show_bug.cgi?id=136851
              // In-page `selector#id sibling-combinator selector` fails


              if (!el.querySelectorAll("a#" + expando + "+*").length) {
                rbuggyQSA.push(".#.+[+~]");
              }
            });
            assert(function (el) {
              el.innerHTML = AGPolicy.createHTML("<a href='' disabled='disabled'></a>" + "<select disabled='disabled'><option/></select>"); // Support: Windows 8 Native Apps
              // The type and name attributes are restricted during .innerHTML assignment

              var input = document.createElement("input");
              input.setAttribute("type", "hidden");
              el.appendChild(input).setAttribute("name", "D"); // Support: IE8
              // Enforce case-sensitivity of name attribute

              if (el.querySelectorAll("[name=d]").length) {
                rbuggyQSA.push("name" + whitespace + "*[*^$|!~]?=");
              } // FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
              // IE8 throws error here and will not see later tests


              if (el.querySelectorAll(":enabled").length !== 2) {
                rbuggyQSA.push(":enabled", ":disabled");
              } // Support: IE9-11+
              // IE's :disabled selector does not pick up the children of disabled fieldsets


              docElem.appendChild(el).disabled = true;

              if (el.querySelectorAll(":disabled").length !== 2) {
                rbuggyQSA.push(":enabled", ":disabled");
              } // Opera 10-11 does not throw on post-comma invalid pseudos


              el.querySelectorAll("*,:x");
              rbuggyQSA.push(",.*:");
            });
          }

          if (support.matchesSelector = rnative.test(matches = docElem.matches || docElem.webkitMatchesSelector || docElem.mozMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector)) {
            assert(function (el) {
              // Check to see if it's possible to do matchesSelector
              // on a disconnected node (IE 9)
              support.disconnectedMatch = matches.call(el, "*"); // This should fail with an exception
              // Gecko does not error, returns false instead

              matches.call(el, "[s!='']:x");
              rbuggyMatches.push("!=", pseudos);
            });
          }

          rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));
          rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join("|"));
          /* Contains
          ---------------------------------------------------------------------- */

          hasCompare = rnative.test(docElem.compareDocumentPosition); // Element contains another
          // Purposefully self-exclusive
          // As in, an element does not contain itself

          contains = hasCompare || rnative.test(docElem.contains) ? function (a, b) {
            var adown = a.nodeType === 9 ? a.documentElement : a,
                bup = b && b.parentNode;
            return a === bup || !!(bup && bup.nodeType === 1 && (adown.contains ? adown.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
          } : function (a, b) {
            if (b) {
              while (b = b.parentNode) {
                if (b === a) {
                  return true;
                }
              }
            }

            return false;
          };
          /* Sorting
          ---------------------------------------------------------------------- */
          // Document order sorting

          sortOrder = hasCompare ? function (a, b) {
            // Flag for duplicate removal
            if (a === b) {
              hasDuplicate = true;
              return 0;
            } // Sort on method existence if only one input has compareDocumentPosition


            var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;

            if (compare) {
              return compare;
            } // Calculate position if both inputs belong to the same document


            compare = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : // Otherwise we know they are disconnected
            1; // Disconnected nodes

            if (compare & 1 || !support.sortDetached && b.compareDocumentPosition(a) === compare) {
              // Choose the first element that is related to our preferred document
              if (a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a)) {
                return -1;
              }

              if (b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b)) {
                return 1;
              } // Maintain original order


              return sortInput ? indexOf(sortInput, a) - indexOf(sortInput, b) : 0;
            }

            return compare & 4 ? -1 : 1;
          } : function (a, b) {
            // Exit early if the nodes are identical
            if (a === b) {
              hasDuplicate = true;
              return 0;
            }

            var cur,
                i = 0,
                aup = a.parentNode,
                bup = b.parentNode,
                ap = [a],
                bp = [b]; // Parentless nodes are either documents or disconnected

            if (!aup || !bup) {
              return a === document ? -1 : b === document ? 1 : aup ? -1 : bup ? 1 : sortInput ? indexOf(sortInput, a) - indexOf(sortInput, b) : 0; // If the nodes are siblings, we can do a quick check
            } else if (aup === bup) {
              return siblingCheck(a, b);
            } // Otherwise we need full lists of their ancestors for comparison


            cur = a;

            while (cur = cur.parentNode) {
              ap.unshift(cur);
            }

            cur = b;

            while (cur = cur.parentNode) {
              bp.unshift(cur);
            } // Walk down the tree looking for a discrepancy


            while (ap[i] === bp[i]) {
              i++;
            }

            return i ? // Do a sibling check if the nodes have a common ancestor
            siblingCheck(ap[i], bp[i]) : // Otherwise nodes in our document sort first
            ap[i] === preferredDoc ? -1 : bp[i] === preferredDoc ? 1 : 0;
          };
          return document;
        };

        Sizzle.matches = function (expr, elements) {
          return Sizzle(expr, null, null, elements);
        };

        Sizzle.matchesSelector = function (elem, expr) {
          // Set document vars if needed
          if ((elem.ownerDocument || elem) !== document) {
            setDocument(elem);
          }

          if (support.matchesSelector && documentIsHTML && !nonnativeSelectorCache[expr + " "] && (!rbuggyMatches || !rbuggyMatches.test(expr)) && (!rbuggyQSA || !rbuggyQSA.test(expr))) {
            try {
              var ret = matches.call(elem, expr); // IE 9's matchesSelector returns false on disconnected nodes

              if (ret || support.disconnectedMatch || // As well, disconnected nodes are said to be in a document
              // fragment in IE 9
              elem.document && elem.document.nodeType !== 11) {
                return ret;
              }
            } catch (e) {
              // [AdGuard Path]: Fix the cache value
              nonnativeSelectorCache(expr, true);
            }
          }

          return Sizzle(expr, document, null, [elem]).length > 0;
        };

        Sizzle.contains = function (context, elem) {
          // Set document vars if needed
          if ((context.ownerDocument || context) !== document) {
            setDocument(context);
          }

          return contains(context, elem);
        };

        Sizzle.attr = function (elem, name) {
          // Set document vars if needed
          if ((elem.ownerDocument || elem) !== document) {
            setDocument(elem);
          }

          var fn = Expr.attrHandle[name.toLowerCase()],
              // Don't get fooled by Object.prototype properties (jQuery #13807)
          val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn(elem, name, !documentIsHTML) : undefined;
          return val !== undefined ? val : support.attributes || !documentIsHTML ? elem.getAttribute(name) : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null;
        };

        Sizzle.escape = function (sel) {
          return (sel + "").replace(rcssescape, fcssescape);
        };

        Sizzle.error = function (msg) {
          throw new Error("Syntax error, unrecognized expression: " + msg);
        };
        /**
         * Document sorting and removing duplicates
         * @param {ArrayLike} results
         */


        Sizzle.uniqueSort = function (results) {
          var elem,
              duplicates = [],
              j = 0,
              i = 0; // Unless we *know* we can detect duplicates, assume their presence

          hasDuplicate = !support.detectDuplicates;
          sortInput = !support.sortStable && results.slice(0);
          results.sort(sortOrder);

          if (hasDuplicate) {
            while (elem = results[i++]) {
              if (elem === results[i]) {
                j = duplicates.push(i);
              }
            }

            while (j--) {
              results.splice(duplicates[j], 1);
            }
          } // Clear input after sorting to release objects
          // See https://github.com/jquery/sizzle/pull/225


          sortInput = null;
          return results;
        };
        /**
         * Utility function for retrieving the text value of an array of DOM nodes
         * @param {Array|Element} elem
         */


        getText = Sizzle.getText = function (elem) {
          var node,
              ret = "",
              i = 0,
              nodeType = elem.nodeType;

          if (!nodeType) {
            // If no nodeType, this is expected to be an array
            while (node = elem[i++]) {
              // Do not traverse comment nodes
              ret += getText(node);
            }
          } else if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
            // Use textContent for elements
            // innerText usage removed for consistency of new lines (jQuery #11153)
            if (typeof elem.textContent === "string") {
              return elem.textContent;
            } else {
              // Traverse its children
              for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                ret += getText(elem);
              }
            }
          } else if (nodeType === 3 || nodeType === 4) {
            return elem.nodeValue;
          } // Do not include comment or processing instruction nodes


          return ret;
        };

        Expr = Sizzle.selectors = {
          // Can be adjusted by the user
          cacheLength: 50,
          createPseudo: markFunction,
          match: matchExpr,
          attrHandle: {},
          find: {},
          relative: {
            ">": {
              dir: "parentNode",
              first: true
            },
            " ": {
              dir: "parentNode"
            },
            "+": {
              dir: "previousSibling",
              first: true
            },
            "~": {
              dir: "previousSibling"
            }
          },
          preFilter: {
            "ATTR": function ATTR(match) {
              match[1] = match[1].replace(runescape, funescape); // Move the given value to match[3] whether quoted or unquoted

              match[3] = (match[3] || match[4] || match[5] || "").replace(runescape, funescape);

              if (match[2] === "~=") {
                match[3] = " " + match[3] + " ";
              }

              return match.slice(0, 4);
            },
            "CHILD": function CHILD(match) {
              /* matches from matchExpr["CHILD"]
              	1 type (only|nth|...)
              	2 what (child|of-type)
              	3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
              	4 xn-component of xn+y argument ([+-]?\d*n|)
              	5 sign of xn-component
              	6 x of xn-component
              	7 sign of y-component
              	8 y of y-component
              */
              match[1] = match[1].toLowerCase();

              if (match[1].slice(0, 3) === "nth") {
                // nth-* requires argument
                if (!match[3]) {
                  Sizzle.error(match[0]);
                } // numeric x and y parameters for Expr.filter.CHILD
                // remember that false/true cast respectively to 0/1


                match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === "even" || match[3] === "odd"));
                match[5] = +(match[7] + match[8] || match[3] === "odd"); // other types prohibit arguments
              } else if (match[3]) {
                Sizzle.error(match[0]);
              }

              return match;
            },
            "PSEUDO": function PSEUDO(match) {
              var excess,
                  unquoted = !match[6] && match[2];

              if (matchExpr["CHILD"].test(match[0])) {
                return null;
              } // Accept quoted arguments as-is


              if (match[3]) {
                match[2] = match[4] || match[5] || ""; // Strip excess characters from unquoted arguments
              } else if (unquoted && rpseudo.test(unquoted) && ( // Get excess from tokenize (recursively)
              excess = tokenize(unquoted, true)) && ( // advance to the next closing parenthesis
              excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)) {
                // excess is a negative index
                match[0] = match[0].slice(0, excess);
                match[2] = unquoted.slice(0, excess);
              } // Return only captures needed by the pseudo filter method (type and argument)


              return match.slice(0, 3);
            }
          },
          filter: {
            "TAG": function TAG(nodeNameSelector) {
              var nodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
              return nodeNameSelector === "*" ? function () {
                return true;
              } : function (elem) {
                return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
              };
            },
            "CLASS": function CLASS(className) {
              var pattern = classCache[className + " "];
              return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function (elem) {
                return pattern.test(typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "");
              });
            },
            "ATTR": function ATTR(name, operator, check) {
              return function (elem) {
                var result = Sizzle.attr(elem, name);

                if (result == null) {
                  return operator === "!=";
                }

                if (!operator) {
                  return true;
                }

                result += "";
                return operator === "=" ? result === check : operator === "!=" ? result !== check : operator === "^=" ? check && result.indexOf(check) === 0 : operator === "*=" ? check && result.indexOf(check) > -1 : operator === "$=" ? check && result.slice(-check.length) === check : operator === "~=" ? (" " + result.replace(rwhitespace, " ") + " ").indexOf(check) > -1 : operator === "|=" ? result === check || result.slice(0, check.length + 1) === check + "-" : false;
              };
            },
            "CHILD": function CHILD(type, what, argument, first, last) {
              var simple = type.slice(0, 3) !== "nth",
                  forward = type.slice(-4) !== "last",
                  ofType = what === "of-type";
              return first === 1 && last === 0 ? // Shortcut for :nth-*(n)
              function (elem) {
                return !!elem.parentNode;
              } : function (elem, context, xml) {
                var cache,
                    uniqueCache,
                    outerCache,
                    node,
                    nodeIndex,
                    start,
                    dir = simple !== forward ? "nextSibling" : "previousSibling",
                    parent = elem.parentNode,
                    name = ofType && elem.nodeName.toLowerCase(),
                    useCache = !xml && !ofType,
                    diff = false;

                if (parent) {
                  // :(first|last|only)-(child|of-type)
                  if (simple) {
                    while (dir) {
                      node = elem;

                      while (node = node[dir]) {
                        if (ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) {
                          return false;
                        }
                      } // Reverse direction for :only-* (if we haven't yet done so)


                      start = dir = type === "only" && !start && "nextSibling";
                    }

                    return true;
                  }

                  start = [forward ? parent.firstChild : parent.lastChild]; // non-xml :nth-child(...) stores cache data on `parent`

                  if (forward && useCache) {
                    // Seek `elem` from a previously-cached index
                    // ...in a gzip-friendly way
                    node = parent;
                    outerCache = node[expando] || (node[expando] = {}); // Support: IE <9 only
                    // Defend against cloned attroperties (jQuery gh-1709)

                    uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                    cache = uniqueCache[type] || [];
                    nodeIndex = cache[0] === dirruns && cache[1];
                    diff = nodeIndex && cache[2];
                    node = nodeIndex && parent.childNodes[nodeIndex];

                    while (node = ++nodeIndex && node && node[dir] || ( // Fallback to seeking `elem` from the start
                    diff = nodeIndex = 0) || start.pop()) {
                      // When found, cache indexes on `parent` and break
                      if (node.nodeType === 1 && ++diff && node === elem) {
                        uniqueCache[type] = [dirruns, nodeIndex, diff];
                        break;
                      }
                    }
                  } else {
                    // Use previously-cached element index if available
                    if (useCache) {
                      // ...in a gzip-friendly way
                      node = elem;
                      outerCache = node[expando] || (node[expando] = {}); // Support: IE <9 only
                      // Defend against cloned attroperties (jQuery gh-1709)

                      uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                      cache = uniqueCache[type] || [];
                      nodeIndex = cache[0] === dirruns && cache[1];
                      diff = nodeIndex;
                    } // xml :nth-child(...)
                    // or :nth-last-child(...) or :nth(-last)?-of-type(...)


                    if (diff === false) {
                      // Use the same loop as above to seek `elem` from the start
                      while (node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {
                        if ((ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) && ++diff) {
                          // Cache the index of each encountered element
                          if (useCache) {
                            outerCache = node[expando] || (node[expando] = {}); // Support: IE <9 only
                            // Defend against cloned attroperties (jQuery gh-1709)

                            uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                            uniqueCache[type] = [dirruns, diff];
                          }

                          if (node === elem) {
                            break;
                          }
                        }
                      }
                    }
                  } // Incorporate the offset, then check against cycle size


                  diff -= last;
                  return diff === first || diff % first === 0 && diff / first >= 0;
                }
              };
            },
            "PSEUDO": function PSEUDO(pseudo, argument) {
              // pseudo-class names are case-insensitive
              // http://www.w3.org/TR/selectors/#pseudo-classes
              // Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
              // Remember that setFilters inherits from pseudos
              var args,
                  fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo); // The user may use createPseudo to indicate that
              // arguments are needed to create the filter function
              // just as Sizzle does

              if (fn[expando]) {
                return fn(argument);
              } // But maintain support for old signatures


              if (fn.length > 1) {
                args = [pseudo, pseudo, "", argument];
                return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function (seed, matches) {
                  var idx,
                      matched = fn(seed, argument),
                      i = matched.length;

                  while (i--) {
                    idx = indexOf(seed, matched[i]);
                    seed[idx] = !(matches[idx] = matched[i]);
                  }
                }) : function (elem) {
                  return fn(elem, 0, args);
                };
              }

              return fn;
            }
          },
          pseudos: {
            // Potentially complex pseudos
            "not": markFunction(function (selector) {
              // Trim the selector passed to compile
              // to avoid treating leading and trailing
              // spaces as combinators
              var input = [],
                  results = [],
                  matcher = compile(selector.replace(rtrim, "$1"));
              return matcher[expando] ? markFunction(function (seed, matches, context, xml) {
                var elem,
                    unmatched = matcher(seed, null, xml, []),
                    i = seed.length; // Match elements unmatched by `matcher`

                while (i--) {
                  if (elem = unmatched[i]) {
                    seed[i] = !(matches[i] = elem);
                  }
                }
              }) : function (elem, context, xml) {
                input[0] = elem;
                matcher(input, null, xml, results); // Don't keep the element (issue #299)

                input[0] = null;
                return !results.pop();
              };
            }),
            "has": markFunction(function (selector) {
              if (typeof selector === "string") {
                Sizzle.compile(selector);
              }

              return function (elem) {
                return Sizzle(selector, elem).length > 0;
              };
            }),
            // Removed :contains pseudo-class declaration
            // "Whether an element is represented by a :lang() selector
            // is based solely on the element's language value
            // being equal to the identifier C,
            // or beginning with the identifier C immediately followed by "-".
            // The matching of C against the element's language value is performed case-insensitively.
            // The identifier C does not have to be a valid language name."
            // http://www.w3.org/TR/selectors/#lang-pseudo
            "lang": markFunction(function (lang) {
              // lang value must be a valid identifier
              if (!ridentifier.test(lang || "")) {
                Sizzle.error("unsupported lang: " + lang);
              }

              lang = lang.replace(runescape, funescape).toLowerCase();
              return function (elem) {
                var elemLang;

                do {
                  if (elemLang = documentIsHTML ? elem.lang : elem.getAttribute("xml:lang") || elem.getAttribute("lang")) {
                    elemLang = elemLang.toLowerCase();
                    return elemLang === lang || elemLang.indexOf(lang + "-") === 0;
                  }
                } while ((elem = elem.parentNode) && elem.nodeType === 1);

                return false;
              };
            }),
            // Miscellaneous
            "target": function target(elem) {
              var hash = window.location && window.location.hash;
              return hash && hash.slice(1) === elem.id;
            },
            "root": function root(elem) {
              return elem === docElem;
            },
            "focus": function focus(elem) {
              return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
            },
            // Boolean properties
            "enabled": createDisabledPseudo(false),
            "disabled": createDisabledPseudo(true),
            "checked": function checked(elem) {
              // In CSS3, :checked should return both checked and selected elements
              // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
              var nodeName = elem.nodeName.toLowerCase();
              return nodeName === "input" && !!elem.checked || nodeName === "option" && !!elem.selected;
            },
            "selected": function selected(elem) {
              // Accessing this property makes selected-by-default
              // options in Safari work properly
              if (elem.parentNode) {
                elem.parentNode.selectedIndex;
              }

              return elem.selected === true;
            },
            // Contents
            "empty": function empty(elem) {
              // http://www.w3.org/TR/selectors/#empty-pseudo
              // :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
              //   but not by others (comment: 8; processing instruction: 7; etc.)
              // nodeType < 6 works because attributes (2) do not appear as children
              for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                if (elem.nodeType < 6) {
                  return false;
                }
              }

              return true;
            } // Removed custom pseudo-classes

          }
        }; // Removed custom pseudo-classes
        // Easy API for creating new setFilters

        function setFilters() {}

        setFilters.prototype = Expr.filters = Expr.pseudos;
        Expr.setFilters = new setFilters();
        /**
         * [AdGuard Patch]:
         * Sorts the tokens in order to mitigate the performance issues caused by matching slow pseudos first:
         * https://github.com/AdguardTeam/ExtendedCss/issues/55#issuecomment-364058745
         */

        var sortTokenGroups = function () {
          /**
           * Splits compound selector into a list of simple selectors
           *
           * @param {*} tokens Tokens to split into groups
           * @returns an array consisting of token groups (arrays) and relation tokens.
           */
          var splitCompoundSelector = function splitCompoundSelector(tokens) {
            var groups = [];
            var currentTokensGroup = [];
            var maxIdx = tokens.length - 1;

            for (var i = 0; i <= maxIdx; i++) {
              var token = tokens[i];
              var relative = Sizzle.selectors.relative[token.type];

              if (relative) {
                groups.push(currentTokensGroup);
                groups.push(token);
                currentTokensGroup = [];
              } else {
                currentTokensGroup.push(token);
              }

              if (i === maxIdx) {
                groups.push(currentTokensGroup);
              }
            }

            return groups;
          };

          var TOKEN_TYPES_VALUES = {
            // nth-child, etc, always go last
            "CHILD": 100,
            "ID": 90,
            "CLASS": 80,
            "TAG": 70,
            "ATTR": 70,
            "PSEUDO": 60
          };
          var POSITIONAL_PSEUDOS = ["nth", "first", "last", "eq", "even", "odd", "lt", "gt", "not"];
          /**
           * A function that defines the sort order.
           * Returns a value lesser than 0 if "left" is less than "right".
           */

          var compareFunction = function compareFunction(left, right) {
            var leftValue = TOKEN_TYPES_VALUES[left.type];
            var rightValue = TOKEN_TYPES_VALUES[right.type];
            return leftValue - rightValue;
          };
          /**
           * Checks if the specified tokens group is sortable.
           * We do not re-sort tokens in case of any positional or child pseudos in the group
           */


          var isSortable = function isSortable(tokens) {
            var iTokens = tokens.length;

            while (iTokens--) {
              var token = tokens[iTokens];

              if (token.type === "PSEUDO" && POSITIONAL_PSEUDOS.indexOf(token.matches[0]) !== -1) {
                return false;
              }

              if (token.type === "CHILD") {
                return false;
              }
            }

            return true;
          };
          /**
           * Sorts the tokens in order to mitigate the issues caused by the left-to-right matching.
           * The idea is change the tokens order so that Sizzle was matching fast selectors first (id, class),
           * and slow selectors after that (and here I mean our slow custom pseudo classes).
           *
           * @param {Array} tokens An array of tokens to sort
           * @returns {Array} A new re-sorted array
           */


          var sortTokens = function sortTokens(tokens) {
            if (!tokens || tokens.length === 1) {
              return tokens;
            }

            var sortedTokens = [];
            var groups = splitCompoundSelector(tokens);

            for (var i = 0; i < groups.length; i++) {
              var group = groups[i];

              if (group instanceof Array) {
                if (isSortable(group)) {
                  group.sort(compareFunction);
                }

                sortedTokens = sortedTokens.concat(group);
              } else {
                sortedTokens.push(group);
              }
            }

            return sortedTokens;
          };
          /**
           * Sorts every tokens array inside of the specified "groups" array.
           * See "sortTokens" methods for more information on how tokens are sorted.
           *
           * @param {Array} groups An array of tokens arrays.
           * @returns {Array} A new array that consists of the same tokens arrays after sorting
           */


          var sortTokenGroups = function sortTokenGroups(groups) {
            var sortedGroups = [];
            var len = groups.length;
            var i = 0;

            for (; i < len; i++) {
              sortedGroups.push(sortTokens(groups[i]));
            }

            return sortedGroups;
          }; // Expose


          return sortTokenGroups;
        }();
        /**
         * Creates custom policy to use TrustedTypes CSP policy
         * https://w3c.github.io/webappsec-trusted-types/dist/spec/
         */


        var AGPolicy = function createPolicy() {
          var defaultPolicy = {
            createHTML: function createHTML(input) {
              return input;
            },
            createScript: function createScript(input) {
              return input;
            },
            createScriptURL: function createScriptURL(input) {
              return input;
            }
          };

          if (window.trustedTypes && window.trustedTypes.createPolicy) {
            return window.trustedTypes.createPolicy("AGPolicy", defaultPolicy);
          }

          return defaultPolicy;
        }();
        /**
         * [AdGuard Patch]:
         * Removes trailing spaces from the tokens list
         *
         * @param {*} tokens An array of Sizzle tokens to post-process
         */


        function removeTrailingSpaces(tokens) {
          var iTokens = tokens.length;

          while (iTokens--) {
            var token = tokens[iTokens];

            if (token.type === " ") {
              tokens.length = iTokens;
            } else {
              break;
            }
          }
        }
        /**
         * [AdGuard Patch]:
         * An object with the information about selectors and their token representation
         * @typedef {{selectorText: string, groups: Array}} SelectorData
         * @property {string} selectorText A CSS selector text
         * @property {Array} groups An array of token groups corresponding to that selector
         */

        /**
         * [AdGuard Patch]:
         * This method processes parsed token groups, divides them into a number of selectors
         * and makes sure that each selector's tokens are cached properly in Sizzle.
         *
         * @param {*} groups Token groups (see {@link Sizzle.tokenize})
         * @returns {Array.<SelectorData>} An array of selectors data we got from the groups
         */


        function tokenGroupsToSelectors(groups) {
          // Remove trailing spaces which we can encounter in tolerant mode
          // We're doing it in tolerant mode only as this is the only case when
          // encountering trailing spaces is expected
          removeTrailingSpaces(groups[groups.length - 1]); // We need sorted tokens to make cache work properly

          var sortedGroups = sortTokenGroups(groups);
          var selectors = [];

          for (var i = 0; i < groups.length; i++) {
            var tokenGroups = groups[i];
            var selectorText = toSelector(tokenGroups);
            selectors.push({
              // Sizzle expects an array of token groups when compiling a selector
              groups: [tokenGroups],
              selectorText: selectorText
            }); // Now make sure that selector tokens are cached

            var tokensCacheItem = {
              groups: tokenGroups,
              sortedGroups: [sortedGroups[i]]
            };
            tokenCache(selectorText, tokensCacheItem);
          }

          return selectors;
        }
        /**
         * [AdGuard Patch]:
         * Add an additional argument for Sizzle.tokenize which indicates that it
         * should not throw on invalid tokens, and instead should return tokens
         * that it has produced so far.
         *
         * One more additional argument that allow to choose if you want to receive sorted or unsorted tokens
         * The problem is that the re-sorted selectors are valid for Sizzle, but not for the browser.
         * options.returnUnsorted -- return unsorted tokens if true.
         * options.cacheOnly -- return cached result only. Required for unit-tests.
         *
         * @param {*} options Optional configuration object with two additional flags
         * (options.tolerant, options.returnUnsorted, options.cacheOnly) -- see patches #5 and #6 notes
         */


        tokenize = Sizzle.tokenize = function (selector, parseOnly, options) {
          var matched,
              match,
              tokens,
              type,
              soFar,
              groups,
              preFilters,
              cached = tokenCache[selector + " "];
          var tolerant = options && options.tolerant;
          var returnUnsorted = options && options.returnUnsorted;
          var cacheOnly = options && options.cacheOnly;

          if (cached) {
            if (parseOnly) {
              return 0;
            } else {
              return (returnUnsorted ? cached.groups : cached.sortedGroups).slice(0);
            }
          }

          if (cacheOnly) {
            return null;
          }

          soFar = selector;
          groups = [];
          preFilters = Expr.preFilter;

          while (soFar) {
            // Comma and first run
            if (!matched || (match = rcomma.exec(soFar))) {
              if (match) {
                // Don't consume trailing commas as valid
                soFar = soFar.slice(match[0].length) || soFar;
              }

              groups.push(tokens = []);
            }

            matched = false; // Combinators

            if (match = rcombinators.exec(soFar)) {
              matched = match.shift();
              tokens.push({
                value: matched,
                // Cast descendant combinators to space
                type: match[0].replace(rtrim, " ")
              });
              soFar = soFar.slice(matched.length);
            } // Filters


            for (type in Expr.filter) {
              if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
                matched = match.shift();
                tokens.push({
                  value: matched,
                  type: type,
                  matches: match
                });
                soFar = soFar.slice(matched.length);
              }
            }

            if (!matched) {
              break;
            }
          } // Return the length of the invalid excess
          // if we're just parsing
          // Otherwise, throw an error or return tokens


          var invalidLen = soFar.length;

          if (parseOnly) {
            return invalidLen;
          }

          if (invalidLen !== 0 && !tolerant) {
            Sizzle.error(selector); // Throws an error.
          }

          if (tolerant) {
            /**
             * [AdGuard Patch]:
             * In tolerant mode we return a special object that constists of
             * an array of parsed selectors (and their tokens) and a "nextIndex" field
             * that points to an index after which we're not able to parse selectors farther.
             */
            var nextIndex = selector.length - invalidLen;
            var selectors = tokenGroupsToSelectors(groups);
            return {
              selectors: selectors,
              nextIndex: nextIndex
            };
          }
          /** [AdGuard Patch]: Sorting tokens */


          var sortedGroups = sortTokenGroups(groups);
          /** [AdGuard Patch]: Change the way tokens are cached */

          var tokensCacheItem = {
            groups: groups,
            sortedGroups: sortedGroups
          };
          tokensCacheItem = tokenCache(selector, tokensCacheItem);
          return (returnUnsorted ? tokensCacheItem.groups : tokensCacheItem.sortedGroups).slice(0);
        };

        function toSelector(tokens) {
          var i = 0,
              len = tokens.length,
              selector = "";

          for (; i < len; i++) {
            selector += tokens[i].value;
          }

          return selector;
        }

        function addCombinator(matcher, combinator, base) {
          var dir = combinator.dir,
              skip = combinator.next,
              key = skip || dir,
              checkNonElements = base && key === "parentNode",
              doneName = done++;
          return combinator.first ? // Check against closest ancestor/preceding element
          function (elem, context, xml) {
            while (elem = elem[dir]) {
              if (elem.nodeType === 1 || checkNonElements) {
                return matcher(elem, context, xml);
              }
            }

            return false;
          } : // Check against all ancestor/preceding elements
          function (elem, context, xml) {
            var oldCache,
                uniqueCache,
                outerCache,
                newCache = [dirruns, doneName]; // We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching

            if (xml) {
              while (elem = elem[dir]) {
                if (elem.nodeType === 1 || checkNonElements) {
                  if (matcher(elem, context, xml)) {
                    return true;
                  }
                }
              }
            } else {
              while (elem = elem[dir]) {
                if (elem.nodeType === 1 || checkNonElements) {
                  outerCache = elem[expando] || (elem[expando] = {}); // Support: IE <9 only
                  // Defend against cloned attroperties (jQuery gh-1709)

                  uniqueCache = outerCache[elem.uniqueID] || (outerCache[elem.uniqueID] = {});

                  if (skip && skip === elem.nodeName.toLowerCase()) {
                    elem = elem[dir] || elem;
                  } else if ((oldCache = uniqueCache[key]) && oldCache[0] === dirruns && oldCache[1] === doneName) {
                    // Assign to newCache so results back-propagate to previous elements
                    return newCache[2] = oldCache[2];
                  } else {
                    // Reuse newcache so results back-propagate to previous elements
                    uniqueCache[key] = newCache; // A match means we're done; a fail means we have to keep checking

                    if (newCache[2] = matcher(elem, context, xml)) {
                      return true;
                    }
                  }
                }
              }
            }

            return false;
          };
        }

        function elementMatcher(matchers) {
          return matchers.length > 1 ? function (elem, context, xml) {
            var i = matchers.length;

            while (i--) {
              if (!matchers[i](elem, context, xml)) {
                return false;
              }
            }

            return true;
          } : matchers[0];
        }

        function multipleContexts(selector, contexts, results) {
          var i = 0,
              len = contexts.length;

          for (; i < len; i++) {
            Sizzle(selector, contexts[i], results);
          }

          return results;
        }

        function condense(unmatched, map, filter, context, xml) {
          var elem,
              newUnmatched = [],
              i = 0,
              len = unmatched.length,
              mapped = map != null;

          for (; i < len; i++) {
            if (elem = unmatched[i]) {
              if (!filter || filter(elem, context, xml)) {
                newUnmatched.push(elem);

                if (mapped) {
                  map.push(i);
                }
              }
            }
          }

          return newUnmatched;
        }

        function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
          if (postFilter && !postFilter[expando]) {
            postFilter = setMatcher(postFilter);
          }

          if (postFinder && !postFinder[expando]) {
            postFinder = setMatcher(postFinder, postSelector);
          }

          return markFunction(function (seed, results, context, xml) {
            var temp,
                i,
                elem,
                preMap = [],
                postMap = [],
                preexisting = results.length,
                // Get initial elements from seed or context
            elems = seed || multipleContexts(selector || "*", context.nodeType ? [context] : context, []),
                // Prefilter to get matcher input, preserving a map for seed-results synchronization
            matcherIn = preFilter && (seed || !selector) ? condense(elems, preMap, preFilter, context, xml) : elems,
                matcherOut = matcher ? // If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
            postFinder || (seed ? preFilter : preexisting || postFilter) ? // ...intermediate processing is necessary
            [] : // ...otherwise use results directly
            results : matcherIn; // Find primary matches

            if (matcher) {
              matcher(matcherIn, matcherOut, context, xml);
            } // Apply postFilter


            if (postFilter) {
              temp = condense(matcherOut, postMap);
              postFilter(temp, [], context, xml); // Un-match failing elements by moving them back to matcherIn

              i = temp.length;

              while (i--) {
                if (elem = temp[i]) {
                  matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);
                }
              }
            }

            if (seed) {
              if (postFinder || preFilter) {
                if (postFinder) {
                  // Get the final matcherOut by condensing this intermediate into postFinder contexts
                  temp = [];
                  i = matcherOut.length;

                  while (i--) {
                    if (elem = matcherOut[i]) {
                      // Restore matcherIn since elem is not yet a final match
                      temp.push(matcherIn[i] = elem);
                    }
                  }

                  postFinder(null, matcherOut = [], temp, xml);
                } // Move matched elements from seed to results to keep them synchronized


                i = matcherOut.length;

                while (i--) {
                  if ((elem = matcherOut[i]) && (temp = postFinder ? indexOf(seed, elem) : preMap[i]) > -1) {
                    seed[temp] = !(results[temp] = elem);
                  }
                }
              } // Add elements to results, through postFinder if defined

            } else {
              matcherOut = condense(matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut);

              if (postFinder) {
                postFinder(null, results, matcherOut, xml);
              } else {
                push.apply(results, matcherOut);
              }
            }
          });
        }

        function matcherFromTokens(tokens) {
          var checkContext,
              matcher,
              j,
              len = tokens.length,
              leadingRelative = Expr.relative[tokens[0].type],
              implicitRelative = leadingRelative || Expr.relative[" "],
              i = leadingRelative ? 1 : 0,
              // The foundational matcher ensures that elements are reachable from top-level context(s)
          matchContext = addCombinator(function (elem) {
            return elem === checkContext;
          }, implicitRelative, true),
              matchAnyContext = addCombinator(function (elem) {
            return indexOf(checkContext, elem) > -1;
          }, implicitRelative, true),
              matchers = [function (elem, context, xml) {
            var ret = !leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml)); // Avoid hanging onto element (issue #299)

            checkContext = null;
            return ret;
          }];

          for (; i < len; i++) {
            if (matcher = Expr.relative[tokens[i].type]) {
              matchers = [addCombinator(elementMatcher(matchers), matcher)];
            } else {
              matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches); // Return special upon seeing a positional matcher

              if (matcher[expando]) {
                // Find the next relative operator (if any) for proper handling
                j = ++i;

                for (; j < len; j++) {
                  if (Expr.relative[tokens[j].type]) {
                    break;
                  }
                }

                return setMatcher(i > 1 && elementMatcher(matchers), i > 1 && toSelector( // If the preceding token was a descendant combinator, insert an implicit any-element `*`
                tokens.slice(0, i - 1).concat({
                  value: tokens[i - 2].type === " " ? "*" : ""
                })).replace(rtrim, "$1"), matcher, i < j && matcherFromTokens(tokens.slice(i, j)), j < len && matcherFromTokens(tokens = tokens.slice(j)), j < len && toSelector(tokens));
              }

              matchers.push(matcher);
            }
          }

          return elementMatcher(matchers);
        }

        function matcherFromGroupMatchers(elementMatchers, setMatchers) {
          var bySet = setMatchers.length > 0,
              byElement = elementMatchers.length > 0,
              superMatcher = function superMatcher(seed, context, xml, results, outermost) {
            var elem,
                j,
                matcher,
                matchedCount = 0,
                i = "0",
                unmatched = seed && [],
                setMatched = [],
                contextBackup = outermostContext,
                // We must always have either seed elements or outermost context
            elems = seed || byElement && Expr.find["TAG"]("*", outermost),
                // Use integer dirruns iff this is the outermost matcher
            dirrunsUnique = dirruns += contextBackup == null ? 1 : Math.random() || 0.1,
                len = elems.length;

            if (outermost) {
              outermostContext = context === document || context || outermost;
            } // Add elements passing elementMatchers directly to results
            // Support: IE<9, Safari
            // Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id


            for (; i !== len && (elem = elems[i]) != null; i++) {
              if (byElement && elem) {
                j = 0;

                if (!context && elem.ownerDocument !== document) {
                  setDocument(elem);
                  xml = !documentIsHTML;
                }

                while (matcher = elementMatchers[j++]) {
                  if (matcher(elem, context || document, xml)) {
                    results.push(elem);
                    break;
                  }
                }

                if (outermost) {
                  dirruns = dirrunsUnique;
                }
              } // Track unmatched elements for set filters


              if (bySet) {
                // They will have gone through all possible matchers
                if (elem = !matcher && elem) {
                  matchedCount--;
                } // Lengthen the array for every element, matched or not


                if (seed) {
                  unmatched.push(elem);
                }
              }
            } // `i` is now the count of elements visited above, and adding it to `matchedCount`
            // makes the latter nonnegative.


            matchedCount += i; // Apply set filters to unmatched elements
            // NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
            // equals `i`), unless we didn't visit _any_ elements in the above loop because we have
            // no element matchers and no seed.
            // Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
            // case, which will result in a "00" `matchedCount` that differs from `i` but is also
            // numerically zero.

            if (bySet && i !== matchedCount) {
              j = 0;

              while (matcher = setMatchers[j++]) {
                matcher(unmatched, setMatched, context, xml);
              }

              if (seed) {
                // Reintegrate element matches to eliminate the need for sorting
                if (matchedCount > 0) {
                  while (i--) {
                    if (!(unmatched[i] || setMatched[i])) {
                      setMatched[i] = pop.call(results);
                    }
                  }
                } // Discard index placeholder values to get only actual matches


                setMatched = condense(setMatched);
              } // Add matches to results


              push.apply(results, setMatched); // Seedless set matches succeeding multiple successful matchers stipulate sorting

              if (outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1) {
                Sizzle.uniqueSort(results);
              }
            } // Override manipulation of globals by nested matchers


            if (outermost) {
              dirruns = dirrunsUnique;
              outermostContext = contextBackup;
            }

            return unmatched;
          };

          return bySet ? markFunction(superMatcher) : superMatcher;
        }

        compile = Sizzle.compile = function (selector, match
        /* Internal Use Only */
        ) {
          var i,
              setMatchers = [],
              elementMatchers = [],
              cached = compilerCache[selector + " "];

          if (!cached) {
            // Generate a function of recursive functions that can be used to check each element
            if (!match) {
              match = tokenize(selector);
            }

            i = match.length;

            while (i--) {
              cached = matcherFromTokens(match[i]);

              if (cached[expando]) {
                setMatchers.push(cached);
              } else {
                elementMatchers.push(cached);
              }
            } // Cache the compiled function


            cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers)); // Save selector and tokenization

            cached.selector = selector;
          }

          return cached;
        };
        /**
         * A low-level selection function that works with Sizzle's compiled
         *  selector functions
         * @param {String|Function} selector A selector or a pre-compiled
         *  selector function built with Sizzle.compile
         * @param {Element} context
         * @param {Array} [results]
         * @param {Array} [seed] A set of elements to match against
         */


        select = Sizzle.select = function (selector, context, results, seed) {
          var i,
              tokens,
              token,
              type,
              find,
              compiled = typeof selector === "function" && selector,
              match = !seed && tokenize(selector = compiled.selector || selector);
          results = results || []; // Try to minimize operations if there is only one selector in the list and no seed
          // (the latter of which guarantees us context)

          if (match.length === 1) {
            // Reduce context if the leading compound selector is an ID
            tokens = match[0] = match[0].slice(0);

            if (tokens.length > 2 && (token = tokens[0]).type === "ID" && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]) {
              context = (Expr.find["ID"](token.matches[0].replace(runescape, funescape), context) || [])[0];

              if (!context) {
                return results; // Precompiled matchers will still verify ancestry, so step up a level
              } else if (compiled) {
                context = context.parentNode;
              }

              selector = selector.slice(tokens.shift().value.length);
            } // Fetch a seed set for right-to-left matching


            i = matchExpr["needsContext"].test(selector) ? 0 : tokens.length;

            while (i--) {
              token = tokens[i]; // Abort if we hit a combinator

              if (Expr.relative[type = token.type]) {
                break;
              }

              if (find = Expr.find[type]) {
                // Search, expanding context for leading sibling combinators
                if (seed = find(token.matches[0].replace(runescape, funescape), rsibling.test(tokens[0].type) && testContext(context.parentNode) || context)) {
                  // If seed is empty or no tokens remain, we can return early
                  tokens.splice(i, 1);
                  selector = seed.length && toSelector(tokens);

                  if (!selector) {
                    push.apply(results, seed);
                    return results;
                  }

                  break;
                }
              }
            }
          } // Compile and execute a filtering function if one is not provided
          // Provide `match` to avoid retokenization if we modified the selector above


          (compiled || compile(selector, match))(seed, context, !documentIsHTML, results, !context || rsibling.test(selector) && testContext(context.parentNode) || context);
          return results;
        }; // One-time assignments
        // Sort stability


        support.sortStable = expando.split("").sort(sortOrder).join("") === expando; // Support: Chrome 14-35+
        // Always assume duplicates if they aren't passed to the comparison function

        support.detectDuplicates = !!hasDuplicate; // Initialize against the default document

        setDocument(); // Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
        // Detached nodes confoundingly follow *each other*

        support.sortDetached = assert(function (el) {
          // Should return 1, but returns 4 (following)
          return el.compareDocumentPosition(document.createElement("fieldset")) & 1;
        }); // Support: IE<8
        // Prevent attribute/property "interpolation"
        // https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx

        if (!assert(function (el) {
          el.innerHTML = AGPolicy.createHTML("<a href='#'></a>");
          return el.firstChild.getAttribute("href") === "#";
        })) {
          addHandle("type|href|height|width", function (elem, name, isXML) {
            if (!isXML) {
              return elem.getAttribute(name, name.toLowerCase() === "type" ? 1 : 2);
            }
          });
        } // Support: IE<9
        // Use defaultValue in place of getAttribute("value")


        if (!support.attributes || !assert(function (el) {
          el.innerHTML = AGPolicy.createHTML("<input/>");
          el.firstChild.setAttribute("value", "");
          return el.firstChild.getAttribute("value") === "";
        })) {
          addHandle("value", function (elem, name, isXML) {
            if (!isXML && elem.nodeName.toLowerCase() === "input") {
              return elem.defaultValue;
            }
          });
        } // Support: IE<9
        // Use getAttributeNode to fetch booleans when getAttribute lies


        if (!assert(function (el) {
          return el.getAttribute("disabled") == null;
        })) {
          addHandle(booleans, function (elem, name, isXML) {
            var val;

            if (!isXML) {
              return elem[name] === true ? name.toLowerCase() : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null;
            }
          });
        } // EXPOSE
        // Do not expose Sizzle to the global scope in the case of AdGuard ExtendedCss build


        return Sizzle; // EXPOSE
      }(window); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    }

    return Sizzle;
  };

  /* jshint ignore:end */

  /**
   * Copyright 2016 Adguard Software Ltd
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
  /**
   * Class that extends Sizzle and adds support for "matches-css" pseudo element.
   */

  var StylePropertyMatcher = function (window) {
    var isPhantom = !!window._phantom;
    var useFallback = isPhantom && !!window.getMatchedCSSRules;
    /**
     * Unquotes specified value
     * Webkit-based browsers singlequotes <string> content property values
     * Other browsers doublequotes content property values.
     */

    var removeContentQuotes = function removeContentQuotes(value) {
      if (typeof value === 'string') {
        return value.replace(/^(["'])([\s\S]*)\1$/, '$2');
      }

      return value;
    };

    var getComputedStyle = window.getComputedStyle.bind(window);
    var getMatchedCSSRules = useFallback ? window.getMatchedCSSRules.bind(window) : null;
    /**
     * There is an issue in browsers based on old webkit:
     * getComputedStyle(el, ":before") is empty if element is not visible.
     *
     * To circumvent this issue we use getMatchedCSSRules instead.
     *
     * It appears that getMatchedCSSRules sorts the CSS rules
     * in increasing order of specifities of corresponding selectors.
     * We pick the css rule that is being applied to an element based on this assumption.
     *
     * @param element       DOM node
     * @param pseudoElement Optional pseudoElement name
     * @param propertyName  CSS property name
     */

    var getComputedStylePropertyValue = function getComputedStylePropertyValue(element, pseudoElement, propertyName) {
      var value = '';

      if (useFallback && pseudoElement) {
        var cssRules = getMatchedCSSRules(element, pseudoElement) || [];
        var i = cssRules.length;

        while (i-- > 0 && !value) {
          value = cssRules[i].style.getPropertyValue(propertyName);
        }
      } else {
        var style = getComputedStyle(element, pseudoElement);

        if (style) {
          value = style.getPropertyValue(propertyName); // https://bugs.webkit.org/show_bug.cgi?id=93445

          if (propertyName === 'opacity' && utils.isSafariBrowser) {
            value = (Math.round(parseFloat(value) * 100) / 100).toString();
          }
        }
      }

      if (propertyName === 'content') {
        value = removeContentQuotes(value);
      }

      return value;
    };
    /**
     * Adds url parameter quotes for non-regex pattern
     * @param {string} pattern
     */


    var addUrlQuotes = function addUrlQuotes(pattern) {
      // for regex patterns
      if (pattern[0] === '/' && pattern[pattern.length - 1] === '/' && pattern.indexOf('\\"') < 10) {
        // e.g. /^url\\([a-z]{4}:[a-z]{5}/
        // or /^url\\(data\\:\\image\\/gif;base64.+/
        var re = /(\^)?url(\\)?\\\((\w|\[\w)/g;
        return pattern.replace(re, '$1url$2\\\(\\"?$3');
      } // for non-regex patterns


      if (pattern.indexOf('url("') === -1) {
        var _re = /url\((.*?)\)/g;
        return pattern.replace(_re, 'url("$1")');
      }

      return pattern;
    };
    /**
     * Class that matches element style against the specified expression
     * @member {string} propertyName
     * @member {string} pseudoElement
     * @member {RegExp} regex
     */


    var Matcher = function Matcher(propertyFilter, pseudoElement) {
      this.pseudoElement = pseudoElement;

      try {
        var index = propertyFilter.indexOf(':');
        this.propertyName = propertyFilter.substring(0, index).trim();
        var pattern = propertyFilter.substring(index + 1).trim();
        pattern = addUrlQuotes(pattern); // Unescaping pattern
        // For non-regex patterns, (,),[,] should be unescaped, because we require escaping them in filter rules.
        // For regex patterns, ",\ should be escaped, because we manually escape those in extended-css-selector.js.

        if (/^\/.*\/$/.test(pattern)) {
          pattern = pattern.slice(1, -1);
          this.regex = utils.pseudoArgToRegex(pattern);
        } else {
          pattern = pattern.replace(/\\([\\()[\]"])/g, '$1');
          this.regex = utils.createURLRegex(pattern);
        }
      } catch (ex) {
        utils.logError("StylePropertyMatcher: invalid match string ".concat(propertyFilter));
      }
    };
    /**
     * Function to check if element CSS property matches filter pattern
     * @param {Element} element to check
     */


    Matcher.prototype.matches = function (element) {
      if (!this.regex || !this.propertyName) {
        return false;
      }

      var value = getComputedStylePropertyValue(element, this.pseudoElement, this.propertyName);
      return value && this.regex.test(value);
    };
    /**
     * Creates a new pseudo-class and registers it in Sizzle
     */


    var extendSizzle = function extendSizzle(sizzle) {
      // First of all we should prepare Sizzle engine
      sizzle.selectors.pseudos['matches-css'] = sizzle.selectors.createPseudo(function (propertyFilter) {
        var matcher = new Matcher(propertyFilter);
        return function (element) {
          return matcher.matches(element);
        };
      });
      sizzle.selectors.pseudos['matches-css-before'] = sizzle.selectors.createPseudo(function (propertyFilter) {
        var matcher = new Matcher(propertyFilter, ':before');
        return function (element) {
          return matcher.matches(element);
        };
      });
      sizzle.selectors.pseudos['matches-css-after'] = sizzle.selectors.createPseudo(function (propertyFilter) {
        var matcher = new Matcher(propertyFilter, ':after');
        return function (element) {
          return matcher.matches(element);
        };
      });
    }; // EXPOSE


    return {
      extendSizzle: extendSizzle
    };
  }(window);

  /**
   * Copyright 2016 Adguard Software Ltd
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
  var matcherUtils = {};
  matcherUtils.MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  /**
   * Parses argument of matcher pseudo (for matches-attr and matches-property)
   * @param {string} matcherFilter argument of pseudo class
   * @returns {Array}
   */

  matcherUtils.parseMatcherFilter = function (matcherFilter) {
    var FULL_MATCH_MARKER = '"="';
    var rawArgs = [];

    if (matcherFilter.indexOf(FULL_MATCH_MARKER) === -1) {
      // if there is only one pseudo arg
      // e.g. :matches-attr("data-name") or :matches-property("inner.prop")
      // Sizzle will parse it and get rid of quotes
      // so it might be valid arg already without them
      rawArgs.push(matcherFilter);
    } else {
      matcherFilter.split('=').forEach(function (arg) {
        if (arg[0] === '"' && arg[arg.length - 1] === '"') {
          rawArgs.push(arg.slice(1, -1));
        }
      });
    }

    return rawArgs;
  };
  /**
   * @typedef {Object} ArgData
   * @property {string} arg
   * @property {boolean} isRegexp
   */

  /**
   * Parses raw matcher arg
   * @param {string} rawArg
   * @returns {ArgData}
   */


  matcherUtils.parseRawMatcherArg = function (rawArg) {
    var arg = rawArg;
    var isRegexp = !!rawArg && rawArg[0] === '/' && rawArg[rawArg.length - 1] === '/';

    if (isRegexp) {
      // to avoid at least such case — :matches-property("//")
      if (rawArg.length > 2) {
        arg = utils.toRegExp(rawArg);
      } else {
        throw new Error("Invalid regexp: ".concat(rawArg));
      }
    }

    return {
      arg: arg,
      isRegexp: isRegexp
    };
  };
  /**
   * @typedef Chain
   * @property {Object} base
   * @property {string} prop
   * @property {string} value
   */

  /**
   * Checks if the property exists in the base object (recursively).
   * @param {Object} base
   * @param {ArgData[]} chain array of objects - parsed string property chain
   * @param {Array} [output=[]] result acc
   * @returns {Chain[]} array of objects
   */


  matcherUtils.filterRootsByRegexpChain = function (base, chain) {
    var output = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    var tempProp = chain[0];

    if (chain.length === 1) {
      // eslint-disable-next-line no-restricted-syntax
      for (var key in base) {
        if (tempProp.isRegexp) {
          if (tempProp.arg.test(key)) {
            output.push({
              base: base,
              prop: key,
              value: base[key]
            });
          }
        } else if (tempProp.arg === key) {
          output.push({
            base: base,
            prop: tempProp.arg,
            value: base[key]
          });
        }
      }

      return output;
    } // if there is a regexp prop in input chain
    // e.g. 'unit./^ad.+/.src' for 'unit.ad-1gf2.src unit.ad-fgd34.src'),
    // every base keys should be tested by regexp and it can be more that one results


    if (tempProp.isRegexp) {
      var nextProp = chain.slice(1);
      var baseKeys = []; // eslint-disable-next-line no-restricted-syntax

      for (var _key in base) {
        if (tempProp.arg.test(_key)) {
          baseKeys.push(_key);
        }
      }

      baseKeys.forEach(function (key) {
        var item = base[key];
        matcherUtils.filterRootsByRegexpChain(item, nextProp, output);
      });
    } // avoid TypeError while accessing to null-prop's child


    if (base === null) {
      return;
    }

    var nextBase = base[tempProp.arg];
    chain = chain.slice(1);

    if (nextBase !== undefined) {
      matcherUtils.filterRootsByRegexpChain(nextBase, chain, output);
    }

    return output;
  };
  /**
   * Validates parsed args of matches-property pseudo
   * @param {...ArgData} args
   */


  matcherUtils.validatePropMatcherArgs = function () {
    for (var _len = arguments.length, args = new Array(_len), _key2 = 0; _key2 < _len; _key2++) {
      args[_key2] = arguments[_key2];
    }

    for (var i = 0; i < args.length; i += 1) {
      if (args[i].isRegexp) {
        if (!utils.startsWith(args[i].arg.toString(), '/') || !utils.endsWith(args[i].arg.toString(), '/')) {
          return false;
        } // simple arg check if it is not a regexp

      } else if (!/^[\w-]+$/.test(args[i].arg)) {
        return false;
      }
    }

    return true;
  };

  /**
   * Class that extends Sizzle and adds support for "matches-attr" pseudo element.
   */

  var AttributesMatcher = function () {
    /**
     * Class that matches element attributes against the specified expressions
     * @param {ArgData} nameArg - parsed name argument
     * @param {ArgData} valueArg - parsed value argument
     * @param {string} pseudoElement
     * @constructor
     *
     * @member {string|RegExp} attrName
     * @member {boolean} isRegexpName
     * @member {string|RegExp} attrValue
     * @member {boolean} isRegexpValue
     */
    var AttrMatcher = function AttrMatcher(nameArg, valueArg, pseudoElement) {
      this.pseudoElement = pseudoElement;
      this.attrName = nameArg.arg;
      this.isRegexpName = nameArg.isRegexp;
      this.attrValue = valueArg.arg;
      this.isRegexpValue = valueArg.isRegexp;
    };
    /**
     * Function to check if element attributes matches filter pattern
     * @param {Element} element to check
     */


    AttrMatcher.prototype.matches = function (element) {
      var elAttrs = element.attributes;

      if (elAttrs.length === 0 || !this.attrName) {
        return false;
      }

      var i = 0;

      while (i < elAttrs.length) {
        var attr = elAttrs[i];
        var matched = false;
        var attrNameMatched = this.isRegexpName ? this.attrName.test(attr.name) : this.attrName === attr.name;

        if (!this.attrValue) {
          // for :matches-attr("/regex/") or :matches-attr("attr-name")
          matched = attrNameMatched;
        } else {
          var attrValueMatched = this.isRegexpValue ? this.attrValue.test(attr.value) : this.attrValue === attr.value;
          matched = attrNameMatched && attrValueMatched;
        }

        if (matched) {
          return true;
        }

        i += 1;
      }
    };
    /**
     * Creates a new pseudo-class and registers it in Sizzle
     */


    var extendSizzle = function extendSizzle(sizzle) {
      // First of all we should prepare Sizzle engine
      sizzle.selectors.pseudos['matches-attr'] = sizzle.selectors.createPseudo(function (attrFilter) {
        var _matcherUtils$parseMa = matcherUtils.parseMatcherFilter(attrFilter),
            _matcherUtils$parseMa2 = _slicedToArray(_matcherUtils$parseMa, 2),
            rawName = _matcherUtils$parseMa2[0],
            rawValue = _matcherUtils$parseMa2[1];

        var nameArg = matcherUtils.parseRawMatcherArg(rawName);
        var valueArg = matcherUtils.parseRawMatcherArg(rawValue);

        if (!attrFilter || !matcherUtils.validatePropMatcherArgs(nameArg, valueArg)) {
          throw new Error("Invalid argument of :matches-attr pseudo class: ".concat(attrFilter));
        }

        var matcher = new AttrMatcher(nameArg, valueArg);
        return function (element) {
          return matcher.matches(element);
        };
      });
    }; // EXPOSE


    return {
      extendSizzle: extendSizzle
    };
  }();

  /**
   * Parses raw property arg
   * @param {string} input
   * @returns {ArgData[]} array of objects
   */

  var parseRawPropChain = function parseRawPropChain(input) {
    var PROPS_DIVIDER = '.';
    var REGEXP_MARKER = '/';
    var propsArr = [];
    var str = input;

    while (str.length > 0) {
      if (utils.startsWith(str, PROPS_DIVIDER)) {
        // for cases like '.prop.id' and 'nested..test'
        throw new Error("Invalid chain property: ".concat(input));
      }

      if (!utils.startsWith(str, REGEXP_MARKER)) {
        var isRegexp = false;
        var dividerIndex = str.indexOf(PROPS_DIVIDER);

        if (str.indexOf(PROPS_DIVIDER) === -1) {
          // if there is no '.' left in str
          // take the rest of str as prop
          propsArr.push({
            arg: str,
            isRegexp: isRegexp
          });
          return propsArr;
        } // else take prop from str


        var prop = str.slice(0, dividerIndex); // for cases like 'asadf.?+/.test'

        if (prop.indexOf(REGEXP_MARKER) > -1) {
          // prop is '?+/'
          throw new Error("Invalid chain property: ".concat(prop));
        }

        propsArr.push({
          arg: prop,
          isRegexp: isRegexp
        }); // delete prop from str

        str = str.slice(dividerIndex);
      } else {
        // deal with regexp
        var propChunks = [];
        propChunks.push(str.slice(0, 1)); // if str starts with '/', delete it from str and find closing regexp slash.
        // note that chained property name can not include '/' or '.'
        // so there is no checking for escaped characters

        str = str.slice(1);
        var regexEndIndex = str.indexOf(REGEXP_MARKER);

        if (regexEndIndex < 1) {
          // regexp should be at least === '/./'
          // so we should avoid args like '/id' and 'test.//.id'
          throw new Error("Invalid regexp: ".concat(REGEXP_MARKER).concat(str));
        }

        var _isRegexp = true; // take the rest regexp part

        propChunks.push(str.slice(0, regexEndIndex + 1));

        var _prop = utils.toRegExp(propChunks.join(''));

        propsArr.push({
          arg: _prop,
          isRegexp: _isRegexp
        }); // delete prop from str

        str = str.slice(regexEndIndex + 1);
      }

      if (!str) {
        return propsArr;
      } // str should be like '.nextProp' now
      // so 'zx.prop' or '.' is invalid


      if (!utils.startsWith(str, PROPS_DIVIDER) || utils.startsWith(str, PROPS_DIVIDER) && str.length === 1) {
        throw new Error("Invalid chain property: ".concat(input));
      }

      str = str.slice(1);
    }
  };

  var convertTypeFromStr = function convertTypeFromStr(value) {
    var numValue = Number(value);
    var output;

    if (!Number.isNaN(numValue)) {
      output = numValue;
    } else {
      switch (value) {
        case 'undefined':
          output = undefined;
          break;

        case 'null':
          output = null;
          break;

        case 'true':
          output = true;
          break;

        case 'false':
          output = false;
          break;

        default:
          output = value;
      }
    }

    return output;
  };

  var convertTypeIntoStr = function convertTypeIntoStr(value) {
    var output;

    switch (value) {
      case undefined:
        output = 'undefined';
        break;

      case null:
        output = 'null';
        break;

      default:
        output = value.toString();
    }

    return output;
  };
  /**
   * Class that extends Sizzle and adds support for "matches-property" pseudo element.
   */


  var ElementPropertyMatcher = function () {
    /**
     * Class that matches element properties against the specified expressions
     * @param {ArgData[]} propsChainArg - array of parsed props chain objects
     * @param {ArgData} valueArg - parsed value argument
     * @param {string} pseudoElement
     * @constructor
     *
     * @member {Array} chainedProps
     * @member {boolean} isRegexpName
     * @member {string|RegExp} propValue
     * @member {boolean} isRegexpValue
     */
    var PropMatcher = function PropMatcher(propsChainArg, valueArg, pseudoElement) {
      this.pseudoElement = pseudoElement;
      this.chainedProps = propsChainArg;
      this.propValue = valueArg.arg;
      this.isRegexpValue = valueArg.isRegexp;
    };
    /**
     * Function to check if element properties matches filter pattern
     * @param {Element} element to check
     */


    PropMatcher.prototype.matches = function (element) {
      var ownerObjArr = matcherUtils.filterRootsByRegexpChain(element, this.chainedProps);

      if (ownerObjArr.length === 0) {
        return false;
      }

      var matched = true;

      if (this.propValue) {
        for (var i = 0; i < ownerObjArr.length; i += 1) {
          var realValue = ownerObjArr[i].value;

          if (this.isRegexpValue) {
            matched = this.propValue.test(convertTypeIntoStr(realValue));
          } else {
            // handle 'null' and 'undefined' property values set as string
            if (realValue === 'null' || realValue === 'undefined') {
              matched = this.propValue === realValue;
              break;
            }

            matched = convertTypeFromStr(this.propValue) === realValue;
          }

          if (matched) {
            break;
          }
        }
      }

      return matched;
    };
    /**
     * Creates a new pseudo-class and registers it in Sizzle
     */


    var extendSizzle = function extendSizzle(sizzle) {
      // First of all we should prepare Sizzle engine
      sizzle.selectors.pseudos['matches-property'] = sizzle.selectors.createPseudo(function (propertyFilter) {
        if (!propertyFilter) {
          throw new Error('No argument is given for :matches-property pseudo class');
        }

        var _matcherUtils$parseMa = matcherUtils.parseMatcherFilter(propertyFilter),
            _matcherUtils$parseMa2 = _slicedToArray(_matcherUtils$parseMa, 2),
            rawProp = _matcherUtils$parseMa2[0],
            rawValue = _matcherUtils$parseMa2[1]; // chained property name can not include '/' or '.'
        // so regex prop names with such escaped characters are invalid


        if (rawProp.indexOf('\\/') > -1 || rawProp.indexOf('\\.') > -1) {
          throw new Error("Invalid property name: ".concat(rawProp));
        }

        var propsChainArg = parseRawPropChain(rawProp);
        var valueArg = matcherUtils.parseRawMatcherArg(rawValue);
        var propsToValidate = [].concat(_toConsumableArray(propsChainArg), [valueArg]);

        if (!matcherUtils.validatePropMatcherArgs(propsToValidate)) {
          throw new Error("Invalid argument of :matches-property pseudo class: ".concat(propertyFilter));
        }

        var matcher = new PropMatcher(propsChainArg, valueArg);
        return function (element) {
          return matcher.matches(element);
        };
      });
    }; // EXPOSE


    return {
      extendSizzle: extendSizzle
    };
  }();

  /**
   * Copyright 2020 Adguard Software Ltd
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
  /**
   * Class that extends Sizzle and adds support for :is() pseudo element.
   */

  var IsAnyMatcher = function () {
    /**
     * Class that matches element by one of the selectors
     * https://developer.mozilla.org/en-US/docs/Web/CSS/:is
     * @param {Array} selectors
     * @param {string} pseudoElement
     * @constructor
     */
    var IsMatcher = function IsMatcher(selectors, pseudoElement) {
      this.selectors = selectors;
      this.pseudoElement = pseudoElement;
    };
    /**
     * Function to check if element can be matched by any passed selector
     * @param {Element} element to check
     */


    IsMatcher.prototype.matches = function (element) {
      var isMatched = !!this.selectors.find(function (selector) {
        var nodes = document.querySelectorAll(selector);
        return Array.from(nodes).find(function (node) {
          return node === element;
        });
      });
      return isMatched;
    };
    /**
     * Creates a new pseudo-class and registers it in Sizzle
     */


    var extendSizzle = function extendSizzle(sizzle) {
      // First of all we should prepare Sizzle engine
      sizzle.selectors.pseudos['is'] = sizzle.selectors.createPseudo(function (input) {
        if (input === '') {
          throw new Error("Invalid argument of :is pseudo-class: ".concat(input));
        }

        var selectors = input.split(',').map(function (s) {
          return s.trim();
        }); // collect valid selectors and log about invalid ones

        var validSelectors = selectors.reduce(function (acc, selector) {
          if (cssUtils.isSimpleSelectorValid(selector)) {
            acc.push(selector);
          } else {
            utils.logInfo("Invalid selector passed to :is() pseudo-class: '".concat(selector, "'"));
          }

          return acc;
        }, []);
        var matcher = new IsMatcher(validSelectors);
        return function (element) {
          return matcher.matches(element);
        };
      });
    };

    return {
      extendSizzle: extendSizzle
    };
  }();

  /**
   * Copyright 2021 Adguard Software Ltd
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
  /**
   * Extended selector factory module, for creating extended selector classes.
   *
   * Extended selection capabilities description:
   * https://github.com/AdguardTeam/ExtendedCss/blob/master/README.md
   */

  var ExtendedSelectorFactory = function () {
    // while adding new markers, constants in other AdGuard repos should be corrected
    // AdGuard browser extension : CssFilterRule.SUPPORTED_PSEUDO_CLASSES and CssFilterRule.EXTENDED_CSS_MARKERS
    // tsurlfilter, SafariConverterLib : EXT_CSS_PSEUDO_INDICATORS
    var PSEUDO_EXTENSIONS_MARKERS = [':has', ':contains', ':has-text', ':matches-css', ':-abp-has', ':-abp-has-text', ':if', ':if-not', ':xpath', ':nth-ancestor', ':upward', ':remove', ':matches-attr', ':matches-property', ':-abp-contains', ':is'];
    var initialized = false;
    var Sizzle;
    /**
     * Lazy initialization of the ExtendedSelectorFactory and objects that might be necessary for creating and applying styles.
     * This method extends Sizzle engine that we use under the hood with our custom pseudo-classes.
     */

    function initialize() {
      if (initialized) {
        return;
      }

      initialized = true; // Our version of Sizzle is initialized lazily as well

      Sizzle = initializeSizzle(); // Add :matches-css-*() support

      StylePropertyMatcher.extendSizzle(Sizzle); // Add :matches-attr() support

      AttributesMatcher.extendSizzle(Sizzle); // Add :matches-property() support

      ElementPropertyMatcher.extendSizzle(Sizzle); // Add :is() support

      IsAnyMatcher.extendSizzle(Sizzle); // Add :contains, :has-text, :-abp-contains support

      var containsPseudo = Sizzle.selectors.createPseudo(function (text) {
        if (/^\s*\/.*\/[gmisuy]*\s*$/.test(text)) {
          text = text.trim();
          var flagsIndex = text.lastIndexOf('/');
          var flags = text.substring(flagsIndex + 1);
          text = text.substr(0, flagsIndex + 1).slice(1, -1).replace(/\\([\\"])/g, '$1');
          var regex;

          try {
            regex = new RegExp(text, flags);
          } catch (e) {
            throw new Error("Invalid argument of :contains pseudo class: ".concat(text));
          }

          return function (elem) {
            var elemTextContent = utils.nodeTextContentGetter.apply(elem);
            return regex.test(elemTextContent);
          };
        }

        text = text.replace(/\\([\\()[\]"])/g, '$1');
        return function (elem) {
          var elemTextContent = utils.nodeTextContentGetter.apply(elem);
          return elemTextContent.indexOf(text) > -1;
        };
      });
      Sizzle.selectors.pseudos['contains'] = containsPseudo;
      Sizzle.selectors.pseudos['has-text'] = containsPseudo;
      Sizzle.selectors.pseudos['-abp-contains'] = containsPseudo; // Add :if, :-abp-has support

      Sizzle.selectors.pseudos['if'] = Sizzle.selectors.pseudos['has'];
      Sizzle.selectors.pseudos['-abp-has'] = Sizzle.selectors.pseudos['has']; // Add :if-not support

      Sizzle.selectors.pseudos['if-not'] = Sizzle.selectors.createPseudo(function (selector) {
        if (typeof selector === 'string') {
          Sizzle.compile(selector);
        }

        return function (elem) {
          return Sizzle(selector, elem).length === 0;
        };
      });
      registerParserOnlyTokens();
    }
    /**
     * Registrate custom tokens for parser.
     * Needed for proper work of pseudos:
     * for checking if the token is last and pseudo-class arguments validation
     */


    function registerParserOnlyTokens() {
      Sizzle.selectors.pseudos['xpath'] = Sizzle.selectors.createPseudo(function (selector) {
        try {
          document.createExpression(selector, null);
        } catch (e) {
          throw new Error("Invalid argument of :xpath pseudo class: ".concat(selector));
        }

        return function () {
          return true;
        };
      });
      Sizzle.selectors.pseudos['nth-ancestor'] = Sizzle.selectors.createPseudo(function (selector) {
        var deep = Number(selector);

        if (Number.isNaN(deep) || deep < 1 || deep >= 256) {
          throw new Error("Invalid argument of :nth-ancestor pseudo class: ".concat(selector));
        }

        return function () {
          return true;
        };
      });
      Sizzle.selectors.pseudos['upward'] = Sizzle.selectors.createPseudo(function (input) {
        if (input === '') {
          throw new Error("Invalid argument of :upward pseudo class: ".concat(input));
        } else if (Number.isInteger(+input) && (+input < 1 || +input >= 256)) {
          throw new Error("Invalid argument of :upward pseudo class: ".concat(input));
        }

        return function () {
          return true;
        };
      });
      Sizzle.selectors.pseudos['remove'] = Sizzle.selectors.createPseudo(function (input) {
        if (input !== '') {
          throw new Error("Invalid argument of :remove pseudo class: ".concat(input));
        }

        return function () {
          return true;
        };
      });
    }
    /**
     * Checks if specified token can be used by document.querySelectorAll.
     */


    function isSimpleToken(token) {
      var type = token.type;

      if (type === 'ID' || type === 'CLASS' || type === 'ATTR' || type === 'TAG' || type === 'CHILD') {
        // known simple tokens
        return true;
      }

      if (type === 'PSEUDO') {
        // check if value contains any of extended pseudo classes
        var i = PSEUDO_EXTENSIONS_MARKERS.length;

        while (i--) {
          if (token.value.indexOf(PSEUDO_EXTENSIONS_MARKERS[i]) >= 0) {
            return false;
          }
        }

        return true;
      } // all others aren't simple


      return false;
    }
    /**
     * Checks if specified token is a combinator
     */


    function isRelationToken(token) {
      var type = token.type;
      return type === ' ' || type === '>' || type === '+' || type === '~';
    }
    /**
     * ExtendedSelectorParser is a helper class for creating various selector instances which
     * all shares a method `querySelectorAll()` and `matches()` implementing different search strategies
     * depending on a type of selector.
     *
     * Currently, there are 3 types:
     *  A trait-less extended selector
     *    - we directly feed selector strings to Sizzle.
     *  A splitted extended selector
     *    - such as #container #feedItem:has(.ads), where it is splitted to `#container` and `#feedItem:has(.ads)`.
     */


    function ExtendedSelectorParser(selectorText, tokens, debug) {
      initialize();

      if (typeof tokens === 'undefined') {
        this.selectorText = cssUtils.normalize(selectorText); // Passing `returnUnsorted` in order to receive tokens in the order that's valid for the browser
        // In Sizzle internally, the tokens are re-sorted: https://github.com/AdguardTeam/ExtendedCss/issues/55

        this.tokens = Sizzle.tokenize(this.selectorText, false, {
          returnUnsorted: true
        });
      } else {
        this.selectorText = selectorText;
        this.tokens = tokens;
      }

      if (debug === true) {
        this.debug = true;
      }
    }

    ExtendedSelectorParser.prototype = {
      /**
       * The main method, creates a selector instance depending on the type of a selector.
       * @public
       */
      createSelector: function createSelector() {
        var debug = this.debug;
        var tokens = this.tokens;
        var selectorText = this.selectorText;

        if (tokens.length !== 1) {
          // Comma-separate selector - can't optimize further
          return new TraitLessSelector(selectorText, debug);
        }

        var xpathPart = this.getXpathPart();

        if (typeof xpathPart !== 'undefined') {
          return new XpathSelector(selectorText, xpathPart, debug);
        }

        var upwardPart = this.getUpwardPart();

        if (typeof upwardPart !== 'undefined') {
          var output;
          var upwardDeep = parseInt(upwardPart, 10); // if upward parameter is not a number, we consider it as a selector

          if (Number.isNaN(upwardDeep)) {
            output = new UpwardSelector(selectorText, upwardPart, debug);
          } else {
            // upward works like nth-ancestor
            var xpath = this.convertNthAncestorToken(upwardDeep);
            output = new XpathSelector(selectorText, xpath, debug);
          }

          return output;
        } // argument of pseudo-class remove;
        // it's defined only if remove is parsed as last token
        // and it's valid only if remove arg is empty string


        var removePart = this.getRemovePart();

        if (typeof removePart !== 'undefined') {
          var hasValidRemovePart = removePart === '';
          return new RemoveSelector(selectorText, hasValidRemovePart, debug);
        }

        tokens = tokens[0];
        var l = tokens.length;
        var lastRelTokenInd = this.getSplitPoint();

        if (typeof lastRelTokenInd === 'undefined') {
          try {
            document.querySelector(selectorText);
          } catch (e) {
            return new TraitLessSelector(selectorText, debug);
          }

          return new NotAnExtendedSelector(selectorText, debug);
        }

        var simple = '';
        var relation = null;
        var complex = '';
        var i = 0;

        for (; i < lastRelTokenInd; i++) {
          // build simple part
          simple += tokens[i].value;
        }

        if (i > 0) {
          // build relation part
          relation = tokens[i++].type;
        } // i is pointing to the start of a complex part.


        for (; i < l; i++) {
          complex += tokens[i].value;
        }

        return lastRelTokenInd === -1 ? new TraitLessSelector(selectorText, debug) : new SplittedSelector(selectorText, simple, relation, complex, debug);
      },

      /**
       * @private
       * @return {number|undefined} An index of a token that is split point.
       * returns undefined if the selector does not contain any complex tokens
       * or it is not eligible for splitting.
       * Otherwise returns an integer indicating the index of the last relation token.
       */
      getSplitPoint: function getSplitPoint() {
        var tokens = this.tokens[0]; // We split selector only when the last compound selector
        // is the only extended selector.

        var latestRelationTokenIndex = -1;
        var haveMetComplexToken = false;

        for (var i = 0, l = tokens.length; i < l; i++) {
          var token = tokens[i];

          if (isRelationToken(token)) {
            if (haveMetComplexToken) {
              return;
            }

            latestRelationTokenIndex = i;
          } else if (!isSimpleToken(token)) {
            haveMetComplexToken = true;
          }
        }

        if (!haveMetComplexToken) {
          return;
        }

        return latestRelationTokenIndex;
      },

      /**
       * @private
       * @return {string|undefined} xpath selector part if exists
       * returns undefined if the selector does not contain xpath tokens
       */
      getXpathPart: function getXpathPart() {
        var tokens = this.tokens[0];

        for (var i = 0, tokensLength = tokens.length; i < tokensLength; i++) {
          var token = tokens[i];

          if (token.type === 'PSEUDO') {
            var matches = token.matches;

            if (matches && matches.length > 1) {
              if (matches[0] === 'xpath') {
                if (this.isLastToken(tokens, i)) {
                  throw new Error('Invalid pseudo: \':xpath\' should be at the end of the selector');
                }

                return matches[1];
              }

              if (matches[0] === 'nth-ancestor') {
                if (this.isLastToken(tokens, i)) {
                  throw new Error('Invalid pseudo: \':nth-ancestor\' should be at the end of the selector');
                }

                var deep = matches[1];

                if (deep > 0 && deep < 256) {
                  return this.convertNthAncestorToken(deep);
                }
              }
            }
          }
        }
      },

      /**
       * converts nth-ancestor/upward deep value to xpath equivalent
       * @param {number} deep
       * @return {string}
       */
      convertNthAncestorToken: function convertNthAncestorToken(deep) {
        var result = '..';

        while (deep > 1) {
          result += '/..';
          deep--;
        }

        return result;
      },

      /**
       * Checks if the token is last,
       * except of remove pseudo-class
       * @param {Array} tokens
       * @param {number} i index of token
       * @returns {boolean}
       */
      isLastToken: function isLastToken(tokens, i) {
        // check id the next parsed token is remove pseudo
        var isNextRemoveToken = tokens[i + 1] && tokens[i + 1].type === 'PSEUDO' && tokens[i + 1].matches && tokens[i + 1].matches[0] === 'remove'; // check if the token is last
        // and if it is not check if it is remove one
        // which should be skipped

        return i + 1 !== tokens.length && !isNextRemoveToken;
      },

      /**
       * @private
       * @return {string|undefined} upward parameter
       * or undefined if the input does not contain upward tokens
       */
      getUpwardPart: function getUpwardPart() {
        var tokens = this.tokens[0];

        for (var i = 0, tokensLength = tokens.length; i < tokensLength; i++) {
          var token = tokens[i];

          if (token.type === 'PSEUDO') {
            var matches = token.matches;

            if (matches && matches.length > 1) {
              if (matches[0] === 'upward') {
                if (this.isLastToken(tokens, i)) {
                  throw new Error('Invalid pseudo: \':upward\' should be at the end of the selector');
                }

                return matches[1];
              }
            }
          }
        }
      },

      /**
       * @private
       * @return {string|undefined} remove parameter
       * or undefined if the input does not contain remove tokens
       */
      getRemovePart: function getRemovePart() {
        var tokens = this.tokens[0];

        for (var i = 0, tokensLength = tokens.length; i < tokensLength; i++) {
          var token = tokens[i];

          if (token.type === 'PSEUDO') {
            var matches = token.matches;

            if (matches && matches.length > 1) {
              if (matches[0] === 'remove') {
                if (i + 1 !== tokensLength) {
                  throw new Error('Invalid pseudo: \':remove\' should be at the end of the selector');
                }

                return matches[1];
              }
            }
          }
        }
      }
    };
    var globalDebuggingFlag = false;

    function isDebugging() {
      return globalDebuggingFlag || this.debug;
    }
    /**
     * This class represents a selector which is not an extended selector.
     * @param {string} selectorText
     * @param {boolean=} debug
     * @final
     */


    function NotAnExtendedSelector(selectorText, debug) {
      this.selectorText = selectorText;
      this.debug = debug;
    }

    NotAnExtendedSelector.prototype = {
      querySelectorAll: function querySelectorAll() {
        return document.querySelectorAll(this.selectorText);
      },
      matches: function matches(element) {
        return element[utils.matchesPropertyName](this.selectorText);
      },
      isDebugging: isDebugging
    };
    /**
     * A trait-less extended selector class.
     * @param {string} selectorText
     * @param {boolean=} debug
     * @constructor
     */

    function TraitLessSelector(selectorText, debug) {
      this.selectorText = selectorText;
      this.debug = debug;
      Sizzle.compile(selectorText);
    }

    TraitLessSelector.prototype = {
      querySelectorAll: function querySelectorAll() {
        return Sizzle(this.selectorText);
      },

      /** @final */
      matches: function matches(element) {
        return Sizzle.matchesSelector(element, this.selectorText);
      },

      /** @final */
      isDebugging: isDebugging
    };
    /**
     * Parental class for such pseudo-classes as xpath, upward, remove
     * which are limited to be the last one token in selector
     *
     * @param {string} selectorText
     * @param {string} pseudoClassArg pseudo-class arg
     * @param {boolean=} debug
     * @constructor
     */

    function BaseLastArgumentSelector(selectorText, pseudoClassArg, debug) {
      this.selectorText = selectorText;
      this.pseudoClassArg = pseudoClassArg;
      this.debug = debug;
      Sizzle.compile(this.selectorText);
    }

    BaseLastArgumentSelector.prototype = {
      querySelectorAll: function querySelectorAll() {
        var _this = this;

        var resultNodes = [];
        var simpleNodes;

        if (this.selectorText) {
          simpleNodes = Sizzle(this.selectorText);

          if (!simpleNodes || !simpleNodes.length) {
            return resultNodes;
          }
        } else {
          simpleNodes = [document];
        }

        simpleNodes.forEach(function (node) {
          _this.searchResultNodes(node, _this.pseudoClassArg, resultNodes);
        });
        return Sizzle.uniqueSort(resultNodes);
      },

      /** @final */
      matches: function matches(element) {
        var results = this.querySelectorAll();
        return results.indexOf(element) > -1;
      },

      /** @final */
      isDebugging: isDebugging,

      /**
       * Primitive method that returns all nodes if pseudo-class arg is defined.
       * That logic works for remove pseudo-class,
       * but for others it should be overridden.
       * @param {Object} node context element
       * @param {string} pseudoClassArg pseudo-class argument
       * @param {Array} result
       */
      searchResultNodes: function searchResultNodes(node, pseudoClassArg, result) {
        if (pseudoClassArg) {
          result.push(node);
        }
      }
    };
    /**
     * Xpath selector class
     * Limited to support 'xpath' to be only the last one token in selector
     * @param {string} selectorText
     * @param {string} xpath value
     * @param {boolean=} debug
     * @constructor
     * @augments BaseLastArgumentSelector
     */

    function XpathSelector(selectorText, xpath, debug) {
      var NO_SELECTOR_MARKER = ':xpath(//';
      var BODY_SELECTOR_REPLACER = 'body:xpath(//';
      var modifiedSelectorText = selectorText; // Normally, a pseudo-class is applied to nodes selected by a selector -- selector:xpath(...).
      // However, :xpath is special as the selector can be ommited.
      // For any other pseudo-class that would mean "apply to ALL DOM nodes",
      // but in case of :xpath it just means "apply me to the document".

      if (utils.startsWith(selectorText, NO_SELECTOR_MARKER)) {
        modifiedSelectorText = selectorText.replace(NO_SELECTOR_MARKER, BODY_SELECTOR_REPLACER);
      }

      BaseLastArgumentSelector.call(this, modifiedSelectorText, xpath, debug);
    }

    XpathSelector.prototype = Object.create(BaseLastArgumentSelector.prototype);
    XpathSelector.prototype.constructor = XpathSelector;
    /**
     * Applies xpath pseudo-class to provided context node
     * @param {Object} node context element
     * @param {string} pseudoClassArg xpath
     * @param {Array} result
     * @override
     */

    XpathSelector.prototype.searchResultNodes = function (node, pseudoClassArg, result) {
      var xpathResult = document.evaluate(pseudoClassArg, node, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
      var iNode; // eslint-disable-next-line no-cond-assign

      while (iNode = xpathResult.iterateNext()) {
        result.push(iNode);
      }
    };
    /**
     * Upward selector class
     * Limited to support 'upward' to be only the last one token in selector
     * @param {string} selectorText
     * @param {string} upwardSelector value
     * @param {boolean=} debug
     * @constructor
     * @augments BaseLastArgumentSelector
     */


    function UpwardSelector(selectorText, upwardSelector, debug) {
      BaseLastArgumentSelector.call(this, selectorText, upwardSelector, debug);
    }

    UpwardSelector.prototype = Object.create(BaseLastArgumentSelector.prototype);
    UpwardSelector.prototype.constructor = UpwardSelector;
    /**
     * Applies upward pseudo-class to provided context node
     * @param {Object} node context element
     * @param {string} upwardSelector upward selector
     * @param {Array} result
     * @override
     */

    UpwardSelector.prototype.searchResultNodes = function (node, upwardSelector, result) {
      if (upwardSelector !== '') {
        var parent = node.parentElement;

        if (parent === null) {
          return;
        }

        node = parent.closest(upwardSelector);

        if (node === null) {
          return;
        }
      }

      result.push(node);
    };
    /**
     * Remove selector class
     * Limited to support 'remove' to be only the last one token in selector
     * @param {string} selectorText
     * @param {boolean} hasValidRemovePart
     * @param {boolean=} debug
     * @constructor
     * @augments BaseLastArgumentSelector
     */


    function RemoveSelector(selectorText, hasValidRemovePart, debug) {
      var REMOVE_PSEUDO_MARKER = ':remove()';
      var removeMarkerIndex = selectorText.indexOf(REMOVE_PSEUDO_MARKER); // deleting remove part of rule instead of which
      // pseudo-property property 'remove' will be added by ExtendedCssParser

      var modifiedSelectorText = selectorText.slice(0, removeMarkerIndex);
      BaseLastArgumentSelector.call(this, modifiedSelectorText, hasValidRemovePart, debug); // mark extendedSelector as Remove one for ExtendedCssParser

      this.isRemoveSelector = true;
    }

    RemoveSelector.prototype = Object.create(BaseLastArgumentSelector.prototype);
    RemoveSelector.prototype.constructor = RemoveSelector;
    /**
     * A splitted extended selector class.
     *
     * #container #feedItem:has(.ads)
     * +--------+                     simple
     *           +                    relation
     *            +-----------------+ complex
     * We split selector only when the last selector is complex
     * @param {string} selectorText
     * @param {string} simple
     * @param {string} relation
     * @param {string} complex
     * @param {boolean=} debug
     * @constructor
     * @extends TraitLessSelector
     */

    function SplittedSelector(selectorText, simple, relation, complex, debug) {
      TraitLessSelector.call(this, selectorText, debug);
      this.simple = simple;
      this.relation = relation;
      this.complex = complex;
      Sizzle.compile(complex);
    }

    SplittedSelector.prototype = Object.create(TraitLessSelector.prototype);
    SplittedSelector.prototype.constructor = SplittedSelector;
    /** @override */

    SplittedSelector.prototype.querySelectorAll = function () {
      var _this2 = this;

      var resultNodes = [];
      var simpleNodes;
      var simple = this.simple;
      var relation;

      if (simple) {
        // First we use simple selector to narrow our search
        simpleNodes = document.querySelectorAll(simple);

        if (!simpleNodes || !simpleNodes.length) {
          return resultNodes;
        }

        relation = this.relation;
      } else {
        simpleNodes = [document];
        relation = ' ';
      }

      switch (relation) {
        case ' ':
          simpleNodes.forEach(function (node) {
            _this2.relativeSearch(node, resultNodes);
          });
          break;

        case '>':
          {
            simpleNodes.forEach(function (node) {
              Object.values(node.children).forEach(function (childNode) {
                if (_this2.matches(childNode)) {
                  resultNodes.push(childNode);
                }
              });
            });
            break;
          }

        case '+':
          {
            simpleNodes.forEach(function (node) {
              var parentNode = node.parentNode;
              Object.values(parentNode.children).forEach(function (childNode) {
                if (_this2.matches(childNode) && childNode.previousElementSibling === node) {
                  resultNodes.push(childNode);
                }
              });
            });
            break;
          }

        case '~':
          {
            simpleNodes.forEach(function (node) {
              var parentNode = node.parentNode;
              Object.values(parentNode.children).forEach(function (childNode) {
                if (_this2.matches(childNode) && node.compareDocumentPosition(childNode) === 4) {
                  resultNodes.push(childNode);
                }
              });
            });
            break;
          }
      }

      return Sizzle.uniqueSort(resultNodes);
    };
    /**
     * Performs a search of "complex" part relative to results for the "simple" part.
     * @param {Node} node a node matching the "simple" part.
     * @param {Node[]} result an array to append search result.
     */


    SplittedSelector.prototype.relativeSearch = function (node, results) {
      Sizzle(this.complex, node, results);
    };

    return {
      /**
       * Wraps the inner class so that the instance is not exposed.
       */
      createSelector: function createSelector(selector, tokens, debug) {
        return new ExtendedSelectorParser(selector, tokens, debug).createSelector();
      },

      /**
       * Mark every selector as a selector being debugged, so that timing information
       * for the selector is printed to the console.
       */
      enableGlobalDebugging: function enableGlobalDebugging() {
        globalDebuggingFlag = true;
      }
    };
  }();

  /**
   * Copyright 2016 Adguard Software Ltd
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
  /**
   * A helper class that parses stylesheets containing extended selectors
   * into ExtendedSelector instances and key-value maps of style declarations.
   * Please note, that it does not support any complex things like media queries and such.
   */

  var ExtendedCssParser = function () {
    var reDeclEnd = /[;}]/g;
    var reDeclDivider = /[;:}]/g;
    var reNonWhitespace = /\S/g;
    var Sizzle;
    /**
     * @param {string} cssText
     * @constructor
     */

    function Parser(cssText) {
      this.cssText = cssText;
    }

    Parser.prototype = {
      error: function error(position) {
        throw new Error("CssParser: parse error at position ".concat(this.posOffset + position));
      },

      /**
       * Validates that the tokens correspond to a valid selector.
       * Sizzle is different from browsers and some selectors that it tolerates aren't actually valid.
       * For instance, "div >" won't work in a browser, but it will in Sizzle (it'd be the same as "div > *").
       *
       * @param {*} selectors An array of SelectorData (selector, groups)
       * @returns {boolean} false if any of the groups are invalid
       */
      validateSelectors: function validateSelectors(selectors) {
        var iSelectors = selectors.length;

        while (iSelectors--) {
          var groups = selectors[iSelectors].groups;
          var iGroups = groups.length;

          while (iGroups--) {
            var tokens = groups[iGroups];
            var lastToken = tokens[tokens.length - 1];

            if (Sizzle.selectors.relative[lastToken.type]) {
              return false;
            }
          }
        }

        return true;
      },

      /**
       * Parses a stylesheet and returns a list of pairs of an ExtendedSelector and a styles map.
       * This method will throw an error in case of an obviously invalid input.
       * If any of the selectors used in the stylesheet cannot be compiled into an ExtendedSelector,
       * it will be ignored.
       *
       * @typedef {Object} ExtendedStyle
       * @property {Object} selector An instance of the {@link ExtendedSelector} class
       * @property {Object} styleMap A map of styles parsed
       *
       * @returns {Array.<ExtendedStyle>} An array of the styles parsed
       */
      parseCss: function parseCss() {
        this.posOffset = 0;

        if (!this.cssText) {
          this.error(0);
        }

        var results = [];

        while (this.cssText) {
          // Apply tolerant tokenization.
          var parseResult = Sizzle.tokenize(this.cssText, false, {
            tolerant: true,
            returnUnsorted: true
          });
          var selectorData = parseResult.selectors;
          this.nextIndex = parseResult.nextIndex;

          if (this.cssText.charCodeAt(this.nextIndex) !== 123 ||
          /* charCode of '{' */
          !this.validateSelectors(selectorData)) {
            this.error(this.nextIndex);
          }

          this.nextIndex++; // Move the pointer to the start of style declaration.

          var styleMap = this.parseNextStyle();
          var debug = false; // If there is a style property 'debug', mark the selector
          // as a debuggable selector, and delete the style declaration.

          var debugPropertyValue = styleMap['debug'];

          if (typeof debugPropertyValue !== 'undefined') {
            if (debugPropertyValue === 'global') {
              ExtendedSelectorFactory.enableGlobalDebugging();
            }

            debug = true;
            delete styleMap['debug'];
          } // Creating an ExtendedSelector instance for every selector we got from Sizzle.tokenize.
          // This is quite important as Sizzle does a poor job at executing selectors like "selector1, selector2".


          for (var i = 0, l = selectorData.length; i < l; i++) {
            var data = selectorData[i];

            try {
              var extendedSelector = ExtendedSelectorFactory.createSelector(data.selectorText, data.groups, debug);

              if (extendedSelector.pseudoClassArg && extendedSelector.isRemoveSelector) {
                // if there is remove pseudo-class in rule,
                // the element will be removed and no other styles will be applied
                styleMap['remove'] = 'true';
              }

              results.push({
                selector: extendedSelector,
                style: styleMap
              });
            } catch (ex) {
              utils.logError("ExtendedCssParser: ignoring invalid selector ".concat(data.selectorText));
            }
          }
        }

        return results;
      },
      parseNextStyle: function parseNextStyle() {
        var styleMap = Object.create(null);
        var bracketPos = this.parseUntilClosingBracket(styleMap); // Cut out matched portion from cssText.

        reNonWhitespace.lastIndex = bracketPos + 1;
        var match = reNonWhitespace.exec(this.cssText);

        if (match === null) {
          this.cssText = '';
          return styleMap;
        }

        var matchPos = match.index;
        this.cssText = this.cssText.slice(matchPos);
        this.posOffset += matchPos;
        return styleMap;
      },

      /**
       * @return {number} an index of the next '}' in `this.cssText`.
       */
      parseUntilClosingBracket: function parseUntilClosingBracket(styleMap) {
        // Expects ":", ";", and "}".
        reDeclDivider.lastIndex = this.nextIndex;
        var match = reDeclDivider.exec(this.cssText);

        if (match === null) {
          this.error(this.nextIndex);
        }

        var matchPos = match.index;
        var matched = match[0];

        if (matched === '}') {
          return matchPos;
        }

        if (matched === ':') {
          var colonIndex = matchPos; // Expects ";" and "}".

          reDeclEnd.lastIndex = colonIndex;
          match = reDeclEnd.exec(this.cssText);

          if (match === null) {
            this.error(colonIndex);
          }

          matchPos = match.index;
          matched = match[0]; // Populates the `styleMap` key-value map.

          var property = this.cssText.slice(this.nextIndex, colonIndex).trim();
          var value = this.cssText.slice(colonIndex + 1, matchPos).trim();
          styleMap[property] = value; // If found "}", re-run the outer loop.

          if (matched === '}') {
            return matchPos;
          }
        } // matchPos is the position of the next ';'.
        // Increase 'nextIndex' and re-run the loop.


        this.nextIndex = matchPos + 1;
        return this.parseUntilClosingBracket(styleMap); // Should be a subject of tail-call optimization.
      }
    };
    return {
      parseCss: function parseCss(cssText) {
        Sizzle = initializeSizzle();
        return new Parser(cssUtils.normalize(cssText)).parseCss();
      }
    };
  }();

  /**
   * This callback is used to get affected node elements and handle style properties
   * before they are applied to them if it is necessary
   * @callback beforeStyleApplied
   * @param {object} affectedElement - Object containing DOM node and rule to be applied
   * @return {object} affectedElement - Same or modified object containing DOM node and rule to be applied
   */

  /**
   * Extended css class
   *
   * @param {Object} configuration
   * @param {string} configuration.styleSheet - the CSS stylesheet text
   * @param {beforeStyleApplied} [configuration.beforeStyleApplied] - the callback that handles affected elements
   * @constructor
   */

  function ExtendedCss(configuration) {
    if (!configuration) {
      throw new Error('Configuration is not provided.');
    }

    var styleSheet = configuration.styleSheet;
    var beforeStyleApplied = configuration.beforeStyleApplied;

    if (beforeStyleApplied && typeof beforeStyleApplied !== 'function') {
      // eslint-disable-next-line max-len
      throw new Error("Wrong configuration. Type of 'beforeStyleApplied' field should be a function, received: ".concat(_typeof(beforeStyleApplied)));
    } // We use EventTracker to track the event that is likely to cause the mutation.
    // The problem is that we cannot use `window.event` directly from the mutation observer call
    // as we're not in the event handler context anymore.


    var EventTracker = function () {
      var ignoredEventTypes = ['mouseover', 'mouseleave', 'mouseenter', 'mouseout'];
      var LAST_EVENT_TIMEOUT_MS = 10;
      var EVENTS = [// keyboard events
      'keydown', 'keypress', 'keyup', // mouse events
      'auxclick', 'click', 'contextmenu', 'dblclick', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseover', 'mouseout', 'mouseup', 'pointerlockchange', 'pointerlockerror', 'select', 'wheel']; // 'wheel' event makes scrolling in Safari twitchy
      // https://github.com/AdguardTeam/ExtendedCss/issues/120

      var safariProblematicEvents = ['wheel'];
      var trackedEvents = utils.isSafariBrowser ? EVENTS.filter(function (el) {
        return !(safariProblematicEvents.indexOf(el) > -1);
      }) : EVENTS;
      var lastEventType;
      var lastEventTime;

      var trackEvent = function trackEvent(e) {
        lastEventType = e.type;
        lastEventTime = Date.now();
      };

      trackedEvents.forEach(function (evName) {
        document.documentElement.addEventListener(evName, trackEvent, true);
      });

      var getLastEventType = function getLastEventType() {
        return lastEventType;
      };

      var getTimeSinceLastEvent = function getTimeSinceLastEvent() {
        return Date.now() - lastEventTime;
      };

      return {
        isIgnoredEventType: function isIgnoredEventType() {
          return ignoredEventTypes.indexOf(getLastEventType()) > -1 && getTimeSinceLastEvent() < LAST_EVENT_TIMEOUT_MS;
        }
      };
    }();

    var rules = [];
    var affectedElements = [];
    var removalsStatistic = {};
    var domObserved;
    var eventListenerSupported = window.addEventListener;
    var domMutationObserver;

    function observeDocument(callback) {
      // We are trying to limit the number of callback calls by not calling it on all kind of "hover" events.
      // The rationale behind this is that "hover" events often cause attributes modification,
      // but re-applying extCSS rules will be useless as these attribute changes are usually transient.
      var isIgnoredMutation = function isIgnoredMutation(mutations) {
        for (var i = 0; i < mutations.length; i += 1) {
          if (mutations.type !== 'attributes') {
            return false;
          }
        }

        return true;
      };

      if (utils.MutationObserver) {
        domMutationObserver = new utils.MutationObserver(function (mutations) {
          if (!mutations || mutations.length === 0) {
            return;
          }

          if (EventTracker.isIgnoredEventType() && isIgnoredMutation(mutations)) {
            return;
          }

          callback();
        });
        domMutationObserver.observe(document, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['id', 'class']
        });
      } else if (eventListenerSupported) {
        document.addEventListener('DOMNodeInserted', callback, false);
        document.addEventListener('DOMNodeRemoved', callback, false);
        document.addEventListener('DOMAttrModified', callback, false);
      }
    }

    function disconnectDocument(callback) {
      if (domMutationObserver) {
        domMutationObserver.disconnect();
      } else if (eventListenerSupported) {
        document.removeEventListener('DOMNodeInserted', callback, false);
        document.removeEventListener('DOMNodeRemoved', callback, false);
        document.removeEventListener('DOMAttrModified', callback, false);
      }
    }

    var MAX_STYLE_PROTECTION_COUNT = 50;
    var protectionObserverOption = {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['style']
    };
    /**
     * Creates MutationObserver protection function
     *
     * @param styles
     * @return {protectionFunction}
     */

    function createProtectionFunction(styles) {
      function protectionFunction(mutations, observer) {
        if (!mutations.length) {
          return;
        }

        var mutation = mutations[0];
        var target = mutation.target;
        observer.disconnect();
        styles.forEach(function (style) {
          setStyleToElement(target, style);
        });

        if (++observer.styleProtectionCount < MAX_STYLE_PROTECTION_COUNT) {
          observer.observe(target, protectionObserverOption);
        } else {
          utils.logError('ExtendedCss: infinite loop protection for style');
        }
      }

      return protectionFunction;
    }
    /**
     * Sets up a MutationObserver which protects style attributes from changes
     * @param node DOM node
     * @param rules rules
     * @returns Mutation observer used to protect attribute or null if there's nothing to protect
     */


    function protectStyleAttribute(node, rules) {
      if (!utils.MutationObserver) {
        return null;
      }

      var styles = rules.map(function (r) {
        return r.style;
      });
      var protectionObserver = new utils.MutationObserver(createProtectionFunction(styles));
      protectionObserver.observe(node, protectionObserverOption); // Adds an expando to the observer to keep 'style fix counts'.

      protectionObserver.styleProtectionCount = 0;
      return protectionObserver;
    }

    function removeSuffix(str, suffix) {
      var index = str.indexOf(suffix, str.length - suffix.length);

      if (index >= 0) {
        return str.substring(0, index);
      }

      return str;
    }
    /**
     * Finds affectedElement object for the specified DOM node
     * @param node  DOM node
     * @returns     affectedElement found or null
     */


    function findAffectedElement(node) {
      for (var i = 0; i < affectedElements.length; i += 1) {
        if (affectedElements[i].node === node) {
          return affectedElements[i];
        }
      }

      return null;
    }

    function removeElement(affectedElement) {
      var node = affectedElement.node;
      affectedElement.removed = true;
      var elementSelector = utils.getNodeSelector(node); // check if the element has been already removed earlier

      var elementRemovalsCounter = removalsStatistic[elementSelector] || 0; // if removals attempts happened more than specified we do not try to remove node again

      if (elementRemovalsCounter > MAX_STYLE_PROTECTION_COUNT) {
        utils.logError('ExtendedCss: infinite loop protection for SELECTOR', elementSelector);
        return;
      }

      if (node.parentNode) {
        node.parentNode.removeChild(node);
        removalsStatistic[elementSelector] = elementRemovalsCounter + 1;
      }
    }
    /**
     * Applies style to the specified DOM node
     * @param affectedElement Object containing DOM node and rule to be applied
     */


    function applyStyle(affectedElement) {
      if (affectedElement.protectionObserver) {
        // Style is already applied and protected by the observer
        return;
      }

      if (beforeStyleApplied) {
        affectedElement = beforeStyleApplied(affectedElement);

        if (!affectedElement) {
          return;
        }
      }

      var _affectedElement = affectedElement,
          node = _affectedElement.node;

      for (var i = 0; i < affectedElement.rules.length; i++) {
        var style = affectedElement.rules[i].style;

        if (style['remove'] === 'true') {
          removeElement(affectedElement);
          return;
        }

        setStyleToElement(node, style);
      }
    }
    /**
     * Sets style to the specified DOM node
     * @param node element
     * @param style style
     */


    function setStyleToElement(node, style) {
      Object.keys(style).forEach(function (prop) {
        // Apply this style only to existing properties
        // We can't use hasOwnProperty here (does not work in FF)
        if (typeof node.style.getPropertyValue(prop) !== 'undefined') {
          var value = style[prop]; // First we should remove !important attribute (or it won't be applied')

          value = removeSuffix(value.trim(), '!important').trim();
          node.style.setProperty(prop, value, 'important');
        }
      });
    }
    /**
     * Reverts style for the affected object
     */


    function revertStyle(affectedElement) {
      if (affectedElement.protectionObserver) {
        affectedElement.protectionObserver.disconnect();
      }

      affectedElement.node.style.cssText = affectedElement.originalStyle;
    }
    /**
     * Applies specified rule and returns list of elements affected
     * @param rule Rule to apply
     * @returns List of elements affected by this rule
     */


    function applyRule(rule) {
      var debug = rule.selector.isDebugging();
      var start;

      if (debug) {
        start = utils.AsyncWrapper.now();
      }

      var selector = rule.selector;
      var nodes = selector.querySelectorAll();
      nodes.forEach(function (node) {
        var affectedElement = findAffectedElement(node);

        if (affectedElement) {
          affectedElement.rules.push(rule);
          applyStyle(affectedElement);
        } else {
          // Applying style first time
          var originalStyle = node.style.cssText;
          affectedElement = {
            node: node,
            // affected DOM node
            rules: [rule],
            // rules to be applied
            originalStyle: originalStyle,
            // original node style
            protectionObserver: null // style attribute observer

          };
          applyStyle(affectedElement);
          affectedElements.push(affectedElement);
        }
      });

      if (debug) {
        var elapsed = utils.AsyncWrapper.now() - start;

        if (!('timingStats' in rule)) {
          rule.timingStats = new utils.Stats();
        }

        rule.timingStats.push(elapsed);
      }

      return nodes;
    }
    /**
     * Applies filtering rules
     */


    function applyRules() {
      var elementsIndex = []; // some rules could make call - selector.querySelectorAll() temporarily to change node id attribute
      // this caused MutationObserver to call recursively
      // https://github.com/AdguardTeam/ExtendedCss/issues/81

      stopObserve();
      rules.forEach(function (rule) {
        var nodes = applyRule(rule);
        Array.prototype.push.apply(elementsIndex, nodes);
      }); // Now revert styles for elements which are no more affected

      var l = affectedElements.length; // do nothing if there is no elements to process

      if (elementsIndex.length > 0) {
        while (l--) {
          var obj = affectedElements[l];

          if (elementsIndex.indexOf(obj.node) === -1) {
            // Time to revert style
            revertStyle(obj);
            affectedElements.splice(l, 1);
          } else if (!obj.removed) {
            // Add style protection observer
            // Protect "style" attribute from changes
            if (!obj.protectionObserver) {
              obj.protectionObserver = protectStyleAttribute(obj.node, obj.rules);
            }
          }
        }
      } // After styles are applied we can start observe again


      observe();
      printTimingInfo();
    }

    var APPLY_RULES_DELAY = 150;
    var applyRulesScheduler = new utils.AsyncWrapper(applyRules, APPLY_RULES_DELAY);
    var mainCallback = applyRulesScheduler.run.bind(applyRulesScheduler);

    function observe() {
      if (domObserved) {
        return;
      } // Handle dynamically added elements


      domObserved = true;
      observeDocument(mainCallback);
    }

    function stopObserve() {
      if (!domObserved) {
        return;
      }

      domObserved = false;
      disconnectDocument(mainCallback);
    }

    function apply() {
      applyRules();

      if (document.readyState !== 'complete') {
        document.addEventListener('DOMContentLoaded', applyRules);
      }
    }
    /**
     * Disposes ExtendedCss and removes our styles from matched elements
     */


    function dispose() {
      stopObserve();
      affectedElements.forEach(function (obj) {
        revertStyle(obj);
      });
    }

    var timingsPrinted = false;
    /**
     * Prints timing information for all selectors marked as "debug"
     */

    function printTimingInfo() {
      if (timingsPrinted) {
        return;
      }

      timingsPrinted = true;
      var timings = rules.filter(function (rule) {
        return rule.selector.isDebugging();
      }).map(function (rule) {
        return {
          selectorText: rule.selector.selectorText,
          timingStats: rule.timingStats
        };
      });

      if (timings.length === 0) {
        return;
      } // Add location.href to the message to distinguish frames


      utils.logInfo('[ExtendedCss] Timings for %o:\n%o (in milliseconds)', window.location.href, timings);
    } // First of all parse the stylesheet


    rules = ExtendedCssParser.parseCss(styleSheet); // EXPOSE

    this.dispose = dispose;
    this.apply = apply;
    /** Exposed for testing purposes only */

    this._getAffectedElements = function () {
      return affectedElements;
    };
  }
  /**
   * Expose querySelectorAll for debugging and validating selectors
   *
   * @param {string} selectorText selector text
   * @param {boolean} noTiming if true -- do not print the timing to the console
   * @returns {Array<Node>|NodeList} a list of elements found
   * @throws Will throw an error if the argument is not a valid selector
   */


  ExtendedCss.query = function (selectorText, noTiming) {
    if (typeof selectorText !== 'string') {
      throw new Error('Selector text is empty');
    }

    var now = utils.AsyncWrapper.now;
    var start = now();

    try {
      return ExtendedSelectorFactory.createSelector(selectorText).querySelectorAll();
    } finally {
      var end = now();

      if (!noTiming) {
        utils.logInfo("[ExtendedCss] Elapsed: ".concat(Math.round((end - start) * 1000), " \u03BCs."));
      }
    }
  };

  return ExtendedCss;

}());
