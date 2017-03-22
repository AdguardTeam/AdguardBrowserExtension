/**
  * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
  *
  * Adguard Browser Extension is free software: you can redistribute it and/or modify
  * it under the terms of the GNU Lesser General Public License as published by
  * the Free Software Foundation, either version 3 of the License, or
  * (at your option) any later version.
  *
  * Adguard Browser Extension is distributed in the hope that it will be useful,
  * but WITHOUT ANY WARRANTY; without even the implied warranty of
  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  * GNU Lesser General Public License for more details.
  *
  * You should have received a copy of the GNU Lesser General Public License
  * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
  */

(function (window, undefined) {

!function(){var n,e,r,t,u,o,i,l,s,a,c,f,p,h,y=[].slice;u="3.0.0",e="pending",t="resolved",r="rejected",s=function(n,e){return null!=n?n.hasOwnProperty(e):void 0},c=function(n){return s(n,"length")&&s(n,"callee")},f=function(n){return s(n,"promise")&&"function"==typeof(null!=n?n.promise:void 0)},l=function(n){return c(n)?l(Array.prototype.slice.call(n)):Array.isArray(n)?n.reduce(function(n,e){return Array.isArray(e)?n.concat(l(e)):(n.push(e),n)},[]):[n]},o=function(n,e){return 0>=n?e():function(){return--n<1?e.apply(this,arguments):void 0}},p=function(n,e){return function(){var r;return r=[n].concat(Array.prototype.slice.call(arguments,0)),e.apply(this,r)}},i=function(n,e,r){var t,u,o,i,s;for(i=l(n),s=[],u=0,o=i.length;o>u;u++)t=i[u],s.push(t.call.apply(t,[r].concat(y.call(e))));return s},n=function(){var u,o,s,a,c,p,h;return h=e,a=[],c=[],p=[],s={resolved:{},rejected:{},pending:{}},this.promise=function(u){var o,d;return u=u||{},u.state=function(){return h},d=function(n,r,t){return function(){return h===e&&r.push.apply(r,l(arguments)),n()&&i(arguments,s[t]),u}},u.done=d(function(){return h===t},a,t),u.fail=d(function(){return h===r},c,r),u.progress=d(function(){return h!==e},p,e),u.always=function(){var n;return(n=u.done.apply(u,arguments)).fail.apply(n,arguments)},o=function(e,r,t){var o,i;return i=new n,o=function(n,e,r){return r?u[n](function(){var n,t;return n=1<=arguments.length?y.call(arguments,0):[],t=r.apply(null,n),f(t)?t.done(i.resolve).fail(i.reject).progress(i.notify):i[e](t)}):u[n](i[e])},o("done","resolve",e),o("fail","reject",r),o("progress","notify",t),i},u.pipe=o,u.then=o,null==u.promise&&(u.promise=function(){return u}),u},this.promise(this),u=this,o=function(n,r,t){return function(){return h===e?(h=n,s[n]=arguments,i(r,s[n],t),u):this}},this.resolve=o(t,a),this.reject=o(r,c),this.notify=o(e,p),this.resolveWith=function(n,e){return o(t,a,n).apply(null,e)},this.rejectWith=function(n,e){return o(r,c,n).apply(null,e)},this.notifyWith=function(n,r){return o(e,p,n).apply(null,r)},this},h=function(){var e,r,t,u,i,s,a;if(r=l(arguments),1===r.length)return f(r[0])?r[0]:(new n).resolve(r[0]).promise();if(i=new n,!r.length)return i.resolve().promise();for(u=[],t=o(r.length,function(){return i.resolve.apply(i,u)}),r.forEach(function(n,e){return f(n)?n.done(function(){var n;return n=1<=arguments.length?y.call(arguments,0):[],u[e]=n.length>1?n:n[0],t()}):(u[e]=n,t())}),s=0,a=r.length;a>s;s++)e=r[s],f(e)&&e.fail(i.reject);return i.promise()},a=function(e){return e.Deferred=function(){return new n},e.ajax=p(e.ajax,function(e,r){var t,u,o,i;return null==r&&(r={}),u=new n,t=function(n,e){return p(n,function(){var n,r;return r=arguments[0],n=2<=arguments.length?y.call(arguments,1):[],r&&r.apply(null,n),e.apply(null,n)})},r.success=t(r.success,u.resolve),r.error=t(r.error,u.reject),i=e(r),o=u.promise(),o.abort=function(){return i.abort()},o}),e.when=h},"undefined"!=typeof exports?(exports.Deferred=function(){return new n},exports.when=h,exports.installInto=a):"function"==typeof define&&define.amd?define(function(){return"undefined"!=typeof Zepto?a(Zepto):(n.when=h,n.installInto=a,n)}):"undefined"!=typeof Zepto?a(Zepto):(this.Deferred=function(){return new n},this.Deferred.when=h,this.Deferred.installInto=a)}.call(this);

/*** JavaScript SHA-256 hash function. License and copyright free. ***/ 
// Patched for CommonJS exports

SHA256 = {};

SHA256.K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 
    0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 
    0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 
    0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 
    0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 
    0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 
    0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 
    0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 
    0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

SHA256.Uint8Array = function(length) {
    if (typeof Uint8Array !== 'undefined') {
        return new Uint8Array(length);
    } else {
        return new Array(length);
    }
};

SHA256.Int32Array = function(length) {
    if (typeof Int32Array !== 'undefined') {
        return new Int32Array(length);
    } else {
        return new Array(length);
    }
};

SHA256.setArray = function(target, source) {
    if (typeof Uint8Array !== 'undefined') {
        target.set(source);
    } else {
        for (var i = 0; i < source.length; i++) {
            target[i] = source[i];
        }
        for (i = source.length; i < target.length; i++) {
            target[i] = 0;
        }
    }
};

// The digest function returns the hash value (digest)
// as a 32 byte (typed) array.
// message: the string or byte array to hash
SHA256.digest = function(message) {
    var h0 = 0x6a09e667;
    var h1 = 0xbb67ae85;
    var h2 = 0x3c6ef372;
    var h3 = 0xa54ff53a;
    var h4 = 0x510e527f;
    var h5 = 0x9b05688c;
    var h6 = 0x1f83d9ab;
    var h7 = 0x5be0cd19;
    var K = SHA256.K;
    if (typeof message == 'string') {
       var s =  unescape(encodeURIComponent(message)); // UTF-8
        message = SHA256.Uint8Array(s.length);
        for (var i = 0; i < s.length; i++) {
            message[i] = s.charCodeAt(i) & 0xff;
        }
    }
    var length = message.length;
    var byteLength = Math.floor((length + 72) / 64) * 64;
    var wordLength = byteLength / 4;
    var bitLength = length * 8;
    var m = SHA256.Uint8Array(byteLength);
    SHA256.setArray(m, message);
    m[length] = 0x80;
    m[byteLength - 4] = bitLength >>> 24;
    m[byteLength - 3] = (bitLength >>> 16) & 0xff;
    m[byteLength - 2] = (bitLength >>> 8) & 0xff;
    m[byteLength - 1] = bitLength & 0xff;
    var words = SHA256.Int32Array(wordLength);
    var byteIndex = 0;
    for (i = 0; i < words.length; i++) {
        var word = m[byteIndex] << 24;
        word |= m[byteIndex + 1] << 16;
        word |= m[byteIndex + 2] << 8;
        word |= m[byteIndex + 3];
        words[i] = word;
        byteIndex += 4;
    }
    var w = SHA256.Int32Array(64);
    for (var j = 0; j < wordLength; j += 16) {
        for (i = 0; i < 16; i++) {
            w[i] = words[j + i];
        }
        for (i = 16; i < 64; i++) {
            var v = w[i - 15];
            var s0 = (v >>> 7) | (v << 25);
            s0 ^= (v >>> 18) | (v << 14);
            s0 ^= (v >>> 3);
            v = w[i - 2];
            var s1 = (v >>> 17) | (v << 15);
            s1 ^= (v >>> 19) | (v << 13);
            s1 ^= (v >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & 0xffffffff; 
        }
        var a = h0;
        var b = h1;
        var c = h2;
        var d = h3;
        var e = h4;
        var f = h5;
        var g = h6;
        var h = h7;
        for (i = 0; i < 64; i++) {
            s1 = (e >>> 6) | (e << 26);
            s1 ^= (e >>> 11) | (e << 21);
            s1 ^= (e >>> 25) | (e << 7);
            var ch = (e & f) ^ (~e & g);
            var temp1 = (h + s1 + ch + K[i] + w[i]) & 0xffffffff;
            s0 = (a >>> 2) | (a << 30);
            s0 ^= (a >>> 13) | (a << 19);
            s0 ^= (a >>> 22) | (a << 10);
            var maj = (a & b) ^ (a & c) ^ (b & c);
            var temp2 = (s0 + maj) & 0xffffffff;
            h = g;
            g = f;
            f = e;
            e = (d + temp1) & 0xffffffff;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) & 0xffffffff;
        }
        h0 = (h0 + a) & 0xffffffff;
        h1 = (h1 + b) & 0xffffffff;
        h2 = (h2 + c) & 0xffffffff;
        h3 = (h3 + d) & 0xffffffff;
        h4 = (h4 + e) & 0xffffffff;
        h5 = (h5 + f) & 0xffffffff;
        h6 = (h6 + g) & 0xffffffff;
        h7 = (h7 + h) & 0xffffffff;
    }
    var hash = SHA256.Uint8Array(32);
    for (i = 0; i < 4; i++) {
        hash[i] = (h0 >>> (8 * (3 - i))) & 0xff;
        hash[i + 4] = (h1 >>> (8 * (3 - i))) & 0xff;
        hash[i + 8] = (h2 >>> (8 * (3 - i))) & 0xff;
        hash[i + 12] = (h3 >>> (8 * (3 - i))) & 0xff;
        hash[i + 16] = (h4 >>> (8 * (3 - i))) & 0xff;
        hash[i + 20] = (h5 >>> (8 * (3 - i))) & 0xff;
        hash[i + 24] = (h6 >>> (8 * (3 - i))) & 0xff;
        hash[i + 28] = (h7 >>> (8 * (3 - i))) & 0xff;
    }
    return hash;
};   

// The hash function returns the hash value as a hex string.
// message: the string or byte array to hash
SHA256.hash = function(message) {
    var digest = SHA256.digest(message);
    var hex = '';
	for (i = 0; i < digest.length; i++) {
		var s = '0' + digest[i].toString(16);
        hex += s.length > 2 ? s.substring(1) : s;
	}
    return hex;
};

// Export SHA256
if (typeof exports != 'undefined') {
	exports.SHA256 = SHA256;
}

/*! http://mths.be/punycode v1.3.0 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
		) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

		/** Highest positive signed 32-bit float value */
		maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

		/** Bootstring parameters */
		base = 36,
		tMin = 1,
		tMax = 26,
		skew = 38,
		damp = 700,
		initialBias = 72,
		initialN = 128, // 0x80
		delimiter = '-', // '\x2D'

		/** Regular expressions */
		regexPunycode = /^xn--/,
		regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
		regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

		/** Error messages */
		errors = {
			'overflow': 'Overflow: input needs wider integers to process',
			'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
			'invalid-input': 'Invalid input'
		},

		/** Convenience shortcuts */
		baseMinusTMin = base - tMin,
		floor = Math.floor,
		stringFromCharCode = String.fromCharCode,

		/** Temporary variable */
		key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var labels = string.split(regexSeparators);
		// Note: each label could still contain `@` in the case of an email address.
		return map(labels, function(label) {
			var parts = label.split('@');
			return map(parts, fn).join('@');
		}).join('.');
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <http://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
			counter = 0,
			length = string.length,
			value,
			extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
			inputLength = input.length,
			out,
			i = 0,
			n = initialN,
			bias = initialBias,
			basic,
			j,
			index,
			oldi,
			w,
			k,
			digit,
			t,
			/** Cached calculation results */
			baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
			delta,
			handledCPCount,
			basicLength,
			bias,
			j,
			m,
			q,
			k,
			t,
			currentValue,
			output = [],
			/** `inputLength` will hold the number of code points in `input`. */
			inputLength,
			/** Cached calculation results */
			handledCPCountPlusOne,
			baseMinusT,
			qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.3.0',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <http://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (typeof exports !== 'undefined') {
		exports.punycode = punycode;
	} else if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
		) {
		define('punycode', function () {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

/**
 * Global adguard object
 */
var adguard = (function () { // jshint ignore:line

    /**
     * This function allows cache property in object. Use with javascript getter.
     *
     * var Object = {
     *
     *      get someProperty(){
     *          return adguard.lazyGet(Object, 'someProperty', function() {
     *              return calculateSomeProperty();
     *          });
     *      }
     * }
     *
     * @param object Object
     * @param prop Original property name
     * @param calculateFunc Calculation function
     * @returns {*}
     */
    var lazyGet = function (object, prop, calculateFunc) {
        var cachedProp = '_' + prop;
        if (cachedProp in object) {
            return object[cachedProp];
        }
        var value = calculateFunc.apply(object);
        object[cachedProp] = value;
        return value;
    };

    /**
     * Clear cached property
     * @param object Object
     * @param prop Original property name
     */
    var lazyGetClear = function (object, prop) {
        delete object['_' + prop];
    };

    function notImplemented() {
        return false;
    }

    var hitStatsModule = {
        addRuleHit: notImplemented,
        addDomainView: notImplemented,
        cleanup: notImplemented
    };

    var filteringLogModule = {
        addEvent: notImplemented,
        clearEventsByTabId: notImplemented
    };

    var safebrowsingModule = {
        checkSafebrowsingFilter: notImplemented
    };

    var integrationModule = {
        isSupported: notImplemented,
        isIntegrationRequest: notImplemented,
        shouldOverrideReferrer: notImplemented
    };

    return {
        lazyGet: lazyGet,
        lazyGetClear: lazyGetClear,

        /**
         * Define dummy modules.
         * In case of simple adguard API, some modules aren't supported
         */
        hitStats: hitStatsModule,
        filteringLog: filteringLogModule,
        safebrowsing: safebrowsingModule,
        integration: integrationModule
    };

})();

/* global safari */

/**
 * Extension global preferences.
 * (!) Firefox has it's own implementation
 */
adguard.prefs = (function (adguard) {

    var Prefs = {

        /**
         * Makes sense in case of FF add-on only
         */
        mobile: false,

        platform: typeof safari === 'undefined' ? "chromium" : "webkit",

        get browser() {
            return adguard.lazyGet(Prefs, 'browser', function () {
                var browser;
                var userAgent = navigator.userAgent;
                if (userAgent.toLowerCase().indexOf("yabrowser") >= 0) {
                    browser = "YaBrowser";
                } else if (userAgent.toLowerCase().indexOf("edge") >= 0) {
                    browser = "Edge";
                } else if (userAgent.toLowerCase().indexOf("opera") >= 0 || userAgent.toLowerCase().indexOf("opr") >= 0) {
                    browser = "Opera";
                } else if (userAgent.indexOf("Safari") >= 0 && userAgent.indexOf('Chrome') < 0) {
                    browser = "Safari";
                } else {
                    browser = "Chrome";
                }
                return browser;
            });
        },

        get safariVersion() {
            return adguard.lazyGet(Prefs, 'safariVersion', function () {
                if (this.browser === 'Safari') {
                    var i = navigator.userAgent.indexOf("Version/");
                    if (i < 0) {
                        return null;
                    }
                    return parseInt(navigator.userAgent.substring(i + 8));
                }
                return null;
            });
        },

        get chromeVersion() {
            return adguard.lazyGet(Prefs, 'chromeVersion', function () {
                if (this.browser == "Chrome") {
                    var i = navigator.userAgent.indexOf("Chrome/");
                    if (i < 0) {
                        return null;
                    }
                    return parseInt(navigator.userAgent.substring(i + 7));
                }
            });
        },

        /**
         * Makes sense in case of FF add-on only
         */
        speedupStartup: function () {
            return false;
        },

        get ICONS() {
            return adguard.lazyGet(Prefs, 'ICONS', function () {
                return {
                    ICON_BLUE: {
                        '19': adguard.getURL('icons/blue-19.png'),
                        '38': adguard.getURL('icons/blue-38.png')
                    },
                    ICON_GREEN: {
                        '19': adguard.getURL('icons/green-19.png'),
                        '38': adguard.getURL('icons/green-38.png')
                    },
                    ICON_GRAY: {
                        '19': adguard.getURL('icons/gray-19.png'),
                        '38': adguard.getURL('icons/gray-38.png')
                    }
                };
            });
        },

        /**
         * If user enables `Send ad filters usage stats` option (which is disabled by default) in Adguard settings, it starts collecting & sending stats on used ad filtering rules.
         * We use these stats to get rid of redundant filtering rules and provide "optimized" filters. Details: https://adguard.com/en/filter-rules-statistics.html
         */
        collectHitsCountEnabled: (typeof safari === 'undefined')
    };

    return Prefs;

})(adguard);

/**
 * Request types enumeration
 */
adguard.RequestTypes = {

    /**
     * Document that is loaded for a top-level frame
     */
    DOCUMENT: "DOCUMENT",

    /**
     * Document that is loaded for an embedded frame (iframe)
     */
    SUBDOCUMENT: "SUBDOCUMENT",

    SCRIPT: "SCRIPT",
    STYLESHEET: "STYLESHEET",
    OBJECT: "OBJECT",
    IMAGE: "IMAGE",
    XMLHTTPREQUEST: "XMLHTTPREQUEST",
    OBJECT_SUBREQUEST: "OBJECT-SUBREQUEST",
    MEDIA: "MEDIA",
    FONT: "FONT",
    WEBSOCKET: "WEBSOCKET",
    OTHER: "OTHER",

    /**
     * Synthetic request type for requests detected as pop-ups
     */
    POPUP: "POPUP"
};

/**
 * Utilities namespace
 */
adguard.utils = (function () {

    return {
        strings: null, // StringUtils
        collections: null, // CollectionUtils,
        concurrent: null, // ConcurrentUtils,
        channels: null, // EventChannels
        browser: null, // BrowserUtils
        filters: null, // FilterUtils,
        workaround: null, // WorkaroundUtils
        StopWatch: null,
        Promise: null // Deferred,
    };

})();

/**
 * Util class for work with strings
 */
(function (api) {

    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function (suffix) { // jshint ignore:line
            var index = this.lastIndexOf(suffix);
            return index !== -1 && index === this.length - suffix.length;
        };
    }

    //noinspection UnnecessaryLocalVariableJS
    var StringUtils = {

        isEmpty: function (str) {
            return !str || str.trim().length === 0;
        },

        startWith: function (str, prefix) {
            return str && str.indexOf(prefix) === 0;
        },

        endsWith: function (str, postfix) {
            return str.endsWith(postfix);
        },

        substringAfter: function (str, separator) {
            if (!str) {
                return str;
            }
            var index = str.indexOf(separator);
            return index < 0 ? "" : str.substring(index + separator.length);
        },

        substringBefore: function (str, separator) {
            if (!str || !separator) {
                return str;
            }
            var index = str.indexOf(separator);
            return index < 0 ? str : str.substring(0, index);
        },

        contains: function (str, searchString) {
            return str && str.indexOf(searchString) >= 0;
        },

        containsIgnoreCase: function (str, searchString) {
            return str && searchString && str.toUpperCase().indexOf(searchString.toUpperCase()) >= 0;
        },

        replaceAll: function (str, find, replace) {
            if (!str) {
                return str;
            }
            return str.split(find).join(replace);
        },

        join: function (array, separator, startIndex, endIndex) {
            if (!array) {
                return null;
            }
            if (!startIndex) {
                startIndex = 0;
            }
            if (!endIndex) {
                endIndex = array.length;
            }
            if (startIndex >= endIndex) {
                return "";
            }
            var buf = [];
            for (var i = startIndex; i < endIndex; i++) {
                buf.push(array[i]);
            }
            return buf.join(separator);
        },

        /**
         * Look for any symbol from "chars" array starting at "start" index
         *
         * @param str   String to search
         * @param start Start index (inclusive)
         * @param chars Chars to search for
         * @return int Index of the element found or null
         */
        indexOfAny: function (str, start, chars) {
            if (typeof str === 'string' && str.length <= start) {
                return -1;
            }

            for (var i = start; i < str.length; i++) {
                var c = str.charAt(i);
                if (chars.indexOf(c) > -1) {
                    return i;
                }
            }

            return -1;
        }
    };

    api.strings = StringUtils;

})(adguard.utils);

/**
 * Util class for work with collections
 */
(function (api) {

    //noinspection UnnecessaryLocalVariableJS
    var CollectionUtils = {

        remove: function (collection, element) {
            if (!element || !collection) {
                return;
            }
            var index = collection.indexOf(element);
            if (index >= 0) {
                collection.splice(index, 1);
            }
        },

        removeAll: function (collection, element) {
            if (!element || !collection) {
                return;
            }
            for (var i = collection.length - 1; i >= 0; i--) {
                if (collection[i] == element) {
                    collection.splice(i, 1);
                }
            }
        },

        removeRule: function (collection, rule) {
            if (!rule || !collection) {
                return;
            }
            for (var i = collection.length - 1; i >= 0; i--) {
                if (rule.ruleText === collection[i].ruleText) {
                    collection.splice(i, 1);
                }
            }
        },

        removeDuplicates: function (arr) {
            if (!arr || arr.length == 1) {
                return arr;
            }
            return arr.filter(function (elem, pos) {
                return arr.indexOf(elem) == pos;
            });
        },

        getRulesText: function (collection) {
            var text = [];
            if (!collection) {
                return text;
            }
            for (var i = 0; i < collection.length; i++) {
                text.push(collection[i].ruleText);
            }
            return text;
        },

        /**
         * Find element in array by property
         * @param array
         * @param property
         * @param value
         * @returns {*}
         */
        find: function (array, property, value) {
            if (typeof array.find === 'function') {
                return array.find(function (a) {
                    return a[property] === value;
                });
            }
            for (var i = 0; i < array.length; i++) {
                var elem = array[i];
                if (elem[property] === value) {
                    return elem;
                }
            }
            return null;
        },

        /**
         * Checks if specified object is array
         * We don't use instanceof because it is too slow: http://jsperf.com/instanceof-performance/2
         * @param obj Object
         */
        isArray: Array.isArray || function (obj) {
            return '' + obj === '[object Array]';
        }
    };

    api.collections = CollectionUtils;

})(adguard.utils);

/**
 * Util class for support timeout, retry operations, debounce
 */
(function (api) {

    //noinspection UnnecessaryLocalVariableJS
    var ConcurrentUtils = {

        runAsync: function (callback, context) {
            var params = Array.prototype.slice.call(arguments, 2);
            setTimeout(function () {
                callback.apply(context, params);
            }, 0);
        },

        retryUntil: function (predicate, main, details) {

            if (typeof details !== 'object') {
                details = {};
            }

            var now = 0;
            var next = details.next || 200;
            var until = details.until || 2000;

            var check = function () {
                if (predicate() === true || now >= until) {
                    main();
                    return;
                }
                now += next;
                setTimeout(check, next);
            };

            setTimeout(check, 1);
        },

        debounce: function (func, wait) {
            var timeout;
            return function () {
                var context = this, args = arguments;
                var later = function () {
                    timeout = null;
                    func.apply(context, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    };

    api.concurrent = ConcurrentUtils;

})(adguard.utils);

/**
 * Util class for detect filter type. Includes various filter identifiers
 */
(function (api) {

    var AntiBannerFiltersId = {
        USER_FILTER_ID: 0,
        ENGLISH_FILTER_ID: 2,
        TRACKING_FILTER_ID: 3,
        SOCIAL_FILTER_ID: 4,
        SEARCH_AND_SELF_PROMO_FILTER_ID: 10,
        SAFARI_FILTER: 12,
        WHITE_LIST_FILTER_ID: 100,
        EASY_PRIVACY: 118,
        FANBOY_ANNOYANCES: 122,
        FANBOY_SOCIAL: 123,
        FANBOY_ENHANCED: 215
    };

    var FilterUtils = {

        isUserFilterRule: function (rule) {
            return rule.filterId == AntiBannerFiltersId.USER_FILTER_ID;
        },

        isWhiteListFilterRule: function (rule) {
            return rule.filterId == AntiBannerFiltersId.WHITE_LIST_FILTER_ID;
        }
    };

    // Make accessible only constants without functions. They will be passed to content-page
    FilterUtils.ids = AntiBannerFiltersId;

    // Copy filter ids to api
    for (var key in AntiBannerFiltersId) {
        if (AntiBannerFiltersId.hasOwnProperty(key)) {
            FilterUtils[key] = AntiBannerFiltersId[key];
        }
    }

    api.filters = FilterUtils;

})(adguard.utils);

/**
 * Simple time measurement utils
 */
(function (api) {

    var StopWatch = function (name) {
        this.name = name;
    };

    StopWatch.prototype = {

        start: function () {
            this.startTime = Date.now();
        },

        stop: function () {
            this.stopTime = Date.now();
        },

        print: function () {
            var elapsed = this.stopTime - this.startTime;
            console.log(this.name + "[elapsed: " + elapsed + " ms]");
        }
    };

    api.StopWatch = StopWatch;

})(adguard.utils);

/**
 * Simple publish-subscribe implementation
 */
(function (api) {

    //noinspection UnnecessaryLocalVariableJS
    var EventChannels = (function () {

        'use strict';

        var EventChannel = function () {

            var listeners = null;
            var listenerCallback = null;

            var addListener = function (callback) {
                if (typeof callback !== 'function') {
                    throw new Error('Illegal callback');
                }
                if (listeners !== null) {
                    listeners.push(callback);
                    return;
                }
                if (listenerCallback !== null) {
                    listeners = [];
                    listeners.push(listenerCallback);
                    listeners.push(callback);
                    listenerCallback = null;
                } else {
                    listenerCallback = callback;
                }
            };

            var removeListener = function (callback) {
                if (listenerCallback !== null) {
                    listenerCallback = null;
                } else {
                    var index = listeners.indexOf(callback);
                    if (index >= 0) {
                        listeners.splice(index, 1);
                    }
                }
            };

            var notify = function () {
                if (listenerCallback !== null) {
                    return listenerCallback.apply(listenerCallback, arguments);
                }
                if (listeners !== null) {
                    for (var i = 0; i < listeners.length; i++) {
                        var listener = listeners[i];
                        listener.apply(listener, arguments);
                    }
                }
            };

            var notifyInReverseOrder = function () {
                if (listenerCallback !== null) {
                    return listenerCallback.apply(listenerCallback, arguments);
                }
                if (listeners !== null) {
                    for (var i = listeners.length - 1; i >= 0; i--) {
                        var listener = listeners[i];
                        listener.apply(listener, arguments);
                    }
                }
            };

            return {
                addListener: addListener,
                removeListener: removeListener,
                notify: notify,
                notifyInReverseOrder: notifyInReverseOrder
            };
        };

        var namedChannels = Object.create(null);

        var newChannel = function () {
            return new EventChannel();
        };

        var newNamedChannel = function (name) {
            var channel = newChannel();
            namedChannels[name] = channel;
            return channel;
        };

        var getNamedChannel = function (name) {
            return namedChannels[name];
        };

        return {
            newChannel: newChannel,
            newNamedChannel: newNamedChannel,
            getNamedChannel: getNamedChannel
        };
    })();

    api.channels = EventChannels;

})(adguard.utils);

/**
 * Promises wrapper
 */
(function (api, global) {

    'use strict';

    var defer = global.Deferred;
    var deferAll = function (arr) {
        return global.Deferred.when.apply(global.Deferred, arr);
    };

    var Promise = function () {

        var deferred = defer();
        var promise;
        if (typeof deferred.promise === 'function') {
            promise = deferred.promise();
        } else {
            promise = deferred.promise;
        }

        var resolve = function (arg) {
            deferred.resolve(arg);
        };

        var reject = function () {
            deferred.reject();
        };

        var then = function (onSuccess, onReject) {
            promise.then(onSuccess, onReject);
        };

        return {
            promise: promise,
            resolve: resolve,
            reject: reject,
            then: then
        };
    };

    Promise.all = function (promises) {
        var defers = [];
        for (var i = 0; i < promises.length; i++) {
            defers.push(promises[i].promise);
        }
        return deferAll(defers);
    };

    api.Promise = Promise;

})(adguard.utils, window);

/**
 * We collect here all workarounds and ugly hacks:)
 */
(function (api) {

    //noinspection UnnecessaryLocalVariableJS
    var WorkaroundUtils = {

        /**
         * Converts blocked counter to the badge text.
         * Workaround for FF - make 99 max.
         *
         * @param blocked Blocked requests count
         */
        getBlockedCountText: function (blocked) {
            var blockedText = blocked == "0" ? "" : blocked;
            if (blocked - 0 > 99) {
                blockedText = '\u221E';
            }

            return blockedText;
        },

        /**
         * Checks if it is facebook like button iframe
         * TODO: Ugly, remove this
         *
         * @param url URL
         * @returns true if it is
         */
        isFacebookIframe: function (url) {
            // facebook iframe workaround
            // do not inject anything to facebook frames
            return url.indexOf('www.facebook.com/plugins/like.php') > -1;
        }
    };

    api.workaround = WorkaroundUtils;

})(adguard.utils);

/**
 * Unload handler. When extension is unload then 'fireUnload' is invoked.
 * You can add own handler with method 'when'
 * @type {{when, fireUnload}}
 */
adguard.unload = (function (adguard) {

    'use strict';

    var unloadChannel = adguard.utils.channels.newChannel();

    var when = function (callback) {
        if (typeof callback !== 'function') {
            return;
        }
        unloadChannel.addListener(function () {
            try {
                callback();
            } catch (ex) {
                console.error('Error while invoke unload method');
                console.error(ex);
            }
        });
    };

    var fireUnload = function (reason) {
        console.info('Unload is fired: ' + reason);
        unloadChannel.notifyInReverseOrder(reason);
    };

    return {
        when: when,
        fireUnload: fireUnload
    };

})(adguard);

/**
 * Utility class for saving and retrieving some item by key;
 * It's bounded with some capacity.
 * Details are stored in some ring buffer. For each key corresponding item are retrieved in LIFO order.
 */
adguard.utils.RingBuffer = function (size) { // jshint ignore:line

    if (typeof Map === 'undefined') {
        throw new Error('Unable to create RingBuffer');
    }

    /**
     * itemKeyToIndex: Map (key => indexes)
     * indexes = Array of [index];
     * index = position of item in ringBuffer
     */
    /* global Map */
    var itemKeyToIndex = new Map();
    var itemWritePointer = 0; // Current write position

    /**
     * ringBuffer: Array [0:item][1:item]...[size-1:item]
     */
    var ringBuffer = new Array(size);

    var i = ringBuffer.length;
    while (i--) {
        ringBuffer[i] = {processedKey: null}; // 'if not null' means this item hasn't been processed yet.
    }

    /**
     * Put new value to buffer
     * 1. Associates item with next index from ringBuffer.
     * 2. If index has been already in use and item hasn't been processed yet, then removes it from indexes array in itemKeyToIndex
     * 3. Push this index to indexes array in itemKeyToIndex at first position
     * @param key Key
     * @param value Object
     */
    var put = function (key, value) {

        var index = itemWritePointer;
        itemWritePointer = (index + 1) % size;

        var item = ringBuffer[index];
        var indexes;

        // Cleanup unprocessed item
        if (item.processedKey !== null) {
            indexes = itemKeyToIndex.get(item.processedKey);
            if (indexes.length === 1) {
                // It's last item with this key
                itemKeyToIndex.delete(item.processedKey);
            } else {
                var pos = indexes.indexOf(index);
                if (pos >= 0) {
                    indexes.splice(pos, 1);
                }
            }
            ringBuffer[index] = item = null;
        }
        indexes = itemKeyToIndex.get(key);
        if (indexes === undefined) {
            // It's first item with this key
            itemKeyToIndex.set(key, [index]);
        } else {
            // Push item index at first position
            indexes.unshift(index);
        }

        ringBuffer[index] = value;
        value.processedKey = key;
    };

    /**
     * Finds item by key
     * 1. Get indexes from itemKeyToIndex by key.
     * 2. Gets first index from indexes, then gets item from ringBuffer by this index
     * @param key Key for searching
     */
    var pop = function (key) {
        var indexes = itemKeyToIndex.get(key);
        if (indexes === undefined) {
            return null;
        }
        var index = indexes.shift();
        if (indexes.length === 0) {
            itemKeyToIndex.delete(key);
        }
        var item = ringBuffer[index];
        // Mark as processed
        item.processedKey = null;
        return item;
    };

    var clear = function () {
        itemKeyToIndex = new Map();
        itemWritePointer = 0;
        var i = ringBuffer.length;
        while (i--) {
            ringBuffer[i] = {processedKey: null};
        }
    };

    return {
        put: put,
        pop: pop,
        clear: clear
    };

};

/**
 * Simple logger with log levels
 */
adguard.console = (function () {

    // Redefine if you need it
    var CURRENT_LEVEL = "INFO";

    var LEVELS = {
        ERROR: 1,
        WARN: 2,
        INFO: 3,
        DEBUG: 4
    };

    /**
     * Pretty-print javascript error
     */
    var errorToString = function (error) {
        return error.toString() + "\nStack trace:\n" + error.stack;
    };

    /**
     * Prints log message
     */
    var print = function (level, method, args) {
        //check log level
        if (LEVELS[CURRENT_LEVEL] < LEVELS[level]) {
            return;
        }
        if (!args || args.length === 0 || !args[0]) {
            return;
        }

        var str = args[0] + "";
        args = Array.prototype.slice.call(args, 1);
        var formatted = str.replace(/{(\d+)}/g, function (match, number) {

            if (typeof args[number] != "undefined") {
                var value = args[number];
                if (value instanceof Error) {
                    value = errorToString(value);
                } else if (value && value.message) {
                    value = value.message;
                }
                return value;
            }

            return match;
        });

        var now = new Date();
        formatted = now.toISOString() + ": " + formatted;
        console[method](formatted);
    };

    /**
     * Expose public API
     */
    return {
        debug: function () {
            print("DEBUG", "log", arguments);
        },

        info: function () {
            print("INFO", "info", arguments);
        },

        warn: function () {
            print("WARN", "info", arguments);
        },

        error: function () {
            print("ERROR", "error", arguments);
        }
    };
})();

(function (api, global) {

    /**
     * Helper methods to work with URLs
     */
    var UrlUtils = {

        isHttpRequest: function (url) {
            return url && url.indexOf('http') == 0;
        },

        isHttpOrWsRequest: function (url) {
            return url && (url.indexOf('http') == 0 || url.indexOf('wss:') == 0 || url.indexOf('ws:') == 0);
        },

        toPunyCode: function (domain) {
            if (!domain) {
                return "";
            }
            if (/^[\x00-\x7F]+$/.test(domain)) {
                return domain;
            }
            return global.punycode.toASCII(domain);
        },

        urlToPunyCode: function (url) {

            if (!url || /^[\x00-\x7F]+$/.test(url)) {
                return url;
            }

            var i;
            var startsWith = ["http://www.", "https://www.", "http://", "https://"];
            var startIndex = -1;

            for (i = 0; i < startsWith.length; i++) {
                var start = startsWith[i];
                if (api.strings.startWith(url, start)) {
                    startIndex = start.length;
                    break;
                }
            }

            if (startIndex == -1) {
                return url;
            }

            var symbolIndex = url.indexOf("/", startIndex);
            var domain = symbolIndex == -1 ? url.substring(startIndex) : url.substring(startIndex, symbolIndex);
            return api.strings.replaceAll(url, domain, this.toPunyCode(domain));
        },

        isThirdPartyRequest: function (requestUrl, referrer) {
            var domainName = this._get2NdLevelDomainName(requestUrl);
            var refDomainName = this._get2NdLevelDomainName(referrer);
            return domainName != refDomainName;
        },

        //Get host name
        getHost: function (url) {

            if (!url) {
                return null;
            }

            var firstIdx = url.indexOf("//");
            if (firstIdx == -1) {
                return null;
            }
            var nextSlashIdx = url.indexOf("/", firstIdx + 2);
            var startParamsIdx = url.indexOf("?", firstIdx + 2);

            var lastIdx = nextSlashIdx;
            if (startParamsIdx > 0 && (startParamsIdx < nextSlashIdx || nextSlashIdx < 0)) {
                lastIdx = startParamsIdx;
            }

            var host = lastIdx == -1 ? url.substring(firstIdx + 2) : url.substring(firstIdx + 2, lastIdx);

            var portIndex = host.indexOf(":");
            return portIndex == -1 ? host : host.substring(0, portIndex);
        },

        getDomainName: function (url) {
            var host = this.getHost(url);
            return this.getCroppedDomainName(host);
        },

        getCroppedDomainName: function (host) {
            return api.strings.startWith(host, "www.") ? host.substring(4) : host;
        },

        isIpv4: function (address) {
            if (RE_V4.test(address)) {
                return true;
            }
            if (RE_V4_HEX.test(address)) {
                return true;
            }
            if (RE_V4_NUMERIC.test(address)) {
                return true;
            }
            return false;
        },

        isIpv6: function (address) {

            var a4addon = 0;
            var address4 = address.match(RE_V4inV6);
            if (address4) {
                var temp4 = address4[0].split('.');
                for (var i = 0; i < 4; i++) {
                    if (/^0[0-9]+/.test(temp4[i])) {
                        return false;
                    }
                }
                address = address.replace(RE_V4inV6, '');
                if (/[0-9]$/.test(address)) {
                    return false;
                }

                address = address + temp4.join(':');
                a4addon = 2;
            }

            if (RE_BAD_CHARACTERS.test(address)) {
                return false;
            }

            if (RE_BAD_ADDRESS.test(address)) {
                return false;
            }

            function count(string, substring) {
                return (string.length - string.replace(new RegExp(substring, "g"), '').length) / substring.length;
            }

            var halves = count(address, '::');
            if (halves == 1 && count(address, ':') <= 6 + 2 + a4addon) {
                return true;
            }

            if (halves == 0 && count(address, ':') == 7 + a4addon) {
                return true;
            }

            return false;
        },

        urlEquals: function (u1, u2) {
            if (!u1 || !u2) {
                return false;
            }
            u1 = u1.split(/[#?]/)[0];
            u2 = u2.split(/[#?]/)[0];
            return u1 == u2;
        },

        /**
         * Checks all domains from domainNames with isDomainOrSubDomain
         * @param domainNameToCheck Domain name to check
         * @param domainNames List of domain names
         * @returns boolean true if there is suitable domain in domainNames
         */
        isDomainOrSubDomainOfAny: function (domainNameToCheck, domainNames) {
            if (!domainNames || domainNames.length == 0) {
                return false;
            }

            for (var i = 0; i < domainNames.length; i++) {
                if (this.isDomainOrSubDomain(domainNameToCheck, domainNames[i])) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Checks if the specified domain is a sub-domain of equal to domainName
         *
         * @param domainNameToCheck Domain name to check
         * @param domainName        Domain name
         * @returns boolean true if there is suitable domain in domainNames
         */
        isDomainOrSubDomain: function (domainNameToCheck, domainName) {
            // Double endsWith check is memory optimization
            // Works in android, not sure if it makes sense here
            return domainName == domainNameToCheck ||
                api.strings.endsWith(domainNameToCheck, domainName) &&
                api.strings.endsWith(domainNameToCheck, "." + domainName);
        },

        _get2NdLevelDomainName: function (url) {

            var host = this.getHost(url);

            if (!host) {
                return null;
            }

            var parts = host.split(".");
            if (parts.length <= 2) {
                return host;
            }

            var twoPartDomain = parts[parts.length - 2] + "." + parts[parts.length - 1];
            var isContainsTwoLvlPostfix = (twoPartDomain in RESERVED_DOMAINS);

            var threePartDomain = parts[parts.length - 3] + "." + twoPartDomain;
            if (parts.length == 3 && isContainsTwoLvlPostfix) {
                return threePartDomain;
            }
            if (threePartDomain in RESERVED_DOMAINS) {
                if (parts.length == 3) {
                    return threePartDomain;
                }
                return parts[parts.length - 4] + "." + threePartDomain;
            }

            return isContainsTwoLvlPostfix ? threePartDomain : twoPartDomain;
        }
    };

    var RE_V4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|0x[0-9a-f][0-9a-f]?|0[0-7]{3})\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|0x[0-9a-f][0-9a-f]?|0[0-7]{3})$/i;
    var RE_V4_HEX = /^0x([0-9a-f]{8})$/i;
    var RE_V4_NUMERIC = /^[0-9]+$/;
    var RE_V4inV6 = /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    var RE_BAD_CHARACTERS = /([^0-9a-f:])/i;
    var RE_BAD_ADDRESS = /([0-9a-f]{5,}|:{3,}|[^:]:$|^:[^:]$)/i;

    var RESERVED_DOMAINS = {
        "0.bg": 1,
        "1.bg": 1,
        "2.bg": 1,
        "2000.hu": 1,
        "3.bg": 1,
        "4.bg": 1,
        "5.bg": 1,
        "6.bg": 1,
        "7.bg": 1,
        "8.bg": 1,
        "9.bg": 1,
        "a.bg": 1,
        "a.prod.fastly.net": 1,
        "a.se": 1,
        "a.ssl.fastly.net": 1,
        "aa.no": 1,
        "aarborte.no": 1,
        "ab.ca": 1,
        "abashiri.hokkaido.jp": 1,
        "abeno.osaka.jp": 1,
        "abiko.chiba.jp": 1,
        "abira.hokkaido.jp": 1,
        "abo.pa": 1,
        "abr.it": 1,
        "abruzzo.it": 1,
        "abu.yamaguchi.jp": 1,
        "ac.ae": 1,
        "ac.at": 1,
        "ac.be": 1,
        "ac.ci": 1,
        "ac.cn": 1,
        "ac.cr": 1,
        "ac.gn": 1,
        "ac.id": 1,
        "ac.im": 1,
        "ac.in": 1,
        "ac.ir": 1,
        "ac.jp": 1,
        "ac.kr": 1,
        "ac.ma": 1,
        "ac.me": 1,
        "ac.mu": 1,
        "ac.mw": 1,
        "ac.nz": 1,
        "ac.pa": 1,
        "ac.pr": 1,
        "ac.rs": 1,
        "ac.ru": 1,
        "ac.rw": 1,
        "ac.se": 1,
        "ac.sz": 1,
        "ac.th": 1,
        "ac.tj": 1,
        "ac.tz": 1,
        "ac.ug": 1,
        "ac.uk": 1,
        "ac.vn": 1,
        "aca.pro": 1,
        "academy.museum": 1,
        "accident-investigation.aero": 1,
        "accident-prevention.aero": 1,
        "achi.nagano.jp": 1,
        "act.au": 1,
        "act.edu.au": 1,
        "ad.jp": 1,
        "adachi.tokyo.jp": 1,
        "adm.br": 1,
        "adult.ht": 1,
        "adv.br": 1,
        "adygeya.ru": 1,
        "ae.org": 1,
        "aejrie.no": 1,
        "aero.mv": 1,
        "aero.tt": 1,
        "aerobatic.aero": 1,
        "aeroclub.aero": 1,
        "aerodrome.aero": 1,
        "aeroport.fr": 1,
        "afjord.no": 1,
        "africa.com": 1,
        "ag.it": 1,
        "aga.niigata.jp": 1,
        "agano.niigata.jp": 1,
        "agdenes.no": 1,
        "agematsu.nagano.jp": 1,
        "agents.aero": 1,
        "agr.br": 1,
        "agrar.hu": 1,
        "agriculture.museum": 1,
        "agrigento.it": 1,
        "agrinet.tn": 1,
        "agro.pl": 1,
        "aguni.okinawa.jp": 1,
        "ah.cn": 1,
        "ah.no": 1,
        "aibetsu.hokkaido.jp": 1,
        "aichi.jp": 1,
        "aid.pl": 1,
        "aikawa.kanagawa.jp": 1,
        "ainan.ehime.jp": 1,
        "aioi.hyogo.jp": 1,
        "aip.ee": 1,
        "air-surveillance.aero": 1,
        "air-traffic-control.aero": 1,
        "air.museum": 1,
        "aircraft.aero": 1,
        "airguard.museum": 1,
        "airline.aero": 1,
        "airport.aero": 1,
        "airtraffic.aero": 1,
        "aisai.aichi.jp": 1,
        "aisho.shiga.jp": 1,
        "aizubange.fukushima.jp": 1,
        "aizumi.tokushima.jp": 1,
        "aizumisato.fukushima.jp": 1,
        "aizuwakamatsu.fukushima.jp": 1,
        "ak.us": 1,
        "akabira.hokkaido.jp": 1,
        "akagi.shimane.jp": 1,
        "akaiwa.okayama.jp": 1,
        "akashi.hyogo.jp": 1,
        "aki.kochi.jp": 1,
        "akiruno.tokyo.jp": 1,
        "akishima.tokyo.jp": 1,
        "akita.akita.jp": 1,
        "akita.jp": 1,
        "akkeshi.hokkaido.jp": 1,
        "aknoluokta.no": 1,
        "ako.hyogo.jp": 1,
        "akrehamn.no": 1,
        "akune.kagoshima.jp": 1,
        "al.it": 1,
        "al.no": 1,
        "al.us": 1,
        "alabama.museum": 1,
        "alaheadju.no": 1,
        "aland.fi": 1,
        "alaska.museum": 1,
        "alessandria.it": 1,
        "alesund.no": 1,
        "algard.no": 1,
        "alstahaug.no": 1,
        "alta.no": 1,
        "altai.ru": 1,
        "alto-adige.it": 1,
        "altoadige.it": 1,
        "alvdal.no": 1,
        "am.br": 1,
        "ama.aichi.jp": 1,
        "ama.shimane.jp": 1,
        "amagasaki.hyogo.jp": 1,
        "amakusa.kumamoto.jp": 1,
        "amami.kagoshima.jp": 1,
        "amber.museum": 1,
        "ambulance.aero": 1,
        "ambulance.museum": 1,
        "american.museum": 1,
        "americana.museum": 1,
        "americanantiques.museum": 1,
        "americanart.museum": 1,
        "ami.ibaraki.jp": 1,
        "amli.no": 1,
        "amot.no": 1,
        "amsterdam.museum": 1,
        "amur.ru": 1,
        "amursk.ru": 1,
        "amusement.aero": 1,
        "an.it": 1,
        "anamizu.ishikawa.jp": 1,
        "anan.nagano.jp": 1,
        "anan.tokushima.jp": 1,
        "ancona.it": 1,
        "and.museum": 1,
        "andasuolo.no": 1,
        "andebu.no": 1,
        "ando.nara.jp": 1,
        "andoy.no": 1,
        "andria-barletta-trani.it": 1,
        "andria-trani-barletta.it": 1,
        "andriabarlettatrani.it": 1,
        "andriatranibarletta.it": 1,
        "anjo.aichi.jp": 1,
        "annaka.gunma.jp": 1,
        "annefrank.museum": 1,
        "anpachi.gifu.jp": 1,
        "anthro.museum": 1,
        "anthropology.museum": 1,
        "antiques.museum": 1,
        "ao.it": 1,
        "aogaki.hyogo.jp": 1,
        "aogashima.tokyo.jp": 1,
        "aoki.nagano.jp": 1,
        "aomori.aomori.jp": 1,
        "aomori.jp": 1,
        "aosta-valley.it": 1,
        "aosta.it": 1,
        "aostavalley.it": 1,
        "aoste.it": 1,
        "ap-northeast-1.compute.amazonaws.com": 1,
        "ap-southeast-1.compute.amazonaws.com": 1,
        "ap-southeast-2.compute.amazonaws.com": 1,
        "ap.it": 1,
        "appspot.com": 1,
        "aq.it": 1,
        "aquarium.museum": 1,
        "aquila.it": 1,
        "ar.com": 1,
        "ar.it": 1,
        "ar.us": 1,
        "arai.shizuoka.jp": 1,
        "arakawa.saitama.jp": 1,
        "arakawa.tokyo.jp": 1,
        "arao.kumamoto.jp": 1,
        "arboretum.museum": 1,
        "archaeological.museum": 1,
        "archaeology.museum": 1,
        "architecture.museum": 1,
        "ardal.no": 1,
        "aremark.no": 1,
        "arendal.no": 1,
        "arezzo.it": 1,
        "ariake.saga.jp": 1,
        "arida.wakayama.jp": 1,
        "aridagawa.wakayama.jp": 1,
        "arita.saga.jp": 1,
        "arkhangelsk.ru": 1,
        "arna.no": 1,
        "arq.br": 1,
        "art.br": 1,
        "art.do": 1,
        "art.dz": 1,
        "art.ht": 1,
        "art.museum": 1,
        "art.pl": 1,
        "art.sn": 1,
        "artanddesign.museum": 1,
        "artcenter.museum": 1,
        "artdeco.museum": 1,
        "arteducation.museum": 1,
        "artgallery.museum": 1,
        "arts.co": 1,
        "arts.museum": 1,
        "arts.nf": 1,
        "arts.ro": 1,
        "arts.ve": 1,
        "artsandcrafts.museum": 1,
        "as.us": 1,
        "asago.hyogo.jp": 1,
        "asahi.chiba.jp": 1,
        "asahi.ibaraki.jp": 1,
        "asahi.mie.jp": 1,
        "asahi.nagano.jp": 1,
        "asahi.toyama.jp": 1,
        "asahi.yamagata.jp": 1,
        "asahikawa.hokkaido.jp": 1,
        "asaka.saitama.jp": 1,
        "asakawa.fukushima.jp": 1,
        "asakuchi.okayama.jp": 1,
        "asaminami.hiroshima.jp": 1,
        "ascoli-piceno.it": 1,
        "ascolipiceno.it": 1,
        "aseral.no": 1,
        "ashibetsu.hokkaido.jp": 1,
        "ashikaga.tochigi.jp": 1,
        "ashiya.fukuoka.jp": 1,
        "ashiya.hyogo.jp": 1,
        "ashoro.hokkaido.jp": 1,
        "asker.no": 1,
        "askim.no": 1,
        "askoy.no": 1,
        "askvoll.no": 1,
        "asmatart.museum": 1,
        "asn.au": 1,
        "asn.lv": 1,
        "asnes.no": 1,
        "aso.kumamoto.jp": 1,
        "ass.km": 1,
        "assabu.hokkaido.jp": 1,
        "assassination.museum": 1,
        "assedic.fr": 1,
        "assisi.museum": 1,
        "assn.lk": 1,
        "asso.bj": 1,
        "asso.ci": 1,
        "asso.dz": 1,
        "asso.fr": 1,
        "asso.gp": 1,
        "asso.ht": 1,
        "asso.km": 1,
        "asso.mc": 1,
        "asso.nc": 1,
        "asso.re": 1,
        "association.aero": 1,
        "association.museum": 1,
        "asti.it": 1,
        "astrakhan.ru": 1,
        "astronomy.museum": 1,
        "asuke.aichi.jp": 1,
        "at-band-camp.net": 1,
        "at.it": 1,
        "atami.shizuoka.jp": 1,
        "ath.cx": 1,
        "atlanta.museum": 1,
        "atm.pl": 1,
        "ato.br": 1,
        "atsugi.kanagawa.jp": 1,
        "atsuma.hokkaido.jp": 1,
        "audnedaln.no": 1,
        "augustow.pl": 1,
        "aukra.no": 1,
        "aure.no": 1,
        "aurland.no": 1,
        "aurskog-holand.no": 1,
        "austevoll.no": 1,
        "austin.museum": 1,
        "australia.museum": 1,
        "austrheim.no": 1,
        "author.aero": 1,
        "auto.pl": 1,
        "automotive.museum": 1,
        "av.it": 1,
        "av.tr": 1,
        "avellino.it": 1,
        "averoy.no": 1,
        "aviation.museum": 1,
        "avocat.fr": 1,
        "avoues.fr": 1,
        "awaji.hyogo.jp": 1,
        "axis.museum": 1,
        "aya.miyazaki.jp": 1,
        "ayabe.kyoto.jp": 1,
        "ayagawa.kagawa.jp": 1,
        "ayase.kanagawa.jp": 1,
        "az.us": 1,
        "azumino.nagano.jp": 1,
        "azure-mobile.net": 1,
        "azurewebsites.net": 1,
        "b.bg": 1,
        "b.br": 1,
        "b.se": 1,
        "b.ssl.fastly.net": 1,
        "ba.it": 1,
        "babia-gora.pl": 1,
        "badaddja.no": 1,
        "badajoz.museum": 1,
        "baghdad.museum": 1,
        "bahcavuotna.no": 1,
        "bahccavuotna.no": 1,
        "bahn.museum": 1,
        "baidar.no": 1,
        "baikal.ru": 1,
        "bajddar.no": 1,
        "balat.no": 1,
        "bale.museum": 1,
        "balestrand.no": 1,
        "ballangen.no": 1,
        "ballooning.aero": 1,
        "balsan.it": 1,
        "balsfjord.no": 1,
        "baltimore.museum": 1,
        "bamble.no": 1,
        "bandai.fukushima.jp": 1,
        "bando.ibaraki.jp": 1,
        "bar.pro": 1,
        "barcelona.museum": 1,
        "bardu.no": 1,
        "bari.it": 1,
        "barletta-trani-andria.it": 1,
        "barlettatraniandria.it": 1,
        "barreau.bj": 1,
        "barrel-of-knowledge.info": 1,
        "barrell-of-knowledge.info": 1,
        "barum.no": 1,
        "bas.it": 1,
        "baseball.museum": 1,
        "basel.museum": 1,
        "bashkiria.ru": 1,
        "basilicata.it": 1,
        "baths.museum": 1,
        "bato.tochigi.jp": 1,
        "batsfjord.no": 1,
        "bauern.museum": 1,
        "bbs.tr": 1,
        "bc.ca": 1,
        "bd.se": 1,
        "bearalvahki.no": 1,
        "beardu.no": 1,
        "beauxarts.museum": 1,
        "bedzin.pl": 1,
        "beeldengeluid.museum": 1,
        "beiarn.no": 1,
        "bel.tr": 1,
        "belau.pw": 1,
        "belgorod.ru": 1,
        "bellevue.museum": 1,
        "belluno.it": 1,
        "benevento.it": 1,
        "beppu.oita.jp": 1,
        "berg.no": 1,
        "bergamo.it": 1,
        "bergbau.museum": 1,
        "bergen.no": 1,
        "berkeley.museum": 1,
        "berlevag.no": 1,
        "berlin.museum": 1,
        "bern.museum": 1,
        "beskidy.pl": 1,
        "betainabox.com": 1,
        "better-than.tv": 1,
        "bg.it": 1,
        "bi.it": 1,
        "bialowieza.pl": 1,
        "bialystok.pl": 1,
        "bibai.hokkaido.jp": 1,
        "bible.museum": 1,
        "biei.hokkaido.jp": 1,
        "bielawa.pl": 1,
        "biella.it": 1,
        "bieszczady.pl": 1,
        "bievat.no": 1,
        "bifuka.hokkaido.jp": 1,
        "bihoro.hokkaido.jp": 1,
        "bilbao.museum": 1,
        "bill.museum": 1,
        "bindal.no": 1,
        "bio.br": 1,
        "bir.ru": 1,
        "biratori.hokkaido.jp": 1,
        "birdart.museum": 1,
        "birkenes.no": 1,
        "birthplace.museum": 1,
        "biz.at": 1,
        "biz.az": 1,
        "biz.bb": 1,
        "biz.et": 1,
        "biz.id": 1,
        "biz.ki": 1,
        "biz.mv": 1,
        "biz.mw": 1,
        "biz.nr": 1,
        "biz.pk": 1,
        "biz.pl": 1,
        "biz.pr": 1,
        "biz.tj": 1,
        "biz.tr": 1,
        "biz.tt": 1,
        "biz.vn": 1,
        "bizen.okayama.jp": 1,
        "bj.cn": 1,
        "bjarkoy.no": 1,
        "bjerkreim.no": 1,
        "bjugn.no": 1,
        "bl.it": 1,
        "blog.br": 1,
        "blogdns.com": 1,
        "blogdns.net": 1,
        "blogdns.org": 1,
        "blogsite.org": 1,
        "blogspot.ae": 1,
        "blogspot.be": 1,
        "blogspot.bj": 1,
        "blogspot.ca": 1,
        "blogspot.cf": 1,
        "blogspot.ch": 1,
        "blogspot.co.at": 1,
        "blogspot.co.il": 1,
        "blogspot.co.nz": 1,
        "blogspot.co.uk": 1,
        "blogspot.com": 1,
        "blogspot.com.ar": 1,
        "blogspot.com.au": 1,
        "blogspot.com.br": 1,
        "blogspot.com.es": 1,
        "blogspot.com.tr": 1,
        "blogspot.cv": 1,
        "blogspot.cz": 1,
        "blogspot.de": 1,
        "blogspot.dk": 1,
        "blogspot.fi": 1,
        "blogspot.fr": 1,
        "blogspot.gr": 1,
        "blogspot.hk": 1,
        "blogspot.hu": 1,
        "blogspot.ie": 1,
        "blogspot.in": 1,
        "blogspot.it": 1,
        "blogspot.jp": 1,
        "blogspot.kr": 1,
        "blogspot.mr": 1,
        "blogspot.mx": 1,
        "blogspot.nl": 1,
        "blogspot.no": 1,
        "blogspot.pt": 1,
        "blogspot.re": 1,
        "blogspot.ro": 1,
        "blogspot.ru": 1,
        "blogspot.se": 1,
        "blogspot.sg": 1,
        "blogspot.sk": 1,
        "blogspot.td": 1,
        "blogspot.tw": 1,
        "bmd.br": 1,
        "bn.it": 1,
        "bo.it": 1,
        "bo.nordland.no": 1,
        "bo.telemark.no": 1,
        "bodo.no": 1,
        "bokn.no": 1,
        "boldlygoingnowhere.org": 1,
        "boleslawiec.pl": 1,
        "bologna.it": 1,
        "bolt.hu": 1,
        "bolzano.it": 1,
        "bomlo.no": 1,
        "bonn.museum": 1,
        "boston.museum": 1,
        "botanical.museum": 1,
        "botanicalgarden.museum": 1,
        "botanicgarden.museum": 1,
        "botany.museum": 1,
        "bozen.it": 1,
        "br.com": 1,
        "br.it": 1,
        "brand.se": 1,
        "brandywinevalley.museum": 1,
        "brasil.museum": 1,
        "bremanger.no": 1,
        "brescia.it": 1,
        "brindisi.it": 1,
        "bristol.museum": 1,
        "british.museum": 1,
        "britishcolumbia.museum": 1,
        "broadcast.museum": 1,
        "broke-it.net": 1,
        "broker.aero": 1,
        "bronnoy.no": 1,
        "bronnoysund.no": 1,
        "brumunddal.no": 1,
        "brunel.museum": 1,
        "brussel.museum": 1,
        "brussels.museum": 1,
        "bruxelles.museum": 1,
        "bryansk.ru": 1,
        "bryne.no": 1,
        "bs.it": 1,
        "bt.it": 1,
        "bu.no": 1,
        "budejju.no": 1,
        "building.museum": 1,
        "bungoono.oita.jp": 1,
        "bungotakada.oita.jp": 1,
        "bunkyo.tokyo.jp": 1,
        "burghof.museum": 1,
        "buryatia.ru": 1,
        "bus.museum": 1,
        "busan.kr": 1,
        "bushey.museum": 1,
        "buyshouses.net": 1,
        "buzen.fukuoka.jp": 1,
        "bv.nl": 1,
        "bydgoszcz.pl": 1,
        "bygland.no": 1,
        "bykle.no": 1,
        "bytom.pl": 1,
        "bz.it": 1,
        "c.bg": 1,
        "c.la": 1,
        "c.se": 1,
        "ca.it": 1,
        "ca.na": 1,
        "ca.us": 1,
        "caa.aero": 1,
        "cadaques.museum": 1,
        "cagliari.it": 1,
        "cahcesuolo.no": 1,
        "cal.it": 1,
        "calabria.it": 1,
        "california.museum": 1,
        "caltanissetta.it": 1,
        "cam.it": 1,
        "cambridge.museum": 1,
        "campania.it": 1,
        "campidano-medio.it": 1,
        "campidanomedio.it": 1,
        "campobasso.it": 1,
        "can.museum": 1,
        "canada.museum": 1,
        "capebreton.museum": 1,
        "carbonia-iglesias.it": 1,
        "carboniaiglesias.it": 1,
        "cargo.aero": 1,
        "carrara-massa.it": 1,
        "carraramassa.it": 1,
        "carrier.museum": 1,
        "cartoonart.museum": 1,
        "casadelamoneda.museum": 1,
        "caserta.it": 1,
        "casino.hu": 1,
        "castle.museum": 1,
        "castres.museum": 1,
        "catania.it": 1,
        "catanzaro.it": 1,
        "catering.aero": 1,
        "cb.it": 1,
        "cbg.ru": 1,
        "cc.ak.us": 1,
        "cc.al.us": 1,
        "cc.ar.us": 1,
        "cc.as.us": 1,
        "cc.az.us": 1,
        "cc.ca.us": 1,
        "cc.co.us": 1,
        "cc.ct.us": 1,
        "cc.dc.us": 1,
        "cc.de.us": 1,
        "cc.fl.us": 1,
        "cc.ga.us": 1,
        "cc.gu.us": 1,
        "cc.hi.us": 1,
        "cc.ia.us": 1,
        "cc.id.us": 1,
        "cc.il.us": 1,
        "cc.in.us": 1,
        "cc.ks.us": 1,
        "cc.ky.us": 1,
        "cc.la.us": 1,
        "cc.ma.us": 1,
        "cc.md.us": 1,
        "cc.me.us": 1,
        "cc.mi.us": 1,
        "cc.mn.us": 1,
        "cc.mo.us": 1,
        "cc.ms.us": 1,
        "cc.mt.us": 1,
        "cc.na": 1,
        "cc.nc.us": 1,
        "cc.nd.us": 1,
        "cc.ne.us": 1,
        "cc.nh.us": 1,
        "cc.nj.us": 1,
        "cc.nm.us": 1,
        "cc.nv.us": 1,
        "cc.ny.us": 1,
        "cc.oh.us": 1,
        "cc.ok.us": 1,
        "cc.or.us": 1,
        "cc.pa.us": 1,
        "cc.pr.us": 1,
        "cc.ri.us": 1,
        "cc.sc.us": 1,
        "cc.sd.us": 1,
        "cc.tn.us": 1,
        "cc.tx.us": 1,
        "cc.ut.us": 1,
        "cc.va.us": 1,
        "cc.vi.us": 1,
        "cc.vt.us": 1,
        "cc.wa.us": 1,
        "cc.wi.us": 1,
        "cc.wv.us": 1,
        "cc.wy.us": 1,
        "cci.fr": 1,
        "ce.it": 1,
        "cechire.com": 1,
        "celtic.museum": 1,
        "center.museum": 1,
        "certification.aero": 1,
        "cesena-forli.it": 1,
        "cesenaforli.it": 1,
        "ch.it": 1,
        "chambagri.fr": 1,
        "championship.aero": 1,
        "charter.aero": 1,
        "chattanooga.museum": 1,
        "chel.ru": 1,
        "cheltenham.museum": 1,
        "chelyabinsk.ru": 1,
        "cherkassy.ua": 1,
        "cherkasy.ua": 1,
        "chernigov.ua": 1,
        "chernihiv.ua": 1,
        "chernivtsi.ua": 1,
        "chernovtsy.ua": 1,
        "chesapeakebay.museum": 1,
        "chiba.jp": 1,
        "chicago.museum": 1,
        "chichibu.saitama.jp": 1,
        "chieti.it": 1,
        "chigasaki.kanagawa.jp": 1,
        "chihayaakasaka.osaka.jp": 1,
        "chijiwa.nagasaki.jp": 1,
        "chikugo.fukuoka.jp": 1,
        "chikuho.fukuoka.jp": 1,
        "chikuhoku.nagano.jp": 1,
        "chikujo.fukuoka.jp": 1,
        "chikuma.nagano.jp": 1,
        "chikusei.ibaraki.jp": 1,
        "chikushino.fukuoka.jp": 1,
        "chikuzen.fukuoka.jp": 1,
        "children.museum": 1,
        "childrens.museum": 1,
        "childrensgarden.museum": 1,
        "chino.nagano.jp": 1,
        "chippubetsu.hokkaido.jp": 1,
        "chiropractic.museum": 1,
        "chirurgiens-dentistes.fr": 1,
        "chiryu.aichi.jp": 1,
        "chita.aichi.jp": 1,
        "chita.ru": 1,
        "chitose.hokkaido.jp": 1,
        "chiyoda.gunma.jp": 1,
        "chiyoda.tokyo.jp": 1,
        "chizu.tottori.jp": 1,
        "chocolate.museum": 1,
        "chofu.tokyo.jp": 1,
        "chonan.chiba.jp": 1,
        "chosei.chiba.jp": 1,
        "choshi.chiba.jp": 1,
        "choyo.kumamoto.jp": 1,
        "christiansburg.museum": 1,
        "chtr.k12.ma.us": 1,
        "chukotka.ru": 1,
        "chungbuk.kr": 1,
        "chungnam.kr": 1,
        "chuo.chiba.jp": 1,
        "chuo.fukuoka.jp": 1,
        "chuo.osaka.jp": 1,
        "chuo.tokyo.jp": 1,
        "chuo.yamanashi.jp": 1,
        "chuvashia.ru": 1,
        "ci.it": 1,
        "cieszyn.pl": 1,
        "cim.br": 1,
        "cincinnati.museum": 1,
        "cinema.museum": 1,
        "circus.museum": 1,
        "city.hu": 1,
        "city.kawasaki.jp": 1,
        "city.kitakyushu.jp": 1,
        "city.kobe.jp": 1,
        "city.nagoya.jp": 1,
        "city.sapporo.jp": 1,
        "city.sendai.jp": 1,
        "city.yokohama.jp": 1,
        "civilaviation.aero": 1,
        "civilisation.museum": 1,
        "civilization.museum": 1,
        "civilwar.museum": 1,
        "ck.ua": 1,
        "cl.it": 1,
        "clinton.museum": 1,
        "clock.museum": 1,
        "cloudapp.net": 1,
        "cloudcontrolapp.com": 1,
        "cloudcontrolled.com": 1,
        "cloudfront.net": 1,
        "club.aero": 1,
        "club.tw": 1,
        "cmw.ru": 1,
        "cn-north-1.compute.amazonaws.cn": 1,
        "cn.com": 1,
        "cn.it": 1,
        "cn.ua": 1,
        "cng.br": 1,
        "cnt.br": 1,
        "co.ae": 1,
        "co.ag": 1,
        "co.ao": 1,
        "co.at": 1,
        "co.ba": 1,
        "co.bb": 1,
        "co.bi": 1,
        "co.bw": 1,
        "co.ca": 1,
        "co.ci": 1,
        "co.cl": 1,
        "co.cm": 1,
        "co.com": 1,
        "co.cr": 1,
        "co.gg": 1,
        "co.gy": 1,
        "co.hu": 1,
        "co.id": 1,
        "co.im": 1,
        "co.in": 1,
        "co.ir": 1,
        "co.it": 1,
        "co.je": 1,
        "co.jp": 1,
        "co.kr": 1,
        "co.lc": 1,
        "co.ls": 1,
        "co.ma": 1,
        "co.me": 1,
        "co.mu": 1,
        "co.mw": 1,
        "co.na": 1,
        "co.nl": 1,
        "co.no": 1,
        "co.nz": 1,
        "co.om": 1,
        "co.pl": 1,
        "co.pn": 1,
        "co.pw": 1,
        "co.rs": 1,
        "co.rw": 1,
        "co.st": 1,
        "co.sz": 1,
        "co.th": 1,
        "co.tj": 1,
        "co.tm": 1,
        "co.tt": 1,
        "co.tz": 1,
        "co.ua": 1,
        "co.ug": 1,
        "co.uk": 1,
        "co.us": 1,
        "co.uz": 1,
        "co.ve": 1,
        "co.vi": 1,
        "coal.museum": 1,
        "coastaldefence.museum": 1,
        "codespot.com": 1,
        "cody.museum": 1,
        "coldwar.museum": 1,
        "collection.museum": 1,
        "colonialwilliamsburg.museum": 1,
        "coloradoplateau.museum": 1,
        "columbia.museum": 1,
        "columbus.museum": 1,
        "com.ac": 1,
        "com.af": 1,
        "com.ag": 1,
        "com.ai": 1,
        "com.al": 1,
        "com.an": 1,
        "com.ar": 1,
        "com.au": 1,
        "com.aw": 1,
        "com.az": 1,
        "com.ba": 1,
        "com.bb": 1,
        "com.bh": 1,
        "com.bi": 1,
        "com.bm": 1,
        "com.bo": 1,
        "com.br": 1,
        "com.bs": 1,
        "com.bt": 1,
        "com.by": 1,
        "com.bz": 1,
        "com.ci": 1,
        "com.cm": 1,
        "com.cn": 1,
        "com.co": 1,
        "com.cu": 1,
        "com.cw": 1,
        "com.de": 1,
        "com.dm": 1,
        "com.do": 1,
        "com.dz": 1,
        "com.ec": 1,
        "com.ee": 1,
        "com.eg": 1,
        "com.es": 1,
        "com.et": 1,
        "com.fr": 1,
        "com.ge": 1,
        "com.gh": 1,
        "com.gi": 1,
        "com.gn": 1,
        "com.gp": 1,
        "com.gr": 1,
        "com.gt": 1,
        "com.gy": 1,
        "com.hk": 1,
        "com.hn": 1,
        "com.hr": 1,
        "com.ht": 1,
        "com.im": 1,
        "com.io": 1,
        "com.iq": 1,
        "com.is": 1,
        "com.jo": 1,
        "com.kg": 1,
        "com.ki": 1,
        "com.km": 1,
        "com.kp": 1,
        "com.ky": 1,
        "com.kz": 1,
        "com.la": 1,
        "com.lb": 1,
        "com.lc": 1,
        "com.lk": 1,
        "com.lr": 1,
        "com.lv": 1,
        "com.ly": 1,
        "com.mg": 1,
        "com.mk": 1,
        "com.ml": 1,
        "com.mo": 1,
        "com.ms": 1,
        "com.mt": 1,
        "com.mu": 1,
        "com.mv": 1,
        "com.mw": 1,
        "com.mx": 1,
        "com.my": 1,
        "com.na": 1,
        "com.nf": 1,
        "com.ng": 1,
        "com.nr": 1,
        "com.om": 1,
        "com.pa": 1,
        "com.pe": 1,
        "com.pf": 1,
        "com.ph": 1,
        "com.pk": 1,
        "com.pl": 1,
        "com.pr": 1,
        "com.ps": 1,
        "com.pt": 1,
        "com.py": 1,
        "com.qa": 1,
        "com.re": 1,
        "com.ro": 1,
        "com.ru": 1,
        "com.rw": 1,
        "com.sa": 1,
        "com.sb": 1,
        "com.sc": 1,
        "com.sd": 1,
        "com.se": 1,
        "com.sg": 1,
        "com.sh": 1,
        "com.sl": 1,
        "com.sn": 1,
        "com.so": 1,
        "com.st": 1,
        "com.sv": 1,
        "com.sy": 1,
        "com.tj": 1,
        "com.tm": 1,
        "com.tn": 1,
        "com.to": 1,
        "com.tr": 1,
        "com.tt": 1,
        "com.tw": 1,
        "com.ua": 1,
        "com.ug": 1,
        "com.uy": 1,
        "com.uz": 1,
        "com.vc": 1,
        "com.ve": 1,
        "com.vi": 1,
        "com.vn": 1,
        "com.vu": 1,
        "com.ws": 1,
        "communication.museum": 1,
        "communications.museum": 1,
        "community.museum": 1,
        "como.it": 1,
        "compute-1.amazonaws.com": 1,
        "compute.amazonaws.cn": 1,
        "compute.amazonaws.com": 1,
        "computer.museum": 1,
        "computerhistory.museum": 1,
        "conf.au": 1,
        "conf.lv": 1,
        "conference.aero": 1,
        "consulado.st": 1,
        "consultant.aero": 1,
        "consulting.aero": 1,
        "contemporary.museum": 1,
        "contemporaryart.museum": 1,
        "control.aero": 1,
        "convent.museum": 1,
        "coop.br": 1,
        "coop.ht": 1,
        "coop.km": 1,
        "coop.mv": 1,
        "coop.mw": 1,
        "coop.py": 1,
        "coop.tt": 1,
        "copenhagen.museum": 1,
        "corporation.museum": 1,
        "corvette.museum": 1,
        "cosenza.it": 1,
        "costume.museum": 1,
        "council.aero": 1,
        "countryestate.museum": 1,
        "county.museum": 1,
        "cpa.pro": 1,
        "cq.cn": 1,
        "cr.it": 1,
        "cr.ua": 1,
        "crafts.museum": 1,
        "cranbrook.museum": 1,
        "creation.museum": 1,
        "cremona.it": 1,
        "crew.aero": 1,
        "cri.nz": 1,
        "crimea.ua": 1,
        "crotone.it": 1,
        "cs.it": 1,
        "ct.it": 1,
        "ct.us": 1,
        "cultural.museum": 1,
        "culturalcenter.museum": 1,
        "culture.museum": 1,
        "cuneo.it": 1,
        "cupcake.is": 1,
        "cv.ua": 1,
        "cyber.museum": 1,
        "cymru.museum": 1,
        "cz.it": 1,
        "czeladz.pl": 1,
        "czest.pl": 1,
        "d.bg": 1,
        "d.se": 1,
        "daegu.kr": 1,
        "daejeon.kr": 1,
        "dagestan.ru": 1,
        "daigo.ibaraki.jp": 1,
        "daisen.akita.jp": 1,
        "daito.osaka.jp": 1,
        "daiwa.hiroshima.jp": 1,
        "dali.museum": 1,
        "dallas.museum": 1,
        "database.museum": 1,
        "date.fukushima.jp": 1,
        "date.hokkaido.jp": 1,
        "davvenjarga.no": 1,
        "davvesiida.no": 1,
        "dazaifu.fukuoka.jp": 1,
        "dc.us": 1,
        "ddr.museum": 1,
        "de.com": 1,
        "de.us": 1,
        "deatnu.no": 1,
        "decorativearts.museum": 1,
        "defense.tn": 1,
        "delaware.museum": 1,
        "dell-ogliastra.it": 1,
        "dellogliastra.it": 1,
        "delmenhorst.museum": 1,
        "denmark.museum": 1,
        "dep.no": 1,
        "depot.museum": 1,
        "desa.id": 1,
        "design.aero": 1,
        "design.museum": 1,
        "detroit.museum": 1,
        "dgca.aero": 1,
        "dielddanuorri.no": 1,
        "dinosaur.museum": 1,
        "discovery.museum": 1,
        "divtasvuodna.no": 1,
        "divttasvuotna.no": 1,
        "dlugoleka.pl": 1,
        "dn.ua": 1,
        "dnepropetrovsk.ua": 1,
        "dni.us": 1,
        "dnipropetrovsk.ua": 1,
        "dnsalias.com": 1,
        "dnsalias.net": 1,
        "dnsalias.org": 1,
        "dnsdojo.com": 1,
        "dnsdojo.net": 1,
        "dnsdojo.org": 1,
        "does-it.net": 1,
        "doesntexist.com": 1,
        "doesntexist.org": 1,
        "dolls.museum": 1,
        "dominic.ua": 1,
        "donetsk.ua": 1,
        "donna.no": 1,
        "donostia.museum": 1,
        "dontexist.com": 1,
        "dontexist.net": 1,
        "dontexist.org": 1,
        "doomdns.com": 1,
        "doomdns.org": 1,
        "doshi.yamanashi.jp": 1,
        "dovre.no": 1,
        "dp.ua": 1,
        "dr.na": 1,
        "dr.tr": 1,
        "drammen.no": 1,
        "drangedal.no": 1,
        "dreamhosters.com": 1,
        "drobak.no": 1,
        "dudinka.ru": 1,
        "durham.museum": 1,
        "dvrdns.org": 1,
        "dyn-o-saur.com": 1,
        "dynalias.com": 1,
        "dynalias.net": 1,
        "dynalias.org": 1,
        "dynathome.net": 1,
        "dyndns-at-home.com": 1,
        "dyndns-at-work.com": 1,
        "dyndns-blog.com": 1,
        "dyndns-free.com": 1,
        "dyndns-home.com": 1,
        "dyndns-ip.com": 1,
        "dyndns-mail.com": 1,
        "dyndns-office.com": 1,
        "dyndns-pics.com": 1,
        "dyndns-remote.com": 1,
        "dyndns-server.com": 1,
        "dyndns-web.com": 1,
        "dyndns-wiki.com": 1,
        "dyndns-work.com": 1,
        "dyndns.biz": 1,
        "dyndns.info": 1,
        "dyndns.org": 1,
        "dyndns.tv": 1,
        "dyndns.ws": 1,
        "dyroy.no": 1,
        "e-burg.ru": 1,
        "e.bg": 1,
        "e.se": 1,
        "e12.ve": 1,
        "e164.arpa": 1,
        "eastafrica.museum": 1,
        "eastcoast.museum": 1,
        "ebetsu.hokkaido.jp": 1,
        "ebina.kanagawa.jp": 1,
        "ebino.miyazaki.jp": 1,
        "ebiz.tw": 1,
        "echizen.fukui.jp": 1,
        "ecn.br": 1,
        "eco.br": 1,
        "ed.ao": 1,
        "ed.ci": 1,
        "ed.cr": 1,
        "ed.jp": 1,
        "ed.pw": 1,
        "edogawa.tokyo.jp": 1,
        "edu.ac": 1,
        "edu.af": 1,
        "edu.al": 1,
        "edu.an": 1,
        "edu.ar": 1,
        "edu.au": 1,
        "edu.az": 1,
        "edu.ba": 1,
        "edu.bb": 1,
        "edu.bh": 1,
        "edu.bi": 1,
        "edu.bm": 1,
        "edu.bo": 1,
        "edu.br": 1,
        "edu.bs": 1,
        "edu.bt": 1,
        "edu.bz": 1,
        "edu.ci": 1,
        "edu.cn": 1,
        "edu.co": 1,
        "edu.cu": 1,
        "edu.cw": 1,
        "edu.dm": 1,
        "edu.do": 1,
        "edu.dz": 1,
        "edu.ec": 1,
        "edu.ee": 1,
        "edu.eg": 1,
        "edu.es": 1,
        "edu.et": 1,
        "edu.ge": 1,
        "edu.gh": 1,
        "edu.gi": 1,
        "edu.gn": 1,
        "edu.gp": 1,
        "edu.gr": 1,
        "edu.gt": 1,
        "edu.hk": 1,
        "edu.hn": 1,
        "edu.ht": 1,
        "edu.in": 1,
        "edu.iq": 1,
        "edu.is": 1,
        "edu.it": 1,
        "edu.jo": 1,
        "edu.kg": 1,
        "edu.ki": 1,
        "edu.km": 1,
        "edu.kn": 1,
        "edu.kp": 1,
        "edu.ky": 1,
        "edu.kz": 1,
        "edu.la": 1,
        "edu.lb": 1,
        "edu.lc": 1,
        "edu.lk": 1,
        "edu.lr": 1,
        "edu.lv": 1,
        "edu.ly": 1,
        "edu.me": 1,
        "edu.mg": 1,
        "edu.mk": 1,
        "edu.ml": 1,
        "edu.mn": 1,
        "edu.mo": 1,
        "edu.ms": 1,
        "edu.mt": 1,
        "edu.mv": 1,
        "edu.mw": 1,
        "edu.mx": 1,
        "edu.my": 1,
        "edu.ng": 1,
        "edu.nr": 1,
        "edu.om": 1,
        "edu.pa": 1,
        "edu.pe": 1,
        "edu.pf": 1,
        "edu.ph": 1,
        "edu.pk": 1,
        "edu.pl": 1,
        "edu.pn": 1,
        "edu.pr": 1,
        "edu.ps": 1,
        "edu.pt": 1,
        "edu.py": 1,
        "edu.qa": 1,
        "edu.rs": 1,
        "edu.ru": 1,
        "edu.rw": 1,
        "edu.sa": 1,
        "edu.sb": 1,
        "edu.sc": 1,
        "edu.sd": 1,
        "edu.sg": 1,
        "edu.sl": 1,
        "edu.sn": 1,
        "edu.st": 1,
        "edu.sv": 1,
        "edu.sy": 1,
        "edu.tj": 1,
        "edu.tm": 1,
        "edu.to": 1,
        "edu.tr": 1,
        "edu.tt": 1,
        "edu.tw": 1,
        "edu.ua": 1,
        "edu.uy": 1,
        "edu.vc": 1,
        "edu.ve": 1,
        "edu.vn": 1,
        "edu.vu": 1,
        "edu.ws": 1,
        "education.museum": 1,
        "educational.museum": 1,
        "educator.aero": 1,
        "edunet.tn": 1,
        "egersund.no": 1,
        "egyptian.museum": 1,
        "ehime.jp": 1,
        "eid.no": 1,
        "eidfjord.no": 1,
        "eidsberg.no": 1,
        "eidskog.no": 1,
        "eidsvoll.no": 1,
        "eigersund.no": 1,
        "eiheiji.fukui.jp": 1,
        "eisenbahn.museum": 1,
        "elasticbeanstalk.com": 1,
        "elb.amazonaws.com": 1,
        "elblag.pl": 1,
        "elburg.museum": 1,
        "elk.pl": 1,
        "elvendrell.museum": 1,
        "elverum.no": 1,
        "embaixada.st": 1,
        "embetsu.hokkaido.jp": 1,
        "embroidery.museum": 1,
        "emergency.aero": 1,
        "emilia-romagna.it": 1,
        "emiliaromagna.it": 1,
        "emp.br": 1,
        "emr.it": 1,
        "en.it": 1,
        "ena.gifu.jp": 1,
        "encyclopedic.museum": 1,
        "endofinternet.net": 1,
        "endofinternet.org": 1,
        "endoftheinternet.org": 1,
        "enebakk.no": 1,
        "eng.br": 1,
        "eng.pro": 1,
        "engerdal.no": 1,
        "engine.aero": 1,
        "engineer.aero": 1,
        "england.museum": 1,
        "eniwa.hokkaido.jp": 1,
        "enna.it": 1,
        "ens.tn": 1,
        "entertainment.aero": 1,
        "entomology.museum": 1,
        "environment.museum": 1,
        "environmentalconservation.museum": 1,
        "epilepsy.museum": 1,
        "equipment.aero": 1,
        "erimo.hokkaido.jp": 1,
        "erotica.hu": 1,
        "erotika.hu": 1,
        "es.kr": 1,
        "esan.hokkaido.jp": 1,
        "esashi.hokkaido.jp": 1,
        "esp.br": 1,
        "essex.museum": 1,
        "est-a-la-maison.com": 1,
        "est-a-la-masion.com": 1,
        "est-le-patron.com": 1,
        "est-mon-blogueur.com": 1,
        "est.pr": 1,
        "estate.museum": 1,
        "etajima.hiroshima.jp": 1,
        "etc.br": 1,
        "ethnology.museum": 1,
        "eti.br": 1,
        "etne.no": 1,
        "etnedal.no": 1,
        "eu-west-1.compute.amazonaws.com": 1,
        "eu.com": 1,
        "eu.int": 1,
        "eun.eg": 1,
        "evenassi.no": 1,
        "evenes.no": 1,
        "evje-og-hornnes.no": 1,
        "exchange.aero": 1,
        "exeter.museum": 1,
        "exhibition.museum": 1,
        "experts-comptables.fr": 1,
        "express.aero": 1,
        "f.bg": 1,
        "f.se": 1,
        "fam.pk": 1,
        "family.museum": 1,
        "far.br": 1,
        "fareast.ru": 1,
        "farm.museum": 1,
        "farmequipment.museum": 1,
        "farmers.museum": 1,
        "farmstead.museum": 1,
        "farsund.no": 1,
        "fauske.no": 1,
        "fc.it": 1,
        "fe.it": 1,
        "fed.us": 1,
        "federation.aero": 1,
        "fedje.no": 1,
        "fermo.it": 1,
        "ferrara.it": 1,
        "fet.no": 1,
        "fetsund.no": 1,
        "fg.it": 1,
        "fh.se": 1,
        "fhs.no": 1,
        "fhsk.se": 1,
        "fhv.se": 1,
        "fi.cr": 1,
        "fi.it": 1,
        "fie.ee": 1,
        "field.museum": 1,
        "figueres.museum": 1,
        "filatelia.museum": 1,
        "film.hu": 1,
        "film.museum": 1,
        "fin.ec": 1,
        "fin.tn": 1,
        "fineart.museum": 1,
        "finearts.museum": 1,
        "finland.museum": 1,
        "finnoy.no": 1,
        "firebaseapp.com": 1,
        "firenze.it": 1,
        "firm.co": 1,
        "firm.ht": 1,
        "firm.in": 1,
        "firm.nf": 1,
        "firm.ro": 1,
        "firm.ve": 1,
        "fitjar.no": 1,
        "fj.cn": 1,
        "fjaler.no": 1,
        "fjell.no": 1,
        "fl.us": 1,
        "fla.no": 1,
        "flakstad.no": 1,
        "flanders.museum": 1,
        "flatanger.no": 1,
        "flekkefjord.no": 1,
        "flesberg.no": 1,
        "flight.aero": 1,
        "flog.br": 1,
        "flora.no": 1,
        "florence.it": 1,
        "florida.museum": 1,
        "floro.no": 1,
        "flynnhub.com": 1,
        "fm.br": 1,
        "fm.it": 1,
        "fm.no": 1,
        "fnd.br": 1,
        "foggia.it": 1,
        "folkebibl.no": 1,
        "folldal.no": 1,
        "for-better.biz": 1,
        "for-more.biz": 1,
        "for-our.info": 1,
        "for-some.biz": 1,
        "for-the.biz": 1,
        "force.museum": 1,
        "forde.no": 1,
        "forgot.her.name": 1,
        "forgot.his.name": 1,
        "forli-cesena.it": 1,
        "forlicesena.it": 1,
        "forsand.no": 1,
        "fortmissoula.museum": 1,
        "fortworth.museum": 1,
        "forum.hu": 1,
        "fosnes.no": 1,
        "fot.br": 1,
        "foundation.museum": 1,
        "fr.it": 1,
        "frana.no": 1,
        "francaise.museum": 1,
        "frankfurt.museum": 1,
        "franziskaner.museum": 1,
        "fredrikstad.no": 1,
        "freemasonry.museum": 1,
        "frei.no": 1,
        "freiburg.museum": 1,
        "freight.aero": 1,
        "fribourg.museum": 1,
        "friuli-v-giulia.it": 1,
        "friuli-ve-giulia.it": 1,
        "friuli-vegiulia.it": 1,
        "friuli-venezia-giulia.it": 1,
        "friuli-veneziagiulia.it": 1,
        "friuli-vgiulia.it": 1,
        "friuliv-giulia.it": 1,
        "friulive-giulia.it": 1,
        "friulivegiulia.it": 1,
        "friulivenezia-giulia.it": 1,
        "friuliveneziagiulia.it": 1,
        "friulivgiulia.it": 1,
        "frog.museum": 1,
        "frogn.no": 1,
        "froland.no": 1,
        "from-ak.com": 1,
        "from-al.com": 1,
        "from-ar.com": 1,
        "from-az.net": 1,
        "from-ca.com": 1,
        "from-co.net": 1,
        "from-ct.com": 1,
        "from-dc.com": 1,
        "from-de.com": 1,
        "from-fl.com": 1,
        "from-ga.com": 1,
        "from-hi.com": 1,
        "from-ia.com": 1,
        "from-id.com": 1,
        "from-il.com": 1,
        "from-in.com": 1,
        "from-ks.com": 1,
        "from-ky.com": 1,
        "from-la.net": 1,
        "from-ma.com": 1,
        "from-md.com": 1,
        "from-me.org": 1,
        "from-mi.com": 1,
        "from-mn.com": 1,
        "from-mo.com": 1,
        "from-ms.com": 1,
        "from-mt.com": 1,
        "from-nc.com": 1,
        "from-nd.com": 1,
        "from-ne.com": 1,
        "from-nh.com": 1,
        "from-nj.com": 1,
        "from-nm.com": 1,
        "from-nv.com": 1,
        "from-ny.net": 1,
        "from-oh.com": 1,
        "from-ok.com": 1,
        "from-or.com": 1,
        "from-pa.com": 1,
        "from-pr.com": 1,
        "from-ri.com": 1,
        "from-sc.com": 1,
        "from-sd.com": 1,
        "from-tn.com": 1,
        "from-tx.com": 1,
        "from-ut.com": 1,
        "from-va.com": 1,
        "from-vt.com": 1,
        "from-wa.com": 1,
        "from-wi.com": 1,
        "from-wv.com": 1,
        "from-wy.com": 1,
        "from.hr": 1,
        "frosinone.it": 1,
        "frosta.no": 1,
        "froya.no": 1,
        "fst.br": 1,
        "ftpaccess.cc": 1,
        "fuchu.hiroshima.jp": 1,
        "fuchu.tokyo.jp": 1,
        "fuchu.toyama.jp": 1,
        "fudai.iwate.jp": 1,
        "fuefuki.yamanashi.jp": 1,
        "fuel.aero": 1,
        "fuettertdasnetz.de": 1,
        "fuji.shizuoka.jp": 1,
        "fujieda.shizuoka.jp": 1,
        "fujiidera.osaka.jp": 1,
        "fujikawa.shizuoka.jp": 1,
        "fujikawa.yamanashi.jp": 1,
        "fujikawaguchiko.yamanashi.jp": 1,
        "fujimi.nagano.jp": 1,
        "fujimi.saitama.jp": 1,
        "fujimino.saitama.jp": 1,
        "fujinomiya.shizuoka.jp": 1,
        "fujioka.gunma.jp": 1,
        "fujisato.akita.jp": 1,
        "fujisawa.iwate.jp": 1,
        "fujisawa.kanagawa.jp": 1,
        "fujishiro.ibaraki.jp": 1,
        "fujiyoshida.yamanashi.jp": 1,
        "fukagawa.hokkaido.jp": 1,
        "fukaya.saitama.jp": 1,
        "fukuchi.fukuoka.jp": 1,
        "fukuchiyama.kyoto.jp": 1,
        "fukudomi.saga.jp": 1,
        "fukui.fukui.jp": 1,
        "fukui.jp": 1,
        "fukumitsu.toyama.jp": 1,
        "fukuoka.jp": 1,
        "fukuroi.shizuoka.jp": 1,
        "fukusaki.hyogo.jp": 1,
        "fukushima.fukushima.jp": 1,
        "fukushima.hokkaido.jp": 1,
        "fukushima.jp": 1,
        "fukuyama.hiroshima.jp": 1,
        "funabashi.chiba.jp": 1,
        "funagata.yamagata.jp": 1,
        "funahashi.toyama.jp": 1,
        "fundacio.museum": 1,
        "fuoisku.no": 1,
        "fuossko.no": 1,
        "furano.hokkaido.jp": 1,
        "furniture.museum": 1,
        "furubira.hokkaido.jp": 1,
        "furudono.fukushima.jp": 1,
        "furukawa.miyagi.jp": 1,
        "fusa.no": 1,
        "fuso.aichi.jp": 1,
        "fussa.tokyo.jp": 1,
        "futaba.fukushima.jp": 1,
        "futsu.nagasaki.jp": 1,
        "futtsu.chiba.jp": 1,
        "fvg.it": 1,
        "fylkesbibl.no": 1,
        "fyresdal.no": 1,
        "g.bg": 1,
        "g.se": 1,
        "g12.br": 1,
        "ga.us": 1,
        "gaivuotna.no": 1,
        "gallery.museum": 1,
        "galsa.no": 1,
        "gamagori.aichi.jp": 1,
        "game-host.org": 1,
        "game-server.cc": 1,
        "game.tw": 1,
        "games.hu": 1,
        "gamo.shiga.jp": 1,
        "gamvik.no": 1,
        "gangaviika.no": 1,
        "gangwon.kr": 1,
        "garden.museum": 1,
        "gateway.museum": 1,
        "gaular.no": 1,
        "gausdal.no": 1,
        "gb.com": 1,
        "gb.net": 1,
        "gc.ca": 1,
        "gd.cn": 1,
        "gda.pl": 1,
        "gdansk.pl": 1,
        "gdynia.pl": 1,
        "ge.it": 1,
        "geek.nz": 1,
        "geelvinck.museum": 1,
        "geisei.kochi.jp": 1,
        "gemological.museum": 1,
        "gen.in": 1,
        "gen.nz": 1,
        "gen.tr": 1,
        "genkai.saga.jp": 1,
        "genoa.it": 1,
        "genova.it": 1,
        "geology.museum": 1,
        "geometre-expert.fr": 1,
        "georgia.museum": 1,
        "getmyip.com": 1,
        "gets-it.net": 1,
        "ggf.br": 1,
        "giehtavuoatna.no": 1,
        "giessen.museum": 1,
        "gifu.gifu.jp": 1,
        "gifu.jp": 1,
        "gildeskal.no": 1,
        "ginan.gifu.jp": 1,
        "ginowan.okinawa.jp": 1,
        "ginoza.okinawa.jp": 1,
        "giske.no": 1,
        "github.io": 1,
        "githubusercontent.com": 1,
        "gjemnes.no": 1,
        "gjerdrum.no": 1,
        "gjerstad.no": 1,
        "gjesdal.no": 1,
        "gjovik.no": 1,
        "glas.museum": 1,
        "glass.museum": 1,
        "gliding.aero": 1,
        "gliwice.pl": 1,
        "global.prod.fastly.net": 1,
        "global.ssl.fastly.net": 1,
        "glogow.pl": 1,
        "gloppen.no": 1,
        "gmina.pl": 1,
        "gniezno.pl": 1,
        "go.ci": 1,
        "go.cr": 1,
        "go.dyndns.org": 1,
        "go.id": 1,
        "go.it": 1,
        "go.jp": 1,
        "go.kr": 1,
        "go.pw": 1,
        "go.th": 1,
        "go.tj": 1,
        "go.tz": 1,
        "go.ug": 1,
        "gob.ar": 1,
        "gob.bo": 1,
        "gob.cl": 1,
        "gob.do": 1,
        "gob.ec": 1,
        "gob.es": 1,
        "gob.gt": 1,
        "gob.hn": 1,
        "gob.mx": 1,
        "gob.pa": 1,
        "gob.pe": 1,
        "gob.pk": 1,
        "gob.sv": 1,
        "gob.ve": 1,
        "gobo.wakayama.jp": 1,
        "godo.gifu.jp": 1,
        "gojome.akita.jp": 1,
        "gok.pk": 1,
        "gokase.miyazaki.jp": 1,
        "gol.no": 1,
        "gon.pk": 1,
        "gonohe.aomori.jp": 1,
        "googleapis.com": 1,
        "googlecode.com": 1,
        "gop.pk": 1,
        "gorge.museum": 1,
        "gorizia.it": 1,
        "gorlice.pl": 1,
        "gos.pk": 1,
        "gose.nara.jp": 1,
        "gosen.niigata.jp": 1,
        "goshiki.hyogo.jp": 1,
        "gotdns.com": 1,
        "gotdns.org": 1,
        "gotemba.shizuoka.jp": 1,
        "goto.nagasaki.jp": 1,
        "gotsu.shimane.jp": 1,
        "gouv.bj": 1,
        "gouv.ci": 1,
        "gouv.fr": 1,
        "gouv.ht": 1,
        "gouv.km": 1,
        "gouv.ml": 1,
        "gouv.rw": 1,
        "gouv.sn": 1,
        "gov.ac": 1,
        "gov.ae": 1,
        "gov.af": 1,
        "gov.al": 1,
        "gov.ar": 1,
        "gov.as": 1,
        "gov.au": 1,
        "gov.az": 1,
        "gov.ba": 1,
        "gov.bb": 1,
        "gov.bf": 1,
        "gov.bh": 1,
        "gov.bm": 1,
        "gov.bo": 1,
        "gov.br": 1,
        "gov.bs": 1,
        "gov.bt": 1,
        "gov.by": 1,
        "gov.bz": 1,
        "gov.cd": 1,
        "gov.cl": 1,
        "gov.cm": 1,
        "gov.cn": 1,
        "gov.co": 1,
        "gov.cu": 1,
        "gov.cx": 1,
        "gov.dm": 1,
        "gov.do": 1,
        "gov.dz": 1,
        "gov.ec": 1,
        "gov.ee": 1,
        "gov.eg": 1,
        "gov.et": 1,
        "gov.ge": 1,
        "gov.gh": 1,
        "gov.gi": 1,
        "gov.gn": 1,
        "gov.gr": 1,
        "gov.hk": 1,
        "gov.ie": 1,
        "gov.in": 1,
        "gov.iq": 1,
        "gov.ir": 1,
        "gov.is": 1,
        "gov.it": 1,
        "gov.jo": 1,
        "gov.kg": 1,
        "gov.ki": 1,
        "gov.km": 1,
        "gov.kn": 1,
        "gov.kp": 1,
        "gov.ky": 1,
        "gov.kz": 1,
        "gov.la": 1,
        "gov.lb": 1,
        "gov.lc": 1,
        "gov.lk": 1,
        "gov.lr": 1,
        "gov.lt": 1,
        "gov.lv": 1,
        "gov.ly": 1,
        "gov.ma": 1,
        "gov.me": 1,
        "gov.mg": 1,
        "gov.mk": 1,
        "gov.ml": 1,
        "gov.mn": 1,
        "gov.mo": 1,
        "gov.mr": 1,
        "gov.ms": 1,
        "gov.mu": 1,
        "gov.mv": 1,
        "gov.mw": 1,
        "gov.my": 1,
        "gov.nc.tr": 1,
        "gov.ng": 1,
        "gov.nr": 1,
        "gov.om": 1,
        "gov.ph": 1,
        "gov.pk": 1,
        "gov.pl": 1,
        "gov.pn": 1,
        "gov.pr": 1,
        "gov.ps": 1,
        "gov.pt": 1,
        "gov.py": 1,
        "gov.qa": 1,
        "gov.rs": 1,
        "gov.ru": 1,
        "gov.rw": 1,
        "gov.sa": 1,
        "gov.sb": 1,
        "gov.sc": 1,
        "gov.sd": 1,
        "gov.sg": 1,
        "gov.sh": 1,
        "gov.sl": 1,
        "gov.st": 1,
        "gov.sx": 1,
        "gov.sy": 1,
        "gov.tj": 1,
        "gov.tl": 1,
        "gov.tm": 1,
        "gov.tn": 1,
        "gov.to": 1,
        "gov.tr": 1,
        "gov.tt": 1,
        "gov.tw": 1,
        "gov.ua": 1,
        "gov.uk": 1,
        "gov.vc": 1,
        "gov.ve": 1,
        "gov.vn": 1,
        "gov.ws": 1,
        "government.aero": 1,
        "govt.nz": 1,
        "gr.com": 1,
        "gr.it": 1,
        "gr.jp": 1,
        "grajewo.pl": 1,
        "gran.no": 1,
        "grandrapids.museum": 1,
        "grane.no": 1,
        "granvin.no": 1,
        "gratangen.no": 1,
        "graz.museum": 1,
        "greta.fr": 1,
        "grimstad.no": 1,
        "groks-the.info": 1,
        "groks-this.info": 1,
        "grong.no": 1,
        "grosseto.it": 1,
        "groundhandling.aero": 1,
        "group.aero": 1,
        "grozny.ru": 1,
        "grp.lk": 1,
        "grue.no": 1,
        "gs.aa.no": 1,
        "gs.ah.no": 1,
        "gs.bu.no": 1,
        "gs.cn": 1,
        "gs.fm.no": 1,
        "gs.hl.no": 1,
        "gs.hm.no": 1,
        "gs.jan-mayen.no": 1,
        "gs.mr.no": 1,
        "gs.nl.no": 1,
        "gs.nt.no": 1,
        "gs.of.no": 1,
        "gs.ol.no": 1,
        "gs.oslo.no": 1,
        "gs.rl.no": 1,
        "gs.sf.no": 1,
        "gs.st.no": 1,
        "gs.svalbard.no": 1,
        "gs.tm.no": 1,
        "gs.tr.no": 1,
        "gs.va.no": 1,
        "gs.vf.no": 1,
        "gsm.pl": 1,
        "gu.us": 1,
        "gub.uy": 1,
        "guernsey.museum": 1,
        "gujo.gifu.jp": 1,
        "gulen.no": 1,
        "gunma.jp": 1,
        "guovdageaidnu.no": 1,
        "gushikami.okinawa.jp": 1,
        "gv.ao": 1,
        "gv.at": 1,
        "gwangju.kr": 1,
        "gx.cn": 1,
        "gyeongbuk.kr": 1,
        "gyeonggi.kr": 1,
        "gyeongnam.kr": 1,
        "gyokuto.kumamoto.jp": 1,
        "gz.cn": 1,
        "h.bg": 1,
        "h.se": 1,
        "ha.cn": 1,
        "ha.no": 1,
        "habikino.osaka.jp": 1,
        "habmer.no": 1,
        "haboro.hokkaido.jp": 1,
        "hachijo.tokyo.jp": 1,
        "hachinohe.aomori.jp": 1,
        "hachioji.tokyo.jp": 1,
        "hachirogata.akita.jp": 1,
        "hadano.kanagawa.jp": 1,
        "hadsel.no": 1,
        "haebaru.okinawa.jp": 1,
        "haga.tochigi.jp": 1,
        "hagebostad.no": 1,
        "hagi.yamaguchi.jp": 1,
        "haibara.shizuoka.jp": 1,
        "hakata.fukuoka.jp": 1,
        "hakodate.hokkaido.jp": 1,
        "hakone.kanagawa.jp": 1,
        "hakuba.nagano.jp": 1,
        "hakui.ishikawa.jp": 1,
        "hakusan.ishikawa.jp": 1,
        "halden.no": 1,
        "halloffame.museum": 1,
        "halsa.no": 1,
        "ham-radio-op.net": 1,
        "hamada.shimane.jp": 1,
        "hamamatsu.shizuoka.jp": 1,
        "hamar.no": 1,
        "hamaroy.no": 1,
        "hamatama.saga.jp": 1,
        "hamatonbetsu.hokkaido.jp": 1,
        "hamburg.museum": 1,
        "hammarfeasta.no": 1,
        "hammerfest.no": 1,
        "hamura.tokyo.jp": 1,
        "hanamaki.iwate.jp": 1,
        "hanamigawa.chiba.jp": 1,
        "hanawa.fukushima.jp": 1,
        "handa.aichi.jp": 1,
        "handson.museum": 1,
        "hanggliding.aero": 1,
        "hannan.osaka.jp": 1,
        "hanno.saitama.jp": 1,
        "hanyu.saitama.jp": 1,
        "hapmir.no": 1,
        "happou.akita.jp": 1,
        "hara.nagano.jp": 1,
        "haram.no": 1,
        "hareid.no": 1,
        "harima.hyogo.jp": 1,
        "harstad.no": 1,
        "harvestcelebration.museum": 1,
        "hasama.oita.jp": 1,
        "hasami.nagasaki.jp": 1,
        "hashikami.aomori.jp": 1,
        "hashima.gifu.jp": 1,
        "hashimoto.wakayama.jp": 1,
        "hasuda.saitama.jp": 1,
        "hasvik.no": 1,
        "hatogaya.saitama.jp": 1,
        "hatoyama.saitama.jp": 1,
        "hatsukaichi.hiroshima.jp": 1,
        "hattfjelldal.no": 1,
        "haugesund.no": 1,
        "hawaii.museum": 1,
        "hayakawa.yamanashi.jp": 1,
        "hayashima.okayama.jp": 1,
        "hazu.aichi.jp": 1,
        "hb.cn": 1,
        "he.cn": 1,
        "health.museum": 1,
        "health.nz": 1,
        "health.vn": 1,
        "heguri.nara.jp": 1,
        "heimatunduhren.museum": 1,
        "hekinan.aichi.jp": 1,
        "hellas.museum": 1,
        "helsinki.museum": 1,
        "hembygdsforbund.museum": 1,
        "hemne.no": 1,
        "hemnes.no": 1,
        "hemsedal.no": 1,
        "herad.no": 1,
        "here-for-more.info": 1,
        "heritage.museum": 1,
        "herokuapp.com": 1,
        "herokussl.com": 1,
        "heroy.more-og-romsdal.no": 1,
        "heroy.nordland.no": 1,
        "hi.cn": 1,
        "hi.us": 1,
        "hichiso.gifu.jp": 1,
        "hida.gifu.jp": 1,
        "hidaka.hokkaido.jp": 1,
        "hidaka.kochi.jp": 1,
        "hidaka.saitama.jp": 1,
        "hidaka.wakayama.jp": 1,
        "higashi.fukuoka.jp": 1,
        "higashi.fukushima.jp": 1,
        "higashi.okinawa.jp": 1,
        "higashiagatsuma.gunma.jp": 1,
        "higashichichibu.saitama.jp": 1,
        "higashihiroshima.hiroshima.jp": 1,
        "higashiizu.shizuoka.jp": 1,
        "higashiizumo.shimane.jp": 1,
        "higashikagawa.kagawa.jp": 1,
        "higashikagura.hokkaido.jp": 1,
        "higashikawa.hokkaido.jp": 1,
        "higashikurume.tokyo.jp": 1,
        "higashimatsushima.miyagi.jp": 1,
        "higashimatsuyama.saitama.jp": 1,
        "higashimurayama.tokyo.jp": 1,
        "higashinaruse.akita.jp": 1,
        "higashine.yamagata.jp": 1,
        "higashiomi.shiga.jp": 1,
        "higashiosaka.osaka.jp": 1,
        "higashishirakawa.gifu.jp": 1,
        "higashisumiyoshi.osaka.jp": 1,
        "higashitsuno.kochi.jp": 1,
        "higashiura.aichi.jp": 1,
        "higashiyama.kyoto.jp": 1,
        "higashiyamato.tokyo.jp": 1,
        "higashiyodogawa.osaka.jp": 1,
        "higashiyoshino.nara.jp": 1,
        "hiji.oita.jp": 1,
        "hikari.yamaguchi.jp": 1,
        "hikawa.shimane.jp": 1,
        "hikimi.shimane.jp": 1,
        "hikone.shiga.jp": 1,
        "himeji.hyogo.jp": 1,
        "himeshima.oita.jp": 1,
        "himi.toyama.jp": 1,
        "hino.tokyo.jp": 1,
        "hino.tottori.jp": 1,
        "hinode.tokyo.jp": 1,
        "hinohara.tokyo.jp": 1,
        "hioki.kagoshima.jp": 1,
        "hirado.nagasaki.jp": 1,
        "hiraizumi.iwate.jp": 1,
        "hirakata.osaka.jp": 1,
        "hiranai.aomori.jp": 1,
        "hirara.okinawa.jp": 1,
        "hirata.fukushima.jp": 1,
        "hiratsuka.kanagawa.jp": 1,
        "hiraya.nagano.jp": 1,
        "hirogawa.wakayama.jp": 1,
        "hirokawa.fukuoka.jp": 1,
        "hirono.fukushima.jp": 1,
        "hirono.iwate.jp": 1,
        "hiroo.hokkaido.jp": 1,
        "hirosaki.aomori.jp": 1,
        "hiroshima.jp": 1,
        "hisayama.fukuoka.jp": 1,
        "histoire.museum": 1,
        "historical.museum": 1,
        "historicalsociety.museum": 1,
        "historichouses.museum": 1,
        "historisch.museum": 1,
        "historisches.museum": 1,
        "history.museum": 1,
        "historyofscience.museum": 1,
        "hita.oita.jp": 1,
        "hitachi.ibaraki.jp": 1,
        "hitachinaka.ibaraki.jp": 1,
        "hitachiomiya.ibaraki.jp": 1,
        "hitachiota.ibaraki.jp": 1,
        "hitoyoshi.kumamoto.jp": 1,
        "hitra.no": 1,
        "hizen.saga.jp": 1,
        "hjartdal.no": 1,
        "hjelmeland.no": 1,
        "hk.cn": 1,
        "hl.cn": 1,
        "hl.no": 1,
        "hm.no": 1,
        "hn.cn": 1,
        "hobby-site.com": 1,
        "hobby-site.org": 1,
        "hobol.no": 1,
        "hof.no": 1,
        "hofu.yamaguchi.jp": 1,
        "hokkaido.jp": 1,
        "hokksund.no": 1,
        "hokuryu.hokkaido.jp": 1,
        "hokuto.hokkaido.jp": 1,
        "hokuto.yamanashi.jp": 1,
        "hol.no": 1,
        "hole.no": 1,
        "holmestrand.no": 1,
        "holtalen.no": 1,
        "home.dyndns.org": 1,
        "homebuilt.aero": 1,
        "homedns.org": 1,
        "homeftp.net": 1,
        "homeftp.org": 1,
        "homeip.net": 1,
        "homelinux.com": 1,
        "homelinux.net": 1,
        "homelinux.org": 1,
        "homeunix.com": 1,
        "homeunix.net": 1,
        "homeunix.org": 1,
        "honai.ehime.jp": 1,
        "honbetsu.hokkaido.jp": 1,
        "honefoss.no": 1,
        "hongo.hiroshima.jp": 1,
        "honjo.akita.jp": 1,
        "honjo.saitama.jp": 1,
        "honjyo.akita.jp": 1,
        "hornindal.no": 1,
        "horokanai.hokkaido.jp": 1,
        "horology.museum": 1,
        "horonobe.hokkaido.jp": 1,
        "horten.no": 1,
        "hotel.hu": 1,
        "hotel.lk": 1,
        "hotel.tz": 1,
        "house.museum": 1,
        "hoyanger.no": 1,
        "hoylandet.no": 1,
        "hs.kr": 1,
        "hu.com": 1,
        "hu.net": 1,
        "huissier-justice.fr": 1,
        "humanities.museum": 1,
        "hurdal.no": 1,
        "hurum.no": 1,
        "hvaler.no": 1,
        "hyllestad.no": 1,
        "hyogo.jp": 1,
        "hyuga.miyazaki.jp": 1,
        "i.bg": 1,
        "i.ph": 1,
        "i.se": 1,
        "ia.us": 1,
        "iamallama.com": 1,
        "ibara.okayama.jp": 1,
        "ibaraki.ibaraki.jp": 1,
        "ibaraki.jp": 1,
        "ibaraki.osaka.jp": 1,
        "ibestad.no": 1,
        "ibigawa.gifu.jp": 1,
        "ichiba.tokushima.jp": 1,
        "ichihara.chiba.jp": 1,
        "ichikai.tochigi.jp": 1,
        "ichikawa.chiba.jp": 1,
        "ichikawa.hyogo.jp": 1,
        "ichikawamisato.yamanashi.jp": 1,
        "ichinohe.iwate.jp": 1,
        "ichinomiya.aichi.jp": 1,
        "ichinomiya.chiba.jp": 1,
        "ichinoseki.iwate.jp": 1,
        "id.au": 1,
        "id.ir": 1,
        "id.lv": 1,
        "id.ly": 1,
        "id.us": 1,
        "ide.kyoto.jp": 1,
        "idrett.no": 1,
        "idv.hk": 1,
        "idv.tw": 1,
        "if.ua": 1,
        "iglesias-carbonia.it": 1,
        "iglesiascarbonia.it": 1,
        "iheya.okinawa.jp": 1,
        "iida.nagano.jp": 1,
        "iide.yamagata.jp": 1,
        "iijima.nagano.jp": 1,
        "iitate.fukushima.jp": 1,
        "iiyama.nagano.jp": 1,
        "iizuka.fukuoka.jp": 1,
        "iizuna.nagano.jp": 1,
        "ikaruga.nara.jp": 1,
        "ikata.ehime.jp": 1,
        "ikawa.akita.jp": 1,
        "ikeda.fukui.jp": 1,
        "ikeda.gifu.jp": 1,
        "ikeda.hokkaido.jp": 1,
        "ikeda.nagano.jp": 1,
        "ikeda.osaka.jp": 1,
        "iki.fi": 1,
        "iki.nagasaki.jp": 1,
        "ikoma.nara.jp": 1,
        "ikusaka.nagano.jp": 1,
        "il.us": 1,
        "ilawa.pl": 1,
        "illustration.museum": 1,
        "im.it": 1,
        "imabari.ehime.jp": 1,
        "imageandsound.museum": 1,
        "imakane.hokkaido.jp": 1,
        "imari.saga.jp": 1,
        "imb.br": 1,
        "imizu.toyama.jp": 1,
        "imperia.it": 1,
        "in-addr.arpa": 1,
        "in-the-band.net": 1,
        "in.na": 1,
        "in.net": 1,
        "in.rs": 1,
        "in.th": 1,
        "in.ua": 1,
        "in.us": 1,
        "ina.ibaraki.jp": 1,
        "ina.nagano.jp": 1,
        "ina.saitama.jp": 1,
        "inabe.mie.jp": 1,
        "inagawa.hyogo.jp": 1,
        "inagi.tokyo.jp": 1,
        "inami.toyama.jp": 1,
        "inami.wakayama.jp": 1,
        "inashiki.ibaraki.jp": 1,
        "inatsuki.fukuoka.jp": 1,
        "inawashiro.fukushima.jp": 1,
        "inazawa.aichi.jp": 1,
        "incheon.kr": 1,
        "ind.br": 1,
        "ind.gt": 1,
        "ind.in": 1,
        "ind.tn": 1,
        "inderoy.no": 1,
        "indian.museum": 1,
        "indiana.museum": 1,
        "indianapolis.museum": 1,
        "indianmarket.museum": 1,
        "ine.kyoto.jp": 1,
        "inf.br": 1,
        "inf.cu": 1,
        "inf.mk": 1,
        "info.at": 1,
        "info.au": 1,
        "info.az": 1,
        "info.bb": 1,
        "info.co": 1,
        "info.ec": 1,
        "info.et": 1,
        "info.ht": 1,
        "info.hu": 1,
        "info.ki": 1,
        "info.la": 1,
        "info.mv": 1,
        "info.na": 1,
        "info.nf": 1,
        "info.nr": 1,
        "info.pk": 1,
        "info.pl": 1,
        "info.pr": 1,
        "info.ro": 1,
        "info.sd": 1,
        "info.tn": 1,
        "info.tr": 1,
        "info.tt": 1,
        "info.tz": 1,
        "info.ve": 1,
        "info.vn": 1,
        "ing.pa": 1,
        "ingatlan.hu": 1,
        "ino.kochi.jp": 1,
        "insurance.aero": 1,
        "int.ar": 1,
        "int.az": 1,
        "int.bo": 1,
        "int.ci": 1,
        "int.co": 1,
        "int.is": 1,
        "int.la": 1,
        "int.lk": 1,
        "int.mv": 1,
        "int.mw": 1,
        "int.pt": 1,
        "int.ru": 1,
        "int.rw": 1,
        "int.tj": 1,
        "int.tt": 1,
        "int.ve": 1,
        "int.vn": 1,
        "intelligence.museum": 1,
        "interactive.museum": 1,
        "intl.tn": 1,
        "inuyama.aichi.jp": 1,
        "inzai.chiba.jp": 1,
        "ip6.arpa": 1,
        "iraq.museum": 1,
        "iris.arpa": 1,
        "irkutsk.ru": 1,
        "iron.museum": 1,
        "iruma.saitama.jp": 1,
        "is-a-anarchist.com": 1,
        "is-a-blogger.com": 1,
        "is-a-bookkeeper.com": 1,
        "is-a-bruinsfan.org": 1,
        "is-a-bulls-fan.com": 1,
        "is-a-candidate.org": 1,
        "is-a-caterer.com": 1,
        "is-a-celticsfan.org": 1,
        "is-a-chef.com": 1,
        "is-a-chef.net": 1,
        "is-a-chef.org": 1,
        "is-a-conservative.com": 1,
        "is-a-cpa.com": 1,
        "is-a-cubicle-slave.com": 1,
        "is-a-democrat.com": 1,
        "is-a-designer.com": 1,
        "is-a-doctor.com": 1,
        "is-a-financialadvisor.com": 1,
        "is-a-geek.com": 1,
        "is-a-geek.net": 1,
        "is-a-geek.org": 1,
        "is-a-green.com": 1,
        "is-a-guru.com": 1,
        "is-a-hard-worker.com": 1,
        "is-a-hunter.com": 1,
        "is-a-knight.org": 1,
        "is-a-landscaper.com": 1,
        "is-a-lawyer.com": 1,
        "is-a-liberal.com": 1,
        "is-a-libertarian.com": 1,
        "is-a-linux-user.org": 1,
        "is-a-llama.com": 1,
        "is-a-musician.com": 1,
        "is-a-nascarfan.com": 1,
        "is-a-nurse.com": 1,
        "is-a-painter.com": 1,
        "is-a-patsfan.org": 1,
        "is-a-personaltrainer.com": 1,
        "is-a-photographer.com": 1,
        "is-a-player.com": 1,
        "is-a-republican.com": 1,
        "is-a-rockstar.com": 1,
        "is-a-socialist.com": 1,
        "is-a-soxfan.org": 1,
        "is-a-student.com": 1,
        "is-a-teacher.com": 1,
        "is-a-techie.com": 1,
        "is-a-therapist.com": 1,
        "is-an-accountant.com": 1,
        "is-an-actor.com": 1,
        "is-an-actress.com": 1,
        "is-an-anarchist.com": 1,
        "is-an-artist.com": 1,
        "is-an-engineer.com": 1,
        "is-an-entertainer.com": 1,
        "is-by.us": 1,
        "is-certified.com": 1,
        "is-found.org": 1,
        "is-gone.com": 1,
        "is-into-anime.com": 1,
        "is-into-cars.com": 1,
        "is-into-cartoons.com": 1,
        "is-into-games.com": 1,
        "is-leet.com": 1,
        "is-lost.org": 1,
        "is-not-certified.com": 1,
        "is-saved.org": 1,
        "is-slick.com": 1,
        "is-uberleet.com": 1,
        "is-very-bad.org": 1,
        "is-very-evil.org": 1,
        "is-very-good.org": 1,
        "is-very-nice.org": 1,
        "is-very-sweet.org": 1,
        "is-with-theband.com": 1,
        "is.it": 1,
        "isa-geek.com": 1,
        "isa-geek.net": 1,
        "isa-geek.org": 1,
        "isa-hockeynut.com": 1,
        "isa.kagoshima.jp": 1,
        "isa.us": 1,
        "isahaya.nagasaki.jp": 1,
        "ise.mie.jp": 1,
        "isehara.kanagawa.jp": 1,
        "isen.kagoshima.jp": 1,
        "isernia.it": 1,
        "isesaki.gunma.jp": 1,
        "ishigaki.okinawa.jp": 1,
        "ishikari.hokkaido.jp": 1,
        "ishikawa.fukushima.jp": 1,
        "ishikawa.jp": 1,
        "ishikawa.okinawa.jp": 1,
        "ishinomaki.miyagi.jp": 1,
        "isla.pr": 1,
        "isleofman.museum": 1,
        "isshiki.aichi.jp": 1,
        "issmarterthanyou.com": 1,
        "isteingeek.de": 1,
        "istmein.de": 1,
        "isumi.chiba.jp": 1,
        "it.ao": 1,
        "itabashi.tokyo.jp": 1,
        "itako.ibaraki.jp": 1,
        "itakura.gunma.jp": 1,
        "itami.hyogo.jp": 1,
        "itano.tokushima.jp": 1,
        "itayanagi.aomori.jp": 1,
        "ito.shizuoka.jp": 1,
        "itoigawa.niigata.jp": 1,
        "itoman.okinawa.jp": 1,
        "its.me": 1,
        "ivano-frankivsk.ua": 1,
        "ivanovo.ru": 1,
        "iveland.no": 1,
        "ivgu.no": 1,
        "iwade.wakayama.jp": 1,
        "iwafune.tochigi.jp": 1,
        "iwaizumi.iwate.jp": 1,
        "iwaki.fukushima.jp": 1,
        "iwakuni.yamaguchi.jp": 1,
        "iwakura.aichi.jp": 1,
        "iwama.ibaraki.jp": 1,
        "iwamizawa.hokkaido.jp": 1,
        "iwanai.hokkaido.jp": 1,
        "iwanuma.miyagi.jp": 1,
        "iwata.shizuoka.jp": 1,
        "iwate.iwate.jp": 1,
        "iwate.jp": 1,
        "iwatsuki.saitama.jp": 1,
        "iwi.nz": 1,
        "iyo.ehime.jp": 1,
        "iz.hr": 1,
        "izena.okinawa.jp": 1,
        "izhevsk.ru": 1,
        "izu.shizuoka.jp": 1,
        "izumi.kagoshima.jp": 1,
        "izumi.osaka.jp": 1,
        "izumiotsu.osaka.jp": 1,
        "izumisano.osaka.jp": 1,
        "izumizaki.fukushima.jp": 1,
        "izumo.shimane.jp": 1,
        "izumozaki.niigata.jp": 1,
        "izunokuni.shizuoka.jp": 1,
        "j.bg": 1,
        "jamal.ru": 1,
        "jamison.museum": 1,
        "jan-mayen.no": 1,
        "jar.ru": 1,
        "jaworzno.pl": 1,
        "jefferson.museum": 1,
        "jeju.kr": 1,
        "jelenia-gora.pl": 1,
        "jeonbuk.kr": 1,
        "jeonnam.kr": 1,
        "jerusalem.museum": 1,
        "jessheim.no": 1,
        "jevnaker.no": 1,
        "jewelry.museum": 1,
        "jewish.museum": 1,
        "jewishart.museum": 1,
        "jfk.museum": 1,
        "jgora.pl": 1,
        "jinsekikogen.hiroshima.jp": 1,
        "jl.cn": 1,
        "joboji.iwate.jp": 1,
        "jobs.tt": 1,
        "joetsu.niigata.jp": 1,
        "jogasz.hu": 1,
        "johana.toyama.jp": 1,
        "jolster.no": 1,
        "jondal.no": 1,
        "jor.br": 1,
        "jorpeland.no": 1,
        "joshkar-ola.ru": 1,
        "joso.ibaraki.jp": 1,
        "journal.aero": 1,
        "journalism.museum": 1,
        "journalist.aero": 1,
        "joyo.kyoto.jp": 1,
        "jp.net": 1,
        "jpn.com": 1,
        "js.cn": 1,
        "judaica.museum": 1,
        "judygarland.museum": 1,
        "juedisches.museum": 1,
        "juif.museum": 1,
        "jur.pro": 1,
        "jus.br": 1,
        "jx.cn": 1,
        "k-uralsk.ru": 1,
        "k.bg": 1,
        "k.se": 1,
        "k12.ak.us": 1,
        "k12.al.us": 1,
        "k12.ar.us": 1,
        "k12.as.us": 1,
        "k12.az.us": 1,
        "k12.ca.us": 1,
        "k12.co.us": 1,
        "k12.ct.us": 1,
        "k12.dc.us": 1,
        "k12.de.us": 1,
        "k12.ec": 1,
        "k12.fl.us": 1,
        "k12.ga.us": 1,
        "k12.gu.us": 1,
        "k12.ia.us": 1,
        "k12.id.us": 1,
        "k12.il.us": 1,
        "k12.in.us": 1,
        "k12.ks.us": 1,
        "k12.ky.us": 1,
        "k12.la.us": 1,
        "k12.ma.us": 1,
        "k12.md.us": 1,
        "k12.me.us": 1,
        "k12.mi.us": 1,
        "k12.mn.us": 1,
        "k12.mo.us": 1,
        "k12.ms.us": 1,
        "k12.mt.us": 1,
        "k12.nc.us": 1,
        "k12.ne.us": 1,
        "k12.nh.us": 1,
        "k12.nj.us": 1,
        "k12.nm.us": 1,
        "k12.nv.us": 1,
        "k12.ny.us": 1,
        "k12.oh.us": 1,
        "k12.ok.us": 1,
        "k12.or.us": 1,
        "k12.pa.us": 1,
        "k12.pr.us": 1,
        "k12.ri.us": 1,
        "k12.sc.us": 1,
        "k12.tn.us": 1,
        "k12.tr": 1,
        "k12.tx.us": 1,
        "k12.ut.us": 1,
        "k12.va.us": 1,
        "k12.vi": 1,
        "k12.vi.us": 1,
        "k12.vt.us": 1,
        "k12.wa.us": 1,
        "k12.wi.us": 1,
        "k12.wy.us": 1,
        "kadena.okinawa.jp": 1,
        "kadogawa.miyazaki.jp": 1,
        "kadoma.osaka.jp": 1,
        "kafjord.no": 1,
        "kaga.ishikawa.jp": 1,
        "kagami.kochi.jp": 1,
        "kagamiishi.fukushima.jp": 1,
        "kagamino.okayama.jp": 1,
        "kagawa.jp": 1,
        "kagoshima.jp": 1,
        "kagoshima.kagoshima.jp": 1,
        "kaho.fukuoka.jp": 1,
        "kahoku.ishikawa.jp": 1,
        "kahoku.yamagata.jp": 1,
        "kai.yamanashi.jp": 1,
        "kainan.tokushima.jp": 1,
        "kainan.wakayama.jp": 1,
        "kaisei.kanagawa.jp": 1,
        "kaita.hiroshima.jp": 1,
        "kaizuka.osaka.jp": 1,
        "kakamigahara.gifu.jp": 1,
        "kakegawa.shizuoka.jp": 1,
        "kakinoki.shimane.jp": 1,
        "kakogawa.hyogo.jp": 1,
        "kakuda.miyagi.jp": 1,
        "kalisz.pl": 1,
        "kalmykia.ru": 1,
        "kaluga.ru": 1,
        "kamagaya.chiba.jp": 1,
        "kamaishi.iwate.jp": 1,
        "kamakura.kanagawa.jp": 1,
        "kamchatka.ru": 1,
        "kameoka.kyoto.jp": 1,
        "kameyama.mie.jp": 1,
        "kami.kochi.jp": 1,
        "kami.miyagi.jp": 1,
        "kamiamakusa.kumamoto.jp": 1,
        "kamifurano.hokkaido.jp": 1,
        "kamigori.hyogo.jp": 1,
        "kamiichi.toyama.jp": 1,
        "kamiizumi.saitama.jp": 1,
        "kamijima.ehime.jp": 1,
        "kamikawa.hokkaido.jp": 1,
        "kamikawa.hyogo.jp": 1,
        "kamikawa.saitama.jp": 1,
        "kamikitayama.nara.jp": 1,
        "kamikoani.akita.jp": 1,
        "kamimine.saga.jp": 1,
        "kaminokawa.tochigi.jp": 1,
        "kaminoyama.yamagata.jp": 1,
        "kamioka.akita.jp": 1,
        "kamisato.saitama.jp": 1,
        "kamishihoro.hokkaido.jp": 1,
        "kamisu.ibaraki.jp": 1,
        "kamisunagawa.hokkaido.jp": 1,
        "kamitonda.wakayama.jp": 1,
        "kamitsue.oita.jp": 1,
        "kamo.kyoto.jp": 1,
        "kamo.niigata.jp": 1,
        "kamoenai.hokkaido.jp": 1,
        "kamogawa.chiba.jp": 1,
        "kanagawa.jp": 1,
        "kanan.osaka.jp": 1,
        "kanazawa.ishikawa.jp": 1,
        "kanegasaki.iwate.jp": 1,
        "kaneyama.fukushima.jp": 1,
        "kaneyama.yamagata.jp": 1,
        "kani.gifu.jp": 1,
        "kanie.aichi.jp": 1,
        "kanmaki.nara.jp": 1,
        "kanna.gunma.jp": 1,
        "kannami.shizuoka.jp": 1,
        "kanonji.kagawa.jp": 1,
        "kanoya.kagoshima.jp": 1,
        "kanra.gunma.jp": 1,
        "kanuma.tochigi.jp": 1,
        "kanzaki.saga.jp": 1,
        "karasjohka.no": 1,
        "karasjok.no": 1,
        "karasuyama.tochigi.jp": 1,
        "karate.museum": 1,
        "karatsu.saga.jp": 1,
        "karelia.ru": 1,
        "karikatur.museum": 1,
        "kariwa.niigata.jp": 1,
        "kariya.aichi.jp": 1,
        "karlsoy.no": 1,
        "karmoy.no": 1,
        "karpacz.pl": 1,
        "kartuzy.pl": 1,
        "karuizawa.nagano.jp": 1,
        "karumai.iwate.jp": 1,
        "kasahara.gifu.jp": 1,
        "kasai.hyogo.jp": 1,
        "kasama.ibaraki.jp": 1,
        "kasamatsu.gifu.jp": 1,
        "kasaoka.okayama.jp": 1,
        "kashiba.nara.jp": 1,
        "kashihara.nara.jp": 1,
        "kashima.ibaraki.jp": 1,
        "kashima.kumamoto.jp": 1,
        "kashima.saga.jp": 1,
        "kashiwa.chiba.jp": 1,
        "kashiwara.osaka.jp": 1,
        "kashiwazaki.niigata.jp": 1,
        "kasuga.fukuoka.jp": 1,
        "kasuga.hyogo.jp": 1,
        "kasugai.aichi.jp": 1,
        "kasukabe.saitama.jp": 1,
        "kasumigaura.ibaraki.jp": 1,
        "kasuya.fukuoka.jp": 1,
        "kaszuby.pl": 1,
        "katagami.akita.jp": 1,
        "katano.osaka.jp": 1,
        "katashina.gunma.jp": 1,
        "katori.chiba.jp": 1,
        "katowice.pl": 1,
        "katsuragi.nara.jp": 1,
        "katsuragi.wakayama.jp": 1,
        "katsushika.tokyo.jp": 1,
        "katsuura.chiba.jp": 1,
        "katsuyama.fukui.jp": 1,
        "kautokeino.no": 1,
        "kawaba.gunma.jp": 1,
        "kawachinagano.osaka.jp": 1,
        "kawagoe.mie.jp": 1,
        "kawagoe.saitama.jp": 1,
        "kawaguchi.saitama.jp": 1,
        "kawahara.tottori.jp": 1,
        "kawai.iwate.jp": 1,
        "kawai.nara.jp": 1,
        "kawajima.saitama.jp": 1,
        "kawakami.nagano.jp": 1,
        "kawakami.nara.jp": 1,
        "kawakita.ishikawa.jp": 1,
        "kawamata.fukushima.jp": 1,
        "kawaminami.miyazaki.jp": 1,
        "kawanabe.kagoshima.jp": 1,
        "kawanehon.shizuoka.jp": 1,
        "kawanishi.hyogo.jp": 1,
        "kawanishi.nara.jp": 1,
        "kawanishi.yamagata.jp": 1,
        "kawara.fukuoka.jp": 1,
        "kawasaki.jp": 1,
        "kawasaki.miyagi.jp": 1,
        "kawatana.nagasaki.jp": 1,
        "kawaue.gifu.jp": 1,
        "kawazu.shizuoka.jp": 1,
        "kayabe.hokkaido.jp": 1,
        "kazan.ru": 1,
        "kazimierz-dolny.pl": 1,
        "kazo.saitama.jp": 1,
        "kazuno.akita.jp": 1,
        "kchr.ru": 1,
        "keisen.fukuoka.jp": 1,
        "kembuchi.hokkaido.jp": 1,
        "kemerovo.ru": 1,
        "kep.tr": 1,
        "kepno.pl": 1,
        "kesennuma.miyagi.jp": 1,
        "ketrzyn.pl": 1,
        "kg.kr": 1,
        "kh.ua": 1,
        "khabarovsk.ru": 1,
        "khakassia.ru": 1,
        "kharkiv.ua": 1,
        "kharkov.ua": 1,
        "kherson.ua": 1,
        "khmelnitskiy.ua": 1,
        "khmelnytskyi.ua": 1,
        "khv.ru": 1,
        "kibichuo.okayama.jp": 1,
        "kicks-ass.net": 1,
        "kicks-ass.org": 1,
        "kids.museum": 1,
        "kids.us": 1,
        "kiev.ua": 1,
        "kiho.mie.jp": 1,
        "kihoku.ehime.jp": 1,
        "kijo.miyazaki.jp": 1,
        "kikonai.hokkaido.jp": 1,
        "kikuchi.kumamoto.jp": 1,
        "kikugawa.shizuoka.jp": 1,
        "kimino.wakayama.jp": 1,
        "kimitsu.chiba.jp": 1,
        "kimobetsu.hokkaido.jp": 1,
        "kin.okinawa.jp": 1,
        "kinko.kagoshima.jp": 1,
        "kinokawa.wakayama.jp": 1,
        "kira.aichi.jp": 1,
        "kirkenes.no": 1,
        "kirov.ru": 1,
        "kirovograd.ua": 1,
        "kiryu.gunma.jp": 1,
        "kisarazu.chiba.jp": 1,
        "kishiwada.osaka.jp": 1,
        "kiso.nagano.jp": 1,
        "kisofukushima.nagano.jp": 1,
        "kisosaki.mie.jp": 1,
        "kita.kyoto.jp": 1,
        "kita.osaka.jp": 1,
        "kita.tokyo.jp": 1,
        "kitaaiki.nagano.jp": 1,
        "kitaakita.akita.jp": 1,
        "kitadaito.okinawa.jp": 1,
        "kitagata.gifu.jp": 1,
        "kitagata.saga.jp": 1,
        "kitagawa.kochi.jp": 1,
        "kitagawa.miyazaki.jp": 1,
        "kitahata.saga.jp": 1,
        "kitahiroshima.hokkaido.jp": 1,
        "kitakami.iwate.jp": 1,
        "kitakata.fukushima.jp": 1,
        "kitakata.miyazaki.jp": 1,
        "kitakyushu.jp": 1,
        "kitami.hokkaido.jp": 1,
        "kitamoto.saitama.jp": 1,
        "kitanakagusuku.okinawa.jp": 1,
        "kitashiobara.fukushima.jp": 1,
        "kitaura.miyazaki.jp": 1,
        "kitayama.wakayama.jp": 1,
        "kiwa.mie.jp": 1,
        "kiwi.nz": 1,
        "kiyama.saga.jp": 1,
        "kiyokawa.kanagawa.jp": 1,
        "kiyosato.hokkaido.jp": 1,
        "kiyose.tokyo.jp": 1,
        "kiyosu.aichi.jp": 1,
        "kizu.kyoto.jp": 1,
        "klabu.no": 1,
        "klepp.no": 1,
        "klodzko.pl": 1,
        "km.ua": 1,
        "kms.ru": 1,
        "knowsitall.info": 1,
        "kobayashi.miyazaki.jp": 1,
        "kobe.jp": 1,
        "kobierzyce.pl": 1,
        "kochi.jp": 1,
        "kochi.kochi.jp": 1,
        "kodaira.tokyo.jp": 1,
        "koebenhavn.museum": 1,
        "koeln.museum": 1,
        "koenig.ru": 1,
        "kofu.yamanashi.jp": 1,
        "koga.fukuoka.jp": 1,
        "koga.ibaraki.jp": 1,
        "koganei.tokyo.jp": 1,
        "koge.tottori.jp": 1,
        "koka.shiga.jp": 1,
        "kokonoe.oita.jp": 1,
        "kokubunji.tokyo.jp": 1,
        "kolobrzeg.pl": 1,
        "komae.tokyo.jp": 1,
        "komagane.nagano.jp": 1,
        "komaki.aichi.jp": 1,
        "komatsu.ishikawa.jp": 1,
        "komatsushima.tokushima.jp": 1,
        "komforb.se": 1,
        "komi.ru": 1,
        "kommunalforbund.se": 1,
        "kommune.no": 1,
        "komono.mie.jp": 1,
        "komoro.nagano.jp": 1,
        "komvux.se": 1,
        "konan.aichi.jp": 1,
        "konan.shiga.jp": 1,
        "kongsberg.no": 1,
        "kongsvinger.no": 1,
        "konin.pl": 1,
        "konskowola.pl": 1,
        "konyvelo.hu": 1,
        "koori.fukushima.jp": 1,
        "kopervik.no": 1,
        "koriyama.fukushima.jp": 1,
        "koryo.nara.jp": 1,
        "kosa.kumamoto.jp": 1,
        "kosai.shizuoka.jp": 1,
        "kosaka.akita.jp": 1,
        "kosei.shiga.jp": 1,
        "koshigaya.saitama.jp": 1,
        "koshimizu.hokkaido.jp": 1,
        "koshu.yamanashi.jp": 1,
        "kostroma.ru": 1,
        "kosuge.yamanashi.jp": 1,
        "kota.aichi.jp": 1,
        "koto.shiga.jp": 1,
        "koto.tokyo.jp": 1,
        "kotohira.kagawa.jp": 1,
        "kotoura.tottori.jp": 1,
        "kouhoku.saga.jp": 1,
        "kounosu.saitama.jp": 1,
        "kouyama.kagoshima.jp": 1,
        "kouzushima.tokyo.jp": 1,
        "koya.wakayama.jp": 1,
        "koza.wakayama.jp": 1,
        "kozagawa.wakayama.jp": 1,
        "kozaki.chiba.jp": 1,
        "kr.com": 1,
        "kr.it": 1,
        "kr.ua": 1,
        "kraanghke.no": 1,
        "kragero.no": 1,
        "krakow.pl": 1,
        "krasnoyarsk.ru": 1,
        "kristiansand.no": 1,
        "kristiansund.no": 1,
        "krodsherad.no": 1,
        "krokstadelva.no": 1,
        "krym.ua": 1,
        "ks.ua": 1,
        "ks.us": 1,
        "kuban.ru": 1,
        "kuchinotsu.nagasaki.jp": 1,
        "kudamatsu.yamaguchi.jp": 1,
        "kudoyama.wakayama.jp": 1,
        "kui.hiroshima.jp": 1,
        "kuji.iwate.jp": 1,
        "kuju.oita.jp": 1,
        "kujukuri.chiba.jp": 1,
        "kuki.saitama.jp": 1,
        "kumagaya.saitama.jp": 1,
        "kumakogen.ehime.jp": 1,
        "kumamoto.jp": 1,
        "kumamoto.kumamoto.jp": 1,
        "kumano.hiroshima.jp": 1,
        "kumano.mie.jp": 1,
        "kumatori.osaka.jp": 1,
        "kumejima.okinawa.jp": 1,
        "kumenan.okayama.jp": 1,
        "kumiyama.kyoto.jp": 1,
        "kunigami.okinawa.jp": 1,
        "kunimi.fukushima.jp": 1,
        "kunisaki.oita.jp": 1,
        "kunitachi.tokyo.jp": 1,
        "kunitomi.miyazaki.jp": 1,
        "kunneppu.hokkaido.jp": 1,
        "kunohe.iwate.jp": 1,
        "kunst.museum": 1,
        "kunstsammlung.museum": 1,
        "kunstunddesign.museum": 1,
        "kurashiki.okayama.jp": 1,
        "kurate.fukuoka.jp": 1,
        "kure.hiroshima.jp": 1,
        "kurgan.ru": 1,
        "kuriyama.hokkaido.jp": 1,
        "kurobe.toyama.jp": 1,
        "kurogi.fukuoka.jp": 1,
        "kuroishi.aomori.jp": 1,
        "kuroiso.tochigi.jp": 1,
        "kuromatsunai.hokkaido.jp": 1,
        "kurotaki.nara.jp": 1,
        "kursk.ru": 1,
        "kurume.fukuoka.jp": 1,
        "kusatsu.gunma.jp": 1,
        "kusatsu.shiga.jp": 1,
        "kushima.miyazaki.jp": 1,
        "kushimoto.wakayama.jp": 1,
        "kushiro.hokkaido.jp": 1,
        "kustanai.ru": 1,
        "kusu.oita.jp": 1,
        "kutchan.hokkaido.jp": 1,
        "kutno.pl": 1,
        "kuwana.mie.jp": 1,
        "kuzbass.ru": 1,
        "kuzumaki.iwate.jp": 1,
        "kv.ua": 1,
        "kvafjord.no": 1,
        "kvalsund.no": 1,
        "kvam.no": 1,
        "kvanangen.no": 1,
        "kvinesdal.no": 1,
        "kvinnherad.no": 1,
        "kviteseid.no": 1,
        "kvitsoy.no": 1,
        "ky.us": 1,
        "kyiv.ua": 1,
        "kyonan.chiba.jp": 1,
        "kyotamba.kyoto.jp": 1,
        "kyotanabe.kyoto.jp": 1,
        "kyotango.kyoto.jp": 1,
        "kyoto.jp": 1,
        "kyowa.akita.jp": 1,
        "kyowa.hokkaido.jp": 1,
        "kyuragi.saga.jp": 1,
        "l.bg": 1,
        "l.se": 1,
        "la-spezia.it": 1,
        "la.us": 1,
        "laakesvuemie.no": 1,
        "labor.museum": 1,
        "labour.museum": 1,
        "lahppi.no": 1,
        "lajolla.museum": 1,
        "lakas.hu": 1,
        "lanbib.se": 1,
        "lancashire.museum": 1,
        "land-4-sale.us": 1,
        "landes.museum": 1,
        "langevag.no": 1,
        "lans.museum": 1,
        "lapy.pl": 1,
        "laquila.it": 1,
        "lardal.no": 1,
        "larsson.museum": 1,
        "larvik.no": 1,
        "laspezia.it": 1,
        "latina.it": 1,
        "lavagis.no": 1,
        "lavangen.no": 1,
        "law.pro": 1,
        "laz.it": 1,
        "lazio.it": 1,
        "lc.it": 1,
        "le.it": 1,
        "leangaviika.no": 1,
        "leasing.aero": 1,
        "lebesby.no": 1,
        "lebork.pl": 1,
        "lebtimnetz.de": 1,
        "lecce.it": 1,
        "lecco.it": 1,
        "leg.br": 1,
        "legnica.pl": 1,
        "leikanger.no": 1,
        "leirfjord.no": 1,
        "leirvik.no": 1,
        "leitungsen.de": 1,
        "leka.no": 1,
        "leksvik.no": 1,
        "lel.br": 1,
        "lenvik.no": 1,
        "lerdal.no": 1,
        "lesja.no": 1,
        "levanger.no": 1,
        "lewismiller.museum": 1,
        "lezajsk.pl": 1,
        "lg.jp": 1,
        "lg.ua": 1,
        "li.it": 1,
        "lib.ak.us": 1,
        "lib.al.us": 1,
        "lib.ar.us": 1,
        "lib.as.us": 1,
        "lib.az.us": 1,
        "lib.ca.us": 1,
        "lib.co.us": 1,
        "lib.ct.us": 1,
        "lib.dc.us": 1,
        "lib.de.us": 1,
        "lib.ee": 1,
        "lib.fl.us": 1,
        "lib.ga.us": 1,
        "lib.gu.us": 1,
        "lib.hi.us": 1,
        "lib.ia.us": 1,
        "lib.id.us": 1,
        "lib.il.us": 1,
        "lib.in.us": 1,
        "lib.ks.us": 1,
        "lib.ky.us": 1,
        "lib.la.us": 1,
        "lib.ma.us": 1,
        "lib.md.us": 1,
        "lib.me.us": 1,
        "lib.mi.us": 1,
        "lib.mn.us": 1,
        "lib.mo.us": 1,
        "lib.ms.us": 1,
        "lib.mt.us": 1,
        "lib.nc.us": 1,
        "lib.nd.us": 1,
        "lib.ne.us": 1,
        "lib.nh.us": 1,
        "lib.nj.us": 1,
        "lib.nm.us": 1,
        "lib.nv.us": 1,
        "lib.ny.us": 1,
        "lib.oh.us": 1,
        "lib.ok.us": 1,
        "lib.or.us": 1,
        "lib.pa.us": 1,
        "lib.pr.us": 1,
        "lib.ri.us": 1,
        "lib.sc.us": 1,
        "lib.sd.us": 1,
        "lib.tn.us": 1,
        "lib.tx.us": 1,
        "lib.ut.us": 1,
        "lib.va.us": 1,
        "lib.vi.us": 1,
        "lib.vt.us": 1,
        "lib.wa.us": 1,
        "lib.wi.us": 1,
        "lib.wy.us": 1,
        "lier.no": 1,
        "lierne.no": 1,
        "lig.it": 1,
        "liguria.it": 1,
        "likes-pie.com": 1,
        "likescandy.com": 1,
        "lillehammer.no": 1,
        "lillesand.no": 1,
        "limanowa.pl": 1,
        "lincoln.museum": 1,
        "lindas.no": 1,
        "lindesnes.no": 1,
        "linz.museum": 1,
        "lipetsk.ru": 1,
        "living.museum": 1,
        "livinghistory.museum": 1,
        "livorno.it": 1,
        "ln.cn": 1,
        "lo.it": 1,
        "loabat.no": 1,
        "localhistory.museum": 1,
        "lodi.it": 1,
        "lodingen.no": 1,
        "logistics.aero": 1,
        "lom.it": 1,
        "lom.no": 1,
        "lombardia.it": 1,
        "lombardy.it": 1,
        "lomza.pl": 1,
        "london.museum": 1,
        "loppa.no": 1,
        "lorenskog.no": 1,
        "losangeles.museum": 1,
        "loten.no": 1,
        "louvre.museum": 1,
        "lowicz.pl": 1,
        "loyalist.museum": 1,
        "lt.it": 1,
        "lt.ua": 1,
        "ltd.co.im": 1,
        "ltd.gi": 1,
        "ltd.lk": 1,
        "ltd.uk": 1,
        "lu.it": 1,
        "lubin.pl": 1,
        "lucania.it": 1,
        "lucca.it": 1,
        "lucerne.museum": 1,
        "lugansk.ua": 1,
        "lukow.pl": 1,
        "lund.no": 1,
        "lunner.no": 1,
        "luroy.no": 1,
        "luster.no": 1,
        "lutsk.ua": 1,
        "luxembourg.museum": 1,
        "luzern.museum": 1,
        "lv.ua": 1,
        "lviv.ua": 1,
        "lyngdal.no": 1,
        "lyngen.no": 1,
        "m.bg": 1,
        "m.se": 1,
        "ma.us": 1,
        "macerata.it": 1,
        "machida.tokyo.jp": 1,
        "mad.museum": 1,
        "madrid.museum": 1,
        "maebashi.gunma.jp": 1,
        "magadan.ru": 1,
        "magazine.aero": 1,
        "magnitka.ru": 1,
        "maibara.shiga.jp": 1,
        "mail.pl": 1,
        "maintenance.aero": 1,
        "maizuru.kyoto.jp": 1,
        "makinohara.shizuoka.jp": 1,
        "makurazaki.kagoshima.jp": 1,
        "malatvuopmi.no": 1,
        "malbork.pl": 1,
        "mallorca.museum": 1,
        "malopolska.pl": 1,
        "malselv.no": 1,
        "malvik.no": 1,
        "mamurogawa.yamagata.jp": 1,
        "manchester.museum": 1,
        "mandal.no": 1,
        "maniwa.okayama.jp": 1,
        "manno.kagawa.jp": 1,
        "mansion.museum": 1,
        "mansions.museum": 1,
        "mantova.it": 1,
        "manx.museum": 1,
        "maori.nz": 1,
        "mar.it": 1,
        "marburg.museum": 1,
        "marche.it": 1,
        "mari-el.ru": 1,
        "mari.ru": 1,
        "marine.ru": 1,
        "maritime.museum": 1,
        "maritimo.museum": 1,
        "marker.no": 1,
        "marketplace.aero": 1,
        "marnardal.no": 1,
        "marugame.kagawa.jp": 1,
        "marumori.miyagi.jp": 1,
        "maryland.museum": 1,
        "marylhurst.museum": 1,
        "masaki.ehime.jp": 1,
        "masfjorden.no": 1,
        "mashike.hokkaido.jp": 1,
        "mashiki.kumamoto.jp": 1,
        "mashiko.tochigi.jp": 1,
        "masoy.no": 1,
        "massa-carrara.it": 1,
        "massacarrara.it": 1,
        "masuda.shimane.jp": 1,
        "mat.br": 1,
        "matera.it": 1,
        "matsubara.osaka.jp": 1,
        "matsubushi.saitama.jp": 1,
        "matsuda.kanagawa.jp": 1,
        "matsudo.chiba.jp": 1,
        "matsue.shimane.jp": 1,
        "matsukawa.nagano.jp": 1,
        "matsumae.hokkaido.jp": 1,
        "matsumoto.kagoshima.jp": 1,
        "matsumoto.nagano.jp": 1,
        "matsuno.ehime.jp": 1,
        "matsusaka.mie.jp": 1,
        "matsushige.tokushima.jp": 1,
        "matsushima.miyagi.jp": 1,
        "matsuura.nagasaki.jp": 1,
        "matsuyama.ehime.jp": 1,
        "matsuzaki.shizuoka.jp": 1,
        "matta-varjjat.no": 1,
        "mazowsze.pl": 1,
        "mazury.pl": 1,
        "mb.ca": 1,
        "mb.it": 1,
        "mc.it": 1,
        "md.ci": 1,
        "md.us": 1,
        "me.it": 1,
        "me.tz": 1,
        "me.uk": 1,
        "me.us": 1,
        "med.br": 1,
        "med.ec": 1,
        "med.ee": 1,
        "med.ht": 1,
        "med.ly": 1,
        "med.om": 1,
        "med.pa": 1,
        "med.pl": 1,
        "med.pro": 1,
        "med.sa": 1,
        "med.sd": 1,
        "medecin.fr": 1,
        "medecin.km": 1,
        "media.aero": 1,
        "media.hu": 1,
        "media.museum": 1,
        "media.pl": 1,
        "medical.museum": 1,
        "medio-campidano.it": 1,
        "mediocampidano.it": 1,
        "medizinhistorisches.museum": 1,
        "meeres.museum": 1,
        "meguro.tokyo.jp": 1,
        "meiwa.gunma.jp": 1,
        "meiwa.mie.jp": 1,
        "meland.no": 1,
        "meldal.no": 1,
        "melhus.no": 1,
        "meloy.no": 1,
        "memorial.museum": 1,
        "meraker.no": 1,
        "merseine.nu": 1,
        "mesaverde.museum": 1,
        "messina.it": 1,
        "mex.com": 1,
        "mi.it": 1,
        "mi.th": 1,
        "mi.us": 1,
        "miasa.nagano.jp": 1,
        "miasta.pl": 1,
        "mibu.tochigi.jp": 1,
        "michigan.museum": 1,
        "microlight.aero": 1,
        "midatlantic.museum": 1,
        "midori.chiba.jp": 1,
        "midori.gunma.jp": 1,
        "midsund.no": 1,
        "midtre-gauldal.no": 1,
        "mie.jp": 1,
        "mielec.pl": 1,
        "mielno.pl": 1,
        "mifune.kumamoto.jp": 1,
        "mihama.aichi.jp": 1,
        "mihama.chiba.jp": 1,
        "mihama.fukui.jp": 1,
        "mihama.mie.jp": 1,
        "mihama.wakayama.jp": 1,
        "mihara.hiroshima.jp": 1,
        "mihara.kochi.jp": 1,
        "miharu.fukushima.jp": 1,
        "miho.ibaraki.jp": 1,
        "mikasa.hokkaido.jp": 1,
        "mikawa.yamagata.jp": 1,
        "miki.hyogo.jp": 1,
        "mil.ac": 1,
        "mil.ae": 1,
        "mil.al": 1,
        "mil.ar": 1,
        "mil.az": 1,
        "mil.ba": 1,
        "mil.bo": 1,
        "mil.br": 1,
        "mil.by": 1,
        "mil.cl": 1,
        "mil.cn": 1,
        "mil.co": 1,
        "mil.do": 1,
        "mil.ec": 1,
        "mil.eg": 1,
        "mil.ge": 1,
        "mil.gh": 1,
        "mil.gt": 1,
        "mil.hn": 1,
        "mil.id": 1,
        "mil.in": 1,
        "mil.iq": 1,
        "mil.jo": 1,
        "mil.kg": 1,
        "mil.km": 1,
        "mil.kr": 1,
        "mil.kz": 1,
        "mil.lv": 1,
        "mil.mg": 1,
        "mil.mv": 1,
        "mil.my": 1,
        "mil.ng": 1,
        "mil.no": 1,
        "mil.nz": 1,
        "mil.pe": 1,
        "mil.ph": 1,
        "mil.pl": 1,
        "mil.py": 1,
        "mil.qa": 1,
        "mil.ru": 1,
        "mil.rw": 1,
        "mil.sh": 1,
        "mil.st": 1,
        "mil.sy": 1,
        "mil.tj": 1,
        "mil.tm": 1,
        "mil.to": 1,
        "mil.tr": 1,
        "mil.tw": 1,
        "mil.tz": 1,
        "mil.uy": 1,
        "mil.vc": 1,
        "mil.ve": 1,
        "milan.it": 1,
        "milano.it": 1,
        "military.museum": 1,
        "mill.museum": 1,
        "mima.tokushima.jp": 1,
        "mimata.miyazaki.jp": 1,
        "minakami.gunma.jp": 1,
        "minamata.kumamoto.jp": 1,
        "minami-alps.yamanashi.jp": 1,
        "minami.fukuoka.jp": 1,
        "minami.kyoto.jp": 1,
        "minami.tokushima.jp": 1,
        "minamiaiki.nagano.jp": 1,
        "minamiashigara.kanagawa.jp": 1,
        "minamiawaji.hyogo.jp": 1,
        "minamiboso.chiba.jp": 1,
        "minamidaito.okinawa.jp": 1,
        "minamiechizen.fukui.jp": 1,
        "minamifurano.hokkaido.jp": 1,
        "minamiise.mie.jp": 1,
        "minamiizu.shizuoka.jp": 1,
        "minamimaki.nagano.jp": 1,
        "minamiminowa.nagano.jp": 1,
        "minamioguni.kumamoto.jp": 1,
        "minamisanriku.miyagi.jp": 1,
        "minamitane.kagoshima.jp": 1,
        "minamiuonuma.niigata.jp": 1,
        "minamiyamashiro.kyoto.jp": 1,
        "minano.saitama.jp": 1,
        "minato.osaka.jp": 1,
        "minato.tokyo.jp": 1,
        "mincom.tn": 1,
        "mine.nu": 1,
        "miners.museum": 1,
        "mining.museum": 1,
        "minnesota.museum": 1,
        "mino.gifu.jp": 1,
        "minobu.yamanashi.jp": 1,
        "minoh.osaka.jp": 1,
        "minokamo.gifu.jp": 1,
        "minowa.nagano.jp": 1,
        "misaki.okayama.jp": 1,
        "misaki.osaka.jp": 1,
        "misasa.tottori.jp": 1,
        "misato.akita.jp": 1,
        "misato.miyagi.jp": 1,
        "misato.saitama.jp": 1,
        "misato.shimane.jp": 1,
        "misato.wakayama.jp": 1,
        "misawa.aomori.jp": 1,
        "misconfused.org": 1,
        "mishima.fukushima.jp": 1,
        "mishima.shizuoka.jp": 1,
        "missile.museum": 1,
        "missoula.museum": 1,
        "misugi.mie.jp": 1,
        "mitaka.tokyo.jp": 1,
        "mitake.gifu.jp": 1,
        "mitane.akita.jp": 1,
        "mito.ibaraki.jp": 1,
        "mitou.yamaguchi.jp": 1,
        "mitoyo.kagawa.jp": 1,
        "mitsue.nara.jp": 1,
        "mitsuke.niigata.jp": 1,
        "miura.kanagawa.jp": 1,
        "miyada.nagano.jp": 1,
        "miyagi.jp": 1,
        "miyake.nara.jp": 1,
        "miyako.fukuoka.jp": 1,
        "miyako.iwate.jp": 1,
        "miyakonojo.miyazaki.jp": 1,
        "miyama.fukuoka.jp": 1,
        "miyama.mie.jp": 1,
        "miyashiro.saitama.jp": 1,
        "miyawaka.fukuoka.jp": 1,
        "miyazaki.jp": 1,
        "miyazaki.miyazaki.jp": 1,
        "miyazu.kyoto.jp": 1,
        "miyoshi.aichi.jp": 1,
        "miyoshi.hiroshima.jp": 1,
        "miyoshi.saitama.jp": 1,
        "miyoshi.tokushima.jp": 1,
        "miyota.nagano.jp": 1,
        "mizuho.tokyo.jp": 1,
        "mizumaki.fukuoka.jp": 1,
        "mizunami.gifu.jp": 1,
        "mizusawa.iwate.jp": 1,
        "mjondalen.no": 1,
        "mk.ua": 1,
        "mn.it": 1,
        "mn.us": 1,
        "mo-i-rana.no": 1,
        "mo.cn": 1,
        "mo.it": 1,
        "mo.us": 1,
        "moareke.no": 1,
        "mobara.chiba.jp": 1,
        "mobi.gp": 1,
        "mobi.na": 1,
        "mobi.ng": 1,
        "mobi.tt": 1,
        "mobi.tz": 1,
        "mochizuki.nagano.jp": 1,
        "mod.gi": 1,
        "modalen.no": 1,
        "modelling.aero": 1,
        "modena.it": 1,
        "modern.museum": 1,
        "modum.no": 1,
        "moka.tochigi.jp": 1,
        "mol.it": 1,
        "molde.no": 1,
        "molise.it": 1,
        "moma.museum": 1,
        "mombetsu.hokkaido.jp": 1,
        "money.museum": 1,
        "monmouth.museum": 1,
        "monticello.museum": 1,
        "montreal.museum": 1,
        "monza-brianza.it": 1,
        "monza-e-della-brianza.it": 1,
        "monza.it": 1,
        "monzabrianza.it": 1,
        "monzaebrianza.it": 1,
        "monzaedellabrianza.it": 1,
        "mordovia.ru": 1,
        "moriguchi.osaka.jp": 1,
        "morimachi.shizuoka.jp": 1,
        "morioka.iwate.jp": 1,
        "moriya.ibaraki.jp": 1,
        "moriyama.shiga.jp": 1,
        "moriyoshi.akita.jp": 1,
        "morotsuka.miyazaki.jp": 1,
        "moroyama.saitama.jp": 1,
        "moscow.museum": 1,
        "moseushi.hokkaido.jp": 1,
        "mosjoen.no": 1,
        "moskenes.no": 1,
        "mosreg.ru": 1,
        "moss.no": 1,
        "mosvik.no": 1,
        "motegi.tochigi.jp": 1,
        "motobu.okinawa.jp": 1,
        "motorcycle.museum": 1,
        "motosu.gifu.jp": 1,
        "motoyama.kochi.jp": 1,
        "mp.br": 1,
        "mr.no": 1,
        "mragowo.pl": 1,
        "ms.it": 1,
        "ms.kr": 1,
        "ms.us": 1,
        "msk.ru": 1,
        "mt.it": 1,
        "mt.us": 1,
        "muenchen.museum": 1,
        "muenster.museum": 1,
        "mugi.tokushima.jp": 1,
        "muika.niigata.jp": 1,
        "mukawa.hokkaido.jp": 1,
        "muko.kyoto.jp": 1,
        "mulhouse.museum": 1,
        "munakata.fukuoka.jp": 1,
        "muncie.museum": 1,
        "muosat.no": 1,
        "murakami.niigata.jp": 1,
        "murata.miyagi.jp": 1,
        "murayama.yamagata.jp": 1,
        "murmansk.ru": 1,
        "muroran.hokkaido.jp": 1,
        "muroto.kochi.jp": 1,
        "mus.br": 1,
        "musashimurayama.tokyo.jp": 1,
        "musashino.tokyo.jp": 1,
        "museet.museum": 1,
        "museum.mv": 1,
        "museum.mw": 1,
        "museum.no": 1,
        "museum.om": 1,
        "museum.tt": 1,
        "museumcenter.museum": 1,
        "museumvereniging.museum": 1,
        "music.museum": 1,
        "mutsu.aomori.jp": 1,
        "mutsuzawa.chiba.jp": 1,
        "mx.na": 1,
        "my.id": 1,
        "mykolaiv.ua": 1,
        "myoko.niigata.jp": 1,
        "mypets.ws": 1,
        "myphotos.cc": 1,
        "mytis.ru": 1,
        "n.bg": 1,
        "n.se": 1,
        "na.it": 1,
        "naamesjevuemie.no": 1,
        "nabari.mie.jp": 1,
        "nachikatsuura.wakayama.jp": 1,
        "nagahama.shiga.jp": 1,
        "nagai.yamagata.jp": 1,
        "nagano.jp": 1,
        "nagano.nagano.jp": 1,
        "naganohara.gunma.jp": 1,
        "nagaoka.niigata.jp": 1,
        "nagaokakyo.kyoto.jp": 1,
        "nagara.chiba.jp": 1,
        "nagareyama.chiba.jp": 1,
        "nagasaki.jp": 1,
        "nagasaki.nagasaki.jp": 1,
        "nagasu.kumamoto.jp": 1,
        "nagato.yamaguchi.jp": 1,
        "nagatoro.saitama.jp": 1,
        "nagawa.nagano.jp": 1,
        "nagi.okayama.jp": 1,
        "nagiso.nagano.jp": 1,
        "nago.okinawa.jp": 1,
        "nagoya.jp": 1,
        "naha.okinawa.jp": 1,
        "nahari.kochi.jp": 1,
        "naie.hokkaido.jp": 1,
        "naka.hiroshima.jp": 1,
        "naka.ibaraki.jp": 1,
        "nakadomari.aomori.jp": 1,
        "nakagawa.fukuoka.jp": 1,
        "nakagawa.hokkaido.jp": 1,
        "nakagawa.nagano.jp": 1,
        "nakagawa.tokushima.jp": 1,
        "nakagusuku.okinawa.jp": 1,
        "nakagyo.kyoto.jp": 1,
        "nakai.kanagawa.jp": 1,
        "nakama.fukuoka.jp": 1,
        "nakamichi.yamanashi.jp": 1,
        "nakamura.kochi.jp": 1,
        "nakaniikawa.toyama.jp": 1,
        "nakano.nagano.jp": 1,
        "nakano.tokyo.jp": 1,
        "nakanojo.gunma.jp": 1,
        "nakanoto.ishikawa.jp": 1,
        "nakasatsunai.hokkaido.jp": 1,
        "nakatane.kagoshima.jp": 1,
        "nakatombetsu.hokkaido.jp": 1,
        "nakatsugawa.gifu.jp": 1,
        "nakayama.yamagata.jp": 1,
        "nakhodka.ru": 1,
        "nakijin.okinawa.jp": 1,
        "naklo.pl": 1,
        "nalchik.ru": 1,
        "namdalseid.no": 1,
        "name.az": 1,
        "name.eg": 1,
        "name.et": 1,
        "name.hr": 1,
        "name.jo": 1,
        "name.mk": 1,
        "name.mv": 1,
        "name.my": 1,
        "name.na": 1,
        "name.ng": 1,
        "name.pr": 1,
        "name.qa": 1,
        "name.tj": 1,
        "name.tr": 1,
        "name.tt": 1,
        "name.vn": 1,
        "namegata.ibaraki.jp": 1,
        "namegawa.saitama.jp": 1,
        "namerikawa.toyama.jp": 1,
        "namie.fukushima.jp": 1,
        "namikata.ehime.jp": 1,
        "namsos.no": 1,
        "namsskogan.no": 1,
        "nanae.hokkaido.jp": 1,
        "nanao.ishikawa.jp": 1,
        "nanbu.tottori.jp": 1,
        "nanbu.yamanashi.jp": 1,
        "nango.fukushima.jp": 1,
        "nanjo.okinawa.jp": 1,
        "nankoku.kochi.jp": 1,
        "nanmoku.gunma.jp": 1,
        "nannestad.no": 1,
        "nanporo.hokkaido.jp": 1,
        "nantan.kyoto.jp": 1,
        "nanto.toyama.jp": 1,
        "nanyo.yamagata.jp": 1,
        "naoshima.kagawa.jp": 1,
        "naples.it": 1,
        "napoli.it": 1,
        "nara.jp": 1,
        "nara.nara.jp": 1,
        "narashino.chiba.jp": 1,
        "narita.chiba.jp": 1,
        "naroy.no": 1,
        "narusawa.yamanashi.jp": 1,
        "naruto.tokushima.jp": 1,
        "narviika.no": 1,
        "narvik.no": 1,
        "nasu.tochigi.jp": 1,
        "nasushiobara.tochigi.jp": 1,
        "nat.tn": 1,
        "national.museum": 1,
        "nationalfirearms.museum": 1,
        "nationalheritage.museum": 1,
        "nativeamerican.museum": 1,
        "natori.miyagi.jp": 1,
        "naturalhistory.museum": 1,
        "naturalhistorymuseum.museum": 1,
        "naturalsciences.museum": 1,
        "naturbruksgymn.se": 1,
        "nature.museum": 1,
        "naturhistorisches.museum": 1,
        "natuurwetenschappen.museum": 1,
        "naumburg.museum": 1,
        "naustdal.no": 1,
        "naval.museum": 1,
        "navigation.aero": 1,
        "navuotna.no": 1,
        "nayoro.hokkaido.jp": 1,
        "nb.ca": 1,
        "nc.tr": 1,
        "nc.us": 1,
        "nd.us": 1,
        "ne.jp": 1,
        "ne.kr": 1,
        "ne.pw": 1,
        "ne.tz": 1,
        "ne.ug": 1,
        "ne.us": 1,
        "neat-url.com": 1,
        "nebraska.museum": 1,
        "nedre-eiker.no": 1,
        "nemuro.hokkaido.jp": 1,
        "nerima.tokyo.jp": 1,
        "nes.akershus.no": 1,
        "nes.buskerud.no": 1,
        "nesna.no": 1,
        "nesodden.no": 1,
        "nesoddtangen.no": 1,
        "nesseby.no": 1,
        "nesset.no": 1,
        "net.ac": 1,
        "net.ae": 1,
        "net.af": 1,
        "net.ag": 1,
        "net.ai": 1,
        "net.al": 1,
        "net.an": 1,
        "net.ar": 1,
        "net.au": 1,
        "net.az": 1,
        "net.ba": 1,
        "net.bb": 1,
        "net.bh": 1,
        "net.bm": 1,
        "net.bo": 1,
        "net.br": 1,
        "net.bs": 1,
        "net.bt": 1,
        "net.bz": 1,
        "net.ci": 1,
        "net.cm": 1,
        "net.cn": 1,
        "net.co": 1,
        "net.cu": 1,
        "net.cw": 1,
        "net.dm": 1,
        "net.do": 1,
        "net.dz": 1,
        "net.ec": 1,
        "net.eg": 1,
        "net.ge": 1,
        "net.gg": 1,
        "net.gn": 1,
        "net.gp": 1,
        "net.gr": 1,
        "net.gt": 1,
        "net.gy": 1,
        "net.hk": 1,
        "net.hn": 1,
        "net.ht": 1,
        "net.id": 1,
        "net.im": 1,
        "net.in": 1,
        "net.iq": 1,
        "net.ir": 1,
        "net.is": 1,
        "net.je": 1,
        "net.jo": 1,
        "net.kg": 1,
        "net.ki": 1,
        "net.kn": 1,
        "net.ky": 1,
        "net.kz": 1,
        "net.la": 1,
        "net.lb": 1,
        "net.lc": 1,
        "net.lk": 1,
        "net.lr": 1,
        "net.lv": 1,
        "net.ly": 1,
        "net.ma": 1,
        "net.me": 1,
        "net.mk": 1,
        "net.ml": 1,
        "net.mo": 1,
        "net.ms": 1,
        "net.mt": 1,
        "net.mu": 1,
        "net.mv": 1,
        "net.mw": 1,
        "net.mx": 1,
        "net.my": 1,
        "net.nf": 1,
        "net.ng": 1,
        "net.nr": 1,
        "net.nz": 1,
        "net.om": 1,
        "net.pa": 1,
        "net.pe": 1,
        "net.ph": 1,
        "net.pk": 1,
        "net.pl": 1,
        "net.pn": 1,
        "net.pr": 1,
        "net.ps": 1,
        "net.pt": 1,
        "net.py": 1,
        "net.qa": 1,
        "net.ru": 1,
        "net.rw": 1,
        "net.sa": 1,
        "net.sb": 1,
        "net.sc": 1,
        "net.sd": 1,
        "net.sg": 1,
        "net.sh": 1,
        "net.sl": 1,
        "net.so": 1,
        "net.st": 1,
        "net.sy": 1,
        "net.th": 1,
        "net.tj": 1,
        "net.tm": 1,
        "net.tn": 1,
        "net.to": 1,
        "net.tr": 1,
        "net.tt": 1,
        "net.tw": 1,
        "net.ua": 1,
        "net.uk": 1,
        "net.uy": 1,
        "net.uz": 1,
        "net.vc": 1,
        "net.ve": 1,
        "net.vi": 1,
        "net.vn": 1,
        "net.vu": 1,
        "net.ws": 1,
        "neues.museum": 1,
        "newhampshire.museum": 1,
        "newjersey.museum": 1,
        "newmexico.museum": 1,
        "newport.museum": 1,
        "news.hu": 1,
        "newspaper.museum": 1,
        "newyork.museum": 1,
        "neyagawa.osaka.jp": 1,
        "nf.ca": 1,
        "nfshost.com": 1,
        "ngo.lk": 1,
        "ngo.ph": 1,
        "nh.us": 1,
        "nhs.uk": 1,
        "nic.in": 1,
        "nic.tj": 1,
        "nichinan.miyazaki.jp": 1,
        "nichinan.tottori.jp": 1,
        "nid.io": 1,
        "niepce.museum": 1,
        "nieruchomosci.pl": 1,
        "niigata.jp": 1,
        "niigata.niigata.jp": 1,
        "niihama.ehime.jp": 1,
        "niikappu.hokkaido.jp": 1,
        "niimi.okayama.jp": 1,
        "niiza.saitama.jp": 1,
        "nikaho.akita.jp": 1,
        "niki.hokkaido.jp": 1,
        "nikko.tochigi.jp": 1,
        "nikolaev.ua": 1,
        "ninohe.iwate.jp": 1,
        "ninomiya.kanagawa.jp": 1,
        "nirasaki.yamanashi.jp": 1,
        "nishi.fukuoka.jp": 1,
        "nishi.osaka.jp": 1,
        "nishiaizu.fukushima.jp": 1,
        "nishiarita.saga.jp": 1,
        "nishiawakura.okayama.jp": 1,
        "nishiazai.shiga.jp": 1,
        "nishigo.fukushima.jp": 1,
        "nishihara.kumamoto.jp": 1,
        "nishihara.okinawa.jp": 1,
        "nishiizu.shizuoka.jp": 1,
        "nishikata.tochigi.jp": 1,
        "nishikatsura.yamanashi.jp": 1,
        "nishikawa.yamagata.jp": 1,
        "nishimera.miyazaki.jp": 1,
        "nishinomiya.hyogo.jp": 1,
        "nishinoomote.kagoshima.jp": 1,
        "nishinoshima.shimane.jp": 1,
        "nishio.aichi.jp": 1,
        "nishiokoppe.hokkaido.jp": 1,
        "nishitosa.kochi.jp": 1,
        "nishiwaki.hyogo.jp": 1,
        "nissedal.no": 1,
        "nisshin.aichi.jp": 1,
        "nittedal.no": 1,
        "niyodogawa.kochi.jp": 1,
        "nj.us": 1,
        "nkz.ru": 1,
        "nl.ca": 1,
        "nl.no": 1,
        "nm.cn": 1,
        "nm.us": 1,
        "nnov.ru": 1,
        "no.com": 1,
        "no.it": 1,
        "nobeoka.miyazaki.jp": 1,
        "noboribetsu.hokkaido.jp": 1,
        "noda.chiba.jp": 1,
        "noda.iwate.jp": 1,
        "nogata.fukuoka.jp": 1,
        "nogi.tochigi.jp": 1,
        "noheji.aomori.jp": 1,
        "nom.ad": 1,
        "nom.ag": 1,
        "nom.br": 1,
        "nom.co": 1,
        "nom.es": 1,
        "nom.fr": 1,
        "nom.km": 1,
        "nom.mg": 1,
        "nom.pa": 1,
        "nom.pe": 1,
        "nom.pl": 1,
        "nom.re": 1,
        "nom.ro": 1,
        "nom.tm": 1,
        "nome.pt": 1,
        "nomi.ishikawa.jp": 1,
        "nonoichi.ishikawa.jp": 1,
        "nord-aurdal.no": 1,
        "nord-fron.no": 1,
        "nord-odal.no": 1,
        "norddal.no": 1,
        "nordkapp.no": 1,
        "nordre-land.no": 1,
        "nordreisa.no": 1,
        "nore-og-uvdal.no": 1,
        "norfolk.museum": 1,
        "norilsk.ru": 1,
        "north.museum": 1,
        "nose.osaka.jp": 1,
        "nosegawa.nara.jp": 1,
        "noshiro.akita.jp": 1,
        "not.br": 1,
        "notaires.fr": 1,
        "notaires.km": 1,
        "noto.ishikawa.jp": 1,
        "notodden.no": 1,
        "notogawa.shiga.jp": 1,
        "notteroy.no": 1,
        "nov.ru": 1,
        "novara.it": 1,
        "novosibirsk.ru": 1,
        "nowaruda.pl": 1,
        "nozawaonsen.nagano.jp": 1,
        "nrw.museum": 1,
        "ns.ca": 1,
        "nsk.ru": 1,
        "nsn.us": 1,
        "nsw.au": 1,
        "nsw.edu.au": 1,
        "nt.au": 1,
        "nt.ca": 1,
        "nt.edu.au": 1,
        "nt.no": 1,
        "nt.ro": 1,
        "ntr.br": 1,
        "nu.ca": 1,
        "nu.it": 1,
        "nuernberg.museum": 1,
        "numata.gunma.jp": 1,
        "numata.hokkaido.jp": 1,
        "numazu.shizuoka.jp": 1,
        "nuoro.it": 1,
        "nuremberg.museum": 1,
        "nv.us": 1,
        "nx.cn": 1,
        "ny.us": 1,
        "nyc.mn": 1,
        "nyc.museum": 1,
        "nyny.museum": 1,
        "nysa.pl": 1,
        "nyuzen.toyama.jp": 1,
        "o.bg": 1,
        "o.se": 1,
        "oamishirasato.chiba.jp": 1,
        "oarai.ibaraki.jp": 1,
        "obama.fukui.jp": 1,
        "obama.nagasaki.jp": 1,
        "obanazawa.yamagata.jp": 1,
        "obihiro.hokkaido.jp": 1,
        "obira.hokkaido.jp": 1,
        "obu.aichi.jp": 1,
        "obuse.nagano.jp": 1,
        "oceanographic.museum": 1,
        "oceanographique.museum": 1,
        "ochi.kochi.jp": 1,
        "od.ua": 1,
        "odate.akita.jp": 1,
        "odawara.kanagawa.jp": 1,
        "odda.no": 1,
        "odesa.ua": 1,
        "odessa.ua": 1,
        "odo.br": 1,
        "oe.yamagata.jp": 1,
        "of.by": 1,
        "of.no": 1,
        "off.ai": 1,
        "office-on-the.net": 1,
        "ofunato.iwate.jp": 1,
        "og.ao": 1,
        "og.it": 1,
        "oga.akita.jp": 1,
        "ogaki.gifu.jp": 1,
        "ogano.saitama.jp": 1,
        "ogasawara.tokyo.jp": 1,
        "ogata.akita.jp": 1,
        "ogawa.ibaraki.jp": 1,
        "ogawa.nagano.jp": 1,
        "ogawa.saitama.jp": 1,
        "ogawara.miyagi.jp": 1,
        "ogi.saga.jp": 1,
        "ogimi.okinawa.jp": 1,
        "ogliastra.it": 1,
        "ogori.fukuoka.jp": 1,
        "ogose.saitama.jp": 1,
        "oguchi.aichi.jp": 1,
        "oguni.kumamoto.jp": 1,
        "oguni.yamagata.jp": 1,
        "oh.us": 1,
        "oharu.aichi.jp": 1,
        "ohda.shimane.jp": 1,
        "ohi.fukui.jp": 1,
        "ohira.miyagi.jp": 1,
        "ohira.tochigi.jp": 1,
        "ohkura.yamagata.jp": 1,
        "ohtawara.tochigi.jp": 1,
        "oi.kanagawa.jp": 1,
        "oirase.aomori.jp": 1,
        "oishida.yamagata.jp": 1,
        "oiso.kanagawa.jp": 1,
        "oita.jp": 1,
        "oita.oita.jp": 1,
        "oizumi.gunma.jp": 1,
        "oji.nara.jp": 1,
        "ojiya.niigata.jp": 1,
        "ok.us": 1,
        "okagaki.fukuoka.jp": 1,
        "okawa.fukuoka.jp": 1,
        "okawa.kochi.jp": 1,
        "okaya.nagano.jp": 1,
        "okayama.jp": 1,
        "okayama.okayama.jp": 1,
        "okazaki.aichi.jp": 1,
        "okegawa.saitama.jp": 1,
        "oketo.hokkaido.jp": 1,
        "oki.fukuoka.jp": 1,
        "okinawa.jp": 1,
        "okinawa.okinawa.jp": 1,
        "okinoshima.shimane.jp": 1,
        "okoppe.hokkaido.jp": 1,
        "oksnes.no": 1,
        "okuizumo.shimane.jp": 1,
        "okuma.fukushima.jp": 1,
        "okutama.tokyo.jp": 1,
        "ol.no": 1,
        "olawa.pl": 1,
        "olbia-tempio.it": 1,
        "olbiatempio.it": 1,
        "olecko.pl": 1,
        "olkusz.pl": 1,
        "olsztyn.pl": 1,
        "omachi.nagano.jp": 1,
        "omachi.saga.jp": 1,
        "omaezaki.shizuoka.jp": 1,
        "omaha.museum": 1,
        "omasvuotna.no": 1,
        "ome.tokyo.jp": 1,
        "omi.nagano.jp": 1,
        "omi.niigata.jp": 1,
        "omigawa.chiba.jp": 1,
        "omihachiman.shiga.jp": 1,
        "omitama.ibaraki.jp": 1,
        "omiya.saitama.jp": 1,
        "omotego.fukushima.jp": 1,
        "omsk.ru": 1,
        "omura.nagasaki.jp": 1,
        "omuta.fukuoka.jp": 1,
        "on-the-web.tv": 1,
        "on.ca": 1,
        "onagawa.miyagi.jp": 1,
        "onga.fukuoka.jp": 1,
        "onjuku.chiba.jp": 1,
        "online.museum": 1,
        "onna.okinawa.jp": 1,
        "ono.fukui.jp": 1,
        "ono.fukushima.jp": 1,
        "ono.hyogo.jp": 1,
        "onojo.fukuoka.jp": 1,
        "onomichi.hiroshima.jp": 1,
        "ontario.museum": 1,
        "ookuwa.nagano.jp": 1,
        "ooshika.nagano.jp": 1,
        "openair.museum": 1,
        "operaunite.com": 1,
        "opoczno.pl": 1,
        "opole.pl": 1,
        "oppdal.no": 1,
        "oppegard.no": 1,
        "or.at": 1,
        "or.bi": 1,
        "or.ci": 1,
        "or.cr": 1,
        "or.id": 1,
        "or.it": 1,
        "or.jp": 1,
        "or.kr": 1,
        "or.mu": 1,
        "or.na": 1,
        "or.pw": 1,
        "or.th": 1,
        "or.tz": 1,
        "or.ug": 1,
        "or.us": 1,
        "ora.gunma.jp": 1,
        "oregon.museum": 1,
        "oregontrail.museum": 1,
        "orenburg.ru": 1,
        "org.ac": 1,
        "org.ae": 1,
        "org.af": 1,
        "org.ag": 1,
        "org.ai": 1,
        "org.al": 1,
        "org.an": 1,
        "org.ar": 1,
        "org.au": 1,
        "org.az": 1,
        "org.ba": 1,
        "org.bb": 1,
        "org.bh": 1,
        "org.bi": 1,
        "org.bm": 1,
        "org.bo": 1,
        "org.br": 1,
        "org.bs": 1,
        "org.bt": 1,
        "org.bw": 1,
        "org.bz": 1,
        "org.ci": 1,
        "org.cn": 1,
        "org.co": 1,
        "org.cu": 1,
        "org.cw": 1,
        "org.dm": 1,
        "org.do": 1,
        "org.dz": 1,
        "org.ec": 1,
        "org.ee": 1,
        "org.eg": 1,
        "org.es": 1,
        "org.et": 1,
        "org.ge": 1,
        "org.gg": 1,
        "org.gh": 1,
        "org.gi": 1,
        "org.gn": 1,
        "org.gp": 1,
        "org.gr": 1,
        "org.gt": 1,
        "org.hk": 1,
        "org.hn": 1,
        "org.ht": 1,
        "org.hu": 1,
        "org.im": 1,
        "org.in": 1,
        "org.iq": 1,
        "org.ir": 1,
        "org.is": 1,
        "org.je": 1,
        "org.jo": 1,
        "org.kg": 1,
        "org.ki": 1,
        "org.km": 1,
        "org.kn": 1,
        "org.kp": 1,
        "org.ky": 1,
        "org.kz": 1,
        "org.la": 1,
        "org.lb": 1,
        "org.lc": 1,
        "org.lk": 1,
        "org.lr": 1,
        "org.ls": 1,
        "org.lv": 1,
        "org.ly": 1,
        "org.ma": 1,
        "org.me": 1,
        "org.mg": 1,
        "org.mk": 1,
        "org.ml": 1,
        "org.mn": 1,
        "org.mo": 1,
        "org.ms": 1,
        "org.mt": 1,
        "org.mu": 1,
        "org.mv": 1,
        "org.mw": 1,
        "org.mx": 1,
        "org.my": 1,
        "org.na": 1,
        "org.ng": 1,
        "org.nr": 1,
        "org.nz": 1,
        "org.om": 1,
        "org.pa": 1,
        "org.pe": 1,
        "org.pf": 1,
        "org.ph": 1,
        "org.pk": 1,
        "org.pl": 1,
        "org.pn": 1,
        "org.pr": 1,
        "org.ps": 1,
        "org.pt": 1,
        "org.py": 1,
        "org.qa": 1,
        "org.ro": 1,
        "org.rs": 1,
        "org.ru": 1,
        "org.sa": 1,
        "org.sb": 1,
        "org.sc": 1,
        "org.sd": 1,
        "org.se": 1,
        "org.sg": 1,
        "org.sh": 1,
        "org.sl": 1,
        "org.sn": 1,
        "org.so": 1,
        "org.st": 1,
        "org.sv": 1,
        "org.sy": 1,
        "org.sz": 1,
        "org.tj": 1,
        "org.tm": 1,
        "org.tn": 1,
        "org.to": 1,
        "org.tr": 1,
        "org.tt": 1,
        "org.tw": 1,
        "org.ua": 1,
        "org.ug": 1,
        "org.uk": 1,
        "org.uy": 1,
        "org.uz": 1,
        "org.vc": 1,
        "org.ve": 1,
        "org.vi": 1,
        "org.vn": 1,
        "org.vu": 1,
        "org.ws": 1,
        "oristano.it": 1,
        "orkanger.no": 1,
        "orkdal.no": 1,
        "orland.no": 1,
        "orskog.no": 1,
        "orsta.no": 1,
        "oryol.ru": 1,
        "os.hedmark.no": 1,
        "os.hordaland.no": 1,
        "osaka.jp": 1,
        "osakasayama.osaka.jp": 1,
        "osaki.miyagi.jp": 1,
        "osakikamijima.hiroshima.jp": 1,
        "osen.no": 1,
        "oseto.nagasaki.jp": 1,
        "oshima.tokyo.jp": 1,
        "oshima.yamaguchi.jp": 1,
        "oshino.yamanashi.jp": 1,
        "oshu.iwate.jp": 1,
        "oskol.ru": 1,
        "oslo.no": 1,
        "osoyro.no": 1,
        "osteroy.no": 1,
        "ostre-toten.no": 1,
        "ostroda.pl": 1,
        "ostroleka.pl": 1,
        "ostrowiec.pl": 1,
        "ostrowwlkp.pl": 1,
        "ot.it": 1,
        "ota.gunma.jp": 1,
        "ota.tokyo.jp": 1,
        "otago.museum": 1,
        "otake.hiroshima.jp": 1,
        "otaki.chiba.jp": 1,
        "otaki.nagano.jp": 1,
        "otaki.saitama.jp": 1,
        "otama.fukushima.jp": 1,
        "otari.nagano.jp": 1,
        "otaru.hokkaido.jp": 1,
        "other.nf": 1,
        "oto.fukuoka.jp": 1,
        "otobe.hokkaido.jp": 1,
        "otofuke.hokkaido.jp": 1,
        "otoineppu.hokkaido.jp": 1,
        "otoyo.kochi.jp": 1,
        "otsu.shiga.jp": 1,
        "otsuchi.iwate.jp": 1,
        "otsuki.kochi.jp": 1,
        "otsuki.yamanashi.jp": 1,
        "ouchi.saga.jp": 1,
        "ouda.nara.jp": 1,
        "oumu.hokkaido.jp": 1,
        "outsystemscloud.com": 1,
        "overhalla.no": 1,
        "ovre-eiker.no": 1,
        "owani.aomori.jp": 1,
        "owariasahi.aichi.jp": 1,
        "oxford.museum": 1,
        "oyabe.toyama.jp": 1,
        "oyama.tochigi.jp": 1,
        "oyamazaki.kyoto.jp": 1,
        "oyer.no": 1,
        "oygarden.no": 1,
        "oyodo.nara.jp": 1,
        "oystre-slidre.no": 1,
        "oz.au": 1,
        "ozora.hokkaido.jp": 1,
        "ozu.ehime.jp": 1,
        "ozu.kumamoto.jp": 1,
        "p.bg": 1,
        "p.se": 1,
        "pa.gov.pl": 1,
        "pa.it": 1,
        "pa.us": 1,
        "pacific.museum": 1,
        "paderborn.museum": 1,
        "padova.it": 1,
        "padua.it": 1,
        "palace.museum": 1,
        "palana.ru": 1,
        "paleo.museum": 1,
        "palermo.it": 1,
        "palmsprings.museum": 1,
        "panama.museum": 1,
        "parachuting.aero": 1,
        "paragliding.aero": 1,
        "paris.museum": 1,
        "parliament.nz": 1,
        "parma.it": 1,
        "paroch.k12.ma.us": 1,
        "parti.se": 1,
        "pasadena.museum": 1,
        "passenger-association.aero": 1,
        "pavia.it": 1,
        "pb.ao": 1,
        "pc.it": 1,
        "pc.pl": 1,
        "pd.it": 1,
        "pe.ca": 1,
        "pe.it": 1,
        "pe.kr": 1,
        "penza.ru": 1,
        "per.la": 1,
        "per.nf": 1,
        "per.sg": 1,
        "perm.ru": 1,
        "perso.ht": 1,
        "perso.sn": 1,
        "perso.tn": 1,
        "perugia.it": 1,
        "pesaro-urbino.it": 1,
        "pesarourbino.it": 1,
        "pescara.it": 1,
        "pg.it": 1,
        "pharmacien.fr": 1,
        "pharmaciens.km": 1,
        "pharmacy.museum": 1,
        "philadelphia.museum": 1,
        "philadelphiaarea.museum": 1,
        "philately.museum": 1,
        "phoenix.museum": 1,
        "photography.museum": 1,
        "pi.it": 1,
        "piacenza.it": 1,
        "piedmont.it": 1,
        "piemonte.it": 1,
        "pila.pl": 1,
        "pilot.aero": 1,
        "pilots.museum": 1,
        "pippu.hokkaido.jp": 1,
        "pisa.it": 1,
        "pistoia.it": 1,
        "pisz.pl": 1,
        "pittsburgh.museum": 1,
        "pl.ua": 1,
        "planetarium.museum": 1,
        "plantation.museum": 1,
        "plants.museum": 1,
        "plaza.museum": 1,
        "plc.co.im": 1,
        "plc.ly": 1,
        "plc.uk": 1,
        "plo.ps": 1,
        "pmn.it": 1,
        "pn.it": 1,
        "po.gov.pl": 1,
        "po.it": 1,
        "podhale.pl": 1,
        "podlasie.pl": 1,
        "podzone.net": 1,
        "podzone.org": 1,
        "pol.dz": 1,
        "pol.ht": 1,
        "pol.tr": 1,
        "police.uk": 1,
        "polkowice.pl": 1,
        "poltava.ua": 1,
        "pomorskie.pl": 1,
        "pomorze.pl": 1,
        "pordenone.it": 1,
        "porsanger.no": 1,
        "porsangu.no": 1,
        "porsgrunn.no": 1,
        "port.fr": 1,
        "portal.museum": 1,
        "portland.museum": 1,
        "portlligat.museum": 1,
        "posts-and-telecommunications.museum": 1,
        "potenza.it": 1,
        "powiat.pl": 1,
        "poznan.pl": 1,
        "pp.az": 1,
        "pp.ru": 1,
        "pp.se": 1,
        "pp.ua": 1,
        "ppg.br": 1,
        "pr.it": 1,
        "pr.us": 1,
        "prato.it": 1,
        "prd.fr": 1,
        "prd.km": 1,
        "prd.mg": 1,
        "preservation.museum": 1,
        "presidio.museum": 1,
        "press.aero": 1,
        "press.ma": 1,
        "press.museum": 1,
        "press.se": 1,
        "presse.ci": 1,
        "presse.fr": 1,
        "presse.km": 1,
        "presse.ml": 1,
        "pri.ee": 1,
        "principe.st": 1,
        "priv.at": 1,
        "priv.hu": 1,
        "priv.me": 1,
        "priv.no": 1,
        "priv.pl": 1,
        "pro.az": 1,
        "pro.br": 1,
        "pro.ec": 1,
        "pro.ht": 1,
        "pro.mv": 1,
        "pro.na": 1,
        "pro.om": 1,
        "pro.pr": 1,
        "pro.tt": 1,
        "pro.vn": 1,
        "prochowice.pl": 1,
        "production.aero": 1,
        "prof.pr": 1,
        "project.museum": 1,
        "pruszkow.pl": 1,
        "przeworsk.pl": 1,
        "psc.br": 1,
        "psi.br": 1,
        "pt.it": 1,
        "ptz.ru": 1,
        "pu.it": 1,
        "pub.sa": 1,
        "publ.pt": 1,
        "public.museum": 1,
        "pubol.museum": 1,
        "pug.it": 1,
        "puglia.it": 1,
        "pulawy.pl": 1,
        "pv.it": 1,
        "pvt.ge": 1,
        "pvt.k12.ma.us": 1,
        "pyatigorsk.ru": 1,
        "pz.it": 1,
        "q.bg": 1,
        "qc.ca": 1,
        "qc.com": 1,
        "qh.cn": 1,
        "qld.au": 1,
        "qld.edu.au": 1,
        "qld.gov.au": 1,
        "qsl.br": 1,
        "quebec.museum": 1,
        "r.bg": 1,
        "r.se": 1,
        "ra.it": 1,
        "rade.no": 1,
        "radio.br": 1,
        "radom.pl": 1,
        "radoy.no": 1,
        "ragusa.it": 1,
        "rahkkeravju.no": 1,
        "raholt.no": 1,
        "railroad.museum": 1,
        "railway.museum": 1,
        "raisa.no": 1,
        "rakkestad.no": 1,
        "ralingen.no": 1,
        "rana.no": 1,
        "randaberg.no": 1,
        "rankoshi.hokkaido.jp": 1,
        "ranzan.saitama.jp": 1,
        "rauma.no": 1,
        "ravenna.it": 1,
        "rawa-maz.pl": 1,
        "rc.it": 1,
        "re.it": 1,
        "re.kr": 1,
        "readmyblog.org": 1,
        "realestate.pl": 1,
        "rebun.hokkaido.jp": 1,
        "rec.br": 1,
        "rec.co": 1,
        "rec.nf": 1,
        "rec.ro": 1,
        "rec.ve": 1,
        "recreation.aero": 1,
        "red.sv": 1,
        "reggio-calabria.it": 1,
        "reggio-emilia.it": 1,
        "reggiocalabria.it": 1,
        "reggioemilia.it": 1,
        "reklam.hu": 1,
        "rel.ht": 1,
        "rel.pl": 1,
        "rendalen.no": 1,
        "rennebu.no": 1,
        "rennesoy.no": 1,
        "rep.kp": 1,
        "repbody.aero": 1,
        "res.aero": 1,
        "res.in": 1,
        "research.aero": 1,
        "research.museum": 1,
        "resistance.museum": 1,
        "rg.it": 1,
        "rhcloud.com": 1,
        "ri.it": 1,
        "ri.us": 1,
        "rieti.it": 1,
        "rifu.miyagi.jp": 1,
        "riik.ee": 1,
        "rikubetsu.hokkaido.jp": 1,
        "rikuzentakata.iwate.jp": 1,
        "rimini.it": 1,
        "rindal.no": 1,
        "ringebu.no": 1,
        "ringerike.no": 1,
        "ringsaker.no": 1,
        "riodejaneiro.museum": 1,
        "rishiri.hokkaido.jp": 1,
        "rishirifuji.hokkaido.jp": 1,
        "risor.no": 1,
        "rissa.no": 1,
        "ritto.shiga.jp": 1,
        "rivne.ua": 1,
        "rl.no": 1,
        "rm.it": 1,
        "rn.it": 1,
        "rnd.ru": 1,
        "rnrt.tn": 1,
        "rns.tn": 1,
        "rnu.tn": 1,
        "ro.com": 1,
        "ro.it": 1,
        "roan.no": 1,
        "rochester.museum": 1,
        "rockart.museum": 1,
        "rodoy.no": 1,
        "rokunohe.aomori.jp": 1,
        "rollag.no": 1,
        "roma.it": 1,
        "roma.museum": 1,
        "rome.it": 1,
        "romsa.no": 1,
        "romskog.no": 1,
        "roros.no": 1,
        "rost.no": 1,
        "rotorcraft.aero": 1,
        "rovigo.it": 1,
        "rovno.ua": 1,
        "royken.no": 1,
        "royrvik.no": 1,
        "rs.ba": 1,
        "ru.com": 1,
        "rubtsovsk.ru": 1,
        "ruovat.no": 1,
        "russia.museum": 1,
        "rv.ua": 1,
        "ryazan.ru": 1,
        "rybnik.pl": 1,
        "rygge.no": 1,
        "ryokami.saitama.jp": 1,
        "ryugasaki.ibaraki.jp": 1,
        "ryuoh.shiga.jp": 1,
        "rzeszow.pl": 1,
        "s.bg": 1,
        "s.se": 1,
        "s3-ap-northeast-1.amazonaws.com": 1,
        "s3-ap-southeast-1.amazonaws.com": 1,
        "s3-ap-southeast-2.amazonaws.com": 1,
        "s3-eu-west-1.amazonaws.com": 1,
        "s3-fips-us-gov-west-1.amazonaws.com": 1,
        "s3-sa-east-1.amazonaws.com": 1,
        "s3-us-gov-west-1.amazonaws.com": 1,
        "s3-us-west-1.amazonaws.com": 1,
        "s3-us-west-2.amazonaws.com": 1,
        "s3-website-ap-northeast-1.amazonaws.com": 1,
        "s3-website-ap-southeast-1.amazonaws.com": 1,
        "s3-website-ap-southeast-2.amazonaws.com": 1,
        "s3-website-eu-west-1.amazonaws.com": 1,
        "s3-website-sa-east-1.amazonaws.com": 1,
        "s3-website-us-east-1.amazonaws.com": 1,
        "s3-website-us-gov-west-1.amazonaws.com": 1,
        "s3-website-us-west-1.amazonaws.com": 1,
        "s3-website-us-west-2.amazonaws.com": 1,
        "s3.amazonaws.com": 1,
        "sa-east-1.compute.amazonaws.com": 1,
        "sa.au": 1,
        "sa.com": 1,
        "sa.cr": 1,
        "sa.edu.au": 1,
        "sa.gov.au": 1,
        "sa.it": 1,
        "sabae.fukui.jp": 1,
        "sado.niigata.jp": 1,
        "safety.aero": 1,
        "saga.jp": 1,
        "saga.saga.jp": 1,
        "sagae.yamagata.jp": 1,
        "sagamihara.kanagawa.jp": 1,
        "saigawa.fukuoka.jp": 1,
        "saijo.ehime.jp": 1,
        "saikai.nagasaki.jp": 1,
        "saiki.oita.jp": 1,
        "saintlouis.museum": 1,
        "saitama.jp": 1,
        "saitama.saitama.jp": 1,
        "saito.miyazaki.jp": 1,
        "saka.hiroshima.jp": 1,
        "sakado.saitama.jp": 1,
        "sakae.chiba.jp": 1,
        "sakae.nagano.jp": 1,
        "sakahogi.gifu.jp": 1,
        "sakai.fukui.jp": 1,
        "sakai.ibaraki.jp": 1,
        "sakai.osaka.jp": 1,
        "sakaiminato.tottori.jp": 1,
        "sakaki.nagano.jp": 1,
        "sakata.yamagata.jp": 1,
        "sakawa.kochi.jp": 1,
        "sakegawa.yamagata.jp": 1,
        "sakhalin.ru": 1,
        "saku.nagano.jp": 1,
        "sakuho.nagano.jp": 1,
        "sakura.chiba.jp": 1,
        "sakura.tochigi.jp": 1,
        "sakuragawa.ibaraki.jp": 1,
        "sakurai.nara.jp": 1,
        "sakyo.kyoto.jp": 1,
        "salangen.no": 1,
        "salat.no": 1,
        "salem.museum": 1,
        "salerno.it": 1,
        "saltdal.no": 1,
        "salvadordali.museum": 1,
        "salzburg.museum": 1,
        "samara.ru": 1,
        "samegawa.fukushima.jp": 1,
        "samnanger.no": 1,
        "samukawa.kanagawa.jp": 1,
        "sanagochi.tokushima.jp": 1,
        "sanda.hyogo.jp": 1,
        "sande.more-og-romsdal.no": 1,
        "sande.vestfold.no": 1,
        "sande.xn--mre-og-romsdal-qqb.no": 1,
        "sandefjord.no": 1,
        "sandiego.museum": 1,
        "sandnes.no": 1,
        "sandnessjoen.no": 1,
        "sandoy.no": 1,
        "sanfrancisco.museum": 1,
        "sango.nara.jp": 1,
        "sanjo.niigata.jp": 1,
        "sannan.hyogo.jp": 1,
        "sannohe.aomori.jp": 1,
        "sano.tochigi.jp": 1,
        "sanok.pl": 1,
        "santabarbara.museum": 1,
        "santacruz.museum": 1,
        "santafe.museum": 1,
        "sanuki.kagawa.jp": 1,
        "saotome.st": 1,
        "sapporo.jp": 1,
        "sar.it": 1,
        "saratov.ru": 1,
        "sardegna.it": 1,
        "sardinia.it": 1,
        "saroma.hokkaido.jp": 1,
        "sarpsborg.no": 1,
        "sarufutsu.hokkaido.jp": 1,
        "sasaguri.fukuoka.jp": 1,
        "sasayama.hyogo.jp": 1,
        "sasebo.nagasaki.jp": 1,
        "saskatchewan.museum": 1,
        "sassari.it": 1,
        "satosho.okayama.jp": 1,
        "satsumasendai.kagoshima.jp": 1,
        "satte.saitama.jp": 1,
        "satx.museum": 1,
        "sauda.no": 1,
        "sauherad.no": 1,
        "savannahga.museum": 1,
        "saves-the-whales.com": 1,
        "savona.it": 1,
        "sayama.osaka.jp": 1,
        "sayama.saitama.jp": 1,
        "sayo.hyogo.jp": 1,
        "sb.ua": 1,
        "sc.cn": 1,
        "sc.kr": 1,
        "sc.tz": 1,
        "sc.ug": 1,
        "sc.us": 1,
        "sch.ae": 1,
        "sch.id": 1,
        "sch.ir": 1,
        "sch.jo": 1,
        "sch.lk": 1,
        "sch.ly": 1,
        "sch.ng": 1,
        "sch.qa": 1,
        "sch.sa": 1,
        "sch.uk": 1,
        "schlesisches.museum": 1,
        "schoenbrunn.museum": 1,
        "schokoladen.museum": 1,
        "school.museum": 1,
        "school.na": 1,
        "school.nz": 1,
        "schweiz.museum": 1,
        "sci.eg": 1,
        "science-fiction.museum": 1,
        "science.museum": 1,
        "scienceandhistory.museum": 1,
        "scienceandindustry.museum": 1,
        "sciencecenter.museum": 1,
        "sciencecenters.museum": 1,
        "sciencehistory.museum": 1,
        "sciences.museum": 1,
        "sciencesnaturelles.museum": 1,
        "scientist.aero": 1,
        "scotland.museum": 1,
        "scrapper-site.net": 1,
        "scrapping.cc": 1,
        "sd.cn": 1,
        "sd.us": 1,
        "se.com": 1,
        "se.net": 1,
        "seaport.museum": 1,
        "sebastopol.ua": 1,
        "sec.ps": 1,
        "seihi.nagasaki.jp": 1,
        "seika.kyoto.jp": 1,
        "seiro.niigata.jp": 1,
        "seirou.niigata.jp": 1,
        "seiyo.ehime.jp": 1,
        "sejny.pl": 1,
        "seki.gifu.jp": 1,
        "sekigahara.gifu.jp": 1,
        "sekikawa.niigata.jp": 1,
        "sel.no": 1,
        "selbu.no": 1,
        "selfip.biz": 1,
        "selfip.com": 1,
        "selfip.info": 1,
        "selfip.net": 1,
        "selfip.org": 1,
        "selje.no": 1,
        "seljord.no": 1,
        "sells-for-less.com": 1,
        "sells-for-u.com": 1,
        "sells-it.net": 1,
        "sellsyourhome.org": 1,
        "semboku.akita.jp": 1,
        "semine.miyagi.jp": 1,
        "sendai.jp": 1,
        "sennan.osaka.jp": 1,
        "seoul.kr": 1,
        "sera.hiroshima.jp": 1,
        "seranishi.hiroshima.jp": 1,
        "servebbs.com": 1,
        "servebbs.net": 1,
        "servebbs.org": 1,
        "serveftp.net": 1,
        "serveftp.org": 1,
        "servegame.org": 1,
        "service.gov.uk": 1,
        "services.aero": 1,
        "setagaya.tokyo.jp": 1,
        "seto.aichi.jp": 1,
        "setouchi.okayama.jp": 1,
        "settlement.museum": 1,
        "settlers.museum": 1,
        "settsu.osaka.jp": 1,
        "sevastopol.ua": 1,
        "sex.hu": 1,
        "sex.pl": 1,
        "sf.no": 1,
        "sh.cn": 1,
        "shacknet.nu": 1,
        "shakotan.hokkaido.jp": 1,
        "shari.hokkaido.jp": 1,
        "shell.museum": 1,
        "sherbrooke.museum": 1,
        "shibata.miyagi.jp": 1,
        "shibata.niigata.jp": 1,
        "shibecha.hokkaido.jp": 1,
        "shibetsu.hokkaido.jp": 1,
        "shibukawa.gunma.jp": 1,
        "shibuya.tokyo.jp": 1,
        "shichikashuku.miyagi.jp": 1,
        "shichinohe.aomori.jp": 1,
        "shiga.jp": 1,
        "shiiba.miyazaki.jp": 1,
        "shijonawate.osaka.jp": 1,
        "shika.ishikawa.jp": 1,
        "shikabe.hokkaido.jp": 1,
        "shikama.miyagi.jp": 1,
        "shikaoi.hokkaido.jp": 1,
        "shikatsu.aichi.jp": 1,
        "shiki.saitama.jp": 1,
        "shikokuchuo.ehime.jp": 1,
        "shima.mie.jp": 1,
        "shimabara.nagasaki.jp": 1,
        "shimada.shizuoka.jp": 1,
        "shimamaki.hokkaido.jp": 1,
        "shimamoto.osaka.jp": 1,
        "shimane.jp": 1,
        "shimane.shimane.jp": 1,
        "shimizu.hokkaido.jp": 1,
        "shimizu.shizuoka.jp": 1,
        "shimoda.shizuoka.jp": 1,
        "shimodate.ibaraki.jp": 1,
        "shimofusa.chiba.jp": 1,
        "shimogo.fukushima.jp": 1,
        "shimoichi.nara.jp": 1,
        "shimoji.okinawa.jp": 1,
        "shimokawa.hokkaido.jp": 1,
        "shimokitayama.nara.jp": 1,
        "shimonita.gunma.jp": 1,
        "shimonoseki.yamaguchi.jp": 1,
        "shimosuwa.nagano.jp": 1,
        "shimotsuke.tochigi.jp": 1,
        "shimotsuma.ibaraki.jp": 1,
        "shinagawa.tokyo.jp": 1,
        "shinanomachi.nagano.jp": 1,
        "shingo.aomori.jp": 1,
        "shingu.fukuoka.jp": 1,
        "shingu.hyogo.jp": 1,
        "shingu.wakayama.jp": 1,
        "shinichi.hiroshima.jp": 1,
        "shinjo.nara.jp": 1,
        "shinjo.okayama.jp": 1,
        "shinjo.yamagata.jp": 1,
        "shinjuku.tokyo.jp": 1,
        "shinkamigoto.nagasaki.jp": 1,
        "shinonsen.hyogo.jp": 1,
        "shinshinotsu.hokkaido.jp": 1,
        "shinshiro.aichi.jp": 1,
        "shinto.gunma.jp": 1,
        "shintoku.hokkaido.jp": 1,
        "shintomi.miyazaki.jp": 1,
        "shinyoshitomi.fukuoka.jp": 1,
        "shiogama.miyagi.jp": 1,
        "shiojiri.nagano.jp": 1,
        "shioya.tochigi.jp": 1,
        "shirahama.wakayama.jp": 1,
        "shirakawa.fukushima.jp": 1,
        "shirakawa.gifu.jp": 1,
        "shirako.chiba.jp": 1,
        "shiranuka.hokkaido.jp": 1,
        "shiraoi.hokkaido.jp": 1,
        "shiraoka.saitama.jp": 1,
        "shirataka.yamagata.jp": 1,
        "shiriuchi.hokkaido.jp": 1,
        "shiroi.chiba.jp": 1,
        "shiroishi.miyagi.jp": 1,
        "shiroishi.saga.jp": 1,
        "shirosato.ibaraki.jp": 1,
        "shishikui.tokushima.jp": 1,
        "shiso.hyogo.jp": 1,
        "shisui.chiba.jp": 1,
        "shitara.aichi.jp": 1,
        "shiwa.iwate.jp": 1,
        "shizukuishi.iwate.jp": 1,
        "shizuoka.jp": 1,
        "shizuoka.shizuoka.jp": 1,
        "shobara.hiroshima.jp": 1,
        "shonai.fukuoka.jp": 1,
        "shonai.yamagata.jp": 1,
        "shoo.okayama.jp": 1,
        "shop.ht": 1,
        "shop.hu": 1,
        "shop.pl": 1,
        "show.aero": 1,
        "showa.fukushima.jp": 1,
        "showa.gunma.jp": 1,
        "showa.yamanashi.jp": 1,
        "shunan.yamaguchi.jp": 1,
        "si.it": 1,
        "sibenik.museum": 1,
        "sic.it": 1,
        "sicilia.it": 1,
        "sicily.it": 1,
        "siellak.no": 1,
        "siena.it": 1,
        "sigdal.no": 1,
        "siljan.no": 1,
        "silk.museum": 1,
        "simbirsk.ru": 1,
        "simple-url.com": 1,
        "siracusa.it": 1,
        "sirdal.no": 1,
        "sk.ca": 1,
        "skanit.no": 1,
        "skanland.no": 1,
        "skaun.no": 1,
        "skedsmo.no": 1,
        "skedsmokorset.no": 1,
        "ski.museum": 1,
        "ski.no": 1,
        "skien.no": 1,
        "skierva.no": 1,
        "skiptvet.no": 1,
        "skjak.no": 1,
        "skjervoy.no": 1,
        "sklep.pl": 1,
        "skoczow.pl": 1,
        "skodje.no": 1,
        "skole.museum": 1,
        "skydiving.aero": 1,
        "slask.pl": 1,
        "slattum.no": 1,
        "sld.do": 1,
        "sld.pa": 1,
        "slg.br": 1,
        "slupsk.pl": 1,
        "sm.ua": 1,
        "smola.no": 1,
        "smolensk.ru": 1,
        "sn.cn": 1,
        "snaase.no": 1,
        "snasa.no": 1,
        "snillfjord.no": 1,
        "snoasa.no": 1,
        "snz.ru": 1,
        "so.gov.pl": 1,
        "so.it": 1,
        "sobetsu.hokkaido.jp": 1,
        "soc.lk": 1,
        "society.museum": 1,
        "sodegaura.chiba.jp": 1,
        "soeda.fukuoka.jp": 1,
        "software.aero": 1,
        "sogndal.no": 1,
        "sogne.no": 1,
        "soja.okayama.jp": 1,
        "soka.saitama.jp": 1,
        "sokndal.no": 1,
        "sola.no": 1,
        "sologne.museum": 1,
        "solund.no": 1,
        "soma.fukushima.jp": 1,
        "somna.no": 1,
        "sondre-land.no": 1,
        "sondrio.it": 1,
        "songdalen.no": 1,
        "soni.nara.jp": 1,
        "soo.kagoshima.jp": 1,
        "sopot.pl": 1,
        "sor-aurdal.no": 1,
        "sor-fron.no": 1,
        "sor-odal.no": 1,
        "sor-varanger.no": 1,
        "sorfold.no": 1,
        "sorreisa.no": 1,
        "sortland.no": 1,
        "sorum.no": 1,
        "sos.pl": 1,
        "sosa.chiba.jp": 1,
        "sosnowiec.pl": 1,
        "soundandvision.museum": 1,
        "southcarolina.museum": 1,
        "southwest.museum": 1,
        "sowa.ibaraki.jp": 1,
        "sp.it": 1,
        "space-to-rent.com": 1,
        "space.museum": 1,
        "spb.ru": 1,
        "spjelkavik.no": 1,
        "sport.hu": 1,
        "spy.museum": 1,
        "spydeberg.no": 1,
        "square.museum": 1,
        "sr.gov.pl": 1,
        "sr.it": 1,
        "srv.br": 1,
        "ss.it": 1,
        "st.no": 1,
        "stadt.museum": 1,
        "stalbans.museum": 1,
        "stalowa-wola.pl": 1,
        "stange.no": 1,
        "starachowice.pl": 1,
        "stargard.pl": 1,
        "starnberg.museum": 1,
        "starostwo.gov.pl": 1,
        "stat.no": 1,
        "state.museum": 1,
        "stateofdelaware.museum": 1,
        "stathelle.no": 1,
        "station.museum": 1,
        "stavanger.no": 1,
        "stavern.no": 1,
        "stavropol.ru": 1,
        "steam.museum": 1,
        "steiermark.museum": 1,
        "steigen.no": 1,
        "steinkjer.no": 1,
        "stjohn.museum": 1,
        "stjordal.no": 1,
        "stjordalshalsen.no": 1,
        "stockholm.museum": 1,
        "stokke.no": 1,
        "stor-elvdal.no": 1,
        "stord.no": 1,
        "stordal.no": 1,
        "store.bb": 1,
        "store.nf": 1,
        "store.ro": 1,
        "store.st": 1,
        "store.ve": 1,
        "storfjord.no": 1,
        "stpetersburg.museum": 1,
        "strand.no": 1,
        "stranda.no": 1,
        "stryn.no": 1,
        "student.aero": 1,
        "stuff-4-sale.org": 1,
        "stuff-4-sale.us": 1,
        "stuttgart.museum": 1,
        "stv.ru": 1,
        "sue.fukuoka.jp": 1,
        "suedtirol.it": 1,
        "suginami.tokyo.jp": 1,
        "sugito.saitama.jp": 1,
        "suifu.ibaraki.jp": 1,
        "suisse.museum": 1,
        "suita.osaka.jp": 1,
        "sukagawa.fukushima.jp": 1,
        "sukumo.kochi.jp": 1,
        "sula.no": 1,
        "suldal.no": 1,
        "suli.hu": 1,
        "sumida.tokyo.jp": 1,
        "sumita.iwate.jp": 1,
        "sumoto.hyogo.jp": 1,
        "sumoto.kumamoto.jp": 1,
        "sumy.ua": 1,
        "sunagawa.hokkaido.jp": 1,
        "sund.no": 1,
        "sunndal.no": 1,
        "surgeonshall.museum": 1,
        "surgut.ru": 1,
        "surnadal.no": 1,
        "surrey.museum": 1,
        "susaki.kochi.jp": 1,
        "susono.shizuoka.jp": 1,
        "suwa.nagano.jp": 1,
        "suwalki.pl": 1,
        "suzaka.nagano.jp": 1,
        "suzu.ishikawa.jp": 1,
        "suzuka.mie.jp": 1,
        "sv.it": 1,
        "svalbard.no": 1,
        "sveio.no": 1,
        "svelvik.no": 1,
        "svizzera.museum": 1,
        "sweden.museum": 1,
        "swidnica.pl": 1,
        "swiebodzin.pl": 1,
        "swinoujscie.pl": 1,
        "sx.cn": 1,
        "sydney.museum": 1,
        "sykkylven.no": 1,
        "syzran.ru": 1,
        "szczecin.pl": 1,
        "szczytno.pl": 1,
        "szex.hu": 1,
        "szkola.pl": 1,
        "t.bg": 1,
        "t.se": 1,
        "ta.it": 1,
        "taa.it": 1,
        "tabayama.yamanashi.jp": 1,
        "tabuse.yamaguchi.jp": 1,
        "tachiarai.fukuoka.jp": 1,
        "tachikawa.tokyo.jp": 1,
        "tadaoka.osaka.jp": 1,
        "tado.mie.jp": 1,
        "tadotsu.kagawa.jp": 1,
        "tagajo.miyagi.jp": 1,
        "tagami.niigata.jp": 1,
        "tagawa.fukuoka.jp": 1,
        "tahara.aichi.jp": 1,
        "taiji.wakayama.jp": 1,
        "taiki.hokkaido.jp": 1,
        "taiki.mie.jp": 1,
        "tainai.niigata.jp": 1,
        "taira.toyama.jp": 1,
        "taishi.hyogo.jp": 1,
        "taishi.osaka.jp": 1,
        "taishin.fukushima.jp": 1,
        "taito.tokyo.jp": 1,
        "taiwa.miyagi.jp": 1,
        "tajimi.gifu.jp": 1,
        "tajiri.osaka.jp": 1,
        "taka.hyogo.jp": 1,
        "takagi.nagano.jp": 1,
        "takahagi.ibaraki.jp": 1,
        "takahama.aichi.jp": 1,
        "takahama.fukui.jp": 1,
        "takaharu.miyazaki.jp": 1,
        "takahashi.okayama.jp": 1,
        "takahata.yamagata.jp": 1,
        "takaishi.osaka.jp": 1,
        "takamatsu.kagawa.jp": 1,
        "takamori.kumamoto.jp": 1,
        "takamori.nagano.jp": 1,
        "takanabe.miyazaki.jp": 1,
        "takanezawa.tochigi.jp": 1,
        "takaoka.toyama.jp": 1,
        "takarazuka.hyogo.jp": 1,
        "takasago.hyogo.jp": 1,
        "takasaki.gunma.jp": 1,
        "takashima.shiga.jp": 1,
        "takasu.hokkaido.jp": 1,
        "takata.fukuoka.jp": 1,
        "takatori.nara.jp": 1,
        "takatsuki.osaka.jp": 1,
        "takatsuki.shiga.jp": 1,
        "takayama.gifu.jp": 1,
        "takayama.gunma.jp": 1,
        "takayama.nagano.jp": 1,
        "takazaki.miyazaki.jp": 1,
        "takehara.hiroshima.jp": 1,
        "taketa.oita.jp": 1,
        "taketomi.okinawa.jp": 1,
        "taki.mie.jp": 1,
        "takikawa.hokkaido.jp": 1,
        "takino.hyogo.jp": 1,
        "takinoue.hokkaido.jp": 1,
        "takko.aomori.jp": 1,
        "tako.chiba.jp": 1,
        "taku.saga.jp": 1,
        "tama.tokyo.jp": 1,
        "tamakawa.fukushima.jp": 1,
        "tamaki.mie.jp": 1,
        "tamamura.gunma.jp": 1,
        "tamano.okayama.jp": 1,
        "tamatsukuri.ibaraki.jp": 1,
        "tamayu.shimane.jp": 1,
        "tamba.hyogo.jp": 1,
        "tambov.ru": 1,
        "tana.no": 1,
        "tanabe.kyoto.jp": 1,
        "tanabe.wakayama.jp": 1,
        "tanagura.fukushima.jp": 1,
        "tananger.no": 1,
        "tank.museum": 1,
        "tanohata.iwate.jp": 1,
        "tara.saga.jp": 1,
        "tarama.okinawa.jp": 1,
        "taranto.it": 1,
        "targi.pl": 1,
        "tarnobrzeg.pl": 1,
        "tarui.gifu.jp": 1,
        "tarumizu.kagoshima.jp": 1,
        "tas.au": 1,
        "tas.edu.au": 1,
        "tas.gov.au": 1,
        "tatarstan.ru": 1,
        "tatebayashi.gunma.jp": 1,
        "tateshina.nagano.jp": 1,
        "tateyama.chiba.jp": 1,
        "tateyama.toyama.jp": 1,
        "tatsuno.hyogo.jp": 1,
        "tatsuno.nagano.jp": 1,
        "tawaramoto.nara.jp": 1,
        "taxi.aero": 1,
        "taxi.br": 1,
        "tcm.museum": 1,
        "te.it": 1,
        "te.ua": 1,
        "teaches-yoga.com": 1,
        "tec.ve": 1,
        "technology.museum": 1,
        "tel.tr": 1,
        "teledata.mz": 1,
        "telekommunikation.museum": 1,
        "television.museum": 1,
        "tempio-olbia.it": 1,
        "tempioolbia.it": 1,
        "tendo.yamagata.jp": 1,
        "tenei.fukushima.jp": 1,
        "tenkawa.nara.jp": 1,
        "tenri.nara.jp": 1,
        "teo.br": 1,
        "teramo.it": 1,
        "terni.it": 1,
        "ternopil.ua": 1,
        "teshikaga.hokkaido.jp": 1,
        "test.ru": 1,
        "test.tj": 1,
        "texas.museum": 1,
        "textile.museum": 1,
        "tgory.pl": 1,
        "theater.museum": 1,
        "thruhere.net": 1,
        "time.museum": 1,
        "time.no": 1,
        "timekeeping.museum": 1,
        "tingvoll.no": 1,
        "tinn.no": 1,
        "tj.cn": 1,
        "tjeldsund.no": 1,
        "tjome.no": 1,
        "tm.fr": 1,
        "tm.hu": 1,
        "tm.km": 1,
        "tm.mc": 1,
        "tm.mg": 1,
        "tm.no": 1,
        "tm.pl": 1,
        "tm.ro": 1,
        "tm.se": 1,
        "tmp.br": 1,
        "tn.it": 1,
        "tn.us": 1,
        "to.it": 1,
        "toba.mie.jp": 1,
        "tobe.ehime.jp": 1,
        "tobetsu.hokkaido.jp": 1,
        "tobishima.aichi.jp": 1,
        "tochigi.jp": 1,
        "tochigi.tochigi.jp": 1,
        "tochio.niigata.jp": 1,
        "toda.saitama.jp": 1,
        "toei.aichi.jp": 1,
        "toga.toyama.jp": 1,
        "togakushi.nagano.jp": 1,
        "togane.chiba.jp": 1,
        "togitsu.nagasaki.jp": 1,
        "togo.aichi.jp": 1,
        "togura.nagano.jp": 1,
        "tohma.hokkaido.jp": 1,
        "tohnosho.chiba.jp": 1,
        "toho.fukuoka.jp": 1,
        "tokai.aichi.jp": 1,
        "tokai.ibaraki.jp": 1,
        "tokamachi.niigata.jp": 1,
        "tokashiki.okinawa.jp": 1,
        "toki.gifu.jp": 1,
        "tokigawa.saitama.jp": 1,
        "tokke.no": 1,
        "tokoname.aichi.jp": 1,
        "tokorozawa.saitama.jp": 1,
        "tokushima.jp": 1,
        "tokushima.tokushima.jp": 1,
        "tokuyama.yamaguchi.jp": 1,
        "tokyo.jp": 1,
        "tolga.no": 1,
        "tom.ru": 1,
        "tomakomai.hokkaido.jp": 1,
        "tomari.hokkaido.jp": 1,
        "tome.miyagi.jp": 1,
        "tomi.nagano.jp": 1,
        "tomigusuku.okinawa.jp": 1,
        "tomika.gifu.jp": 1,
        "tomioka.gunma.jp": 1,
        "tomisato.chiba.jp": 1,
        "tomiya.miyagi.jp": 1,
        "tomobe.ibaraki.jp": 1,
        "tomsk.ru": 1,
        "tonaki.okinawa.jp": 1,
        "tonami.toyama.jp": 1,
        "tondabayashi.osaka.jp": 1,
        "tone.ibaraki.jp": 1,
        "tono.iwate.jp": 1,
        "tonosho.kagawa.jp": 1,
        "tonsberg.no": 1,
        "toon.ehime.jp": 1,
        "topology.museum": 1,
        "torahime.shiga.jp": 1,
        "toride.ibaraki.jp": 1,
        "torino.it": 1,
        "torino.museum": 1,
        "torsken.no": 1,
        "tos.it": 1,
        "tosa.kochi.jp": 1,
        "tosashimizu.kochi.jp": 1,
        "toscana.it": 1,
        "toshima.tokyo.jp": 1,
        "tosu.saga.jp": 1,
        "tottori.jp": 1,
        "tottori.tottori.jp": 1,
        "touch.museum": 1,
        "tourism.pl": 1,
        "tourism.tn": 1,
        "towada.aomori.jp": 1,
        "town.museum": 1,
        "toya.hokkaido.jp": 1,
        "toyako.hokkaido.jp": 1,
        "toyama.jp": 1,
        "toyama.toyama.jp": 1,
        "toyo.kochi.jp": 1,
        "toyoake.aichi.jp": 1,
        "toyohashi.aichi.jp": 1,
        "toyokawa.aichi.jp": 1,
        "toyonaka.osaka.jp": 1,
        "toyone.aichi.jp": 1,
        "toyono.osaka.jp": 1,
        "toyooka.hyogo.jp": 1,
        "toyosato.shiga.jp": 1,
        "toyota.aichi.jp": 1,
        "toyota.yamaguchi.jp": 1,
        "toyotomi.hokkaido.jp": 1,
        "toyotsu.fukuoka.jp": 1,
        "toyoura.hokkaido.jp": 1,
        "tozawa.yamagata.jp": 1,
        "tozsde.hu": 1,
        "tp.it": 1,
        "tr.it": 1,
        "tr.no": 1,
        "tra.kp": 1,
        "trader.aero": 1,
        "trading.aero": 1,
        "traeumtgerade.de": 1,
        "trainer.aero": 1,
        "trana.no": 1,
        "tranby.no": 1,
        "trani-andria-barletta.it": 1,
        "trani-barletta-andria.it": 1,
        "traniandriabarletta.it": 1,
        "tranibarlettaandria.it": 1,
        "tranoy.no": 1,
        "transport.museum": 1,
        "trapani.it": 1,
        "travel.pl": 1,
        "travel.tt": 1,
        "trd.br": 1,
        "tree.museum": 1,
        "trentino-a-adige.it": 1,
        "trentino-aadige.it": 1,
        "trentino-alto-adige.it": 1,
        "trentino-altoadige.it": 1,
        "trentino-s-tirol.it": 1,
        "trentino-stirol.it": 1,
        "trentino-sud-tirol.it": 1,
        "trentino-sudtirol.it": 1,
        "trentino-sued-tirol.it": 1,
        "trentino-suedtirol.it": 1,
        "trentino.it": 1,
        "trentinoa-adige.it": 1,
        "trentinoaadige.it": 1,
        "trentinoalto-adige.it": 1,
        "trentinoaltoadige.it": 1,
        "trentinos-tirol.it": 1,
        "trentinostirol.it": 1,
        "trentinosud-tirol.it": 1,
        "trentinosudtirol.it": 1,
        "trentinosued-tirol.it": 1,
        "trentinosuedtirol.it": 1,
        "trento.it": 1,
        "treviso.it": 1,
        "trieste.it": 1,
        "troandin.no": 1,
        "trogstad.no": 1,
        "trolley.museum": 1,
        "tromsa.no": 1,
        "tromso.no": 1,
        "trondheim.no": 1,
        "trust.museum": 1,
        "trustee.museum": 1,
        "trysil.no": 1,
        "ts.it": 1,
        "tsaritsyn.ru": 1,
        "tsk.ru": 1,
        "tsu.mie.jp": 1,
        "tsubame.niigata.jp": 1,
        "tsubata.ishikawa.jp": 1,
        "tsubetsu.hokkaido.jp": 1,
        "tsuchiura.ibaraki.jp": 1,
        "tsuga.tochigi.jp": 1,
        "tsugaru.aomori.jp": 1,
        "tsuiki.fukuoka.jp": 1,
        "tsukigata.hokkaido.jp": 1,
        "tsukiyono.gunma.jp": 1,
        "tsukuba.ibaraki.jp": 1,
        "tsukui.kanagawa.jp": 1,
        "tsukumi.oita.jp": 1,
        "tsumagoi.gunma.jp": 1,
        "tsunan.niigata.jp": 1,
        "tsuno.kochi.jp": 1,
        "tsuno.miyazaki.jp": 1,
        "tsuru.yamanashi.jp": 1,
        "tsuruga.fukui.jp": 1,
        "tsurugashima.saitama.jp": 1,
        "tsurugi.ishikawa.jp": 1,
        "tsuruoka.yamagata.jp": 1,
        "tsuruta.aomori.jp": 1,
        "tsushima.aichi.jp": 1,
        "tsushima.nagasaki.jp": 1,
        "tsuwano.shimane.jp": 1,
        "tsuyama.okayama.jp": 1,
        "tt.im": 1,
        "tula.ru": 1,
        "tur.ar": 1,
        "tur.br": 1,
        "turek.pl": 1,
        "turen.tn": 1,
        "turin.it": 1,
        "turystyka.pl": 1,
        "tuscany.it": 1,
        "tuva.ru": 1,
        "tv.bb": 1,
        "tv.bo": 1,
        "tv.br": 1,
        "tv.im": 1,
        "tv.it": 1,
        "tv.na": 1,
        "tv.sd": 1,
        "tv.tr": 1,
        "tv.tz": 1,
        "tvedestrand.no": 1,
        "tver.ru": 1,
        "tw.cn": 1,
        "tx.us": 1,
        "tychy.pl": 1,
        "tydal.no": 1,
        "tynset.no": 1,
        "tysfjord.no": 1,
        "tysnes.no": 1,
        "tysvar.no": 1,
        "tyumen.ru": 1,
        "u.bg": 1,
        "u.se": 1,
        "ube.yamaguchi.jp": 1,
        "uchihara.ibaraki.jp": 1,
        "uchiko.ehime.jp": 1,
        "uchinada.ishikawa.jp": 1,
        "uchinomi.kagawa.jp": 1,
        "ud.it": 1,
        "uda.nara.jp": 1,
        "udine.it": 1,
        "udm.ru": 1,
        "udmurtia.ru": 1,
        "udono.mie.jp": 1,
        "ueda.nagano.jp": 1,
        "ueno.gunma.jp": 1,
        "uenohara.yamanashi.jp": 1,
        "ug.gov.pl": 1,
        "uhren.museum": 1,
        "uji.kyoto.jp": 1,
        "ujiie.tochigi.jp": 1,
        "ujitawara.kyoto.jp": 1,
        "uk.com": 1,
        "uk.net": 1,
        "uki.kumamoto.jp": 1,
        "ukiha.fukuoka.jp": 1,
        "ulan-ude.ru": 1,
        "ullensaker.no": 1,
        "ullensvang.no": 1,
        "ulm.museum": 1,
        "ulsan.kr": 1,
        "ulvik.no": 1,
        "um.gov.pl": 1,
        "umaji.kochi.jp": 1,
        "umb.it": 1,
        "umbria.it": 1,
        "umi.fukuoka.jp": 1,
        "unazuki.toyama.jp": 1,
        "unbi.ba": 1,
        "undersea.museum": 1,
        "union.aero": 1,
        "univ.sn": 1,
        "university.museum": 1,
        "unjarga.no": 1,
        "unnan.shimane.jp": 1,
        "unsa.ba": 1,
        "unzen.nagasaki.jp": 1,
        "uonuma.niigata.jp": 1,
        "uozu.toyama.jp": 1,
        "upow.gov.pl": 1,
        "urakawa.hokkaido.jp": 1,
        "urasoe.okinawa.jp": 1,
        "urausu.hokkaido.jp": 1,
        "urawa.saitama.jp": 1,
        "urayasu.chiba.jp": 1,
        "urbino-pesaro.it": 1,
        "urbinopesaro.it": 1,
        "ureshino.mie.jp": 1,
        "uri.arpa": 1,
        "urn.arpa": 1,
        "uruma.okinawa.jp": 1,
        "uryu.hokkaido.jp": 1,
        "us-east-1.amazonaws.com": 1,
        "us-gov-west-1.compute.amazonaws.com": 1,
        "us-west-1.compute.amazonaws.com": 1,
        "us-west-2.compute.amazonaws.com": 1,
        "us.com": 1,
        "us.na": 1,
        "us.org": 1,
        "usa.museum": 1,
        "usa.oita.jp": 1,
        "usantiques.museum": 1,
        "usarts.museum": 1,
        "uscountryestate.museum": 1,
        "usculture.museum": 1,
        "usdecorativearts.museum": 1,
        "usgarden.museum": 1,
        "ushiku.ibaraki.jp": 1,
        "ushistory.museum": 1,
        "ushuaia.museum": 1,
        "uslivinghistory.museum": 1,
        "ustka.pl": 1,
        "usui.fukuoka.jp": 1,
        "usuki.oita.jp": 1,
        "ut.us": 1,
        "utah.museum": 1,
        "utashinai.hokkaido.jp": 1,
        "utazas.hu": 1,
        "utazu.kagawa.jp": 1,
        "uto.kumamoto.jp": 1,
        "utsira.no": 1,
        "utsunomiya.tochigi.jp": 1,
        "uvic.museum": 1,
        "uw.gov.pl": 1,
        "uwajima.ehime.jp": 1,
        "uy.com": 1,
        "uz.ua": 1,
        "uzhgorod.ua": 1,
        "v.bg": 1,
        "va.it": 1,
        "va.no": 1,
        "va.us": 1,
        "vaapste.no": 1,
        "vadso.no": 1,
        "vaga.no": 1,
        "vagan.no": 1,
        "vagsoy.no": 1,
        "vaksdal.no": 1,
        "val-d-aosta.it": 1,
        "val-daosta.it": 1,
        "vald-aosta.it": 1,
        "valdaosta.it": 1,
        "valer.hedmark.no": 1,
        "valer.ostfold.no": 1,
        "valle-aosta.it": 1,
        "valle-d-aosta.it": 1,
        "valle-daosta.it": 1,
        "valle.no": 1,
        "valleaosta.it": 1,
        "valled-aosta.it": 1,
        "valledaosta.it": 1,
        "vallee-aoste.it": 1,
        "valleeaoste.it": 1,
        "valley.museum": 1,
        "vang.no": 1,
        "vantaa.museum": 1,
        "vanylven.no": 1,
        "vao.it": 1,
        "vardo.no": 1,
        "varese.it": 1,
        "varggat.no": 1,
        "varoy.no": 1,
        "vb.it": 1,
        "vc.it": 1,
        "vda.it": 1,
        "vdonsk.ru": 1,
        "ve.it": 1,
        "vefsn.no": 1,
        "vega.no": 1,
        "vegarshei.no": 1,
        "ven.it": 1,
        "veneto.it": 1,
        "venezia.it": 1,
        "venice.it": 1,
        "vennesla.no": 1,
        "verbania.it": 1,
        "vercelli.it": 1,
        "verdal.no": 1,
        "verona.it": 1,
        "verran.no": 1,
        "versailles.museum": 1,
        "vestby.no": 1,
        "vestnes.no": 1,
        "vestre-slidre.no": 1,
        "vestre-toten.no": 1,
        "vestvagoy.no": 1,
        "vet.br": 1,
        "veterinaire.fr": 1,
        "veterinaire.km": 1,
        "vevelstad.no": 1,
        "vf.no": 1,
        "vgs.no": 1,
        "vi.it": 1,
        "vi.us": 1,
        "vibo-valentia.it": 1,
        "vibovalentia.it": 1,
        "vic.au": 1,
        "vic.edu.au": 1,
        "vic.gov.au": 1,
        "vicenza.it": 1,
        "video.hu": 1,
        "vik.no": 1,
        "viking.museum": 1,
        "vikna.no": 1,
        "village.museum": 1,
        "vindafjord.no": 1,
        "vinnica.ua": 1,
        "vinnytsia.ua": 1,
        "virginia.museum": 1,
        "virtual.museum": 1,
        "virtuel.museum": 1,
        "viterbo.it": 1,
        "vlaanderen.museum": 1,
        "vladikavkaz.ru": 1,
        "vladimir.ru": 1,
        "vladivostok.ru": 1,
        "vlog.br": 1,
        "vn.ua": 1,
        "voagat.no": 1,
        "volda.no": 1,
        "volgograd.ru": 1,
        "volkenkunde.museum": 1,
        "vologda.ru": 1,
        "volyn.ua": 1,
        "voronezh.ru": 1,
        "voss.no": 1,
        "vossevangen.no": 1,
        "vr.it": 1,
        "vrn.ru": 1,
        "vs.it": 1,
        "vt.it": 1,
        "vt.us": 1,
        "vv.it": 1,
        "vyatka.ru": 1,
        "w.bg": 1,
        "w.se": 1,
        "wa.au": 1,
        "wa.edu.au": 1,
        "wa.gov.au": 1,
        "wa.us": 1,
        "wada.nagano.jp": 1,
        "wajiki.tokushima.jp": 1,
        "wajima.ishikawa.jp": 1,
        "wakasa.fukui.jp": 1,
        "wakasa.tottori.jp": 1,
        "wakayama.jp": 1,
        "wakayama.wakayama.jp": 1,
        "wake.okayama.jp": 1,
        "wakkanai.hokkaido.jp": 1,
        "wakuya.miyagi.jp": 1,
        "walbrzych.pl": 1,
        "wales.museum": 1,
        "wallonie.museum": 1,
        "wanouchi.gifu.jp": 1,
        "war.museum": 1,
        "warabi.saitama.jp": 1,
        "warmia.pl": 1,
        "warszawa.pl": 1,
        "washingtondc.museum": 1,
        "wassamu.hokkaido.jp": 1,
        "watarai.mie.jp": 1,
        "watari.miyagi.jp": 1,
        "watch-and-clock.museum": 1,
        "watchandclock.museum": 1,
        "waw.pl": 1,
        "wazuka.kyoto.jp": 1,
        "web.co": 1,
        "web.do": 1,
        "web.id": 1,
        "web.lk": 1,
        "web.nf": 1,
        "web.pk": 1,
        "web.tj": 1,
        "web.tr": 1,
        "web.ve": 1,
        "webhop.biz": 1,
        "webhop.info": 1,
        "webhop.net": 1,
        "webhop.org": 1,
        "wegrow.pl": 1,
        "western.museum": 1,
        "westfalen.museum": 1,
        "whaling.museum": 1,
        "wi.us": 1,
        "wielun.pl": 1,
        "wiki.br": 1,
        "wildlife.museum": 1,
        "williamsburg.museum": 1,
        "windmill.museum": 1,
        "withgoogle.com": 1,
        "wlocl.pl": 1,
        "wloclawek.pl": 1,
        "wodzislaw.pl": 1,
        "wolomin.pl": 1,
        "workinggroup.aero": 1,
        "works.aero": 1,
        "workshop.museum": 1,
        "worse-than.tv": 1,
        "writesthisblog.com": 1,
        "wroc.pl": 1,
        "wroclaw.pl": 1,
        "ws.na": 1,
        "wv.us": 1,
        "www.ck": 1,
        "www.ro": 1,
        "wy.us": 1,
        "x.bg": 1,
        "x.se": 1,
        "xj.cn": 1,
        "xn--55qx5d.cn": 1,
        "xn--55qx5d.hk": 1,
        "xn--80au.xn--90a3ac": 1,
        "xn--90azh.xn--90a3ac": 1,
        "xn--9dbhblg6di.museum": 1,
        "xn--andy-ira.no": 1,
        "xn--aroport-bya.ci": 1,
        "xn--asky-ira.no": 1,
        "xn--aurskog-hland-jnb.no": 1,
        "xn--avery-yua.no": 1,
        "xn--b-5ga.nordland.no": 1,
        "xn--b-5ga.telemark.no": 1,
        "xn--bdddj-mrabd.no": 1,
        "xn--bearalvhki-y4a.no": 1,
        "xn--berlevg-jxa.no": 1,
        "xn--bhcavuotna-s4a.no": 1,
        "xn--bhccavuotna-k7a.no": 1,
        "xn--bidr-5nac.no": 1,
        "xn--bievt-0qa.no": 1,
        "xn--bjarky-fya.no": 1,
        "xn--bjddar-pta.no": 1,
        "xn--blt-elab.no": 1,
        "xn--bmlo-gra.no": 1,
        "xn--bod-2na.no": 1,
        "xn--brnny-wuac.no": 1,
        "xn--brnnysund-m8ac.no": 1,
        "xn--brum-voa.no": 1,
        "xn--btsfjord-9za.no": 1,
        "xn--c1avg.xn--90a3ac": 1,
        "xn--ciqpn.hk": 1,
        "xn--comunicaes-v6a2o.museum": 1,
        "xn--correios-e-telecomunicaes-ghc29a.museum": 1,
        "xn--czrw28b.tw": 1,
        "xn--d1at.xn--90a3ac": 1,
        "xn--davvenjrga-y4a.no": 1,
        "xn--dnna-gra.no": 1,
        "xn--drbak-wua.no": 1,
        "xn--dyry-ira.no": 1,
        "xn--eveni-0qa01ga.no": 1,
        "xn--finny-yua.no": 1,
        "xn--fjord-lra.no": 1,
        "xn--fl-zia.no": 1,
        "xn--flor-jra.no": 1,
        "xn--frde-gra.no": 1,
        "xn--frna-woa.no": 1,
        "xn--frya-hra.no": 1,
        "xn--ggaviika-8ya47h.no": 1,
        "xn--gildeskl-g0a.no": 1,
        "xn--givuotna-8ya.no": 1,
        "xn--gjvik-wua.no": 1,
        "xn--gls-elac.no": 1,
        "xn--gmq050i.hk": 1,
        "xn--gmqw5a.hk": 1,
        "xn--h-2fa.no": 1,
        "xn--h1aegh.museum": 1,
        "xn--hbmer-xqa.no": 1,
        "xn--hcesuolo-7ya35b.no": 1,
        "xn--hery-ira.nordland.no": 1,
        "xn--hery-ira.xn--mre-og-romsdal-qqb.no": 1,
        "xn--hgebostad-g3a.no": 1,
        "xn--hmmrfeasta-s4ac.no": 1,
        "xn--hnefoss-q1a.no": 1,
        "xn--hobl-ira.no": 1,
        "xn--holtlen-hxa.no": 1,
        "xn--hpmir-xqa.no": 1,
        "xn--hyanger-q1a.no": 1,
        "xn--hylandet-54a.no": 1,
        "xn--indery-fya.no": 1,
        "xn--io0a7i.cn": 1,
        "xn--io0a7i.hk": 1,
        "xn--jlster-bya.no": 1,
        "xn--jrpeland-54a.no": 1,
        "xn--karmy-yua.no": 1,
        "xn--kfjord-iua.no": 1,
        "xn--klbu-woa.no": 1,
        "xn--koluokta-7ya57h.no": 1,
        "xn--krager-gya.no": 1,
        "xn--kranghke-b0a.no": 1,
        "xn--krdsherad-m8a.no": 1,
        "xn--krehamn-dxa.no": 1,
        "xn--krjohka-hwab49j.no": 1,
        "xn--ksnes-uua.no": 1,
        "xn--kvfjord-nxa.no": 1,
        "xn--kvitsy-fya.no": 1,
        "xn--kvnangen-k0a.no": 1,
        "xn--l-1fa.no": 1,
        "xn--laheadju-7ya.no": 1,
        "xn--langevg-jxa.no": 1,
        "xn--lcvr32d.hk": 1,
        "xn--ldingen-q1a.no": 1,
        "xn--leagaviika-52b.no": 1,
        "xn--lesund-hua.no": 1,
        "xn--lgrd-poac.no": 1,
        "xn--lhppi-xqa.no": 1,
        "xn--linds-pra.no": 1,
        "xn--lns-qla.museum": 1,
        "xn--loabt-0qa.no": 1,
        "xn--lrdal-sra.no": 1,
        "xn--lrenskog-54a.no": 1,
        "xn--lt-liac.no": 1,
        "xn--lten-gra.no": 1,
        "xn--lury-ira.no": 1,
        "xn--mely-ira.no": 1,
        "xn--merker-kua.no": 1,
        "xn--mgba3a4f16a.ir": 1,
        "xn--mgba3a4fra.ir": 1,
        "xn--mjndalen-64a.no": 1,
        "xn--mk0axi.hk": 1,
        "xn--mlatvuopmi-s4a.no": 1,
        "xn--mli-tla.no": 1,
        "xn--mlselv-iua.no": 1,
        "xn--moreke-jua.no": 1,
        "xn--mori-qsa.nz": 1,
        "xn--mosjen-eya.no": 1,
        "xn--mot-tla.no": 1,
        "xn--msy-ula0h.no": 1,
        "xn--mtta-vrjjat-k7af.no": 1,
        "xn--muost-0qa.no": 1,
        "xn--mxtq1m.hk": 1,
        "xn--nmesjevuemie-tcba.no": 1,
        "xn--nry-yla5g.no": 1,
        "xn--nttery-byae.no": 1,
        "xn--nvuotna-hwa.no": 1,
        "xn--o1ac.xn--90a3ac": 1,
        "xn--o1ach.xn--90a3ac": 1,
        "xn--od0alg.cn": 1,
        "xn--od0alg.hk": 1,
        "xn--od0aq3b.hk": 1,
        "xn--oppegrd-ixa.no": 1,
        "xn--ostery-fya.no": 1,
        "xn--osyro-wua.no": 1,
        "xn--porsgu-sta26f.no": 1,
        "xn--rady-ira.no": 1,
        "xn--rdal-poa.no": 1,
        "xn--rde-ula.no": 1,
        "xn--rdy-0nab.no": 1,
        "xn--rennesy-v1a.no": 1,
        "xn--rhkkervju-01af.no": 1,
        "xn--rholt-mra.no": 1,
        "xn--risa-5na.no": 1,
        "xn--risr-ira.no": 1,
        "xn--rland-uua.no": 1,
        "xn--rlingen-mxa.no": 1,
        "xn--rmskog-bya.no": 1,
        "xn--rros-gra.no": 1,
        "xn--rskog-uua.no": 1,
        "xn--rst-0na.no": 1,
        "xn--rsta-fra.no": 1,
        "xn--ryken-vua.no": 1,
        "xn--ryrvik-bya.no": 1,
        "xn--s-1fa.no": 1,
        "xn--sandnessjen-ogb.no": 1,
        "xn--sandy-yua.no": 1,
        "xn--seral-lra.no": 1,
        "xn--sgne-gra.no": 1,
        "xn--skierv-uta.no": 1,
        "xn--skjervy-v1a.no": 1,
        "xn--skjk-soa.no": 1,
        "xn--sknit-yqa.no": 1,
        "xn--sknland-fxa.no": 1,
        "xn--slat-5na.no": 1,
        "xn--slt-elab.no": 1,
        "xn--smla-hra.no": 1,
        "xn--smna-gra.no": 1,
        "xn--snase-nra.no": 1,
        "xn--sndre-land-0cb.no": 1,
        "xn--snes-poa.no": 1,
        "xn--snsa-roa.no": 1,
        "xn--sr-aurdal-l8a.no": 1,
        "xn--sr-fron-q1a.no": 1,
        "xn--sr-odal-q1a.no": 1,
        "xn--sr-varanger-ggb.no": 1,
        "xn--srfold-bya.no": 1,
        "xn--srreisa-q1a.no": 1,
        "xn--srum-gra.no": 1,
        "xn--stjrdal-s1a.no": 1,
        "xn--stjrdalshalsen-sqb.no": 1,
        "xn--stre-toten-zcb.no": 1,
        "xn--tjme-hra.no": 1,
        "xn--tn0ag.hk": 1,
        "xn--tnsberg-q1a.no": 1,
        "xn--trany-yua.no": 1,
        "xn--trgstad-r1a.no": 1,
        "xn--trna-woa.no": 1,
        "xn--troms-zua.no": 1,
        "xn--tysvr-vra.no": 1,
        "xn--uc0atv.hk": 1,
        "xn--uc0atv.tw": 1,
        "xn--uc0ay4a.hk": 1,
        "xn--unjrga-rta.no": 1,
        "xn--vads-jra.no": 1,
        "xn--vard-jra.no": 1,
        "xn--vegrshei-c0a.no": 1,
        "xn--vestvgy-ixa6o.no": 1,
        "xn--vg-yiab.no": 1,
        "xn--vgan-qoa.no": 1,
        "xn--vgsy-qoa0j.no": 1,
        "xn--vler-qoa.hedmark.no": 1,
        "xn--vler-qoa.xn--stfold-9xa.no": 1,
        "xn--vre-eiker-k8a.no": 1,
        "xn--vrggt-xqad.no": 1,
        "xn--vry-yla5g.no": 1,
        "xn--wcvs22d.hk": 1,
        "xn--yer-zna.no": 1,
        "xn--ygarden-p1a.no": 1,
        "xn--ystre-slidre-ujb.no": 1,
        "xn--zf0ao64a.tw": 1,
        "xn--zf0avx.hk": 1,
        "xz.cn": 1,
        "y.bg": 1,
        "y.se": 1,
        "yabu.hyogo.jp": 1,
        "yabuki.fukushima.jp": 1,
        "yachimata.chiba.jp": 1,
        "yachiyo.chiba.jp": 1,
        "yachiyo.ibaraki.jp": 1,
        "yaese.okinawa.jp": 1,
        "yahaba.iwate.jp": 1,
        "yahiko.niigata.jp": 1,
        "yaita.tochigi.jp": 1,
        "yaizu.shizuoka.jp": 1,
        "yakage.okayama.jp": 1,
        "yakumo.hokkaido.jp": 1,
        "yakumo.shimane.jp": 1,
        "yakutia.ru": 1,
        "yalta.ua": 1,
        "yamada.fukuoka.jp": 1,
        "yamada.iwate.jp": 1,
        "yamada.toyama.jp": 1,
        "yamaga.kumamoto.jp": 1,
        "yamagata.gifu.jp": 1,
        "yamagata.ibaraki.jp": 1,
        "yamagata.jp": 1,
        "yamagata.nagano.jp": 1,
        "yamagata.yamagata.jp": 1,
        "yamaguchi.jp": 1,
        "yamakita.kanagawa.jp": 1,
        "yamal.ru": 1,
        "yamamoto.miyagi.jp": 1,
        "yamanakako.yamanashi.jp": 1,
        "yamanashi.jp": 1,
        "yamanashi.yamanashi.jp": 1,
        "yamanobe.yamagata.jp": 1,
        "yamanouchi.nagano.jp": 1,
        "yamashina.kyoto.jp": 1,
        "yamato.fukushima.jp": 1,
        "yamato.kanagawa.jp": 1,
        "yamato.kumamoto.jp": 1,
        "yamatokoriyama.nara.jp": 1,
        "yamatotakada.nara.jp": 1,
        "yamatsuri.fukushima.jp": 1,
        "yamazoe.nara.jp": 1,
        "yame.fukuoka.jp": 1,
        "yanagawa.fukuoka.jp": 1,
        "yanaizu.fukushima.jp": 1,
        "yao.osaka.jp": 1,
        "yaotsu.gifu.jp": 1,
        "yaroslavl.ru": 1,
        "yasaka.nagano.jp": 1,
        "yashio.saitama.jp": 1,
        "yashiro.hyogo.jp": 1,
        "yasu.shiga.jp": 1,
        "yasuda.kochi.jp": 1,
        "yasugi.shimane.jp": 1,
        "yasuoka.nagano.jp": 1,
        "yatomi.aichi.jp": 1,
        "yatsuka.shimane.jp": 1,
        "yatsushiro.kumamoto.jp": 1,
        "yawara.ibaraki.jp": 1,
        "yawata.kyoto.jp": 1,
        "yawatahama.ehime.jp": 1,
        "yazu.tottori.jp": 1,
        "yekaterinburg.ru": 1,
        "yk.ca": 1,
        "yn.cn": 1,
        "yoichi.hokkaido.jp": 1,
        "yoita.niigata.jp": 1,
        "yoka.hyogo.jp": 1,
        "yokaichiba.chiba.jp": 1,
        "yokawa.hyogo.jp": 1,
        "yokkaichi.mie.jp": 1,
        "yokohama.jp": 1,
        "yokoshibahikari.chiba.jp": 1,
        "yokosuka.kanagawa.jp": 1,
        "yokote.akita.jp": 1,
        "yokoze.saitama.jp": 1,
        "yolasite.com": 1,
        "yomitan.okinawa.jp": 1,
        "yonabaru.okinawa.jp": 1,
        "yonago.tottori.jp": 1,
        "yonaguni.okinawa.jp": 1,
        "yonezawa.yamagata.jp": 1,
        "yono.saitama.jp": 1,
        "yorii.saitama.jp": 1,
        "york.museum": 1,
        "yorkshire.museum": 1,
        "yoro.gifu.jp": 1,
        "yosemite.museum": 1,
        "yoshida.saitama.jp": 1,
        "yoshida.shizuoka.jp": 1,
        "yoshikawa.saitama.jp": 1,
        "yoshimi.saitama.jp": 1,
        "yoshino.nara.jp": 1,
        "yoshinogari.saga.jp": 1,
        "yoshioka.gunma.jp": 1,
        "yotsukaido.chiba.jp": 1,
        "youth.museum": 1,
        "yuasa.wakayama.jp": 1,
        "yufu.oita.jp": 1,
        "yugawa.fukushima.jp": 1,
        "yugawara.kanagawa.jp": 1,
        "yuki.ibaraki.jp": 1,
        "yukuhashi.fukuoka.jp": 1,
        "yura.wakayama.jp": 1,
        "yurihonjo.akita.jp": 1,
        "yusuhara.kochi.jp": 1,
        "yusui.kagoshima.jp": 1,
        "yuu.yamaguchi.jp": 1,
        "yuza.yamagata.jp": 1,
        "yuzawa.niigata.jp": 1,
        "yuzhno-sakhalinsk.ru": 1,
        "z-1.compute-1.amazonaws.com": 1,
        "z-2.compute-1.amazonaws.com": 1,
        "z.bg": 1,
        "z.se": 1,
        "za.bz": 1,
        "za.com": 1,
        "za.net": 1,
        "za.org": 1,
        "zachpomor.pl": 1,
        "zagan.pl": 1,
        "zakopane.pl": 1,
        "zama.kanagawa.jp": 1,
        "zamami.okinawa.jp": 1,
        "zao.miyagi.jp": 1,
        "zaporizhzhe.ua": 1,
        "zaporizhzhia.ua": 1,
        "zarow.pl": 1,
        "zentsuji.kagawa.jp": 1,
        "zgora.pl": 1,
        "zgorzelec.pl": 1,
        "zgrad.ru": 1,
        "zhitomir.ua": 1,
        "zhytomyr.ua": 1,
        "zj.cn": 1,
        "zlg.br": 1,
        "zoological.museum": 1,
        "zoology.museum": 1,
        "zp.ua": 1,
        "zt.ua": 1,
        "zushi.kanagawa.jp": 1
    };

    api.url = UrlUtils;

})(adguard.utils, window);

/**
 * Simple mediator
 */
adguard.listeners = (function () {

    var EventNotifierTypesMap = {
        ADD_RULES: "event.add.rules",
        REMOVE_RULE: "event.remove.rule",
        UPDATE_FILTER_RULES: "event.update.filter.rules",
        FILTER_ENABLE_DISABLE: "event.filter.enable.disable", // Enabled or disabled
        FILTER_ADD_REMOVE: "event.filter.add.remove", // Added or removed
        ADS_BLOCKED: "event.ads.blocked",
        START_DOWNLOAD_FILTER: "event.start.download.filter",
        SUCCESS_DOWNLOAD_FILTER: "event.success.download.filter",
        ERROR_DOWNLOAD_FILTER: "event.error.download.filter",
        ENABLE_FILTER_SHOW_POPUP: "event.enable.filter.show.popup",
        LOG_EVENT: "event.log.track",
        UPDATE_TAB_BUTTON_STATE: "event.update.tab.button.state",
        REQUEST_FILTER_UPDATED: "event.request.filter.updated",
        APPLICATION_INITIALIZED: "event.application.initialized",
        CHANGE_PREFS: "event.change.prefs",
        UPDATE_FILTERS_SHOW_POPUP: "event.update.filters.show.popup",
        UPDATE_USER_FILTER_RULES: "event.update.user.filter.rules",
        UPDATE_WHITELIST_FILTER_RULES: "event.update.whitelist.filter.rules",
        CONTENT_BLOCKER_UPDATED: "event.content.blocker.updated",
        // Log events
        TAB_ADDED: 'log.tab.added',
        TAB_CLOSE: 'log.tab.close',
        TAB_UPDATE: 'log.tab.update',
        TAB_RESET: 'log.tab.reset',
        LOG_EVENT_ADDED: 'log.event.added'
    };

    var EventNotifierEventsMap = Object.create(null);

    var EventNotifier = {

        listenersMap: Object.create(null),
        listenersEventsMap: Object.create(null),
        listenerId: 0,

        /**
         * Subscribes listener to the specified events
         *
         * @param events    List of event types listener will be notified of
         * @param listener  Listener object
         * @returns Index of the listener
         */
        addSpecifiedListener: function (events, listener) {
            if (typeof listener !== 'function') {
                throw new Error('Illegal listener');
            }
            var listenerId = this.listenerId++;
            this.listenersMap[listenerId] = listener;
            this.listenersEventsMap[listenerId] = events;
            return listenerId;
        },

        /**
         * Subscribe specified listener to all events
         *
         * @param listener Listener
         * @returns Index of the listener
         */
        addListener: function (listener) {
            if (typeof listener !== 'function') {
                throw new Error('Illegal listener');
            }
            var listenerId = this.listenerId++;
            this.listenersMap[listenerId] = listener;
            return listenerId;
        },

        /**
         * Unsubscribe listener
         * @param listenerId Index of listener to unsubscribe
         */
        removeListener: function (listenerId) {
            delete this.listenersMap[listenerId];
            delete this.listenersEventsMap[listenerId];
        },

        /**
         * Notifies listeners about the events passed as arguments of this function.
         */
        notifyListeners: function () {
            var event = arguments[0];
            if (!event || !(event in EventNotifierEventsMap)) {
                throw new Error('Illegal event: ' + event);
            }
            for (var listenerId in this.listenersMap) { // jshint ignore:line
                var events = this.listenersEventsMap[listenerId];
                if (events && events.length > 0 && events.indexOf(event) < 0) {
                    continue;
                }
                try {
                    var listener = this.listenersMap[listenerId];
                    listener.apply(listener, arguments);
                } catch (ex) {
                    adguard.console.error("Error invoking listener for {0} cause: {1}", event, ex);
                }
            }
        },

        /**
         * Asynchronously notifies all listeners about the events passed as arguments of this function.
         * Some events should be dispatched asynchronously, for instance this is very important for Safari:
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/251
         */
        notifyListenersAsync: function () {
            var args = arguments;
            setTimeout(function () {
                EventNotifier.notifyListeners.apply(EventNotifier, args);
            }, 500);
        }
    };

    // Make accessible only constants without functions. They will be passed to content-page
    EventNotifier.events = EventNotifierTypesMap;

    // Copy global properties
    for (var key in EventNotifierTypesMap) {
        if (EventNotifierTypesMap.hasOwnProperty(key)) {
            var event = EventNotifierTypesMap[key];
            EventNotifier[key] = event;
            if (event in EventNotifierEventsMap) {
                throw new Error('Duplicate event:  ' + event);
            }
            EventNotifierEventsMap[event] = key;
        }
    }

    return EventNotifier;

})();

/* global safari */

(function (adguard, api) {

    /**
     * Extension version (x.x.x)
     * @param version
     * @constructor
     */
    var Version = function (version) {

        this.version = Object.create(null);

        var parts = String(version || "").split(".");

        function parseVersionPart(part) {
            if (isNaN(part)) {
                return 0;
            }
            return Math.max(part - 0, 0);
        }

        for (var i = 3; i >= 0; i--) {
            this.version[i] = parseVersionPart(parts[i]);
        }
    };

    /**
     * Compares with other version
     * @param o
     * @returns {number}
     */
    Version.prototype.compare = function (o) {
        for (var i = 0; i < 4; i++) {
            if (this.version[i] > o.version[i]) {
                return 1;
            } else if (this.version[i] < o.version[i]) {
                return -1;
            }
        }
        return 0;
    };

    var objectContentTypes = '.jar.swf.';
    var mediaContentTypes = '.mp4.flv.avi.m3u.webm.mpeg.3gp.3gpp.3g2.3gpp2.ogg.mov.qt.';
    var fontContentTypes = '.ttf.otf.woff.woff2.eot.';
    var imageContentTypes = '.ico.png.gif.jpg.jpeg.webp.';

    //noinspection UnnecessaryLocalVariableJS
    var Utils = {

        getClientId: function () {

            var clientId = adguard.localStorage.getItem("client-id");
            if (!clientId) {
                var result = [];
                var suffix = (Date.now()) % 1e8;
                var symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890';
                for (var i = 0; i < 8; i++) {
                    var symbol = symbols[Math.floor(Math.random() * symbols.length)];
                    result.push(symbol);
                }
                clientId = result.join('') + suffix;
                adguard.localStorage.setItem("client-id", clientId);
            }

            return clientId;
        },

        /**
         * Checks if left version is greater than the right version
         */
        isGreaterVersion: function (leftVersion, rightVersion) {
            var left = new Version(leftVersion);
            var right = new Version(rightVersion);
            return left.compare(right) > 0;
        },

        isGreaterOrEqualsVersion: function (leftVersion, rightVersion) {
            var left = new Version(leftVersion);
            var right = new Version(rightVersion);
            return left.compare(right) >= 0;
        },

        /**
         * @returns Extension version
         */
        getAppVersion: function () {
            return adguard.localStorage.getItem("app-version");
        },

        setAppVersion: function (version) {
            adguard.localStorage.setItem("app-version", version);
        },

        isYaBrowser: function () {
            return adguard.prefs.browser === "YaBrowser";
        },

        isOperaBrowser: function () {
            return adguard.prefs.browser === "Opera";
        },

        isSafariBrowser: function () {
            return adguard.prefs.browser === "Safari";
        },

        isEdgeBrowser: function () {
            return adguard.prefs.browser === "Edge";
        },

        isSafari9Plus: function () {
            return adguard.prefs.browser === "Safari" &&
                this.isGreaterOrEqualsVersion(adguard.prefs.safariVersion, "9.0");
        },

        isFirefoxBrowser: function () {
            return adguard.prefs.browser === "Firefox" || adguard.prefs.browser === "Android";
        },

        isChromeBrowser: function () {
            return adguard.prefs.browser === "Chrome";
        },

        isChromium: function () {
            return adguard.prefs.platform === 'chromium';
        },

        isWindowsOs: function () {
            return navigator.userAgent.toLowerCase().indexOf("win") >= 0;
        },

        isMacOs: function () {
            return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        },

        /**
         * Returns true if Shadow DOM is supported.
         * http://caniuse.com/#feat=shadowdom
         *
         * In this case we transform CSS selectors and inject CSS to shadow DOM.
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/44
         */
        isShadowDomSupported: function () {

            // Shadow DOM is supported by all modern chromium browsers
            return this.isChromium();
        },

        /**
         * Returns true if Safari content blocker API is supported
         */
        isContentBlockerEnabled: function () {

            if (typeof safari === 'undefined' || !this.isSafari9Plus()) {
                return false;
            }

            if (typeof this._useOldSafariAPI === 'undefined') {
                // Seems that getItem returns a string
                // Cast it to string as I don't understand why it's type randomly changes (in dev build it is string, in beta - boolean)
                this._useOldSafariAPI = (String(safari.extension.settings.getItem('useOldSafariAPI')) === 'true');
            }

            return !this._useOldSafariAPI;
        },

        findHeaderByName: function (headers, headerName) {
            if (headers) {
                for (var i = 0; i < headers.length; i++) {
                    var header = headers[i];
                    if (header.name === headerName) {
                        return header;
                    }
                }
            }
            return null;
        },

        /**
         * Set header value. Only for Chrome
         * @param headers
         * @param headerName
         * @param headerValue
         */
        setHeaderValue: function (headers, headerName, headerValue) {
            if (!headers) {
                headers = [];
            }
            var header = this.findHeaderByName(headers, headerName);
            if (header) {
                header.value = headerValue;
            } else {
                headers.push({name: headerName, value: headerValue});
            }
            return headers;
        },

        getSafebrowsingBackUrl: function (tab) {
            //https://code.google.com/p/chromium/issues/detail?id=11854
            var previousUrl = adguard.tabs.getTabMetadata(tab.tabId, 'previousUrl');
            if (previousUrl && previousUrl.indexOf('http') === 0) {
                return previousUrl;
            }
            var referrerUrl = adguard.tabs.getTabMetadata(tab.tabId, 'referrerUrl');
            if (referrerUrl && referrerUrl.indexOf('http') === 0) {
                return referrerUrl;
            }
            if (this.isFirefoxBrowser()) {
                return 'about:newtab';
            } else if (this.isSafariBrowser()) {
                return 'about:blank';
            } else {
                return 'about:newtab';
            }
        },

        /**
         * Parse content type from path
         * @param path Path
         * @returns {*} content type (adguard.RequestTypes.*) or null
         */
        parseContentTypeFromUrlPath: function (path) {

            var ext = path.slice(-6);
            var pos = ext.lastIndexOf('.');

            // Unable to parse extension from url
            if (pos === -1) {
                return null;
            }

            ext = ext.slice(pos) + '.';
            if (objectContentTypes.indexOf(ext) !== -1) {
                return adguard.RequestTypes.OBJECT;
            }
            if (mediaContentTypes.indexOf(ext) !== -1) {
                return adguard.RequestTypes.MEDIA;
            }
            if (fontContentTypes.indexOf(ext) !== -1) {
                return adguard.RequestTypes.FONT;
            }
            if (imageContentTypes.indexOf(ext) !== -1) {
                return adguard.RequestTypes.IMAGE;
            }

            return null;
        },

        /**
         * Retrieve languages from navigator
         * @param limit Limit of preferred languages
         * @returns {Array}
         */
        getNavigatorLanguages: function (limit) {
            var languages = [];
            // https://developer.mozilla.org/ru/docs/Web/API/NavigatorLanguage/languages
            if (adguard.utils.collections.isArray(navigator.languages)) {
                languages = navigator.languages.slice(0, limit);
            } else if (navigator.language) {
                languages.push(navigator.language); // .language is first in .languages
            }
            return languages;
        }
    };

    api.browser = Utils;

})(adguard, adguard.utils);

adguard.backend = (function (adguard) {

    'use strict';

    /**
     * Class for working with our backend server.
     * All requests sent by this class are covered in the privacy policy:
     * http://adguard.com/en/privacy.html#browsers
     */

    /**
     * Settings
     */
    var settings = {

        // Base url of our backend server
        get backendUrl() {
            return "https://chrome.adtidy.org";
        },

        get apiKey() {
            return "4DDBE80A3DA94D819A00523252FB6380";
        },

        // Url for load filters metadata and rules
        get filtersUrl() {
            return adguard.lazyGet(this, 'filtersUrl', function () {
                if (adguard.utils.browser.isFirefoxBrowser()) {
                    return 'https://filters.adtidy.org/extension/firefox';
                } else if (adguard.utils.browser.isSafariBrowser()) {
                    return 'https://filters.adtidy.org/extension/safari';
                } else {
                    return 'https://filters.adtidy.org/extension/chromium';
                }
            });
        },

        // URL for downloading AG filters
        get filterRulesUrl() {
            return this.filtersUrl + "/filters/{filter_id}.txt";
        },

        // URL for downloading optimized AG filters
        get optimizedFilterRulesUrl() {
            return this.filtersUrl + "/filters/{filter_id}_optimized.txt";
        },

        // URL for checking filter updates
        get filtersMetadataUrl() {
            return this.filtersUrl + "/filters.json";
        },

        // URL for user complaints on missed ads or malware/phishing websites
        get reportUrl() {
            return this.backendUrl + "/url-report.html";
        },

        // URL for tracking Adguard installation
        get trackInstallUrl() {
            return this.backendUrl + "/install.html?";
        },

        /**
         * URL for collecting filter rules statistics.
         * We do not collect it by default, unless user is willing to help.
         *
         * Filter rules stats are covered in our privacy policy and on also here:
         * http://adguard.com/en/filter-rules-statistics.html
         */
        get ruleStatsUrl() {
            return this.backendUrl + "/rulestats.html";
        },

        /**
         * Browsing Security lookups. In case of Firefox lookups are disabled for HTTPS urls.
         */
        get safebrowsingLookupUrl() {
            return "https://sb.adtidy.org/safebrowsing-lookup-hash.html";
        },

        /**
         * URL for collecting Browsing Security stats.
         * We do not collect it by default, unless user is willing to help.
         * For now - blocked urls are reported only.
         */
        get safebrowsingStatsUrl() {
            return "https://sb.adtidy.org/sb-report.html";
        },

        // This url is used in integration mode. Adguard for Windows/Mac/Android intercepts requests to injections.adguard.com host.
        // It is not used for remote requests, requests are intercepted by the desktop version of Adguard.
        get injectionsUrl() {
            return "http://injections.adguard.com";
        },

        // URLs used when add-on works in integration mode.
        // @deprecated
        get adguardAppUrlOld() {
            return this.injectionsUrl + "/adguard-ajax-crossdomain-hack/api?";
        },
        get adguardAppUrl() {
            return this.injectionsUrl + "/adguard-ajax-api/api?";
        },
        // Folder that contains filters metadata and files with rules. 'filters' by default
        get localFiltersFolder() {
            return 'filters';
        },
        // Array of filter identifiers, that have local file with rules. Range from 1 to 14 by default
        get localFilterIds() {
            return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
        }
    };

    /**
     * Loading subscriptions map
     */
    var loadingSubscriptions = Object.create(null);

    /**
     * Tracks event info: install, uninstall etc
     * @param trackUrl
     * @param isAllowedAcceptableAds
     */
    function trackInfo(trackUrl, isAllowedAcceptableAds) {
        try {
            var clientId = encodeURIComponent(adguard.utils.browser.getClientId());
            var locale = encodeURIComponent(adguard.app.getLocale());
            var version = encodeURIComponent(adguard.app.getVersion());
            var whiteListEnabled = encodeURIComponent(isAllowedAcceptableAds);

            var params = [];
            params.push("id=" + clientId);
            params.push("l=" + locale);
            params.push("v=" + version);
            params.push("wlen=" + whiteListEnabled);

            var url = trackUrl + params.join("&");
            url = addKeyParameter(url);

            executeRequestAsync(url, "text/plain");

        } catch (ex) {
            adguard.console.error('Error track {0}, cause: {1}', trackUrl, ex);
        }
    }

    /**
     * Load filter rules.
     * Parse header and rules.
     * Response format:
     * HEADER
     * rule1
     * rule2
     * ...
     * ruleN
     *
     * @param filterId Filter identifier
     * @param url Url for loading rules
     * @param successCallback Success callback (version, rules)
     * @param errorCallback Error callback (response, errorText)
     * @private
     */
    function doLoadFilterRules(filterId, url, successCallback, errorCallback) {

        var success = function (response) {

            var responseText = response.responseText;
            if (!responseText) {
                errorCallback(response, "filter rules missing");
                return;
            }

            var lines = responseText.split(/[\r\n]+/);

            var rules = [];
            for (var i = 0; i < lines.length; i++) {
                var rule = adguard.rules.builder.createRule(lines[i], filterId);
                if (rule !== null) {
                    rules.push(rule);
                }
            }

            successCallback(rules);

        };

        executeRequestAsync(url, "text/plain", success, errorCallback);
    }

    /**
     * Executes async request
     * @param url Url
     * @param contentType Content type
     * @param successCallback success callback
     * @param errorCallback error callback
     */
    function executeRequestAsync(url, contentType, successCallback, errorCallback) {

        var request = new XMLHttpRequest();
        try {
            request.open('GET', url);
            request.setRequestHeader('Content-type', contentType);
            request.setRequestHeader('Pragma', 'no-cache');
            request.overrideMimeType(contentType);
            request.mozBackgroundRequest = true;
            if (successCallback) {
                request.onload = function () {
                    successCallback(request);
                };
            }
            if (errorCallback) {
                var errorCallbackWrapper = function () {
                    errorCallback(request);
                };
                request.onerror = errorCallbackWrapper;
                request.onabort = errorCallbackWrapper;
                request.ontimeout = errorCallbackWrapper;
            }
            request.send(null);
        } catch (ex) {
            if (errorCallback) {
                errorCallback(request, ex);
            }
        }
    }

    /**
     * URL for downloading AG filter
     *
     * @param filterId Filter identifier
     * @param useOptimizedFilters
     * @private
     */
    function getUrlForDownloadFilterRules(filterId, useOptimizedFilters) {
        var url = useOptimizedFilters ? settings.optimizedFilterRulesUrl : settings.filterRulesUrl;
        return adguard.utils.strings.replaceAll(url, '{filter_id}', filterId);
    }

    /**
     * Appends request key to url
     */
    function addKeyParameter(url) {
        return url + "&key=" + settings.apiKey;
    }

    /**
     * Safe json parsing
     * @param text
     * @private
     */
    function parseJson(text) {
        try {
            return JSON.parse(text);
        } catch (ex) {
            adguard.console.error('Error parse json {0}', ex);
            return null;
        }
    }

    /**
     * Load metadata of the specified filters
     *
     * @param filterIds         Filters identifiers
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    var loadFiltersMetadata = function (filterIds, successCallback, errorCallback) {

        if (!filterIds || filterIds.length === 0) {
            successCallback([]);
            return;
        }

        var success = function (response) {
            if (response && response.responseText) {
                var metadata = parseJson(response.responseText);
                if (!metadata) {
                    errorCallback(response, "invalid response");
                    return;
                }
                var filterMetadataList = [];
                for (var i = 0; i < filterIds.length; i++) {
                    var filter = adguard.utils.collections.find(metadata.filters, 'filterId', filterIds[i]);
                    if (filter) {
                        filterMetadataList.push(adguard.subscriptions.createSubscriptionFilterFromJSON(filter));
                    }
                }
                successCallback(filterMetadataList);
            } else {
                errorCallback(response, "empty response");
            }
        };

        executeRequestAsync(settings.filtersMetadataUrl, "application/json", success, errorCallback);
    };

    /**
     * Downloads filter rules by filter ID
     *
     * @param filterId            Filter identifier
     * @param forceRemote         Force download filter rules from remote server
     * @param useOptimizedFilters    Download optimized filters flag
     * @param successCallback    Called on success
     * @param errorCallback        Called on error
     */
    var loadFilterRules = function (filterId, forceRemote, useOptimizedFilters, successCallback, errorCallback) {

        var url;
        if (forceRemote || settings.localFilterIds.indexOf(filterId) < 0) {
            url = getUrlForDownloadFilterRules(filterId, useOptimizedFilters);
        } else {
            url = adguard.getURL(settings.localFiltersFolder + "/filter_" + filterId + ".txt");
            if (useOptimizedFilters) {
                url = adguard.getURL(settings.localFiltersFolder + "/filter_mobile_" + filterId + ".txt");
            }
        }

        doLoadFilterRules(filterId, url, successCallback, errorCallback);
    };

    /**
     * Downloads filter rules frm url
     *
     * @param url               Subscription url
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    var loadFilterRulesBySubscriptionUrl = function (url, successCallback, errorCallback) {

        if (url in loadingSubscriptions) {
            return;
        }
        loadingSubscriptions[url] = true;

        var success = function (response) {

            delete loadingSubscriptions[url];

            if (response.status !== 200) {
                errorCallback(response, "wrong status code: " + response.status);
                return;
            }

            var responseText = (response.responseText || '').trim();
            if (responseText.length === 0) {
                errorCallback(response, "filter rules missing");
                return;
            }

            var lines = responseText.split(/[\r\n]+/);
            if (lines[0].indexOf('[') === 0) {
                //[Adblock Plus 2.0]
                lines.shift();
            }

            successCallback(lines);
        };

        var error = function (request, cause) {
            delete loadingSubscriptions[url];
            errorCallback(request, cause);
        };

        executeRequestAsync(url, "text/plain", success, error);
    };

    /**
     * Loads filter groups metadata
     *
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    var loadLocalFiltersMetadata = function (successCallback, errorCallback) {

        var success = function (response) {
            if (response && response.responseText) {
                var metadata = parseJson(response.responseText);
                if (!metadata) {
                    errorCallback(response, 'invalid response');
                    return;
                }
                successCallback(metadata);
            } else {
                errorCallback(response, 'empty response');
            }
        };

        var url = adguard.getURL(settings.localFiltersFolder + '/filters.json');
        executeRequestAsync(url, 'application/json', success, errorCallback);
    };

    /**
     * Loads filter groups metadata from local file
     *
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    var loadLocalFiltersI18Metadata = function (successCallback, errorCallback) {

        var success = function (response) {
            if (response && response.responseText) {
                var metadata = parseJson(response.responseText);
                if (!metadata) {
                    errorCallback(response, 'invalid response');
                    return;
                }
                successCallback(metadata);
            } else {
                errorCallback(response, 'empty response');
            }
        };

        var url = adguard.getURL(settings.localFiltersFolder + '/filters_i18n.json');
        executeRequestAsync(url, 'application/json', success, errorCallback);
    };

    /**
     * Loads script rules from local file
     *
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    var loadLocalScriptRules = function (successCallback, errorCallback) {
        var success = function (response) {
            if (response && response.responseText) {
                var metadata = parseJson(response.responseText);
                if (!metadata) {
                    errorCallback(response, 'invalid response');
                    return;
                }
                successCallback(metadata);
            } else {
                errorCallback(response, 'empty response');
            }
        };
        var url = adguard.getURL(settings.localFiltersFolder + '/local_script_rules.json');
        executeRequestAsync(url, 'application/json', success, errorCallback);
    };

    /**
     * Checks specified host hashes with our safebrowsing service
     *
     * @param hashes                Host hashes
     * @param successCallback       Called on success
     * @param errorCallback         Called on error
     */
    var lookupSafebrowsing = function (hashes, successCallback, errorCallback) {
        var url = settings.safebrowsingLookupUrl + "?prefixes=" + encodeURIComponent(hashes.join('/'));
        executeRequestAsync(url, "application/json", successCallback, errorCallback);
    };

    /**
     * Track safebrowsing stats
     *
     * @param url - filtered url by safebrowsing
     */
    var trackSafebrowsingStats = function (url) {
        var trackUrl = settings.safebrowsingStatsUrl + "?url=" + encodeURIComponent(url);
        trackUrl += "&locale=" + adguard.app.getLocale();
        trackUrl += "&referrer=";
        trackUrl += "&r=" + Math.random();
        executeRequestAsync(trackUrl, "text/plain");
    };

    /**
     * Sends feedback from the user to our server
     *
     * @param url           URL
     * @param messageType   Message type
     * @param comment       Message text
     */
    var sendUrlReport = function (url, messageType, comment) {

        var params = "url=" + encodeURIComponent(url);
        params += "&messageType=" + encodeURIComponent(messageType);
        if (comment) {
            params += "&comment=" + encodeURIComponent(comment);
        }
        params = addKeyParameter(params);

        var request = new XMLHttpRequest();
        request.open('POST', settings.reportUrl);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.send(params);
    };

    /**
     * Tracks extension install
     */
    var trackInstall = function () {
        // SEARCH_AND_SELF_PROMO_FILTER_ID is enabled by default
        trackInfo(settings.trackInstallUrl, true);
    };

    /**
     * Used in integration mode. Sends ajax-request which should be intercepted by Adguard for Windows/Mac/Android.
     *
     * @param ruleText          Rule text
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    var adguardAppAddRule = function (ruleText, successCallback, errorCallback) {
        executeRequestAsync(settings.adguardAppUrl + "type=add&rule=" + encodeURIComponent(ruleText), "text/plain", successCallback, errorCallback);
    };

    /**
     * Used in integration mode. Sends ajax-request which should be intercepted by Adguard for Windows/Mac/Android.
     *
     * @param ruleText
     * @param successCallback
     * @param errorCallback
     */
    var adguardAppRemoveRule = function (ruleText, successCallback, errorCallback) {
        executeRequestAsync(settings.adguardAppUrl + "type=remove&rule=" + encodeURIComponent(ruleText), "text/plain", successCallback, errorCallback);
    };

    /**
     * Used in integration mode. Sends ajax-request which should be intercepted by Adguard for Windows/Mac/Android.
     *
     * @param ruleText          Rule text
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     * @deprecated
     */
    var adguardAppAddRuleOld = function (ruleText, successCallback, errorCallback) {
        executeRequestAsync(settings.adguardAppUrlOld + "type=add&rule=" + encodeURIComponent(ruleText), "text/plain", successCallback, errorCallback);
    };

    /**
     * Sends filter hits stats to backend server.
     * This method is used if user has enabled "Send statistics for ad filters usage".
     * More information about ad filters usage stats:
     * http://adguard.com/en/filter-rules-statistics.html
     *
     * @param stats             Stats
     * @param enabledFilters    List of enabled filters
     */
    var sendHitStats = function (stats, enabledFilters) {

        var params = "stats=" + encodeURIComponent(stats);
        params += "&v=" + encodeURIComponent(adguard.app.getVersion());
        params += "&b=" + encodeURIComponent(adguard.prefs.browser);
        if (enabledFilters) {
            for (var i = 0; i < enabledFilters.length; i++) {
                var filter = enabledFilters[i];
                params += "&f=" + encodeURIComponent(filter.filterId + "," + filter.version);
            }
        }
        params = addKeyParameter(params);

        var request = new XMLHttpRequest();
        request.open('POST', settings.ruleStatsUrl);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.send(params);
    };

    /**
     * @param requestUrl
     * @returns true if request to adguard application
     */
    var isAdguardAppRequest = function (requestUrl) {
        return requestUrl && (requestUrl.indexOf('/adguard-ajax-crossdomain-hack/') > 0 || requestUrl.indexOf('/adguard-ajax-api/') > 0);
    };

    /**
     * Configures backend's URLs
     * @param configuration Configuration object:
     * {
     *  filtersMetadataUrl: '...',
     *  filterRulesUrl: '...',
     *  localFiltersFolder: '...',
     *  localFilterIds: []
     * }
     */
    var configure = function (configuration) {
        var filtersMetadataUrl = configuration.filtersMetadataUrl;
        if (filtersMetadataUrl) {
            Object.defineProperty(settings, 'filtersMetadataUrl', {
                get: function () {
                    return filtersMetadataUrl;
                }
            });
        }
        var filterRulesUrl = configuration.filterRulesUrl;
        if (filterRulesUrl) {
            Object.defineProperty(settings, 'filterRulesUrl', {
                get: function () {
                    return filterRulesUrl;
                }
            });
        }
        var localFiltersFolder = configuration.localFiltersFolder;
        if (localFiltersFolder) {
            Object.defineProperty(settings, 'localFiltersFolder', {
                get: function () {
                    return localFiltersFolder;
                }
            });
        }
        var localFilterIds = configuration.localFilterIds;
        if (localFilterIds) {
            Object.defineProperty(settings, 'localFilterIds', {
                get: function () {
                    return localFilterIds;
                }
            });
        }
    };

    return {

        adguardAppUrl: settings.adguardAppUrl,
        injectionsUrl: settings.injectionsUrl,

        loadFiltersMetadata: loadFiltersMetadata,
        loadFilterRules: loadFilterRules,

        loadFilterRulesBySubscriptionUrl: loadFilterRulesBySubscriptionUrl,

        loadLocalFiltersMetadata: loadLocalFiltersMetadata,
        loadLocalFiltersI18Metadata: loadLocalFiltersI18Metadata,
        loadLocalScriptRules: loadLocalScriptRules,

        adguardAppAddRule: adguardAppAddRule,
        adguardAppAddRuleOld: adguardAppAddRuleOld,
        adguardAppRemoveRule: adguardAppRemoveRule,

        lookupSafebrowsing: lookupSafebrowsing,
        trackSafebrowsingStats: trackSafebrowsingStats,

        sendUrlReport: sendUrlReport,
        trackInstall: trackInstall,
        sendHitStats: sendHitStats,

        isAdguardAppRequest: isAdguardAppRequest,

        configure: configure
    };

})(adguard);

/**
 * Global stats
 */
adguard.pageStats = (function (adguard) {

    'use strict';

    var pageStatisticProperty = "page-statistic";

    var pageStatsHolder = {
        /**
         * Getter for total page stats (gets it from local storage)
         *
         * @returns {*}
         * @private
         */
        get stats() {
            return adguard.lazyGet(pageStatsHolder, 'stats', function () {
                var stats;
                try {
                    var json = adguard.localStorage.getItem(pageStatisticProperty);
                    if (json) {
                        stats = JSON.parse(json);
                    }
                } catch (ex) {
                    adguard.console.error('Error retrieve page statistic from storage, cause {0}', ex);
                }
                return stats || Object.create(null);
            });
        },

        save: function () {
            if (this.saveTimeoutId) {
                clearTimeout(this.saveTimeoutId);
            }
            this.saveTimeoutId = setTimeout(function () {
                adguard.localStorage.setItem(pageStatisticProperty, JSON.stringify(this.stats));
            }.bind(this), 1000);
        },

        clear: function () {
            adguard.localStorage.removeItem(pageStatisticProperty);
            adguard.lazyGetClear(pageStatsHolder, 'stats');
        }
    };

    /**
     * Total count of blocked requests
     *
     * @returns Count of blocked requests
     */
    var getTotalBlocked = function () {
        var stats = pageStatsHolder.stats;
        if (!stats) {
            return 0;
        }
        return stats.totalBlocked || 0;
    };

    /**
     * Updates total count of blocked requests
     *
     * @param blocked Count of blocked requests
     */
    var updateTotalBlocked = function (blocked) {
        var stats = pageStatsHolder.stats;
        stats.totalBlocked = (stats.totalBlocked || 0) + blocked;
        pageStatsHolder.save();
    };

    /**
     * Resets tab stats
     */
    var resetStats = function () {
        pageStatsHolder.clear();
    };

    return {
        resetStats: resetStats,
        updateTotalBlocked: updateTotalBlocked,
        getTotalBlocked: getTotalBlocked
    };

})(adguard);

/**
 * Object that manages user settings.
 * @constructor
 */
adguard.settings = (function (adguard) {

    'use strict';

    var settings = {
        DISABLE_DETECT_FILTERS: 'detect-filters-disabled',
        DISABLE_SHOW_PAGE_STATS: 'disable-show-page-statistic',
        DISABLE_SHOW_ADGUARD_PROMO_INFO: 'show-info-about-adguard-disabled',
        DISABLE_SAFEBROWSING: 'safebrowsing-disabled',
        DISABLE_SEND_SAFEBROWSING_STATS: 'safebrowsing-stats-disabled',
        DISABLE_FILTERING: 'adguard-disabled',
        DISABLE_COLLECT_HITS: 'hits-count-disabled',
        DISABLE_SHOW_CONTEXT_MENU: 'context-menu-disabled',
        USE_OPTIMIZED_FILTERS: 'use-optimized-filters',
        DEFAULT_WHITE_LIST_MODE: 'default-whitelist-mode'
    };

    var properties = Object.create(null);
    var propertyUpdateChannel = adguard.utils.channels.newChannel();

    /**
     * Lazy default properties
     */
    var defaultProperties = {
        get defaults() {
            return adguard.lazyGet(this, 'defaults', function () {
                // Initialize default properties
                var defaults = Object.create(null);
                for (var name in settings) {
                    if (settings.hasOwnProperty(name)) {
                        defaults[settings[name]] = false;
                    }
                }
                defaults[settings.DISABLE_SHOW_ADGUARD_PROMO_INFO] = (!adguard.utils.browser.isWindowsOs() && !adguard.utils.browser.isMacOs()) || adguard.utils.browser.isEdgeBrowser();
                defaults[settings.DISABLE_SAFEBROWSING] = true;
                defaults[settings.DISABLE_COLLECT_HITS] = true;
                defaults[settings.DISABLE_SEND_SAFEBROWSING_STATS] = true;
                defaults[settings.DEFAULT_WHITE_LIST_MODE] = true;
                defaults[settings.USE_OPTIMIZED_FILTERS] = adguard.utils.browser.isContentBlockerEnabled() || adguard.prefs.mobile;
                return defaults;
            });
        }
    };

    var getProperty = function (propertyName) {

        if (propertyName in properties) {
            return properties[propertyName];
        }

        var propertyValue = null;

        if (adguard.localStorage.hasItem(propertyName)) {
            try {
                propertyValue = JSON.parse(adguard.localStorage.getItem(propertyName));
            } catch (ex) {
                adguard.console.error('Error get property {0}, cause: {1}', propertyName, ex);
            }
        } else if (propertyName in defaultProperties.defaults) {
            propertyValue = defaultProperties.defaults[propertyName];
        }

        properties[propertyName] = propertyValue;

        return propertyValue;
    };

    var setProperty = function (propertyName, propertyValue) {
        adguard.localStorage.setItem(propertyName, propertyValue);
        properties[propertyName] = propertyValue;
        propertyUpdateChannel.notify(propertyName, propertyValue);
    };

    var getAllSettings = function () {

        var result = {
            names: Object.create(null),
            values: Object.create(null)
        };

        for (var key in settings) {
            if (settings.hasOwnProperty(key)) {
                var setting = settings[key];
                result.names[key] = setting;
                result.values[setting] = getProperty(setting);
            }
        }

        return result;
    };

    /**
     * True if filtering is disabled globally.
     *
     * @returns {boolean} true if disabled
     */
    var isFilteringDisabled = function () {
        return getProperty(settings.DISABLE_FILTERING);
    };

    var changeFilteringDisabled = function (disabled) {
        setProperty(settings.DISABLE_FILTERING, disabled);
    };

    var isAutodetectFilters = function () {
        return !getProperty(settings.DISABLE_DETECT_FILTERS);
    };

    var changeAutodetectFilters = function (enabled) {
        setProperty(settings.DISABLE_DETECT_FILTERS, !enabled);
    };

    var showPageStatistic = function () {
        return !getProperty(settings.DISABLE_SHOW_PAGE_STATS);
    };

    var changeShowPageStatistic = function (enabled) {
        setProperty(settings.DISABLE_SHOW_PAGE_STATS, !enabled);
    };

    var isShowInfoAboutAdguardFullVersion = function () {
        return !getProperty(settings.DISABLE_SHOW_ADGUARD_PROMO_INFO);
    };

    var changeShowInfoAboutAdguardFullVersion = function (show) {
        setProperty(settings.DISABLE_SHOW_ADGUARD_PROMO_INFO, !show);
    };

    var changeEnableSafebrowsing = function (enabled) {
        setProperty(settings.DISABLE_SAFEBROWSING, !enabled);
    };

    var changeSendSafebrowsingStats = function (enabled) {
        setProperty(settings.DISABLE_SEND_SAFEBROWSING_STATS, !enabled);
    };

    var getSafebrowsingInfo = function () {
        return {
            enabled: !getProperty(settings.DISABLE_SAFEBROWSING),
            sendStats: !getProperty(settings.DISABLE_SEND_SAFEBROWSING_STATS)
        };
    };

    var collectHitsCount = function () {
        return !getProperty(settings.DISABLE_COLLECT_HITS);
    };

    var changeCollectHitsCount = function (enabled) {
        setProperty(settings.DISABLE_COLLECT_HITS, !enabled);
    };

    var showContextMenu = function () {
        return !getProperty(settings.DISABLE_SHOW_CONTEXT_MENU);
    };

    var changeShowContextMenu = function (enabled) {
        setProperty(settings.DISABLE_SHOW_CONTEXT_MENU, !enabled);
    };

    var isDefaultWhiteListMode = function () {
        return getProperty(settings.DEFAULT_WHITE_LIST_MODE);
    };

    var isUseOptimizedFiltersEnabled = function () {
        return getProperty(settings.USE_OPTIMIZED_FILTERS);
    };

    var changeDefaultWhiteListMode = function (enabled) {
        setProperty(settings.DEFAULT_WHITE_LIST_MODE, enabled);
    };

    var api = {};

    // Expose settings to api
    for (var key in settings) {
        if (settings.hasOwnProperty(key)) {
            api[key] = settings[key];
        }
    }

    api.getProperty = getProperty;
    api.setProperty = setProperty;
    api.getAllSettings = getAllSettings;

    api.onUpdated = propertyUpdateChannel;

    api.isFilteringDisabled = isFilteringDisabled;
    api.changeFilteringDisabled = changeFilteringDisabled;
    api.isAutodetectFilters = isAutodetectFilters;
    api.changeAutodetectFilters = changeAutodetectFilters;
    api.showPageStatistic = showPageStatistic;
    api.changeShowPageStatistic = changeShowPageStatistic;
    api.isShowInfoAboutAdguardFullVersion = isShowInfoAboutAdguardFullVersion;
    api.changeShowInfoAboutAdguardFullVersion = changeShowInfoAboutAdguardFullVersion;
    api.changeEnableSafebrowsing = changeEnableSafebrowsing;
    api.changeSendSafebrowsingStats = changeSendSafebrowsingStats;
    api.getSafebrowsingInfo = getSafebrowsingInfo;
    api.collectHitsCount = collectHitsCount;
    api.changeCollectHitsCount = changeCollectHitsCount;
    api.showContextMenu = showContextMenu;
    api.changeShowContextMenu = changeShowContextMenu;
    api.isDefaultWhiteListMode = isDefaultWhiteListMode;
    api.isUseOptimizedFiltersEnabled = isUseOptimizedFiltersEnabled;
    api.changeDefaultWhiteListMode = changeDefaultWhiteListMode;

    return api;

})(adguard);

/**
 * Object that contains info about every browser tab.
 */
adguard.frames = (function (adguard) {

	'use strict';

	/**
	 * Adds frame to map. This method is called on first document request.
	 * If this is a main frame - saves this info in frame data.
	 *
	 * @param tab       Tab object
	 * @param frameId   Frame ID
	 * @param url       Page URL
	 * @param type      Request content type (UrlFilterRule.contentTypes)
	 * @returns Frame data
	 */
	var recordFrame = function (tab, frameId, url, type) {

		var frame = adguard.tabs.getTabFrame(tab.tabId, frameId);

		var previousUrl = '';
		if (type === adguard.RequestTypes.DOCUMENT) {
			adguard.tabs.clearTabFrames(tab.tabId);
			adguard.tabs.clearTabMetadata(tab.tabId);
			if (frame) {
				previousUrl = frame.url;
			}
		}

		adguard.tabs.recordTabFrame(tab.tabId, frameId, url, adguard.utils.url.getDomainName(url));

		if (type === adguard.RequestTypes.DOCUMENT) {
			adguard.tabs.updateTabMetadata(tab.tabId, {previousUrl: previousUrl});
			reloadFrameData(tab);
		}
	};

	/**
	 * Gets frame URL
	 *
	 * @param tab       Tab
	 * @param frameId   Frame ID
	 * @returns Frame URL
	 */
	var getFrameUrl = function (tab, frameId) {
		var frame = adguard.tabs.getTabFrame(tab.tabId, frameId);
		return frame ? frame.url : null;
	};

	/**
	 * Gets main frame URL
	 *
	 * @param tab	Tab
	 * @returns Frame URL
	 */
	var getMainFrameUrl = function(tab){
		return getFrameUrl(tab, 0);
	};

	/**
	 * Gets frame Domain
	 *
	 * @param tab       Tab
	 * @returns Frame Domain
	 */
	var getFrameDomain = function (tab) {
		var frame = adguard.tabs.getTabFrame(tab.tabId, 0);
		return frame ? frame.domainName : null;
	};

	/**
	 * @param tab Tab
	 * @returns true if Tab have white list rule
	 */
	var isTabWhiteListed = function (tab) {
		var frameWhiteListRule = adguard.tabs.getTabMetadata(tab.tabId, 'frameWhiteListRule');
		return frameWhiteListRule && frameWhiteListRule.checkContentTypeIncluded("DOCUMENT");
	};

	/**
	 * @param tab Tab
	 * @returns true if Tab have white list rule and white list isn't invert
	 */
	var isTabWhiteListedForSafebrowsing = function (tab) {
		return isTabWhiteListed(tab) && adguard.whitelist.isDefaultMode();
	};

	/**
	 * @param tab Tab
	 * @returns true if protection is paused
	 */
	var isTabProtectionDisabled = function (tab) {
		return adguard.tabs.getTabMetadata(tab.tabId, 'applicationFilteringDisabled');
	};

	/**
	 * Returns true if Adguard for Windows/Android/Mac is detected in this tab.
	 *
	 * @param tab   Tab
	 * @returns true if Adguard for Windows/Android/Mac is detected
	 */
	var isTabAdguardDetected = function (tab) {
		return adguard.tabs.getTabMetadata(tab.tabId, 'adguardDetected');
	};

	/**
	 * Returns true if Adguard for Windows/Android/Mac is detected in this tab and tab in white list
	 *
	 * @param tab Tab
	 * @returns true if Adguard for Windows/Android/Mac is detected and tab in white list
	 */
	var isTabAdguardWhiteListed = function (tab) {
		var adguardDetected = adguard.tabs.getTabMetadata(tab.tabId, 'adguardDetected');
		var adguardDocumentWhiteListed = adguard.tabs.getTabMetadata(tab.tabId, 'adguardDocumentWhiteListed');
		return adguardDetected && adguardDocumentWhiteListed;
	};

	/**
	 * @param tab   Tab
	 * @returns Adguard whitelist rule in user filter associated with this tab
	 */
	var getTabAdguardUserWhiteListRule = function (tab) {
		var adguardDetected = adguard.tabs.getTabMetadata(tab.tabId, 'adguardDetected');
		var adguardUserWhiteListed = adguard.tabs.getTabMetadata(tab.tabId, 'adguardUserWhiteListed');
		if (adguardDetected && adguardUserWhiteListed) {
			return adguard.tabs.getTabMetadata(tab.tabId, 'adguardWhiteListRule');
		}
		return null;
	};

	/**
	 * Update tab info if Adguard for Windows/Android/Mac is detected
	 *
	 * @param tab                   Tab
	 * @param adguardDetected       True if Adguard detected
	 * @param documentWhiteListed   True if Tab whitelisted by Adguard rule
	 * @param userWhiteListed       True if Adguard whitelist rule in user filter
	 * @param headerWhiteListRule   Adguard whitelist rule object
	 * @param adguardProductName    Adguard product name
	 * @param adguardRemoveRuleNotSupported True if Adguard Api not supported remove rule
	 */
	var recordAdguardIntegrationForTab = function (tab, adguardDetected, documentWhiteListed, userWhiteListed, headerWhiteListRule, adguardProductName, adguardRemoveRuleNotSupported) {
		adguard.tabs.updateTabMetadata(tab.tabId, {
			adguardDetected: adguardDetected,
			adguardDocumentWhiteListed: documentWhiteListed,
			adguardUserWhiteListed: userWhiteListed,
			adguardWhiteListRule: headerWhiteListRule,
			adguardProductName: adguardProductName,
			adguardRemoveRuleNotSupported: adguardRemoveRuleNotSupported
		});
	};

	/**
	 * Gets whitelist rule for the specified tab
	 * @param tab Tab to check
	 * @returns whitelist rule applied to that tab (if any)
	 */
	var getFrameWhiteListRule = function (tab) {
		return adguard.tabs.getTabMetadata(tab.tabId, 'frameWhiteListRule');
	};

	/**
	 * Reloads tab data (checks whitelist and filtering status)
	 *
	 * @param tab Tab to reload
	 */
	var reloadFrameData = function (tab) {
		var frame = adguard.tabs.getTabFrame(tab.tabId, 0);
		if (frame) {
			var url = frame.url;
			var frameWhiteListRule = adguard.whitelist.findWhiteListRule(url);
			if (!frameWhiteListRule) {
				frameWhiteListRule = adguard.requestFilter.findWhiteListRule(url, url, adguard.RequestTypes.DOCUMENT);
			}
			adguard.tabs.updateTabMetadata(tab.tabId, {
				frameWhiteListRule: frameWhiteListRule,
				applicationFilteringDisabled: adguard.settings.isFilteringDisabled()
			});
		}
	};

	/**
	 * Attach referrer url to the tab's main frame object.
	 * This referrer is then used on safebrowsing "Access Denied" for proper "Go Back" behavior.
	 *
	 * @param tab Tab
	 * @param referrerUrl Referrer to record
	 */
	var recordFrameReferrerHeader = function (tab, referrerUrl) {
		adguard.tabs.updateTabMetadata(tab.tabId, {referrerUrl: referrerUrl});
	};

	/**
	 * Gets main frame data
	 *
	 * @param tab Tab
	 * @returns frame data
	 */
	var getFrameInfo = function (tab) {

		var tabId = tab.tabId;
		var frame = adguard.tabs.getTabFrame(tabId);

		var url = tab.url;
		if (!url && frame) {
			url = frame.url;
		}

		var urlFilteringDisabled = !adguard.utils.url.isHttpRequest(url);
		var applicationFilteringDisabled;
		var documentWhiteListed = false;
		var userWhiteListed = false;
		var canAddRemoveRule = false;
		var frameRule;

		var adguardDetected = adguard.tabs.getTabMetadata(tabId, 'adguardDetected');
		var adguardProductName = '';

		if (!urlFilteringDisabled) {

			if (adguardDetected) {

				adguardProductName = adguard.tabs.getTabMetadata(tabId, 'adguardProductName');

				documentWhiteListed = adguard.tabs.getTabMetadata(tabId, 'adguardDocumentWhiteListed');
				userWhiteListed = adguard.tabs.getTabMetadata(tabId, 'adguardUserWhiteListed');
				canAddRemoveRule = !adguard.tabs.getTabMetadata(tabId, 'adguardRemoveRuleNotSupported') && !(documentWhiteListed && !userWhiteListed);
				applicationFilteringDisabled = false;

				var adguardWhiteListRule = adguard.tabs.getTabMetadata(tabId, 'adguardWhiteListRule');
				if (adguardWhiteListRule) {
					frameRule = {
						filterId: adguard.utils.filters.WHITE_LIST_FILTER_ID,
						ruleText: adguardWhiteListRule.ruleText
					};
				}

			} else {

				applicationFilteringDisabled = adguard.tabs.getTabMetadata(tabId, 'applicationFilteringDisabled');

				documentWhiteListed = isTabWhiteListed(tab);
				if (documentWhiteListed) {
					var rule = getFrameWhiteListRule(tab);
					userWhiteListed = adguard.utils.filters.isWhiteListFilterRule(rule) || adguard.utils.filters.isUserFilterRule(rule);
					frameRule = {
						filterId: rule.filterId,
						ruleText: rule.ruleText
					};
				}
				// It means site in exception
				canAddRemoveRule = !(documentWhiteListed && !userWhiteListed);
			}
		}

		var totalBlockedTab = adguard.tabs.getTabMetadata(tabId, 'blocked') || 0;
		var totalBlocked = adguard.pageStats.getTotalBlocked();

		return {

			url: url,

			applicationFilteringDisabled: applicationFilteringDisabled,
			urlFilteringDisabled: urlFilteringDisabled,

			documentWhiteListed: documentWhiteListed,
			userWhiteListed: userWhiteListed,
			canAddRemoveRule: canAddRemoveRule,
			frameRule: frameRule,

			adguardDetected: adguardDetected,
			adguardProductName: adguardProductName,

			totalBlockedTab: totalBlockedTab || 0,
			totalBlocked: totalBlocked || 0
		};
	};

	/**
	 * Update count of blocked requests
	 *
	 * @param tab - Tab
	 * @param blocked - count of blocked requests
	 * @returns  updated count of blocked requests
	 */
	var updateBlockedAdsCount = function (tab, blocked) {

		adguard.pageStats.updateTotalBlocked(blocked);

		blocked = (adguard.tabs.getTabMetadata(tab.tabId, 'blocked') || 0) + blocked;
		adguard.tabs.updateTabMetadata(tab.tabId, {blocked: blocked});

		return blocked;
	};

	/**
	 * Reset count of blocked requests for tab or overall stats
	 * @param tab - Tab (optional)
	 */
	var resetBlockedAdsCount = function (tab) {
		if (tab) {
			adguard.tabs.updateTabMetadata(tab.tabId, {blocked: 0});
		} else {
			adguard.pageStats.resetStats();
		}
	};

	/**
	 * Is tab in incognito mode?
	 * @param tab Tab
	 */
	var isIncognitoTab = function (tab) {
		return adguard.tabs.isIncognito(tab.tabId);
	};

	// Records frames on application initialization
	adguard.listeners.addListener(function (event) {
		if (event === adguard.listeners.APPLICATION_INITIALIZED) {
			adguard.tabs.forEach(function (tab) {
				recordFrame(tab, 0, tab.url, adguard.RequestTypes.DOCUMENT);
			});
		}
	});

	return {
		recordFrame: recordFrame,
		getFrameUrl: getFrameUrl,
		getMainFrameUrl: getMainFrameUrl,
		getFrameDomain: getFrameDomain,
		isTabWhiteListed: isTabWhiteListed,
		isTabWhiteListedForSafebrowsing: isTabWhiteListedForSafebrowsing,
		isTabProtectionDisabled: isTabProtectionDisabled,
		isTabAdguardDetected: isTabAdguardDetected,
		isTabAdguardWhiteListed: isTabAdguardWhiteListed,
		getTabAdguardUserWhiteListRule: getTabAdguardUserWhiteListRule,
		recordAdguardIntegrationForTab: recordAdguardIntegrationForTab,
		getFrameWhiteListRule: getFrameWhiteListRule,
		reloadFrameData: reloadFrameData,
		recordFrameReferrerHeader: recordFrameReferrerHeader,
		getFrameInfo: getFrameInfo,
		updateBlockedAdsCount: updateBlockedAdsCount,
		resetBlockedAdsCount: resetBlockedAdsCount,
		isIncognitoTab: isIncognitoTab
	};

})(adguard);

/**
 * Local storage implementation for chromium-based browsers
 */
adguard.localStorageImpl = (function () {

    var getItem = function (key) {
        return localStorage.getItem(key);
    };

    var setItem = function (key, value) {
        localStorage.setItem(key, value);
    };

    var removeItem = function (key) {
        localStorage.removeItem(key);
    };

    var hasItem = function (key) {
        return key in localStorage;
    };

    return {
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        hasItem: hasItem
    };

})();

/* global browser */

/**
 * Filter rules storage implementation
 */
adguard.rulesStorageImpl = (function () {

    /**
     * Checks runtime.lastError and calls "callback" if so.
     *
     * @returns true if operation caused error
     */
    var checkLastError = function (callback) {
        if (browser.runtime.lastError) {
            callback(browser.runtime.lastError);
            return true;
        }

        return false;
    };

    var read = function (path, callback) {
        try {
            browser.storage.local.get(path, function (results) {
                if (!checkLastError(callback)) {
                    var lines = [];

                    if (results && results[path] instanceof Array) {
                        lines = results[path];
                    }

                    callback(null, lines);
                }
            });
        } catch (ex) {
            callback(ex);
        }
    };

    var write = function (path, data, callback) {
        var item = {};
        item[path] = data;
        try {
            browser.storage.local.set(item, function () {
                if (!checkLastError(callback)) {
                    callback();
                }
            });
        } catch (ex) {
            callback(ex);
        }
    };

    var remove = function (path, successCallback) {
        browser.storage.local.remove(path, successCallback);
    };

    return {
        read: read,
        write: write,
        remove: remove
    };

})();

/**
 * localStorage interface. Implementation depends on browser
 */
adguard.localStorageImpl = adguard.localStorageImpl || (function () {

        function notImplemented() {
            throw new Error('Not implemented');
        }

        return {
            getItem: notImplemented,
            setItem: notImplemented,
            removeItem: notImplemented,
            hasItem: notImplemented
        };
    })();

/**
 * This class manages local storage
 */
adguard.localStorage = (function (adguard, impl) {

    var getItem = function (key) {
        return impl.getItem(key);
    };

    var setItem = function (key, value) {
        try {
            impl.setItem(key, value);
        } catch (ex) {
            adguard.console.error("Error while saving item {0} to the localStorage: {1}", key, ex);
        }
    };

    var removeItem = function (key) {
        impl.removeItem(key);
    };

    var hasItem = function (key) {
        return impl.hasItem(key);
    };

    return {
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        hasItem: hasItem
    };

})(adguard, adguard.localStorageImpl);

/**
 * Rules storage interface. Implementation depends on browser
 */
adguard.rulesStorageImpl = adguard.rulesStorageImpl || (function () {

        function notImplemented() {
            throw new Error('Not implemented');
        }

        return {
            read: notImplemented,
            write: notImplemented
        };

    })();

/**
 * This class manages storage for filters.
 */
adguard.rulesStorage = (function (adguard, impl) {

    function getFilePath(filterId) {
        return "filterrules_" + filterId + ".txt";
    }

    /**
     * Loads filter from the storage
     *
     * @param filterId  Filter identifier
     * @param callback  Called when file content has been loaded
     */
    var read = function (filterId, callback) {
        var filePath = getFilePath(filterId);
        impl.read(filePath, function (e, rules) {
            if (e) {
                adguard.console.error("Error while reading rules from file {0} cause: {1}", filePath, e);
            }
            callback(rules);
        });
    };

    /**
     * Saves filter rules to storage
     *
     * @param filterId      Filter identifier
     * @param filterRules   Filter rules
     * @param callback      Called when save operation is finished
     */
    var write = function (filterId, filterRules, callback) {
        var filePath = getFilePath(filterId);
        impl.write(filePath, filterRules, function (e) {
            if (e) {
                adguard.console.error("Error writing filters to file {0}. Cause: {1}", filePath, e);
            }
            callback();
        });
    };

    return {
        read: read,
        write: write
    };

})(adguard, adguard.rulesStorageImpl);

/* global chrome, browser */

(function (adguard) {

    'use strict';

    adguard.runtimeImpl = (function () {

        var onMessage = (function () {
            if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
                // Edge, Firefox WebExtensions
                return browser.runtime.onMessage;
            }
            if (chrome.runtime && chrome.runtime.onMessage) {
                // Chromium
                return chrome.runtime.onMessage;
            } else if (chrome.extension.onMessage) {
                // Old Chromium
                return chrome.extension.onMessage;
            } else {
                // Old Chromium
                return chrome.extension.onRequest;
            }
        })();

        var sendMessage = (function () {
            if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
                // Edge, Firefox WebExtensions
                return browser.runtime.sendMessage;
            }
            if (chrome.runtime && chrome.runtime.sendMessage) {
                // Chromium
                return chrome.runtime.sendMessage;
            } else if (chrome.extension.sendMessage) {
                // Old Chromium
                return chrome.extension.sendMessage;
            } else {
                // Old Chromium
                return chrome.extension.sendRequest;
            }
        })();

        return {
            onMessage: onMessage,
            sendMessage: sendMessage
        };

    })();

})(typeof adguard !== 'undefined' ? adguard : adguardContent);

/* global chrome */

var browser = window.browser || chrome;

(function (adguard, browser) {

    'use strict';

    adguard.runtime = (function () {

        var onMessage = {
            addListener: function (callback) {
                // https://developer.chrome.com/extensions/runtime#event-onMessage
                adguard.runtimeImpl.onMessage.addListener(function (message, sender, sendResponse) {
                    var senderOverride = Object.create(null);
                    if (sender.tab) {
                        senderOverride.tab = adguard.tabsImpl.fromChromeTab(sender.tab);
                    }
                    var response = callback(message, senderOverride, sendResponse);
                    var async = response === true;
                    // If async sendResponse will be invoked later
                    if (!async) {
                        sendResponse(response);
                    }
                    // Don't forget return callback result for asynchronous message passing
                    return async;
                });
            }
        };

        return {
            onMessage: onMessage,
            get lastError() {
                return browser.runtime.lastError;
            }
        };
    })();

    var linkHelper = document.createElement('a');

    /**
     * Fixing request type:
     * https://code.google.com/p/chromium/issues/detail?id=410382
     *
     * @param url Request url
     * @returns String Fixed object type
     */
    function parseRequestTypeFromUrl(url) {
        linkHelper.href = url;
        var path = linkHelper.pathname;
        var requestType = adguard.utils.browser.parseContentTypeFromUrlPath(path);
        if (requestType === null) {
            // https://code.google.com/p/chromium/issues/detail?id=410382
            requestType = adguard.RequestTypes.OBJECT;
        }
        return requestType;
    }

    function getRequestDetails(details) {

        var tab = {tabId: details.tabId};

        //https://developer.chrome.com/extensions/webRequest#event-onBeforeRequest
        var requestDetails = {
            requestUrl: details.url,    //request url
            tab: tab                    //request tab
        };

        var frameId = 0;        //id of this frame (only for main_frame and sub_frame types)
        var requestFrameId = 0; //id of frame where request is executed
        var requestType;        //request type

        switch (details.type) {
            case "main_frame":
                frameId = 0;
                requestType = adguard.RequestTypes.DOCUMENT;
                break;
            case "sub_frame":
                frameId = details.frameId;
                requestFrameId = details.parentFrameId; //for sub_frame use parentFrameId as id of frame that wraps this frame
                requestType = adguard.RequestTypes.SUBDOCUMENT;
                break;
            default:
                requestFrameId = details.frameId;
                requestType = details.type.toUpperCase();
                break;
        }

        //relate request to main_frame
        if (requestFrameId === -1) {
            requestFrameId = 0;
        }

        if (requestType === adguard.RequestTypes.OTHER) {
            requestType = parseRequestTypeFromUrl(details.url);
        }

        requestDetails.frameId = frameId;
        requestDetails.requestFrameId = requestFrameId;
        requestDetails.requestType = requestType;

        if (details.requestHeaders) {
            requestDetails.requestHeaders = details.requestHeaders;
        }

        if (details.responseHeaders) {
            requestDetails.responseHeaders = details.responseHeaders;
        }

        return requestDetails;
    }

    var onBeforeRequest = {

        addListener: function (callback, urls) {

            // https://developer.chrome.com/extensions/webRequest#event-onBeforeRequest
            browser.webRequest.onBeforeRequest.addListener(function (details) {

                if (details.tabId === -1) {
                    return;
                }

                var requestDetails = getRequestDetails(details);
                return callback(requestDetails);

            }, urls ? {urls: urls} : {}, ["blocking"]);
        }
    };

    var onHeadersReceived = {

        addListener: function (callback, urls) {

            browser.webRequest.onHeadersReceived.addListener(function (details) {

                if (details.tabId === -1) {
                    return;
                }

                var requestDetails = getRequestDetails(details);
                var result = callback(requestDetails);
                if (result) {
                    return 'responseHeaders' in result ? {responseHeaders: result.responseHeaders} : {};
                }

            }, urls ? {urls: urls} : {}, ["responseHeaders", "blocking"]);
        }
    };

    var onBeforeSendHeaders = {

        addListener: function (callback, urls) {

            browser.webRequest.onBeforeSendHeaders.addListener(function (details) {

                if (details.tabId === -1) {
                    return;
                }

                var requestDetails = getRequestDetails(details);
                var result = callback(requestDetails);
                if (result) {
                    return 'requestHeaders' in result ? {requestHeaders: result.requestHeaders} : {};
                }

            }, urls ? {urls: urls} : {}, ["requestHeaders", "blocking"]);
        }
    };

    /**
     * Gets URL of a file that belongs to our extension
     */
    adguard.getURL = browser.extension.getURL;

    adguard.i18n = browser.i18n;

    adguard.backgroundPage = {};
    adguard.backgroundPage.getWindow = function () {
        return browser.extension.getBackgroundPage();
    };

    adguard.app = {

        /**
         * Extension ID
         */
        getId: function () {
            return browser.runtime.id;
        },

        /**
         * Gets extension scheme
         * @returns "chrome-extension" for Chrome," ms-browser-extension" for Edge
         */
        getUrlScheme: function () {
            var url = adguard.getURL('test.html');
            var index = url.indexOf('://');
            return url.substring(0, index);
        },

        /**
         * Extension version
         */
        getVersion: function () {
            return browser.runtime.getManifest().version;
        },

        /**
         * Extension UI locale
         */
        getLocale: function () {
            return browser.i18n.getUILanguage();
        }
    };

    adguard.webRequest = {
        onBeforeRequest: onBeforeRequest,
        handlerBehaviorChanged: browser.webRequest.handlerBehaviorChanged,
        onCompleted: browser.webRequest.onCompleted,
        onErrorOccurred: browser.webRequest.onErrorOccurred,
        onHeadersReceived: onHeadersReceived,
        onBeforeSendHeaders: onBeforeSendHeaders
    };

    var onCreatedNavigationTarget = {

        addListener: function (callback) {

            browser.webNavigation.onCreatedNavigationTarget.addListener(function (details) {

                if (details.tabId === -1) {
                    return;
                }

                callback({
                    tabId: details.tabId,
                    sourceTabId: details.sourceTabId,
                    url: details.url
                });
            });
        }
    };

    var onCommitted = {

        addListener: function (callback) {

            // https://developer.chrome.com/extensions/webNavigation#event-onCommitted
            browser.webNavigation.onCommitted.addListener(function (details) {

                if (details.tabId === -1) {
                    return;
                }

                callback(details.tabId, details.frameId, details.url);
            });
        }
    };

    // https://developer.chrome.com/extensions/webNavigation
    adguard.webNavigation = {
        onCreatedNavigationTarget: onCreatedNavigationTarget,
        onCommitted: onCommitted
    };

    //noinspection JSUnusedLocalSymbols,JSHint
    adguard.browserAction = {

        setBrowserAction: function (tab, icon, badge, badgeColor, title) {

            var tabId = tab.tabId;

            var onIconReady = function () {
                if (browser.runtime.lastError) {
                    return;
                }
                browser.browserAction.setBadgeText({tabId: tabId, text: badge});

                if (browser.runtime.lastError) {
                    return;
                }
                if (badge) {
                    browser.browserAction.setBadgeBackgroundColor({tabId: tabId, color: badgeColor});
                }

                //title setup via manifest.json file
                //chrome.browserAction.setTitle({tabId: tabId, title: title});
            };

            /**
             * Workaround for MS Edge.
             * For some reason Edge changes the inner state of the "icon" object and adds a tabId property inside.
             */
            delete icon.tabId;

            if (browser.runtime.lastError) {
                return;
            }

            browser.browserAction.setIcon({tabId: tabId, path: icon}, onIconReady);
        },
        setPopup: function () {
            // Do nothing. Popup is already installed in manifest file
        },
        close: function () {
            // Do nothing
        }
    };

    adguard.contextMenus = browser.contextMenus;

})(adguard, browser);

/* global browser */

/**
 * Chromium windows implementation
 * @type {{onCreated, onRemoved, onUpdated, create, getLastFocused, forEachNative}}
 */
adguard.windowsImpl = (function (adguard) {

    'use strict';

    function toWindowFromChromeWindow(chromeWin) {
        return {
            windowId: chromeWin.id,
            type: chromeWin.type === 'normal' || chromeWin.type === 'popup' ? chromeWin.type : 'other'
        };
    }

    var onCreatedChannel = adguard.utils.channels.newChannel();
    var onRemovedChannel = adguard.utils.channels.newChannel();
    var onUpdatedChannel = adguard.utils.channels.newChannel();

    // https://developer.chrome.com/extensions/windows#event-onCreated
    browser.windows.onCreated.addListener(function (chromeWin) {
        onCreatedChannel.notify(toWindowFromChromeWindow(chromeWin), chromeWin);
    });

    // https://developer.chrome.com/extensions/windows#event-onRemoved
    browser.windows.onRemoved.addListener(function (windowId) {
        onRemovedChannel.notify(windowId);
    });

    var create = function (createData, callback) {
        // https://developer.chrome.com/extensions/windows#method-create
        browser.windows.create(createData, function (chromeWin) {
            callback(toWindowFromChromeWindow(chromeWin), chromeWin);
        });
    };

    var forEachNative = function (callback) {
        // https://developer.chrome.com/extensions/windows#method-getAll
        browser.windows.getAll(function (chromeWins) {
            for (var i = 0; i < chromeWins.length; i++) {
                var chromeWin = chromeWins[i];
                callback(chromeWin, toWindowFromChromeWindow(chromeWin));
            }
        });
    };

    var getLastFocused = function (callback) {
        // https://developer.chrome.com/extensions/windows#method-getLastFocused
        browser.windows.getLastFocused(function (chromeWin) {
            callback(chromeWin.id);
        });
    };

    return {

        onCreated: onCreatedChannel, // callback (adguardWin, nativeWin)
        onRemoved: onRemovedChannel, // callback (windowId)
        onUpdated: onUpdatedChannel, // empty

        create: create,
        getLastFocused: getLastFocused,

        forEachNative: forEachNative
    };

})(adguard);

/**
 * Chromium tabs implementation
 * @type {{onCreated, onRemoved, onUpdated, onActivated, create, remove, activate, reload, sendMessage, getAll, getActive, fromChromeTab}}
 */
adguard.tabsImpl = (function (adguard) {

    'use strict';

    /**
     * tabId parameter must be integer
     * @param tabId
     */
    function tabIdToInt(tabId) {
        return parseInt(tabId);
    }

    function checkLastError() {
        var ex = browser.runtime.lastError;
        if (ex) {
            adguard.console.error("Error while executing operation: {0}", ex);
        }
        return ex;
    }

    // https://developer.chrome.com/extensions/tabs#type-Tab
    function toTabFromChromeTab(chromeTab) {
        return {
            tabId: chromeTab.id,
            url: chromeTab.url,
            title: chromeTab.title,
            incognito: chromeTab.incognito,
            status: chromeTab.status
        };
    }

    // https://developer.chrome.com/extensions/tabs#event-onCreated
    var onCreatedChannel = adguard.utils.channels.newChannel();
    browser.tabs.onCreated.addListener(function (chromeTab) {
        onCreatedChannel.notify(toTabFromChromeTab(chromeTab));
    });

    // https://developer.chrome.com/extensions/tabs#event-onCreated
    var onRemovedChannel = adguard.utils.channels.newChannel();
    browser.tabs.onRemoved.addListener(function (tabId) {
        onRemovedChannel.notify(tabId);
    });

    var onUpdatedChannel = adguard.utils.channels.newChannel();
    // https://developer.chrome.com/extensions/tabs#event-onUpdated
    browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        onUpdatedChannel.notify(toTabFromChromeTab(tab));
    });

    // https://developer.chrome.com/extensions/tabs#event-onActivated
    var onActivatedChannel = adguard.utils.channels.newChannel();
    browser.tabs.onActivated.addListener(function (activeInfo) {
        onActivatedChannel.notify(activeInfo.tabId);
    });

    // https://developer.chrome.com/extensions/windows#event-onFocusChanged
    browser.windows.onFocusChanged.addListener(function (windowId) {
        if (windowId === browser.windows.WINDOW_ID_NONE) {
            return;
        }
        getActive(onActivatedChannel.notify);
    });

    var create = function (createData, callback) {

        var url = createData.url;
        var active = createData.active === true;

        if (createData.type === 'popup' &&
            // Does not work properly in Insider builds
            !adguard.utils.browser.isEdgeBrowser()) {
            // https://developer.chrome.com/extensions/windows#method-create
            browser.windows.create({
                url: url,
                type: 'popup',
                focused: active,
                width: 1230,
                height: 630
            }, callback);
            return;
        }

        var isHttp = url.indexOf('http') === 0;

        function onWindowFound(win) {
            // https://developer.chrome.com/extensions/tabs#method-create
            browser.tabs.create({
                windowId: win.id,
                url: url,
                active: active
            }, function (chromeTab) {
                callback(toTabFromChromeTab(chromeTab));
            });
        }

        function isAppropriateWindow(win) {
            // We can't open not-http (e.g. 'chrome-extension://') urls in incognito mode
            return win.type === 'normal' && (isHttp || !win.incognito);
        }

        // https://developer.chrome.com/extensions/windows#method-create
        // https://developer.chrome.com/extensions/windows#method-getLastFocused

        browser.windows.getLastFocused(function (win) {

            if (isAppropriateWindow(win)) {
                onWindowFound(win);
                return;
            }

            browser.windows.getAll(function (wins) {

                for (var i = 0; i < wins.length; i++) {
                    var win = wins[i];
                    if (isAppropriateWindow(win)) {
                        onWindowFound(win);
                        return;
                    }
                }

                // Create new window
                browser.windows.create({}, onWindowFound);
            });
        });
    };

    var remove = function (tabId, callback) {
        // https://developer.chrome.com/extensions/tabs#method-remove
        browser.tabs.remove(tabIdToInt(tabId), function () {
            if (checkLastError()) {
                return;
            }
            callback(tabId);
        });
    };

    var activate = function (tabId, callback) {
        browser.tabs.update(tabIdToInt(tabId), {active: true}, function (tab) {
            if (checkLastError()) {
                return;
            }
            // Focus window
            browser.windows.update(tab.windowId, {focused: true}, function () {
                if (checkLastError()) {
                    return;
                }
                callback(tabId);
            });
        });
    };

    var reload = function (tabId, url) {
        if (url) {
            if (adguard.utils.browser.isEdgeBrowser()) {
                /**
                 * For security reasons, in Firefox and Edge, this may not be a privileged URL.
                 * So passing any of the following URLs will fail, with runtime.lastError being set to an error message:
                 * chrome: URLs
                 * javascript: URLs
                 * data: URLs
                 * privileged about: URLs (for example, about:config, about:addons, about:debugging).
                 *
                 * Non-privileged URLs (about:home, about:newtab, about:blank) are allowed.
                 *
                 * So we use a content script instead.
                 */
                /**
                 * Content script may not have been loaded at this point yet.
                 * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/580
                 */
                setTimeout(function () {
                    sendMessage(tabId, {type: 'update-tab-url', url: url});
                }, 100);
            } else {
                browser.tabs.update(tabIdToInt(tabId), {url: url}, checkLastError);
            }
        } else {
            // https://developer.chrome.com/extensions/tabs#method-reload
            if (browser.tabs.reload) {
                browser.tabs.reload(tabIdToInt(tabId), {bypassCache: true}, checkLastError);
            } else {
                // Reload page without cache via content script
                sendMessage(tabId, {type: 'no-cache-reload'});
            }
        }
    };

    var sendMessage = function (tabId, message, responseCallback, options) {
        // https://developer.chrome.com/extensions/tabs#method-sendMessage
        if (typeof options === 'object' && browser.tabs.sendMessage) {
            browser.tabs.sendMessage(tabIdToInt(tabId), message, options, responseCallback);
            return;
        }
        (browser.tabs.sendMessage || browser.tabs.sendRequest)(tabIdToInt(tabId), message, responseCallback);
    };

    var getAll = function (callback) {
        // https://developer.chrome.com/extensions/tabs#method-query
        browser.tabs.query({}, function (chromeTabs) {
            var result = [];
            for (var i = 0; i < chromeTabs.length; i++) {
                var chromeTab = chromeTabs[i];
                result.push(toTabFromChromeTab(chromeTab));
            }
            callback(result);
        });
    };

    var getActive = function (callback) {
        /**
         * lastFocusedWindow parameter isn't supported by Opera
         * But seems currentWindow has the same effect in our case.
         * See for details:
         * https://developer.chrome.com/extensions/windows#current-window
         * https://dev.opera.com/extensions/tab-window/#accessing-the-current-tab
         */
        browser.tabs.query({currentWindow: true, active: true}, function (tabs) {
            if (tabs && tabs.length > 0) {
                callback(tabs[0].id);
            }
        });
    };

    return {

        onCreated: onCreatedChannel,
        onRemoved: onRemovedChannel,
        onUpdated: onUpdatedChannel,
        onActivated: onActivatedChannel,

        create: create,
        remove: remove,
        activate: activate,
        reload: reload,
        sendMessage: sendMessage,
        getAll: getAll,
        getActive: getActive,

        fromChromeTab: toTabFromChromeTab
    };

})(adguard);

(function (adguard) {

    'use strict';

    adguard.windowsImpl = adguard.windowsImpl || (function () {

            function noOpFunc() {
                throw new Error('Not implemented');
            }

            var emptyListener = {
                addListener: noOpFunc,
                removeListener: noOpFunc
            };

            return {

                onCreated: emptyListener, // callback (adguardWin, nativeWin)
                onRemoved: emptyListener, // callback (windowId, nativeWin)
                onUpdated: emptyListener, // callback (adguardWin, nativeWin, type) (Defined only for Firefox)

                create: noOpFunc,
                getLastFocused: noOpFunc, // callback (windowId, nativeWin)
                forEachNative: noOpFunc // callback (nativeWin, adguardWin)
            };
        });

    adguard.windows = (function (windowsImpl) {

        var AdguardWin = { // jshint ignore:line
            windowId: 1,
            type: 'normal' // 'popup'
        };

        function noOpFunc() {
        }

        var adguardWindows = Object.create(null); // windowId => AdguardWin

        windowsImpl.forEachNative(function (nativeWin, adguardWin) {
            adguardWindows[adguardWin.windowId] = adguardWin;
        });

        var onCreatedChannel = adguard.utils.channels.newChannel();
        var onRemovedChannel = adguard.utils.channels.newChannel();

        windowsImpl.onCreated.addListener(function (adguardWin) {
            adguardWindows[adguardWin.windowId] = adguardWin;
            onCreatedChannel.notify(adguardWin);
        });

        windowsImpl.onRemoved.addListener(function (windowId) {
            var adguardWin = adguardWindows[windowId];
            if (adguardWin) {
                onRemovedChannel.notify(adguardWin);
                delete adguardWindows[windowId];
            }
        });

        var create = function (createData, callback) {
            windowsImpl.create(createData, callback || noOpFunc);
        };

        var getLastFocused = function (callback) {
            windowsImpl.getLastFocused(function (windowId) {
                var metadata = adguardWindows[windowId];
                if (metadata) {
                    callback(metadata[0]);
                }
            });
        };

        return {

            onCreated: onCreatedChannel,    // callback(adguardWin)
            onRemoved: onRemovedChannel,    // callback(adguardWin)

            create: create,
            getLastFocused: getLastFocused // callback (adguardWin)
        };

    })(adguard.windowsImpl);

    adguard.tabsImpl = adguard.tabsImpl || (function () {

            function noOpFunc() {
                throw new Error('Not implemented');
            }

            var emptyListener = {
                addListener: noOpFunc,
                removeListener: noOpFunc
            };

            return {

                onCreated: emptyListener,	// callback(tab)
                onRemoved: emptyListener,	// callback(tabId)
                onUpdated: emptyListener,	// callback(tab)
                onActivated: emptyListener, 	// callback(tabId)

                create: noOpFunc,		// callback(tab)
                remove: noOpFunc,		// callback(tabId)
                activate: noOpFunc,		// callback(tabId)
                reload: noOpFunc,
                sendMessage: noOpFunc,
                getAll: noOpFunc,		// callback(tabs)
                getActive: noOpFunc		// callback(tabId)
            };

        })();

    adguard.tabs = (function (tabsImpl) {

        var AdguardTab = { // jshint ignore:line
            tabId: 1,
            url: 'url',
            title: 'Title',
            incognito: false,
            status: null,   // 'loading' or 'complete'
            frames: null,   // Collection of frames inside tab
            metadata: null  // Contains info about integration, white list rule is applied to tab.
        };

        var AdguardTabFrame = { // jshint ignore:line
            frameId: 1,
            url: 'url',
            domainName: 'domainName'
        };

        function noOpFunc() {
        }

        var tabs = Object.create(null);

        /**
         * Saves tab to collection and notify listeners
         * @param aTab
         */
        function onTabCreated(aTab) {
            var tab = tabs[aTab.tabId];
            if (tab) {
                // Tab has been already synchronized
                return;
            }
            tabs[aTab.tabId] = aTab;
            onCreatedChannel.notify(aTab);
        }

        // Synchronize opened tabs
        tabsImpl.getAll(function (aTabs) {
            for (var i = 0; i < aTabs.length; i++) {
                var aTab = aTabs[i];
                tabs[aTab.tabId] = aTab;
            }
        });

        tabsImpl.onCreated.addListener(onTabCreated);

        tabsImpl.onRemoved.addListener(function (tabId) {
            var tab = tabs[tabId];
            if (tab) {
                onRemovedChannel.notify(tab);
                delete tabs[tabId];
            }
        });

        tabsImpl.onUpdated.addListener(function (aTab) {
            var tab = tabs[aTab.tabId];
            if (tab) {
                tab.url = aTab.url;
                tab.title = aTab.title;
                tab.status = aTab.status;
                onUpdatedChannel.notify(tab);
            }
        });

        tabsImpl.onActivated.addListener(function (tabId) {
            var tab = tabs[tabId];
            if (tab) {
                onActivatedChannel.notify(tab);
            }
        });

        // Fired when a tab is created. Note that the tab's URL may not be set at the time this event fired, but you can listen to onUpdated events to be notified when a URL is set.

        var onCreatedChannel = adguard.utils.channels.newChannel();

        // Fired when a tab is closed.
        var onRemovedChannel = adguard.utils.channels.newChannel();

        // Fired when a tab is updated.
        var onUpdatedChannel = adguard.utils.channels.newChannel();

        // Fires when the active tab in a window changes.
        var onActivatedChannel = adguard.utils.channels.newChannel();

        // --------- Actions ---------

        // Creates a new tab.
        var create = function (details, callback) {
            tabsImpl.create(details, callback || noOpFunc);
        };

        // Closes tab.
        var remove = function (tabId, callback) {
            tabsImpl.remove(tabId, callback || noOpFunc);
        };

        // Activates tab (Also makes tab's window in focus).
        var activate = function (tabId, callback) {
            tabsImpl.activate(tabId, callback || noOpFunc);
        };

        // Reloads tab.
        var reload = function (tabId, url) {
            tabsImpl.reload(tabId, url);
        };

        // Sends message to tab
        var sendMessage = function (tabId, message, responseCallback, options) {
            tabsImpl.sendMessage(tabId, message, responseCallback, options);
        };

        // Gets all opened tabs
        var getAll = function (callback) {
            tabsImpl.getAll(function (aTabs) {
                var result = [];
                for (var i = 0; i < aTabs.length; i++) {
                    var aTab = aTabs[i];
                    var tab = tabs[aTab.tabId];
                    if (!tab) {
                        // Synchronize state
                        tabs[aTab.tabId] = tab = aTab;
                    }
                    result.push(tab);
                }
                callback(result);
            });
        };

        var forEach = function (callback) {
            tabsImpl.getAll(function (aTabs) {
                for (var i = 0; i < aTabs.length; i++) {
                    var aTab = aTabs[i];
                    var tab = tabs[aTab.tabId];
                    if (!tab) {
                        // Synchronize state
                        tabs[aTab.tabId] = tab = aTab;
                    }
                    callback(tab);
                }
            });
        };

        // Gets active tab
        var getActive = function (callback) {
            tabsImpl.getActive(function (tabId) {
                var tab = tabs[tabId];
                if (tab) {
                    callback(tab);
                }
            });
        };

        var isIncognito = function (tabId) {
            var tab = tabs[tabId];
            return tab && tab.incognito === true;
        };

        // Records tab's frame
        var recordTabFrame = function (tabId, frameId, url, domainName) {
            var tab = tabs[tabId];
            if (!tab && frameId === 0) {
                // Sync tab for that 'onCreated' event was missed.
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/481
                tab = {
                    tabId: tabId,
                    url: url,
                    status: 'loading'
                };
                onTabCreated(tab);
            }
            if (tab) {
                if (!tab.frames) {
                    tab.frames = Object.create(null);
                }
                tab.frames[frameId] = {
                    url: url,
                    domainName: domainName
                };
            }
        };

        var clearTabFrames = function (tabId) {
            var tab = tabs[tabId];
            if (tab) {
                tab.frames = null;
            }
        };

        // Gets tab's frame by id
        var getTabFrame = function (tabId, frameId) {
            var tab = tabs[tabId];
            if (tab && tab.frames) {
                return tab.frames[frameId || 0];
            }
            return null;
        };

        // Update tab metadata
        var updateTabMetadata = function (tabId, values) {
            var tab = tabs[tabId];
            if (tab) {
                if (!tab.metadata) {
                    tab.metadata = Object.create(null);
                }
                for (var key in values) {
                    if (values.hasOwnProperty && values.hasOwnProperty(key)) {
                        tab.metadata[key] = values[key];
                    }
                }
            }
        };

        // Gets tab metadata
        var getTabMetadata = function (tabId, key) {
            var tab = tabs[tabId];
            if (tab && tab.metadata) {
                return tab.metadata[key];
            }
            return null;
        };

        var clearTabMetadata = function (tabId) {
            var tab = tabs[tabId];
            if (tab) {
                tab.metadata = null;
            }
        };

        return {

            // Events
            onCreated: onCreatedChannel,
            onRemoved: onRemovedChannel,
            onUpdated: onUpdatedChannel,
            onActivated: onActivatedChannel,

            // Actions
            create: create,
            remove: remove,
            activate: activate,
            reload: reload,
            sendMessage: sendMessage,
            getAll: getAll,
            forEach: forEach,
            getActive: getActive,
            isIncognito: isIncognito,

            // Frames
            recordTabFrame: recordTabFrame,
            clearTabFrames: clearTabFrames,
            getTabFrame: getTabFrame,

            // Other
            updateTabMetadata: updateTabMetadata,
            getTabMetadata: getTabMetadata,
            clearTabMetadata: clearTabMetadata
        };

    })(adguard.tabsImpl);

})(adguard);

/**
 * Namespace for adguard rules classes and utils
 */
adguard.rules = (function () {

    'use strict';

    return {};

})();

(function (adguard, api) {

    'use strict';

    // Constants
    var SHORTCUT_LENGTH = 6;
    var ANY_HTTP_URL = "http:/";
    var ANY_HTTPS_URL = "https:";

    /**
     * Retrieves shortcut for rule
     * @param rule
     */
    function getRuleShortcut(rule) {
        if (!rule.shortcut || rule.shortcut.length < SHORTCUT_LENGTH) {
            return null;
        }
        return rule.shortcut.substring(rule.shortcut.length - SHORTCUT_LENGTH);
    }

    /**
     * Special hash table that greatly increases speed of searching url filter rule by its shortcut
     */
    var ShortcutsLookupTable = function (rules) {

        this.lookupTable = Object.create(null);

        if (rules) {
            for (var i = 0; i < rules.length; i++) {
                this.addRule(rules[i]);
            }
        }
    };

    ShortcutsLookupTable.prototype = {

        /**
         * Adds rule to shortcuts lookup table
         *
         * @param rule Rule to add to the table
         * @return boolean true if rule shortcut is applicable and rule was added
         */
        addRule: function (rule) {

            var shortcut = getRuleShortcut(rule);

            if (!shortcut ||
                shortcut == ANY_HTTP_URL ||
                shortcut == ANY_HTTPS_URL) {
                // Shortcut does not exists or it is too short
                return false;
            }

            if (!(shortcut in this.lookupTable)) {
                // Array is too "memory-hungry" so we try to store one rule instead
                this.lookupTable[shortcut] = rule;
            } else {
                var obj = this.lookupTable[shortcut];
                if (adguard.utils.collections.isArray(obj)) {
                    // That is popular shortcut, more than one rule
                    obj.push(rule);
                } else {
                    this.lookupTable[shortcut] = [obj, rule];
                }
            }

            return true;
        },

        /**
         * Removes specified rule from the lookup table
         *
         * @param rule Rule to remove
         */
        removeRule: function (rule) {

            var shortcut = getRuleShortcut(rule);

            if (!shortcut) {
                // Shortcut does not exists or it is too short
                return;
            }

            if (shortcut in this.lookupTable) {
                var obj = this.lookupTable[shortcut];
                if (adguard.utils.collections.isArray(obj)) {
                    adguard.utils.collections.removeRule(obj, rule);
                    if (obj.length === 0) {
                        delete this.lookupTable[shortcut];
                    }
                } else {
                    delete this.lookupTable[shortcut];
                }
            }
        },

        /**
         * Clears lookup table
         */
        clearRules: function () {
            this.lookupTable = Object.create(null);
        },

        /**
         * Searches for filter rules restricted to the specified url
         *
         * @param url url
         * @return List of filter rules or null if nothing found
         */
        lookupRules: function (url) {

            var result = null;
            for (var i = 0; i <= url.length - SHORTCUT_LENGTH; i++) {
                var hash = url.substring(i, i + SHORTCUT_LENGTH);
                var value = this.lookupTable[hash];
                if (value) {
                    if (adguard.utils.collections.isArray(value)) {
                        if (result === null) {
                            result = [];
                        }
                        result = result.concat(value);
                    } else {
                        if (result === null) {
                            result = [];
                        }
                        result.push(value);
                    }
                }
            }

            return result;
        },

        /**
         * @returns {Array} rules in lookup table
         */
        getRules: function () {
            var result = [];
            for (var r in this.lookupTable) { // jshint ignore:line
                var value = this.lookupTable[r];
                if (value) {
                    if (adguard.utils.collections.isArray(value)) {
                        result = result.concat(value);
                    } else {
                        result.push(value);
                    }
                }
            }

            return result;
        }
    };

    api.ShortcutsLookupTable = ShortcutsLookupTable;

})(adguard, adguard.rules);

(function (adguard, api) {

    'use strict';

    /**
     * Special lookup table, which improves basic rules search speed by domain.
     */
    var DomainsLookupTable = function (rules) {

        this.lookupTable = Object.create(null);

        if (rules) {
            for (var i = 0; i < rules.length; i++) {
                this.addRule(rules[i]);
            }
        }
    };

    DomainsLookupTable.prototype = {

        /**
         * Adds specified rule to the lookup table (if it is possible).
         * If rule has no domain restriction, this method returns false.
         *
         * @param rule Url filter rule
         * @return boolean true if rule was added. Otherwise - false.
         */
        addRule: function (rule) {
            if (!rule.hasPermittedDomains()) {
                // No permitted domains, we can't do anything
                return false;
            }

            var permittedDomains = rule.getPermittedDomains();
            for (var i = 0; i < permittedDomains.length; i++) {
                var domainName = permittedDomains[i];
                var rules = this.lookupTable[domainName];
                if (!rules) {
                    rules = [];
                    this.lookupTable[domainName] = rules;
                }

                rules.push(rule);
            }

            return true;
        },

        /**
         * Removes specified rule from the lookup table
         *
         * @param rule Rule to remove
         */
        removeRule: function (rule) {

            if (!rule.hasPermittedDomains()) {
                // No permitted domains, we can't do anything
                return;
            }

            var permittedDomains = rule.getPermittedDomains();
            for (var i = 0; i < permittedDomains.length; i++) {
                var domainName = permittedDomains[i];
                var rules = this.lookupTable[domainName];
                if (rules) {
                    adguard.utils.collections.removeRule(rules, rule);
                    if (rules.length === 0) {
                        delete this.lookupTable[domainName];
                    }
                }
            }
        },

        /**
         * Clears lookup table
         */
        clearRules: function () {
            this.lookupTable = Object.create(null);
        },

        /**
         * Searches for filter rules restricted to the specified domain
         *
         * @param domainName Domain name
         * @return List of filter rules or null if nothing found
         */
        lookupRules: function (domainName) {

            if (!domainName) {
                return null;
            }

            var parts = domainName.split('.');
            if (parts.length === 0) {
                return null;
            }

            // Resulting list
            var urlFilterRules = null;

            // Iterate over all sub-domains
            var host = parts[parts.length - 1];
            for (var i = parts.length - 2; i >= 0; i--) {
                host = parts[i] + "." + host;
                var rules = this.lookupTable[host];
                if (rules && rules.length > 0) {
                    if (urlFilterRules === null) {
                        // Lazy initialization of the resulting list
                        urlFilterRules = [];
                    }
                    urlFilterRules = urlFilterRules.concat(rules);
                }
            }

            return urlFilterRules;
        },

        /**
         * @returns {Array} rules in lookup table
         */
        getRules: function () {
            var result = [];
            for (var r in this.lookupTable) { // jshint ignore:line
                var value = this.lookupTable[r];
                if (value) {
                    if (adguard.utils.collections.isArray(value)) {
                        result = result.concat(value);
                    } else {
                        result.push(value);
                    }
                }
            }

            return adguard.utils.collections.removeDuplicates(result);
        }
    };

    api.DomainsLookupTable = DomainsLookupTable;

})(adguard, adguard.rules);

(function (adguard, api) {

    'use strict';

    /**
     * Checks if rule filters request
     *
     * @param rule                Rule
     * @param referrerHost        Referrer host
     * @param url                 Request url
     * @param genericRulesAllowed If true - generic rules are allowed
     * @param thirdParty          Is request third-party or not
     * @param contentTypes        Request content types mask
     * @return true if rule should filter this request
     */
    function isFiltered(rule, referrerHost, url, genericRulesAllowed, thirdParty, contentTypes) {
        return rule.isPermitted(referrerHost) &&
            (genericRulesAllowed || !rule.isGeneric()) &&
            rule.isFiltered(url, thirdParty, contentTypes);
    }


    /**
     * Checks url against collection of rules
     *
     * @param url                 Request url
     * @param referrerHost        Request referrer host
     * @param rules               Rules to check
     * @param thirdParty          Is request third-party or not
     * @param contentTypes        Request content types mask
     * @param genericRulesAllowed If true - generic rules are allowed
     * @return first matching rule or null if nothing found
     */
    function findRule(url, referrerHost, rules, thirdParty, contentTypes, genericRulesAllowed) {

        var rule, i;

        if (api.UrlFilterRule.contentTypes[contentTypes] == api.UrlFilterRule.contentTypes.DOCUMENT) {
            // Looking for document level rules
            for (i = 0; i < rules.length; i++) {
                rule = rules[i];
                if (((api.UrlFilterRule.contentTypes.DOCUMENT_LEVEL_EXCEPTIONS & rule.permittedContentType) > 0) &&
                    isFiltered(rule, referrerHost, url, genericRulesAllowed, thirdParty, "DOCUMENT_LEVEL_EXCEPTIONS")) {
                    return rule;
                }
            }
        }

        for (i = 0; i < rules.length; i++) {
            rule = rules[i];
            if (isFiltered(rule, referrerHost, url, genericRulesAllowed, thirdParty, contentTypes)) {
                return rule;
            }
        }

        return null;
    }

    /**
     * Special lookup table
     */
    var UrlFilterRuleLookupTable = function () {
        this.shortcutsLookupTable = new api.ShortcutsLookupTable();
        this.domainsLookupTable = new api.DomainsLookupTable();
        this.rulesWithoutShortcuts = [];
    };

    UrlFilterRuleLookupTable.prototype = {
        /**
         * Adds rule to the table
         *
         * @param rule Rule to add
         */
        addRule: function (rule) {
            if (!this.shortcutsLookupTable.addRule(rule)) {
                if (!this.domainsLookupTable.addRule(rule)) {
                    this.rulesWithoutShortcuts.push(rule);
                }
            }
        },

        /**
         * Removes rule from the table
         *
         * @param rule Rule to remove
         */
        removeRule: function (rule) {
            this.shortcutsLookupTable.removeRule(rule);
            this.domainsLookupTable.removeRule(rule);
            adguard.utils.collections.removeRule(this.rulesWithoutShortcuts, rule);
        },

        /**
         * Clears rules
         */
        clearRules: function () {
            this.shortcutsLookupTable.clearRules();
            this.domainsLookupTable.clearRules();
            this.rulesWithoutShortcuts = [];
        },

        getRules: function () {
            var rules = [];

            rules = rules.concat(this.rulesWithoutShortcuts);
            rules = rules.concat(this.shortcutsLookupTable.getRules());
            rules = rules.concat(this.domainsLookupTable.getRules());

            return rules;
        },

        /**
         * Returns filtering rule if request is filtered or NULL if nothing found
         *
         * @param url                 Url to check
         * @param documentHost        Request document host
         * @param thirdParty          Is request third-party or not
         * @param contentTypes        Request content types mask
         * @param genericRulesAllowed If true - generic rules are allowed
         * @return First matching rule or null if no match found
         */
        findRule: function (url, documentHost, thirdParty, contentTypes, genericRulesAllowed) {

            if (!url) {
                return null;
            }

            var rule;

            var urlLowerCase = url.toLowerCase();
            var rules = this.shortcutsLookupTable.lookupRules(urlLowerCase);

            // Check against rules with shortcuts
            if (rules && rules.length > 0) {
                rule = findRule(url, documentHost, rules, thirdParty, contentTypes, genericRulesAllowed);
                if (rule) {
                    return rule;
                }
            }

            rules = this.domainsLookupTable.lookupRules(documentHost);
            if (rules && rules.length > 0) {
                rule = findRule(url, documentHost, rules, thirdParty, contentTypes, genericRulesAllowed);
                if (rule) {
                    return rule;
                }
            }

            // Check against rules without shortcuts
            if (this.rulesWithoutShortcuts.length > 0) {
                rule = findRule(url, documentHost, this.rulesWithoutShortcuts, thirdParty, contentTypes, genericRulesAllowed);
                if (rule) {
                    return rule;
                }
            }

            return null;
        }
    };

    api.UrlFilterRuleLookupTable = UrlFilterRuleLookupTable;

})(adguard, adguard.rules);

(function (api) {

    'use strict';

    /**
     * Helper class for creating regular expression from a simple wildcard-syntax used in basic filters
     */
    var SimpleRegex = (function () {

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
        var specials = [
            '.', '+', '?', '$', '{', '}', '(', ')', '[', ']', '\\', '/'
        ];
        var specialsRegex = new RegExp('[' + specials.join('\\') + ']', 'g');

        /**
         * Escapes regular expression string
         */
        var escapeRegExp = function (str) {
            return str.replace(specialsRegex, "\\$&");
        };

        /**
         * Checks if string "str" starts with the specified "prefix"
         */
        var startsWith = function (str, prefix) {
            return str && str.indexOf(prefix) === 0;
        };

        /**
         * Checks if string "str" ends with the specified "postfix"
         */
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

        /**
         * Replaces all occurencies of a string "find" with "replace" str;
         */
        var replaceAll = function (str, find, replace) {
            if (!str) {
                return str;
            }
            return str.split(find).join(replace);
        };


        /**
         * Creates regex
         */
        var createRegexText = function (str) {
            if (str === regexConfiguration.maskStartUrl ||
                str === regexConfiguration.maskPipe ||
                str === regexConfiguration.maskAnySymbol) {
                return regexConfiguration.regexAnySymbol;
            }

            var regex = escapeRegExp(str);

            if (startsWith(regex, regexConfiguration.maskStartUrl)) {
                regex = regex.substring(0, regexConfiguration.maskStartUrl.length) +
                    replaceAll(regex.substring(regexConfiguration.maskStartUrl.length, regex.length - 1), "\|", "\\|") +
                    regex.substring(regex.length - 1);
            } else if (startsWith(regex, regexConfiguration.maskPipe)) {
                regex = regex.substring(0, regexConfiguration.maskPipe.length) +
                    replaceAll(regex.substring(regexConfiguration.maskPipe.length, regex.length - 1), "\|", "\\|") +
                    regex.substring(regex.length - 1);
            } else {
                regex = replaceAll(regex.substring(0, regex.length - 1), "\|", "\\|") +
                    regex.substring(regex.length - 1);
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

            return regex;
        };

        // EXPOSE
        return {
            // Function for creating regex
            createRegexText: createRegexText,

            // Configuration used for the transformation
            regexConfiguration: regexConfiguration
        };
    })();

    api.SimpleRegex = SimpleRegex;

})(adguard.rules);

(function (adguard, api) {

    'use strict';

    /**
     * Base class for all filter rules
     */
    var FilterRule = function (text, filterId) {
        this.ruleText = text;
        this.filterId = filterId;
    };

    FilterRule.prototype = {

        /**
         * Loads $domain option.
         * http://adguard.com/en/filterrules.html#hideRulesDomainRestrictions
         * http://adguard.com/en/filterrules.html#advanced
         *
         * @param domains List of domains. Examples: "example.com|test.com" or "example.com,test.com"
         */
        loadDomains: function (domains) {

            if (adguard.utils.strings.isEmpty(domains)) {
                return;
            }

            var permittedDomains = null;
            var restrictedDomains = null;

            var parts = domains.split(/[,|]/);
            try {
                for (var i = 0; i < parts.length; i++) {
                    var domain = parts[i], domainName;
                    if (adguard.utils.strings.startWith(domain, "~")) {
                        domainName = adguard.utils.url.toPunyCode(domain.substring(1).trim());
                        if (!adguard.utils.strings.isEmpty(domainName)) {
                            if (restrictedDomains === null) {
                                restrictedDomains = [];
                            }
                            restrictedDomains.push(domainName);
                        }
                    } else {
                        domainName = adguard.utils.url.toPunyCode(domain.trim());
                        if (!adguard.utils.strings.isEmpty(domainName)) {
                            if (permittedDomains === null) {
                                permittedDomains = [];
                            }
                            permittedDomains.push(adguard.utils.url.getCroppedDomainName(domainName));
                        }
                    }
                }
            } catch (ex) {
                adguard.console.error("Error load domains from {0}, cause {1}", domains, ex);
            }

            this.setPermittedDomains(permittedDomains);
            this.setRestrictedDomains(restrictedDomains);
        },

        getPermittedDomains: function () {
            if (this.permittedDomain) {
                return [this.permittedDomain];
            } else {
                return this.permittedDomains;
            }
        },

        getRestrictedDomains: function () {
            if (this.restrictedDomain) {
                return [this.restrictedDomain];
            } else {
                return this.restrictedDomains;
            }
        },

        setPermittedDomains: function (permittedDomains) {
            if (!permittedDomains || permittedDomains.length === 0) {
                delete this.permittedDomain;
                delete this.permittedDomains;
                return;
            }
            if (permittedDomains.length > 1) {
                this.permittedDomains = permittedDomains;
                delete this.permittedDomain;
            } else {
                this.permittedDomain = permittedDomains[0];
                delete this.permittedDomains;
            }
        },

        setRestrictedDomains: function (restrictedDomains) {
            if (!restrictedDomains || restrictedDomains.length === 0) {
                delete this.restrictedDomain;
                delete this.restrictedDomains;
                return;
            }
            if (restrictedDomains.length > 1) {
                this.restrictedDomains = restrictedDomains;
                delete this.restrictedDomain;
            } else {
                this.restrictedDomain = restrictedDomains[0];
                delete this.restrictedDomains;
            }
        },

        /**
         * Checks if rule is domain-sensitive
         * @returns boolean true if $domain option is present. Otherwise false.
         */
        isDomainSensitive: function () {
            return this.hasRestrictedDomains() || this.hasPermittedDomains();
        },

        /**
         * Checks whether this rule is generic or domain specific
         * @returns boolean true if rule is generic, otherwise false
         */
        isGeneric: function () {
            return (!this.hasPermittedDomains());
        },

        /**
         * @returns boolean true if rule has permitted domains
         */
        hasPermittedDomains: function () {
            return (this.permittedDomain || (this.permittedDomains && this.permittedDomains.length > 0));
        },

        /**
         * @returns boolean true if rule has restricted domains
         */
        hasRestrictedDomains: function () {
            return (this.restrictedDomain || (this.restrictedDomains && this.restrictedDomains.length > 0));
        },

        /**
         * Checks if rule could be applied to the specified domain name
         *
         * @param domainName Domain name
         * @returns boolean true if rule is permitted
         */
        isPermitted: function (domainName) {

            if (!domainName) {
                return false;
            }

            if (this.restrictedDomain && adguard.utils.url.isDomainOrSubDomain(domainName, this.restrictedDomain)) {
                return false;
            }

            if (this.restrictedDomains && adguard.utils.url.isDomainOrSubDomainOfAny(domainName, this.restrictedDomains)) {
                return false;
            }

            if (this.hasPermittedDomains()) {
                if (this.permittedDomain && adguard.utils.url.isDomainOrSubDomain(domainName, this.permittedDomain)) {
                    return true;
                }

                return adguard.utils.url.isDomainOrSubDomainOfAny(domainName, this.permittedDomains);
            }

            return true;
        },

        /**
         * Adds restricted domains
         *
         * @param domains List of domains
         */
        addRestrictedDomains: function (domains) {
            if (domains) {
                if (this.hasPermittedDomains()) {
                    var self = this;
                    // If a rule already has permitted domains, we should check that
                    // these restricted domains make any sense
                    domains = domains.filter(function (domainName) {
                        return self.isPermitted(domainName);
                    });
                }

                var restrictedDomains = this.getRestrictedDomains();
                restrictedDomains = adguard.utils.collections.removeDuplicates((restrictedDomains || []).concat(domains));
                this.setRestrictedDomains(restrictedDomains);
            }
        },

        /**
         * Removes restricted domains
         *
         * @param domains List of domains
         */
        removeRestrictedDomains: function (domains) {
            if (domains) {
                var restrictedDomains = this.getRestrictedDomains();
                for (var i = 0; i < domains.length; i++) {
                    adguard.utils.collections.remove(restrictedDomains, domains[i]);
                }
                this.setRestrictedDomains(restrictedDomains);
            }
        }
    };

    /**
     * urlencodes rule text.
     * We need this function because of this issue:
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/34
     */
    FilterRule.escapeRule = function (ruleText) {
        return encodeURIComponent(ruleText).replace(/'/g, "%27");
    };

    FilterRule.PARAMETER_START = "[";
    FilterRule.PARAMETER_END = "]";
    FilterRule.MASK_WHITE_LIST = "@@";
    FilterRule.MASK_CONTENT_RULE = "$$";
    FilterRule.MASK_CSS_RULE = "##";
    FilterRule.MASK_CSS_EXCEPTION_RULE = "#@#";
    FilterRule.MASK_CSS_INJECT_RULE = "#$#";
    FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE = "#@$#";
    FilterRule.MASK_SCRIPT_RULE = "#%#";
    FilterRule.MASK_SCRIPT_EXCEPTION_RULE = "#@%#";
    FilterRule.MASK_JS_RULE = "%%";
    FilterRule.MASK_BANNER_RULE = "++";
    FilterRule.MASK_CONFIGURATION_RULE = "~~";
    FilterRule.COMMENT = "!";
    FilterRule.EQUAL = "=";
    FilterRule.COMA_DELIMITER = ",";
    FilterRule.LINE_DELIMITER = "|";
    FilterRule.NOT_MARK = "~";
    FilterRule.OLD_INJECT_RULES = "adg_start_style_inject";

    api.FilterRule = FilterRule;

})(adguard, adguard.rules);

(function (adguard, api) {

    'use strict';

    /**
     * CSS rule.
     *
     * Read here for details:
     * http://adguard.com/en/filterrules.html#hideRules
     * http://adguard.com/en/filterrules.html#cssInjection
     */
    var CssFilterRule = (function () {
        /**
         * The problem with pseudo-classes is that any unknown pseudo-class makes browser ignore the whole CSS rule,
         * which contains a lot more selectors. So, if CSS selector contains a pseudo-class, we should try to validate it.
         * <p>
         * One more problem with pseudo-classes is that they are actively used in uBlock, hence it may mess AG styles.
         */
        var SUPPORTED_PSEUDO_CLASSES = [":active",
            ":checked", ":disabled", ":empty", ":enabled", ":first-child", ":first-of-type",
            ":focus", ":hover", ":in-range", ":invalid", ":lang", ":last-child", ":last-of-type",
            ":link", ":not", ":nth-child", ":nth-last-child", ":nth-last-of-type", ":nth-of-type",
            ":only-child", ":only-of-type", ":optional", ":out-of-range", ":read-only",
            ":read-write", ":required", ":root", ":target", ":valid", ":visited", ":has", ":contains",
            ":matches-css", ":matches-css-before", ":matches-css-after"];

        /**
         * The problem with it is that ":has" and ":contains" pseudo classes are not a valid pseudo classes,
         * hence using it may break old versions of AG.
         *
         * @type {string[]}
         */
        var EXTENDED_CSS_MARKERS = ["[-ext-has=", "[-ext-contains=", "[-ext-matches-css=",
            "[-ext-matches-css-before=", "[-ext-matches-css-after=", ":has(", ":contains(",
            ":matches-css(", ":matches-css-before(", ":matches-css-after("];

        /**
         * Tries to convert CSS injections rules from uBlock syntax to our own
         * https://github.com/AdguardTeam/AdguardForAndroid/issues/701
         *
         * @param pseudoClass :style pseudo class
         * @param cssContent  CSS content
         * @return String CSS content if it is a :style rule or null otherwise
         */
        var convertCssInjectionRule = function (pseudoClass, cssContent) {

            var selector = cssContent.substring(0, pseudoClass.nameStartIndex);
            var styleStart = pseudoClass.nameStartIndex + pseudoClass.name.length + 1;
            var styleEnd = cssContent.length - 1;

            if (styleEnd <= styleStart) {
                throw new Error("Empty :style pseudo class: " + cssContent);
            }

            var style = cssContent.substring(styleStart, styleEnd);

            if (adguard.utils.strings.isEmpty(selector) || adguard.utils.strings.isEmpty(style)) {
                throw new Error("Wrong :style pseudo-element syntax: " + cssContent);
            }

            return selector + " { " + style + " }";
        };

        /**
         * Parses first pseudo class from the specified CSS selector
         *
         * @param selector
         * @returns {*} first PseudoClass found or null
         */
        var parsePseudoClass = function (selector) {
            var beginIndex = 0;
            var nameStartIndex = -1;
            var squareBracketIndex = 0;

            while (squareBracketIndex >= 0) {
                nameStartIndex = selector.indexOf(':', beginIndex);
                if (nameStartIndex < 0) {
                    return null;
                }

                if (nameStartIndex > 0 && selector.charAt(nameStartIndex - 1) == '\\') {
                    // Escaped colon character
                    return null;
                }

                squareBracketIndex = selector.indexOf("[", beginIndex);
                while (squareBracketIndex >= 0) {
                    if (nameStartIndex > squareBracketIndex) {
                        var squareEndBracketIndex = selector.indexOf("]", squareBracketIndex + 1);
                        beginIndex = squareEndBracketIndex + 1;
                        if (nameStartIndex < squareEndBracketIndex) {
                            // Means that colon character is somewhere inside attribute selector
                            // Something like a[src^="http://domain.com"]
                            break;
                        }

                        if (squareEndBracketIndex > 0) {
                            squareBracketIndex = selector.indexOf("[", beginIndex);
                        } else {
                            // bad rule, example: a[src="http:
                            return null;
                        }
                    } else {
                        squareBracketIndex = -1;
                        break;
                    }
                }
            }

            var nameEndIndex = adguard.utils.strings.indexOfAny(selector, nameStartIndex + 1, [' ', '\t', '>', '(', '[', '.', '#', ':', '+', '~']);
            if (nameEndIndex < 0) {
                nameEndIndex = selector.length;
            }

            var name = selector.substring(nameStartIndex, nameEndIndex);
            if (name.length <= 1) {
                // Either empty name or a pseudo element (like ::content)
                return null;
            }

            return {
                name: name,
                nameStartIndex: nameStartIndex,
                nameEndIndex: nameEndIndex
            };
        };

        /**
         * CssFilterRule constructor
         */
        var constructor = function (rule, filterId) {

            api.FilterRule.call(this, rule, filterId);

            var isInjectRule = adguard.utils.strings.contains(rule, api.FilterRule.MASK_CSS_INJECT_RULE) || adguard.utils.strings.contains(rule, api.FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE);

            var mask;
            if (isInjectRule) {
                this.whiteListRule = adguard.utils.strings.contains(rule, api.FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE);
                mask = this.whiteListRule ? api.FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE : api.FilterRule.MASK_CSS_INJECT_RULE;
            } else {
                this.whiteListRule = adguard.utils.strings.contains(rule, api.FilterRule.MASK_CSS_EXCEPTION_RULE);
                mask = this.whiteListRule ? api.FilterRule.MASK_CSS_EXCEPTION_RULE : api.FilterRule.MASK_CSS_RULE;
            }

            var indexOfMask = rule.indexOf(mask);
            if (indexOfMask > 0) {
                // domains are specified, parsing
                var domains = rule.substring(0, indexOfMask);
                this.loadDomains(domains);
            }

            var isExtendedCss = false;
            var cssContent = rule.substring(indexOfMask + mask.length);

            if (!isInjectRule) {
                // We need this for two things:
                // 1. Convert uBlock-style CSS injection rules
                // 2. Validate pseudo-classes
                // https://github.com/AdguardTeam/AdguardForAndroid/issues/701
                var pseudoClass = parsePseudoClass(cssContent);
                if (pseudoClass !== null && ":style" == pseudoClass.name) {
                    isInjectRule = true;
                    cssContent = convertCssInjectionRule(pseudoClass, cssContent);
                } else if (pseudoClass !== null) {
                    if (SUPPORTED_PSEUDO_CLASSES.indexOf(pseudoClass.name) < 0) {
                        throw new Error("Unknown pseudo class: " + cssContent);
                    }
                }
            }

            // Extended CSS selectors support
            // https://github.com/AdguardTeam/ExtendedCss
            for (var i = 0; i < EXTENDED_CSS_MARKERS.length; i++) {
                if (cssContent.indexOf(EXTENDED_CSS_MARKERS[i]) >= 0) {
                    isExtendedCss = true;
                }
            }

            this.isInjectRule = isInjectRule;
            this.extendedCss = isExtendedCss;
            this.cssSelector = cssContent;
        };

        return constructor;
    })();

    CssFilterRule.prototype = Object.create(api.FilterRule.prototype);

    api.CssFilterRule = CssFilterRule;

})(adguard, adguard.rules);

(function (adguard, api) {

    'use strict';

    var isShadowDomSupported = adguard.utils.browser.isShadowDomSupported();

    /**
     * This class manages CSS rules and builds styles to inject to pages.
     * ABP element hiding rules: http://adguard.com/en/filterrules.html#hideRules
     * CSS injection rules: http://adguard.com/en/filterrules.html#cssInjection
     */
    var CssFilter = function (rules) {

        this.commonCss = null;
        this.commonCssHits = null;
        this.commonRules = [];
        this.domainSensitiveRules = [];
        this.extendedCssRules = [];
        this.exceptionRules = [];
        this.dirty = false;

        if (rules) {
            for (var i = 0; i < rules.length; i++) {
                this.addRule(rules[i]);
            }
        }
    };

    CssFilter.prototype = {

        /**
         * Adds rule to CssFilter
         *
         * @param rule Rule to add
         */
        addRule: function (rule) {
            // TODO: Check that extended css rules can be also whitelist (#@#)

            if (rule.whiteListRule) {
                this.exceptionRules.push(rule);
            } else if (rule.extendedCss) {
                this.extendedCssRules.push(rule);
            } else if (rule.isDomainSensitive()) {
                this.domainSensitiveRules.push(rule);
            } else {
                this.commonRules.push(rule);
            }

            this.dirty = true;
        },

        /**
         * Removes rule from the CssFilter
         *
         * @param rule Rule to remove
         */
        removeRule: function (rule) {

            var ruleText = rule.ruleText;

            this.exceptionRules = this.exceptionRules.filter(function (r) {
                return r.ruleText != ruleText;
            });
            this.extendedCssRules = this.extendedCssRules.filter(function (r) {
                return r.ruleText != ruleText;
            });
            this.domainSensitiveRules = this.domainSensitiveRules.filter(function (r) {
                return r.ruleText != ruleText;
            });
            this.commonRules = this.commonRules.filter(function (r) {
                return r.ruleText != ruleText;
            });

            this._rollbackExceptionRule(rule);

            this.dirty = true;
        },

        /**
         * Clears CssFilter
         */
        clearRules: function () {
            this.commonRules = [];
            this.domainSensitiveRules = [];
            this.exceptionRules = [];
            this.extendedCssRules = [];
            this.commonCss = null;
            this.dirty = true;
        },

        /**
         * Returns the array of loaded rules
         */
        getRules: function () {
            var result = [];
            return result.concat(this.commonRules).concat(this.domainSensitiveRules).concat(this.exceptionRules).concat(this.extendedCssRules);
        },


        /**
         * Builds CSS to be injected to the page.
         * This method builds CSS for element hiding rules only:
         * http://adguard.com/en/filterrules.html#hideRules
         *
         * @param domainName    Domain name
         * @param genericHide    flag to hide common rules
         * @returns {{css: (*|*[]), extendedCss: (*|*[])}}
         */
        buildCss: function (domainName, genericHide) {
            this._rebuild();

            var rules = this._filterRules(domainName, genericHide);

            var stylesheets = this._createCssStylesheets(rules);
            if (!genericHide) {
                stylesheets.css = this._getCommonCss().concat(stylesheets.css);
            }

            return stylesheets;
        },

        /**
         * Builds CSS to be injected to the page.
         * This method builds CSS for CSS injection rules:
         * http://adguard.com/en/filterrules.html#cssInjection
         *
         * @param domainName Domain name
         * @param genericHide flag to hide common rules
         * @returns {{css: (*|*[]), extendedCss: (*|*[])}}
         */
        buildInjectCss: function (domainName, genericHide) {
            this._rebuildBinding();
            var domainRules = this._filterDomainSensitiveRules(domainName);
            var injectDomainRules = [];
            if (domainRules !== null) {
                injectDomainRules = domainRules.filter(function (rule) {
                    return (rule.isInjectRule || rule.extendedCss) && (!genericHide || !rule.isGeneric());
                });
            }

            var result;

            if (genericHide) {
                result = injectDomainRules;
            } else {
                var commonInjectedRules = this.commonRules.filter(function (rule) {
                    return rule.isInjectRule;
                });

                result = injectDomainRules.concat(commonInjectedRules);
            }

            return this._createCssStylesheets(result);
        },

        /**
         * Builds CSS to be injected to the page.
         * If user has enabled "Send statistics for ad filters usage" option we build CSS with enabled hits stats.
         * In this case style contains "content" attribute with filter identifier and rule text.
         * Parsing this attributes shows us which rule has been used.
         *
         * @param domainName    Domain name
         * @param genericHide   Flag to hide common rules
         * @returns {{css: (*|*[]), extendedCss: (*|*[])}}
         */
        buildCssHits: function (domainName, genericHide) {
            this._rebuildHits();

            var rules = this._filterRules(domainName, genericHide);

            var stylesheets = this._createCssStylesheetsHits(rules);
            if (!genericHide) {
                stylesheets.css = this._getCommonCssHits().concat(stylesheets.css);
            }

            return stylesheets;
        },

        /**
         * Filters rules with specified parameters
         *
         * @param domainName
         * @param genericHide
         * @returns {*}
         * @private
         */
        _filterRules: function (domainName, genericHide) {
            var result;
            var domainRules = this._filterDomainSensitiveRules(domainName);
            if (genericHide) {
                var nonGenericRules = [];
                if (domainRules !== null) {
                    nonGenericRules = domainRules.filter(function (rule) {
                        return !rule.isGeneric();
                    });
                }

                result = nonGenericRules;
            } else {
                result = domainRules;
            }

            return result;
        },

        /**
         * Creates separated stylesheet for css and extended css rules.
         *
         * @param rules
         * @returns {{css: (*|*[]), extendedCss: (*|*[])}}
         * @private
         */
        _createCssStylesheets: function (rules) {
            var extendedCssRules = rules.filter(function (rule) {
                return rule.extendedCss;
            });

            var cssRules = rules.filter(function (rule) {
                return !rule.extendedCss;
            });

            return {
                css: this._buildCssByRules(cssRules),
                extendedCss: this._buildCssByRules(extendedCssRules)
            };
        },

        /**
         * Creates separated stylesheet for css and extended css rules.
         *
         * @param rules
         * @returns {{css: (*|List), extendedCss: (*|List)}}
         * @private
         */
        _createCssStylesheetsHits: function (rules) {
            var extendedCssRules = rules.filter(function (rule) {
                return rule.extendedCss;
            });

            var cssRules = rules.filter(function (rule) {
                return !rule.extendedCss;
            });

            return {
                css: this._buildCssByRulesHits(cssRules),
                extendedCss: this._buildCssByRulesHits(extendedCssRules)
            };
        },

        /**
         * Rebuilds CSS stylesheets if CssFilter is "dirty" (has some changes which are not applied yet).
         *
         * @private
         */
        _rebuild: function () {
            if (!this.dirty) {
                return;
            }
            this._applyExceptionRules();
            this.commonCss = this._buildCssByRules(this.commonRules);
            this.commonCssHits = null;
            this.dirty = false;
        },

        /**
         * Rebuilds CSS with hits stylesheet if CssFilter is "dirty" (has some changes which are not applied yet).
         *
         * If user has enabled "Send statistics for ad filters usage" option we build CSS with enabled hits stats.
         *
         * @private
         */
        _rebuildHits: function () {
            if (!this.dirty) {
                return;
            }
            this._applyExceptionRules();
            this.commonCssHits = this._buildCssByRulesHits(this.commonRules);
            this.commonCss = null;
            this.dirty = false;
        },

        /**
         * Rebuilds CSS filter.
         *
         * This method is used in Firefox if user has enabled "Send statistics for ad filters usage" option.
         * In this case we don't need commonCss and commonCssHits strings.
         * We just register browser-wide stylesheet which is stored in file.
         *
         * @private
         */
        _rebuildBinding: function () {
            if (!this.dirty) {
                return;
            }
            this._applyExceptionRules();
            this.commonCss = null;
            this.commonCssHits = null;
            this.dirty = false;
        },
        /**
         * Applies exception rules
         *
         * Read here for details:
         * http://adguard.com/en/filterrules.html#hideRulesExceptions
         * http://adguard.com/en/filterrules.html#cssInjectionExceptions
         * @private
         */
        _applyExceptionRules: function () {

            var i, j, rule, exceptionRules;

            var exceptionRulesMap = this._arrayToMap(this.exceptionRules, 'cssSelector');

            for (i = 0; i < this.domainSensitiveRules.length; i++) {
                rule = this.domainSensitiveRules[i];
                exceptionRules = exceptionRulesMap[rule.cssSelector];
                if (exceptionRules) {
                    for (j = 0; j < exceptionRules.length; j++) {

                        this._applyExceptionRule(rule, exceptionRules[j]);
                    }
                }
            }

            for (i = 0; i < this.extendedCssRules.length; i++) {
                rule = this.extendedCssRules[i];
                exceptionRules = exceptionRulesMap[rule.cssSelector];
                if (exceptionRules) {
                    for (j = 0; j < exceptionRules.length; j++) {
                        this._applyExceptionRule(rule, exceptionRules[j]);
                    }
                }
            }

            var newDomainSensitiveRules = [];

            for (i = 0; i < this.commonRules.length; i++) {
                rule = this.commonRules[i];
                exceptionRules = exceptionRulesMap[rule.cssSelector];
                if (exceptionRules) {
                    for (j = 0; j < exceptionRules.length; j++) {
                        this._applyExceptionRule(rule, exceptionRules[j]);
                    }
                    if (rule.isDomainSensitive()) {
                        // Rule has become domain sensitive.
                        // We should remove it from common rules and add to domain sensitive.
                        newDomainSensitiveRules.push(rule);
                    }
                }
            }

            var newDomainSensitiveRulesMap = this._arrayToMap(newDomainSensitiveRules, 'ruleText');

            this.domainSensitiveRules = this.domainSensitiveRules.concat(newDomainSensitiveRules);
            // Remove new domain sensitive rules from common rules
            this.commonRules = this.commonRules.filter(function (el) {
                return !(el.ruleText in newDomainSensitiveRulesMap);
            });
        },

        /**
         * Applies exception rule to the specified common rule.
         * Common means that this rule does not have $domain option.
         *
         * @param commonRule        Rule object
         * @param exceptionRule     Exception rule object
         * @private
         */
        _applyExceptionRule: function (commonRule, exceptionRule) {

            if (commonRule.cssSelector != exceptionRule.cssSelector) {
                return;
            }

            commonRule.addRestrictedDomains(exceptionRule.getPermittedDomains());
        },

        /**
         * Getter for commonCss field.
         * Lazy-initializes commonCss field if needed.
         *
         * @returns Common CSS stylesheet content
         * @private
         */
        _getCommonCss: function () {
            if (this.commonCss === null || this.commonCss.length === 0) {
                this.commonCss = this._buildCssByRules(this.commonRules);
            }
            return this.commonCss;
        },

        /**
         * Getter for commonCssHits field.
         * Lazy-initializes commonCssHits field if needed.
         *
         * @private
         */
        _getCommonCssHits: function () {
            if (this.commonCssHits === null || this.commonCssHits.length === 0) {
                this.commonCssHits = this._buildCssByRulesHits(this.commonRules);
            }
            return this.commonCssHits;
        },

        /**
         * Rolls back exception rule (used if this exception rule is removed from the user filter)
         *
         * @param exceptionRule Exception rule to roll back
         * @private
         */
        _rollbackExceptionRule: function (exceptionRule) {

            if (!exceptionRule.whiteListRule) {
                return;
            }

            var newCommonRules = [];
            var i, rule;

            for (i = 0; i < this.domainSensitiveRules.length; i++) {
                rule = this.domainSensitiveRules[i];
                if (rule.cssSelector == exceptionRule.cssSelector) {
                    rule.removeRestrictedDomains(exceptionRule.getPermittedDomains());
                    if (!rule.isDomainSensitive()) {
                        // Rule has become common.
                        // We should remove it from domain sensitive rules and add to common.
                        newCommonRules.push(rule);
                    }
                }
            }

            for (i = 0; i < this.extendedCssRules.length; i++) {
                rule = this.extendedCssRules[i];
                if (rule.cssSelector == exceptionRule.cssSelector) {
                    rule.removeRestrictedDomains(exceptionRule.getPermittedDomains());
                }
            }

            this.commonRules = this.commonRules.concat(newCommonRules);

            // Remove new common rules from  domain sensitive rules
            var newCommonRulesMap = this._arrayToMap(newCommonRules, 'ruleText');
            this.domainSensitiveRules = this.domainSensitiveRules.filter(function (el) {
                return !(el.ruleText in newCommonRulesMap);
            });
        },

        /**
         * Gets list of domain-sensitive rules for the specified domain name.
         *
         * @param domainName Domain name
         * @returns {Array} List of rules which could be applied to this domain
         * @private
         */
        _filterDomainSensitiveRules: function (domainName) {
            var rules = [];
            var rule;

            if (domainName) {
                if (this.domainSensitiveRules !== null) {
                    var iDomainSensitive = this.domainSensitiveRules.length;
                    while (iDomainSensitive--) {
                        rule = this.domainSensitiveRules[iDomainSensitive];
                        if (rule.isPermitted(domainName)) {
                            rules.push(rule);
                        }
                    }
                }

                if (this.extendedCssRules !== null) {
                    var iExtendedCss = this.extendedCssRules.length;
                    while (iExtendedCss--) {
                        rule = this.extendedCssRules[iExtendedCss];
                        if (rule.isPermitted(domainName)) {
                            rules.push(rule);
                        }
                    }
                }
            }

            return rules;
        },

        /**
         * Builds CSS to be injected
         *
         * @param rules     List of rules
         * @returns *[] of CSS stylesheets
         * @private
         */
        _buildCssByRules: function (rules) {

            var CSS_SELECTORS_PER_LINE = 50;
            var ELEMHIDE_CSS_STYLE = " { display: none!important; }\r\n";

            var elemHideSb = [];
            var selectorsCount = 0;
            var cssSb = [];

            for (var i = 0; i < rules.length; i++) {
                var rule = rules[i];

                if (rule.isInjectRule) {
                    cssSb.push(this._getRuleCssSelector(rule));
                } else {
                    elemHideSb.push(this._getRuleCssSelector(rule));
                    ++selectorsCount;
                    if (selectorsCount % CSS_SELECTORS_PER_LINE === 0 || rule.extendedCss) {
                        elemHideSb.push(ELEMHIDE_CSS_STYLE);
                    } else {
                        elemHideSb.push(", ");
                    }
                }
            }

            if (elemHideSb.length > 0) {
                // Last element should always be a style (it will replace either a comma or the same style)
                elemHideSb[elemHideSb.length - 1] = ELEMHIDE_CSS_STYLE;
            }

            var styles = [];
            var elemHideStyle = elemHideSb.join("");
            var cssStyle = cssSb.join("\r\n");

            if (elemHideStyle) {
                styles.push(elemHideStyle);
            }

            if (cssStyle) {
                styles.push(cssStyle);
            }

            return styles;
        },

        /**
         * Builds CSS with content style to be injected.
         * This method is used if user has enabled "Send statistics for ad filters usage" option.
         * Parsing css 'content' attribute allows us to track rule hits.
         *
         * @param rules     List of rules
         * @returns List of CSS stylesheets
         * @private
         */
        _buildCssByRulesHits: function (rules) {

            var ELEMHIDE_CSS_STYLE = " { display: none!important; }\r\n";
            var ELEMHIDE_HIT_START = " { display: none!important; content: 'adguard";
            var ELEMHIDE_HIT_SEP = encodeURIComponent(';');
            var ELEMHIDE_HIT_END = "' !important;}\r\n";

            var elemHideSb = [];
            var cssSb = [];

            for (var i = 0; i < rules.length; i++) {
                var rule = rules[i];

                if (rule.isInjectRule) {
                    cssSb.push(this._getRuleCssSelector(rule));
                } else {
                    elemHideSb.push(this._getRuleCssSelector(rule));
                    if (adguard.utils.filters.isUserFilterRule(rule)) {
                        elemHideSb.push(ELEMHIDE_CSS_STYLE);
                    } else {
                        elemHideSb.push(ELEMHIDE_HIT_START);
                        elemHideSb.push(rule.filterId);
                        elemHideSb.push(ELEMHIDE_HIT_SEP);
                        elemHideSb.push(api.FilterRule.escapeRule(rule.ruleText));
                        elemHideSb.push(ELEMHIDE_HIT_END);
                    }
                }
            }

            var styles = [];
            var elemHideStyle = elemHideSb.join("");
            var cssStyle = cssSb.join("\r\n");

            if (elemHideStyle) {
                styles.push(elemHideStyle);
            }

            if (cssStyle) {
                styles.push(cssStyle);
            }

            return styles;
        },

        _getRuleCssSelector: function (rule) {
            if (!isShadowDomSupported || rule.extendedCss) {
                return rule.cssSelector;
            } else {
                return "::content " + rule.cssSelector;
            }
        },

        _arrayToMap: function (array, prop) {
            var map = Object.create(null);
            for (var i = 0; i < array.length; i++) {
                var el = array[i];
                var property = el[prop];
                if (!(property in map)) {
                    map[property] = [];
                }
                map[property].push(el);
            }
            return map;
        }
    };

    api.CssFilter = CssFilter;

})(adguard, adguard.rules);

(function (adguard, api) {

    'use strict';

    /**
     * By the rules of AMO and addons.opera.com we cannot use remote scripts
     * (and our JS injection rules could be considered as remote scripts).
     *
     * So, what we do:
     * 1. Pre-compile all current JS rules to the add-on and mark them as 'local'. Other JS rules (new not pre-compiled) are maked as 'remote'.
     * 2. Also we mark as 'local' rules from the "User Filter" (local filter which user can edit)
     * 3. In case of Firefox and Opera we apply only 'local' JS rules and ignore all marked as 'remote'
     * Note: LocalScriptRulesService may be undefined, in this case, we mark all rules as remote.
     */
    function getScriptSource(filterId, ruleText) {
        return filterId == adguard.utils.filters.USER_FILTER_ID || api.LocalScriptRulesService && api.LocalScriptRulesService.isLocal(ruleText) ? 'local' : 'remote';
    }

    /**
     * JS injection rule:
     * http://adguard.com/en/filterrules.html#javascriptInjection
     */
    var ScriptFilterRule = function (rule, filterId) {

        api.FilterRule.call(this, rule, filterId);

        this.script = null;
        this.whiteListRule = adguard.utils.strings.contains(rule, api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE);
        var mask = this.whiteListRule ? api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE : api.FilterRule.MASK_SCRIPT_RULE;

        var indexOfMask = rule.indexOf(mask);
        if (indexOfMask > 0) {
            // domains are specified, parsing
            var domains = rule.substring(0, indexOfMask);
            this.loadDomains(domains);
        }

        this.script = rule.substring(indexOfMask + mask.length);

        this.scriptSource = getScriptSource(filterId, rule);
    };

    ScriptFilterRule.prototype = Object.create(api.FilterRule.prototype);

    api.ScriptFilterRule = ScriptFilterRule;

})(adguard, adguard.rules);

(function (adguard, api) {

    'use strict';

    /**
     * Filter that manages JS injection rules.
     * Read here for details: http://adguard.com/en/filterrules.html#javascriptInjection
     */
    var ScriptFilter = function (rules) {

        this.scriptRules = [];
        this.exceptionsRules = [];

        if (rules) {
            for (var i = 0; i < rules.length; i++) {
                this.addRule(rules[i]);
            }
        }
    };

    ScriptFilter.prototype = {

        /**
         * Adds JS injection rule
         *
         * @param rule Rule object
         */
        addRule: function (rule) {
            if (rule.whiteListRule) {
                this.exceptionsRules.push(rule);
                this._applyExceptionRuleToFilter(rule);
                return;
            }

            this._applyExceptionRulesToRule(rule);
            this.scriptRules.push(rule);
        },

        /**
         * Removes JS injection rule
         *
         * @param rule Rule object
         */
        removeRule: function (rule) {
            adguard.utils.collections.removeRule(this.scriptRules, rule);
            adguard.utils.collections.removeRule(this.exceptionsRules, rule);
            this._rollbackExceptionRule(rule);
        },

        /**
         * Removes all rules from this filter
         */
        clearRules: function () {
            this.scriptRules = [];
            this.exceptionsRules = [];
        },

        /**
         * Returns the array of loaded rules
         */
        getRules: function () {
            var result = [];
            return result.concat(this.scriptRules).concat(this.exceptionsRules);
        },

        /**
         * Builds script for the specified domain to be injected
         *
         * @param domainName Domain name
         * @returns List of scripts to be applied and scriptSource
         */
        buildScript: function (domainName) {
            var scripts = [];
            for (var i = 0; i < this.scriptRules.length; i++) {
                var rule = this.scriptRules[i];
                if (rule.isPermitted(domainName)) {
                    scripts.push({
                        scriptSource: rule.scriptSource,
                        rule: rule.script
                    });
                }
            }
            return scripts;
        },

        /**
         * Rolls back exception rule:
         * http://adguard.com/en/filterrules.html#javascriptInjectionExceptions
         *
         * @param exceptionRule Exception rule
         * @private
         */
        _rollbackExceptionRule: function (exceptionRule) {

            if (!exceptionRule.whiteListRule) {
                return;
            }

            for (var i = 0; i < this.scriptRules.length; i++) {
                var scriptRule = this.scriptRules[i];
                if (scriptRule.script == exceptionRule.script) {
                    scriptRule.removeRestrictedDomains(exceptionRule.getPermittedDomains());
                }
            }
        },

        /**
         * Applies exception rule:
         * http://adguard.com/en/filterrules.html#javascriptInjectionExceptions
         *
         * @param exceptionRule Exception rule
         * @private
         */
        _applyExceptionRuleToFilter: function (exceptionRule) {
            for (var i = 0; i < this.scriptRules.length; i++) {
                this._removeExceptionDomains(this.scriptRules[i], exceptionRule);
            }
        },

        /**
         * Applies exception rules:
         * http://adguard.com/en/filterrules.html#javascriptInjectionExceptions
         *
         * @param scriptRule JS injection rule
         * @private
         */
        _applyExceptionRulesToRule: function (scriptRule) {
            for (var i = 0; i < this.exceptionsRules.length; i++) {
                this._removeExceptionDomains(scriptRule, this.exceptionsRules[i]);
            }
        },

        _removeExceptionDomains: function (scriptRule, exceptionRule) {

            if (scriptRule.script != exceptionRule.script) {
                return;
            }

            scriptRule.addRestrictedDomains(exceptionRule.getPermittedDomains());
        }
    };

    api.ScriptFilter = ScriptFilter;

})(adguard, adguard.rules);

(function (adguard, api) {

    'use strict';

    /**
     * Searches for domain name in rule text and transforms it to punycode if needed.
     *
     * @param ruleText Rule text
     * @returns Transformed rule text
     */
    function getAsciiDomainRule(ruleText) {
        try {
            if (/^[\x00-\x7F]+$/.test(ruleText)) {
                return ruleText;
            }

            var domain = parseRuleDomain(ruleText, true);
            if (!domain) {
                return "";
            }

            //In case of one domain
            return adguard.utils.strings.replaceAll(ruleText, domain, adguard.utils.url.toPunyCode(domain));
        } catch (ex) {
            adguard.console.error("Error getAsciiDomainRule from {0}, cause {1}", ruleText, ex);
            return "";
        }
    }

    /**
     * Searches for domain name in rule text.
     *
     * @param ruleText Rule text
     * @param parseOptions Flag to parse rule options
     * @returns string domain name
     */
    function parseRuleDomain(ruleText, parseOptions) {
        try {
            var i;
            var startsWith = ["http://www.", "https://www.", "http://", "https://", "||", "//"];
            var contains = ["/", "^"];
            var startIndex = parseOptions ? -1 : 0;

            for (i = 0; i < startsWith.length; i++) {
                var start = startsWith[i];
                if (adguard.utils.strings.startWith(ruleText, start)) {
                    startIndex = start.length;
                    break;
                }
            }

            if (parseOptions) {
                //exclusive for domain
                var exceptRule = "domain=";
                var domainIndex = ruleText.indexOf(exceptRule);
                if (domainIndex > -1 && ruleText.indexOf("$") > -1) {
                    startIndex = domainIndex + exceptRule.length;
                }

                if (startIndex == -1) {
                    //Domain is not found in rule options, so we continue a normal way
                    startIndex = 0;
                }
            }

            var symbolIndex = -1;
            for (i = 0; i < contains.length; i++) {
                var contain = contains[i];
                var index = ruleText.indexOf(contain, startIndex);
                if (index >= 0) {
                    symbolIndex = index;
                    break;
                }
            }

            return symbolIndex == -1 ? ruleText.substring(startIndex) : ruleText.substring(startIndex, symbolIndex);
        } catch (ex) {
            adguard.console.error("Error parsing domain from {0}, cause {1}", ruleText, ex);
            return null;
        }
    }

    /**
     * Searches for the shortcut of this url mask.
     * Shortcut is the longest part of the mask without special characters:
     * *,^,|. If not found anything with the length greater or equal to 8 characters -
     * shortcut is not used.
     *
     * @param urlmask
     * @returns {string}
     */
    function findShortcut(urlmask) {
        var longest = "";
        var parts = urlmask.split(/[*^|]/);
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part.length > longest.length) {
                longest = part;
            }
        }
        return longest ? longest.toLowerCase() : null;
    }

    /**
     * Extracts a shortcut from a regexp rule.
     *
     * @param ruleText
     * @returns {*}
     */
    function extractRegexpShortcut(ruleText) {

        // Get the regexp text
        var match = ruleText.match(/\/(.*)\/(\$.*)?/);
        if (!match || match.length < 2) {
            return null;
        }

        var reText = match[1];

        var specialCharacter = "...";

        if (reText.indexOf('(?') >= 0 || reText.indexOf('(!?') >= 0) {
            // Do not mess with complex expressions which use lookahead
            return null;
        }

        // (Dirty) prepend specialCharacter for the following replace calls to work properly
        reText = specialCharacter + reText;

        // Strip all types of brackets
        reText = reText.replace(/[^\\]\(.*[^\\]\)/, specialCharacter);
        reText = reText.replace(/[^\\]\[.*[^\\]\]/, specialCharacter);
        reText = reText.replace(/[^\\]\{.*[^\\]\}/, specialCharacter);

        // Strip some special characters
        reText = reText.replace(/[^\\]\\[a-zA-Z]/, specialCharacter);

        // Split by special characters
        var parts = reText.split(/[\\^$*+?.()|[\]{}]/);
        var token = "";
        var iParts = parts.length;
        while (iParts--) {
            var part = parts[iParts];
            if (part.length > token.length) {
                token = part;
            }
        }

        return token ? token.toLowerCase() : null;
    }

    /**
     * Parse rule text
     * @param ruleText
     * @returns {{urlRuleText: *, options: *, whiteListRule: *}}
     * @private
     */
    function parseRuleText(ruleText) {

        var ESCAPE_CHARACTER = '\\';

        var urlRuleText = ruleText;
        var whiteListRule = null;
        var options = null;

        var startIndex = 0;

        if (adguard.utils.strings.startWith(urlRuleText, api.FilterRule.MASK_WHITE_LIST)) {
            startIndex = api.FilterRule.MASK_WHITE_LIST.length;
            urlRuleText = urlRuleText.substring(startIndex);
            whiteListRule = true;
        }

        var parseOptions = true;
        /**
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/517
         * regexp rule may contain dollar sign which also is options delimiter
         */
        // Added check for replacement rule, because maybe problem with rules for example /.*/$replace=/hello/bug/

        if (adguard.utils.strings.startWith(urlRuleText, api.UrlFilterRule.MASK_REGEX_RULE) &&
            adguard.utils.strings.endsWith(urlRuleText, api.UrlFilterRule.MASK_REGEX_RULE) &&
            !adguard.utils.strings.contains(urlRuleText, api.UrlFilterRule.REPLACE_OPTION + '=')) {

            parseOptions = false;
        }

        if (parseOptions) {
            var foundEscaped = false;
            // Start looking from the prev to the last symbol
            // If dollar sign is the last symbol - we simply ignore it.
            for (var i = (ruleText.length - 2); i >= startIndex; i--) {
                var c = ruleText.charAt(i);
                if (c == UrlFilterRule.OPTIONS_DELIMITER) {
                    if (i > 0 && ruleText.charAt(i - 1) == ESCAPE_CHARACTER) {
                        foundEscaped = true;
                    } else {
                        urlRuleText = ruleText.substring(startIndex, i);
                        options = ruleText.substring(i + 1);

                        if (foundEscaped) {
                            // Find and replace escaped options delimiter
                            options = options.replace(ESCAPE_CHARACTER + UrlFilterRule.OPTIONS_DELIMITER, UrlFilterRule.OPTIONS_DELIMITER);
                        }

                        // Options delimiter was found, doing nothing
                        break;
                    }
                }
            }
        }

        // Transform to punycode
        urlRuleText = getAsciiDomainRule(urlRuleText);

        return {
            urlRuleText: urlRuleText,
            options: options,
            whiteListRule: whiteListRule
        };
    }

    /**
     * Rule for blocking requests to URLs.
     * Read here for details:
     * http://adguard.com/en/filterrules.html#baseRules
     */
    var UrlFilterRule = function (rule, filterId) {

        api.FilterRule.call(this, rule, filterId);

        // Url shortcut
        this.shortcut = null;
        // Content type masks
        this.permittedContentType = UrlFilterRule.contentTypes.ALL;
        this.restrictedContentType = 0;

        // Parse rule text
        var parseResult = parseRuleText(rule);
        // Load options
        if (parseResult.options) {
            this._loadOptions(parseResult.options);
        }

        // Exception rule flag
        if (parseResult.whiteListRule) {
            this.whiteListRule = true;
        }

        var urlRuleText = parseResult.urlRuleText;

        this.isRegexRule = adguard.utils.strings.startWith(urlRuleText, UrlFilterRule.MASK_REGEX_RULE) &&
            adguard.utils.strings.endsWith(urlRuleText, UrlFilterRule.MASK_REGEX_RULE) ||
            urlRuleText === '' ||
            urlRuleText === UrlFilterRule.MASK_ANY_SYMBOL;

        if (this.isRegexRule) {
            this.urlRegExpSource = urlRuleText.substring(UrlFilterRule.MASK_REGEX_RULE.length, urlRuleText.length - UrlFilterRule.MASK_REGEX_RULE.length);

            // Pre compile regex rules
            var regexp = this.getUrlRegExp();
            if (!regexp) {
                throw 'Illegal regexp rule';
            }

            if (UrlFilterRule.REGEXP_ANY_SYMBOL == regexp && !this.hasPermittedDomains()) {
                // Rule matches everything and does not have any domain restriction
                throw ("Too wide basic rule: " + urlRuleText);
            }

            // Extract shortcut from regexp rule
            this.shortcut = extractRegexpShortcut(urlRuleText);
        } else {
            // Searching for shortcut
            this.shortcut = findShortcut(urlRuleText);
        }
    };

    UrlFilterRule.prototype = Object.create(api.FilterRule.prototype);

    // Lazy regexp source create
    UrlFilterRule.prototype.getUrlRegExpSource = function () {
        if (!this.urlRegExpSource) {
            //parse rule text
            var parseResult = parseRuleText(this.ruleText);
            // Creating regex source
            this.urlRegExpSource = api.SimpleRegex.createRegexText(parseResult.urlRuleText);
        }
        return this.urlRegExpSource;
    };

    // Lazy regexp creation
    UrlFilterRule.prototype.getUrlRegExp = function () {
        //check already compiled but not successful
        if (this.wrongUrlRegExp) {
            return null;
        }

        if (!this.urlRegExp) {
            var urlRegExpSource = this.getUrlRegExpSource();
            try {
                if (!urlRegExpSource || UrlFilterRule.MASK_ANY_SYMBOL == urlRegExpSource) {
                    // Match any symbol
                    this.urlRegExp = new RegExp(UrlFilterRule.REGEXP_ANY_SYMBOL);
                } else {
                    this.urlRegExp = new RegExp(urlRegExpSource, this.matchCase ? "" : "i");
                }

                delete this.urlRegExpSource;
            } catch (ex) {
                //malformed regexp
                adguard.console.error('Error create regexp from {0}', urlRegExpSource);
                this.wrongUrlRegExp = true;
                return null;
            }
        }

        return this.urlRegExp;
    };

    /**
     * Lazy getter for url rule text ( uses in safari content blocker)
     */
    UrlFilterRule.prototype.getUrlRuleText = function () {
        if (!this.urlRuleText) {
            this.urlRuleText = parseRuleText(this.ruleText).urlRuleText;
        }
        return this.urlRuleText;
    };

    /**
     * There are two exceptions for domain permitting in url blocking rules.
     * White list rules must fire when request has no referrer.
     * Also rules without third-party option should fire.
     *
     * @param domainName
     * @returns {*}
     */
    UrlFilterRule.prototype.isPermitted = function (domainName) {

        if (!domainName) {
            var hasPermittedDomains = this.hasPermittedDomains();

            // For white list rules to fire when request has no referrer
            if (this.whiteListRule && !hasPermittedDomains) {
                return true;
            }

            // Also firing rules when there's no constraint on ThirdParty-FirstParty type
            if (!this.checkThirdParty && !hasPermittedDomains) {
                return true;
            }
        }

        return api.FilterRule.prototype.isPermitted.call(this, domainName);
    };

    /**
     * Checks if this rule matches specified request
     *
     * @param requestUrl            Request url
     * @param thirdParty            true if request is third-party
     * @param requestContentType    Request content type (UrlFilterRule.contentTypes)
     * @return true if request url matches this rule
     */
    UrlFilterRule.prototype.isFiltered = function (requestUrl, thirdParty, requestContentType) {

        if (this.checkThirdParty) {
            if (this.isThirdParty != thirdParty) {
                return false;
            }
        }

        // Shortcut is always in lower case
        if (this.shortcut !== null && requestUrl.toLowerCase().indexOf(this.shortcut) < 0) {
            return false;
        }

        if (!this.checkContentType(requestContentType)) {
            return false;
        }

        var regexp = this.getUrlRegExp();
        if (!regexp) {
            //malformed regexp rule
            return false;
        }
        return regexp.test(requestUrl);
    };

    /**
     * Checks if specified content type has intersection with rule's content types.
     *
     * @param contentType Request content type (UrlFilterRule.contentTypes)
     */
    UrlFilterRule.prototype.checkContentType = function (contentType) {
        var contentTypeMask = UrlFilterRule.contentTypes[contentType];
        if ((this.permittedContentType & contentTypeMask) === 0) { // jshint ignore:line
            //not in permitted list - skip this rule
            return false;
        }

        if (this.restrictedContentType !== 0 && (this.restrictedContentType & contentTypeMask) == contentTypeMask) { // jshint ignore:line
            //in restricted list - skip this rule
            return false;
        }

        return true;
    };

    /**
     * Checks if specified content type is included in the rule content type.
     *
     * @param contentType Request content type (UrlFilterRule.contentTypes)
     */
    UrlFilterRule.prototype.checkContentTypeIncluded = function (contentType) {
        var contentTypeMask = UrlFilterRule.contentTypes[contentType];
        if ((this.permittedContentType & contentTypeMask) === contentTypeMask) { // jshint ignore:line
            if (this.restrictedContentType !== 0 && (this.restrictedContentType & contentTypeMask) === contentTypeMask) { // jshint ignore:line
                //in restricted list - skip this rule
                return false;
            }
            return true;
        }
        return false;
    };

    /**
     * Loads rule options
     *
     * @param options Options string
     * @private
     */
    UrlFilterRule.prototype._loadOptions = function (options) {

        var optionsParts = options.split(api.FilterRule.COMA_DELIMITER);

        var permittedContentType = 0;
        var restrictedContentType = 0;
        for (var i = 0; i < optionsParts.length; i++) {
            var option = optionsParts[i];
            var optionsKeyValue = option.split(api.FilterRule.EQUAL);
            var optionName = optionsKeyValue[0];

            switch (optionName) {
                case UrlFilterRule.DOMAIN_OPTION:
                    if (optionsKeyValue.length > 1) {
                        var domains = optionsKeyValue[1];
                        if (optionsKeyValue.length > 2) {
                            domains = optionsKeyValue.slice(1).join(api.FilterRule.EQUAL);
                        }
                        // Load domain option
                        this.loadDomains(domains);
                    }
                    break;
                case UrlFilterRule.THIRD_PARTY_OPTION:
                    // True if this filter should check if request is third- or first-party
                    this.checkThirdParty = true;
                    // If true filter is only apply to requests from a different origin than the currently viewed page
                    this.isThirdParty = true;
                    break;
                case api.FilterRule.NOT_MARK + UrlFilterRule.THIRD_PARTY_OPTION:
                    this.checkThirdParty = true;
                    this.isThirdParty = false;
                    break;
                case UrlFilterRule.MATCH_CASE_OPTION:
                    //If true - regex is matching case
                    this.matchCase = true;
                    break;
                case UrlFilterRule.IMPORTANT_OPTION:
                    this.isImportant = true;
                    break;
                case UrlFilterRule.NOT_MARK + UrlFilterRule.IMPORTANT_OPTION:
                    this.isImportant = false;
                    break;
                case UrlFilterRule.ELEMHIDE_OPTION:
                    permittedContentType |= UrlFilterRule.contentTypes.ELEMHIDE; // jshint ignore:line
                    break;
                case UrlFilterRule.GENERICHIDE_OPTION:
                    permittedContentType |= UrlFilterRule.contentTypes.GENERICHIDE; // jshint ignore:line
                    break;
                case UrlFilterRule.JSINJECT_OPTION:
                    permittedContentType |= UrlFilterRule.contentTypes.JSINJECT; // jshint ignore:line
                    break;
                case UrlFilterRule.URLBLOCK_OPTION:
                    permittedContentType |= UrlFilterRule.contentTypes.URLBLOCK; // jshint ignore:line
                    break;
                case UrlFilterRule.GENERICBLOCK_OPTION:
                    permittedContentType |= UrlFilterRule.contentTypes.GENERICBLOCK; // jshint ignore:line
                    break;
                case UrlFilterRule.DOCUMENT_OPTION:
                    permittedContentType |= UrlFilterRule.contentTypes.DOCUMENT; // jshint ignore:line
                    break;
                case UrlFilterRule.POPUP_OPTION:
                    permittedContentType |= UrlFilterRule.contentTypes.POPUP; // jshint ignore:line
                    break;
                case UrlFilterRule.EMPTY_OPTION:
                    this.emptyResponse = true;
                    break;
                default:
                    optionName = optionName.toUpperCase();
                    if (optionName in UrlFilterRule.contentTypes) {
                        permittedContentType |= UrlFilterRule.contentTypes[optionName]; // jshint ignore:line
                    } else if (optionName[0] == api.FilterRule.NOT_MARK && optionName.substring(1) in UrlFilterRule.contentTypes) {
                        restrictedContentType |= UrlFilterRule.contentTypes[optionName.substring(1)]; // jshint ignore:line
                    } else if (optionName in UrlFilterRule.ignoreOptions) { // jshint ignore:line
                        // Ignore
                    } else {
                        throw 'Unknown option: ' + optionName;
                    }
            }
        }

        if (permittedContentType > 0) {
            this.permittedContentType = permittedContentType;
        }
        if (restrictedContentType > 0) {
            this.restrictedContentType = restrictedContentType;
        }
    };

    UrlFilterRule.OPTIONS_DELIMITER = "$";
    UrlFilterRule.DOMAIN_OPTION = "domain";
    UrlFilterRule.THIRD_PARTY_OPTION = "third-party";
    UrlFilterRule.MATCH_CASE_OPTION = "match-case";
    UrlFilterRule.DOCUMENT_OPTION = "document";
    UrlFilterRule.ELEMHIDE_OPTION = "elemhide";
    UrlFilterRule.GENERICHIDE_OPTION = "generichide";
    UrlFilterRule.URLBLOCK_OPTION = "urlblock";
    UrlFilterRule.GENERICBLOCK_OPTION = "genericblock";
    UrlFilterRule.JSINJECT_OPTION = "jsinject";
    UrlFilterRule.POPUP_OPTION = "popup";
    UrlFilterRule.IMPORTANT_OPTION = "important";
    UrlFilterRule.MASK_REGEX_RULE = "/";
    UrlFilterRule.MASK_ANY_SYMBOL = "*";
    UrlFilterRule.REGEXP_ANY_SYMBOL = ".*";
    UrlFilterRule.EMPTY_OPTION = "empty";
    UrlFilterRule.REPLACE_OPTION = "replace"; // Extension doesn't support replace rules, $replace option is here only for correctly parsing

    UrlFilterRule.contentTypes = {

        // jshint ignore:start
        OTHER: 1 << 0,
        SCRIPT: 1 << 1,
        IMAGE: 1 << 2,
        STYLESHEET: 1 << 3,
        OBJECT: 1 << 4,
        SUBDOCUMENT: 1 << 5,
        XMLHTTPREQUEST: 1 << 6,
        'OBJECT-SUBREQUEST': 1 << 7,
        MEDIA: 1 << 8,
        FONT: 1 << 9,
        WEBSOCKET: 1 << 10,

        ELEMHIDE: 1 << 20,      //CssFilter cannot be applied to page
        URLBLOCK: 1 << 21,      //This attribute is only for exception rules. If true - do not use urlblocking rules for urls where referrer satisfies this rule.
        JSINJECT: 1 << 22,      //Does not inject javascript rules to page
        POPUP: 1 << 23,         //check block popups
        GENERICHIDE: 1 << 24,   //CssFilter generic rules cannot be applied to page
        GENERICBLOCK: 1 << 25,  //UrlFilter generic rules cannot be applied to page
        IMPORTANT: 1 << 26      //Important rules cannot be applied to page
        // jshint ignore:end
    };

    // https://code.google.com/p/chromium/issues/detail?id=410382
    if (adguard.prefs.platform === 'chromium' ||
        adguard.prefs.platform == 'webkit') {

        UrlFilterRule.contentTypes['OBJECT-SUBREQUEST'] = UrlFilterRule.contentTypes.OBJECT;
    }

    UrlFilterRule.ignoreOptions = {
        // Deprecated modifiers
        'BACKGROUND': true,
        '~BACKGROUND': true,
        // Unused modifiers
        'COLLAPSE': true,
        '~COLLAPSE': true,
        '~DOCUMENT': true,
        // http://adguard.com/en/filterrules.html#advanced
        'CONTENT': true
    };

    // jshint ignore:start
    UrlFilterRule.contentTypes.DOCUMENT = UrlFilterRule.contentTypes.ELEMHIDE | UrlFilterRule.contentTypes.URLBLOCK | UrlFilterRule.contentTypes.JSINJECT;
    UrlFilterRule.contentTypes.DOCUMENT_LEVEL_EXCEPTIONS = UrlFilterRule.contentTypes.DOCUMENT | UrlFilterRule.contentTypes.GENERICHIDE | UrlFilterRule.contentTypes.GENERICBLOCK;

    UrlFilterRule.contentTypes.ALL = 0;
    UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.OTHER;
    UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.SCRIPT;
    UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.IMAGE;
    UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.STYLESHEET;
    UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.OBJECT;
    UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.SUBDOCUMENT;
    UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.XMLHTTPREQUEST;
    UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes['OBJECT-SUBREQUEST'];
    UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.MEDIA;
    UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.FONT;
    UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.WEBSOCKET;
    // jshint ignore:end

    api.UrlFilterRule = UrlFilterRule;

})(adguard, adguard.rules);

(function (api) {

    'use strict';

    /**
     * Filter for Url filter rules.
     * Read here for details:
     * http://adguard.com/en/filterrules.html#baseRules
     */
    var UrlFilter = function (rules) {

        this.basicRulesTable = new api.UrlFilterRuleLookupTable();
        this.importantRulesTable = new api.UrlFilterRuleLookupTable();

        if (rules) {
            for (var i = 0; i < rules.length; i++) {
                this.addRule(rules[i]);
            }
        }
    };

    UrlFilter.prototype = {

        /**
         * Adds rule to UrlFilter
         *
         * @param rule Rule object
         */
        addRule: function (rule) {

            if (rule.isImportant) {
                this.importantRulesTable.addRule(rule);
            } else {
                this.basicRulesTable.addRule(rule);
            }
        },

        /**
         * Removes rule from UrlFilter
         *
         * @param rule Rule to remove
         */
        removeRule: function (rule) {

            if (rule.isImportant) {
                this.importantRulesTable.removeRule(rule);
            } else {
                this.basicRulesTable.removeRule(rule);
            }
        },

        /**
         * Removes all rules from UrlFilter
         */
        clearRules: function () {
            this.basicRulesTable.clearRules();
            this.importantRulesTable.clearRules();
        },

        /**
         * Searches for first rule matching specified request
         *
         * @param url           Request url
         * @param documentHost  Document host
         * @param requestType   Request content type (UrlFilterRule.contentTypes)
         * @param thirdParty    true if request is third-party
         * @param skipGenericRules    skip generic rules
         * @return matching rule or null if no match found
         */
        isFiltered: function (url, documentHost, requestType, thirdParty, skipGenericRules) {
            // First looking for the rule marked with $important modifier
            var rule = this.importantRulesTable.findRule(url, documentHost, thirdParty, requestType, !skipGenericRules);
            if (!rule) {
                rule = this.basicRulesTable.findRule(url, documentHost, thirdParty, requestType, !skipGenericRules);
            }
            return rule;
        },

        /**
         * Returns the array of loaded rules
         */
        getRules: function () {
            var rules = this.basicRulesTable.getRules();
            return rules.concat(this.importantRulesTable.getRules());
        }
    };

    api.UrlFilter = UrlFilter;

})(adguard.rules);

(function (adguard, api) {

    'use strict';

    /**
     * Method that parses rule text and creates object of a suitable class.
     *
     * @param ruleText Rule text
     * @param filterId Filter identifier
     * @returns Filter rule object. Either UrlFilterRule or CssFilterRule or ScriptFilterRule.
     */
    var createRule = function (ruleText, filterId) {

        ruleText = ruleText ? ruleText.trim() : null;
        if (!ruleText) {
            return null;
        }
        var rule = null;
        try {

            var StringUtils = adguard.utils.strings;

            if (StringUtils.startWith(ruleText, api.FilterRule.COMMENT) ||
                StringUtils.contains(ruleText, api.FilterRule.OLD_INJECT_RULES) ||
                StringUtils.contains(ruleText, api.FilterRule.MASK_CONTENT_RULE) ||
                StringUtils.contains(ruleText, api.FilterRule.MASK_JS_RULE)) {
                // Empty or comment, ignore
                // Content rules are not supported
                return null;
            }

            if (StringUtils.startWith(ruleText, api.FilterRule.MASK_WHITE_LIST)) {
                rule = new api.UrlFilterRule(ruleText, filterId);
            } else if (StringUtils.contains(ruleText, api.FilterRule.MASK_CSS_RULE) || StringUtils.contains(ruleText, api.FilterRule.MASK_CSS_EXCEPTION_RULE)) {
                rule = new api.CssFilterRule(ruleText, filterId);
            } else if (StringUtils.contains(ruleText, api.FilterRule.MASK_CSS_INJECT_RULE) || StringUtils.contains(ruleText, api.FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE)) {
                rule = new api.CssFilterRule(ruleText, filterId);
            } else if (StringUtils.contains(ruleText, api.FilterRule.MASK_SCRIPT_RULE) || StringUtils.contains(ruleText, api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE)) {
                rule = new api.ScriptFilterRule(ruleText, filterId);
            } else {
                rule = new api.UrlFilterRule(ruleText, filterId);
            }
        } catch (ex) {
            adguard.console.warn("Cannot create rule from filter {0}: {1}, cause {2}", filterId, ruleText, ex);
        }
        return rule;
    };

    api.builder = {
        createRule: createRule
    };

})(adguard, adguard.rules);

/**
 * Service that loads and parses filters metadata from backend server.
 * For now we just store filters metadata in an XML file within the extension.
 * In future we'll add an opportunity to update metadata along with filter rules update.
 */
adguard.subscriptions = (function (adguard) {

    'use strict';

    var groups = [];
    var filters = [];

    /**
     * @param timeUpdatedString String in format 'yyyy-MM-dd'T'HH:mm:ssZ'
     * @returns timestamp from date string
     */
    function parseTimeUpdated(timeUpdatedString) {
        // https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
        var timeUpdated = Date.parse(timeUpdatedString);
        if (isNaN(timeUpdated)) {
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/478
            timeUpdated = Date.parse(timeUpdatedString.replace(/\+(\d{2})(\d{2})$/, "+$1:$2"));
        }
        if (isNaN(timeUpdated)) {
            timeUpdated = new Date().getTime();
        }
        return timeUpdated;
    }

    /**
     * Group metadata
     */
    var SubscriptionGroup = function (groupId, groupName, displayNumber) {
        this.groupId = groupId;
        this.groupName = groupName;
        this.displayNumber = displayNumber;
    };

    /**
     * Filter metadata
     */
    var SubscriptionFilter = function (filterId, groupId, name, description, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl) {

        this.filterId = filterId;
        this.groupId = groupId;
        this.name = name;
        this.description = description;
        this.homepage = homepage;
        this.version = version;
        this.timeUpdated = timeUpdated;
        this.displayNumber = displayNumber;
        this.languages = languages;
        this.expires = expires;
        this.subscriptionUrl = subscriptionUrl;
    };

    /**
     * Create group from object
     * @param group Object
     * @returns {SubscriptionGroup}
     */
    function createSubscriptionGroupFromJSON(group) {

        var groupId = group.groupId - 0;
        var defaultGroupName = group.groupName;
        var displayNumber = group.displayNumber - 0;

        return new SubscriptionGroup(groupId, defaultGroupName, displayNumber);
    }

    /**
     * Create filter from object
     * @param filter Object
     */
    var createSubscriptionFilterFromJSON = function (filter) {

        var filterId = filter.filterId - 0;
        var groupId = filter.groupId - 0;
        var defaultName = filter.name;
        var defaultDescription = filter.description;
        var homepage = filter.homepage;
        var version = filter.version;
        var timeUpdated = parseTimeUpdated(filter.timeUpdated);
        var expires = filter.expires - 0;
        var subscriptionUrl = filter.subscriptionUrl;
        var languages = filter.languages;
        var displayNumber = filter.displayNumber - 0;

        return new SubscriptionFilter(filterId, groupId, defaultName, defaultDescription, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl);
    };

    /**
     * Load groups and filters metadata
     *
     * @param successCallback
     * @param errorCallback
     * @private
     */
    function loadMetadata(successCallback, errorCallback) {

        adguard.backend.loadLocalFiltersMetadata(function (metadata) {

            groups = [];
            filters = [];

            for (var i = 0; i < metadata.groups.length; i++) {
                groups.push(createSubscriptionGroupFromJSON(metadata.groups[i]));
            }

            for (var j = 0; j < metadata.filters.length; j++) {
                filters.push(createSubscriptionFilterFromJSON(metadata.filters[j]));
            }

            adguard.console.info('Filters metadata loaded');
            successCallback();

        }, errorCallback);
    }

    /**
     * Loads groups and filters localizations
     * @param successCallback
     * @param errorCallback
     */
    function loadMetadataI18n(successCallback, errorCallback) {

        adguard.backend.loadLocalFiltersI18Metadata(function (i18nMetadata) {

            var groupsI18n = i18nMetadata.groups;
            var filtersI18n = i18nMetadata.filters;

            for (var i = 0; i < groups.length; i++) {
                applyGroupLocalization(groups[i], groupsI18n);
            }

            for (var j = 0; j < filters.length; j++) {
                applyFilterLocalization(filters[j], filtersI18n);
            }

            adguard.console.info('Filters i18n metadata loaded');
            successCallback();

        }, errorCallback);
    }


    /**
     * Loads script rules from local file
     * @returns {exports.Promise}
     * @private
     */
    function loadLocalScriptRules(successCallback, errorCallback) {
        var localScriptRulesService = adguard.rules.LocalScriptRulesService;
        if (typeof localScriptRulesService !== 'undefined') {
            adguard.backend.loadLocalScriptRules(function (json) {
                localScriptRulesService.setLocalScriptRules(json);
                successCallback();
            }, errorCallback);
        } else {
            // LocalScriptRulesService may be undefined, in this case don't load local script rules
            successCallback();
        }
    }

    /**
     * Localize group
     * @param group
     * @param i18nMetadata
     * @private
     */
    function applyGroupLocalization(group, i18nMetadata) {
        var groupId = group.groupId;
        var localizations = i18nMetadata[groupId];
        var locale = adguard.app.getLocale();
        if (localizations && locale in localizations) {
            var localization = localizations[locale];
            group.groupName = localization.name;
        }
    }

    /**
     * Localize filter
     * @param filter
     * @param i18nMetadata
     * @private
     */
    function applyFilterLocalization(filter, i18nMetadata) {
        var filterId = filter.filterId;
        var localizations = i18nMetadata[filterId];
        var locale = adguard.app.getLocale();
        if (localizations && locale in localizations) {
            var localization = localizations[locale];
            filter.name = localization.name;
            filter.description = localization.description;
        }
    }

    /**
     * Initialize subscription service, loading local filters metadata
     *
     * @param callback Called on operation success
     */
    var init = function (callback) {

        var errorCallback = function (request, cause) {
            adguard.console.error('Error loading metadata, cause: {0} {1}', request.statusText, cause);
        };

        loadMetadata(function () {
            loadMetadataI18n(function () {
                loadLocalScriptRules(callback, errorCallback);
            }, errorCallback);
        }, errorCallback);
    };

    /**
     * @returns Array of Filters metadata
     */
    var getFilters = function () {
        return filters;
    };

    /**
     * Gets filter metadata by filter identifier
     */
    var getFilterMetadata = function (filterId) {
        return filters.filter(function (f) {
            return f.filterId == filterId;
        })[0];
    };

    /**
     * @returns Array of Groups metadata
     */
    var getGroups = function () {
        return groups;
    };

    /**
     * Gets list of filters for the specified languages
     *
     * @param lang Language to check
     * @returns List of filters identifiers
     */
    var getFilterIdsForLanguage = function (lang) {
        if (!lang) {
            return [];
        }
        lang = lang.substring(0, 2).toLowerCase();
        var filterIds = [];
        for (var i = 0; i < filters.length; i++) {
            var filter = filters[i];
            var languages = filter.languages;
            if (languages && languages.indexOf(lang) >= 0) {
                filterIds.push(filter.filterId);
            }
        }
        return filterIds;
    };

    return {
        init: init,
        getFilterIdsForLanguage: getFilterIdsForLanguage,
        getGroups: getGroups,
        getFilters: getFilters,
        getFilterMetadata: getFilterMetadata,
        createSubscriptionFilterFromJSON: createSubscriptionFilterFromJSON
    };

})(adguard);

/* global FileUtils */

/**
 * Service that manages extension version information and handles
 * extension update. For instance we may need to change storage schema on update.
 */
adguard.applicationUpdateService = (function (adguard) {

    /**
     * File storage adapter
     * @Deprecated Used now only to upgrade from versions older than v2.3.5
     */
    var FileStorage = {

        LINE_BREAK: '\n',
        FILE_PATH: "filters.ini",

        readFromFile: function (path, callback) {

            var successCallback = function (fs, fileEntry) {

                fileEntry.file(function (file) {

                    var reader = new FileReader();
                    reader.onloadend = function () {

                        if (reader.error) {
                            callback(reader.error);
                        } else {
                            var lines = [];
                            if (reader.result) {
                                lines = reader.result.split(/[\r\n]+/);
                            }
                            callback(null, lines);
                        }
                    };

                    reader.onerror = function (e) {
                        callback(e);
                    };

                    reader.readAsText(file);

                }, callback);
            };

            this._getFile(path, true, successCallback, callback);
        },

        _getFile: function (path, create, successCallback, errorCallback) {

            path = path.replace(/^.*[\/\\]/, "");

            var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
            requestFileSystem(window.PERSISTENT, 1024 * 1024 * 1024, function (fs) {
                fs.root.getFile(path, {create: create}, function (fileEntry) {
                    successCallback(fs, fileEntry);
                }, errorCallback);
            }, errorCallback);
        },

        removeFile: function (path, successCallback, errorCallback) {
            this._getFile(path, false, function (fs, fileEntry) {
                fileEntry.remove(successCallback, errorCallback);
            }, errorCallback);
        }
    };

    /**
     * Helper to execute deferred objects
     *
     * @param methods Methods to execute
     * @returns {Deferred}
     * @private
     */
    function executeMethods(methods) {

        var mainDfd = new adguard.utils.Promise();

        var executeNextMethod = function () {
            if (methods.length === 0) {
                mainDfd.resolve();
            } else {
                var method = methods.shift();
                var dfd = method();
                dfd.then(executeNextMethod);
            }
        };

        executeNextMethod();

        return mainDfd;
    }

    /**
     * Earlier filters rules were saved to filters.ini.
     * Now filters rules save to filter_1.txt, filter_2.txt, ...
     * @private
     */
    function onUpdateToSaveFilterRulesToDifferentFiles() {

        adguard.console.info('Call update to version 1.0.1.0');

        var updateDfd = new adguard.utils.Promise();

        adguard.rulesStorage.read(function (filters) {

            var adguardFilters = Object.create(null);

            var processNextFilter = function () {
                if (filters.length === 0) {
                    //update adguard-filters in local storage for next update iteration
                    adguard.localStorage.setItem('adguard-filters', JSON.stringify(adguardFilters));

                    //cleanup old file
                    var removeCallback = function () {
                        // Ignore
                    };
                    adguard.rulesStorageImpl.remove(FileStorage.FILE_PATH, removeCallback, removeCallback);
                    updateDfd.resolve();
                } else {
                    var filter = filters.shift();
                    adguardFilters[filter.filterId] = {
                        version: filter.version,
                        lastCheckTime: filter.lastCheckTime,
                        lastUpdateTime: filter.lastUpdateTime,
                        disabled: filter.disabled
                    };
                    var dfd = new adguard.utils.Promise();
                    var rulesText = adguard.utils.collections.getRulesText(filter.filterRules);
                    adguard.rulesStorage.write(filter.filterId, rulesText, dfd.resolve);
                    dfd.then(processNextFilter);
                }
            };

            processNextFilter();
        });

        return updateDfd;
    }

    /**
     * Update to version with filter subscriptions
     *
     * version 1.0.3.0
     * @private
     */
    function onUpdateToMultiplySubscriptions() {

        adguard.console.info('Call update to version 1.0.3.0');

        if (adguard.localStorage.hasItem('adguard-filters')) {
            saveInstalledFiltersOnUpdate();
            saveFiltersVersionInfoOnUpdate();
            adguard.localStorage.removeItem('adguard-filters');
        }

        var dfd = new adguard.utils.Promise();
        dfd.resolve();
        return dfd;
    }

    /**
     * Update to version without ip-resolve
     *
     * version 2.0.0
     * @private
     */
    function onUpdateRemoveIpResolver() {

        adguard.console.info('Call update to version 1.0.3.0');

        adguard.localStorage.removeItem('ip-cache');

        var dfd = new adguard.utils.Promise();
        dfd.resolve();
        return dfd;
    }

    /**
     * Update whitelist service
     *
     * Version 2.0.9
     * @private
     */
    function onUpdateWhiteListService() {

        adguard.console.info('Call update to version 2.0.9');

        var dfd = new adguard.utils.Promise();

        var filterId = adguard.utils.filters.WHITE_LIST_FILTER_ID;

        adguard.rulesStorage.read(filterId, function (rulesText) {

            var whiteListDomains = [];

            if (!rulesText) {
                dfd.resolve();
                return;
            }

            for (var i = 0; i < rulesText.length; i++) {
                if (/^@@\/\/([^\/]+)\^\$document$/.test(rulesText[i])) {
                    var domain = RegExp.$1;
                    if (whiteListDomains.indexOf(domain) < 0) {
                        whiteListDomains.push(domain);
                    }
                }
            }

            adguard.localStorage.setItem('white-list-domains', JSON.stringify(whiteListDomains));

            dfd.resolve();
        });

        return dfd;
    }

    /**
     * Update rule hit stats
     *
     * Version 2.0.10
     * @private
     */
    function onUpdateRuleHitStats() {

        adguard.hitStats.cleanup();

        var dfd = new adguard.utils.Promise();
        dfd.resolve();
        return dfd;
    }

    /**
     * Update Firefox storage by moving to prefs
     *
     * Version 2.1.2
     * @returns {Promise}
     * @private
     */
    function onUpdateFirefoxStorage() {

        adguard.console.info('Call update to version 2.1.2');

        var dfd = new adguard.utils.Promise();

        readFirefoxSdkLocalStorage(function (storage) {
            if (storage) {
                for (var key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        if (key === 'app-version') { // Skip app-version property. It has already set.
                            continue;
                        }
                        adguard.localStorage.setItem(key, storage[key]);
                    }
                }
            }
            try {
                var storeFile = getSdkLocalStorageFile();
                if (storeFile.exists()) {
                    storeFile.remove(0);
                }
            } catch (ex) {
                adguard.console.error('Adguard addon: Cannot remove sdk simple-storage store.json file: {0}', ex);
            }
            dfd.resolve();
        });

        return dfd;
    }

    /**
     * Updates filters storage - move from files to the storage API.
     *
     * Version 2.3.5
     * @returns {Promise}
     * @private
     */
    function onUpdateChromiumStorage() {
        adguard.console.info('Call update to version 2.3.5');

        var dfd = new adguard.utils.Promise();

        var filterId = adguard.utils.filters.USER_FILTER_ID;
        var filePath = "filterrules_" + filterId + ".txt";

        FileStorage.readFromFile(filePath, function (e, rules) {
            if (e) {
                adguard.console.error("Error while reading rules from file {0} cause: {1}", filePath, e);
                return;
            }

            var onTransferCompleted = function () {
                adguard.console.info("Rules have been transferred to local storage for filter {0}", filterId);

                FileStorage.removeFile(filePath, function () {
                    adguard.console.info("File removed for filter {0}", filterId);
                }, function () {
                    adguard.console.error("File remove error for filter {0}", filterId);
                });
            };

            if (rules) {
                adguard.console.info('Found rules:' + rules.length);
            }

            adguard.rulesStorage.write(filterId, rules, onTransferCompleted);
        });

        dfd.resolve();
        return dfd;
    }

    /**
     * Mark 'adguard-filters' as installed and loaded on extension version update
     * @private
     */
    function saveInstalledFiltersOnUpdate() {

        var adguardFilters = JSON.parse(adguard.localStorage.getItem('adguard-filters')) || Object.create(null);

        for (var filterId in adguardFilters) { // jshint ignore:line
            var filterInfo = adguardFilters[filterId];
            if (filterId == adguard.utils.filters.USER_FILTER_ID || filterId == adguard.utils.filters.WHITE_LIST_FILTER_ID) {
                continue;
            }
            var filter = {
                filterId: filterId,
                loaded: true
            };
            if (!filterInfo.disabled) {
                filter.installed = true;
                filter.enabled = true;
            }
            if (filterId == adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID) {
                filter.installed = true;
            }
            adguard.filtersState.updateFilterState(filter);
        }
    }

    /**
     * Update 'adguard-filters' version and last check and update time
     * @private
     */
    function saveFiltersVersionInfoOnUpdate() {

        var adguardFilters = JSON.parse(adguard.localStorage.getItem('adguard-filters')) || Object.create(null);

        for (var filterId in adguardFilters) { // jshint ignore:line
            var filterInfo = adguardFilters[filterId];
            var filter = {
                filterId: filterId,
                version: filterInfo.version,
                lastCheckTime: filterInfo.lastCheckTime,
                lastUpdateTime: filterInfo.lastUpdateTime
            };
            adguard.filtersState.updateFilterVersion(filter);
        }
    }

    /**
     * Firefox sdk simple-storage settings are saved into file: [ProfD]/jetpack/[extension_id]/simple-storage
     * See lib/sdk/simple-storage.js:248 for details
     * @returns {*}
     */
    /**
     The filename of the store, based on the profile dir and extension ID.
     get filename() {
     let storeFile = Cc["@mozilla.org/file/directory_service;1"].
     getService(Ci.nsIProperties).
     get("ProfD", Ci.nsIFile);
     storeFile.append(JETPACK_DIR_BASENAME);
     storeFile.append(jpSelf.id);
     storeFile.append("simple-storage");
     file.mkpath(storeFile.path);
     storeFile.append("store.json");
     return storeFile.path;
     }
     */
    function getSdkLocalStorageFile() {
        return FileUtils.getFile('ProfD', ['jetpack', adguard.app.getId(), 'simple-storage', 'store.json']);
    }

    /**
     * Reads file where sdk simple-storage values were saved
     * @param callback Callback with passed json object (object may be null)
     */
    function readFirefoxSdkLocalStorage(callback) {

        var storeFile = getSdkLocalStorageFile();
        if (!storeFile.exists() || storeFile.fileSize === 0) {
            callback();
            return;
        }

        adguard.fileStorageImpl.readAsync(storeFile, function (error, data) {
            var storage = null;
            if (error) {
                adguard.console.error('Error read firefox sdk local storage: {0}', error);
            } else {
                try {
                    storage = JSON.parse(data);
                } catch (ex) {
                    adguard.console.error('Error read firefox sdk local storage: {0}', ex);
                }
            }
            callback(storage);
        });
    }

    /**
     * Async loads previous version of installed application
     * @param callback Callback with passed version (version may be null)
     */
    function loadApplicationPreviousVersion(callback) {

        var prevVersion = adguard.utils.browser.getAppVersion();
        if (prevVersion || !adguard.utils.browser.isFirefoxBrowser()) {
            callback(prevVersion);
            return;
        }

        // In version 2.1.2 we migrated to prefs instead of sdk simple-storage. Let's try to retrieve version from simple-storage file.
        readFirefoxSdkLocalStorage(function (storage) {
            var prevVersionInStorage = null;
            if (storage) {
                prevVersionInStorage = storage['app-version'];
            }
            callback(prevVersionInStorage);
        });
    }

    /**
     * Async returns extension run info
     *
     * @param callback Run info callback with passed object {{isFirstRun: boolean, isUpdate: (boolean|*), currentVersion: (Prefs.version|*), prevVersion: *}}
     */
    var getRunInfo = function (callback) {

        loadApplicationPreviousVersion(function (prevVersion) {

            var currentVersion = adguard.app.getVersion();
            adguard.utils.browser.setAppVersion(currentVersion);

            var isFirstRun = !!(currentVersion !== prevVersion && !prevVersion);
            var isUpdate = !!(currentVersion !== prevVersion && prevVersion);

            callback({
                isFirstRun: isFirstRun,
                isUpdate: isUpdate,
                currentVersion: currentVersion,
                prevVersion: prevVersion
            });
        });
    };

    /**
     * Handle extension update
     * @param runInfo   Run info
     * @param callback  Called after update was handled
     */
    var onUpdate = function (runInfo, callback) {

        var methods = [];
        if (adguard.utils.browser.isGreaterVersion("1.0.1.0", runInfo.prevVersion)) {
            methods.push(onUpdateToSaveFilterRulesToDifferentFiles);
        }
        if (adguard.utils.browser.isGreaterVersion("1.0.3.0", runInfo.prevVersion)) {
            methods.push(onUpdateToMultiplySubscriptions);
        }
        if (adguard.utils.browser.isGreaterVersion("2.0.0", runInfo.prevVersion)) {
            methods.push(onUpdateRemoveIpResolver);
        }
        if (adguard.utils.browser.isGreaterVersion("2.0.9", runInfo.prevVersion)) {
            methods.push(onUpdateWhiteListService);
        }
        if (adguard.utils.browser.isGreaterVersion("2.0.10", runInfo.prevVersion)) {
            methods.push(onUpdateRuleHitStats);
        }
        if (adguard.utils.browser.isGreaterVersion("2.1.2", runInfo.prevVersion) && adguard.utils.browser.isFirefoxBrowser()) {
            methods.push(onUpdateFirefoxStorage);
        }
        if (adguard.utils.browser.isGreaterVersion("2.3.5", runInfo.prevVersion) && adguard.utils.browser.isChromium() && !adguard.utils.browser.isSafariBrowser()) {
            methods.push(onUpdateChromiumStorage);
        }

        var dfd = executeMethods(methods);
        dfd.then(callback);
    };

    return {
        getRunInfo: getRunInfo,
        onUpdate: onUpdate
    };

})(adguard);

adguard.whitelist = (function (adguard) {

    var WHITE_LIST_DOMAINS_LS_PROP = 'white-list-domains';
    var BLOCK_LIST_DOMAINS_LS_PROP = 'block-list-domains';

    var allowAllWhiteListRule = new adguard.rules.UrlFilterRule('@@whitelist-all$document', adguard.utils.filters.WHITE_LIST_FILTER_ID);

    var defaultWhiteListMode = adguard.settings.isDefaultWhiteListMode();

    var whiteListFilter = new adguard.rules.UrlFilter();
    var blockListFilter = new adguard.rules.UrlFilter();

    /**
     * Read domains and initialize filters lazy
     */
    var whiteListDomainsHolder = {
        get domains() {
            return adguard.lazyGet(whiteListDomainsHolder, 'domains', function () {
                // Reading from local storage
                var domains = getDomainsFromLocalStorage(WHITE_LIST_DOMAINS_LS_PROP);
                for (var i = 0; i < domains.length; i++) {
                    var rule = createWhiteListRule(domains[i]);
                    if (rule) {
                        whiteListFilter.addRule(rule);
                    }
                }
                return domains;
            });
        },
        add: function (domain) {
            if (this.domains.indexOf(domain) < 0) {
                this.domains.push(domain);
            }
        }
    };
    var blockListDomainsHolder = {
        get domains() {
            return adguard.lazyGet(blockListDomainsHolder, 'domains', function () {
                // Reading from local storage
                var domains = getDomainsFromLocalStorage(BLOCK_LIST_DOMAINS_LS_PROP);
                for (var i = 0; i < domains.length; i++) {
                    var rule = createWhiteListRule(domains[i]);
                    if (rule) {
                        blockListFilter.addRule(rule);
                    }
                }
                return domains;
            });
        },
        add: function (domain) {
            if (this.domains.indexOf(domain) < 0) {
                this.domains.push(domain);
            }
        }
    };

    /**
     * Create whitelist rule from input text
     * @param domain Domain
     * @returns {*}
     * @private
     */
    function createWhiteListRule(domain) {
        if (adguard.utils.strings.isEmpty(domain)) {
            return null;
        }
        return adguard.rules.builder.createRule("@@//" + domain + "$document", adguard.utils.filters.WHITE_LIST_FILTER_ID);
    }

    /**
     * Adds domain to array of whitelist domains
     * @param domain
     */
    function addDomainToWhiteList(domain) {
        if (!domain) {
            return;
        }
        if (defaultWhiteListMode) {
            whiteListDomainsHolder.add(domain);
        } else {
            blockListDomainsHolder.add(domain);
        }
    }

    /**
     * Remove domain form whitelist domains
     * @param domain
     */
    function removeDomainFromWhiteList(domain) {
        if (!domain) {
            return;
        }
        if (defaultWhiteListMode) {
            adguard.utils.collections.removeAll(whiteListDomainsHolder.domains, domain);
        } else {
            adguard.utils.collections.removeAll(blockListDomainsHolder.domains, domain);
        }
    }

    /**
     * Save domains to local storage
     */
    function saveDomainsToLocalStorage() {
        adguard.localStorage.setItem(WHITE_LIST_DOMAINS_LS_PROP, JSON.stringify(whiteListDomainsHolder.domains));
        adguard.localStorage.setItem(BLOCK_LIST_DOMAINS_LS_PROP, JSON.stringify(blockListDomainsHolder.domains));
    }

    /**
     * Retrieve domains from local storage
     * @param prop
     * @returns {Array}
     */
    function getDomainsFromLocalStorage(prop) {
        var domains = [];
        try {
            var json = adguard.localStorage.getItem(prop);
            if (json) {
                domains = JSON.parse(json);
            }
        } catch (ex) {
            adguard.console.error("Error retrieve whitelist domains {0}, cause {1}", prop, ex);
        }
        return domains;
    }

    /**
     * Adds domain to whitelist
     * @param domain
     */
    function addToWhiteList(domain) {
        var rule = createWhiteListRule(domain);
        if (rule) {
            if (defaultWhiteListMode) {
                whiteListFilter.addRule(rule);
            } else {
                blockListFilter.addRule(rule);
            }
            addDomainToWhiteList(domain);
            saveDomainsToLocalStorage();
        }
    }

    /**
     * Search for whitelist rule by url.
     */
    var findWhiteListRule = function (url) {

        if (!url) {
            return null;
        }

        var host = adguard.utils.url.getHost(url);

        if (defaultWhiteListMode) {
            return whiteListFilter.isFiltered(url, host, adguard.RequestTypes.DOCUMENT, false);
        } else {
            var rule = blockListFilter.isFiltered(url, host, adguard.RequestTypes.DOCUMENT, false);
            if (rule) {
                //filtering is enabled on this website
                return null;
            } else {
                return allowAllWhiteListRule;
            }
        }
    };

    /**
     * Returns whitelist mode
     * In default mode filtration is enabled for all sites
     * In inverted model filtration is disabled for all sites
     */
    var isDefaultMode = function () {
        return defaultWhiteListMode;
    };

    /**
     * Changes whitelist mode
     * @param defaultMode
     */
    var changeDefaultWhiteListMode = function (defaultMode) {
        defaultWhiteListMode = defaultMode;
        adguard.settings.changeDefaultWhiteListMode(defaultMode);
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Stop (or start in case of inverted mode) filtration for url
     * @param url
     */
    var whiteListUrl = function (url) {
        var domain = adguard.utils.url.getHost(url);
        if (defaultWhiteListMode) {
            addToWhiteList(domain);
        } else {
            removeFromWhiteList(domain);
        }
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Start (or stop in case of inverted mode) filtration for url
     * @param url
     */
    var unWhiteListUrl = function (url) {
        var domain = adguard.utils.url.getHost(url);
        if (defaultWhiteListMode) {
            removeFromWhiteList(domain);
        } else {
            addToWhiteList(domain);
        }
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Add domains to whitelist
     * @param domains
     */
    var addToWhiteListArray = function (domains) {
        if (!domains) {
            return;
        }
        var rules = [];
        for (var i = 0; i < domains.length; i++) {
            var domain = domains[i];
            var rule = createWhiteListRule(domain);
            if (rule) {
                rules.push(rule);
                if (defaultWhiteListMode) {
                    whiteListFilter.addRule(rule);
                } else {
                    blockListFilter.addRule(rule);
                }
                addDomainToWhiteList(domain);
            }
        }
        saveDomainsToLocalStorage();
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Remove domain from whitelist
     * @param domain
     */
    var removeFromWhiteList = function (domain) {
        var rule = createWhiteListRule(domain);
        if (rule) {
            if (defaultWhiteListMode) {
                whiteListFilter.removeRule(rule);
            } else {
                blockListFilter.removeRule(rule);
            }
        }
        removeDomainFromWhiteList(domain);
        saveDomainsToLocalStorage();
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Clear whitelist
     */
    var clearWhiteList = function () {
        if (defaultWhiteListMode) {
            adguard.localStorage.removeItem(WHITE_LIST_DOMAINS_LS_PROP);
            adguard.lazyGetClear(whiteListDomainsHolder, 'domains');
            whiteListFilter = new adguard.rules.UrlFilter();
        } else {
            adguard.localStorage.removeItem(BLOCK_LIST_DOMAINS_LS_PROP);
            adguard.lazyGetClear(blockListDomainsHolder, 'domains');
            blockListFilter = new adguard.rules.UrlFilter();
        }
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Returns the array of whitelist domains
     */
    var getWhiteListDomains = function () {
        if (defaultWhiteListMode) {
            return whiteListDomainsHolder.domains;
        } else {
            return blockListDomainsHolder.domains;
        }
    };

    /**
     * Returns the array of loaded rules
     */
    var getRules = function () {
        //TODO: blockListFilter

        return whiteListFilter.getRules();
    };

    return {

        getRules: getRules,
        getWhiteListDomains: getWhiteListDomains,

        findWhiteListRule: findWhiteListRule,

        whiteListUrl: whiteListUrl,
        unWhiteListUrl: unWhiteListUrl,

        addToWhiteListArray: addToWhiteListArray,

        removeFromWhiteList: removeFromWhiteList,
        clearWhiteList: clearWhiteList,

        isDefaultMode: isDefaultMode,
        changeDefaultWhiteListMode: changeDefaultWhiteListMode
    };

})(adguard);

/**
 * Class for manage user rules
 */
adguard.userrules = (function (adguard) {

    'use strict';

    /**
     * Wraps access to getter. AntiBannerService hasn't been defined yet.
     * @returns {*}
     */
    function getAntiBannerService() {
        return adguard.antiBannerService;
    }

    /**
     * User rules collection
     * @type {Array}
     */
    var userRules = [];

    /**
     * Gets user rules
     */
    var getRules = function () {
        return userRules;
    };

    /**
     * Set user rules. Calls on filter initialization, when we have already read rules from storage.
     * @param rules
     */
    var setRules = function (rules) {
        userRules = rules;
    };

    /**
     * Adds list of rules to the user filter
     *
     * @param rulesText List of rules to add
     */
    var addRules = function (rulesText) {
        var rules = getAntiBannerService().addFilterRules(adguard.utils.filters.USER_FILTER_ID, rulesText);
        for (var i = 0; i < rules.length; i++) {
            userRules.push(rules[i].ruleText);
        }
        return rules;
    };

    /**
     * Removes all user's custom rules
     */
    var clearRules = function () {
        userRules = [];
        getAntiBannerService().clearFilterRules(adguard.utils.filters.USER_FILTER_ID);
    };

    /**
     * Removes user's custom rule
     *
     * @param ruleText Rule text
     */
    var removeRule = function (ruleText) {
        adguard.utils.collections.removeAll(userRules, ruleText);
        getAntiBannerService().removeFilterRule(adguard.utils.filters.USER_FILTER_ID, ruleText);
    };

    var unWhiteListFrame = function (frameInfo) {
        if (frameInfo.frameRule) {
            if (frameInfo.frameRule.filterId === adguard.utils.filters.WHITE_LIST_FILTER_ID) {
                adguard.whitelist.unWhiteListUrl(frameInfo.url);
            } else {
                removeRule(frameInfo.frameRule.ruleText);
            }
        }
    };

    return {
        getRules: getRules,
        setRules: setRules,
        addRules: addRules,
        clearRules: clearRules,
        removeRule: removeRule,
        //TODO: fix
        unWhiteListFrame: unWhiteListFrame
    };

})(adguard);

(function (adguard) {

    'use strict';

    /**
     * Request filter is main class which applies filter rules.
     *
     * @type {Function}
     */
    var RequestFilter = function () {

        // Filter that applies URL blocking rules
        // Basic rules: http://adguard.com/en/filterrules.html#baseRules
        this.urlBlockingFilter = new adguard.rules.UrlFilter();

        // Filter that applies whitelist rules
        // Exception rules: http://adguard.com/en/filterrules.html#exclusionRules
        this.urlWhiteFilter = new adguard.rules.UrlFilter();

        // Filter that applies CSS rules
        // ABP element hiding rules: http://adguard.com/en/filterrules.html#hideRules
        // CSS injection rules http://adguard.com/en/filterrules.html#cssInjection
        this.cssFilter = new adguard.rules.CssFilter();

        // Filter that applies JS rules
        // JS injection rules: http://adguard.com/en/filterrules.html#javascriptInjection
        this.scriptFilter = new adguard.rules.ScriptFilter();

        // Rules count (includes all types of rules)
        this.rulesCount = 0;

        // Init small cache for url filtering rules
        this.requestCache = Object.create(null);
        this.requestCacheSize = 0;
    };

    RequestFilter.prototype = {

        /**
         * Cache capacity
         */
        requestCacheMaxSize: 1000,

        /**
         * Adds rules to the request filter
         *
         * @param rules List of rules to add
         */
        addRules: function (rules) {
            if (!rules) {
                return;
            }
            for (var i = 0; i < rules.length; i++) {
                this.addRule(rules[i]);
            }
        },

        /**
         * Adds rule to the request filter.
         * Rule is added to one of underlying filter objects depending on the rule type.
         *
         * @param rule     Rule to add. Rule should be an object of
         *                 one of these classes: UrlFilterRule, CssFilterRule, ScriptFilterRule
         */
        addRule: function (rule) {
            if (rule === null || !rule.ruleText) {
                adguard.console.error("FilterRule must not be null");
                return;
            }
            if (rule instanceof adguard.rules.UrlFilterRule) {
                if (rule.whiteListRule) {
                    this.urlWhiteFilter.addRule(rule);
                } else {
                    this.urlBlockingFilter.addRule(rule);
                }
            } else if (rule instanceof adguard.rules.CssFilterRule) {
                this.cssFilter.addRule(rule);
            } else if (rule instanceof adguard.rules.ScriptFilterRule) {
                this.scriptFilter.addRule(rule);
            }
            this.rulesCount++;
            this._clearRequestCache();
        },

        /**
         * Removes rule from the RequestFilter.
         * Rule is removed from one of underlying filters depending on the rule type.
         *
         * @param rule Rule to be removed
         */
        removeRule: function (rule) {
            if (rule === null) {
                adguard.console.error("FilterRule must not be null");
                return;
            }
            if (rule instanceof adguard.rules.UrlFilterRule) {
                if (rule.whiteListRule) {
                    this.urlWhiteFilter.removeRule(rule);
                } else {
                    this.urlBlockingFilter.removeRule(rule);
                }
            } else if (rule instanceof adguard.rules.CssFilterRule) {
                this.cssFilter.removeRule(rule);
            } else if (rule instanceof adguard.rules.ScriptFilterRule) {
                this.scriptFilter.removeRule(rule);
            }
            this.rulesCount--;
            this._clearRequestCache();
        },

        /**
         * Returns the array of loaded rules
         */
        getRules: function () {
            var result = [];

            result = result.concat(this.urlWhiteFilter.getRules());
            result = result.concat(this.urlBlockingFilter.getRules());
            result = result.concat(this.cssFilter.getRules());
            result = result.concat(this.scriptFilter.getRules());

            return result;
        },

        /**
         * Builds CSS for the specified web page.
         * Only element hiding rules are used to build this CSS:
         * http://adguard.com/en/filterrules.html#hideRules
         *
         * @param url Page URL
         * @param genericHide flag to hide common rules
         * @returns CSS ready to be injected
         */
        getSelectorsForUrl: function (url, genericHide) {
            var domain = adguard.utils.url.getDomainName(url);
            if (adguard.prefs.collectHitsCountEnabled && adguard.settings.collectHitsCount()) {
                // If user has enabled "Send statistics for ad filters usage" option we build CSS with enabled hits stats.
                // In this case style contains "content" with filter identifier and rule text.
                var selectors = this.cssFilter.buildCssHits(domain, genericHide);
                selectors.cssHitsCounterEnabled = true;
                return selectors;
            } else {
                return this.cssFilter.buildCss(domain, genericHide);
            }
        },

        /**
         * Builds CSS for the specified web page.
         * Only CSS injection rules used to build this CSS:
         * http://adguard.com/en/filterrules.html#cssInjection
         *
         * @param url Page URL
         * @param genericHide flag to hide common rules
         * @returns CSS ready to be injected.
         */
        getInjectedSelectorsForUrl: function (url, genericHide) {
            var domain = adguard.utils.url.getDomainName(url);
            return this.cssFilter.buildInjectCss(domain, genericHide);
        },

        /**
         * Builds domain-specific JS injection for the specified page.
         * http://adguard.com/en/filterrules.html#javascriptInjection
         *
         * @param url Page URL
         * @returns Javascript
         */
        getScriptsForUrl: function (url) {
            var domain = adguard.utils.url.toPunyCode(adguard.utils.url.getDomainName(url));
            return this.scriptFilter.buildScript(domain);
        },

        /**
         * Clears RequestFilter
         */
        clearRules: function () {
            this.urlWhiteFilter.clearRules();
            this.urlBlockingFilter.clearRules();
            this.cssFilter.clearRules();
            this._clearRequestCache();
        },

        /**
         * Searches for the whitelist rule for the specified pair (url/referrer)
         *
         * @param requestUrl  Request URL
         * @param referrer    Referrer
         * @param requestType        Exception rule modifier (either DOCUMENT or ELEMHIDE or JSINJECT)
         * @returns Filter rule found or null
         */
        findWhiteListRule: function (requestUrl, referrer, requestType) {

            var refHost = adguard.utils.url.getHost(referrer);
            var thirdParty = adguard.utils.url.isThirdPartyRequest(requestUrl, referrer);

            var cacheItem = this._searchRequestCache(requestUrl, refHost, requestType);

            if (cacheItem) {
                // Element with zero index is a filter rule found last time
                return cacheItem[0];
            }

            var rule = this._checkWhiteList(requestUrl, refHost, requestType, thirdParty);

            this._saveResultToCache(requestUrl, rule, refHost, requestType);
            return rule;
        },

        /**
         * Searches for the filter rule for the specified request.
         *
         * @param requestUrl            Request URL
         * @param documentUrl           Document URL
         * @param requestType           Request content type (one of UrlFilterRule.contentTypes)
         * @param documentWhitelistRule (optional) Document-level whitelist rule
         * @returns Rule found or null
         */
        findRuleForRequest: function (requestUrl, documentUrl, requestType, documentWhitelistRule) {

            var documentHost = adguard.utils.url.getHost(documentUrl);
            var thirdParty = adguard.utils.url.isThirdPartyRequest(requestUrl, documentUrl);

            var cacheItem = this._searchRequestCache(requestUrl, documentHost, requestType);

            if (cacheItem) {
                // Element with zero index is a filter rule found last time
                return cacheItem[0];
            }

            var rule = this._findRuleForRequest(requestUrl, documentHost, requestType, thirdParty, documentWhitelistRule);

            this._saveResultToCache(requestUrl, rule, documentHost, requestType);
            return rule;
        },

        /**
         * Checks if exception rule is present for the URL/Referrer pair
         *
         * @param requestUrl    Request URL
         * @param documentHost  Document URL host
         * @param requestType   Request content type (one of UrlFilterRule.contentTypes)
         * @param thirdParty    Is request third-party or not
         * @returns Filter rule found or null
         * @private
         */
        _checkWhiteList: function (requestUrl, documentHost, requestType, thirdParty) {
            if (this.urlWhiteFilter === null || !requestUrl) {
                return null;
            }
            return this.urlWhiteFilter.isFiltered(requestUrl, documentHost, requestType, thirdParty);
        },

        /**
         * Checks if there is a rule blocking this request
         *
         * @param requestUrl    Request URL
         * @param refHost       Referrer host
         * @param requestType   Request content type (one of UrlFilterRule.contentTypes)
         * @param thirdParty    Is request third-party or not
         * @param genericRulesAllowed    Is generic rules allowed
         * @returns Filter rule found or null
         * @private
         */
        _checkUrlBlockingList: function (requestUrl, refHost, requestType, thirdParty, genericRulesAllowed) {
            if (this.urlBlockingFilter === null || !requestUrl) {
                return null;
            }

            return this.urlBlockingFilter.isFiltered(requestUrl, refHost, requestType, thirdParty, !genericRulesAllowed);
        },

        /**
         * Searches the rule for request.
         *
         * @param requestUrl    Request URL
         * @param documentHost  Document host
         * @param requestType   Request content type (one of UrlFilterRule.contentTypes)
         * @param thirdParty    Is request third-party or not
         * @param documentWhiteListRule (optional) Document-level whitelist rule
         * @returns Filter rule found or null
         * @private
         */
        _findRuleForRequest: function (requestUrl, documentHost, requestType, thirdParty, documentWhiteListRule) {

            adguard.console.debug("Filtering http request for url: {0}, document: {1}, requestType: {2}", requestUrl, documentHost, requestType);

            // STEP 1: Looking for exception rule, which could be applied to the current request

            // Checks white list for a rule for this RequestUrl. If something is found - returning it.
            var urlWhiteListRule = this._checkWhiteList(requestUrl, documentHost, requestType, thirdParty);

            // If UrlBlock is set - than we should not use UrlBlockingFilter against this request.
            // Now check if document rule has $genericblock or $urlblock modifier
            var genericRulesAllowed = !documentWhiteListRule || !documentWhiteListRule.checkContentType("GENERICBLOCK");
            var urlRulesAllowed = !documentWhiteListRule || !documentWhiteListRule.checkContentType("URLBLOCK");

            // STEP 2: Looking for blocking rule, which could be applied to the current request

            // Look for blocking rules
            var blockingRule = this._checkUrlBlockingList(requestUrl, documentHost, requestType, thirdParty, genericRulesAllowed);

            // STEP 3: Analyze results, first - basic exception rule

            if (urlWhiteListRule &&
                    // Please note, that if blocking rule has $important modifier, it could
                    // overcome existing exception rule
                (urlWhiteListRule.isImportant || !blockingRule || !blockingRule.isImportant)) {
                adguard.console.debug("White list rule found {0} for url: {1} document: {2}, requestType: {3}", urlWhiteListRule.ruleText, requestUrl, documentHost, requestType);
                return urlWhiteListRule;
            }

            if (!genericRulesAllowed || !urlRulesAllowed) {
                adguard.console.debug("White list rule {0} found for document: {1}", documentWhiteListRule.ruleText, documentHost);
            }

            if (!urlRulesAllowed) {
                // URL whitelisted
                return documentWhiteListRule;
            }

            if (blockingRule) {
                adguard.console.debug("Black list rule {0} found for url: {1}, document: {2}, requestType: {3}", blockingRule.ruleText, requestUrl, documentHost, requestType);
            }

            return blockingRule;
        },

        /**
         * Searches for cached filter rule
         *
         * @param requestUrl Request url
         * @param refHost Referrer host
         * @param requestType Request type
         * @private
         */
        _searchRequestCache: function (requestUrl, refHost, requestType) {
            var cacheItem = this.requestCache[requestUrl];
            if (!cacheItem) {
                return null;
            }

            var c = cacheItem[requestType];
            if (c && c[1] === refHost) {
                return c;
            }

            return null;
        },

        /**
         * Saves resulting filtering rule to requestCache
         *
         * @param requestUrl Request url
         * @param rule Rule found
         * @param refHost Referrer host
         * @param requestType Request type
         * @private
         */
        _saveResultToCache: function (requestUrl, rule, refHost, requestType) {
            if (this.requestCacheSize > this.requestCacheMaxSize) {
                this._clearRequestCache();
            }
            if (!this.requestCache[requestUrl]) {
                this.requestCache[requestUrl] = Object.create(null);
                this.requestCacheSize++;
            }

            //Two-levels gives us an ability to not to override cached item for different request types with the same url
            this.requestCache[requestUrl][requestType] = [rule, refHost];
        },

        /**
         * Clears request cache
         * @private
         */
        _clearRequestCache: function () {
            if (this.requestCacheSize === 0) {
                return;
            }

            this.requestCache = Object.create(null);
            this.requestCacheSize = 0;
        }
    };

    adguard.RequestFilter = RequestFilter;

})(adguard);

/**
 * Creating service that manages our filter rules.
 */
adguard.antiBannerService = (function (adguard) {

    /**
     * Represents filter metadata
     *
     * @param filterId Filter identifier
     * @constructor
     */
    var AdguardFilter = function (filterId) {
        this.filterId = filterId;
        this.name = null;
        this.description = null;
        this.version = null;
        this.lastUpdateTime = null;
        this.lastCheckTime = null;
        this.enabled = false;
    };

    // List of filters
    var adguardFilters = [];

    // Request filter contains all filter rules
    // This class does the actual filtering (checking URLs, constructing CSS/JS to inject, etc)
    var requestFilter = new adguard.RequestFilter();

    // Service is not initialized yet
    var requestFilterInitTime = 0;

    // Application is running flag
    var applicationRunning = false;

    // Application initialized flag (Sets on first call of 'start' method)
    var applicationInitialized = false;

    /**
     * Period for filters update check -- 48 hours
     */
    var UPDATE_FILTERS_PERIOD = 48 * 60 * 60 * 1000;

    /**
     * Delay before doing first filters update check -- 5 minutes
     */
    var UPDATE_FILTERS_DELAY = 5 * 60 * 1000;

    var FILTERS_CHANGE_DEBOUNCE_PERIOD = 1000;
    var RELOAD_FILTERS_DEBOUNCE_PERIOD = 1000;

    /**
     * List of events which cause RequestFilter re-creation
     * @type {Array}
     */
    var UPDATE_REQUEST_FILTER_EVENTS = [adguard.listeners.UPDATE_FILTER_RULES, adguard.listeners.FILTER_ENABLE_DISABLE];

    var isUpdateRequestFilterEvent = function (el) {
        return UPDATE_REQUEST_FILTER_EVENTS.indexOf(el.event) >= 0;
    };

    /**
     * List of events which cause saving filter rules to the rules storage
     * @type {Array}
     */
    var SAVE_FILTER_RULES_TO_STORAGE_EVENTS = [adguard.listeners.UPDATE_FILTER_RULES, adguard.listeners.ADD_RULES, adguard.listeners.REMOVE_RULE];

    var isSaveRulesToStorageEvent = function (el) {
        return SAVE_FILTER_RULES_TO_STORAGE_EVENTS.indexOf(el.event) >= 0;
    };

    /**
     * Persist state of content blocker
     */
    var contentBlockerInfo = {
        rulesCount: 0,
        rulesOverLimit: false
    };

    var reloadedRules = false;

    /**
     * AntiBannerService initialize method. Process install, update or simple run.
     * @param options Constructor options
     * @param callback
     */
    function initialize(options, callback) {

        /**
         * This method is called when filter subscriptions have been loaded from remote server.
         * It is used to recreate RequestFilter object.
         */
        var initRequestFilter = function () {
            loadFiltersVersionAndStateInfo();
            createRequestFilter(function () {
                addFiltersChangeEventListener();
                callback();
            });
        };

        /**
         * Callback for subscriptions loaded event
         */
        var onSubscriptionLoaded = function (runInfo) {

            // Initialize filters list
            adguardFilters = getAllAdguardFilters();

            // Subscribe to events which lead to update filters (e.g. switсh to optimized and back to default)
            subscribeToFiltersChangeEvents();

            if (runInfo.isFirstRun) {
                // Add event listener for filters change
                addFiltersChangeEventListener();
                // Run callback
                // Request filter will be initialized during install
                if (typeof options.onInstall === 'function') {
                    options.onInstall(callback);
                } else {
                    callback();
                }
            } else if (runInfo.isUpdate) {
                // Updating storage schema on extension update (if needed)
                adguard.applicationUpdateService.onUpdate(runInfo, initRequestFilter);
            } else {
                // Init RequestFilter object
                initRequestFilter();
            }

            // Schedule filters update job
            scheduleFiltersUpdate();
        };

        /**
         * Init extension common info.
         */
        adguard.applicationUpdateService.getRunInfo(function (runInfo) {
            // Load subscription from the storage
            adguard.subscriptions.init(onSubscriptionLoaded.bind(null, runInfo));
        });
    }

    /**
     * Initialize application (process install or update) . Create and start request filter
     * @param options
     * @param callback
     */
    var start = function (options, callback) {

        if (applicationRunning === true) {
            callback();
            return;
        }
        applicationRunning = true;

        if (!applicationInitialized) {
            initialize(options, callback);
            applicationInitialized = true;
            return;
        }

        createRequestFilter(callback);
    };

    /**
     * Clear request filter
     */
    var stop = function () {
        applicationRunning = false;
        requestFilter = new adguard.RequestFilter();
        adguard.listeners.notifyListeners(adguard.listeners.REQUEST_FILTER_UPDATED, getRequestFilterInfo());
    };

    /**
     * Checks application has been initialized
     * @returns {boolean}
     */
    var isInitialized = function () {
        return applicationInitialized;
    };

    /**
     * Getter for request filter
     */
    var getRequestFilter = function () {
        return requestFilter;
    };

    /**
     * Loads filter from storage (if in extension package) or from backend
     *
     * @param filterId Filter identifier
     * @param callback Called when operation is finished
     */
    var addAntiBannerFilter = function (filterId, callback) {

        var filter = getFilterById(filterId);
        if (filter.installed) {
            callback(true);
            return;
        }

        var onFilterLoaded = function (success) {
            if (success) {
                filter.installed = true;
                adguard.listeners.notifyListeners(adguard.listeners.FILTER_ADD_REMOVE, filter);
            }
            callback(success);
        };

        if (filter.loaded) {
            onFilterLoaded(true);
            return;
        }

        /**
         * TODO: when we want to load filter from backend, we should retrieve metadata from backend too, but not from local file.
         */
        var filterMetadata = adguard.subscriptions.getFilterMetadata(filterId);
        loadFilterRules(filterMetadata, false, onFilterLoaded);
    };

    /**
     * Reloads filters from backend
     *
     * @param successCallback
     * @param errorCallback
     * @private
     */
    function reloadAntiBannerFilters(successCallback, errorCallback) {
        resetFiltersVersion();
        checkAntiBannerFiltersUpdate(true, successCallback, errorCallback);
    }

    /**
     * Select filters for update. It depends on the time of last update.
     * @param forceUpdate Force update flag.
     * @returns {Array}
     */
    function selectFilterIdsToUpdate(forceUpdate) {
        var filterIds = [];
        for (var i = 0; i < adguardFilters.length; i++) {
            var filter = adguardFilters[i];
            if (filter.installed &&
                filter.filterId != adguard.utils.filters.USER_FILTER_ID &&
                filter.filterId != adguard.utils.filters.WHITE_LIST_FILTER_ID) {
                // Check filters update period (or forceUpdate flag)
                var needUpdate = forceUpdate || (!filter.lastCheckTime || (Date.now() - filter.lastCheckTime) >= UPDATE_FILTERS_PERIOD);
                if (needUpdate) {
                    filterIds.push(filter.filterId);
                }
            }
        }
        return filterIds;
    }

    /**
     * Checks filters updates.
     *
     * @param forceUpdate Normally we respect filter update period. But if this parameter is
     *                    true - we ignore it and check updates for all filters.
     * @param successCallback Called if filters were updated successfully
     * @param errorCallback Called if something gone wrong
     */
    var checkAntiBannerFiltersUpdate = function (forceUpdate, successCallback, errorCallback) {

        successCallback = successCallback || function () {
                // Empty callback
            };
        errorCallback = errorCallback || function () {
                // Empty callback
            };

        // Don't update in background if request filter isn't running
        if (!forceUpdate && !applicationRunning) {
            return;
        }

        adguard.console.info("Start checking filters updates");

        // Select filters for update
        var filterIdsToUpdate = selectFilterIdsToUpdate(forceUpdate);

        if (filterIdsToUpdate.length === 0) {
            if (successCallback) {
                successCallback([]);
                return;
            }
        }

        adguard.console.info("Checking updates for {0} filters", filterIdsToUpdate.length);

        // Load filters with changed version
        var loadFiltersFromBackendCallback = function (filterMetadataList) {
            loadFiltersFromBackend(filterMetadataList, function (success, filterIds) {
                if (success) {
                    var filters = [];
                    for (var i = 0; i < filterIds.length; i++) {
                        var filterId = filterIds[i];
                        if (filterId != adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID) {
                            filters.push(getFilterById(filterId));
                        }
                    }
                    successCallback(filters);
                } else {
                    errorCallback();
                }
            });
        };

        // Method is called after we have got server response
        // Now we check filters version and update filter if needed
        var onLoadFilterMetadataList = function (sucess, filterMetadataList) {
            if (sucess) {
                var filterMetadataListToUpdate = [];
                for (var i = 0; i < filterMetadataList.length; i++) {
                    var filterMetadata = filterMetadataList[i];
                    var filter = getFilterById(filterMetadata.filterId);
                    if (filterMetadata.version !== null && adguard.utils.browser.isGreaterVersion(filterMetadata.version, filter.version)) {
                        adguard.console.info("Updating filter {0} to version {1}", filter.filterId, filterMetadata.version);
                        filterMetadataListToUpdate.push(filterMetadata);
                    }
                }
                loadFiltersFromBackendCallback(filterMetadataListToUpdate);
            } else {
                errorCallback();
            }
        };

        // Retrieve current filters metadata for update
        loadFiltersMetadataFromBackend(filterIdsToUpdate, onLoadFilterMetadataList);
    };

    /**
     * Resets all filters versions
     */
    function resetFiltersVersion() {
        var RESET_VERSION = "0.0.0.0";
        for (var i = 0; i < adguardFilters.length; i++) {
            adguardFilters[i].version = RESET_VERSION;
        }
    }

    /**
     * Creates adguard filter object
     * @param filterMetadata Filter metadata
     * @returns {AdguardFilter}
     */
    function createAdguardFilter(filterMetadata) {
        var filter = new AdguardFilter(filterMetadata.filterId);
        filter.name = filterMetadata.name || '';
        filter.description = filterMetadata.description || 0;
        filter.displayNumber = filterMetadata.displayNumber || 0;
        return filter;
    }

    /**
     * Returns all filters with their metadata
     * @private
     */
    function getAllAdguardFilters() {

        var filters = [];
        var filtersMetadata = adguard.subscriptions.getFilters();
        for (var i = 0; i < filtersMetadata.length; i++) {
            var filterMetadata = filtersMetadata[i];
            filters.push(createAdguardFilter(filterMetadata));
        }

        // Add synthetic user and whitelist filters
        filters.push(createAdguardFilter({filterId: adguard.utils.filters.USER_FILTER_ID}));
        filters.push(createAdguardFilter({filterId: adguard.utils.filters.WHITE_LIST_FILTER_ID}));

        filters.sort(function (f1, f2) {
            return f1.displayNumber - f2.displayNumber;
        });

        return filters;
    }

    /**
     * Updates filters version and state info.
     * Loads this data from the storage and then updates "adguardFilters" property of the AntiBannerService instance.
     *
     * @private
     */
    function loadFiltersVersionAndStateInfo() {

        // Define it here: for jshint to cool down
        var filter = null;

        // Load filters metadata from the storage
        var filtersVersionInfo = adguard.filtersState.getFiltersVersion();
        for (var i = 0; i < adguardFilters.length; i++) {
            filter = adguardFilters[i];
            var versionInfo = filtersVersionInfo[filter.filterId];
            if (versionInfo) {
                filter.version = versionInfo.version;
                filter.lastCheckTime = versionInfo.lastCheckTime;
                filter.lastUpdateTime = versionInfo.lastUpdateTime;
            }
        }

        // Load filters state from the storage
        var filtersStateInfo = adguard.filtersState.getFiltersState();
        for (i = 0; i < adguardFilters.length; i++) {
            filter = adguardFilters[i];
            var stateInfo = filtersStateInfo[filter.filterId];
            if (stateInfo) {
                filter.enabled = stateInfo.enabled;
                filter.installed = stateInfo.installed;
                filter.loaded = stateInfo.loaded;
            }
        }
    }

    /**
     * Called when filters were loaded from the storage
     *
     * @param rulesFilterMap Map for populating rules (filterId -> rules collection)
     * @param callback Called when request filter is initialized
     */
    function onFiltersLoadedFromStorage(rulesFilterMap, callback) {

        var start = new Date().getTime();

        // We create filter rules using chunks of the specified length
        // We are doing this for FF as everything in FF is done on the UI thread
        // Request filter creation is rather slow operation so we should
        // use setTimeout calls to give UI thread some time.
        var async = adguard.prefs.speedupStartup() || false;
        var asyncStep = 1000;
        adguard.console.info('Starting request filter initialization. Async={0}', async);

        // Empty request filter
        var newRequestFilter = new adguard.RequestFilter();

        if (requestFilterInitTime === 0) {
            // Setting the time of request filter very first initialization
            requestFilterInitTime = new Date().getTime();
            adguard.listeners.notifyListeners(adguard.listeners.APPLICATION_INITIALIZED);
        }

        // Supplement object to make sure that we use only unique filter rules
        var uniqueRules = Object.create(null);

        /**
         * Checks rulesFilterMap is empty (no one of filters are enabled)
         * @param rulesFilterMap
         * @returns {boolean}
         */
        function isEmptyRulesFilterMap(rulesFilterMap) {

            var enabledFilterIds = Object.keys(rulesFilterMap);
            if (enabledFilterIds.length === 0) {
                return true;
            }

            // User filter is enabled by default, but it may not contain any rules
            var userFilterId = adguard.utils.filters.USER_FILTER_ID;
            if (enabledFilterIds.length === 1 && enabledFilterIds[0] == userFilterId) {
                var userRules = rulesFilterMap[userFilterId];
                if (!userRules || userRules.length === 0) {
                    return true;
                }
            }

            return false;
        }

        /**
         * STEP 3: Called when request filter has been filled with rules.
         * This is the last step of request filter initialization.
         */
        var requestFilterInitialized = function () {

            // Request filter is ready
            requestFilter = newRequestFilter;

            if (callback && typeof callback === "function") {
                callback();
            }

            adguard.listeners.notifyListeners(adguard.listeners.REQUEST_FILTER_UPDATED, getRequestFilterInfo());
            adguard.console.info("Finished request filter initialization in {0} ms. Rules count: {1}", (new Date().getTime() - start), newRequestFilter.rulesCount);

            /**
             * If no one of filters is enabled, don't reload rules
             */
            if (isEmptyRulesFilterMap(rulesFilterMap)) {
                return;
            }

            if (newRequestFilter.rulesCount === 0 && !reloadedRules) {
                //https://github.com/AdguardTeam/AdguardBrowserExtension/issues/205
                adguard.console.info("No rules have been found - checking filter updates");
                reloadAntiBannerFilters();
                reloadedRules = true;
            } else if (newRequestFilter.rulesCount > 0 && reloadedRules) {
                adguard.console.info("Filters reloaded, deleting reloadRules flag");
                reloadedRules = false;
            }
        };

        /**
         * Supplement function for adding rules to the request filter
         *
         * @param filterId Filter identifier
         * @param rulesTexts Array with filter rules
         * @param startIdx Start index of the rules array
         * @param endIdx End index of the rules array
         */
        var addRules = function (filterId, rulesTexts, startIdx, endIdx) {
            if (!rulesTexts) {
                return;
            }

            for (var i = startIdx; i < rulesTexts.length && i < endIdx; i++) {
                var ruleText = rulesTexts[i];
                if (ruleText in uniqueRules) {
                    // Do not allow duplicates
                    continue;
                }
                uniqueRules[ruleText] = true;
                var rule = adguard.rules.builder.createRule(ruleText, filterId);

                if (rule !== null) {
                    newRequestFilter.addRule(rule);
                }
            }
        };

        /**
         * Asyncronously adds rules to the request filter.
         */
        var addRulesAsync = function (filterId, rulesTexts, startIdx, stopIdx, prevDfd) {

            var dfd = new adguard.utils.Promise();

            prevDfd.then(function () {
                setTimeout(function () {
                    addRules(filterId, rulesTexts, startIdx, stopIdx);
                    dfd.resolve();
                }, 1);
            });

            return dfd;
        };

        /**
         * Asynchronously fills request filter with rules.
         */
        var fillRequestFilterAsync = function () {
            // Async loading starts when we resolve this promise
            var rootDfd = new adguard.utils.Promise();
            var prevDfd = null;
            var dfds = [];

            // Go through all filters in the map
            for (var filterId in rulesFilterMap) { // jshint ignore:line
                // To number
                filterId = filterId - 0;
                if (filterId != adguard.utils.filters.USER_FILTER_ID) {
                    var rulesTexts = rulesFilterMap[filterId];

                    for (var i = 0; i < rulesTexts.length; i += asyncStep) {
                        prevDfd = addRulesAsync(filterId, rulesTexts, i, i + asyncStep, prevDfd || rootDfd);
                        dfds.push(prevDfd);
                    }
                }
            }

            // User filter should be the last
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/117
            var userRules = rulesFilterMap[adguard.utils.filters.USER_FILTER_ID];
            addRulesAsync(adguard.utils.filters.USER_FILTER_ID, userRules, 0, userRules.length, prevDfd || rootDfd);

            adguard.utils.Promise.all(dfds).then(function () {
                requestFilterInitialized();
            });

            // Start execution
            rootDfd.resolve();
        };

        /**
         * Synchronously fills request filter with rules
         */
        var fillRequestFilterSync = function () {

            // Go through all filters in the map
            for (var filterId in rulesFilterMap) { // jshint ignore:line

                // To number
                filterId = filterId - 0;
                if (filterId != adguard.utils.filters.USER_FILTER_ID) {
                    var rulesTexts = rulesFilterMap[filterId];
                    addRules(filterId, rulesTexts, 0, rulesTexts.length);
                }
            }

            // User filter should be the last
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/117
            var userRules = rulesFilterMap[adguard.utils.filters.USER_FILTER_ID];
            addRules(adguard.utils.filters.USER_FILTER_ID, userRules, 0, userRules.length);
            requestFilterInitialized();
        };

        if (async) {
            fillRequestFilterAsync();
        } else {
            fillRequestFilterSync();
        }
    }

    /**
     * Create new request filter and add distinct rules from the storage.
     *
     * @param callback Called after request filter has been created
     * @private
     */
    function createRequestFilter(callback) {

        if (applicationRunning === false) {
            if (typeof callback === 'function') {
                callback();
            }
            return;
        }

        var start = new Date().getTime();
        adguard.console.info('Starting loading filter rules from the storage');

        // Prepare map for filter rules
        // Map key is filter ID
        // Map value is array with filter rules
        var rulesFilterMap = Object.create(null);

        /**
         * STEP 2: Called when all filter rules have been loaded from storage
         */
        var loadAllFilterRulesDone = function () {
            adguard.console.info('Finished loading filter rules from the storage in {0} ms', (new Date().getTime() - start));
            onFiltersLoadedFromStorage(rulesFilterMap, callback);
        };

        /**
         * Loads filter rules from storage
         *
         * @param filterId Filter identifier
         * @param rulesFilterMap Map for loading rules
         * @returns {*} Deferred object
         */
        var loadFilterRulesFromStorage = function (filterId, rulesFilterMap) {
            var dfd = new adguard.utils.Promise();

            adguard.rulesStorage.read(filterId, function (rulesText) {
                if (rulesText) {
                    rulesFilterMap[filterId] = rulesText;
                }
                dfd.resolve();
            });

            return dfd;
        };

        /**
         * STEP 1: load all filters from the storage.
         */
        var loadFilterRules = function () {
            var dfds = [];
            for (var i = 0; i < adguardFilters.length; i++) {
                var filter = adguardFilters[i];
                if (filter.enabled) {
                    dfds.push(loadFilterRulesFromStorage(filter.filterId, rulesFilterMap));
                }
            }
            dfds.push(loadUserRulesToRequestFilter(rulesFilterMap));

            // Load all filters and then recreate request filter
            adguard.utils.Promise.all(dfds).then(loadAllFilterRulesDone);
        };

        loadFilterRules();
    }

    /**
     * Adds user rules (got from the storage) to request filter
     *
     * @param rulesFilterMap Map for loading rules
     * @returns {*} Deferred object
     * @private
     */
    function loadUserRulesToRequestFilter(rulesFilterMap) {

        var dfd = new adguard.utils.Promise();

        var filterId = adguard.utils.filters.USER_FILTER_ID;
        adguard.rulesStorage.read(filterId, function (rulesText) {

            adguard.userrules.setRules(rulesText || []);

            if (!rulesText) {
                dfd.resolve();
                return;
            }

            rulesFilterMap[filterId] = rulesText;
            dfd.resolve();
        });

        return dfd;
    }

    /**
     * Request Filter info
     */
    var getRequestFilterInfo = function () {
        var rulesCount = 0;
        if (requestFilter) {
            rulesCount = requestFilter.rulesCount;
        }
        return {
            rulesCount: rulesCount
        };
    };

    /**
     * Update content blocker info
     * We save state of content blocker for properly show in options page (converted rules count and over limit flag)
     * @param info Content blocker info
     */
    var updateContentBlockerInfo = function (info) {
        contentBlockerInfo.rulesCount = info.rulesCount;
        contentBlockerInfo.rulesOverLimit = info.rulesOverLimit;
    };

    /**
     * Content Blocker info
     */
    var getContentBlockerInfo = function () {
        return contentBlockerInfo;
    };

    /**
     * Adds event listener for filters changes.
     * If filter is somehow changed this method checks if we should save changes to the storage
     * and if we should recreate RequestFilter.
     *
     * @private
     */
    function addFiltersChangeEventListener() {

        var filterEventsHistory = [];
        var onFilterChangeTimeout = null;

        var processFilterEvent = function (event, filter, rules) {

            filterEventsHistory.push({event: event, filter: filter, rules: rules});

            if (onFilterChangeTimeout !== null) {
                clearTimeout(onFilterChangeTimeout);
            }

            onFilterChangeTimeout = setTimeout(function () {

                var filterEvents = filterEventsHistory.slice(0);
                filterEventsHistory = [];
                onFilterChangeTimeout = null;

                var needCreateRequestFilter = filterEvents.some(isUpdateRequestFilterEvent);

                // Split by filterId
                var eventsByFilter = Object.create(null);
                for (var i = 0; i < filterEvents.length; i++) {
                    var filterEvent = filterEvents[i];
                    if (!(filterEvent.filter.filterId in eventsByFilter)) {
                        eventsByFilter[filterEvent.filter.filterId] = [];
                    }
                    eventsByFilter[filterEvent.filter.filterId].push(filterEvent);
                }

                var dfds = [];
                for (var filterId in eventsByFilter) { // jshint ignore:line
                    var needSaveRulesToStorage = eventsByFilter[filterId].some(isSaveRulesToStorageEvent);
                    if (!needSaveRulesToStorage) {
                        continue;
                    }
                    var dfd = processSaveFilterRulesToStorageEvents(filterId, eventsByFilter[filterId]);
                    dfds.push(dfd);
                }

                if (needCreateRequestFilter) {
                    // Rules will be added to request filter lazy, listeners will be notified about REQUEST_FILTER_UPDATED later
                    adguard.utils.Promise.all(dfds).then(createRequestFilter);
                } else {
                    // Rules are already in request filter, notify listeners
                    adguard.listeners.notifyListeners(adguard.listeners.REQUEST_FILTER_UPDATED, getRequestFilterInfo());
                }

            }, FILTERS_CHANGE_DEBOUNCE_PERIOD);

        };

        adguard.listeners.addListener(function (event, filter, rules) {
            switch (event) {
                case adguard.listeners.ADD_RULES:
                case adguard.listeners.REMOVE_RULE:
                case adguard.listeners.UPDATE_FILTER_RULES:
                case adguard.listeners.FILTER_ENABLE_DISABLE:
                    processFilterEvent(event, filter, rules);
                    break;
            }
        });
    }

    /**
     * Saves updated filter rules to the storage.
     *
     * @param filterId Filter id
     * @param events Events (what has changed?)
     * @private
     */
    function processSaveFilterRulesToStorageEvents(filterId, events) {

        var dfd = new adguard.utils.Promise();

        adguard.rulesStorage.read(filterId, function (loadedRulesText) {

            for (var i = 0; i < events.length; i++) {

                if (!loadedRulesText) {
                    loadedRulesText = [];
                }

                var event = events[i];
                var eventType = event.event;
                var eventRules = event.rules;

                switch (eventType) {
                    case adguard.listeners.ADD_RULES:
                        loadedRulesText = loadedRulesText.concat(adguard.utils.collections.getRulesText(eventRules));
                        adguard.console.debug("Add {0} rules to filter {1}", eventRules.length, filterId);
                        break;
                    case adguard.listeners.REMOVE_RULE:
                        var actionRule = eventRules[0];
                        adguard.utils.collections.removeAll(loadedRulesText, actionRule.ruleText);
                        adguard.console.debug("Remove {0} rule from filter {1}", actionRule.ruleText, filterId);
                        break;
                    case adguard.listeners.UPDATE_FILTER_RULES:
                        loadedRulesText = adguard.utils.collections.getRulesText(eventRules);
                        adguard.console.debug("Update filter {0} rules count to {1}", filterId, eventRules.length);
                        break;
                }
            }

            adguard.console.debug("Save {0} rules to filter {1}", loadedRulesText.length, filterId);
            adguard.rulesStorage.write(filterId, loadedRulesText, dfd.resolve);

        });

        return dfd;
    }

    /**
     * Subscribe to events which lead to filters update.
     * @private
     */
    function subscribeToFiltersChangeEvents() {

        // on USE_OPTIMIZED_FILTERS setting change we need to reload filters
        var onUsedOptimizedFiltersChange = adguard.utils.concurrent.debounce(reloadAntiBannerFilters, RELOAD_FILTERS_DEBOUNCE_PERIOD);

        adguard.settings.onUpdated.addListener(function (setting) {
            if (setting === adguard.settings.USE_OPTIMIZED_FILTERS) {
                onUsedOptimizedFiltersChange();
                return;
            }
            if (setting === adguard.settings.DISABLE_COLLECT_HITS) {
                getRequestFilter().cssFilter.dirty = true;
            }
        });
    }

    /**
     * Schedules filters update job
     * @isFirstRun
     * @private
     */
    function scheduleFiltersUpdate() {

        // First run delay
        setTimeout(checkAntiBannerFiltersUpdate, UPDATE_FILTERS_DELAY);

        // Scheduling job
        var scheduleUpdate = function () {
            setTimeout(function () {
                try {
                    checkAntiBannerFiltersUpdate();
                } catch (ex) {
                    adguard.console.error("Error update filters, cause {0}", ex);
                }
                scheduleUpdate();
            }, UPDATE_FILTERS_PERIOD);
        };

        scheduleUpdate();
    }

    /**
     * Gets filter by ID.
     * Throws exception if filter not found.
     *
     * @param filterId Filter identifier
     * @returns {*} Filter got from "adguardFilters" property.
     * @private
     */
    function getFilterById(filterId) {
        for (var i = 0; i < adguardFilters.length; i++) {
            var adguardFilter = adguardFilters[i];
            if (adguardFilter.filterId == filterId) {
                return adguardFilter;
            }
        }
        throw 'Filter with id ' + filterId + ' not found';
    }

    /**
     * Loads filters (ony-by-one) from the remote server
     *
     * @param filterMetadataList List of filter metadata to load
     * @param callback Called when filters have been loaded
     * @private
     */
    function loadFiltersFromBackend(filterMetadataList, callback) {

        var loadedFilters = [];

        var loadNextFilter = function () {
            if (filterMetadataList.length === 0) {
                callback(true, loadedFilters);
            } else {
                var filterMetadata = filterMetadataList.shift();
                loadFilterRules(filterMetadata, true, function (success) {
                    if (!success) {
                        callback(false);
                        return;
                    }
                    loadedFilters.push(filterMetadata.filterId);
                    loadNextFilter();
                });
            }
        };

        loadNextFilter();
    }

    /**
     * Loads filter rules
     *
     * @param filterMetadata Filter metadata
     * @param forceRemote Force download filter rules from remote server (if false try to download local copy of rules if it's possible)
     * @param callback Called when filter rules have been loaded
     * @private
     */
    function loadFilterRules(filterMetadata, forceRemote, callback) {

        var filter = getFilterById(filterMetadata.filterId);

        filter._isDownloading = true;
        adguard.listeners.notifyListeners(adguard.listeners.START_DOWNLOAD_FILTER, filter);

        var successCallback = function (filterRules) {
            adguard.console.info("Retrieved response from server for filter {0}, rules count: {1}", filter.filterId, filterRules.length);
            delete filter._isDownloading;
            filter.version = filterMetadata.version;
            filter.lastUpdateTime = filterMetadata.timeUpdated;
            filter.lastCheckTime = Date.now();
            filter.loaded = true;
            //notify listeners
            adguard.listeners.notifyListeners(adguard.listeners.SUCCESS_DOWNLOAD_FILTER, filter);
            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_FILTER_RULES, filter, filterRules);
            callback(true);
        };

        var errorCallback = function (request, cause) {
            adguard.console.error("Error retrieved response from server for filter {0}, cause: {1} {2}", filter.filterId, request.statusText, cause || "");
            delete filter._isDownloading;
            adguard.listeners.notifyListeners(adguard.listeners.ERROR_DOWNLOAD_FILTER, filter);
            callback(false);
        };

        adguard.backend.loadFilterRules(filter.filterId, forceRemote, adguard.settings.isUseOptimizedFiltersEnabled(), successCallback, errorCallback);
    }

    /**
     * Loads filter versions from remote server
     *
     * @param filterIds Filter identifiers
     * @param callback Callback (called when load is finished)
     * @private
     */
    function loadFiltersMetadataFromBackend(filterIds, callback) {

        if (filterIds.length === 0) {
            callback(true, []);
            return;
        }

        var loadSuccess = function (filterMetadataList) {
            adguard.console.debug("Retrieved response from server for {0} filters, result: {1} metadata", filterIds.length, filterMetadataList.length);
            callback(true, filterMetadataList);
        };

        var loadError = function (request, cause) {
            adguard.console.error("Error retrieved response from server for filters {0}, cause: {1} {2}", filterIds, request.statusText, cause || "");
            callback(false);
        };

        adguard.backend.loadFiltersMetadata(filterIds, loadSuccess, loadError);
    }

    /**
     * Get filter by id
     * @param filterId
     * @returns {*}
     */
    var getAntiBannerFilterById = function (filterId) {
        return getFilterById(filterId);
    };

    /**
     * Get antibanner filters (includes states and versions)
     * @returns {Array}
     */
    var getAntiBannerFilters = function () {
        return adguardFilters;
    };

    /**
     * Get request filter initialization time
     * @returns {number}
     */
    var getRequestFilterInitTime = function () {
        return requestFilterInitTime;
    };

    /**
     * Add rules to filter
     * @param filterId
     * @param rulesText
     * @returns {Array}
     */
    var addFilterRules = function (filterId, rulesText) {
        var rules = [];
        for (var i = 0; i < rulesText.length; i++) {
            var rule = adguard.rules.builder.createRule(rulesText[i], filterId);
            if (rule !== null) {
                rules.push(rule);
            }
        }
        var filter = getFilterById(filterId);
        requestFilter.addRules(rules);
        adguard.listeners.notifyListeners(adguard.listeners.ADD_RULES, filter, rules);
        if (filterId === adguard.utils.filters.USER_FILTER_ID) {
            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_USER_FILTER_RULES, getRequestFilterInfo());
        }
        return rules;
    };

    /**
     * Remove rule from filter
     * @param filterId
     * @param ruleText
     */
    var removeFilterRule = function (filterId, ruleText) {
        var rule = adguard.rules.builder.createRule(ruleText, filterId);
        if (rule !== null) {
            var filter = getFilterById(filterId);
            requestFilter.removeRule(rule);
            adguard.listeners.notifyListeners(adguard.listeners.REMOVE_RULE, filter, [rule]);
        }
        if (filterId === adguard.utils.filters.USER_FILTER_ID) {
            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_USER_FILTER_RULES, getRequestFilterInfo());
        }
    };

    /**
     * Clear filter rules
     * @param filterId
     */
    var clearFilterRules = function (filterId) {
        var filter = getFilterById(filterId);
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_FILTER_RULES, filter, []);
        if (filterId === adguard.utils.filters.USER_FILTER_ID) {
            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_USER_FILTER_RULES, getRequestFilterInfo());
        }
    };

    return {

        start: start,
        stop: stop,
        isInitialized: isInitialized,

        getAntiBannerFilterById: getAntiBannerFilterById,
        getAntiBannerFilters: getAntiBannerFilters,
        addAntiBannerFilter: addAntiBannerFilter,

        getRequestFilter: getRequestFilter,
        getRequestFilterInitTime: getRequestFilterInitTime,

        addFilterRules: addFilterRules,
        removeFilterRule: removeFilterRule,
        clearFilterRules: clearFilterRules,

        getRequestFilterInfo: getRequestFilterInfo,
        updateContentBlockerInfo: updateContentBlockerInfo,
        getContentBlockerInfo: getContentBlockerInfo,

        checkAntiBannerFiltersUpdate: checkAntiBannerFiltersUpdate
    };

})(adguard);

/**
 *
 * Api for filtering and elements hiding.
 */
adguard.requestFilter = (function (adguard) {

    'use strict';

    var antiBannerService = adguard.antiBannerService;

    function getRequestFilter() {
        return antiBannerService.getRequestFilter();
    }

    /**
     * @returns boolean true when request filter was initialized first time
     */
    var isReady = function () {
        return antiBannerService.getRequestFilterInitTime() > 0;
    };

    /**
     * When browser just started we need some time on request filter initialization.
     * This could be a problem in case when browser has a homepage and it is just started.
     * In this case request filter is not yet initalized so we don't block requests and inject css.
     * To fix this, content script will repeat requests for selectors until request filter is ready
     * and it will also collapse all elements which should have been blocked.
     *
     * @returns boolean true if we should collapse elements with content script
     */
    var shouldCollapseAllElements = function () {
        // We assume that if content script is requesting CSS in first 5 seconds after request filter init,
        // then it is possible, that we've missed some elements and now we should collapse these elements
        var requestFilterInitTime = antiBannerService.getRequestFilterInitTime();
        return (requestFilterInitTime > 0) && (requestFilterInitTime + 5000 > new Date().getTime());
    };

    var getRules = function () {
        return getRequestFilter().getRules();
    };
    var findRuleForRequest = function (requestUrl, documentUrl, requestType, documentWhitelistRule) {
        return getRequestFilter().findRuleForRequest(requestUrl, documentUrl, requestType, documentWhitelistRule);
    };
    var findWhiteListRule = function (requestUrl, referrer, requestType) {
        return getRequestFilter().findWhiteListRule(requestUrl, referrer, requestType);
    };

    var getSelectorsForUrl = function (documentUrl, genericHideFlag) {
        return getRequestFilter().getSelectorsForUrl(documentUrl, genericHideFlag);
    };
    var getInjectedSelectorsForUrl = function (documentUrl, genericHideFlag) {
        return getRequestFilter().getInjectedSelectorsForUrl(documentUrl, genericHideFlag);
    };
    var getScriptsForUrl = function (documentUrl) {
        return getRequestFilter().getScriptsForUrl(documentUrl);
    };

    var getRequestFilterInfo = function () {
        return antiBannerService.getRequestFilterInfo();
    };
    var updateContentBlockerInfo = function (info) {
        return antiBannerService.updateContentBlockerInfo(info);
    };
    var getContentBlockerInfo = function () {
        return antiBannerService.getContentBlockerInfo();
    };

    return {

        isReady: isReady,
        shouldCollapseAllElements: shouldCollapseAllElements,

        getRules: getRules,
        findRuleForRequest: findRuleForRequest,
        findWhiteListRule: findWhiteListRule,

        getSelectorsForUrl: getSelectorsForUrl,
        getInjectedSelectorsForUrl: getInjectedSelectorsForUrl,
        getScriptsForUrl: getScriptsForUrl,

        getRequestFilterInfo: getRequestFilterInfo,
        updateContentBlockerInfo: updateContentBlockerInfo,
        getContentBlockerInfo: getContentBlockerInfo
    };

})(adguard);

/**
 * Helper class for working with filters metadata storage (local storage)
 */
adguard.filtersState = (function (adguard) {

    var FILTERS_STATE_PROP = 'filters-state';
    var FILTERS_VERSION_PROP = 'filters-version';

    /**
     * Gets filter version from the local storage
     * @returns {*}
     */
    var getFiltersVersion = function () {
        var filters = Object.create(null);
        try {
            var json = adguard.localStorage.getItem(FILTERS_VERSION_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            adguard.console.error("Error retrieve filters version info, cause {0}", ex);
        }
        return filters;
    };

    /**
     * Gets filters state from the local storage
     * @returns {*}
     */
    var getFiltersState = function () {
        var filters = Object.create(null);
        try {
            var json = adguard.localStorage.getItem(FILTERS_STATE_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            adguard.console.error("Error retrieve filters state info, cause {0}", ex);
        }
        return filters;
    };

    /**
     * Updates filter version in the local storage
     *
     * @param filter Filter version metadata
     */
    var updateFilterVersion = function (filter) {
        var filters = getFiltersVersion();
        filters[filter.filterId] = {
            version: filter.version,
            lastCheckTime: filter.lastCheckTime,
            lastUpdateTime: filter.lastUpdateTime
        };
        adguard.localStorage.setItem(FILTERS_VERSION_PROP, JSON.stringify(filters));
    };

    /**
     * Updates filter state in the local storage
     *
     * @param filter Filter state object
     */
    var updateFilterState = function (filter) {
        var filters = getFiltersState();
        filters[filter.filterId] = {
            loaded: filter.loaded,
            enabled: filter.enabled,
            installed: filter.installed
        };
        adguard.localStorage.setItem(FILTERS_STATE_PROP, JSON.stringify(filters));
    };

    // Add event listener to persist filter metadata to local storage
    adguard.listeners.addListener(function (event, filter) {
        switch (event) {
            case adguard.listeners.SUCCESS_DOWNLOAD_FILTER:
                updateFilterState(filter);
                updateFilterVersion(filter);
                break;
            case adguard.listeners.FILTER_ADD_REMOVE:
            case adguard.listeners.FILTER_ENABLE_DISABLE:
                updateFilterState(filter);
                break;
        }
    });

    return {
        getFiltersVersion: getFiltersVersion,
        getFiltersState: getFiltersState,
        // These methods are used only for migrate from old versions
        updateFilterVersion: updateFilterVersion,
        updateFilterState: updateFilterState
    };

})(adguard);

/**
 * Class for manage filters state (enable, disable, add, remove, check updates)
 * Also includes method for initializing
 */
adguard.filters = (function (adguard) {

    'use strict';

    var antiBannerService = adguard.antiBannerService;

    var start = function (options, callback) {
        antiBannerService.start(options, callback);
    };

    var stop = function (callback) {
        antiBannerService.stop();
        callback();
    };

    /**
     * Checks application has been initialized
     * @returns {boolean}
     */
    var isInitialized = function () {
        return antiBannerService.isInitialized();
    };

    /**
     * Offer filters on extension install, select default filters and filters by locale and country
     * @param callback
     */
    var offerFilters = function (callback) {

        // These filters are enabled by default
        var filterIds = [adguard.utils.filters.ENGLISH_FILTER_ID, adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID];

        // Get language-specific filters by user locale
        var localeFilterIds = adguard.subscriptions.getFilterIdsForLanguage(adguard.app.getLocale());
        filterIds = filterIds.concat(localeFilterIds);

        // Add safari filter for safari browser
        if (adguard.utils.browser.isSafariBrowser()) {
            filterIds.push(adguard.utils.filters.SAFARI_FILTER);
        }

        // Get language-specific filters by navigator languages
        // Get the 2 most commonly used languages
        var languages = adguard.utils.browser.getNavigatorLanguages(2);
        for (var i = 0; i < languages.length; i++) {
            localeFilterIds = adguard.subscriptions.getFilterIdsForLanguage(languages[i]);
            filterIds = filterIds.concat(localeFilterIds);
        }

        callback(filterIds);
    };

    /**
     * List of enabled filters.
     * User filter and whitelist filter are always enabled so they are excluded.
     *
     * @returns {Array} List of enabled filters
     */
    var getEnabledFilters = function () {
        return antiBannerService.getAntiBannerFilters().filter(function (f) {
            return f.installed && f.enabled &&
                f.filterId != adguard.utils.filters.USER_FILTER_ID &&
                f.filterId != adguard.utils.filters.WHITE_LIST_FILTER_ID;
        });
    };

    /**
     * Returns collection of filters for settings page.
     * Private filters (user filter, whitelist filter, useful ads filter) are excluded.
     *
     * @returns {Array} List of filters
     */
    var getFiltersForOptionsPage = function () {
        return antiBannerService.getAntiBannerFilters().filter(function (f) {
            return f.installed &&
                f.filterId != adguard.utils.filters.USER_FILTER_ID &&
                f.filterId != adguard.utils.filters.WHITE_LIST_FILTER_ID &&
                f.filterId != adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID;
        });
    };

    /**
     * Checks if specified filter is enabled
     *
     * @param filterId Filter identifier
     * @returns {*} true if enabled
     */
    var isFilterEnabled = function (filterId) {
        return antiBannerService.getAntiBannerFilterById(filterId).enabled;
    };

    /**
     * Checks if specified filter is installed (downloaded)
     *
     * @param filterId Filter id
     * @returns {*} true if installed
     */
    var isFilterInstalled = function (filterId) {
        return antiBannerService.getAntiBannerFilterById(filterId).installed;
    };

    var checkFiltersUpdates = function (successCallback, errorCallback) {
        return antiBannerService.checkAntiBannerFiltersUpdate(true, successCallback, errorCallback);
    };

    /**
     * Enable filter
     *
     * @param filterId Filter identifier
     * @returns {boolean} true if filter was enabled successfully
     */
    var enableFilter = function (filterId) {

        var filter = antiBannerService.getAntiBannerFilterById(filterId);
        if (filter.enabled || !filter.installed) {
            return false;
        }

        filter.enabled = true;
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_ENABLE_DISABLE, filter);
        return true;
    };

    /**
     * Successively add filters from filterIds and then enable successfully added filters
     * @param filterIds Filter identifiers
     * @param callback We pass list of enabled filter identifiers to the callback
     */
    var addAndEnableFilters = function (filterIds, callback) {

        callback = callback || function () {
                // Empty callback
            };

        var enabledFilters = [];

        if (!filterIds || filterIds.length === 0) {
            callback(enabledFilters);
            return;
        }

        filterIds = adguard.utils.collections.removeDuplicates(filterIds.slice(0)); // Copy array to prevent parameter mutation

        var loadNextFilter = function () {
            if (filterIds.length === 0) {
                callback(enabledFilters);
            } else {
                var filterId = filterIds.shift();
                antiBannerService.addAntiBannerFilter(filterId, function (success) {
                    if (success) {
                        var changed = enableFilter(filterId);
                        if (changed) {
                            enabledFilters.push(antiBannerService.getAntiBannerFilterById(filterId));
                        }
                    }
                    loadNextFilter();
                });
            }
        };

        loadNextFilter();
    };

    /**
     * Disables filter by id
     *
     * @param filterId Filter identifier
     * @returns {boolean} true if filter was disabled successfully
     */
    var disableFilter = function (filterId) {

        var filter = antiBannerService.getAntiBannerFilterById(filterId);
        if (!filter.enabled || !filter.installed) {
            return false;
        }

        filter.enabled = false;
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_ENABLE_DISABLE, filter);
        return true;
    };

    /**
     * Removes filter
     *
     * @param filterId Filter identifier
     * @returns {boolean} true if filter was removed successfully
     */
    var removeFilter = function (filterId) {

        var filter = antiBannerService.getAntiBannerFilterById(filterId);
        if (!filter.installed) {
            return false;
        }

        adguard.console.debug("Remove filter {0}", filter.filterId);

        filter.enabled = false;
        filter.installed = false;
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_ENABLE_DISABLE, filter);
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_ADD_REMOVE, filter);
        return true;
    };

    /**
     * This method is called from UI when user changes list of active filters
     * @param filterIds List of active filters identifiers
     */
    var onFiltersListChange = function (filterIds) {

        var filters = antiBannerService.getAntiBannerFilters();
        for (var i = 0; i < filters.length; i++) {
            var filterId = filters[i].filterId;
            // Skip acceptable ads filter
            if (filterId == adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID) {
                continue;
            }
            // Remove filter if it is not present in the new list
            if (filterIds.indexOf(filterId) < 0) {
                removeFilter(filterId);
            }
        }

        // Add and enable filters
        addAndEnableFilters(filterIds);
    };

    /**
     * Returns filter metadata by subscription url
     * @param subscriptionUrl - subscription url
     * @returns {*|T}
     */
    var findFilterMetadataBySubscriptionUrl = function (subscriptionUrl) {
        return adguard.subscriptions.getFilters().filter(function (f) {
            return f.subscriptionUrl === subscriptionUrl;
        })[0];
    };

    /**
     * Load rules to user filter by subscription url
     * @param subscriptionUrl
     * @param loadCallback
     */
    var processAbpSubscriptionUrl = function (subscriptionUrl, loadCallback) {

        var filterMetadata = findFilterMetadataBySubscriptionUrl(subscriptionUrl);

        if (filterMetadata) {

            var filter = antiBannerService.getAntiBannerFilterById(filterMetadata.filterId);
            addAndEnableFilters([filter.filterId]);

        } else {

            // Load filter rules
            adguard.backend.loadFilterRulesBySubscriptionUrl(subscriptionUrl, function (rulesText) {
                var rules = adguard.userrules.addRules(rulesText);
                loadCallback(rules.length);
            }, function (request, cause) {
                adguard.console.error("Error download subscription by url {0}, cause: {1} {2}", subscriptionUrl, request.statusText, cause || "");
            });
        }
    };

    return {

        start: start,
        stop: stop,
        isInitialized: isInitialized,

        offerFilters: offerFilters,

        getEnabledFilters: getEnabledFilters,
        getFiltersForOptionsPage: getFiltersForOptionsPage,

        isFilterEnabled: isFilterEnabled,
        isFilterInstalled: isFilterInstalled,

        checkFiltersUpdates: checkFiltersUpdates,

        addAndEnableFilters: addAndEnableFilters,
        disableFilter: disableFilter,
        removeFilter: removeFilter,
        onFiltersListChange: onFiltersListChange,

        findFilterMetadataBySubscriptionUrl: findFilterMetadataBySubscriptionUrl,
        processAbpSubscriptionUrl: processAbpSubscriptionUrl
    };

})(adguard);

adguard.webRequestService = (function (adguard) {

    'use strict';

    var onRequestBlockedChannel = adguard.utils.channels.newChannel();

    /**
     * Records filtering rule hit
     *
     * @param tab            Tab object
     * @param requestRule    Rule to record
     * @param requestUrl     Request URL
     */
    var recordRuleHit = function (tab, requestRule, requestUrl) {
        if (requestRule &&
            adguard.settings.collectHitsCount() &&
            !adguard.utils.filters.isUserFilterRule(requestRule) &&
            !adguard.utils.filters.isWhiteListFilterRule(requestRule) &&
            !adguard.frames.isIncognitoTab(tab)) {

            var domain = adguard.frames.getFrameDomain(tab);
            adguard.hitStats.addRuleHit(domain, requestRule.ruleText, requestRule.filterId, requestUrl);
        }
    };

    /**
     * Prepares CSS and JS which should be injected to the page.
     *
     * @param tab           Tab
     * @param documentUrl   Document URL
     * @param options       Options for select:
     * options = {
     *      filter: ['selectors', 'scripts'] (selection filter) (mandatory)
     *      genericHide: true|false ( select only generic hide css rules) (optional)
     * }
     *
     * @returns {*}         null or object the following properties: "selectors", "scripts", "collapseAllElements"
     */
    var processGetSelectorsAndScripts = function (tab, documentUrl, options) {

        var result = Object.create(null);

        if (!tab) {
            return result;
        }

        if (!adguard.requestFilter.isReady()) {
            result.requestFilterReady = false;
            return result;
        }

        if (adguard.frames.isTabAdguardDetected(tab) ||
            adguard.frames.isTabProtectionDisabled(tab)) {
            return result;
        }

        // Looking for the whitelist rule
        var whitelistRule = adguard.frames.getFrameWhiteListRule(tab);
        if (!whitelistRule) {
            //Check whitelist for current frame
            var mainFrameUrl = adguard.frames.getMainFrameUrl(tab);
            whitelistRule = adguard.requestFilter.findWhiteListRule(documentUrl, mainFrameUrl, adguard.RequestTypes.DOCUMENT);
        }

        var retrieveSelectors = options.filter.indexOf('selectors') >= 0;
        var retrieveScripts = options.filter.indexOf('scripts') >= 0;

        if (retrieveSelectors) {
            // Record rule hit
            recordRuleHit(tab, whitelistRule, documentUrl);
        }

        // It's important to check this after the recordRuleHit call
        // as otherwise we will never record $document rules hit for domain
        if (adguard.frames.isTabWhiteListed(tab)) {
            return result;
        }

        if (retrieveSelectors) {

            // Prepare result
            result.selectors = {
                css: null,
                extendedCss: null,
                cssHitsCounterEnabled: false

            };
            result.collapseAllElements = adguard.requestFilter.shouldCollapseAllElements();
            result.useShadowDom = adguard.utils.browser.isShadowDomSupported();

            // Check what exactly is disabled by this rule
            var genericHideFlag = options.genericHide || (whitelistRule && whitelistRule.checkContentType("GENERICHIDE"));
            var elemHideFlag = whitelistRule && whitelistRule.checkContentType("ELEMHIDE");

            if (!elemHideFlag) {
                // Element hiding rules aren't disabled, so we should use them
                if (shouldLoadAllSelectors(result.collapseAllElements)) {
                    result.selectors = adguard.requestFilter.getSelectorsForUrl(documentUrl, genericHideFlag);
                } else {
                    result.selectors = adguard.requestFilter.getInjectedSelectorsForUrl(documentUrl, genericHideFlag);
                }
            }
        }

        if (retrieveScripts) {
            var jsInjectFlag = whitelistRule && whitelistRule.checkContentType("JSINJECT");
            if (!jsInjectFlag) {
                // JS rules aren't disabled, returning them
                result.scripts = adguard.requestFilter.getScriptsForUrl(documentUrl);
            }
        }

        return result;
    };

    /**
     * Checks if websocket request is blocked
     *
     * @param tab           Tab
     * @param requestUrl    request url
     * @param referrerUrl   referrer url
     * @returns {boolean}   true if request is blocked
     */
    var checkWebSocketRequest = function (tab, requestUrl, referrerUrl) {

        if (!tab) {
            return false;
        }

        var requestRule = getRuleForRequest(tab, requestUrl, referrerUrl, adguard.RequestTypes.WEBSOCKET);

        adguard.filteringLog.addEvent(tab, requestUrl, referrerUrl, adguard.RequestTypes.WEBSOCKET, requestRule);

        return isRequestBlockedByRule(requestRule);
    };

    /**
     * Checks if request is blocked
     *
     * @param tab           Tab
     * @param requestUrl    request url
     * @param referrerUrl   referrer url
     * @param requestType   one of RequestType
     * @returns {boolean}   true if request is blocked
     */
    var processShouldCollapse = function (tab, requestUrl, referrerUrl, requestType) {

        if (!tab) {
            return false;
        }

        var requestRule = getRuleForRequest(tab, requestUrl, referrerUrl, requestType);
        return isRequestBlockedByRule(requestRule);
    };

    /**
     * Checks if requests are blocked
     *
     * @param tab               Tab
     * @param referrerUrl       referrer url
     * @param collapseRequests  requests array
     * @returns {*}             requests array
     */
    var processShouldCollapseMany = function (tab, referrerUrl, collapseRequests) {

        if (!tab) {
            return collapseRequests;
        }

        for (var i = 0; i < collapseRequests.length; i++) {
            var request = collapseRequests[i];
            var requestRule = getRuleForRequest(tab, request.elementUrl, referrerUrl, request.requestType);
            request.collapse = isRequestBlockedByRule(requestRule);
        }

        return collapseRequests;
    };

    /**
     * Checks if request is blocked by rule
     *
     * @param requestRule
     * @returns {*|boolean}
     */
    var isRequestBlockedByRule = function (requestRule) {
        return requestRule && !requestRule.whiteListRule;
    };

    /**
     * Gets blocked response by rule
     * See https://developer.chrome.com/extensions/webRequest#type-BlockingResponse or https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/BlockingResponse for details
     * @param requestRule Request rule or null
     * @returns {*} Blocked response or null
     */
    var getBlockedResponseByRule = function (requestRule) {
        if (isRequestBlockedByRule(requestRule)) {
            if (requestRule.emptyResponse) {
                return {redirectUrl: 'data:,'};
            } else {
                return {cancel: true};
            }
        }
        return null;
    };

    /**
     * Finds rule for request
     *
     * @param tab           Tab
     * @param requestUrl    request url
     * @param referrerUrl   referrer url
     * @param requestType   one of RequestType
     * @returns {*}         rule or null
     */
    var getRuleForRequest = function (tab, requestUrl, referrerUrl, requestType) {

        if (adguard.frames.isTabAdguardDetected(tab) || adguard.frames.isTabProtectionDisabled(tab)) {
            //don't process request
            return null;
        }

        var whitelistRule = adguard.frames.getFrameWhiteListRule(tab);
        if (whitelistRule && whitelistRule.checkContentTypeIncluded("DOCUMENT")) {
            // Frame is whitelisted by the main frame's $document rule
            // We do nothing more in this case - return the rule.
            return whitelistRule;
        } else if (!whitelistRule) {
            // If whitelist rule is not found for the main frame, we check it for referrer
            whitelistRule = adguard.requestFilter.findWhiteListRule(requestUrl, referrerUrl, adguard.RequestTypes.DOCUMENT);
        }

        return adguard.requestFilter.findRuleForRequest(requestUrl, referrerUrl, requestType, whitelistRule);
    };

    /**
     * Processes HTTP response.
     * It could do the following:
     * 1. Detect desktop AG and switch to integration mode
     * 2. Add event to the filtering log (for DOCUMENT requests)
     * 3. Record page stats (if it's enabled)
     *
     * @param tab Tab object
     * @param requestUrl Request URL
     * @param referrerUrl Referrer URL
     * @param requestType Request type
     * @param responseHeaders Response headers
     */
    var processRequestResponse = function (tab, requestUrl, referrerUrl, requestType, responseHeaders) {

        if (requestType == adguard.RequestTypes.DOCUMENT) {
            // Check headers to detect Adguard application

            if (adguard.integration.isSupported() && // Integration module may be missing
                !adguard.prefs.mobile &&  // Mobile Firefox doesn't support integration mode
                !adguard.utils.browser.isEdgeBrowser()) { // TODO[Edge]: Integration mode is not fully functional in Edge (cannot redefine Referer header yet)

                adguard.integration.checkHeaders(tab, responseHeaders, requestUrl);
            }
            // Clear previous events
            adguard.filteringLog.clearEventsByTabId(tab.tabId);
        }

        var requestRule = null;
        var appendLogEvent = false;

        if (adguard.integration.isSupported() && adguard.frames.isTabAdguardDetected(tab)) {
            // Parse rule applied to request from response headers
            requestRule = adguard.integration.parseAdguardRuleFromHeaders(responseHeaders);
            appendLogEvent = !adguard.backend.isAdguardAppRequest(requestUrl);
        } else if (adguard.frames.isTabProtectionDisabled(tab)) { // jshint ignore:line
            // Doing nothing
        } else if (requestType == adguard.RequestTypes.DOCUMENT) {
            requestRule = adguard.frames.getFrameWhiteListRule(tab);
            var domain = adguard.frames.getFrameDomain(tab);
            if (!adguard.frames.isIncognitoTab(tab) &&
                adguard.settings.collectHitsCount()) {
                //add page view to stats
                adguard.hitStats.addDomainView(domain);
            }
            appendLogEvent = true;
        }

        // add event to filtering log
        if (appendLogEvent) {
            adguard.filteringLog.addEvent(tab, requestUrl, referrerUrl, requestType, requestRule);
        }
    };

    /**
     * Request post processing, firing events, add log records etc.
     *
     * @param tab           Tab
     * @param requestUrl    request url
     * @param referrerUrl   referrer url
     * @param requestType   one of RequestType
     * @param requestRule   rule
     */
    var postProcessRequest = function (tab, requestUrl, referrerUrl, requestType, requestRule) {

        if (adguard.frames.isTabAdguardDetected(tab)) {
            //do nothing, log event will be added on response
            return;
        }

        if (isRequestBlockedByRule(requestRule)) {
            adguard.listeners.notifyListenersAsync(adguard.listeners.ADS_BLOCKED, requestRule, tab, 1);
            var details = {
                tabId: tab.tabId,
                requestUrl: requestUrl,
                referrerUrl: referrerUrl,
                requestType: requestType
            };
            if (requestRule) {
                details.rule = requestRule.ruleText;
                details.filterId = requestRule.filterId;
            }
            onRequestBlockedChannel.notify(details);
        }

        adguard.filteringLog.addEvent(tab, requestUrl, referrerUrl, requestType, requestRule);

        // Record rule hit
        recordRuleHit(tab, requestRule, requestUrl);
    };

    var shouldLoadAllSelectors = function (collapseAllElements) {

        var safariContentBlockerEnabled = adguard.utils.browser.isContentBlockerEnabled();
        if (safariContentBlockerEnabled && collapseAllElements) {
            // For Safari 9+ we will load all selectors when browser is just started
            // as at that moment content blocker may not been initialized
            return true;
        }

        // In other cases we should load all selectors every time
        return !safariContentBlockerEnabled;
    };

    // EXPOSE
    return {
        processGetSelectorsAndScripts: processGetSelectorsAndScripts,
        checkWebSocketRequest: checkWebSocketRequest,
        processShouldCollapse: processShouldCollapse,
        processShouldCollapseMany: processShouldCollapseMany,
        isRequestBlockedByRule: isRequestBlockedByRule,
        getBlockedResponseByRule: getBlockedResponseByRule,
        getRuleForRequest: getRuleForRequest,
        processRequestResponse: processRequestResponse,
        postProcessRequest: postProcessRequest,
        onRequestBlocked: onRequestBlockedChannel
    };

})(adguard);

/**
 *  Initialize Content => BackgroundPage messaging
 */
(function (adguard) {

    'use strict';

    /**
     * Contains event listeners from content pages
     */
    var eventListeners = Object.create(null);

    /**
     * Adds event listener from content page
     * @param message
     * @param sender
     */
    function processAddEventListener(message, sender) {
        var listenerId = adguard.listeners.addSpecifiedListener(message.events, function () {
            var sender = eventListeners[listenerId];
            if (sender) {
                adguard.tabs.sendMessage(sender.tab.tabId, {
                    type: 'notifyListeners',
                    args: Array.prototype.slice.call(arguments)
                });
            }
        });
        eventListeners[listenerId] = sender;
        return {listenerId: listenerId};
    }

    /**
     * Constructs objects that uses on extension pages, like: options.html, thankyou.html etc
     */
    function processInitializeFrameScriptRequest() {

        var enabledFilters = Object.create(null);

        var AntiBannerFiltersId = adguard.utils.filters.ids;

        for (var key in AntiBannerFiltersId) {
            if (AntiBannerFiltersId.hasOwnProperty(key)) {
                var filterId = AntiBannerFiltersId[key];
                var enabled = adguard.filters.isFilterEnabled(filterId);
                if (enabled) {
                    enabledFilters[filterId] = true;
                }
            }
        }

        return {
            userSettings: adguard.settings.getAllSettings(),
            enabledFilters: enabledFilters,
            filtersMetadata: adguard.subscriptions.getFilters(),
            requestFilterInfo: adguard.requestFilter.getRequestFilterInfo(),
            contentBlockerInfo: adguard.requestFilter.getContentBlockerInfo(),
            environmentOptions: {
                isMacOs: adguard.utils.browser.isMacOs(),
                isSafariBrowser: adguard.utils.browser.isSafariBrowser(),
                isContentBlockerEnabled: adguard.utils.browser.isContentBlockerEnabled(),
                Prefs: {
                    locale: adguard.app.getLocale(),
                    mobile: adguard.prefs.mobile || false
                }
            },
            constants: {
                AntiBannerFiltersId: adguard.utils.filters.ids,
                EventNotifierTypes: adguard.listeners.events
            }
        };
    }

    /**
     * Returns collection of filters for selected group to display for user
     * @param groupId Group identifier
     * @returns {*|Array} List of filters
     */
    function getFiltersMetadataForGroup(groupId) {
        return adguard.subscriptions.getFilters().filter(function (f) {
            return f.groupId == groupId &&
                f.filterId != adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID;
        });
    }

    /**
     * Constructs filters metadata for options.html page
     */
    function processGetFiltersMetadata() {
        var groupsMeta = adguard.subscriptions.getGroups();
        var filtersMeta = Object.create(null);
        var enabledFilters = Object.create(null);
        var installedFilters = Object.create(null);
        for (var i = 0; i < groupsMeta.length; i++) {
            var groupId = groupsMeta[i].groupId;
            var filters = filtersMeta[groupId] = getFiltersMetadataForGroup(groupId);
            for (var j = 0; j < filters.length; j++) {
                var filter = filters[j];
                var installed = adguard.filters.isFilterInstalled(filter.filterId);
                var enabled = adguard.filters.isFilterEnabled(filter.filterId);
                if (installed) {
                    installedFilters[filter.filterId] = true;
                }
                if (enabled) {
                    enabledFilters[filter.filterId] = true;
                }
            }
        }
        return {
            groups: groupsMeta,
            filters: filtersMeta,
            enabledFilters: enabledFilters,
            installedFilters: installedFilters
        };
    }

    /**
     * Searches for whitelisted domains.
     *
     * @param offset Offset
     * @param limit Limit
     * @param text Search string
     * @returns {Array} Domains found
     */
    function searchWhiteListDomains(offset, limit, text) {
        var domains = adguard.whitelist.getWhiteListDomains();
        var result = [];
        for (var i = 0; i < domains.length; i++) {
            var domain = domains[i];
            if (!text || adguard.utils.strings.containsIgnoreCase(domain, text)) {
                result.push(domain);
            }
        }
        return limit ? result.slice(offset, offset + limit) : result;
    }

    /**
     * Searches for user rules.
     *
     * @param offset Offset
     * @param limit Limit
     * @param text Search string
     * @returns {Array} Rules found
     */
    function searchUserRules(offset, limit, text) {
        var userRules = adguard.userrules.getRules();
        var result = [];
        for (var i = 0; i < userRules.length; i++) {
            var ruleText = userRules[i];
            if (!text || adguard.utils.strings.containsIgnoreCase(ruleText, text)) {
                result.push(ruleText);
            }
        }
        return limit ? result.slice(offset, offset + limit) : result;
    }

    /**
     * Saves css hits from content-script.
     * Message includes stats field. [{filterId: 1, ruleText: 'rule1'}, {filterId: 2, ruleText: 'rule2'}...]
     * @param tab
     * @param stats
     */
    function processSaveCssHitStats(tab, stats) {
        if (!adguard.settings.collectHitsCount()) {
            return;
        }
        if (adguard.frames.isIncognitoTab(tab)) {
            return;
        }
        var domain = adguard.frames.getFrameDomain(tab);
        for (var i = 0; i < stats.length; i++) {
            var stat = stats[i];
            adguard.hitStats.addRuleHit(domain, stat.ruleText, stat.filterId);
        }
    }


    /**
     * Main function for processing messages from content-scripts
     *
     * @param message
     * @param sender
     * @param callback
     * @returns {*}
     */
    function handleMessage(message, sender, callback) {
        switch (message.type) {
            case 'unWhiteListFrame':
                adguard.userrules.unWhiteListFrame(message.frameInfo);
                break;
            case 'addEventListener':
                return processAddEventListener(message, sender);
            case 'removeListener':
                var listenerId = message.listenerId;
                adguard.listeners.removeListener(listenerId);
                delete eventListeners[listenerId];
                break;
            case 'initializeFrameScript':
                return processInitializeFrameScriptRequest();
            case 'changeUserSetting':
                adguard.settings.setProperty(message.key, message.value);
                break;
            case 'checkRequestFilterReady':
                return {ready: adguard.requestFilter.isReady()};
            case 'addAndEnableFilter':
                adguard.filters.addAndEnableFilters([message.filterId]);
                break;
            case 'disableAntiBannerFilter':
                if (message.remove) {
                    adguard.filters.removeFilter(message.filterId);
                } else {
                    adguard.filters.disableFilter(message.filterId);
                }
                break;
            case 'getWhiteListDomains':
                var whiteListDomains = searchWhiteListDomains(message.offset, message.limit, message.text);
                return {rules: whiteListDomains};
            case 'getUserFilters':
                var rules = searchUserRules(message.offset, message.limit, message.text);
                return {rules: rules};
            case 'checkAntiBannerFiltersUpdate':
                adguard.ui.checkFiltersUpdates();
                break;
            case 'getAntiBannerFiltersForOptionsPage':
                var renderedFilters = adguard.filters.getFiltersForOptionsPage();
                return {filters: renderedFilters};
            case 'changeDefaultWhiteListMode':
                adguard.whitelist.changeDefaultWhiteListMode(message.enabled);
                break;
            case 'clearUserFilter':
                adguard.userrules.clearRules();
                break;
            case 'clearWhiteListFilter':
                adguard.whitelist.clearWhiteList();
                break;
            case 'addWhiteListDomains':
                adguard.whitelist.addToWhiteListArray(message.domains);
                break;
            case 'removeWhiteListDomain':
                adguard.whitelist.removeFromWhiteList(message.text);
                break;
            case 'addUserFilterRules':
                adguard.userrules.addRules(message.rules);
                break;
            case 'onFiltersSubscriptionChange':
                adguard.filters.onFiltersListChange(message.filterIds);
                break;
            case 'getFiltersMetadata':
                return processGetFiltersMetadata();
            case 'openThankYouPage':
                adguard.ui.openThankYouPage();
                break;
            case 'openExtensionStore':
                adguard.ui.openExtensionStore();
                break;
            case 'openFilteringLog':
                adguard.browserAction.close();
                adguard.ui.openFilteringLog(message.tabId);
                break;
            case 'openExportRulesTab':
                adguard.ui.openExportRulesTab(message.whitelist);
                break;
            case 'openSafebrowsingTrusted':
                adguard.safebrowsing.addToSafebrowsingTrusted(message.url);
                adguard.tabs.getActive(function (tab) {
                    adguard.tabs.reload(tab.tabId, message.url);
                });
                break;
            case 'openTab':
                adguard.ui.openTab(message.url, message.options);
                adguard.browserAction.close();
                break;
            case 'resetBlockedAdsCount':
                adguard.frames.resetBlockedAdsCount();
                adguard.browserAction.close();
                break;
            case 'getSelectorsAndScripts':
                if (adguard.utils.workaround.isFacebookIframe(message.documentUrl)) {
                    return {};
                }
                var cssAndScripts = adguard.webRequestService.processGetSelectorsAndScripts(sender.tab, message.documentUrl, message.options);
                return cssAndScripts || {};
            case 'checkWebSocketRequest':
                var block = adguard.webRequestService.checkWebSocketRequest(sender.tab, message.elementUrl, message.documentUrl);
                return {block: block, requestId: message.requestId};
            case 'processShouldCollapse':
                var collapse = adguard.webRequestService.processShouldCollapse(sender.tab, message.elementUrl, message.documentUrl, message.requestType);
                return {collapse: collapse, requestId: message.requestId};
            case 'processShouldCollapseMany':
                var requests = adguard.webRequestService.processShouldCollapseMany(sender.tab, message.documentUrl, message.requests);
                return {requests: requests};
            case 'addUserRule':
                adguard.userrules.addRules([message.ruleText]);
                if (message.adguardDetected || adguard.frames.isTabAdguardDetected(sender.tab)) {
                    adguard.integration.addRuleToApp(message.ruleText);
                }
                break;
            case 'removeUserRule':
                adguard.userrules.removeRule(message.ruleText);
                if (message.adguardDetected || adguard.frames.isTabAdguardDetected(sender.tab)) {
                    adguard.integration.removeRuleFromApp(message.ruleText);
                }
                break;
            case 'onOpenFilteringLogPage':
                adguard.filteringLog.onOpenFilteringLogPage();
                break;
            case 'onCloseFilteringLogPage':
                adguard.filteringLog.onCloseFilteringLogPage();
                break;
            case 'reloadTabById':
                adguard.tabs.reload(message.tabId);
                break;
            case 'clearEventsByTabId':
                adguard.filteringLog.clearEventsByTabId(message.tabId);
                break;
            case 'getTabFrameInfoById':
                if (message.tabId) {
                    var frameInfo = adguard.frames.getFrameInfo({tabId: message.tabId});
                    return {frameInfo: frameInfo};
                } else {
                    adguard.tabs.getActive(function (tab) {
                        var frameInfo = adguard.frames.getFrameInfo(tab);
                        callback({frameInfo: frameInfo});
                    });
                    return true; // Async
                }
                break;
            case 'getFilteringInfoByTabId':
                var filteringInfo = adguard.filteringLog.getFilteringInfoByTabId(message.tabId);
                return {filteringInfo: filteringInfo};
            case 'synchronizeOpenTabs':
                adguard.filteringLog.synchronizeOpenTabs(function (tabs) {
                    callback({tabs: tabs});
                });
                return true; // Async
            case 'checkSubscriptionUrl':
                var filterMetadata = adguard.filters.findFilterMetadataBySubscriptionUrl(message.url);
                var confirmText;
                if (filterMetadata) {
                    //ok, filter found
                    confirmText = adguard.i18n.getMessage('abp_subscribe_confirm_enable', [filterMetadata.name]);
                } else {
                    //filter not found
                    confirmText = adguard.i18n.getMessage('abp_subscribe_confirm_import', [message.title]);
                }
                return {confirmText: confirmText};
            case 'enableSubscription':
                adguard.filters.processAbpSubscriptionUrl(message.url, function (rulesAddedCount) {
                    callback({
                        title: adguard.i18n.getMessage('abp_subscribe_confirm_import_finished_title'),
                        text: adguard.i18n.getMessage('abp_subscribe_confirm_import_finished_text', [rulesAddedCount])
                    });
                });
                return true; // Async
            // Popup methods
            case 'addWhiteListDomainPopup':
                adguard.tabs.getActive(function (tab) {
                    adguard.ui.whiteListTab(tab);
                });
                break;
            case 'removeWhiteListDomainPopup':
                adguard.tabs.getActive(function (tab) {
                    adguard.ui.unWhiteListTab(tab);
                });
                break;
            case 'changeApplicationFilteringDisabled':
                adguard.ui.changeApplicationFilteringDisabled(message.disabled);
                break;
            case 'openSiteReportTab':
                adguard.ui.openSiteReportTab(message.url);
                adguard.browserAction.close();
                break;
            case 'openSettingsTab':
                adguard.ui.openSettingsTab();
                adguard.browserAction.close();
                break;
            case 'openAssistant':
                adguard.ui.openAssistant();
                adguard.browserAction.close();
                break;
            case 'resizePanelPopup':
                adguard.browserAction.resize(message.width, message.height);
                break;
            case 'sendFeedback':
                adguard.backend.sendUrlReport(message.url, message.topic, message.comment);
                break;
            case 'saveCssHitStats':
                processSaveCssHitStats(sender.tab, message.stats);
                break;
            default:
                // Unhandled message
                return true;
        }
    }

    // Add event listener from content-script messages
    adguard.runtime.onMessage.addListener(handleMessage);

})(adguard);

(function (adguard) {

    'use strict';

    /**
     * Retrieve referrer url from request details.
     * Extract referrer by priority:
     * 1. referrerUrl in requestDetails
     * 2. url of frame where request was created
     * 3. url of main frame
     *
     * @param requestDetails
     * @returns {*|Frame}
     */
    function getReferrerUrl(requestDetails) {
        return requestDetails.referrerUrl ||
            adguard.frames.getFrameUrl(requestDetails.tab, requestDetails.requestFrameId) ||
            adguard.frames.getMainFrameUrl(requestDetails.tab);
    }

    /**
     * Process request
     *
     * @param requestDetails
     * @returns {boolean} False if request must be blocked
     */
    function onBeforeRequest(requestDetails) {

        var tab = requestDetails.tab;
        var requestUrl = requestDetails.requestUrl;
        var requestType = requestDetails.requestType;

        if (requestType === adguard.RequestTypes.DOCUMENT || requestType === adguard.RequestTypes.SUBDOCUMENT) {
            adguard.frames.recordFrame(tab, requestDetails.frameId, requestUrl, requestType);
        }

        if (requestType === adguard.RequestTypes.DOCUMENT) {
            // Reset tab button state
            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_TAB_BUTTON_STATE, tab, true);
            return;
        }

        if (!adguard.utils.url.isHttpRequest(requestUrl)) {
            return;
        }

        var referrerUrl = getReferrerUrl(requestDetails);

        var requestRule = adguard.webRequestService.getRuleForRequest(tab, requestUrl, referrerUrl, requestType);
        adguard.webRequestService.postProcessRequest(tab, requestUrl, referrerUrl, requestType, requestRule);

        return adguard.webRequestService.getBlockedResponseByRule(requestRule);
    }

    /**
     * Called before request is sent to the remote endpoint.
     * This method is used to modify request in case of working in integration mode
     * and also to record referrer header in frame data.
     *
     * @param requestDetails Request details
     * @returns {*} headers to send
     */
    function onBeforeSendHeaders(requestDetails) {

        var tab = requestDetails.tab;
        var headers = requestDetails.requestHeaders;

        if (adguard.integration.shouldOverrideReferrer(tab)) {
            // Retrieve main frame url
            var mainFrameUrl = adguard.frames.getMainFrameUrl(tab);
            headers = adguard.utils.browser.setHeaderValue(headers, 'Referer', mainFrameUrl);
            return {
                requestHeaders: headers,
                modifiedHeaders: [{
                    name: 'Referer',
                    value: mainFrameUrl
                }]
            };
        }

        if (requestDetails.requestType === adguard.RequestTypes.DOCUMENT) {
            // Save ref header
            var refHeader = adguard.utils.browser.findHeaderByName(headers, 'Referer');
            if (refHeader) {
                adguard.frames.recordFrameReferrerHeader(tab, refHeader.value);
            }
        }

        return {};
    }

    /**
     * On headers received callback function.
     * We do check request for safebrowsing
     * and check if websocket connections should be blocked.
     *
     * @param requestDetails Request details
     * @returns {{responseHeaders: *}} Headers to send
     */
    function onHeadersReceived(requestDetails) {

        var tab = requestDetails.tab;
        var requestUrl = requestDetails.requestUrl;
        var responseHeaders = requestDetails.responseHeaders;
        var requestType = requestDetails.requestType;
        var referrerUrl = getReferrerUrl(requestDetails);

        adguard.webRequestService.processRequestResponse(tab, requestUrl, referrerUrl, requestType, responseHeaders);

        // Safebrowsing check
        if (requestType === adguard.RequestTypes.DOCUMENT) {
            filterSafebrowsing(tab, requestUrl);
        }

        /*
         Websocket check.
         If 'ws://' request is blocked for not existing domain - it's blocked for all domains.
         Then we gonna limit frame sources to http to block src:'data/text' etc.
         More details in these issue:
         https://github.com/AdguardTeam/AdguardBrowserExtension/issues/344
         https://github.com/AdguardTeam/AdguardBrowserExtension/issues/440

         WS connections are detected as "other"  by ABP
         EasyList already contains some rules for WS connections with $other modifier
         */
        var checkWebsocket = (requestType === adguard.RequestTypes.DOCUMENT || requestType === adguard.RequestTypes.SUBDOCUMENT);

        // Please note, that we do not check WS in Edge:
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/401
        if (adguard.utils.browser.isEdgeBrowser()) {
            checkWebsocket = false;
        }

        if (checkWebsocket) {

            var frameUrl = adguard.frames.getFrameUrl(tab, requestDetails.frameId);
            var websocketCheckUrl = "ws://adguardwebsocket.check/" + adguard.utils.url.getDomainName(frameUrl);
            if (adguard.webRequestService.checkWebSocketRequest(tab, websocketCheckUrl, frameUrl)) {
                var cspHeader = {
                    name: 'Content-Security-Policy',
                    value: 'connect-src http: https:; frame-src http: https:; child-src http: https:'
                };
                responseHeaders.push(cspHeader);
                return {
                    responseHeaders: responseHeaders,
                    modifiedHeaders: [cspHeader]
                };
            }
        }
    }

    /**
     * Safebrowsing check
     *
     * @param tab
     * @param mainFrameUrl
     */
    function filterSafebrowsing(tab, mainFrameUrl) {

        if (adguard.frames.isTabAdguardDetected(tab) ||
            adguard.frames.isTabProtectionDisabled(tab) ||
            adguard.frames.isTabWhiteListedForSafebrowsing(tab)) {
            return;
        }

        var referrerUrl = adguard.utils.browser.getSafebrowsingBackUrl(tab);
        var incognitoTab = adguard.frames.isIncognitoTab(tab);

        adguard.safebrowsing.checkSafebrowsingFilter(mainFrameUrl, referrerUrl, function (safebrowsingUrl) {
            // Chrome doesn't allow open extension url in incognito mode
            // So close current tab and open new
            if (incognitoTab && adguard.utils.browser.isChromium()) {
                adguard.ui.openTab(safebrowsingUrl, {}, function () {
                    adguard.tabs.remove(tab.tabId);
                });
            } else {
                adguard.tabs.reload(tab.tabId, safebrowsingUrl);
            }
        }, incognitoTab);
    }

    /**
     * Add listeners described above.
     */
    adguard.webRequest.onBeforeRequest.addListener(onBeforeRequest, ["<all_urls>"]);
    adguard.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, ["<all_urls>"]);
    adguard.webRequest.onHeadersReceived.addListener(onHeadersReceived, ["<all_urls>"]);


    // AG for Windows and Mac checks either request signature or request Referer to authorize request.
    // Referer cannot be forged by the website so it's ok for add-on authorization.
    if (adguard.integration.isSupported() && adguard.utils.browser.isChromium()) {

        /* global browser */
        browser.webRequest.onBeforeSendHeaders.addListener(function callback(details) {

            var authHeaders = adguard.integration.getAuthorizationHeaders();
            var headers = details.requestHeaders;
            for (var i = 0; i < authHeaders.length; i++) {
                headers = adguard.utils.browser.setHeaderValue(details.requestHeaders, authHeaders[i].headerName, authHeaders[i].headerValue);
            }

            return {requestHeaders: headers};

        }, {urls: [adguard.integration.getIntegrationBaseUrl() + "*"]}, ["requestHeaders", "blocking"]);
    }

    var handlerBehaviorTimeout = null;
    adguard.listeners.addListener(function (event) {
        switch (event) {
            case adguard.listeners.ADD_RULES:
            case adguard.listeners.REMOVE_RULE:
            case adguard.listeners.UPDATE_FILTER_RULES:
            case adguard.listeners.FILTER_ENABLE_DISABLE:
                if (handlerBehaviorTimeout !== null) {
                    clearTimeout(handlerBehaviorTimeout);
                }
                handlerBehaviorTimeout = setTimeout(function () {
                    handlerBehaviorTimeout = null;
                    adguard.webRequest.handlerBehaviorChanged();
                }, 3000);
        }
    });

    /**
     * When frame is committed we send to it js rules
     * We do this because we need to apply js rules as soon as possible
     */
    (function fastScriptRulesLoader(adguard) {

        var isEdgeBrowser = adguard.utils.browser.isEdgeBrowser();

        function tryInjectScripts(tabId, frameId, url, result, limit) {

            var options = null;
            if (!isEdgeBrowser) {
                /**
                 * In Edge browser: If we pass frameId in tabs.sendMessage then message aren't delivered to content-script
                 */
                options = {frameId: frameId};
            }

            adguard.tabs.sendMessage(tabId, result, function (response) {

                // Try again if no response was received from content-script
                if (adguard.runtime.lastError || !response) {

                    if (--limit <= 0) {
                        return;
                    }

                    setTimeout(function () {
                        tryInjectScripts(tabId, frameId, url, result, limit);
                    }, 10);
                }

            }, options);
        }

        adguard.webNavigation.onCommitted.addListener(function (tabId, frameId, url) {

            /**
             * Messaging a specific frame is not yet supported in Edge
             */
            if (frameId !== 0 && isEdgeBrowser) {
                return;
            }

            var result = adguard.webRequestService.processGetSelectorsAndScripts({tabId: tabId}, url, {filter: ['scripts']});
            if (!result.scripts || result.scripts.length === 0) {
                return;
            }

            result.type = 'injectScripts';
            tryInjectScripts(tabId, frameId, url, result, 5);
        });

    })(adguard);

})(adguard);

(function (adguard) {

	'use strict';

	var tabsLoading = Object.create(null);

	function checkPopupBlockedRule(tabId, requestUrl, referrerUrl, sourceTab) {

		//is not http request or url of tab isn't ready
		if (!adguard.utils.url.isHttpRequest(requestUrl)) {
			return;
		}

		delete tabsLoading[tabId];

		var requestRule = adguard.webRequestService.getRuleForRequest(sourceTab, requestUrl, referrerUrl, adguard.RequestTypes.POPUP);

		if (adguard.webRequestService.isRequestBlockedByRule(requestRule)) {
			//remove popup tab
			adguard.tabs.remove(tabId);
			//append log event and fix log event type from POPUP to DOCUMENT
			adguard.webRequestService.postProcessRequest(sourceTab, requestUrl, referrerUrl, adguard.RequestTypes.DOCUMENT, requestRule);
		}
	}

	adguard.webNavigation.onCreatedNavigationTarget.addListener(function (details) {

		var sourceTab = {tabId: details.sourceTabId};

		// Don't process this request
		if (adguard.frames.isTabAdguardDetected(sourceTab)) {
			return;
		}

		// webRequest.onBeforeRequest event may hasn't been received yet.
		var referrerUrl = adguard.frames.getMainFrameUrl(sourceTab) || details.url;
		if (!adguard.utils.url.isHttpRequest(referrerUrl)) {
			return;
		}

		var tabId = details.tabId;
		tabsLoading[tabId] = {
			referrerUrl: referrerUrl,
			sourceTab: sourceTab
		};

		checkPopupBlockedRule(tabId, details.url, referrerUrl, sourceTab);
	});

	adguard.tabs.onUpdated.addListener(function (tab) {

		var tabId = tab.tabId;

		if (!(tabId in tabsLoading)) {
			return;
		}

		if (tab.url) {
			var tabInfo = tabsLoading[tabId];
			if (tabInfo) {
				checkPopupBlockedRule(tabId, tab.url, tabInfo.referrerUrl, tabInfo.sourceTab);
			}
		}
	});

})(adguard);

/**
 * Adguard simple api
 * @type {{start, stop, configure}}
 */
(function (adguard, global) {

    'use strict';

    function noOpFunc() {
    }

    /**
     * Default assistant localization
     */
    var defaultAssistantLocalization = {
        'assistant_select_element': 'Selection mode',
        'assistant_select_element_ext': 'Click on&nbsp;any element on&nbsp;the page',
        'assistant_select_element_cancel': 'Cancel',
        'assistant_block_element': 'Block element',
        'assistant_block_element_explain': 'Element blocking rule setup',
        'assistant_slider_explain': 'Use the slider to&nbsp;change the size of&nbsp;the element to&nbsp;be&nbsp;blocked by&nbsp;this rule:',
        'assistant_slider_if_hide': 'The filter will contain a&nbsp;rule that blocks the selected element',
        'assistant_slider_min': 'SMALLER',
        'assistant_slider_max': 'LARGER',
        'assistant_extended_settings': 'Advanced settings',
        'assistant_apply_rule_to_all_sites': 'Apply this rule to&nbsp;every web site',
        'assistant_block_by_reference': 'Block element by&nbsp;url',
        'assistant_block_similar': 'Block similar elements',
        'assistant_block': 'Block',
        'assistant_another_element': 'Select another element',
        'assistant_preview': 'Preview',
        'assistant_preview_header': 'Block element - Preview',
        'assistant_preview_header_info': 'Check how the page will look like before confirming the block.',
        'assistant_preview_start': 'Preview',
        'assistant_preview_end': 'Finish preview'
    };

    /**
     * Validates configuration
     * @param configuration Configuration object
     */
    function validateConfiguration(configuration) {
        if (!configuration) {
            throw new Error('"configuration" parameter is required');
        }
        validateFiltersConfiguration(configuration.filters);
        validateDomains(configuration.whitelist, 'whitelist');
        validateDomains(configuration.blacklist, 'blacklist');
    }

    /**
     * Validates filters identifiers
     * @param filters Array
     */
    function validateFiltersConfiguration(filters) {
        if (!filters || filters.length === 0) {
            return;
        }
        for (var i = 0; i < filters.length; i++) {
            var filterId = filters[i];
            if (typeof filterId !== 'number') {
                throw new Error(filterId + ' is not a number');
            }
        }
    }

    /**
     * Validate domains
     * @param domains Array
     * @param prop Property name (whitelist or blacklist)
     */
    function validateDomains(domains, prop) {
        if (!domains || domains.length === 0) {
            return;
        }
        for (var i = 0; i < domains.length; i++) {
            var domain = domains[i];
            if (typeof domain !== 'string') {
                throw new Error('Domain ' + domain + ' at position ' + i + ' in ' + prop + ' is not a string');
            }
        }
    }

    /**
     * Configures white and black lists.
     * If blacklist is not null filtration will be in inverted mode, otherwise in default mode.
     * @param configuration Configuration object: {whitelist: [], blacklist: []}
     */
    function configureWhiteBlackLists(configuration) {

        if (!configuration.force && !configuration.blacklist && !configuration.whitelist) {
            return;
        }

        var domains;
        if (configuration.blacklist) {
            adguard.whitelist.changeDefaultWhiteListMode(false);
            domains = configuration.blacklist;
        } else {
            adguard.whitelist.changeDefaultWhiteListMode(true);
            domains = configuration.whitelist;
        }
        adguard.whitelist.clearWhiteList();
        if (domains) {
            adguard.whitelist.addToWhiteListArray(domains);
        }
    }

    /**
     * Configures enabled filters
     * @param configuration Configuration object: {filters: [...]}
     * @param callback
     */
    function configureFilters(configuration, callback) {

        if (!configuration.force && !configuration.filters) {
            callback();
            return;
        }

        var filterIds = (configuration.filters || []).slice(0);
        for (var i = filterIds.length - 1; i >= 0; i--) {
            var filterId = filterIds[i];
            var metadata = adguard.subscriptions.getFilterMetadata(filterId);
            if (!metadata) {
                adguard.console.error('Filter with id {0} not found. Skip it...', filterId);
                filterIds.splice(i, 1);
            }
        }

        adguard.filters.addAndEnableFilters(filterIds, function () {
            var enabledFilters = adguard.filters.getEnabledFilters();
            for (var i = 0; i < enabledFilters.length; i++) {
                var filter = enabledFilters[i];
                if (filterIds.indexOf(filter.filterId) < 0) {
                    adguard.filters.disableFilter(filter.filterId);
                }
            }
            callback();
        });
    }

    /**
     * Configures custom (user) rules
     * @param configuration Configuration object: {rules: [...]}
     */
    function configureCustomRules(configuration) {

        if (!configuration.force && !configuration.rules) {
            return;
        }

        adguard.userrules.clearRules();
        adguard.userrules.addRules(configuration.rules || []);
    }

    /**
     * Configures backend's URLs
     * @param configuration Configuration object: {filtersMetadataUrl: '...', filterRulesUrl: '...'}
     */
    function configureFiltersUrl(configuration) {
        if (!configuration.force && !configuration.filtersMetadataUrl && !configuration.filterRulesUrl) {
            return;
        }
        adguard.backend.configure({
            filtersMetadataUrl: configuration.filtersMetadataUrl,
            filterRulesUrl: configuration.filterRulesUrl
        });
    }

    /**
     * Start filtration.
     * Also perform installation on first run.
     * @param configuration Configuration object
     * @param callback Callback function
     */
    var start = function (configuration, callback) {

        validateConfiguration(configuration);

        callback = callback || noOpFunc;

        // Force apply all configuration fields
        configuration.force = true;

        adguard.filters.start({}, function () {
            configure(configuration, callback);
        });
    };

    /**
     * Stop filtration
     * @param callback Callback function
     */
    var stop = function (callback) {
        adguard.filters.stop(callback || noOpFunc);
    };

    /**
     * Configure current filtration settings
     * @param configuration Filtration configuration: {filters: [], whitelist: [], blacklist: []}
     * @param callback
     */
    var configure = function (configuration, callback) {

        if (!adguard.filters.isInitialized()) {
            throw new Error('Applications is not initialized. Use \'start\' method.');
        }
        validateConfiguration(configuration);

        callback = callback || noOpFunc;

        configureFiltersUrl(configuration);
        configureWhiteBlackLists(configuration);
        configureCustomRules(configuration);
        configureFilters(configuration, callback);
    };

    /**
     * Opens assistant dialog in the specified tab
     * @param tabId Tab identifier
     */
    var openAssistant = function (tabId) {
        var assistantOptions = {
            cssLink: adguard.getURL('adguard/assistant/css/assistant.css'),
            addRuleCallbackName: 'assistant-create-rule',
            localization: defaultAssistantLocalization
        };
        adguard.tabs.sendMessage(tabId, {
            type: 'initAssistant',
            options: assistantOptions
        });
    };

    /**
     * Closes assistant dialog in the specified tab
     * @param tabId Tab identifier
     */
    var closeAssistant = function (tabId) {
        adguard.tabs.sendMessage(tabId, {
            type: 'destroyAssistant'
        });
    };

    adguard.backend.configure({
        localFiltersFolder: 'adguard',
        localFilterIds: []
    });

    global.adguardApi = {
        start: start,
        stop: stop,
        configure: configure,
        /**
         *  Fired when a request is blocked
         *  var onBlocked = function (details) {console.log(details);};
         *  adguardApi.onRequestBlocked.addListener(onBlocked);
         *  adguardApi.onRequestBlocked.removeListener(onBlocked);
         *  details = {
         *      tabId: ...,
         *      requestUrl: "...",
         *      referrerUrl: "...",
         *      requestType: "...", see adguard.RequestTypes
         *      rule: "..." // Rule text
         *      filterId: ... // Filter identifier
         *   };
         */
        onRequestBlocked: adguard.webRequestService.onRequestBlocked,
        openAssistant: openAssistant,
        closeAssistant: closeAssistant
    };

})(adguard, window);

})(window);