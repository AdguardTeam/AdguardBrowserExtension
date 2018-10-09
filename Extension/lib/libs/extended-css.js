/*! extended-css - v1.0.13 - 2018-09-06
* https://github.com/AdguardTeam/ExtendedCss
* Copyright (c) 2018 ; Licensed Apache License 2.0 */
var ExtendedCss = (function(window) {
/* global console */

var utils = {};
utils.MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

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
 * Helper function for creating regular expression from a url filter rule syntax.
 */
utils.createURLRegex = function () {
    // jshint ignore:line
    // Constants
    var regexConfiguration = {
        maskStartUrl: "||",
        maskPipe: "|",
        maskSeparator: "^",
        maskAnySymbol: "*",

        regexAnySymbol: ".*",
        regexSeparator: "([^ a-zA-Z0-9.%]|$)",
        regexStartUrl: "^(http|https|ws|wss)://([a-z0-9-_.]+\\.)?",
        regexStartString: "^",
        regexEndString: "$"
    };

    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/regexp
    // should be escaped . * + ? ^ $ { } ( ) | [ ] / \
    // except of * | ^
    var specials = ['.', '+', '?', '$', '{', '}', '(', ')', '[', ']', '\\', '/'];
    var specialsRegex = new RegExp('[' + specials.join('\\') + ']', 'g');

    /**
     * Escapes regular expression string
     */
    var escapeRegExp = function (str) {
        return str.replace(specialsRegex, "\\$&");
    };

    var startsWith = function (str, prefix) {
        return str && str.indexOf(prefix) === 0;
    };

    var endsWith = function (str, postfix) {
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

    var replaceAll = function (str, find, replace) {
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
    var createRegexText = function (str) {
        var regex = escapeRegExp(str);

        if (startsWith(regex, regexConfiguration.maskStartUrl)) {
            regex = regex.substring(0, regexConfiguration.maskStartUrl.length) + replaceAll(regex.substring(regexConfiguration.maskStartUrl.length, regex.length - 1), "\|", "\\|") + regex.substring(regex.length - 1);
        } else if (startsWith(regex, regexConfiguration.maskPipe)) {
            regex = regex.substring(0, regexConfiguration.maskPipe.length) + replaceAll(regex.substring(regexConfiguration.maskPipe.length, regex.length - 1), "\|", "\\|") + regex.substring(regex.length - 1);
        } else {
            regex = replaceAll(regex.substring(0, regex.length - 1), "\|", "\\|") + regex.substring(regex.length - 1);
        }

        // Replacing special url masks
        regex = replaceAll(regex, regexConfiguration.maskAnySymbol, regexConfiguration.regexAnySymbol);
        regex = replaceAll(regex, regexConfiguration.maskSeparator, regexConfiguration.regexSeparator);

        if (startsWith(regex, regexConfiguration.maskStartUrl)) {
            regex = regexConfiguration.regexStartUrl + regex.substring(regexConfiguration.maskStartUrl.length);
        } else if (startsWith(regex, regexConfiguration.maskPipe)) {
            regex = regexConfiguration.regexStartString + regex.substring(regexConfiguration.maskPipe.length);
        }
        if (endsWith(regex, regexConfiguration.maskPipe)) {
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
    if (anchor.host === "") {
        anchor.href = anchor.href;
    }
    return anchor;
};

/**
 * Checks whether A has the same origin as B.
 * @param {string} url_A location.href of A.
 * @param {Location} location_B location of B.
 * @param {string} domain_B document.domain of B.
 * @return {boolean}
 */
utils.isSameOrigin = function (url_A, location_B, domain_B) {
    var location_A = utils.createLocation(url_A);
    if (location_A.protocol === 'javascript:' || location_A.href === 'about:blank') {
        // jshint ignore:line
        return true;
    }
    if (location_A.protocol === 'data:' || location_A.protocol === 'file:') {
        return false;
    }
    return location_A.hostname === domain_B && location_A.port === location_B.port && location_A.protocol === location_B.protocol;
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
        this.rAFid = this.timerId = this.asapScheduled = undefined;
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
                this.mo.observe(this.node, { characterData: true });
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
            this.rAFid = this.timerId = undefined;
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

    var WeakMap = function () {
        this.name = '__st' + (Math.random() * 1e9 >>> 0) + (counter++ + '__');
    };

    WeakMap.prototype = {
        set: function (key, value) {
            var entry = key[this.name];
            if (entry && entry[0] === key) {
                entry[1] = value;
            } else {
                utils.defineProperty(key, this.name, { value: [key, value], writable: true });
            }
            return this;
        },
        get: function (key) {
            var entry = void 0;
            return (entry = key[this.name]) && entry[0] === key ? entry[1] : undefined;
        },
        delete: function (key) {
            var entry = key[this.name];
            if (!entry) {
                return false;
            }
            var hasValue = entry[0] === key;
            entry[0] = entry[1] = undefined;
            return hasValue;
        },
        has: function (key) {
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
    var Set = function (items) {
        this.name = '__st' + (Math.random() * 1e9 >>> 0) + (counter++ + '__');
        this.keys = [];

        if (items && items.length) {
            var iItems = items.length;
            while (iItems--) {
                this.add(items[iItems]);
            }
        }
    };

    Set.prototype = {
        add: function (key) {
            if (!isNumber(key[this.name])) {
                var index = this.keys.push(key) - 1;
                utils.defineProperty(key, this.name, { value: index, writable: true });
            }
        },
        delete: function (key) {
            if (isNumber(key[this.name])) {
                var index = key[this.name];
                delete this.keys[index];
                key[this.name] = undefined;
            }
        },
        has: function (key) {
            return isNumber(key[this.name]);
        },
        clear: function () {
            this.keys.forEach(function (key) {
                key[this.name] = undefined;
            });
            this.keys.length = 0;
        },
        forEach: function (cb) {
            var that = this;
            this.keys.forEach(function (value) {
                cb(value, value, that);
            });
        }
    };

    utils.defineProperty(Set.prototype, 'size', {
        get: function () {
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
    this.stddev = Math.sqrt(this.squaredSum / this.length - Math.pow(this.mean, 2));
};

/** Safe console.error version */
utils.logError = typeof console !== 'undefined' && console.error && Function.prototype.bind && console.error.bind ? console.error.bind(window.console) : console.error;

/** Safe console.info version */
utils.logInfo = typeof console !== 'undefined' && console.info && Function.prototype.bind && console.info.bind ? console.info.bind(window.console) : console.info;

function isNumber(obj) {
    return typeof obj === 'number';
}

/* global initializeSizzle, Sizzle, ExtendedSelectorFactory, utils */

/**
 * A helper class that parses stylesheets containing extended selectors
 * into ExtendedSelector instances and key-value maps of style declarations.
 * Please note, that it does not support any complex things like media queries and such.
 */
var ExtendedCssParser = function () {
    // jshint ignore:line

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
    var evaluateMatch = function (match, name, quoteChar, value) {
        // Unescape quotes
        var re = new RegExp("([^\\\\]|^)\\\\" + quoteChar, "g");
        value = value.replace(re, "$1" + quoteChar);
        return ":" + name + "(" + value + ")";
    };

    // Sizzle's parsing of pseudo class arguments is buggy on certain circumstances
    // We support following form of arguments:
    // 1. for :matches-css, those of a form {propertyName}: /.*/
    // 2. for :contains and :properties, those of a form /.*/
    // We transform such cases in a way that Sizzle has no ambiguity in parsing arguments.
    var reMatchesCss = /\:(matches-css(?:-after|-before)?)\(([a-z-\s]*\:\s*\/(?:\\.|[^\/])*?\/\s*)\)/g;
    var reContains = /:(?:-abp-)?(contains|has-text|properties)\((\s*\/(?:\\.|[^\/])*?\/\s*)\)/g;
    // Note that we require `/` character in regular expressions to be escaped.

    /**
     * Used for pre-processing pseudo-classes values with above two regexes.
     */
    var addQuotes = function (_, c1, c2) {
        return ':' + c1 + '("' + c2.replace(/["\\]/g, '\\$&') + '")';
    };

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
    var normalize = function (cssText) {
        cssText = cssText.replace(reAttrFallback, evaluateMatch);
        cssText = cssText.replace(reMatchesCss, addQuotes);
        cssText = cssText.replace(reContains, addQuotes);
        return cssText;
    };

    var reDeclEnd = /[;}]/g;
    var reDeclDivider = /[;:}]/g;
    var reNonWhitespace = /\S/g;

    /**
     * @param {string} cssText
     * @constructor
     */
    function Parser(cssText) {
        this.cssText = cssText;
    }

    Parser.prototype = {
        error: function (position) {
            throw new Error('CssParser: parse error at position ' + (this.posOffset + position));
        },

        /**
         * Validates that the tokens correspond to a valid selector.
         * Sizzle is different from browsers and some selectors that it tolerates aren't actually valid.
         * For instance, "div >" won't work in a browser, but it will in Sizzle (it'd be the same as "div > *").
         *
         * @param {*} selectors An array of SelectorData (selector, groups)
         * @returns {boolean} false if any of the groups are invalid
         */
        validateSelectors: function (selectors) {

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
         * If any of the selectors used in the stylesheet cannot be compiled into an ExtendedSelector, it will be ignored.
         *
         * @typedef {Object} ExtendedStyle
         * @property {Object} selector An instance of the {@link ExtendedSelector} class
         * @property {Object} styleMap A map of styles parsed
         *
         * @returns {Array.<ExtendedStyle>} An array of the styles parsed
         */
        parseCss: function () {
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

                if (this.cssText.charCodeAt(this.nextIndex) !== 123 /* charCode of '{' */ || !this.validateSelectors(selectorData)) {
                    this.error(this.nextIndex);
                }

                this.nextIndex++; // Move the pointer to the start of style declaration.
                var styleMap = this.parseNextStyle();

                var debug = false;

                // If there is a style property 'debug', mark the selector
                // as a debuggable selector, and delete the style declaration.
                var debugPropertyValue = styleMap['debug'];
                if (typeof debugPropertyValue !== 'undefined') {
                    if (debugPropertyValue === 'global') {
                        ExtendedSelectorFactory.enableGlobalDebugging();
                    }
                    debug = true;
                    delete styleMap['debug'];
                }

                // Creating an ExtendedSelector instance for every selector we got from Sizzle.tokenize.
                // This is quite important as Sizzle does a poor job at executing selectors like "selector1, selector2".
                for (var i = 0, l = selectorData.length; i < l; i++) {
                    var data = selectorData[i];
                    try {
                        var extendedSelector = ExtendedSelectorFactory.createSelector(data.selectorText, data.groups, debug);
                        results.push({
                            selector: extendedSelector,
                            style: styleMap
                        });
                    } catch (ex) {
                        utils.logError("ExtendedCssParser: ignoring invalid selector " + data.selectorText);
                    }
                }
            }

            return results;
        },

        parseNextStyle: function () {
            var styleMap = Object.create(null);

            var bracketPos = this.parseUntilClosingBracket(styleMap);

            // Cut out matched portion from cssText.
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
        parseUntilClosingBracket: function (styleMap) {
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
                var colonIndex = matchPos;
                // Expects ";" and "}".
                reDeclEnd.lastIndex = colonIndex;
                match = reDeclEnd.exec(this.cssText);
                if (match === null) {
                    this.error(colonIndex);
                }
                matchPos = match.index;
                matched = match[0];
                // Populates the `styleMap` key-value map.
                var property = this.cssText.slice(this.nextIndex, colonIndex).trim();
                var value = this.cssText.slice(colonIndex + 1, matchPos).trim();
                styleMap[property] = value;
                // If found "}", re-run the outer loop.
                if (matched === '}') {
                    return matchPos;
                }
            }
            // matchPos is the position of the next ';'.
            // Increase 'nextIndex' and re-run the loop.
            this.nextIndex = matchPos + 1;
            return this.parseUntilClosingBracket(styleMap); // Should be a subject of tail-call optimization.
        }
    };

    return {
        normalize: normalize,
        parseCss: function (cssText) {
            initializeSizzle();
            return new Parser(normalize(cssText)).parseCss();
        }
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
 * Date: 2018-03-20
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
 */
var Sizzle;

/**
 * Initializes Sizzle object.
 * In the case of AdGuard ExtendedCss we want to avoid initializing Sizzle right away
 * and exposing it to the global scope.
 */
var initializeSizzle = function () {
	// jshint ignore:line
	if (!Sizzle) {

		//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

		Sizzle = function (window) {

			var i,
			    support,
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
			    sortOrder = function (a, b) {
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
			indexOf = function (list, elem) {
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
			attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
			// Operator (capture 2)
			"*([*^$|!~]?=)" + whitespace +
			// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
			"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace + "*\\]",
			    pseudos = ":(" + identifier + ")(?:\\((" +
			// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
			// 1. quoted (capture 3; capture 4 or capture 5)
			"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
			// 2. simple (capture 6)
			"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
			// 3. anything else (capture 2)
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
			    rinputs = /^(?:input|select|textarea|button)$/i,
			    rheader = /^h\d$/i,
			    rnative = /^[^{]+\{\s*\[native \w/,


			// Easily-parseable/retrievable ID or TAG or CLASS selectors
			rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
			    rsibling = /[+~]/,


			// CSS escapes
			// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
			runescape = new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig"),
			    funescape = function (_, escaped, escapedWhitespace) {
				var high = "0x" + escaped - 0x10000;
				// NaN means non-codepoint
				// Support: Firefox<24
				// Workaround erroneous numeric interpretation of +"0x"
				return high !== high || escapedWhitespace ? escaped : high < 0 ?
				// BMP codepoint
				String.fromCharCode(high + 0x10000) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode(high >> 10 | 0xD800, high & 0x3FF | 0xDC00);
			},


			// CSS string/identifier serialization
			// https://drafts.csswg.org/cssom/#common-serializing-idioms
			rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
			    fcssescape = function (ch, asCodePoint) {
				if (asCodePoint) {

					// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
					if (ch === "\0") {
						return "\uFFFD";
					}

					// Control characters and (dependent upon position) numbers get escaped as code points
					return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " ";
				}

				// Other potentially-special ASCII characters get backslash-escaped
				return "\\" + ch;
			},


			// Used for iframes
			// See setDocument()
			// Removing the function wrapper causes a "Permission Denied"
			// error in IE
			unloadHandler = function () {
				setDocument();
			},
			    inDisabledFieldset = addCombinator(function (elem) {
				return elem.disabled === true && elem.nodeName.toLowerCase() === "fieldset";
			}, { dir: "parentNode", next: "legend" });

			// Optimize for push.apply( _, NodeList )
			try {
				push.apply(arr = slice.call(preferredDoc.childNodes), preferredDoc.childNodes);
				// Support: Android<4.0
				// Detect silently failing push.apply
				arr[preferredDoc.childNodes.length].nodeType;
			} catch (e) {
				push = { apply: arr.length ?

					// Leverage slice if possible
					function (target, els) {
						push_native.apply(target, slice.call(els));
					} :

					// Support: IE<9
					// Otherwise append directly
					function (target, els) {
						var j = target.length,
						    i = 0;
						// Can't trust NodeList.length
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

				results = results || [];

				// Return early from calls with invalid selector or context
				if (typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {

					return results;
				}

				// Try to shortcut find operations (as opposed to filters) in HTML documents
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
									}

									// Element context
								} else {

									// Support: IE, Opera, Webkit
									// TODO: identify versions
									// getElementById can match elements by name instead of ID
									if (newContext && (elem = newContext.getElementById(m)) && contains(context, elem) && elem.id === m) {

										results.push(elem);
										return results;
									}
								}

								// Type selector
							} else if (match[2]) {
								push.apply(results, context.getElementsByTagName(selector));
								return results;

								// Class selector
							} else if ((m = match[3]) && support.getElementsByClassName && context.getElementsByClassName) {

								push.apply(results, context.getElementsByClassName(m));
								return results;
							}
						}

						// Take advantage of querySelectorAll
						if (support.qsa && !nonnativeSelectorCache[selector + " "] && (!rbuggyQSA || !rbuggyQSA.test(selector))) {

							if (nodeType !== 1) {
								newContext = context;
								newSelector = selector;

								// qSA looks outside Element context, which is not what we want
								// Thanks to Andrew Dupont for this workaround technique
								// Support: IE <=8
								// Exclude object elements
							} else if (context.nodeName.toLowerCase() !== "object") {

								// Capture the context ID, setting it first if necessary
								if (nid = context.getAttribute("id")) {
									nid = nid.replace(rcssescape, fcssescape);
								} else {
									context.setAttribute("id", nid = expando);
								}

								// Prefix every selector in the list
								groups = tokenize(selector);
								i = groups.length;
								while (i--) {
									groups[i] = "#" + nid + " " + toSelector(groups[i]);
								}
								newSelector = groups.join(",");

								// Expand context for sibling selectors
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
				}

				// All others
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
					}
					// release memory in IE
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
				    diff = cur && a.nodeType === 1 && b.nodeType === 1 && a.sourceIndex - b.sourceIndex;

				// Use IE sourceIndex if available on both nodes
				if (diff) {
					return diff;
				}

				// Check if b follows a
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
    * Returns a function to use in pseudos for input types
    * @param {String} type
    */
			function createInputPseudo(type) {
				return function (elem) {
					var name = elem.nodeName.toLowerCase();
					return name === "input" && elem.type === type;
				};
			}

			/**
    * Returns a function to use in pseudos for buttons
    * @param {String} type
    */
			function createButtonPseudo(type) {
				return function (elem) {
					var name = elem.nodeName.toLowerCase();
					return (name === "input" || name === "button") && elem.type === type;
				};
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
							}

							// Support: IE 6 - 11
							// Use the isDisabled shortcut property to check for disabled fieldset ancestors
							return elem.isDisabled === disabled ||

							// Where there is no isDisabled, check manually
							/* jshint -W018 */
							elem.isDisabled !== !disabled && inDisabledFieldset(elem) === disabled;
						}

						return elem.disabled === disabled;

						// Try to winnow out elements that can't be disabled before trusting the disabled property.
						// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
						// even exist on them, let alone have a boolean value.
					} else if ("label" in elem) {
						return elem.disabled === disabled;
					}

					// Remaining elements are neither :enabled nor :disabled
					return false;
				};
			}

			/**
    * Returns a function to use in pseudos for positionals
    * @param {Function} fn
    */
			function createPositionalPseudo(fn) {
				return markFunction(function (argument) {
					argument = +argument;
					return markFunction(function (seed, matches) {
						var j,
						    matchIndexes = fn([], seed.length, argument),
						    i = matchIndexes.length;

						// Match elements found at the specified indexes
						while (i--) {
							if (seed[j = matchIndexes[i]]) {
								seed[j] = !(matches[j] = seed[j]);
							}
						}
					});
				});
			}

			/**
    * Checks a node for validity as a Sizzle context
    * @param {Element|Object=} context
    * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
    */
			function testContext(context) {
				return context && typeof context.getElementsByTagName !== "undefined" && context;
			}

			// Expose support vars for convenience
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
				    doc = node ? node.ownerDocument || node : preferredDoc;

				// Return early if doc is invalid or already selected
				if (doc === document || doc.nodeType !== 9 || !doc.documentElement) {
					return document;
				}

				// Update global variables
				document = doc;
				docElem = document.documentElement;
				documentIsHTML = !isXML(document);

				// Support: IE 9-11, Edge
				// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
				if (preferredDoc !== document && (subWindow = document.defaultView) && subWindow.top !== subWindow) {

					// Support: IE 11, Edge
					if (subWindow.addEventListener) {
						subWindow.addEventListener("unload", unloadHandler, false);

						// Support: IE 9 - 10 only
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
				});

				// Support: IE<9
				support.getElementsByClassName = rnative.test(document.getElementsByClassName);

				// Support: IE<10
				// Check if getElementById returns elements by name
				// The broken getElementById methods don't pick up programmatically-set names,
				// so use a roundabout getElementsByName test
				support.getById = assert(function (el) {
					docElem.appendChild(el).id = expando;
					return !document.getElementsByName || !document.getElementsByName(expando).length;
				});

				// ID filter and find
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
					};

					// Support: IE 6 - 7 only
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
								}

								// Fall back on getElementsByName
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
				}

				// Tag
				Expr.find["TAG"] = support.getElementsByTagName ? function (tag, context) {
					if (typeof context.getElementsByTagName !== "undefined") {
						return context.getElementsByTagName(tag);

						// DocumentFragment nodes don't have gEBTN
					} else if (support.qsa) {
						return context.querySelectorAll(tag);
					}
				} : function (tag, context) {
					var elem,
					    tmp = [],
					    i = 0,

					// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
					results = context.getElementsByTagName(tag);

					// Filter out possible comments
					if (tag === "*") {
						while (elem = results[i++]) {
							if (elem.nodeType === 1) {
								tmp.push(elem);
							}
						}

						return tmp;
					}
					return results;
				};

				// Class
				Expr.find["CLASS"] = support.getElementsByClassName && function (className, context) {
					if (typeof context.getElementsByClassName !== "undefined" && documentIsHTML) {
						return context.getElementsByClassName(className);
					}
				};

				/* QSA/matchesSelector
    ---------------------------------------------------------------------- */

				// QSA and matchesSelector support

				// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
				rbuggyMatches = [];

				// qSa(:focus) reports false when true (Chrome 21)
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
						docElem.appendChild(el).innerHTML = "<a id='" + expando + "'></a>" + "<select id='" + expando + "-\r\\' msallowcapture=''>" + "<option selected=''></option></select>";

						// Support: IE8, Opera 11-12.16
						// Nothing should be selected when empty strings follow ^= or $= or *=
						// The test attribute must be unknown in Opera but "safe" for WinRT
						// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
						if (el.querySelectorAll("[msallowcapture^='']").length) {
							rbuggyQSA.push("[*^$]=" + whitespace + "*(?:''|\"\")");
						}

						// Support: IE8
						// Boolean attributes and "value" are not treated correctly
						if (!el.querySelectorAll("[selected]").length) {
							rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");
						}

						// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
						if (!el.querySelectorAll("[id~=" + expando + "-]").length) {
							rbuggyQSA.push("~=");
						}

						// Webkit/Opera - :checked should return selected option elements
						// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
						// IE8 throws error here and will not see later tests
						if (!el.querySelectorAll(":checked").length) {
							rbuggyQSA.push(":checked");
						}

						// Support: Safari 8+, iOS 8+
						// https://bugs.webkit.org/show_bug.cgi?id=136851
						// In-page `selector#id sibling-combinator selector` fails
						if (!el.querySelectorAll("a#" + expando + "+*").length) {
							rbuggyQSA.push(".#.+[+~]");
						}
					});

					assert(function (el) {
						el.innerHTML = "<a href='' disabled='disabled'></a>" + "<select disabled='disabled'><option/></select>";

						// Support: Windows 8 Native Apps
						// The type and name attributes are restricted during .innerHTML assignment
						var input = document.createElement("input");
						input.setAttribute("type", "hidden");
						el.appendChild(input).setAttribute("name", "D");

						// Support: IE8
						// Enforce case-sensitivity of name attribute
						if (el.querySelectorAll("[name=d]").length) {
							rbuggyQSA.push("name" + whitespace + "*[*^$|!~]?=");
						}

						// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
						// IE8 throws error here and will not see later tests
						if (el.querySelectorAll(":enabled").length !== 2) {
							rbuggyQSA.push(":enabled", ":disabled");
						}

						// Support: IE9-11+
						// IE's :disabled selector does not pick up the children of disabled fieldsets
						docElem.appendChild(el).disabled = true;
						if (el.querySelectorAll(":disabled").length !== 2) {
							rbuggyQSA.push(":enabled", ":disabled");
						}

						// Opera 10-11 does not throw on post-comma invalid pseudos
						el.querySelectorAll("*,:x");
						rbuggyQSA.push(",.*:");
					});
				}

				if (support.matchesSelector = rnative.test(matches = docElem.matches || docElem.webkitMatchesSelector || docElem.mozMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector)) {

					assert(function (el) {
						// Check to see if it's possible to do matchesSelector
						// on a disconnected node (IE 9)
						support.disconnectedMatch = matches.call(el, "*");

						// This should fail with an exception
						// Gecko does not error, returns false instead
						matches.call(el, "[s!='']:x");
						rbuggyMatches.push("!=", pseudos);
					});
				}

				rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));
				rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join("|"));

				/* Contains
    ---------------------------------------------------------------------- */
				hasCompare = rnative.test(docElem.compareDocumentPosition);

				// Element contains another
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
					}

					// Sort on method existence if only one input has compareDocumentPosition
					var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
					if (compare) {
						return compare;
					}

					// Calculate position if both inputs belong to the same document
					compare = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) :

					// Otherwise we know they are disconnected
					1;

					// Disconnected nodes
					if (compare & 1 || !support.sortDetached && b.compareDocumentPosition(a) === compare) {

						// Choose the first element that is related to our preferred document
						if (a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a)) {
							return -1;
						}
						if (b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b)) {
							return 1;
						}

						// Maintain original order
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
					    bp = [b];

					// Parentless nodes are either documents or disconnected
					if (!aup || !bup) {
						return a === document ? -1 : b === document ? 1 : aup ? -1 : bup ? 1 : sortInput ? indexOf(sortInput, a) - indexOf(sortInput, b) : 0;

						// If the nodes are siblings, we can do a quick check
					} else if (aup === bup) {
						return siblingCheck(a, b);
					}

					// Otherwise we need full lists of their ancestors for comparison
					cur = a;
					while (cur = cur.parentNode) {
						ap.unshift(cur);
					}
					cur = b;
					while (cur = cur.parentNode) {
						bp.unshift(cur);
					}

					// Walk down the tree looking for a discrepancy
					while (ap[i] === bp[i]) {
						i++;
					}

					return i ?
					// Do a sibling check if the nodes have a common ancestor
					siblingCheck(ap[i], bp[i]) :

					// Otherwise nodes in our document sort first
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
						var ret = matches.call(elem, expr);

						// IE 9's matchesSelector returns false on disconnected nodes
						if (ret || support.disconnectedMatch ||
						// As well, disconnected nodes are said to be in a document
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
				    i = 0;

				// Unless we *know* we can detect duplicates, assume their presence
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
				}

				// Clear input after sorting to release objects
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
				}
				// Do not include comment or processing instruction nodes

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
					">": { dir: "parentNode", first: true },
					" ": { dir: "parentNode" },
					"+": { dir: "previousSibling", first: true },
					"~": { dir: "previousSibling" }
				},

				preFilter: {
					"ATTR": function (match) {
						match[1] = match[1].replace(runescape, funescape);

						// Move the given value to match[3] whether quoted or unquoted
						match[3] = (match[3] || match[4] || match[5] || "").replace(runescape, funescape);

						if (match[2] === "~=") {
							match[3] = " " + match[3] + " ";
						}

						return match.slice(0, 4);
					},

					"CHILD": function (match) {
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
							}

							// numeric x and y parameters for Expr.filter.CHILD
							// remember that false/true cast respectively to 0/1
							match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === "even" || match[3] === "odd"));
							match[5] = +(match[7] + match[8] || match[3] === "odd");

							// other types prohibit arguments
						} else if (match[3]) {
							Sizzle.error(match[0]);
						}

						return match;
					},

					"PSEUDO": function (match) {
						var excess,
						    unquoted = !match[6] && match[2];

						if (matchExpr["CHILD"].test(match[0])) {
							return null;
						}

						// Accept quoted arguments as-is
						if (match[3]) {
							match[2] = match[4] || match[5] || "";

							// Strip excess characters from unquoted arguments
						} else if (unquoted && rpseudo.test(unquoted) && (
						// Get excess from tokenize (recursively)
						excess = tokenize(unquoted, true)) && (
						// advance to the next closing parenthesis
						excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)) {

							// excess is a negative index
							match[0] = match[0].slice(0, excess);
							match[2] = unquoted.slice(0, excess);
						}

						// Return only captures needed by the pseudo filter method (type and argument)
						return match.slice(0, 3);
					}
				},

				filter: {

					"TAG": function (nodeNameSelector) {
						var nodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
						return nodeNameSelector === "*" ? function () {
							return true;
						} : function (elem) {
							return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
						};
					},

					"CLASS": function (className) {
						var pattern = classCache[className + " "];

						return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function (elem) {
							return pattern.test(typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "");
						});
					},

					"ATTR": function (name, operator, check) {
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

					"CHILD": function (type, what, argument, first, last) {
						var simple = type.slice(0, 3) !== "nth",
						    forward = type.slice(-4) !== "last",
						    ofType = what === "of-type";

						return first === 1 && last === 0 ?

						// Shortcut for :nth-*(n)
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
										}
										// Reverse direction for :only-* (if we haven't yet done so)
										start = dir = type === "only" && !start && "nextSibling";
									}
									return true;
								}

								start = [forward ? parent.firstChild : parent.lastChild];

								// non-xml :nth-child(...) stores cache data on `parent`
								if (forward && useCache) {

									// Seek `elem` from a previously-cached index

									// ...in a gzip-friendly way
									node = parent;
									outerCache = node[expando] || (node[expando] = {});

									// Support: IE <9 only
									// Defend against cloned attroperties (jQuery gh-1709)
									uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});

									cache = uniqueCache[type] || [];
									nodeIndex = cache[0] === dirruns && cache[1];
									diff = nodeIndex && cache[2];
									node = nodeIndex && parent.childNodes[nodeIndex];

									while (node = ++nodeIndex && node && node[dir] || (

									// Fallback to seeking `elem` from the start
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
										outerCache = node[expando] || (node[expando] = {});

										// Support: IE <9 only
										// Defend against cloned attroperties (jQuery gh-1709)
										uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});

										cache = uniqueCache[type] || [];
										nodeIndex = cache[0] === dirruns && cache[1];
										diff = nodeIndex;
									}

									// xml :nth-child(...)
									// or :nth-last-child(...) or :nth(-last)?-of-type(...)
									if (diff === false) {
										// Use the same loop as above to seek `elem` from the start
										while (node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {

											if ((ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) && ++diff) {

												// Cache the index of each encountered element
												if (useCache) {
													outerCache = node[expando] || (node[expando] = {});

													// Support: IE <9 only
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
								}

								// Incorporate the offset, then check against cycle size
								diff -= last;
								return diff === first || diff % first === 0 && diff / first >= 0;
							}
						};
					},

					"PSEUDO": function (pseudo, argument) {
						// pseudo-class names are case-insensitive
						// http://www.w3.org/TR/selectors/#pseudo-classes
						// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
						// Remember that setFilters inherits from pseudos
						var args,
						    fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo);

						// The user may use createPseudo to indicate that
						// arguments are needed to create the filter function
						// just as Sizzle does
						if (fn[expando]) {
							return fn(argument);
						}

						// But maintain support for old signatures
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
							    i = seed.length;

							// Match elements unmatched by `matcher`
							while (i--) {
								if (elem = unmatched[i]) {
									seed[i] = !(matches[i] = elem);
								}
							}
						}) : function (elem, context, xml) {
							input[0] = elem;
							matcher(input, null, xml, results);
							// Don't keep the element (issue #299)
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
					"target": function (elem) {
						var hash = window.location && window.location.hash;
						return hash && hash.slice(1) === elem.id;
					},

					"root": function (elem) {
						return elem === docElem;
					},

					"focus": function (elem) {
						return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
					},

					// Boolean properties
					"enabled": createDisabledPseudo(false),
					"disabled": createDisabledPseudo(true),

					"checked": function (elem) {
						// In CSS3, :checked should return both checked and selected elements
						// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
						var nodeName = elem.nodeName.toLowerCase();
						return nodeName === "input" && !!elem.checked || nodeName === "option" && !!elem.selected;
					},

					"selected": function (elem) {
						// Accessing this property makes selected-by-default
						// options in Safari work properly
						if (elem.parentNode) {
							elem.parentNode.selectedIndex;
						}

						return elem.selected === true;
					},

					// Contents
					"empty": function (elem) {
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
					}

					// Removed custom pseudo-classes
				}
			};

			// Removed custom pseudo-classes

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
				var splitCompoundSelector = function (tokens) {

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
				var compareFunction = function (left, right) {
					var leftValue = TOKEN_TYPES_VALUES[left.type];
					var rightValue = TOKEN_TYPES_VALUES[right.type];
					return leftValue - rightValue;
				};

				/**
     * Checks if the specified tokens group is sortable.
     * We do not re-sort tokens in case of any positional or child pseudos in the group
     */
				var isSortable = function (tokens) {

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
				var sortTokens = function (tokens) {

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
				var sortTokenGroups = function (groups) {
					var sortedGroups = [];
					var len = groups.length;
					var i = 0;
					for (; i < len; i++) {
						sortedGroups.push(sortTokens(groups[i]));
					}
					return sortedGroups;
				};

				// Expose
				return sortTokenGroups;
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
				removeTrailingSpaces(groups[groups.length - 1]);

				// We need sorted tokens to make cache work properly
				var sortedGroups = sortTokenGroups(groups);

				var selectors = [];
				for (var i = 0; i < groups.length; i++) {
					var tokenGroups = groups[i];
					var selectorText = toSelector(tokenGroups);

					selectors.push({
						// Sizzle expects an array of token groups when compiling a selector
						groups: [tokenGroups],
						selectorText: selectorText
					});

					// Now make sure that selector tokens are cached
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

					matched = false;

					// Combinators
					if (match = rcombinators.exec(soFar)) {
						matched = match.shift();
						tokens.push({
							value: matched,
							// Cast descendant combinators to space
							type: match[0].replace(rtrim, " ")
						});
						soFar = soFar.slice(matched.length);
					}

					// Filters
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
				}

				// Return the length of the invalid excess
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

				return combinator.first ?
				// Check against closest ancestor/preceding element
				function (elem, context, xml) {
					while (elem = elem[dir]) {
						if (elem.nodeType === 1 || checkNonElements) {
							return matcher(elem, context, xml);
						}
					}
					return false;
				} :

				// Check against all ancestor/preceding elements
				function (elem, context, xml) {
					var oldCache,
					    uniqueCache,
					    outerCache,
					    newCache = [dirruns, doneName];

					// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
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
								outerCache = elem[expando] || (elem[expando] = {});

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[elem.uniqueID] || (outerCache[elem.uniqueID] = {});

								if (skip && skip === elem.nodeName.toLowerCase()) {
									elem = elem[dir] || elem;
								} else if ((oldCache = uniqueCache[key]) && oldCache[0] === dirruns && oldCache[1] === doneName) {

									// Assign to newCache so results back-propagate to previous elements
									return newCache[2] = oldCache[2];
								} else {
									// Reuse newcache so results back-propagate to previous elements
									uniqueCache[key] = newCache;

									// A match means we're done; a fail means we have to keep checking
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
					    matcherOut = matcher ?
					// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
					postFinder || (seed ? preFilter : preexisting || postFilter) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results : matcherIn;

					// Find primary matches
					if (matcher) {
						matcher(matcherIn, matcherOut, context, xml);
					}

					// Apply postFilter
					if (postFilter) {
						temp = condense(matcherOut, postMap);
						postFilter(temp, [], context, xml);

						// Un-match failing elements by moving them back to matcherIn
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
							}

							// Move matched elements from seed to results to keep them synchronized
							i = matcherOut.length;
							while (i--) {
								if ((elem = matcherOut[i]) && (temp = postFinder ? indexOf(seed, elem) : preMap[i]) > -1) {

									seed[temp] = !(results[temp] = elem);
								}
							}
						}

						// Add elements to results, through postFinder if defined
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
					var ret = !leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
					// Avoid hanging onto element (issue #299)
					checkContext = null;
					return ret;
				}];

				for (; i < len; i++) {
					if (matcher = Expr.relative[tokens[i].type]) {
						matchers = [addCombinator(elementMatcher(matchers), matcher)];
					} else {
						matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches);

						// Return special upon seeing a positional matcher
						if (matcher[expando]) {
							// Find the next relative operator (if any) for proper handling
							j = ++i;
							for (; j < len; j++) {
								if (Expr.relative[tokens[j].type]) {
									break;
								}
							}
							return setMatcher(i > 1 && elementMatcher(matchers), i > 1 && toSelector(
							// If the preceding token was a descendant combinator, insert an implicit any-element `*`
							tokens.slice(0, i - 1).concat({ value: tokens[i - 2].type === " " ? "*" : "" })).replace(rtrim, "$1"), matcher, i < j && matcherFromTokens(tokens.slice(i, j)), j < len && matcherFromTokens(tokens = tokens.slice(j)), j < len && toSelector(tokens));
						}
						matchers.push(matcher);
					}
				}

				return elementMatcher(matchers);
			}

			function matcherFromGroupMatchers(elementMatchers, setMatchers) {
				var bySet = setMatchers.length > 0,
				    byElement = elementMatchers.length > 0,
				    superMatcher = function (seed, context, xml, results, outermost) {
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
					}

					// Add elements passing elementMatchers directly to results
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
						}

						// Track unmatched elements for set filters
						if (bySet) {
							// They will have gone through all possible matchers
							if (elem = !matcher && elem) {
								matchedCount--;
							}

							// Lengthen the array for every element, matched or not
							if (seed) {
								unmatched.push(elem);
							}
						}
					}

					// `i` is now the count of elements visited above, and adding it to `matchedCount`
					// makes the latter nonnegative.
					matchedCount += i;

					// Apply set filters to unmatched elements
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
							}

							// Discard index placeholder values to get only actual matches
							setMatched = condense(setMatched);
						}

						// Add matches to results
						push.apply(results, setMatched);

						// Seedless set matches succeeding multiple successful matchers stipulate sorting
						if (outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1) {

							Sizzle.uniqueSort(results);
						}
					}

					// Override manipulation of globals by nested matchers
					if (outermost) {
						dirruns = dirrunsUnique;
						outermostContext = contextBackup;
					}

					return unmatched;
				};

				return bySet ? markFunction(superMatcher) : superMatcher;
			}

			compile = Sizzle.compile = function (selector, match /* Internal Use Only */) {
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
					}

					// Cache the compiled function
					cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers));

					// Save selector and tokenization
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

				results = results || [];

				// Try to minimize operations if there is only one selector in the list and no seed
				// (the latter of which guarantees us context)
				if (match.length === 1) {

					// Reduce context if the leading compound selector is an ID
					tokens = match[0] = match[0].slice(0);
					if (tokens.length > 2 && (token = tokens[0]).type === "ID" && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]) {

						context = (Expr.find["ID"](token.matches[0].replace(runescape, funescape), context) || [])[0];
						if (!context) {
							return results;

							// Precompiled matchers will still verify ancestry, so step up a level
						} else if (compiled) {
							context = context.parentNode;
						}

						selector = selector.slice(tokens.shift().value.length);
					}

					// Fetch a seed set for right-to-left matching
					i = matchExpr["needsContext"].test(selector) ? 0 : tokens.length;
					while (i--) {
						token = tokens[i];

						// Abort if we hit a combinator
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
				}

				// Compile and execute a filtering function if one is not provided
				// Provide `match` to avoid retokenization if we modified the selector above
				(compiled || compile(selector, match))(seed, context, !documentIsHTML, results, !context || rsibling.test(selector) && testContext(context.parentNode) || context);
				return results;
			};

			// One-time assignments

			// Sort stability
			support.sortStable = expando.split("").sort(sortOrder).join("") === expando;

			// Support: Chrome 14-35+
			// Always assume duplicates if they aren't passed to the comparison function
			support.detectDuplicates = !!hasDuplicate;

			// Initialize against the default document
			setDocument();

			// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
			// Detached nodes confoundingly follow *each other*
			support.sortDetached = assert(function (el) {
				// Should return 1, but returns 4 (following)
				return el.compareDocumentPosition(document.createElement("fieldset")) & 1;
			});

			// Support: IE<8
			// Prevent attribute/property "interpolation"
			// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
			if (!assert(function (el) {
				el.innerHTML = "<a href='#'></a>";
				return el.firstChild.getAttribute("href") === "#";
			})) {
				addHandle("type|href|height|width", function (elem, name, isXML) {
					if (!isXML) {
						return elem.getAttribute(name, name.toLowerCase() === "type" ? 1 : 2);
					}
				});
			}

			// Support: IE<9
			// Use defaultValue in place of getAttribute("value")
			if (!support.attributes || !assert(function (el) {
				el.innerHTML = "<input/>";
				el.firstChild.setAttribute("value", "");
				return el.firstChild.getAttribute("value") === "";
			})) {
				addHandle("value", function (elem, name, isXML) {
					if (!isXML && elem.nodeName.toLowerCase() === "input") {
						return elem.defaultValue;
					}
				});
			}

			// Support: IE<9
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
			}

			// EXPOSE

			// Do not expose Sizzle to the global scope in the case of AdGuard ExtendedCss build

			return Sizzle;

			// EXPOSE
		}(window);

		//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	}
};

/* global utils, CSSRule */

/**
 * `:properties(propertyFilter)` pseudo class support works by looking up
 * selectors that are applied to styles whose style declaration matches
 * arguments passed to the pseudo class.
 * `sheetToFilterSelectorMap` contains a data mapping (stylesheets, filter)
 * -> selector.
 */
var StyleObserver = function () {
    // jshint ignore:line

    // Utility functions
    var styleSelector = 'style';

    /**
     * A set of stylesheet nodes that should be ignored by the StyleObserver.
     * This field is essential in the case of AdGuard products that add regular stylesheets
     * in order to apply CSS rules
     *
     * @type {Set.<HTMLElement>}
     */
    var ignoredStyleNodes = void 0;

    /**
     * The flag is used for the StyleObserver lazy initialization
     */
    var initialized = false;

    var searchTree = function (node, selector) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }
        var nodes = node.querySelectorAll(selector);
        if (node[utils.matchesPropertyName](selector)) {
            nodes = Array.prototype.slice.call(nodes);
            nodes.push(node);
        }
        return nodes;
    };

    var isSameOriginStyle = function (styleSheet) {
        var href = styleSheet.href;
        if (href === null) {
            return true;
        }
        return utils.isSameOrigin(href, location, document.domain);
    };

    /**
     * 'rel' attribute is a ASCII-whitespace separated list of keywords.
     * {@link https://html.spec.whatwg.org/multipage/links.html#linkTypes}
     */
    var reStylesheetRel = /(?:^|\s)stylesheet(?:$|\s)/;

    var eventTargetIsLinkStylesheet = function (target) {
        return target instanceof Element && target.nodeName === 'LINK' && reStylesheetRel.test(target.rel);
    };

    // Functions constituting mutation handler functions
    var onStyleAdd = function (style) {
        if (!sheetToFilterSelectorMap.has(style.sheet)) {
            pendingStyles.add(style);
            observeStyleModification(style);
        }
    };
    var onStyleRemove = function (style) {
        pendingStyles.delete(style);
    };
    var onAddedNode = function (addedNode) {
        if (addedNode.nodeType !== Node.ELEMENT_NODE) {
            return;
        }
        var styles = searchTree(addedNode, styleSelector);
        if (styles) {
            for (var _i = 0; _i < styles.length; _i++) {
                var style = styles[_i];
                onStyleAdd(style);
            }
        }
    };
    var onRemovedNode = function (removedNode) {
        if (removedNode.nodeType !== Node.ELEMENT_NODE) {
            return;
        }
        var styles = searchTree(removedNode, styleSelector);
        if (styles) {
            for (var _i2 = 0; _i2 < styles.length; _i2++) {
                var style = styles[_i2];
                onStyleRemove(style);
            }
        }
    };

    // Mutation handler functions
    var styleModHandler = function (mutations) {
        if (mutations.length) {
            for (var _i3 = 0; _i3 < mutations.length; _i3++) {
                var mutation = mutations[_i3];
                var target = void 0;
                if (mutation.type === 'characterData') {
                    target = mutation.target.parentNode;
                } else {
                    target = mutation.target;
                }
                pendingStyles.add(target);
            }

            examineStylesScheduler.run();
            invalidateScheduler.run();
        }
    };
    var styleModListenerFallback = function (event) {
        pendingStyles.add(event.target.parentNode);
        examineStylesScheduler.run();
        invalidateScheduler.run();
    };
    var styleAdditionHandler = function (mutations) {
        var hasPendingStyles = false;

        for (var _i4 = 0; _i4 < mutations.length; _i4++) {
            var mutation = mutations[_i4];
            var addedNodes = mutation.addedNodes,
                removedNodes = mutation.removedNodes;
            if (addedNodes) {
                for (var _i5 = 0; _i5 < addedNodes.length; _i5++) {
                    var addedNode = addedNodes[_i5];
                    hasPendingStyles = true;
                    onAddedNode(addedNode);
                }
            }
            if (removedNodes) {
                for (var _i6 = 0; _i6 < removedNodes.length; _i6++) {
                    var removedNode = removedNodes[_i6];
                    onRemovedNode(removedNode);
                }
            }
        }

        if (hasPendingStyles) {
            examineStylesScheduler.run();
            invalidateScheduler.run();
        }
    };
    var styleAdditionListenerFallback = function (event) {
        onAddedNode(event.target);
        examineStylesScheduler.run();
        invalidateScheduler.run();
    };
    var styleRemovalListenerFallback = function (event) {
        onRemovedNode(event.target);
        examineStylesScheduler.run();
        invalidateScheduler.run();
    };

    var collectLoadedLinkStyle = function (evt) {
        var target = evt.target;
        if (!eventTargetIsLinkStylesheet(target)) {
            return;
        }
        pendingStyles.add(target);
        examineStylesScheduler.run();
    };
    var discardErroredLinkStyle = function (evt) {
        var target = evt.target;
        if (!eventTargetIsLinkStylesheet(target)) {
            return;
        }
        pendingStyles.remove(target);
        examineStylesScheduler.run();
    };

    // MutationObserver instances to be used in this class.
    // Since we start calling `.observe()` on those when we are compiling filters,
    // we can ensure that mutation callbacks for those will be called before those
    // in extended-css.js.
    var styleAdditionObserver = void 0;
    var styleModObserver = void 0;
    var observing = false;

    var observeStyle = function () {
        if (observing) {
            return;
        }
        observing = true;
        if (utils.MutationObserver) {
            styleAdditionObserver = new utils.MutationObserver(styleAdditionHandler);
            styleModObserver = new utils.MutationObserver(styleModHandler);
            styleAdditionObserver.observe(document.documentElement, { childList: true, subtree: true });
        } else {
            document.documentElement.addEventListener('DOMNodeInserted', styleAdditionListenerFallback);
            document.documentElement.addEventListener('DOMNodeRemoved', styleRemovalListenerFallback);
        }
        document.addEventListener('load', collectLoadedLinkStyle, true);
        document.addEventListener('error', discardErroredLinkStyle, true);
    };

    var observeStyleModification = function (styleNode) {
        if (utils.MutationObserver) {
            styleModObserver.observe(styleNode, { childList: true, subtree: true, characterData: true });
        } else {
            styleNode.addEventListener('DOMNodeInserted', styleModListenerFallback);
            styleNode.addEventListener('DOMNodeRemoved', styleModListenerFallback);
            styleNode.addEventListener('DOMCharacterDataModified', styleModListenerFallback);
        }
    };

    /**
     * Disconnects above mutation observers: styleAdditionObserver styleModObserver
     * and remove event listeners.
     */
    var disconnectObservers = function () {
        if (utils.MutationObserver) {
            if (styleAdditionObserver) {
                styleAdditionObserver.disconnect();
            }
            if (styleModObserver) {
                styleModObserver.disconnect();
            }
        } else {
            document.documentElement.removeEventListener('DOMNodeInserted', styleAdditionListenerFallback);
            document.documentElement.removeEventListener('DOMNodeRemoved', styleRemovalListenerFallback);

            var styles = document.querySelectorAll(styleSelector);

            for (var _i7 = 0; _i7 < styles.length; _i7++) {
                var style = styles[_i7];
                style.removeEventListener('DOMNodeInserted', styleModListenerFallback);
                style.removeEventListener('DOMNodeRemoved', styleModListenerFallback);
                style.removeEventListener('DOMCharacterDataModified', styleModListenerFallback);
            }
        }
        document.removeEventListener('load', collectLoadedLinkStyle);
        document.removeEventListener('error', discardErroredLinkStyle);
        observing = false;
    };

    /**
     * @type {Set<HTMLStyleElement|HTMLLinkElement>}
     */
    var pendingStyles = new utils.Set();

    /**
     * sheetToFilterSelectorMap contains a data that maps
     * styleSheet -> ( filter -> selectors ).
     * @type {WeakMap<CSSStyleSheet,Object<string,string>>}
     */
    var sheetToFilterSelectorMap = void 0;

    var anyStyleWasUpdated = void 0; // A boolean flag to be accessed in `examineStyles`
    // and `readStyleSheetContent` calls.
    var examinePendingStyles = function () {
        anyStyleWasUpdated = false;
        pendingStyles.forEach(readStyleNodeContent);
        // Invalidates cache if needed.
        if (anyStyleWasUpdated) {
            invalidateScheduler.runImmediately();
        }
        pendingStyles.clear();
    };

    var examineStylesScheduler = new utils.AsyncWrapper(examinePendingStyles);

    /** @param {HTMLStyleElement} styleNode */
    var readStyleNodeContent = function (styleNode) {
        var sheet = styleNode.sheet;
        if (!sheet) {
            // This can happen when an appended style or a loaded linked stylesheet is
            // detached from the document by now.
            return;
        }
        readStyleSheetContent(sheet);
    };
    /**
     * Populates sheetToFilterSelectorMap from styleSheet's content.
     * @param {CSSStyleSheet} styleSheet
     */
    var readStyleSheetContent = function (styleSheet) {
        if (!isSameOriginStyle(styleSheet)) {
            return;
        }
        if (isIgnored(styleSheet.ownerNode)) {
            return;
        }
        var rules = styleSheet.cssRules;
        var map = Object.create(null);

        for (var _i8 = 0; _i8 < rules.length; _i8++) {
            var rule = rules[_i8];
            if (rule.type !== CSSRule.STYLE_RULE) {
                /**
                 * Ignore media rules; this behavior is compatible with ABP.
                 * @todo Media query support
                 */
                continue;
            }
            var stringifiedStyle = stringifyStyle(rule);

            for (var _i9 = 0; _i9 < parsedFilters.length; _i9++) {
                var parsedFilter = parsedFilters[_i9];
                var re = parsedFilter.re;

                if (!re.test(stringifiedStyle)) {
                    continue;
                }

                anyStyleWasUpdated = true;
                // Strips out psedo elements
                // https://adblockplus.org/en/filters#elemhide-emulation
                var selectorText = rule.selectorText.replace(/::(?:after|before)/, '');
                var filter = parsedFilter.filter;

                if (typeof map[filter] === 'undefined') {
                    map[filter] = [selectorText];
                } else {
                    map[filter].push(selectorText);
                }
            }
        }

        sheetToFilterSelectorMap.set(styleSheet, map);
    };

    /**
     * Stringifies a CSSRule instances in a canonical way, compatible with ABP,
     * to be used in matching against regexes.
     * @param {CSSStyleRule} rule
     * @return {string}
     */
    var stringifyStyle = function (rule) {
        var styles = [];
        var style = rule.style;
        var i = void 0,
            l = void 0;
        for (i = 0, l = style.length; i < l; i++) {
            styles.push(style[i]);
        }
        styles.sort();
        for (i = 0; i < l; i++) {
            var property = styles[i];
            var value = style.getPropertyValue(property);
            var priority = style.getPropertyPriority(property);
            styles[i] += ': ' + value;
            if (priority.length) {
                styles[i] += '!' + priority;
            }
        }
        return styles.join(" ");
    };

    /**
     * A main function, to be used in Sizzle matcher.
     * returns a selector text that is
     * @param {string} filter
     * @return {Array<string>} a selector.
     */
    var getSelector = function (filter) {

        // Lazy-initialize the StyleObserver
        initialize();

        // getSelector will be triggered via mutation observer callbacks
        // and we assume that those are already throttled.
        examineStylesScheduler.runImmediately();
        invalidateScheduler.runImmediately();
        invalidateScheduler.runAsap();

        if (getSelectorCache[filter]) {
            return getSelectorCache[filter];
        }
        var styleSheets = document.styleSheets;
        var selectors = [];

        for (var _i10 = 0; _i10 < styleSheets.length; _i10++) {
            var styleSheet = styleSheets[_i10];
            if (styleSheet.disabled) {
                continue;
            } // Ignore disabled stylesheets.
            var map = sheetToFilterSelectorMap.get(styleSheet);
            if (typeof map === 'undefined') {
                // This can happen with cross-origin styles.
                continue;
            }
            Array.prototype.push.apply(selectors, map[filter]);
        }

        getSelectorCache[filter] = selectors;
        getSelectorCacheHasData = true;
        return selectors;
    };

    /**
     * Caching is based on following assumptions:
     *
     *  - Content of stylesheets does not change often.
     *  - Stylesheets' disabled state does not change often.
     *
     * For each fresh `getSelector` call, one has to iterate over document.styleSheets,
     * because one has to exclude disabled stylesheets.
     * getSelector will be called a lot in MutationObserver callbacks, and we assume that
     * stylesheets critical in `:properties` pseudo class are toggled on and off during it.
     * We use AsyncWrapper.runAsap to schedule cache invalidation in the most imminent
     * microtask queue.
     *
     * This requires thorough testing of StyleObserver for mutation-heavy environments.
     * This has a possibility of less granular cache refresh on IE, for IE11 incorrectly
     * implements microtasks and IE10's setImmediate is not that immediate.
     */
    var getSelectorCache = Object.create(null);
    var getSelectorCacheHasData = false;
    var invalidateCache = function () {
        if (getSelectorCacheHasData) {
            getSelectorCache = Object.create(null);
            getSelectorCacheHasData = false;
        }
    };
    var invalidateScheduler = new utils.AsyncWrapper(invalidateCache, 0);

    var reRegexRule = /^\/(.*)\/$/;

    var parsedFilters = [];
    var registeredFiltersMap = Object.create(null);

    var registerStylePropertyFilter = function (filter) {
        filter = filter.trim();
        if (registeredFiltersMap[filter]) {
            return;
        }
        var re = void 0;
        if (reRegexRule.test(filter)) {
            filter = filter.slice(1, -1);
            re = utils.pseudoArgToRegex(filter);
        } else {
            re = utils.createURLRegex(filter);
        }
        parsedFilters.push({
            filter: filter,
            re: re
        });
        registeredFiltersMap[filter] = true;

        /**
         * Mark StyleObserver as not initialized right after
         * the new property filter is registered
         */
        initialized = false;

        // It is also necessary to invalidate getSelectorCache right away
        invalidateCache();
    };

    /**
     * Initialization means:
     *
     *  - Initial processing of stylesheets in documents.
     *  - Starting to observe addition of styles.
     *
     * This function should be called only after all selectors are compiled.
     * @return {boolean} Whether it had to be initialized. If it returns false,
     * We can clear StyleObserver from the memory.
     */
    var initialize = function () {
        if (initialized) {
            return;
        }
        initialized = true;

        // If there is no `:properties` selector registered, indicates it
        // by returning false.
        if (parsedFilters.length === 0) {
            return false;
        }

        sheetToFilterSelectorMap = new utils.WeakMap();
        pendingStyles = new utils.Set();

        // Initial processing
        observeStyle();
        var sheets = document.styleSheets;

        for (var _i11 = 0; _i11 < sheets.length; _i11++) {
            var sheet = sheets[_i11];
            readStyleSheetContent(sheet);
            if (sheet.ownerNode.nodeName === 'STYLE' && !isIgnored(sheet.ownerNode)) {
                observeStyleModification(sheet.ownerNode);
            }
        }

        return true;
    };

    /**
     * Exported method to disconnect existing mutation observers and remove
     * event listeners, clear collections and caches.
     */
    var clear = function () {
        if (!initialized) {
            return;
        }
        initialized = false;
        invalidateCache();
        disconnectObservers();
        if (pendingStyles) {
            pendingStyles.clear();
        }
        sheetToFilterSelectorMap = pendingStyles = ignoredStyleNodes = null;
    };

    /**
     * Creates a new pseudo-class and registers it in Sizzle
     */
    var extendSizzle = function (Sizzle) {
        Sizzle.selectors.pseudos["properties"] = Sizzle.selectors.pseudos["-abp-properties"] = Sizzle.selectors.createPseudo(function (propertyFilter) {
            registerStylePropertyFilter(propertyFilter);
            return function (element) {
                var selectors = getSelector(propertyFilter);
                if (selectors.length === 0) {
                    return false;
                }

                for (var _i12 = 0; _i12 < selectors.length; _i12++) {
                    var selector = selectors[_i12];
                    if (element[utils.matchesPropertyName](selector)) {
                        return true;
                    }
                }

                return false;
            };
        });
    };

    /**
     * Checks if stylesheet node is in the list of ignored
     * @param {HTMLElement} styleNode Stylesheet owner node
     */
    var isIgnored = function (styleNode) {
        return ignoredStyleNodes && ignoredStyleNodes.has(styleNode);
    };

    /**
     * Sets a list of stylesheet nodes that must be ignored by the StyleObserver.
     *
     * @param {Array.<HTMLElement>} styleNodesToIgnore A list of stylesheet nodes. Can be empty or null.
     */
    var setIgnoredStyleNodes = function (styleNodesToIgnore) {

        // StyleObserver should be fully reinitialized after that
        if (initialized || observing) {
            clear();
        }

        if (styleNodesToIgnore) {
            ignoredStyleNodes = new utils.Set(styleNodesToIgnore);
        } else {
            ignoredStyleNodes = null;
        }
    };

    return {
        clear: clear,
        extendSizzle: extendSizzle,
        getSelector: getSelector,
        setIgnoredStyleNodes: setIgnoredStyleNodes
    };
}();

/* global utils */
/**
 * Class that extends Sizzle and adds support for "matches-css" pseudo element.
 */
var StylePropertyMatcher = function (window, document) {
    // jshint ignore:line

    var isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 && navigator.userAgent && !navigator.userAgent.match('CriOS');
    var isPhantom = !!window._phantom;
    var useFallback = isPhantom && !!window.getMatchedCSSRules;

    /**
     * Unquotes specified value
     * Webkit-based browsers singlequotes <string> content property values
     * Other browsers doublequotes content property values.
     */
    var removeContentQuotes = function (value) {
        if (typeof value === "string") {
            return value.replace(/^(["'])([\s\S]*)\1$/, '$2');
        }
        return value;
    };

    /**
     * Unlike Safari, Chrome and FF doublequotes url() property value.
     * I suppose it would be better to leave it unquoted.
     */
    var removeUrlQuotes = function (value) {
        if (typeof value !== "string" || value.indexOf("url(\"") < 0) {
            return value;
        }

        var re = /url\(\"(.*?)\"\)/g;
        return value.replace(re, "url($1)");
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
    var getComputedStylePropertyValue = function (element, pseudoElement, propertyName) {
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
                value = style.getPropertyValue(propertyName);
                // https://bugs.webkit.org/show_bug.cgi?id=93445
                if (propertyName === 'opacity' && isSafari) {
                    value = (Math.round(parseFloat(value) * 100) / 100).toString();
                }
            }
        }

        value = removeUrlQuotes(value);
        if (propertyName === "content") {
            value = removeContentQuotes(value);
        }

        return value;
    };

    /**
     * Class that matches element style against the specified expression
     * @member {string} propertyName
     * @member {string} pseudoElement
     * @member {RegExp} regex
     */
    var Matcher = function (propertyFilter, pseudoElement) {
        this.pseudoElement = pseudoElement;
        try {
            var index = propertyFilter.indexOf(":");
            this.propertyName = propertyFilter.substring(0, index).trim();
            var pattern = propertyFilter.substring(index + 1).trim();

            // Unescaping pattern
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
            utils.logError("StylePropertyMatcher: invalid match string " + propertyFilter);
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
    var extendSizzle = function (sizzle) {
        // First of all we should prepare Sizzle engine
        sizzle.selectors.pseudos["matches-css"] = sizzle.selectors.createPseudo(function (propertyFilter) {
            var matcher = new Matcher(propertyFilter);
            return function (element) {
                return matcher.matches(element);
            };
        });
        sizzle.selectors.pseudos["matches-css-before"] = sizzle.selectors.createPseudo(function (propertyFilter) {
            var matcher = new Matcher(propertyFilter, ":before");
            return function (element) {
                return matcher.matches(element);
            };
        });
        sizzle.selectors.pseudos["matches-css-after"] = sizzle.selectors.createPseudo(function (propertyFilter) {
            var matcher = new Matcher(propertyFilter, ":after");
            return function (element) {
                return matcher.matches(element);
            };
        });
    };

    // EXPOSE
    return {
        extendSizzle: extendSizzle
    };
}(window, document);

/* global Sizzle, StylePropertyMatcher, ExtendedCssParser, initializeSizzle, StyleObserver, utils */

/**
 * Extended selector factory module, for creating extended selector classes.
 *
 * Extended selection capabilities description:
 * https://github.com/AdguardTeam/ExtendedCss/blob/master/README.md
 */

var ExtendedSelectorFactory = function () {
    // jshint ignore:line

    var PSEUDO_EXTENSIONS_MARKERS = [":has", ":contains", ":has-text", ":matches-css", ":properties", ":-abp-has", ":-abp-has-text", ":-abp-properties", ":if", ":if-not"];
    var initialized = false;
    /**
     * Lazy initialization of the ExtendedSelectorFactory and objects that might be necessary for creating and applying styles.
     * This method extends Sizzle engine that we use under the hood with our custom pseudo-classes.
     */
    function initialize() {
        if (initialized) {
            return;
        }
        initialized = true;

        // Our version of Sizzle is initialized lazily as well
        initializeSizzle();

        // Add :matches-css-*() support
        StylePropertyMatcher.extendSizzle(Sizzle);

        // Add :contains, :has-text, :-abp-contains support
        Sizzle.selectors.pseudos["contains"] = Sizzle.selectors.pseudos["has-text"] = Sizzle.selectors.pseudos["-abp-contains"] = Sizzle.selectors.createPseudo(function (text) {
            if (/^\s*\/.*\/\s*$/.test(text)) {
                text = text.trim().slice(1, -1).replace(/\\([\\"])/g, '$1');
                var regex = void 0;
                try {
                    regex = new RegExp(text);
                } catch (e) {
                    throw new Error('Invalid argument of :contains pseudo class: ' + text);
                }
                return function (elem) {
                    return regex.test(elem.textContent);
                };
            } else {
                text = text.replace(/\\([\\()[\]"])/g, '$1');
                return function (elem) {
                    return elem.textContent.indexOf(text) > -1;
                };
            }
        });

        // Add :if, :-abp-has support
        Sizzle.selectors.pseudos["if"] = Sizzle.selectors.pseudos["-abp-has"] = Sizzle.selectors.pseudos["has"];

        // Add :if-not support
        Sizzle.selectors.pseudos["if-not"] = Sizzle.selectors.createPseudo(function (selector) {
            if (typeof selector === "string") {
                Sizzle.compile(selector);
            }
            return function (elem) {
                return Sizzle(selector, elem).length === 0; // jshint ignore:line
            };
        });

        // Add :properties, :-abp-properties support
        StyleObserver.extendSizzle(Sizzle);
    }

    /**
     * Checks if specified token can be used by document.querySelectorAll.
     */
    function isSimpleToken(token) {
        var type = token.type;
        if (type === "ID" || type === "CLASS" || type === "ATTR" || type === "TAG" || type === "CHILD") {
            // known simple tokens
            return true;
        }

        if (type === "PSEUDO") {
            // check if value contains any of extended pseudo classes
            var i = PSEUDO_EXTENSIONS_MARKERS.length;
            while (i--) {
                if (token.value.indexOf(PSEUDO_EXTENSIONS_MARKERS[i]) >= 0) {
                    return false;
                }
            }
            return true;
        }
        // all others aren't simple
        return false;
    }

    /**
     * Checks if specified token is a combinator
     */
    function isRelationToken(token) {
        var type = token.type;
        return type === " " || type === ">" || type === '+' || type === '~';
    }

    /**
     * A selector obtained from `:properties` pseudo usually contains id or class selector;
     * We apply 'properties reverse search' when `:properties` is the most specific part.
     */
    function tokenHasHigherSpecificityThanPropertiesPseudo(token) {
        var type = token.type;
        return type === 'ID' || type === 'CLASS';
    }

    function isPropertiesPseudo(token) {
        var type = token.type;
        if (type === "PSEUDO") {
            var pseudo = token.matches[0];
            if (pseudo === '-abp-properties' || pseudo === 'properties') {
                return true;
            }
        }
        return false;
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
     *  A properties-heavy extended selector
     *    - such as `*:properties(background-image:/data\:/), where we apply "Properties Reverse Search".
     *
     * For a compound selector `X:-abp-properties(Y)`, we apply the reverse search iff `X` does not contain
     * an id selector or a class selector. This is based on an observation that in most of use cases, a selector
     * obtained from `-abp-properties(Y)` contains id or class selectors.
     */
    function ExtendedSelectorParser(selectorText, tokens, debug) {
        initialize();

        if (typeof tokens === 'undefined') {
            this.selectorText = ExtendedCssParser.normalize(selectorText);
            // Passing `returnUnsorted` in order to receive tokens in the order that's valid for the browser
            // In Sizzle internally, the tokens are re-sorted: https://github.com/AdguardTeam/ExtendedCss/issues/55
            this.tokens = Sizzle.tokenize(this.selectorText, false, { returnUnsorted: true });
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
        createSelector: function () {
            var debug = this.debug;
            var tokens = this.tokens;
            var selectorText = this.selectorText;
            if (tokens.length !== 1) {
                // Comma-separate selector - can't optimize further
                return new TraitLessSelector(selectorText, debug);
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
            }
            // i is pointing to the start of a complex part.
            var firstPropertiesPseudoIndex = this.getHeavyPropertiesPseudoIndex(i);
            for (; i < l; i++) {
                if (i === firstPropertiesPseudoIndex) {
                    continue;
                }
                complex += tokens[i].value;
            }
            if (firstPropertiesPseudoIndex !== -1) {
                var propertyFilter = tokens[firstPropertiesPseudoIndex].matches[1];
                return new PropertiesHeavySelector(selectorText, simple, relation, complex, propertyFilter, debug);
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
        getSplitPoint: function () {
            var tokens = this.tokens[0];
            // We split selector only when the last compound selector
            // is the only extended selector.
            var latestRelationTokenIndex = -1;
            var haveMetComplexToken = false;
            for (var i = 0, l = tokens.length; i < l; i++) {
                var token = tokens[i];
                if (isRelationToken(token)) {
                    if (haveMetComplexToken) {
                        return;
                    } else {
                        latestRelationTokenIndex = i;
                    }
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
         * @return {number} An index of the first "heavy" properties pseudo, from startIndex.
         * -1 if there is no properties pseudo after then, or there is a token that is heavier than
         * the properties pseudo.
         */
        getHeavyPropertiesPseudoIndex: function (startIndex) {
            var tokens = this.tokens[0];
            var haveMetTokenSpecificEnough = false;
            var firstPropertiesPseudoIndex = -1;
            for (var i = startIndex, l = tokens.length; i < l; i++) {
                var token = tokens[i];
                if (!haveMetTokenSpecificEnough && tokenHasHigherSpecificityThanPropertiesPseudo(token)) {
                    haveMetTokenSpecificEnough = true;
                }
                if (firstPropertiesPseudoIndex === -1 && isPropertiesPseudo(token)) {
                    firstPropertiesPseudoIndex = i;
                }
            }
            if (haveMetTokenSpecificEnough) {
                return -1;
            }
            return firstPropertiesPseudoIndex;
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
        querySelectorAll: function () {
            return document.querySelectorAll(this.selectorText);
        },
        matches: function (element) {
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
        querySelectorAll: function () {
            return Sizzle(this.selectorText); // jshint ignore:line
        },
        /** @final */
        matches: function (element) {
            return Sizzle.matchesSelector(element, this.selectorText);
        },
        /** @final */
        isDebugging: isDebugging
    };

    /**
     * A splitted extended selector class.
     *
     * #container #feedItem:has(.ads)
     * +--------+                     simple
     *           +                    relation
     *            +-----------------+ complex
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
        var resultNodes = [];
        var simpleNodes = void 0;

        var simple = this.simple;
        var relation = void 0;
        if (simple) {
            // First we use simple selector to narrow our search
            simpleNodes = document.querySelectorAll(simple);
            if (!simpleNodes || !simpleNodes.length) {
                return resultNodes;
            }
            relation = this.relation;
        } else {
            simpleNodes = [document];
            relation = " ";
        }

        switch (relation) {
            case " ":
                for (var _i = 0, _simpleNodes = simpleNodes; _i < _simpleNodes.length; _i++) {
                    var node = _simpleNodes[_i];
                    this.relativeSearch(node, resultNodes);
                }

                break;
            case ">":
                {
                    // buffer array
                    var childNodes = [];

                    for (var _i2 = 0, _simpleNodes2 = simpleNodes; _i2 < _simpleNodes2.length; _i2++) {
                        var _node = _simpleNodes2[_i2];
                        this.relativeSearch(_node, childNodes);

                        for (var _i3 = 0; _i3 < childNodes.length; _i3++) {
                            var childNode = childNodes[_i3];
                            if (childNode.parentNode === _node) {
                                resultNodes.push(childNode);
                            }
                        }

                        childNodes.length = 0; // clears the buffer
                    }

                    break;
                }
            case "+":
                {
                    var _childNodes = [];

                    for (var _i4 = 0, _simpleNodes3 = simpleNodes; _i4 < _simpleNodes3.length; _i4++) {
                        var _node2 = _simpleNodes3[_i4];
                        var parentNode = _node2.parentNode;
                        if (!parentNode) {
                            continue;
                        }
                        this.relativeSearch(parentNode, _childNodes);

                        for (var _i5 = 0; _i5 < _childNodes.length; _i5++) {
                            var _childNode = _childNodes[_i5];
                            if (_childNode.previousElementSibling === _node2) {
                                resultNodes.push(_childNode);
                            }
                        }

                        _childNodes.length = 0;
                    }

                    break;
                }
            case "~":
                {
                    var _childNodes2 = [];

                    for (var _i6 = 0, _simpleNodes4 = simpleNodes; _i6 < _simpleNodes4.length; _i6++) {
                        var _node3 = _simpleNodes4[_i6];
                        var _parentNode = _node3.parentNode;
                        if (!_parentNode) {
                            continue;
                        }
                        this.relativeSearch(_parentNode, _childNodes2);

                        for (var _i7 = 0; _i7 < _childNodes2.length; _i7++) {
                            var _childNode2 = _childNodes2[_i7];
                            if (_childNode2.parentNode === _parentNode && _node3.compareDocumentPosition(_childNode2) === 4) {
                                resultNodes.push(_childNode2);
                            }
                        }

                        _childNodes2.length = 0;
                    }
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
        Sizzle(this.complex, node, results); // jshint ignore:line
    };

    /**
     * A properties-heavy extended selector class.
     *
     * @param {string} selectorText
     * @param {string} simple
     * @param {string} rel
     * @param {string} complex
     * @param {string} propertyFilter
     * @param {boolean=} debug
     * @constructor
     * @extends SplittedSelector
     */
    function PropertiesHeavySelector(selectorText, simple, rel, complex, propertyFilter, debug) {
        SplittedSelector.call(this, selectorText, simple, rel, complex, debug);
        this.propertyFilter = propertyFilter;
    }

    PropertiesHeavySelector.prototype = Object.create(SplittedSelector.prototype);
    PropertiesHeavySelector.prototype.constructor = PropertiesHeavySelector;
    /**
     * @param {Node[]} result an array to append search result.
     * @override
     */
    PropertiesHeavySelector.prototype.relativeSearch = function (node, results) {
        if (!node) {
            node = document;
        }
        var selectors = StyleObserver.getSelector(this.propertyFilter);
        if (selectors.length === 0) {
            return;
        }

        var nodes = node.querySelectorAll(selectors.join(','));

        for (var _i8 = 0; _i8 < nodes.length; _i8++) {
            var _node4 = nodes[_i8];
            if (!this.complex.length || Sizzle.matchesSelector(_node4, this.complex)) {
                results.push(_node4);
            }
        }
    };

    return {
        /**
         * Wraps the inner class so that the instance is not exposed.
         */
        createSelector: function (selector, tokens, debug) {
            return new ExtendedSelectorParser(selector, tokens, debug).createSelector();
        },
        /**
         * Mark every selector as a selector being debugged, so that timing information
         * for the selector is printed to the console.
         */
        enableGlobalDebugging: function () {
            globalDebuggingFlag = true;
        }
    };
}();

/* global ExtendedCssParser, ExtendedSelectorFactory, StyleObserver, utils */

/**
 * Extended css class
 *
 * @param {string} styleSheet CSS stylesheet text
 * @param {Array.<HTMLElement>} propertyFilterIgnoreStyleNodes A list of stylesheet nodes that should be ignored by the StyleObserver (":properties" matching object)
 * @constructor
 */
function ExtendedCss(styleSheet, propertyFilterIgnoreStyleNodes) {
    // jshint ignore:line
    var rules = [];
    var affectedElements = [];
    var domObserved = void 0;
    var eventListenerSupported = window.addEventListener;
    var domMutationObserver = void 0;

    function observeDocument(callback) {
        if (utils.MutationObserver) {
            domMutationObserver = new utils.MutationObserver(function (mutations) {
                if (mutations && mutations.length) {
                    callback();
                }
            });
            domMutationObserver.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: false
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

    function protectionFunction(mutations, observer) {
        if (!mutations.length) {
            return;
        }
        var mutation = mutations[0];
        var target = mutation.target;
        observer.disconnect();
        target.setAttribute('style', mutation.oldValue);
        if (++observer.styleProtectionCount < MAX_STYLE_PROTECTION_COUNT) {
            observer.observe(target, protectionObserverOption);
        }
    }

    /**
     * Sets up a MutationObserver which protects style attributes from changes
     * @param node DOM node
     * @returns Mutation observer used to protect attribute or null if there's nothing to protect
     */
    function protectStyleAttribute(node) {
        if (!utils.MutationObserver) {
            return null;
        }
        var protectionObserver = new utils.MutationObserver(protectionFunction);
        protectionObserver.observe(node, protectionObserverOption);
        // Adds an expando to the observer to keep 'style fix counts'.
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
        for (var _i = 0; _i < affectedElements.length; _i++) {
            var affectedElement = affectedElements[_i];
            if (affectedElement.node === node) {
                return affectedElement;
            }
        }

        return null;
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
        var node = affectedElement.node;
        var style = affectedElement.rule.style;
        for (var prop in style) {
            // Apply this style only to existing properties
            // We can't use hasOwnProperty here (does not work in FF)
            if (typeof node.style.getPropertyValue(prop) !== "undefined") {
                var value = style[prop];
                // First we should remove !important attribute (or it won't be applied')
                value = removeSuffix(value.trim(), "!important").trim();
                node.style.setProperty(prop, value, "important");
            }
        }
        // Protect "style" attribute from changes
        affectedElement.protectionObserver = protectStyleAttribute(node);
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
        var start = void 0;
        if (debug) {
            start = utils.AsyncWrapper.now();
        }

        var selector = rule.selector;
        var nodes = selector.querySelectorAll();

        for (var _i2 = 0; _i2 < nodes.length; _i2++) {
            var node = nodes[_i2];
            var affectedElement = findAffectedElement(node);

            if (affectedElement) {
                // We have already applied style to this node
                // Let's re-apply style to it
                applyStyle(affectedElement);
            } else {
                // Applying style first time
                var originalStyle = node.style.cssText;
                affectedElement = {
                    node: node, // affected DOM node
                    rule: rule, // rule to be applied
                    originalStyle: originalStyle, // original node style
                    protectionObserver: null // style attribute observer
                };
                applyStyle(affectedElement);
                affectedElements.push(affectedElement);
            }
        }

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
        var elementsIndex = [];

        for (var _i3 = 0, _rules = rules; _i3 < _rules.length; _i3++) {
            var rule = _rules[_i3];
            var nodes = applyRule(rule);
            Array.prototype.push.apply(elementsIndex, nodes);
        }

        // Now revert styles for elements which are no more affected


        var l = affectedElements.length;
        while (l--) {
            var obj = affectedElements[l];
            if (elementsIndex.indexOf(obj.node) === -1) {
                // Time to revert style
                revertStyle(obj);
                affectedElements.splice(l, 1);
            }
        }

        printTimingInfo();
    }

    var APPLY_RULES_DELAY = 50;
    var applyRulesScheduler = new utils.AsyncWrapper(applyRules, APPLY_RULES_DELAY);
    var mainCallback = applyRulesScheduler.run.bind(applyRulesScheduler);

    function observe() {
        if (domObserved) {
            return;
        }

        // Handle dynamically added elements
        domObserved = true;
        observeDocument(mainCallback);
    }

    function apply() {
        applyRules();
        observe();

        if (document.readyState !== "complete") {
            document.addEventListener("DOMContentLoaded", applyRules);
        }
    }

    /**
     * Disposes ExtendedCss and removes our styles from matched elements
     */
    function dispose() {
        if (domObserved) {
            disconnectDocument(mainCallback);
            domObserved = false;
        }

        for (var _i4 = 0; _i4 < affectedElements.length; _i4++) {
            var obj = affectedElements[_i4];
            revertStyle(obj);
        }
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
        }
        // Add location.href to the message to distinguish frames
        utils.logInfo("[ExtendedCss] Timings for %o:\n%o (in milliseconds)", location.href, timings);
    }

    // Let StyleObserver know which stylesheets should not be used for :properties matching
    StyleObserver.setIgnoredStyleNodes(propertyFilterIgnoreStyleNodes);

    // First of all parse the stylesheet
    rules = ExtendedCssParser.parseCss(styleSheet);

    // EXPOSE
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
        throw 'Selector text is empty';
    }

    var now = utils.AsyncWrapper.now;
    var start = now();

    try {
        return ExtendedSelectorFactory.createSelector(selectorText).querySelectorAll();
    } finally {
        StyleObserver.clear();

        var end = now();
        if (!noTiming) {
            utils.logInfo('[ExtendedCss] Elapsed: ' + Math.round((end - start) * 1000) + ' μs.');
        }
    }
};

// EXPOSE
return ExtendedCss;
})(window);