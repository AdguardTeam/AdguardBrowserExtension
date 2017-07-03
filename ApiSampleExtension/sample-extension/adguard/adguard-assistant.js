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

/**
 * Global object for content scripts
 */
var adguardContent = {}; // jshint ignore:line

(function (adguard, self) {

    'use strict';

    /**
     * https://bugs.chromium.org/p/project-zero/issues/detail?id=1225&desc=6
     * Page script can inject global variables into the DOM, so content script isolation doesn't work as expected
     * So we have to make additional check before accessing a global variable.
     */
    function isDefined(property) {
        return Object.prototype.hasOwnProperty.call(self, property);
    }

    var browserApi = isDefined('browser') ? self.browser : self.chrome;

    adguard.i18n = browserApi.i18n;

    adguard.runtimeImpl = (function () {

        var onMessage = (function () {
            if (browserApi.runtime && browserApi.runtime.onMessage) {
                // Chromium, Edge, Firefox WebExtensions
                return browserApi.runtime.onMessage;
            }
            // Old Chromium
            return browserApi.extension.onMessage || browserApi.extension.onRequest;
        })();

        var sendMessage = (function () {
            if (browserApi.runtime && browserApi.runtime.sendMessage) {
                // Chromium, Edge, Firefox WebExtensions
                return browserApi.runtime.sendMessage;
            }
            // Old Chromium
            return browserApi.extension.sendMessage || browserApi.extension.sendRequest;
        })();

        return {
            onMessage: onMessage,
            sendMessage: sendMessage
        };

    })();

})(typeof adguardContent !== 'undefined' ? adguardContent : adguard, this); // jshint ignore:line

/* global adguardContent */

(function (adguard) {

    'use strict';

    window.i18n = adguard.i18n;

    window.contentPage = {
        sendMessage: adguard.runtimeImpl.sendMessage,
        onMessage: adguard.runtimeImpl.onMessage
    };

})(adguardContent);

/**
 * Diff Match and Patch
 *
 * Copyright 2006 Google Inc.
 * http://code.google.com/p/google-diff-match-patch/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Computes the difference between two texts to create a patch.
 * Applies the patch onto another text, allowing for errors.
 * @author fraser@google.com (Neil Fraser)
 */

/**
 * Class containing the diff, match and patch methods.
 * @constructor
 */
function diff_match_patch() {

    // Defaults.
    // Redefine these in your program to override the defaults.

    // Number of seconds to map a diff before giving up (0 for infinity).
    this.Diff_Timeout = 1.0;
    // Cost of an empty edit operation in terms of edit characters.
    this.Diff_EditCost = 4;
    // At what point is no match declared (0.0 = perfection, 1.0 = very loose).
    this.Match_Threshold = 0.5;
    // How far to search for a match (0 = exact location, 1000+ = broad match).
    // A match this many characters away from the expected location will add
    // 1.0 to the score (0.0 is a perfect match).
    this.Match_Distance = 1000;
    // When deleting a large block of text (over ~64 characters), how close do
    // the contents have to be to match the expected contents. (0.0 = perfection,
    // 1.0 = very loose).  Note that Match_Threshold controls how closely the
    // end points of a delete need to match.
    this.Patch_DeleteThreshold = 0.5;
    // Chunk size for context length.
    this.Patch_Margin = 4;

    // The number of bits in an int.
    this.Match_MaxBits = 32;
}


//  DIFF FUNCTIONS


/**
 * The data structure representing a diff is an array of tuples:
 * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
 * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
 */
var DIFF_DELETE = -1;
var DIFF_INSERT = 1;
var DIFF_EQUAL = 0;

/** @typedef {{0: number, 1: string}} */
diff_match_patch.Diff;


/**
 * Find the differences between two texts.  Simplifies the problem by stripping
 * any common prefix or suffix off the texts before diffing.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {boolean=} opt_checklines Optional speedup flag. If present and false,
 *     then don't run a line-level diff first to identify the changed areas.
 *     Defaults to true, which does a faster, slightly less optimal diff.
 * @param {number} opt_deadline Optional time when the diff should be complete
 *     by.  Used internally for recursive calls.  Users should set DiffTimeout
 *     instead.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 */
diff_match_patch.prototype.diff_main = function(text1, text2, opt_checklines,
                                                opt_deadline) {
    // Set a deadline by which time the diff must be complete.
    if (typeof opt_deadline == 'undefined') {
        if (this.Diff_Timeout <= 0) {
            opt_deadline = Number.MAX_VALUE;
        } else {
            opt_deadline = (new Date).getTime() + this.Diff_Timeout * 1000;
        }
    }
    var deadline = opt_deadline;

    // Check for null inputs.
    if (text1 == null || text2 == null) {
        throw new Error('Null input. (diff_main)');
    }

    // Check for equality (speedup).
    if (text1 == text2) {
        if (text1) {
            return [[DIFF_EQUAL, text1]];
        }
        return [];
    }

    if (typeof opt_checklines == 'undefined') {
        opt_checklines = true;
    }
    var checklines = opt_checklines;

    // Trim off common prefix (speedup).
    var commonlength = this.diff_commonPrefix(text1, text2);
    var commonprefix = text1.substring(0, commonlength);
    text1 = text1.substring(commonlength);
    text2 = text2.substring(commonlength);

    // Trim off common suffix (speedup).
    commonlength = this.diff_commonSuffix(text1, text2);
    var commonsuffix = text1.substring(text1.length - commonlength);
    text1 = text1.substring(0, text1.length - commonlength);
    text2 = text2.substring(0, text2.length - commonlength);

    // Compute the diff on the middle block.
    var diffs = this.diff_compute_(text1, text2, checklines, deadline);

    // Restore the prefix and suffix.
    if (commonprefix) {
        diffs.unshift([DIFF_EQUAL, commonprefix]);
    }
    if (commonsuffix) {
        diffs.push([DIFF_EQUAL, commonsuffix]);
    }
    this.diff_cleanupMerge(diffs);
    return diffs;
};


/**
 * Find the differences between two texts.  Assumes that the texts do not
 * have any common prefix or suffix.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {boolean} checklines Speedup flag.  If false, then don't run a
 *     line-level diff first to identify the changed areas.
 *     If true, then run a faster, slightly less optimal diff.
 * @param {number} deadline Time when the diff should be complete by.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_compute_ = function(text1, text2, checklines,
                                                    deadline) {
    var diffs;

    if (!text1) {
        // Just add some text (speedup).
        return [[DIFF_INSERT, text2]];
    }

    if (!text2) {
        // Just delete some text (speedup).
        return [[DIFF_DELETE, text1]];
    }

    var longtext = text1.length > text2.length ? text1 : text2;
    var shorttext = text1.length > text2.length ? text2 : text1;
    var i = longtext.indexOf(shorttext);
    if (i != -1) {
        // Shorter text is inside the longer text (speedup).
        diffs = [[DIFF_INSERT, longtext.substring(0, i)],
            [DIFF_EQUAL, shorttext],
            [DIFF_INSERT, longtext.substring(i + shorttext.length)]];
        // Swap insertions for deletions if diff is reversed.
        if (text1.length > text2.length) {
            diffs[0][0] = diffs[2][0] = DIFF_DELETE;
        }
        return diffs;
    }

    if (shorttext.length == 1) {
        // Single character string.
        // After the previous speedup, the character can't be an equality.
        return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
    }

    // Check to see if the problem can be split in two.
    var hm = this.diff_halfMatch_(text1, text2);
    if (hm) {
        // A half-match was found, sort out the return data.
        var text1_a = hm[0];
        var text1_b = hm[1];
        var text2_a = hm[2];
        var text2_b = hm[3];
        var mid_common = hm[4];
        // Send both pairs off for separate processing.
        var diffs_a = this.diff_main(text1_a, text2_a, checklines, deadline);
        var diffs_b = this.diff_main(text1_b, text2_b, checklines, deadline);
        // Merge the results.
        return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
    }

    if (checklines && text1.length > 100 && text2.length > 100) {
        return this.diff_lineMode_(text1, text2, deadline);
    }

    return this.diff_bisect_(text1, text2, deadline);
};


/**
 * Do a quick line-level diff on both strings, then rediff the parts for
 * greater accuracy.
 * This speedup can produce non-minimal diffs.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} deadline Time when the diff should be complete by.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_lineMode_ = function(text1, text2, deadline) {
    // Scan the text on a line-by-line basis first.
    var a = this.diff_linesToChars_(text1, text2);
    text1 = a.chars1;
    text2 = a.chars2;
    var linearray = a.lineArray;

    var diffs = this.diff_main(text1, text2, false, deadline);

    // Convert the diff back to original text.
    this.diff_charsToLines_(diffs, linearray);
    // Eliminate freak matches (e.g. blank lines)
    this.diff_cleanupSemantic(diffs);

    // Rediff any replacement blocks, this time character-by-character.
    // Add a dummy entry at the end.
    diffs.push([DIFF_EQUAL, '']);
    var pointer = 0;
    var count_delete = 0;
    var count_insert = 0;
    var text_delete = '';
    var text_insert = '';
    while (pointer < diffs.length) {
        switch (diffs[pointer][0]) {
            case DIFF_INSERT:
                count_insert++;
                text_insert += diffs[pointer][1];
                break;
            case DIFF_DELETE:
                count_delete++;
                text_delete += diffs[pointer][1];
                break;
            case DIFF_EQUAL:
                // Upon reaching an equality, check for prior redundancies.
                if (count_delete >= 1 && count_insert >= 1) {
                    // Delete the offending records and add the merged ones.
                    diffs.splice(pointer - count_delete - count_insert,
                        count_delete + count_insert);
                    pointer = pointer - count_delete - count_insert;
                    var a = this.diff_main(text_delete, text_insert, false, deadline);
                    for (var j = a.length - 1; j >= 0; j--) {
                        diffs.splice(pointer, 0, a[j]);
                    }
                    pointer = pointer + a.length;
                }
                count_insert = 0;
                count_delete = 0;
                text_delete = '';
                text_insert = '';
                break;
        }
        pointer++;
    }
    diffs.pop();  // Remove the dummy entry at the end.

    return diffs;
};


/**
 * Find the 'middle snake' of a diff, split the problem in two
 * and return the recursively constructed diff.
 * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} deadline Time at which to bail if not yet complete.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_bisect_ = function(text1, text2, deadline) {
    // Cache the text lengths to prevent multiple calls.
    var text1_length = text1.length;
    var text2_length = text2.length;
    var max_d = Math.ceil((text1_length + text2_length) / 2);
    var v_offset = max_d;
    var v_length = 2 * max_d;
    var v1 = new Array(v_length);
    var v2 = new Array(v_length);
    // Setting all elements to -1 is faster in Chrome & Firefox than mixing
    // integers and undefined.
    for (var x = 0; x < v_length; x++) {
        v1[x] = -1;
        v2[x] = -1;
    }
    v1[v_offset + 1] = 0;
    v2[v_offset + 1] = 0;
    var delta = text1_length - text2_length;
    // If the total number of characters is odd, then the front path will collide
    // with the reverse path.
    var front = (delta % 2 != 0);
    // Offsets for start and end of k loop.
    // Prevents mapping of space beyond the grid.
    var k1start = 0;
    var k1end = 0;
    var k2start = 0;
    var k2end = 0;
    for (var d = 0; d < max_d; d++) {
        // Bail out if deadline is reached.
        if ((new Date()).getTime() > deadline) {
            break;
        }

        // Walk the front path one step.
        for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
            var k1_offset = v_offset + k1;
            var x1;
            if (k1 == -d || (k1 != d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
                x1 = v1[k1_offset + 1];
            } else {
                x1 = v1[k1_offset - 1] + 1;
            }
            var y1 = x1 - k1;
            while (x1 < text1_length && y1 < text2_length &&
            text1.charAt(x1) == text2.charAt(y1)) {
                x1++;
                y1++;
            }
            v1[k1_offset] = x1;
            if (x1 > text1_length) {
                // Ran off the right of the graph.
                k1end += 2;
            } else if (y1 > text2_length) {
                // Ran off the bottom of the graph.
                k1start += 2;
            } else if (front) {
                var k2_offset = v_offset + delta - k1;
                if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] != -1) {
                    // Mirror x2 onto top-left coordinate system.
                    var x2 = text1_length - v2[k2_offset];
                    if (x1 >= x2) {
                        // Overlap detected.
                        return this.diff_bisectSplit_(text1, text2, x1, y1, deadline);
                    }
                }
            }
        }

        // Walk the reverse path one step.
        for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
            var k2_offset = v_offset + k2;
            var x2;
            if (k2 == -d || (k2 != d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
                x2 = v2[k2_offset + 1];
            } else {
                x2 = v2[k2_offset - 1] + 1;
            }
            var y2 = x2 - k2;
            while (x2 < text1_length && y2 < text2_length &&
            text1.charAt(text1_length - x2 - 1) ==
            text2.charAt(text2_length - y2 - 1)) {
                x2++;
                y2++;
            }
            v2[k2_offset] = x2;
            if (x2 > text1_length) {
                // Ran off the left of the graph.
                k2end += 2;
            } else if (y2 > text2_length) {
                // Ran off the top of the graph.
                k2start += 2;
            } else if (!front) {
                var k1_offset = v_offset + delta - k2;
                if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] != -1) {
                    var x1 = v1[k1_offset];
                    var y1 = v_offset + x1 - k1_offset;
                    // Mirror x2 onto top-left coordinate system.
                    x2 = text1_length - x2;
                    if (x1 >= x2) {
                        // Overlap detected.
                        return this.diff_bisectSplit_(text1, text2, x1, y1, deadline);
                    }
                }
            }
        }
    }
    // Diff took too long and hit the deadline or
    // number of diffs equals number of characters, no commonality at all.
    return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
};


/**
 * Given the location of the 'middle snake', split the diff in two parts
 * and recurse.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} x Index of split point in text1.
 * @param {number} y Index of split point in text2.
 * @param {number} deadline Time at which to bail if not yet complete.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_bisectSplit_ = function(text1, text2, x, y,
                                                        deadline) {
    var text1a = text1.substring(0, x);
    var text2a = text2.substring(0, y);
    var text1b = text1.substring(x);
    var text2b = text2.substring(y);

    // Compute both diffs serially.
    var diffs = this.diff_main(text1a, text2a, false, deadline);
    var diffsb = this.diff_main(text1b, text2b, false, deadline);

    return diffs.concat(diffsb);
};


/**
 * Split two texts into an array of strings.  Reduce the texts to a string of
 * hashes where each Unicode character represents one line.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {{chars1: string, chars2: string, lineArray: !Array.<string>}}
 *     An object containing the encoded text1, the encoded text2 and
 *     the array of unique strings.
 *     The zeroth element of the array of unique strings is intentionally blank.
 * @private
 */
diff_match_patch.prototype.diff_linesToChars_ = function(text1, text2) {
    var lineArray = [];  // e.g. lineArray[4] == 'Hello\n'
    var lineHash = {};   // e.g. lineHash['Hello\n'] == 4

    // '\x00' is a valid character, but various debuggers don't like it.
    // So we'll insert a junk entry to avoid generating a null character.
    lineArray[0] = '';

    /**
     * Split a text into an array of strings.  Reduce the texts to a string of
     * hashes where each Unicode character represents one line.
     * Modifies linearray and linehash through being a closure.
     * @param {string} text String to encode.
     * @return {string} Encoded string.
     * @private
     */
    function diff_linesToCharsMunge_(text) {
        var chars = '';
        // Walk the text, pulling out a substring for each line.
        // text.split('\n') would would temporarily double our memory footprint.
        // Modifying text would create many large strings to garbage collect.
        var lineStart = 0;
        var lineEnd = -1;
        // Keeping our own length variable is faster than looking it up.
        var lineArrayLength = lineArray.length;
        while (lineEnd < text.length - 1) {
            lineEnd = text.indexOf('\n', lineStart);
            if (lineEnd == -1) {
                lineEnd = text.length - 1;
            }
            var line = text.substring(lineStart, lineEnd + 1);
            lineStart = lineEnd + 1;

            if (lineHash.hasOwnProperty ? lineHash.hasOwnProperty(line) :
                    (lineHash[line] !== undefined)) {
                chars += String.fromCharCode(lineHash[line]);
            } else {
                chars += String.fromCharCode(lineArrayLength);
                lineHash[line] = lineArrayLength;
                lineArray[lineArrayLength++] = line;
            }
        }
        return chars;
    }

    var chars1 = diff_linesToCharsMunge_(text1);
    var chars2 = diff_linesToCharsMunge_(text2);
    return {chars1: chars1, chars2: chars2, lineArray: lineArray};
};


/**
 * Rehydrate the text in a diff from a string of line hashes to real lines of
 * text.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @param {!Array.<string>} lineArray Array of unique strings.
 * @private
 */
diff_match_patch.prototype.diff_charsToLines_ = function(diffs, lineArray) {
    for (var x = 0; x < diffs.length; x++) {
        var chars = diffs[x][1];
        var text = [];
        for (var y = 0; y < chars.length; y++) {
            text[y] = lineArray[chars.charCodeAt(y)];
        }
        diffs[x][1] = text.join('');
    }
};


/**
 * Determine the common prefix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the start of each
 *     string.
 */
diff_match_patch.prototype.diff_commonPrefix = function(text1, text2) {
    // Quick check for common null cases.
    if (!text1 || !text2 || text1.charAt(0) != text2.charAt(0)) {
        return 0;
    }
    // Binary search.
    // Performance analysis: http://neil.fraser.name/news/2007/10/09/
    var pointermin = 0;
    var pointermax = Math.min(text1.length, text2.length);
    var pointermid = pointermax;
    var pointerstart = 0;
    while (pointermin < pointermid) {
        if (text1.substring(pointerstart, pointermid) ==
            text2.substring(pointerstart, pointermid)) {
            pointermin = pointermid;
            pointerstart = pointermin;
        } else {
            pointermax = pointermid;
        }
        pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
    }
    return pointermid;
};


/**
 * Determine the common suffix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of each string.
 */
diff_match_patch.prototype.diff_commonSuffix = function(text1, text2) {
    // Quick check for common null cases.
    if (!text1 || !text2 ||
        text1.charAt(text1.length - 1) != text2.charAt(text2.length - 1)) {
        return 0;
    }
    // Binary search.
    // Performance analysis: http://neil.fraser.name/news/2007/10/09/
    var pointermin = 0;
    var pointermax = Math.min(text1.length, text2.length);
    var pointermid = pointermax;
    var pointerend = 0;
    while (pointermin < pointermid) {
        if (text1.substring(text1.length - pointermid, text1.length - pointerend) ==
            text2.substring(text2.length - pointermid, text2.length - pointerend)) {
            pointermin = pointermid;
            pointerend = pointermin;
        } else {
            pointermax = pointermid;
        }
        pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
    }
    return pointermid;
};


/**
 * Determine if the suffix of one string is the prefix of another.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of the first
 *     string and the start of the second string.
 * @private
 */
diff_match_patch.prototype.diff_commonOverlap_ = function(text1, text2) {
    // Cache the text lengths to prevent multiple calls.
    var text1_length = text1.length;
    var text2_length = text2.length;
    // Eliminate the null case.
    if (text1_length == 0 || text2_length == 0) {
        return 0;
    }
    // Truncate the longer string.
    if (text1_length > text2_length) {
        text1 = text1.substring(text1_length - text2_length);
    } else if (text1_length < text2_length) {
        text2 = text2.substring(0, text1_length);
    }
    var text_length = Math.min(text1_length, text2_length);
    // Quick check for the worst case.
    if (text1 == text2) {
        return text_length;
    }

    // Start by looking for a single character match
    // and increase length until no match is found.
    // Performance analysis: http://neil.fraser.name/news/2010/11/04/
    var best = 0;
    var length = 1;
    while (true) {
        var pattern = text1.substring(text_length - length);
        var found = text2.indexOf(pattern);
        if (found == -1) {
            return best;
        }
        length += found;
        if (found == 0 || text1.substring(text_length - length) ==
            text2.substring(0, length)) {
            best = length;
            length++;
        }
    }
};


/**
 * Do the two texts share a substring which is at least half the length of the
 * longer text?
 * This speedup can produce non-minimal diffs.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {Array.<string>} Five element Array, containing the prefix of
 *     text1, the suffix of text1, the prefix of text2, the suffix of
 *     text2 and the common middle.  Or null if there was no match.
 * @private
 */
diff_match_patch.prototype.diff_halfMatch_ = function(text1, text2) {
    if (this.Diff_Timeout <= 0) {
        // Don't risk returning a non-optimal diff if we have unlimited time.
        return null;
    }
    var longtext = text1.length > text2.length ? text1 : text2;
    var shorttext = text1.length > text2.length ? text2 : text1;
    if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
        return null;  // Pointless.
    }
    var dmp = this;  // 'this' becomes 'window' in a closure.

    /**
     * Does a substring of shorttext exist within longtext such that the substring
     * is at least half the length of longtext?
     * Closure, but does not reference any external variables.
     * @param {string} longtext Longer string.
     * @param {string} shorttext Shorter string.
     * @param {number} i Start index of quarter length substring within longtext.
     * @return {Array.<string>} Five element Array, containing the prefix of
     *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
     *     of shorttext and the common middle.  Or null if there was no match.
     * @private
     */
    function diff_halfMatchI_(longtext, shorttext, i) {
        // Start with a 1/4 length substring at position i as a seed.
        var seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
        var j = -1;
        var best_common = '';
        var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
        while ((j = shorttext.indexOf(seed, j + 1)) != -1) {
            var prefixLength = dmp.diff_commonPrefix(longtext.substring(i),
                shorttext.substring(j));
            var suffixLength = dmp.diff_commonSuffix(longtext.substring(0, i),
                shorttext.substring(0, j));
            if (best_common.length < suffixLength + prefixLength) {
                best_common = shorttext.substring(j - suffixLength, j) +
                    shorttext.substring(j, j + prefixLength);
                best_longtext_a = longtext.substring(0, i - suffixLength);
                best_longtext_b = longtext.substring(i + prefixLength);
                best_shorttext_a = shorttext.substring(0, j - suffixLength);
                best_shorttext_b = shorttext.substring(j + prefixLength);
            }
        }
        if (best_common.length * 2 >= longtext.length) {
            return [best_longtext_a, best_longtext_b,
                best_shorttext_a, best_shorttext_b, best_common];
        } else {
            return null;
        }
    }

    // First check if the second quarter is the seed for a half-match.
    var hm1 = diff_halfMatchI_(longtext, shorttext,
        Math.ceil(longtext.length / 4));
    // Check again based on the third quarter.
    var hm2 = diff_halfMatchI_(longtext, shorttext,
        Math.ceil(longtext.length / 2));
    var hm;
    if (!hm1 && !hm2) {
        return null;
    } else if (!hm2) {
        hm = hm1;
    } else if (!hm1) {
        hm = hm2;
    } else {
        // Both matched.  Select the longest.
        hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
    }

    // A half-match was found, sort out the return data.
    var text1_a, text1_b, text2_a, text2_b;
    if (text1.length > text2.length) {
        text1_a = hm[0];
        text1_b = hm[1];
        text2_a = hm[2];
        text2_b = hm[3];
    } else {
        text2_a = hm[0];
        text2_b = hm[1];
        text1_a = hm[2];
        text1_b = hm[3];
    }
    var mid_common = hm[4];
    return [text1_a, text1_b, text2_a, text2_b, mid_common];
};


/**
 * Reduce the number of edits by eliminating semantically trivial equalities.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupSemantic = function(diffs) {
    var changes = false;
    var equalities = [];  // Stack of indices where equalities are found.
    var equalitiesLength = 0;  // Keeping our own length var is faster in JS.
    /** @type {?string} */
    var lastequality = null;
    // Always equal to diffs[equalities[equalitiesLength - 1]][1]
    var pointer = 0;  // Index of current position.
    // Number of characters that changed prior to the equality.
    var length_insertions1 = 0;
    var length_deletions1 = 0;
    // Number of characters that changed after the equality.
    var length_insertions2 = 0;
    var length_deletions2 = 0;
    while (pointer < diffs.length) {
        if (diffs[pointer][0] == DIFF_EQUAL) {  // Equality found.
            equalities[equalitiesLength++] = pointer;
            length_insertions1 = length_insertions2;
            length_deletions1 = length_deletions2;
            length_insertions2 = 0;
            length_deletions2 = 0;
            lastequality = diffs[pointer][1];
        } else {  // An insertion or deletion.
            if (diffs[pointer][0] == DIFF_INSERT) {
                length_insertions2 += diffs[pointer][1].length;
            } else {
                length_deletions2 += diffs[pointer][1].length;
            }
            // Eliminate an equality that is smaller or equal to the edits on both
            // sides of it.
            if (lastequality && (lastequality.length <=
                Math.max(length_insertions1, length_deletions1)) &&
                (lastequality.length <= Math.max(length_insertions2,
                    length_deletions2))) {
                // Duplicate record.
                diffs.splice(equalities[equalitiesLength - 1], 0,
                    [DIFF_DELETE, lastequality]);
                // Change second copy to insert.
                diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
                // Throw away the equality we just deleted.
                equalitiesLength--;
                // Throw away the previous equality (it needs to be reevaluated).
                equalitiesLength--;
                pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
                length_insertions1 = 0;  // Reset the counters.
                length_deletions1 = 0;
                length_insertions2 = 0;
                length_deletions2 = 0;
                lastequality = null;
                changes = true;
            }
        }
        pointer++;
    }

    // Normalize the diff.
    if (changes) {
        this.diff_cleanupMerge(diffs);
    }
    this.diff_cleanupSemanticLossless(diffs);

    // Find any overlaps between deletions and insertions.
    // e.g: <del>abcxxx</del><ins>xxxdef</ins>
    //   -> <del>abc</del>xxx<ins>def</ins>
    // e.g: <del>xxxabc</del><ins>defxxx</ins>
    //   -> <ins>def</ins>xxx<del>abc</del>
    // Only extract an overlap if it is as big as the edit ahead or behind it.
    pointer = 1;
    while (pointer < diffs.length) {
        if (diffs[pointer - 1][0] == DIFF_DELETE &&
            diffs[pointer][0] == DIFF_INSERT) {
            var deletion = diffs[pointer - 1][1];
            var insertion = diffs[pointer][1];
            var overlap_length1 = this.diff_commonOverlap_(deletion, insertion);
            var overlap_length2 = this.diff_commonOverlap_(insertion, deletion);
            if (overlap_length1 >= overlap_length2) {
                if (overlap_length1 >= deletion.length / 2 ||
                    overlap_length1 >= insertion.length / 2) {
                    // Overlap found.  Insert an equality and trim the surrounding edits.
                    diffs.splice(pointer, 0,
                        [DIFF_EQUAL, insertion.substring(0, overlap_length1)]);
                    diffs[pointer - 1][1] =
                        deletion.substring(0, deletion.length - overlap_length1);
                    diffs[pointer + 1][1] = insertion.substring(overlap_length1);
                    pointer++;
                }
            } else {
                if (overlap_length2 >= deletion.length / 2 ||
                    overlap_length2 >= insertion.length / 2) {
                    // Reverse overlap found.
                    // Insert an equality and swap and trim the surrounding edits.
                    diffs.splice(pointer, 0,
                        [DIFF_EQUAL, deletion.substring(0, overlap_length2)]);
                    diffs[pointer - 1][0] = DIFF_INSERT;
                    diffs[pointer - 1][1] =
                        insertion.substring(0, insertion.length - overlap_length2);
                    diffs[pointer + 1][0] = DIFF_DELETE;
                    diffs[pointer + 1][1] =
                        deletion.substring(overlap_length2);
                    pointer++;
                }
            }
            pointer++;
        }
        pointer++;
    }
};


/**
 * Look for single edits surrounded on both sides by equalities
 * which can be shifted sideways to align the edit to a word boundary.
 * e.g: The c<ins>at c</ins>ame. -> The <ins>cat </ins>came.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupSemanticLossless = function(diffs) {
    /**
     * Given two strings, compute a score representing whether the internal
     * boundary falls on logical boundaries.
     * Scores range from 6 (best) to 0 (worst).
     * Closure, but does not reference any external variables.
     * @param {string} one First string.
     * @param {string} two Second string.
     * @return {number} The score.
     * @private
     */
    function diff_cleanupSemanticScore_(one, two) {
        if (!one || !two) {
            // Edges are the best.
            return 6;
        }

        // Each port of this function behaves slightly differently due to
        // subtle differences in each language's definition of things like
        // 'whitespace'.  Since this function's purpose is largely cosmetic,
        // the choice has been made to use each language's native features
        // rather than force total conformity.
        var char1 = one.charAt(one.length - 1);
        var char2 = two.charAt(0);
        var nonAlphaNumeric1 = char1.match(diff_match_patch.nonAlphaNumericRegex_);
        var nonAlphaNumeric2 = char2.match(diff_match_patch.nonAlphaNumericRegex_);
        var whitespace1 = nonAlphaNumeric1 &&
            char1.match(diff_match_patch.whitespaceRegex_);
        var whitespace2 = nonAlphaNumeric2 &&
            char2.match(diff_match_patch.whitespaceRegex_);
        var lineBreak1 = whitespace1 &&
            char1.match(diff_match_patch.linebreakRegex_);
        var lineBreak2 = whitespace2 &&
            char2.match(diff_match_patch.linebreakRegex_);
        var blankLine1 = lineBreak1 &&
            one.match(diff_match_patch.blanklineEndRegex_);
        var blankLine2 = lineBreak2 &&
            two.match(diff_match_patch.blanklineStartRegex_);

        if (blankLine1 || blankLine2) {
            // Five points for blank lines.
            return 5;
        } else if (lineBreak1 || lineBreak2) {
            // Four points for line breaks.
            return 4;
        } else if (nonAlphaNumeric1 && !whitespace1 && whitespace2) {
            // Three points for end of sentences.
            return 3;
        } else if (whitespace1 || whitespace2) {
            // Two points for whitespace.
            return 2;
        } else if (nonAlphaNumeric1 || nonAlphaNumeric2) {
            // One point for non-alphanumeric.
            return 1;
        }
        return 0;
    }

    var pointer = 1;
    // Intentionally ignore the first and last element (don't need checking).
    while (pointer < diffs.length - 1) {
        if (diffs[pointer - 1][0] == DIFF_EQUAL &&
            diffs[pointer + 1][0] == DIFF_EQUAL) {
            // This is a single edit surrounded by equalities.
            var equality1 = diffs[pointer - 1][1];
            var edit = diffs[pointer][1];
            var equality2 = diffs[pointer + 1][1];

            // First, shift the edit as far left as possible.
            var commonOffset = this.diff_commonSuffix(equality1, edit);
            if (commonOffset) {
                var commonString = edit.substring(edit.length - commonOffset);
                equality1 = equality1.substring(0, equality1.length - commonOffset);
                edit = commonString + edit.substring(0, edit.length - commonOffset);
                equality2 = commonString + equality2;
            }

            // Second, step character by character right, looking for the best fit.
            var bestEquality1 = equality1;
            var bestEdit = edit;
            var bestEquality2 = equality2;
            var bestScore = diff_cleanupSemanticScore_(equality1, edit) +
                diff_cleanupSemanticScore_(edit, equality2);
            while (edit.charAt(0) === equality2.charAt(0)) {
                equality1 += edit.charAt(0);
                edit = edit.substring(1) + equality2.charAt(0);
                equality2 = equality2.substring(1);
                var score = diff_cleanupSemanticScore_(equality1, edit) +
                    diff_cleanupSemanticScore_(edit, equality2);
                // The >= encourages trailing rather than leading whitespace on edits.
                if (score >= bestScore) {
                    bestScore = score;
                    bestEquality1 = equality1;
                    bestEdit = edit;
                    bestEquality2 = equality2;
                }
            }

            if (diffs[pointer - 1][1] != bestEquality1) {
                // We have an improvement, save it back to the diff.
                if (bestEquality1) {
                    diffs[pointer - 1][1] = bestEquality1;
                } else {
                    diffs.splice(pointer - 1, 1);
                    pointer--;
                }
                diffs[pointer][1] = bestEdit;
                if (bestEquality2) {
                    diffs[pointer + 1][1] = bestEquality2;
                } else {
                    diffs.splice(pointer + 1, 1);
                    pointer--;
                }
            }
        }
        pointer++;
    }
};

// Define some regex patterns for matching boundaries.
diff_match_patch.nonAlphaNumericRegex_ = /[^a-zA-Z0-9]/;
diff_match_patch.whitespaceRegex_ = /\s/;
diff_match_patch.linebreakRegex_ = /[\r\n]/;
diff_match_patch.blanklineEndRegex_ = /\n\r?\n$/;
diff_match_patch.blanklineStartRegex_ = /^\r?\n\r?\n/;

/**
 * Reduce the number of edits by eliminating operationally trivial equalities.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupEfficiency = function(diffs) {
    var changes = false;
    var equalities = [];  // Stack of indices where equalities are found.
    var equalitiesLength = 0;  // Keeping our own length var is faster in JS.
    /** @type {?string} */
    var lastequality = null;
    // Always equal to diffs[equalities[equalitiesLength - 1]][1]
    var pointer = 0;  // Index of current position.
    // Is there an insertion operation before the last equality.
    var pre_ins = false;
    // Is there a deletion operation before the last equality.
    var pre_del = false;
    // Is there an insertion operation after the last equality.
    var post_ins = false;
    // Is there a deletion operation after the last equality.
    var post_del = false;
    while (pointer < diffs.length) {
        if (diffs[pointer][0] == DIFF_EQUAL) {  // Equality found.
            if (diffs[pointer][1].length < this.Diff_EditCost &&
                (post_ins || post_del)) {
                // Candidate found.
                equalities[equalitiesLength++] = pointer;
                pre_ins = post_ins;
                pre_del = post_del;
                lastequality = diffs[pointer][1];
            } else {
                // Not a candidate, and can never become one.
                equalitiesLength = 0;
                lastequality = null;
            }
            post_ins = post_del = false;
        } else {  // An insertion or deletion.
            if (diffs[pointer][0] == DIFF_DELETE) {
                post_del = true;
            } else {
                post_ins = true;
            }
            /*
             * Five types to be split:
             * <ins>A</ins><del>B</del>XY<ins>C</ins><del>D</del>
             * <ins>A</ins>X<ins>C</ins><del>D</del>
             * <ins>A</ins><del>B</del>X<ins>C</ins>
             * <ins>A</del>X<ins>C</ins><del>D</del>
             * <ins>A</ins><del>B</del>X<del>C</del>
             */
            if (lastequality && ((pre_ins && pre_del && post_ins && post_del) ||
                ((lastequality.length < this.Diff_EditCost / 2) &&
                (pre_ins + pre_del + post_ins + post_del) == 3))) {
                // Duplicate record.
                diffs.splice(equalities[equalitiesLength - 1], 0,
                    [DIFF_DELETE, lastequality]);
                // Change second copy to insert.
                diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
                equalitiesLength--;  // Throw away the equality we just deleted;
                lastequality = null;
                if (pre_ins && pre_del) {
                    // No changes made which could affect previous entry, keep going.
                    post_ins = post_del = true;
                    equalitiesLength = 0;
                } else {
                    equalitiesLength--;  // Throw away the previous equality.
                    pointer = equalitiesLength > 0 ?
                        equalities[equalitiesLength - 1] : -1;
                    post_ins = post_del = false;
                }
                changes = true;
            }
        }
        pointer++;
    }

    if (changes) {
        this.diff_cleanupMerge(diffs);
    }
};


/**
 * Reorder and merge like edit sections.  Merge equalities.
 * Any edit section can move as long as it doesn't cross an equality.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupMerge = function(diffs) {
    diffs.push([DIFF_EQUAL, '']);  // Add a dummy entry at the end.
    var pointer = 0;
    var count_delete = 0;
    var count_insert = 0;
    var text_delete = '';
    var text_insert = '';
    var commonlength;
    while (pointer < diffs.length) {
        switch (diffs[pointer][0]) {
            case DIFF_INSERT:
                count_insert++;
                text_insert += diffs[pointer][1];
                pointer++;
                break;
            case DIFF_DELETE:
                count_delete++;
                text_delete += diffs[pointer][1];
                pointer++;
                break;
            case DIFF_EQUAL:
                // Upon reaching an equality, check for prior redundancies.
                if (count_delete + count_insert > 1) {
                    if (count_delete !== 0 && count_insert !== 0) {
                        // Factor out any common prefixies.
                        commonlength = this.diff_commonPrefix(text_insert, text_delete);
                        if (commonlength !== 0) {
                            if ((pointer - count_delete - count_insert) > 0 &&
                                diffs[pointer - count_delete - count_insert - 1][0] ==
                                DIFF_EQUAL) {
                                diffs[pointer - count_delete - count_insert - 1][1] +=
                                    text_insert.substring(0, commonlength);
                            } else {
                                diffs.splice(0, 0, [DIFF_EQUAL,
                                    text_insert.substring(0, commonlength)]);
                                pointer++;
                            }
                            text_insert = text_insert.substring(commonlength);
                            text_delete = text_delete.substring(commonlength);
                        }
                        // Factor out any common suffixies.
                        commonlength = this.diff_commonSuffix(text_insert, text_delete);
                        if (commonlength !== 0) {
                            diffs[pointer][1] = text_insert.substring(text_insert.length -
                                    commonlength) + diffs[pointer][1];
                            text_insert = text_insert.substring(0, text_insert.length -
                                commonlength);
                            text_delete = text_delete.substring(0, text_delete.length -
                                commonlength);
                        }
                    }
                    // Delete the offending records and add the merged ones.
                    if (count_delete === 0) {
                        diffs.splice(pointer - count_insert,
                            count_delete + count_insert, [DIFF_INSERT, text_insert]);
                    } else if (count_insert === 0) {
                        diffs.splice(pointer - count_delete,
                            count_delete + count_insert, [DIFF_DELETE, text_delete]);
                    } else {
                        diffs.splice(pointer - count_delete - count_insert,
                            count_delete + count_insert, [DIFF_DELETE, text_delete],
                            [DIFF_INSERT, text_insert]);
                    }
                    pointer = pointer - count_delete - count_insert +
                        (count_delete ? 1 : 0) + (count_insert ? 1 : 0) + 1;
                } else if (pointer !== 0 && diffs[pointer - 1][0] == DIFF_EQUAL) {
                    // Merge this equality with the previous one.
                    diffs[pointer - 1][1] += diffs[pointer][1];
                    diffs.splice(pointer, 1);
                } else {
                    pointer++;
                }
                count_insert = 0;
                count_delete = 0;
                text_delete = '';
                text_insert = '';
                break;
        }
    }
    if (diffs[diffs.length - 1][1] === '') {
        diffs.pop();  // Remove the dummy entry at the end.
    }

    // Second pass: look for single edits surrounded on both sides by equalities
    // which can be shifted sideways to eliminate an equality.
    // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
    var changes = false;
    pointer = 1;
    // Intentionally ignore the first and last element (don't need checking).
    while (pointer < diffs.length - 1) {
        if (diffs[pointer - 1][0] == DIFF_EQUAL &&
            diffs[pointer + 1][0] == DIFF_EQUAL) {
            // This is a single edit surrounded by equalities.
            if (diffs[pointer][1].substring(diffs[pointer][1].length -
                    diffs[pointer - 1][1].length) == diffs[pointer - 1][1]) {
                // Shift the edit over the previous equality.
                diffs[pointer][1] = diffs[pointer - 1][1] +
                    diffs[pointer][1].substring(0, diffs[pointer][1].length -
                        diffs[pointer - 1][1].length);
                diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
                diffs.splice(pointer - 1, 1);
                changes = true;
            } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ==
                diffs[pointer + 1][1]) {
                // Shift the edit over the next equality.
                diffs[pointer - 1][1] += diffs[pointer + 1][1];
                diffs[pointer][1] =
                    diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
                    diffs[pointer + 1][1];
                diffs.splice(pointer + 1, 1);
                changes = true;
            }
        }
        pointer++;
    }
    // If shifts were made, the diff needs reordering and another shift sweep.
    if (changes) {
        this.diff_cleanupMerge(diffs);
    }
};


/**
 * loc is a location in text1, compute and return the equivalent location in
 * text2.
 * e.g. 'The cat' vs 'The big cat', 1->1, 5->8
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @param {number} loc Location within text1.
 * @return {number} Location within text2.
 */
diff_match_patch.prototype.diff_xIndex = function(diffs, loc) {
    var chars1 = 0;
    var chars2 = 0;
    var last_chars1 = 0;
    var last_chars2 = 0;
    var x;
    for (x = 0; x < diffs.length; x++) {
        if (diffs[x][0] !== DIFF_INSERT) {  // Equality or deletion.
            chars1 += diffs[x][1].length;
        }
        if (diffs[x][0] !== DIFF_DELETE) {  // Equality or insertion.
            chars2 += diffs[x][1].length;
        }
        if (chars1 > loc) {  // Overshot the location.
            break;
        }
        last_chars1 = chars1;
        last_chars2 = chars2;
    }
    // Was the location was deleted?
    if (diffs.length != x && diffs[x][0] === DIFF_DELETE) {
        return last_chars2;
    }
    // Add the remaining character length.
    return last_chars2 + (loc - last_chars1);
};


/**
 * Convert a diff array into a pretty HTML report.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} HTML representation.
 */
diff_match_patch.prototype.diff_prettyHtml = function(diffs) {
    var html = [];
    var pattern_amp = /&/g;
    var pattern_lt = /</g;
    var pattern_gt = />/g;
    var pattern_para = /\n/g;
    for (var x = 0; x < diffs.length; x++) {
        var op = diffs[x][0];    // Operation (insert, delete, equal)
        var data = diffs[x][1];  // Text of change.
        var text = data.replace(pattern_amp, '&amp;').replace(pattern_lt, '&lt;')
            .replace(pattern_gt, '&gt;').replace(pattern_para, '&para;<br>');
        switch (op) {
            case DIFF_INSERT:
                html[x] = '<ins style="background:#e6ffe6;">' + text + '</ins>';
                break;
            case DIFF_DELETE:
                html[x] = '<del style="background:#ffe6e6;">' + text + '</del>';
                break;
            case DIFF_EQUAL:
                html[x] = '<span>' + text + '</span>';
                break;
        }
    }
    return html.join('');
};


/**
 * Compute and return the source text (all equalities and deletions).
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Source text.
 */
diff_match_patch.prototype.diff_text1 = function(diffs) {
    var text = [];
    for (var x = 0; x < diffs.length; x++) {
        if (diffs[x][0] !== DIFF_INSERT) {
            text[x] = diffs[x][1];
        }
    }
    return text.join('');
};


/**
 * Compute and return the destination text (all equalities and insertions).
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Destination text.
 */
diff_match_patch.prototype.diff_text2 = function(diffs) {
    var text = [];
    for (var x = 0; x < diffs.length; x++) {
        if (diffs[x][0] !== DIFF_DELETE) {
            text[x] = diffs[x][1];
        }
    }
    return text.join('');
};


/**
 * Compute the Levenshtein distance; the number of inserted, deleted or
 * substituted characters.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {number} Number of changes.
 */
diff_match_patch.prototype.diff_levenshtein = function(diffs) {
    var levenshtein = 0;
    var insertions = 0;
    var deletions = 0;
    for (var x = 0; x < diffs.length; x++) {
        var op = diffs[x][0];
        var data = diffs[x][1];
        switch (op) {
            case DIFF_INSERT:
                insertions += data.length;
                break;
            case DIFF_DELETE:
                deletions += data.length;
                break;
            case DIFF_EQUAL:
                // A deletion and an insertion is one substitution.
                levenshtein += Math.max(insertions, deletions);
                insertions = 0;
                deletions = 0;
                break;
        }
    }
    levenshtein += Math.max(insertions, deletions);
    return levenshtein;
};


/**
 * Crush the diff into an encoded string which describes the operations
 * required to transform text1 into text2.
 * E.g. =3\t-2\t+ing  -> Keep 3 chars, delete 2 chars, insert 'ing'.
 * Operations are tab-separated.  Inserted text is escaped using %xx notation.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Delta text.
 */
diff_match_patch.prototype.diff_toDelta = function(diffs) {
    var text = [];
    for (var x = 0; x < diffs.length; x++) {
        switch (diffs[x][0]) {
            case DIFF_INSERT:
                text[x] = '+' + encodeURI(diffs[x][1]);
                break;
            case DIFF_DELETE:
                text[x] = '-' + diffs[x][1].length;
                break;
            case DIFF_EQUAL:
                text[x] = '=' + diffs[x][1].length;
                break;
        }
    }
    return text.join('\t').replace(/%20/g, ' ');
};


/**
 * Given the original text1, and an encoded string which describes the
 * operations required to transform text1 into text2, compute the full diff.
 * @param {string} text1 Source string for the diff.
 * @param {string} delta Delta text.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @throws {!Error} If invalid input.
 */
diff_match_patch.prototype.diff_fromDelta = function(text1, delta) {
    var diffs = [];
    var diffsLength = 0;  // Keeping our own length var is faster in JS.
    var pointer = 0;  // Cursor in text1
    var tokens = delta.split(/\t/g);
    for (var x = 0; x < tokens.length; x++) {
        // Each token begins with a one character parameter which specifies the
        // operation of this token (delete, insert, equality).
        var param = tokens[x].substring(1);
        switch (tokens[x].charAt(0)) {
            case '+':
                try {
                    diffs[diffsLength++] = [DIFF_INSERT, decodeURI(param)];
                } catch (ex) {
                    // Malformed URI sequence.
                    throw new Error('Illegal escape in diff_fromDelta: ' + param);
                }
                break;
            case '-':
            // Fall through.
            case '=':
                var n = parseInt(param, 10);
                if (isNaN(n) || n < 0) {
                    throw new Error('Invalid number in diff_fromDelta: ' + param);
                }
                var text = text1.substring(pointer, pointer += n);
                if (tokens[x].charAt(0) == '=') {
                    diffs[diffsLength++] = [DIFF_EQUAL, text];
                } else {
                    diffs[diffsLength++] = [DIFF_DELETE, text];
                }
                break;
            default:
                // Blank tokens are ok (from a trailing \t).
                // Anything else is an error.
                if (tokens[x]) {
                    throw new Error('Invalid diff operation in diff_fromDelta: ' +
                        tokens[x]);
                }
        }
    }
    if (pointer != text1.length) {
        throw new Error('Delta length (' + pointer +
            ') does not equal source text length (' + text1.length + ').');
    }
    return diffs;
};


//  MATCH FUNCTIONS


/**
 * Locate the best instance of 'pattern' in 'text' near 'loc'.
 * @param {string} text The text to search.
 * @param {string} pattern The pattern to search for.
 * @param {number} loc The location to search around.
 * @return {number} Best match index or -1.
 */
diff_match_patch.prototype.match_main = function(text, pattern, loc) {
    // Check for null inputs.
    if (text == null || pattern == null || loc == null) {
        throw new Error('Null input. (match_main)');
    }

    loc = Math.max(0, Math.min(loc, text.length));
    if (text == pattern) {
        // Shortcut (potentially not guaranteed by the algorithm)
        return 0;
    } else if (!text.length) {
        // Nothing to match.
        return -1;
    } else if (text.substring(loc, loc + pattern.length) == pattern) {
        // Perfect match at the perfect spot!  (Includes case of null pattern)
        return loc;
    } else {
        // Do a fuzzy compare.
        return this.match_bitap_(text, pattern, loc);
    }
};


/**
 * Locate the best instance of 'pattern' in 'text' near 'loc' using the
 * Bitap algorithm.
 * @param {string} text The text to search.
 * @param {string} pattern The pattern to search for.
 * @param {number} loc The location to search around.
 * @return {number} Best match index or -1.
 * @private
 */
diff_match_patch.prototype.match_bitap_ = function(text, pattern, loc) {
    if (pattern.length > this.Match_MaxBits) {
        throw new Error('Pattern too long for this browser.');
    }

    // Initialise the alphabet.
    var s = this.match_alphabet_(pattern);

    var dmp = this;  // 'this' becomes 'window' in a closure.

    /**
     * Compute and return the score for a match with e errors and x location.
     * Accesses loc and pattern through being a closure.
     * @param {number} e Number of errors in match.
     * @param {number} x Location of match.
     * @return {number} Overall score for match (0.0 = good, 1.0 = bad).
     * @private
     */
    function match_bitapScore_(e, x) {
        var accuracy = e / pattern.length;
        var proximity = Math.abs(loc - x);
        if (!dmp.Match_Distance) {
            // Dodge divide by zero error.
            return proximity ? 1.0 : accuracy;
        }
        return accuracy + (proximity / dmp.Match_Distance);
    }

    // Highest score beyond which we give up.
    var score_threshold = this.Match_Threshold;
    // Is there a nearby exact match? (speedup)
    var best_loc = text.indexOf(pattern, loc);
    if (best_loc != -1) {
        score_threshold = Math.min(match_bitapScore_(0, best_loc), score_threshold);
        // What about in the other direction? (speedup)
        best_loc = text.lastIndexOf(pattern, loc + pattern.length);
        if (best_loc != -1) {
            score_threshold =
                Math.min(match_bitapScore_(0, best_loc), score_threshold);
        }
    }

    // Initialise the bit arrays.
    var matchmask = 1 << (pattern.length - 1);
    best_loc = -1;

    var bin_min, bin_mid;
    var bin_max = pattern.length + text.length;
    var last_rd;
    for (var d = 0; d < pattern.length; d++) {
        // Scan for the best match; each iteration allows for one more error.
        // Run a binary search to determine how far from 'loc' we can stray at this
        // error level.
        bin_min = 0;
        bin_mid = bin_max;
        while (bin_min < bin_mid) {
            if (match_bitapScore_(d, loc + bin_mid) <= score_threshold) {
                bin_min = bin_mid;
            } else {
                bin_max = bin_mid;
            }
            bin_mid = Math.floor((bin_max - bin_min) / 2 + bin_min);
        }
        // Use the result from this iteration as the maximum for the next.
        bin_max = bin_mid;
        var start = Math.max(1, loc - bin_mid + 1);
        var finish = Math.min(loc + bin_mid, text.length) + pattern.length;

        var rd = Array(finish + 2);
        rd[finish + 1] = (1 << d) - 1;
        for (var j = finish; j >= start; j--) {
            // The alphabet (s) is a sparse hash, so the following line generates
            // warnings.
            var charMatch = s[text.charAt(j - 1)];
            if (d === 0) {  // First pass: exact match.
                rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
            } else {  // Subsequent passes: fuzzy match.
                rd[j] = (((rd[j + 1] << 1) | 1) & charMatch) |
                    (((last_rd[j + 1] | last_rd[j]) << 1) | 1) |
                    last_rd[j + 1];
            }
            if (rd[j] & matchmask) {
                var score = match_bitapScore_(d, j - 1);
                // This match will almost certainly be better than any existing match.
                // But check anyway.
                if (score <= score_threshold) {
                    // Told you so.
                    score_threshold = score;
                    best_loc = j - 1;
                    if (best_loc > loc) {
                        // When passing loc, don't exceed our current distance from loc.
                        start = Math.max(1, 2 * loc - best_loc);
                    } else {
                        // Already passed loc, downhill from here on in.
                        break;
                    }
                }
            }
        }
        // No hope for a (better) match at greater error levels.
        if (match_bitapScore_(d + 1, loc) > score_threshold) {
            break;
        }
        last_rd = rd;
    }
    return best_loc;
};


/**
 * Initialise the alphabet for the Bitap algorithm.
 * @param {string} pattern The text to encode.
 * @return {!Object} Hash of character locations.
 * @private
 */
diff_match_patch.prototype.match_alphabet_ = function(pattern) {
    var s = {};
    for (var i = 0; i < pattern.length; i++) {
        s[pattern.charAt(i)] = 0;
    }
    for (var i = 0; i < pattern.length; i++) {
        s[pattern.charAt(i)] |= 1 << (pattern.length - i - 1);
    }
    return s;
};


//  PATCH FUNCTIONS


/**
 * Increase the context until it is unique,
 * but don't let the pattern expand beyond Match_MaxBits.
 * @param {!diff_match_patch.patch_obj} patch The patch to grow.
 * @param {string} text Source text.
 * @private
 */
diff_match_patch.prototype.patch_addContext_ = function(patch, text) {
    if (text.length == 0) {
        return;
    }
    var pattern = text.substring(patch.start2, patch.start2 + patch.length1);
    var padding = 0;

    // Look for the first and last matches of pattern in text.  If two different
    // matches are found, increase the pattern length.
    while (text.indexOf(pattern) != text.lastIndexOf(pattern) &&
    pattern.length < this.Match_MaxBits - this.Patch_Margin -
    this.Patch_Margin) {
        padding += this.Patch_Margin;
        pattern = text.substring(patch.start2 - padding,
            patch.start2 + patch.length1 + padding);
    }
    // Add one chunk for good luck.
    padding += this.Patch_Margin;

    // Add the prefix.
    var prefix = text.substring(patch.start2 - padding, patch.start2);
    if (prefix) {
        patch.diffs.unshift([DIFF_EQUAL, prefix]);
    }
    // Add the suffix.
    var suffix = text.substring(patch.start2 + patch.length1,
        patch.start2 + patch.length1 + padding);
    if (suffix) {
        patch.diffs.push([DIFF_EQUAL, suffix]);
    }

    // Roll back the start points.
    patch.start1 -= prefix.length;
    patch.start2 -= prefix.length;
    // Extend the lengths.
    patch.length1 += prefix.length + suffix.length;
    patch.length2 += prefix.length + suffix.length;
};


/**
 * Compute a list of patches to turn text1 into text2.
 * Use diffs if provided, otherwise compute it ourselves.
 * There are four ways to call this function, depending on what data is
 * available to the caller:
 * Method 1:
 * a = text1, b = text2
 * Method 2:
 * a = diffs
 * Method 3 (optimal):
 * a = text1, b = diffs
 * Method 4 (deprecated, use method 3):
 * a = text1, b = text2, c = diffs
 *
 * @param {string|!Array.<!diff_match_patch.Diff>} a text1 (methods 1,3,4) or
 * Array of diff tuples for text1 to text2 (method 2).
 * @param {string|!Array.<!diff_match_patch.Diff>} opt_b text2 (methods 1,4) or
 * Array of diff tuples for text1 to text2 (method 3) or undefined (method 2).
 * @param {string|!Array.<!diff_match_patch.Diff>} opt_c Array of diff tuples
 * for text1 to text2 (method 4) or undefined (methods 1,2,3).
 * @return {!Array.<!diff_match_patch.patch_obj>} Array of Patch objects.
 */
diff_match_patch.prototype.patch_make = function(a, opt_b, opt_c) {
    var text1, diffs;
    if (typeof a == 'string' && typeof opt_b == 'string' &&
        typeof opt_c == 'undefined') {
        // Method 1: text1, text2
        // Compute diffs from text1 and text2.
        text1 = /** @type {string} */(a);
        diffs = this.diff_main(text1, /** @type {string} */(opt_b), true);
        if (diffs.length > 2) {
            this.diff_cleanupSemantic(diffs);
            this.diff_cleanupEfficiency(diffs);
        }
    } else if (a && typeof a == 'object' && typeof opt_b == 'undefined' &&
        typeof opt_c == 'undefined') {
        // Method 2: diffs
        // Compute text1 from diffs.
        diffs = /** @type {!Array.<!diff_match_patch.Diff>} */(a);
        text1 = this.diff_text1(diffs);
    } else if (typeof a == 'string' && opt_b && typeof opt_b == 'object' &&
        typeof opt_c == 'undefined') {
        // Method 3: text1, diffs
        text1 = /** @type {string} */(a);
        diffs = /** @type {!Array.<!diff_match_patch.Diff>} */(opt_b);
    } else if (typeof a == 'string' && typeof opt_b == 'string' &&
        opt_c && typeof opt_c == 'object') {
        // Method 4: text1, text2, diffs
        // text2 is not used.
        text1 = /** @type {string} */(a);
        diffs = /** @type {!Array.<!diff_match_patch.Diff>} */(opt_c);
    } else {
        throw new Error('Unknown call format to patch_make.');
    }

    if (diffs.length === 0) {
        return [];  // Get rid of the null case.
    }
    var patches = [];
    var patch = new diff_match_patch.patch_obj();
    var patchDiffLength = 0;  // Keeping our own length var is faster in JS.
    var char_count1 = 0;  // Number of characters into the text1 string.
    var char_count2 = 0;  // Number of characters into the text2 string.
    // Start with text1 (prepatch_text) and apply the diffs until we arrive at
    // text2 (postpatch_text).  We recreate the patches one by one to determine
    // context info.
    var prepatch_text = text1;
    var postpatch_text = text1;
    for (var x = 0; x < diffs.length; x++) {
        var diff_type = diffs[x][0];
        var diff_text = diffs[x][1];

        if (!patchDiffLength && diff_type !== DIFF_EQUAL) {
            // A new patch starts here.
            patch.start1 = char_count1;
            patch.start2 = char_count2;
        }

        switch (diff_type) {
            case DIFF_INSERT:
                patch.diffs[patchDiffLength++] = diffs[x];
                patch.length2 += diff_text.length;
                postpatch_text = postpatch_text.substring(0, char_count2) + diff_text +
                    postpatch_text.substring(char_count2);
                break;
            case DIFF_DELETE:
                patch.length1 += diff_text.length;
                patch.diffs[patchDiffLength++] = diffs[x];
                postpatch_text = postpatch_text.substring(0, char_count2) +
                    postpatch_text.substring(char_count2 +
                        diff_text.length);
                break;
            case DIFF_EQUAL:
                if (diff_text.length <= 2 * this.Patch_Margin &&
                    patchDiffLength && diffs.length != x + 1) {
                    // Small equality inside a patch.
                    patch.diffs[patchDiffLength++] = diffs[x];
                    patch.length1 += diff_text.length;
                    patch.length2 += diff_text.length;
                } else if (diff_text.length >= 2 * this.Patch_Margin) {
                    // Time for a new patch.
                    if (patchDiffLength) {
                        this.patch_addContext_(patch, prepatch_text);
                        patches.push(patch);
                        patch = new diff_match_patch.patch_obj();
                        patchDiffLength = 0;
                        // Unlike Unidiff, our patch lists have a rolling context.
                        // http://code.google.com/p/google-diff-match-patch/wiki/Unidiff
                        // Update prepatch text & pos to reflect the application of the
                        // just completed patch.
                        prepatch_text = postpatch_text;
                        char_count1 = char_count2;
                    }
                }
                break;
        }

        // Update the current character count.
        if (diff_type !== DIFF_INSERT) {
            char_count1 += diff_text.length;
        }
        if (diff_type !== DIFF_DELETE) {
            char_count2 += diff_text.length;
        }
    }
    // Pick up the leftover patch if not empty.
    if (patchDiffLength) {
        this.patch_addContext_(patch, prepatch_text);
        patches.push(patch);
    }

    return patches;
};


/**
 * Given an array of patches, return another array that is identical.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 * @return {!Array.<!diff_match_patch.patch_obj>} Array of Patch objects.
 */
diff_match_patch.prototype.patch_deepCopy = function(patches) {
    // Making deep copies is hard in JavaScript.
    var patchesCopy = [];
    for (var x = 0; x < patches.length; x++) {
        var patch = patches[x];
        var patchCopy = new diff_match_patch.patch_obj();
        patchCopy.diffs = [];
        for (var y = 0; y < patch.diffs.length; y++) {
            patchCopy.diffs[y] = patch.diffs[y].slice();
        }
        patchCopy.start1 = patch.start1;
        patchCopy.start2 = patch.start2;
        patchCopy.length1 = patch.length1;
        patchCopy.length2 = patch.length2;
        patchesCopy[x] = patchCopy;
    }
    return patchesCopy;
};


/**
 * Merge a set of patches onto the text.  Return a patched text, as well
 * as a list of true/false values indicating which patches were applied.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 * @param {string} text Old text.
 * @return {!Array.<string|!Array.<boolean>>} Two element Array, containing the
 *      new text and an array of boolean values.
 */
diff_match_patch.prototype.patch_apply = function(patches, text) {
    if (patches.length == 0) {
        return [text, []];
    }

    // Deep copy the patches so that no changes are made to originals.
    patches = this.patch_deepCopy(patches);

    var nullPadding = this.patch_addPadding(patches);
    text = nullPadding + text + nullPadding;

    this.patch_splitMax(patches);
    // delta keeps track of the offset between the expected and actual location
    // of the previous patch.  If there are patches expected at positions 10 and
    // 20, but the first patch was found at 12, delta is 2 and the second patch
    // has an effective expected position of 22.
    var delta = 0;
    var results = [];
    for (var x = 0; x < patches.length; x++) {
        var expected_loc = patches[x].start2 + delta;
        var text1 = this.diff_text1(patches[x].diffs);
        var start_loc;
        var end_loc = -1;
        if (text1.length > this.Match_MaxBits) {
            // patch_splitMax will only provide an oversized pattern in the case of
            // a monster delete.
            start_loc = this.match_main(text, text1.substring(0, this.Match_MaxBits),
                expected_loc);
            if (start_loc != -1) {
                end_loc = this.match_main(text,
                    text1.substring(text1.length - this.Match_MaxBits),
                    expected_loc + text1.length - this.Match_MaxBits);
                if (end_loc == -1 || start_loc >= end_loc) {
                    // Can't find valid trailing context.  Drop this patch.
                    start_loc = -1;
                }
            }
        } else {
            start_loc = this.match_main(text, text1, expected_loc);
        }
        if (start_loc == -1) {
            // No match found.  :(
            results[x] = false;
            // Subtract the delta for this failed patch from subsequent patches.
            delta -= patches[x].length2 - patches[x].length1;
        } else {
            // Found a match.  :)
            results[x] = true;
            delta = start_loc - expected_loc;
            var text2;
            if (end_loc == -1) {
                text2 = text.substring(start_loc, start_loc + text1.length);
            } else {
                text2 = text.substring(start_loc, end_loc + this.Match_MaxBits);
            }
            if (text1 == text2) {
                // Perfect match, just shove the replacement text in.
                text = text.substring(0, start_loc) +
                    this.diff_text2(patches[x].diffs) +
                    text.substring(start_loc + text1.length);
            } else {
                // Imperfect match.  Run a diff to get a framework of equivalent
                // indices.
                var diffs = this.diff_main(text1, text2, false);
                if (text1.length > this.Match_MaxBits &&
                    this.diff_levenshtein(diffs) / text1.length >
                    this.Patch_DeleteThreshold) {
                    // The end points match, but the content is unacceptably bad.
                    results[x] = false;
                } else {
                    this.diff_cleanupSemanticLossless(diffs);
                    var index1 = 0;
                    var index2;
                    for (var y = 0; y < patches[x].diffs.length; y++) {
                        var mod = patches[x].diffs[y];
                        if (mod[0] !== DIFF_EQUAL) {
                            index2 = this.diff_xIndex(diffs, index1);
                        }
                        if (mod[0] === DIFF_INSERT) {  // Insertion
                            text = text.substring(0, start_loc + index2) + mod[1] +
                                text.substring(start_loc + index2);
                        } else if (mod[0] === DIFF_DELETE) {  // Deletion
                            text = text.substring(0, start_loc + index2) +
                                text.substring(start_loc + this.diff_xIndex(diffs,
                                        index1 + mod[1].length));
                        }
                        if (mod[0] !== DIFF_DELETE) {
                            index1 += mod[1].length;
                        }
                    }
                }
            }
        }
    }
    // Strip the padding off.
    text = text.substring(nullPadding.length, text.length - nullPadding.length);
    return [text, results];
};


/**
 * Add some padding on text start and end so that edges can match something.
 * Intended to be called only from within patch_apply.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 * @return {string} The padding string added to each side.
 */
diff_match_patch.prototype.patch_addPadding = function(patches) {
    var paddingLength = this.Patch_Margin;
    var nullPadding = '';
    for (var x = 1; x <= paddingLength; x++) {
        nullPadding += String.fromCharCode(x);
    }

    // Bump all the patches forward.
    for (var x = 0; x < patches.length; x++) {
        patches[x].start1 += paddingLength;
        patches[x].start2 += paddingLength;
    }

    // Add some padding on start of first diff.
    var patch = patches[0];
    var diffs = patch.diffs;
    if (diffs.length == 0 || diffs[0][0] != DIFF_EQUAL) {
        // Add nullPadding equality.
        diffs.unshift([DIFF_EQUAL, nullPadding]);
        patch.start1 -= paddingLength;  // Should be 0.
        patch.start2 -= paddingLength;  // Should be 0.
        patch.length1 += paddingLength;
        patch.length2 += paddingLength;
    } else if (paddingLength > diffs[0][1].length) {
        // Grow first equality.
        var extraLength = paddingLength - diffs[0][1].length;
        diffs[0][1] = nullPadding.substring(diffs[0][1].length) + diffs[0][1];
        patch.start1 -= extraLength;
        patch.start2 -= extraLength;
        patch.length1 += extraLength;
        patch.length2 += extraLength;
    }

    // Add some padding on end of last diff.
    patch = patches[patches.length - 1];
    diffs = patch.diffs;
    if (diffs.length == 0 || diffs[diffs.length - 1][0] != DIFF_EQUAL) {
        // Add nullPadding equality.
        diffs.push([DIFF_EQUAL, nullPadding]);
        patch.length1 += paddingLength;
        patch.length2 += paddingLength;
    } else if (paddingLength > diffs[diffs.length - 1][1].length) {
        // Grow last equality.
        var extraLength = paddingLength - diffs[diffs.length - 1][1].length;
        diffs[diffs.length - 1][1] += nullPadding.substring(0, extraLength);
        patch.length1 += extraLength;
        patch.length2 += extraLength;
    }

    return nullPadding;
};


/**
 * Look through the patches and break up any which are longer than the maximum
 * limit of the match algorithm.
 * Intended to be called only from within patch_apply.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 */
diff_match_patch.prototype.patch_splitMax = function(patches) {
    var patch_size = this.Match_MaxBits;
    for (var x = 0; x < patches.length; x++) {
        if (patches[x].length1 <= patch_size) {
            continue;
        }
        var bigpatch = patches[x];
        // Remove the big old patch.
        patches.splice(x--, 1);
        var start1 = bigpatch.start1;
        var start2 = bigpatch.start2;
        var precontext = '';
        while (bigpatch.diffs.length !== 0) {
            // Create one of several smaller patches.
            var patch = new diff_match_patch.patch_obj();
            var empty = true;
            patch.start1 = start1 - precontext.length;
            patch.start2 = start2 - precontext.length;
            if (precontext !== '') {
                patch.length1 = patch.length2 = precontext.length;
                patch.diffs.push([DIFF_EQUAL, precontext]);
            }
            while (bigpatch.diffs.length !== 0 &&
            patch.length1 < patch_size - this.Patch_Margin) {
                var diff_type = bigpatch.diffs[0][0];
                var diff_text = bigpatch.diffs[0][1];
                if (diff_type === DIFF_INSERT) {
                    // Insertions are harmless.
                    patch.length2 += diff_text.length;
                    start2 += diff_text.length;
                    patch.diffs.push(bigpatch.diffs.shift());
                    empty = false;
                } else if (diff_type === DIFF_DELETE && patch.diffs.length == 1 &&
                    patch.diffs[0][0] == DIFF_EQUAL &&
                    diff_text.length > 2 * patch_size) {
                    // This is a large deletion.  Let it pass in one chunk.
                    patch.length1 += diff_text.length;
                    start1 += diff_text.length;
                    empty = false;
                    patch.diffs.push([diff_type, diff_text]);
                    bigpatch.diffs.shift();
                } else {
                    // Deletion or equality.  Only take as much as we can stomach.
                    diff_text = diff_text.substring(0,
                        patch_size - patch.length1 - this.Patch_Margin);
                    patch.length1 += diff_text.length;
                    start1 += diff_text.length;
                    if (diff_type === DIFF_EQUAL) {
                        patch.length2 += diff_text.length;
                        start2 += diff_text.length;
                    } else {
                        empty = false;
                    }
                    patch.diffs.push([diff_type, diff_text]);
                    if (diff_text == bigpatch.diffs[0][1]) {
                        bigpatch.diffs.shift();
                    } else {
                        bigpatch.diffs[0][1] =
                            bigpatch.diffs[0][1].substring(diff_text.length);
                    }
                }
            }
            // Compute the head context for the next patch.
            precontext = this.diff_text2(patch.diffs);
            precontext =
                precontext.substring(precontext.length - this.Patch_Margin);
            // Append the end context for this patch.
            var postcontext = this.diff_text1(bigpatch.diffs)
                .substring(0, this.Patch_Margin);
            if (postcontext !== '') {
                patch.length1 += postcontext.length;
                patch.length2 += postcontext.length;
                if (patch.diffs.length !== 0 &&
                    patch.diffs[patch.diffs.length - 1][0] === DIFF_EQUAL) {
                    patch.diffs[patch.diffs.length - 1][1] += postcontext;
                } else {
                    patch.diffs.push([DIFF_EQUAL, postcontext]);
                }
            }
            if (!empty) {
                patches.splice(++x, 0, patch);
            }
        }
    }
};


/**
 * Take a list of patches and return a textual representation.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 * @return {string} Text representation of patches.
 */
diff_match_patch.prototype.patch_toText = function(patches) {
    var text = [];
    for (var x = 0; x < patches.length; x++) {
        text[x] = patches[x];
    }
    return text.join('');
};


/**
 * Parse a textual representation of patches and return a list of Patch objects.
 * @param {string} textline Text representation of patches.
 * @return {!Array.<!diff_match_patch.patch_obj>} Array of Patch objects.
 * @throws {!Error} If invalid input.
 */
diff_match_patch.prototype.patch_fromText = function(textline) {
    var patches = [];
    if (!textline) {
        return patches;
    }
    var text = textline.split('\n');
    var textPointer = 0;
    var patchHeader = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/;
    while (textPointer < text.length) {
        var m = text[textPointer].match(patchHeader);
        if (!m) {
            throw new Error('Invalid patch string: ' + text[textPointer]);
        }
        var patch = new diff_match_patch.patch_obj();
        patches.push(patch);
        patch.start1 = parseInt(m[1], 10);
        if (m[2] === '') {
            patch.start1--;
            patch.length1 = 1;
        } else if (m[2] == '0') {
            patch.length1 = 0;
        } else {
            patch.start1--;
            patch.length1 = parseInt(m[2], 10);
        }

        patch.start2 = parseInt(m[3], 10);
        if (m[4] === '') {
            patch.start2--;
            patch.length2 = 1;
        } else if (m[4] == '0') {
            patch.length2 = 0;
        } else {
            patch.start2--;
            patch.length2 = parseInt(m[4], 10);
        }
        textPointer++;

        while (textPointer < text.length) {
            var sign = text[textPointer].charAt(0);
            try {
                var line = decodeURI(text[textPointer].substring(1));
            } catch (ex) {
                // Malformed URI sequence.
                throw new Error('Illegal escape in patch_fromText: ' + line);
            }
            if (sign == '-') {
                // Deletion.
                patch.diffs.push([DIFF_DELETE, line]);
            } else if (sign == '+') {
                // Insertion.
                patch.diffs.push([DIFF_INSERT, line]);
            } else if (sign == ' ') {
                // Minor equality.
                patch.diffs.push([DIFF_EQUAL, line]);
            } else if (sign == '@') {
                // Start of next patch.
                break;
            } else if (sign === '') {
                // Blank line?  Whatever.
            } else {
                // WTF?
                throw new Error('Invalid patch mode "' + sign + '" in: ' + line);
            }
            textPointer++;
        }
    }
    return patches;
};


/**
 * Class representing one patch operation.
 * @constructor
 */
diff_match_patch.patch_obj = function() {
    /** @type {!Array.<!diff_match_patch.Diff>} */
    this.diffs = [];
    /** @type {?number} */
    this.start1 = null;
    /** @type {?number} */
    this.start2 = null;
    /** @type {number} */
    this.length1 = 0;
    /** @type {number} */
    this.length2 = 0;
};


/**
 * Emmulate GNU diff's format.
 * Header: @@ -382,8 +481,9 @@
 * Indicies are printed as 1-based, not 0-based.
 * @return {string} The GNU diff string.
 */
diff_match_patch.patch_obj.prototype.toString = function() {
    var coords1, coords2;
    if (this.length1 === 0) {
        coords1 = this.start1 + ',0';
    } else if (this.length1 == 1) {
        coords1 = this.start1 + 1;
    } else {
        coords1 = (this.start1 + 1) + ',' + this.length1;
    }
    if (this.length2 === 0) {
        coords2 = this.start2 + ',0';
    } else if (this.length2 == 1) {
        coords2 = this.start2 + 1;
    } else {
        coords2 = (this.start2 + 1) + ',' + this.length2;
    }
    var text = ['@@ -' + coords1 + ' +' + coords2 + ' @@\n'];
    var op;
    // Escape the body of the patch with %xx notation.
    for (var x = 0; x < this.diffs.length; x++) {
        switch (this.diffs[x][0]) {
            case DIFF_INSERT:
                op = '+';
                break;
            case DIFF_DELETE:
                op = '-';
                break;
            case DIFF_EQUAL:
                op = ' ';
                break;
        }
        text[x + 1] = op + encodeURI(this.diffs[x][1]) + '\n';
    }
    return text.join('').replace(/%20/g, ' ');
};


// Export these global variables so that they survive Google's JS compiler.
// In a browser, 'this' will be 'window'.
// Users of node.js should 'require' the uncompressed version since Google's
// JS compiler may break the following exports for non-browser environments.
this['diff_match_patch'] = diff_match_patch;
this['DIFF_DELETE'] = DIFF_DELETE;
this['DIFF_INSERT'] = DIFF_INSERT;
this['DIFF_EQUAL'] = DIFF_EQUAL;

// Copyright (c) 2008, 2009 Andrew Cantino
// Copyright (c) 2008, 2009 Kyle Maxwell

/**
 * Patched to exclude jquery usages.
 * Patched to change className to classList to support svg elements.
 * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/386
 */

function DomPredictionHelper() {
};
DomPredictionHelper.prototype = new Object();

DomPredictionHelper.prototype.recursiveNodes = function (e) {
    var n;
    if (e.nodeName && e.parentNode && e != document.body) {
        n = this.recursiveNodes(e.parentNode);
    } else {
        n = new Array();
    }
    n.push(e);
    return n;
};

DomPredictionHelper.prototype.escapeCssNames = function (name) {
    if (name) {
        try {
            return name.replace(/\s*sg_\w+\s*/g, '').replace(/\\/g, '\\\\').
                replace(/\./g, '\\.').replace(/#/g, '\\#').replace(/\>/g, '\\>').replace(/\,/g, '\\,').replace(/\:/g, '\\:');
        } catch (e) {
            console.log('---');
            console.log("exception in escapeCssNames");
            console.log(name);
            console.log('---');
            return '';
        }
    } else {
        return '';
    }
};

DomPredictionHelper.prototype.childElemNumber = function (elem) {
    var count = 0;
    while (elem.previousSibling && (elem = elem.previousSibling)) {
        if (elem.nodeType == 1) count++;
    }
    return count;
};

DomPredictionHelper.prototype.pathOf = function (elem) {
    var nodes = this.recursiveNodes(elem);
    var self = this;
    var path = "";
    for (var i = 0; i < nodes.length; i++) {
        var e = nodes[i];
        if (e) {
            path += e.nodeName.toLowerCase();
            var escaped = e.id && CSS.escape(String(e.id));
            if (escaped && escaped.length > 0) path += '#' + escaped;

            if (e.classList) {
                for (var j = 0; j < e.classList.length; j++) {
                    escaped = CSS.escape(e.classList[j]);
                    if (e.classList[j] && escaped.length > 0) {
                        path += '.' + escaped;
                    }
                }
            }

            path += ':nth-child(' + (self.childElemNumber(e) + 1) + ')';
            path += ' ';
        }
    }
    if (path.charAt(path.length - 1) == ' ') path = path.substring(0, path.length - 1);
    return path;
};

DomPredictionHelper.prototype.commonCss = function (array) {
    try {
        var dmp = new diff_match_patch();
    } catch (e) {
        throw "Please include the diff_match_patch library.";
    }

    if (typeof array == 'undefined' || array.length == 0) return '';

    var existing_tokens = {};
    var encoded_css_array = this.encodeCssForDiff(array, existing_tokens);

    var collective_common = encoded_css_array.pop();

    encoded_css_array.forEach(function(el) {
        var diff = dmp.diff_main(collective_common, el);
        collective_common = '';

        diff.forEach(function(d) {
            if (d[0] == 0) {
                collective_common += d[1];
            }
        });
    });

    return this.decodeCss(collective_common, existing_tokens);
};

DomPredictionHelper.prototype.tokenizeCss = function (css_string) {
    var skip = false;
    var word = '';
    var tokens = [];

    var css_string = css_string.replace(/,/, ' , ').replace(/\s+/g, ' ');
    var length = css_string.length;
    var c = '';

    for (var i = 0; i < length; i++) {
        c = css_string[i];

        if (skip) {
            skip = false;
        } else if (c == '\\') {
            skip = true;
        } else if (c == '.' || c == ' ' || c == '#' || c == '>' || c == ':' || c == ',') {
            if (word.length > 0) tokens.push(word);
            word = '';
        }
        word += c;
        if (c == ' ' || c == ',') {
            tokens.push(word);
            word = '';
        }
    }
    if (word.length > 0) tokens.push(word);
    return tokens;
};

DomPredictionHelper.prototype.decodeCss = function (string, existing_tokens) {
    var inverted = this.invertObject(existing_tokens);
    var out = '';
    var split = string.split('');
    for (var i = 0; i < split.length; i++) {
        out += inverted[split[i]];
    }

    return this.cleanCss(out);
};

// Encode css paths for diff using unicode codepoints to allow for a large number of tokens.
DomPredictionHelper.prototype.encodeCssForDiff = function (strings, existing_tokens) {
    var codepoint = 50;
    var self = this;
    var strings_out = [];
    for (var i = 0; i < strings.length; i++) {
        var out = new String();

        var tokenizeCss = self.tokenizeCss(strings[i]);
        for (var j = 0; j < tokenizeCss.length; j++) {
            var s = tokenizeCss[j];

            if (!existing_tokens[s]) {
                existing_tokens[s] = String.fromCharCode(codepoint++);
            }

            out += existing_tokens[s];
        }

        strings_out.push(out);
    }

    return strings_out;
};

DomPredictionHelper.prototype.simplifyCss = function (css, selected_paths, rejected_paths) {
    var self = this;
    var parts = self.tokenizeCss(css);
    var best_so_far = "";
    if (self.selectorGets('all', selected_paths, css) && self.selectorGets('none', rejected_paths, css)) best_so_far = css;
    for (var pass = 0; pass < 4; pass++) {
        for (var part = 0; part < parts.length; part++) {
            var first = parts[part].substring(0, 1);
            if (self.wouldLeaveFreeFloatingNthChild(parts, part)) continue;
            if ((pass == 0 && first == ':') || // :nth-child
                (pass == 1 && first != ':' && first != '.' && first != '#' && first != ' ') || // elem, etc.
                (pass == 2 && first == '.') || // classes
                (pass == 3 && first == '#')) // ids
            {
                var tmp = parts[part];
                parts[part] = '';
                var selector = self.cleanCss(parts.join(''));
                if (selector == '') {
                    parts[part] = tmp;
                    continue;
                }
                if (self.selectorGets('all', selected_paths, selector) && self.selectorGets('none', rejected_paths, selector)) {
                    best_so_far = selector;
                } else {
                    parts[part] = tmp;
                }
            }
        }
    }
    return self.cleanCss(best_so_far);
};

DomPredictionHelper.prototype.wouldLeaveFreeFloatingNthChild = function (parts, part) {
    return (((part - 1 >= 0 && parts[part - 1].substring(0, 1) == ':') &&
    (part - 2 < 0 || parts[part - 2] == ' ') &&
    (part + 1 >= parts.length || parts[part + 1] == ' ')) ||
    ((part + 1 < parts.length && parts[part + 1].substring(0, 1) == ':') &&
    (part + 2 >= parts.length || parts[part + 2] == ' ') &&
    (part - 1 < 0 || parts[part - 1] == ' ')));
};

DomPredictionHelper.prototype.cleanCss = function (css) {
    return css.replace(/\>/, ' > ').replace(/,/, ' , ').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '').replace(/,$/, '');
};

DomPredictionHelper.prototype.getPathsFor = function (arr) {
    var self = this;
    var out = [];

    for (var i = 0; i < arr.length; i++) {
        var s = arr[i];

        if (s && s.nodeName) {
            out.push(self.pathOf(s));
        }
    }

    return out;
};

DomPredictionHelper.prototype.predictCss = function (s, r) {
    var self = this;

    if (s.length == 0) return '';
    var selected_paths = self.getPathsFor(s);
    var rejected_paths = self.getPathsFor(r);

    var css = self.commonCss(selected_paths);
    var simplest = self.simplifyCss(css, selected_paths, rejected_paths);

    // Do we get off easy?
    if (simplest.length > 0) return simplest;

    // Okay, then make a union and possibly try to reduce subsets.
    var union = '';
    for (var i = 0; i < s.length; i++) {
        union = self.pathOf(s[i]) + ", " + union;
    }

    union = self.cleanCss(union);

    return self.simplifyCss(union, selected_paths, rejected_paths);
};

DomPredictionHelper.prototype.fragmentSelector = function (selector) {
    var self = this;
    var out = [];
    var split = selector.split(/\,/);

    for (var i = 0; i < split.length; i++) {
        var out2 = [];
        var splitInner = self.cleanCss(split[i]).split(/\s+/);

        for (var j = 0; j < splitInner.length; j++) {
            out2.push(self.tokenizeCss(splitInner[j]));
        }

        out.push(out2);
    }

    return out;
};

// Everything in the first selector must be present in the second.
DomPredictionHelper.prototype.selectorBlockMatchesSelectorBlock = function (selector_block1, selector_block2) {
    for (var j = 0; j < selector_block1.length; j++) {
        if (selector_block2.indexOf(selector_block1[j]) == -1) {
            return false;
        }
    }
    return true;
};

// Assumes list is an array of complete CSS selectors represented as strings.
DomPredictionHelper.prototype.selectorGets = function (type, list, the_selector) {
    var self = this;
    var result = true;

    if (list.length == 0 && type == 'all') return false;
    if (list.length == 0 && type == 'none') return true;

    var selectors = self.fragmentSelector(the_selector);

    var cleaned_list = [];
    for (var i = 0; i < list.length; i++) {
        cleaned_list.push(self.fragmentSelector(list[i])[0]);
    }

    for (var i = 0; i < selectors.length; i++) {
        if (!result) return;
        var selector = selectors[i];

        for (var j = 0; j < cleaned_list.length; i++) {
            if (!result || cleaned_list[j] == '') return;

            if (self._selectorGets(cleaned_list[j], selector)) {
                if (type == 'none') result = false;
                cleaned_list[j] = '';
            }
        }
    }

    if (type == 'all' && cleaned_list.join('').length > 0) { // Some candidates didn't get matched.
        result = false;
    }

    return result;
};

DomPredictionHelper.prototype._selectorGets = function (candidate_as_blocks, selector_as_blocks) {
    var cannot_match = false;
    var position = candidate_as_blocks.length - 1;
    for (var i = selector_as_blocks.length - 1; i > -1; i--) {
        if (cannot_match) break;
        if (i == selector_as_blocks.length - 1) { // First element on right.
            // If we don't match the first element, we cannot match.
            if (!this.selectorBlockMatchesSelectorBlock(selector_as_blocks[i], candidate_as_blocks[position])) cannot_match = true;
            position--;
        } else {
            var found = false;
            while (position > -1 && !found) {
                found = this.selectorBlockMatchesSelectorBlock(selector_as_blocks[i], candidate_as_blocks[position]);
                position--;
            }
            if (!found) cannot_match = true;
        }
    }
    return !cannot_match;
};

DomPredictionHelper.prototype.invertObject = function (object) {
    var new_object = {};

    for(var key in object) {
        var value = object[key];
        new_object[value] = key;
    }

    return new_object;
};

DomPredictionHelper.prototype.cssToXPath = function (css_string) {
    var tokens = this.tokenizeCss(css_string);
    if (tokens[0] && tokens[0] == ' ') tokens.splice(0, 1);
    if (tokens[tokens.length - 1] && tokens[tokens.length - 1] == ' ') tokens.splice(tokens.length - 1, 1);

    var css_block = [];
    var out = "";

    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i] == ' ') {
            out += this.cssToXPathBlockHelper(css_block);
            css_block = [];
        } else {
            css_block.push(tokens[i]);
        }
    }

    return out + this.cssToXPathBlockHelper(css_block);
};

// Process a block (html entity, class(es), id, :nth-child()) of css
DomPredictionHelper.prototype.cssToXPathBlockHelper = function (css_block) {
    if (css_block.length == 0) return '//';
    var out = '//';
    var first = css_block[0].substring(0, 1);

    if (first == ',') return " | ";

    if (first == ':' || first == '#' || first == '.') {
        out += '*';
    }

    var expressions = [];
    var re = null;

    for (var i = 0; i < css_block.length; i++) {
        var current = css_block[i];
        first = current.substring(0, 1);
        var rest = current.substring(1);

        if (first == ':') {
            // We only support :nth-child(n) at the moment.
            if (re = rest.match(/^nth-child\((\d+)\)$/))
                expressions.push('(((count(preceding-sibling::*) + 1) = ' + re[1] + ') and parent::*)');
        } else if (first == '.') {
            expressions.push('contains(concat( " ", @class, " " ), concat( " ", "' + rest + '", " " ))');
        } else if (first == '#') {
            expressions.push('(@id = "' + rest + '")');
        } else if (first == ',') {
        } else {
            out += current;
        }
    }

    if (expressions.length > 0) out += '[';
    for (var i = 0; i < expressions.length; i++) {
        out += expressions[i];
        if (i < expressions.length - 1) out += ' and ';
    }
    if (expressions.length > 0) out += ']';
    return out;
};

/**
 * Balalaika library
 *
 * https://github.com/finom/balalaika/blob/master/balalaika.js
 */
var balalaika = (function (window, document, fn, nsRegAndEvents, id, s_EventListener, s_MatchesSelector, i, j, k, l, $) {
    $ = function (s, context) {
        return new $.i(s, context);
    };

    $.i = function (s, context) {
        fn.push.apply(this, !s ? fn : s.nodeType || s == window ? [s] : "" + s === s ? /</.test(s)
            ? ( ( i = document.createElement(context || 'q') ).innerHTML = s, i.children ) : (context && $(context)[0] || document).querySelectorAll(s) : /f/.test(typeof s) ? /c/.test(document.readyState) ? s() : $(document).on('DOMContentLoaded', s) : s);
    };

    $.i[l = 'prototype'] = ( $.extend = function (obj) {
        k = arguments;
        for (i = 1; i < k.length; i++) {
            if (l = k[i]) {
                for (j in l) {
                    obj[j] = l[j];
                }
            }
        }

        return obj;
    })($.fn = $[l] = fn, { // $.fn = $.prototype = fn
        on: function (n, f) {
            // n = [ eventName, nameSpace ]
            n = n.split(nsRegAndEvents);
            this.map(function (item) {
                // item.b$ is balalaika_id for an element
                // i is eventName + id ("click75")
                // nsRegAndEvents[ i ] is array of events (eg all click events for element#75) ([[namespace, handler], [namespace, handler]])
                ( nsRegAndEvents[i = n[0] + ( item.b$ = item.b$ || ++id )] = nsRegAndEvents[i] || [] ).push([f, n[1]]);
                // item.addEventListener( eventName, f )
                item['add' + s_EventListener](n[0], f);
            });
            return this;
        },
        off: function (n, f) {
            // n = [ eventName, nameSpace ]
            n = n.split(nsRegAndEvents);
            // l = 'removeEventListener'
            l = 'remove' + s_EventListener;
            this.map(function (item) {
                // k - array of events
                // item.b$ - balalaika_id for an element
                // n[ 0 ] + item.b$ - eventName + id ("click75")
                k = nsRegAndEvents[n[0] + item.b$];
                // if array of events exist then i = length of array of events
                if (i = k && k.length) {
                    // while j = one of array of events
                    while (j = k[--i]) {
                        // if( no f and no namespace || f but no namespace || no f but namespace || f and namespace )
                        if (( !f || f == j[0] ) && ( !n[1] || n[1] == j[1] )) {
                            // item.removeEventListener( eventName, handler );
                            item[l](n[0], j[0]);
                            // remove event from array of events
                            k.splice(i, 1);
                        }
                    }
                } else {
                    // if event added before using addEventListener, just remove it using item.removeEventListener( eventName, f )
                    !n[1] && item[l](n[0], f);
                }
            });
            return this;
        },
        is: function (s) {
            i = this[0];
            return (i.matches
            || i['webkit' + s_MatchesSelector]
            || i['moz' + s_MatchesSelector]
            || i['ms' + s_MatchesSelector]
            || i['o' + s_MatchesSelector]).call(i, s);
        }
    });
    return $;
})(window, document, [], /\.(.+)/, 0, 'EventListener', 'MatchesSelector');

/**
 * Add some more functions to balalaika
 */
balalaika.fn.hasClass = function (className) {
    return !!this[0] && (this[0].classList != undefined) && this[0].classList.contains(className);
};

balalaika.fn.addClass = function (className) {
    this.forEach(function (item) {
        var classList = item.classList;
        classList.add.apply(classList, className.split(/\s/));
    });
    return this;
};

balalaika.fn.removeClass = function (className) {
    this.forEach(function (item) {
        var classList = item.classList;
        classList.remove.apply(classList, className.split(/\s/));
    });
    return this;
};

balalaika.fn.get = function (index) {
    return this.length > index ? this[index] : null;
};

balalaika.fn.css = function (attr, value) {
    this.forEach(function (item) {
        item.style[attr] = value;
    });
    return this;
};

balalaika.fn.hide = function () {
    this.forEach(function (item) {
        item.style['display'] = 'none';
    });
    return this;
};

balalaika.fn.show = function () {
    this.forEach(function (item) {
        item.style['display'] = 'block';
    });
    return this;
};

balalaika.fn.remove = function () {
    this.forEach(function (item) {
        item.parentNode.removeChild(item);
    });
    return this;
};

balalaika.fn.text = function (v) {
    this.forEach(function (item) {
        item.textContent = v;
    });
    return this;
};

balalaika.fn.attr = function (k, v) {
    this.forEach(function (item) {
        item.setAttribute(k, v);
    });
    return this;
};

balalaika.fn.removeAttr = function (k) {
    this.forEach(function (item) {
        item.removeAttribute(k);
    });
    return this;
};

balalaika.fn.trigger = function (eventName, options) {
    this.forEach(function (item) {
        if (window.CustomEvent) {
            var event = new CustomEvent(eventName, {detail: options});
        } else {
            var event = document.createEvent('CustomEvent');
            event.initCustomEvent(eventName, true, true, options);
        }

        item.dispatchEvent(event);
    });
    return this;
};

var I18nHelper = { // jshint ignore:line

    translateElement: function (element, message) {

        try {
            while (element.lastChild) {
                element.removeChild(element.lastChild);
            }

            this.processString(message, element);
        } catch (ex) {
            // Ignore exceptions
        }
    },

    processString: function (str, element) {

        var el;

        var match1 = /^([^]*?)<(a|strong|span|i)([^>]*)>(.*?)<\/\2>([^]*)$/m.exec(str);
        var match2 = /^([^]*?)<(br|input)([^>]*)\/?>([^]*)$/m.exec(str);
        if (match1) {

            this.processString(match1[1], element);

            el = this.createElement(match1[2], match1[3]);

            this.processString(match1[4], el);
            element.appendChild(el);

            this.processString(match1[5], element);

        } else if (match2) {

            this.processString(match2[1], element);

            el = this.createElement(match2[2], match2[3]);
            element.appendChild(el);

            this.processString(match2[4], element);

        } else {
            element.appendChild(document.createTextNode(str.replace(/&nbsp;/g, '\u00A0')));
        }
    },

    createElement: function (tagName, attributes) {

        var el = document.createElement(tagName);
        if (!attributes) {
            return el;
        }

        var attrs = attributes.split(/([a-z]+='[^']+')/);
        for (var i = 0; i < attrs.length; i++) {
            var attr = attrs[i].trim();
            if (!attr) {
                continue;
            }
            var index = attr.indexOf("=");
            var attrName;
            var attrValue;
            if (index > 0) {
                attrName = attr.substring(0, index);
                attrValue = attr.substring(index + 2, attr.length - 1);
            }
            if (attrName && attrValue) {
                el.setAttribute(attrName, attrValue);
            }
        }

        return el;
    }
};

/* global balalaika, DomPredictionHelper */

/**
 * Adguard selector library
 */
var AdguardSelectorLib = (function ($) { // jshint ignore:line

   // PRIVATE FIELDS

    var PLACEHOLDER_PREFIX = 'adguard-placeholder';
    var placeholdedElements = null;

    var restrictedElements = null;
    var predictionHelper = null;

    var SUGGESTED_CLASS = "sg_suggested";
    var SELECTED_CLASS = "sg_selected";
    var REJECTED_CLASS = "sg_rejected";
    var IGNORED_CLASS = "sg_ignore";

    var selectedElements = [];
    var rejectedElements = [];

    var selectMode = 'exact';
    var unbound = true;
    var onElementSelectedHandler = null;

    var isTouchEventsSupported = (navigator.platform === 'iPad' || navigator.platform === 'iPhone' || navigator.platform === 'Android');

    var ignoreTouchEvent = 0;

    var selectionRenderer;


    // PRIVATE METHODS

    var removeClassName = function (className) {
        $('.' + className).removeClass(className);
    };

    var suggestPredicted = function (prediction) {
        if (prediction) {
            $(prediction).each(function () {
                if (!$(this).hasClass(SELECTED_CLASS)
                    && !$(this).hasClass(IGNORED_CLASS)
                    && !$(this).hasClass(REJECTED_CLASS)) {
                    $(this).addClass(SUGGESTED_CLASS);
                }
            });
        }
    };

    var makePredictionPath = function (elem) {
        var w_elem = $(elem);

        if (w_elem.hasClass(SELECTED_CLASS)) {
            w_elem.removeClass(SELECTED_CLASS);
            selectedElements.splice($.inArray(elem, selectedElements), 1);
        } else if (w_elem.hasClass(REJECTED_CLASS)) {
            w_elem.removeClass(REJECTED_CLASS);
            rejectedElements.splice($.inArray(elem, rejectedElements), 1);
        } else if (w_elem.hasClass(SUGGESTED_CLASS)) {
            w_elem.addClass(REJECTED_CLASS);
            rejectedElements.push(elem);
        } else {
            if (selectMode == 'exact' && selectedElements.length > 0) {
                removeClassName(SELECTED_CLASS);
                selectedElements = [];
            }
            //w_elem.addClass('sg_selected');
            selectedElements.push(elem);
        }

        var prediction = predictionHelper.predictCss(selectedElements,
            rejectedElements.concat(restrictedElements));

        if (selectMode == 'similar') {
            removeClassName(SUGGESTED_CLASS);
            suggestPredicted(prediction);
        }

        return prediction;
    };

    var firstSelectedOrSuggestedParent = function (element) {
        if ($(element).hasClass(SUGGESTED_CLASS) || $(element).hasClass(SELECTED_CLASS)) {
            return element;
        }

        while (element.parentNode && (element = element.parentNode)) {
            if (restrictedElements.indexOf(element) == -1) {
                if ($(element).hasClass(SUGGESTED_CLASS) || $(element).hasClass(SELECTED_CLASS)) {
                    return element;
                }
            }
        }

        return null;
    };

    var px = function (p) {
        return p + 'px';
    };

    var getTagPath = function (element) {
        if (element.parentNode) {
            return element.parentNode.tagName.toLowerCase() + ' ' + element.tagName.toLowerCase();
        } else {
            return element.tagName.toLowerCase();
        }
    };

    var clearSelected = function () {
        selectedElements = [];
        rejectedElements = [];

        removeClassName(SELECTED_CLASS);
        removeClassName(REJECTED_CLASS);

        selectionRenderer.remove();
        removeClassName(SUGGESTED_CLASS);
    };

    /**
     * Returns element offset coordinates extended with width and height values.
     *
     * @param elem
     * @returns {{top: number, left: number, outerWidth: number, outerHeight: number}}
     */
    var getOffsetExtended = function (elem) {
        var bodyRect = document.body.getBoundingClientRect();
        var elemRect = elem.getBoundingClientRect();

        var rectTop = elemRect.top - bodyRect.top;
        var rectLeft = elemRect.left - bodyRect.left;

        return {
            top: rectTop,
            left: rectLeft,
            outerWidth: elem.offsetWidth,
            outerHeight: elem.offsetHeight
        };
    };

    /**
     * Adds borders to selected element.
     *
     * Default implementation of selection renderer.
     * Can be overwritten with custom implementation as a parameter of init function.
     *
     * @param element
     * @private
     */
    var BorderSelectionRenderer = (function (api) {
        var BORDER_WIDTH = 5;
        var BORDER_PADDING = 2;
        var BORDER_CLASS = "sg_border";

        var borderTop = null;
        var borderLeft = null;
        var borderRight = null;
        var borderBottom = null;

        var showBorders = function () {
            if (borderTop && borderBottom && borderLeft && borderRight) {
                borderTop.show();
                borderBottom.show();
                borderLeft.show();
                borderRight.show();
            }
        };

        var addBorderToDom = function () {
            document.body.appendChild(borderTop.get(0));
            document.body.appendChild(borderBottom.get(0));
            document.body.appendChild(borderLeft.get(0));
            document.body.appendChild(borderRight.get(0));
        };

        var removeBorderFromDom = function () {
            if (borderTop && borderTop.get(0)) {
                var parent = borderTop.get(0).parentNode;

                if (parent) {
                    parent.removeChild(borderTop.get(0));
                    parent.removeChild(borderBottom.get(0));
                    parent.removeChild(borderLeft.get(0));
                    parent.removeChild(borderRight.get(0));
                }
            }

            borderTop = borderBottom = borderRight = borderLeft = null;
        };

        /**
         * Preparing renderer.
         */
        api.init = function () {
            if (!borderTop) {
                var width = px(BORDER_WIDTH);

                borderTop = $('<div/>').addClass(BORDER_CLASS).css('height', width).hide()
                    .on("click", sgMousedownHandler);
                borderBottom = $('<div/>').addClass(BORDER_CLASS).addClass('sg_bottom_border')
                    .css('height', px(BORDER_WIDTH + 6)).hide()
                    .on("click", sgMousedownHandler);
                borderLeft = $('<div/>').addClass(BORDER_CLASS).css('width', width).hide()
                    .on("click", sgMousedownHandler);
                borderRight = $('<div/>').addClass(BORDER_CLASS).css('width', width).hide()
                    .on("click", sgMousedownHandler);

                addBorderToDom();
            }
        };

        /**
         * Clearing DOM and so on.
         */
        api.finalize = function () {
            removeBorderFromDom();
        };

        /**
         * Adds borders to specified element
         *
         * @param element
         */
        api.add = function (element) {
            api.remove();

            if (!element) {
                return;
            }

            var p = getOffsetExtended(element);

            var top = p.top;
            var left = p.left;
            var width = p.outerWidth;
            var height = p.outerHeight;

            borderTop.css('width', px(width + BORDER_PADDING * 2 + BORDER_WIDTH * 2)).
                css('top', px(top - BORDER_WIDTH - BORDER_PADDING)).
                css('left', px(left - BORDER_PADDING - BORDER_WIDTH));
            borderBottom.css('width', px(width + BORDER_PADDING * 2 + BORDER_WIDTH)).
                css('top', px(top + height + BORDER_PADDING)).
                css('left', px(left - BORDER_PADDING - BORDER_WIDTH));
            borderLeft.css('height', px(height + BORDER_PADDING * 2)).
                css('top', px(top - BORDER_PADDING)).
                css('left', px(left - BORDER_PADDING - BORDER_WIDTH));
            borderRight.css('height', px(height + BORDER_PADDING * 2)).
                css('top', px(top - BORDER_PADDING)).
                css('left', px(left + width + BORDER_PADDING));

            borderBottom.get(0).textContent = getTagPath(element);
            borderRight.get(0).target_elem = borderLeft.get(0).target_elem = borderTop.get(0).target_elem = borderBottom.get(0).target_elem = element;

            showBorders();
        };

        /**
         * Removes borders
         */
        api.remove = function () {
            if (borderTop && borderBottom && borderLeft && borderRight) {
                borderTop.hide();
                borderBottom.hide();
                borderLeft.hide();
                borderRight.hide();
            }
        };

        /**
         * Border class
         *
         * @type {string}
         */
        api.BORDER_CLASS = BORDER_CLASS;

        return api;
    })(BorderSelectionRenderer || {});

    var linkHelper = document.createElement('a');
    var getHost = function (url) {
        if (!url) {
            return "";
        }

        linkHelper.href = url;
        return linkHelper.hostname;
    };

    var makePlaceholderImage = function (element) {
        var placeHolder = document.createElement('div');
        var style = window.getComputedStyle(element);
        placeHolder.style.height = style.height;
        placeHolder.style.width = style.width;
        placeHolder.style.position = style.position;
        placeHolder.style.top = style.top;
        placeHolder.style.bottom = style.bottom;
        placeHolder.style.left = style.left;
        placeHolder.style.right = style.right;
        placeHolder.className += PLACEHOLDER_PREFIX + " " + IGNORED_CLASS;

        var icon = document.createElement('div');
        icon.className += PLACEHOLDER_PREFIX + "-icon " + IGNORED_CLASS;

        var domain = document.createElement('div');
        domain.textContent = getHost(element.src);
        domain.className += PLACEHOLDER_PREFIX + "-domain " + IGNORED_CLASS;

        icon.appendChild(domain);
        placeHolder.appendChild(icon);

        return placeHolder;
    };

    var removePlaceholders = function () {
        if (!placeholdedElements) {
            return;
        }
        var elements = placeholdedElements;
        for (var i = 0; i < elements.length; i++) {
            var current = elements[i];
            var id = PLACEHOLDER_PREFIX + i;

            var placeHolder = $('#' + id).get(0);
            if (placeHolder) {
                var parent = placeHolder.parentNode;
                if (parent) {
                    parent.replaceChild(current, placeHolder);
                }
            }
        }

        placeholdedElements = null;
    };

    var placeholderClick = function (element) {
        selectionRenderer.remove();
        removePlaceholders();

        onElementSelectedHandler(element);
    };

    var makeIFrameAndEmbeddedSelector = function () {
        placeholdedElements = $('iframe:not(.' + IGNORED_CLASS + '),embed,object').filter(function (elem) {
            var isVisible = elem.style["display"] != "none";
            var isHaveSize = elem.offsetWidth != 0 && elem.offsetHeight != 0;
            return isVisible && isHaveSize;
        });

        var elements = placeholdedElements;
        for (var i = 0; i < elements.length; i++) {
            var current = elements[i];
            (function (current) {
                var placeHolder = makePlaceholderImage(current);
                var id = PLACEHOLDER_PREFIX + i;

                placeHolder.setAttribute("id", id);

                var parent = current.parentNode;
                if (parent) {
                    parent.replaceChild(placeHolder, current);
                    if (isTouchEventsSupported) {
                        $(placeHolder).on("gestureend", gestureEndHandler);
                        $(placeHolder).on("touchmove", touchMoveHandler);
                        $(placeHolder).on("touchend", function (e) {
                            e.preventDefault();

                            if (needIgnoreTouchEvent()) {
                                return true;
                            }

                            placeholderClick(current);
                        });
                    } else {
                        $('#' + id).on('click', function (e) {
                            e.preventDefault();

                            placeholderClick(current);
                        });
                    }

                }

            })(current);
        }
    };

    /********** Events ***************/
    var sgMouseoverHandler = function (e) {
        e.stopPropagation();

        if (unbound) {
            return true;
        }

        if (this == document.body || this == document.body.parentNode) {
            return false;
        }

        var parent = firstSelectedOrSuggestedParent(this);
        if (parent != null && parent != this) {
            selectionRenderer.add(parent);
        } else {
            selectionRenderer.add(this);
        }

        return false;
    };

    var sgMouseoutHandler = function () {
        if (unbound) {
            return true;
        }

        if (this == document.body || this == document.body.parentNode) {
            return false;
        }

        selectionRenderer.remove();
        return false;
    };

    var sgMousedownHandler = function (e) {
        if ($(e.target).hasClass(IGNORED_CLASS)) return false;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (unbound) {
            return true;
        }

        var elem = e.target;
        if ($(elem).hasClass(selectionRenderer.BORDER_CLASS)) {
            //Clicked on one of our floating borders, target the element that we are bordering.
            elem = elem.target_elem || elem;
        }

        if (elem == document.body || elem == document.body.parentNode) {
            return;
        }

        makePredictionPath(elem);

        selectionRenderer.remove();

        onElementSelectedHandler(elem);

        return false;
    };

    /********** Touch event handlers ***************/
    var touchElementSelectHandler = function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        sgMouseoverHandler.call(this, e);
        sgMousedownHandler.call(this, e);
    };

    var needIgnoreTouchEvent = function () {

        if (ignoreTouchEvent > 0) {

            ignoreTouchEvent--;
            return true;
        }

        return false;
    };

    var elementTouchendHandler = function (e) {

        if ($(e.target).hasClass(IGNORED_CLASS)) return false;

        e.stopPropagation();

        if (needIgnoreTouchEvent()) {
            return true;
        }

        touchElementSelectHandler.call(this, e);
        return false;
    };

    var emptyEventHandler = function (e) {
        e.stopPropagation();

        return false;
    };

    var gestureEndHandler = function () {
        ignoreTouchEvent = 2;
        return true;
    };

    var touchMoveHandler = function () {
        ignoreTouchEvent = 1;
        return true;
    };


    var setupEventHandlers = function () {
        makeIFrameAndEmbeddedSelector();
        var elements = $("body *:not(." + IGNORED_CLASS + ")");

        if (isTouchEventsSupported) {
            elements.forEach(function (el) {
                el.addEventListener("gestureend", gestureEndHandler);
                el.addEventListener("touchmove", touchMoveHandler);
                el.addEventListener("touchend", elementTouchendHandler, true);
                el.addEventListener("touchstart", emptyEventHandler);
            });
        } else {
            elements.forEach(function (el) {
                el.addEventListener("mouseover", sgMouseoverHandler);
                el.addEventListener("mouseout", sgMouseoutHandler);
                el.addEventListener("click", sgMousedownHandler, true);
            });
        }

    };

    var deleteEventHandlers = function () {
        removePlaceholders();

        var elements = $("body *");
        if (isTouchEventsSupported) {
            elements.forEach(function (el) {
                el.removeEventListener("gestureend", gestureEndHandler);
                el.removeEventListener("touchmove", touchMoveHandler);
                el.removeEventListener("touchend", elementTouchendHandler, true);
                el.removeEventListener("touchstart", emptyEventHandler);
            });
        } else {
            elements.forEach(function (el) {
                el.removeEventListener("mouseover", sgMouseoverHandler);
                el.removeEventListener("mouseout", sgMouseoutHandler);
                el.removeEventListener("click", sgMousedownHandler, true);
            });
        }
    };

    //Define default implementation of selection renderer.
    selectionRenderer = BorderSelectionRenderer;

    // PUBLIC API
    var api = {};

    /**
     * Starts selector module.
     *
     * @param onElementSelected callback function
     * @param selectionRenderImpl optional object contains selection presentation implementation
     */
    api.init = function (onElementSelected, selectionRenderImpl) {

        onElementSelectedHandler = onElementSelected;
        if (selectionRenderImpl && typeof selectionRenderImpl === "object") {
            selectionRenderer = selectionRenderImpl;
        }

        restrictedElements = ['html', 'body', 'head', 'base'].map(function (selector) {
            return $(selector).get(0);
        });
        predictionHelper = new DomPredictionHelper($, String);

        selectionRenderer.init();
        setupEventHandlers();
        unbound = false;
    };

    /**
     * Resets state of selector.
     * Clears current selection.
     */
    api.reset = function () {
        clearSelected();
    };

    /**
     * Destroys selector module.
     * Removes all selector elements and unbinds event handlers.
     */
    api.close = function () {
        unbound = true;

        selectionRenderer.finalize();
        deleteEventHandlers();
    };

    /**
     * Selects specified element.
     * Marks element as selected and holds selection on it.
     *
     * @param element
     */
    api.selectElement = function (element) {
        deleteEventHandlers();
        selectionRenderer.add(element);

        unbound = true;
    };

    /**
     Returns css class name.
     If this class assigns to HTML element, then Adguard Selector ignores it.
     */
    api.ignoreClassName = function () {
        return IGNORED_CLASS;
    };

    return api;

})(balalaika);

/**
 * Adguard rules constructor library
 */
var AdguardRulesConstructorLib = (function () { // jshint ignore:line

    var CSS_RULE_MARK = '##';
    var RULE_OPTIONS_MARK = '$';

    var URLBLOCK_ATTRIBUTES = ["src", "data"];

    var linkHelper = document.createElement('a');

    /**
	 * Constructs css selector for element using tag name, id and classed, like: tagName#id.class1.class2
	 *
	 * @param element Element
	 * @param classList Override element classes (If classList is null, element classes will be used)
	 * @param excludeTagName Omit tag name in selector
	 * @param excludeId Omit element id in selector
	 * @returns {string}
	 */
    var makeDefaultCssFilter = function (element, classList, excludeTagName, excludeId) {
        var cssSelector = excludeTagName ? '' : element.tagName.toLowerCase();
        if (element.id && !excludeId) {
            cssSelector += '#' + CSS.escape(element.id);
        }
        cssSelector += constructClassCssSelectorByAND(classList || element.classList);
        return cssSelector;
    };

	/**
	 * Constructs css selector for element using parent elements and nth-child (first-child, last-child) pseudo classes.
	 *
	 * @param element Element
	 * @param options Construct options. For example: {excludeTagName: false, excludeId: false, classList: []}
	 * @returns {string}
	 */
    var makeCssNthChildFilter = function (element, options) {

        options = options || {};

        var classList = options.classList;

        var excludeTagNameOverride = 'excludeTagName' in options;
        var excludeTagName = options.excludeTagName;

        var excludeIdOverride = 'excludeId' in options;
        var excludeId = options.excludeId;

        var path = [];
        var el = element;
        while (el.parentNode) {
            var nodeName = el && el.nodeName ? el.nodeName.toUpperCase() : "";
            if (nodeName === "BODY") {
                break;
            }
            if (el.id) {
				/**
				 * Be default we don't include tag name and classes to selector for element with id attribute
				 */
				var cssSelector = '';
                if (el === element) {
                    cssSelector = makeDefaultCssFilter(el, classList || [], excludeTagNameOverride ? excludeTagName : true, excludeIdOverride ? excludeId : false);
                } else {
                    cssSelector = makeDefaultCssFilter(el, [], true, false);
                }
                path.unshift(cssSelector);
                break;
            } else {
                var c = 1;
                for (var e = el; e.previousSibling; e = e.previousSibling) {
                    if (e.previousSibling.nodeType === 1) {
                        c++;
                    }
                }

                var cldCount = 0;
                for (var i = 0; el.parentNode && i < el.parentNode.childNodes.length; i++) {
                    cldCount += el.parentNode.childNodes[i].nodeType === 1 ? 1 : 0;
                }

                var ch;
                if (cldCount === 0 || cldCount === 1) {
                    ch = "";
                } else if (c === 1) {
                    ch = ":first-child";
                } else if (c === cldCount) {
                    ch = ":last-child";
                } else {
                    ch = ":nth-child(" + c + ")";
                }

				/**
				 * By default we include tag name and element classes to selector for element without id attribute
				 */
                if (el === element) {
                    var p = makeDefaultCssFilter(el, classList, excludeTagNameOverride ? excludeTagName : false, excludeId);
                    p += ch;
                    path.unshift(p);
                } else {
                    path.unshift(makeDefaultCssFilter(el, el.classList, false, false) + ch);
                }

                el = el.parentNode;
            }
        }
        return path.join(" > ");
    };

	/**
	 * Constructs element selector for matching elements that contain any of classes in original element
	 * For example <el class="cl1 cl2 cl3"></el> => .cl1, .cl2, .cl3
	 *
	 * @param element Element
	 * @param classList Override element classes (If classList is null, element classes will be used)
	 * @returns {string}
	 */
    var makeSimilarCssFilter = function (element, classList) {
        return constructClassCssSelectorByOR(classList || element.classList);
    };

	/**
	 * Creates css rule text
	 * @param element Element
	 * @param options Construct options. For example: {cssSelectorType: 'STRICT_FULL', excludeTagName: false, excludeId: false, classList: []}
	 * @returns {string}
	 */
    var constructCssRuleText = function (element, options) {

        if (!element) {
            return;
        }

        options = options || {};
        var cssSelectorType = options.cssSelectorType || 'STRICT_FULL';

        var selector;
        switch (cssSelectorType) {
            case 'STRICT_FULL':
                selector = makeCssNthChildFilter(element, options);
                break;
            case 'STRICT':
                selector = makeDefaultCssFilter(element, options.classList, options.excludeTagName, options.excludeId);
                break;
            case 'SIMILAR':
                selector = makeSimilarCssFilter(element, options.classList, true);
                break;
        }

        return selector ? CSS_RULE_MARK + selector : '';
    };

    var constructUrlBlockRuleText = function (element, urlBlockAttribute, oneDomain, domain) {

        if (!urlBlockAttribute) {
            return null;
        }

        var blockUrlRuleText = urlBlockAttribute.replace(/^http:\/\/(www\.)?/, "||");
        if (blockUrlRuleText.indexOf('.') === 0) {
            blockUrlRuleText = blockUrlRuleText.substring(1);
        }

        if (!oneDomain) {
            blockUrlRuleText = blockUrlRuleText + RULE_OPTIONS_MARK + "domain=" + domain;
        }

        return blockUrlRuleText;
    };

    var getUrlBlockAttribute = function (element) {
        if (!element || !element.getAttribute) {
            return null;
        }

        for (var i = 0; i < URLBLOCK_ATTRIBUTES.length; i++) {
            var attr = URLBLOCK_ATTRIBUTES[i];
            var value = element.getAttribute(attr);
            if (isValidUrl(value)) {
                return value;
            }
        }

        return null;
    };

    var haveUrlBlockParameter = function (element) {
        var value = getUrlBlockAttribute(element);
        return value && value !== '';
    };

    var haveClassAttribute = function (element) {
        return element.classList && element.classList.length > 0;
    };

    var haveIdAttribute = function (element) {
        return element.id && element.id.trim() !== '';
    };

    var cropDomain = function (url) {
        var domain = getUrl(url).host;
        return domain.replace("www.", "").replace(/:\d+/, '');
    };

    var getUrl = function (url) {
        var pattern = "^(([^:/\\?#]+):)?(//(([^:/\\?#]*)(?::([^/\\?#]*))?))?([^\\?#]*)(\\?([^#]*))?(#(.*))?$";
        var rx = new RegExp(pattern);
        var parts = rx.exec(url);

        return {
            host: parts[4] || "",
            path: parts[7] || ""
        };
    };

    var isValidUrl = function(value) {
        if (value) {
            linkHelper.href = value;
            if (linkHelper.hostname) {
                return true;
            }
        }

        return false;
    };

    /**
     * Constructs css selector by combining classes by AND
     * @param classList
     * @returns {string}
     */
    var constructClassCssSelectorByAND = function (classList) {
        var selectors = [];
        if (classList) {
            for (var i = 0; i < classList.length; i++) {
                selectors.push('.' + CSS.escape(classList[i]));
            }
        }
        return selectors.join('');
    };

    /**
     * Constructs css selector by combining classes by OR
     * @param classList
     * @returns {string}
     */
    var constructClassCssSelectorByOR = function (classList) {
        var selectors = [];
        if (classList) {
            for (var i = 0; i < classList.length; i++) {
                selectors.push('.' + CSS.escape(classList[i]));
            }
        }
        return selectors.join(', ');
    };

    // Public API
    var api = {};

    /**
     * Utility method
     *
     * @param element
     * @returns {string}
     */
    api.makeCssNthChildFilter = makeCssNthChildFilter;

    /**
     * Returns detailed element info
     *
     * @param element
     */
    api.getElementInfo = function (element) {

        // Convert attributes to array
        var attributes = [];
        var elementAttributes = element.attributes;
        if (elementAttributes) {
            for (var i = 0; i < elementAttributes.length; i++) {
                var attr = elementAttributes[i];
                attributes.push({
                    name: attr.name,
                    value: attr.value
                });
            }
        }

        return {
            tagName: element.tagName,
            attributes: attributes,
            urlBlockAttributeValue: getUrlBlockAttribute(element),
            haveUrlBlockParameter: haveUrlBlockParameter(element),
            haveClassAttribute: haveClassAttribute(element),
            haveIdAttribute: haveIdAttribute(element)
        };
    };

    /**
     * Constructs css selector for specified rule
     *
     * @param ruleText rule text
     * @returns {string} css style selector
     */
    api.constructRuleCssSelector = function (ruleText) {
        if (!ruleText) {
            return null;
        }

        var index = ruleText.indexOf(CSS_RULE_MARK);
        var optionsIndex = ruleText.indexOf(RULE_OPTIONS_MARK);

        if (index >= 0) {
            return ruleText.substring(index + CSS_RULE_MARK.length, optionsIndex >= 0 ? optionsIndex : ruleText.length);
        }

        var s = ruleText.substring(0, optionsIndex);
        s = s.replace(/[\|]|[\^]/g, '');

        if (isValidUrl(s)) {
            return '[src*="' + s + '"]';
        }

        return null;
    };

    /**
     * Constructs adguard rule text from element node and specified options
     *
     * var options = {
	 *	urlBlockAttribute: url mask,
	 *	isBlockOneDomain: boolean,
	 *	url: url,
	 *  attributes: attributesSelectorText,
	 *  ruleType: (URL, CSS)
	 *  cssSelectorType: (STRICT_FULL, STRICT, SIMILAR),
	 *  excludeTagName: false, (Exclude element tag name from selector)
	 *  excludeId: false, (Exclude element identifier from selector)
	 *  classList: [] (Override element classes (If classList is null, element classes will be used))
	 * }
     *
     * @param element
     * @param options
     * @returns {*}
     */
    api.constructRuleText = function (element, options) {

        var croppedDomain = cropDomain(options.url);

        var ruleType = options.ruleType;

        if (ruleType === 'URL') {
            var blockUrlRuleText = constructUrlBlockRuleText(element, options.urlMask, options.isBlockOneDomain, croppedDomain);
            if (blockUrlRuleText) {
                return blockUrlRuleText;
            }
        }

        var result;

        if (ruleType === 'CSS') {

            result = constructCssRuleText(element, options);

            // Append html attributes to css selector
            if (options.attributes) {
                result = (result ? result : CSS_RULE_MARK + result) + options.attributes;
            }
        }

        if (!options.isBlockOneDomain) {
            result = croppedDomain + result;
        }

        return result;
    };

    return api;

})();

/* global balalaika */

/**
 * Slider widget
 */
var SliderWidget = (function ($) { // jshint ignore:line

    var PLACEHOLDER_CLASS = "adg-slide ui-slider ui-slider-horizontal ui-widget ui-widget-content ui-corner-all";
    var HANDLE_CLASS = "ui-slider-handle";
    var HANDLE_FULL_CLASS = "ui-slider-handle ui-state-default ui-corner-all";
    var TICK_CLASS = "tick";
    var TICK_FULL_CLASS = "tick ui-widget-content";
    var TICK_LEFT_COLOR = "#36BA53";
    var TICK_RIGHT_COLOR = "#E0DFDB";

    var placeholder = null;

    var min = 0;
    var max = 1;
    var value = 0;

    var onValueChanged = null;


    var refresh = function () {
        var handle = placeholder.querySelectorAll("." + HANDLE_CLASS);
        $(handle).css('left', (value - 1) * 100 / (max - min) + "%");

        var ticks = placeholder.querySelectorAll("." + TICK_CLASS);
        for (var i = 0; i < ticks.length; i++) {
            if (i + 1 < value) {
                ticks[i].style.background = TICK_LEFT_COLOR;
            } else {
                ticks[i].style.background = TICK_RIGHT_COLOR;
            }
        }
    };

    var render = function () {
        $(placeholder).addClass(PLACEHOLDER_CLASS);

        var handle = document.createElement('a');
        handle.setAttribute('href', '#');
        handle.setAttribute('class', HANDLE_FULL_CLASS);
        placeholder.appendChild(handle);

        var count = max - min;
        var prepare = function (i) {
            var tick = document.createElement('div');
            tick.setAttribute('class', TICK_FULL_CLASS);
            tick.style.left = (100 / count * i) + '%';
            tick.style.width = (100 / count) + '%';

            placeholder.appendChild(tick);
        };

        for (var i = 0; i < count; i++) {
            prepare(i);
        }

        refresh();
    };

    var setValue = function (v) {
        if (v < min) {
            value = min;
        } else if (v > max) {
            value = max;
        } else {
            value = v;
        }

        refresh();

        onValueChanged(value);
    };

    var bindEvents = function () {
        var $placeholder = $(placeholder);
        var handle = placeholder.querySelectorAll("." + HANDLE_CLASS);
        var $handle = $(handle);

        $(document).on('mouseup', function () {
            $placeholder.off('mousemove');
            $handle.off('mousemove');
        });

        //While the ui-slider-handle is being held down reference it parent.
        $handle.on('mousedown', function (e) {
            e.preventDefault();
            return $(this.parentNode).trigger('mousedown');
        });

        var rect = placeholder.getBoundingClientRect();
        var sliderWidth = rect.width;
        var offsetLeft = rect.left + document.body.scrollLeft;

        var getSliderValue = function (pageX) {
            return Math.round((max - min) / sliderWidth * (pageX - offsetLeft) + min);
        };

        //This will prevent the slider from moving if the mouse is taken out of the
        //slider area before the mouse down has been released.
        $placeholder.on('mouseenter', function () {
            $placeholder.on('click', function (e) {
                //calculate the correct position of the slider set the value
                var value = getSliderValue(e.pageX);
                setValue(value);
            });
            $placeholder.on('mousedown', function () {
                $(this).on('mousemove', function (e) {
                    //calculate the correct position of the slider set the value
                    var value = getSliderValue(e.pageX);
                    setValue(value);
                });
            });
            $placeholder.on('mouseup', function () {
                $(this).off('mousemove');
            });
        });

        $placeholder.on('mouseleave', function () {
            $placeholder.off('mousemove');
            $placeholder.off('click');
        });
    };

    // Public API
    var api = {};

    /**
     *
     * @param placeholderElement
     * @param options
     */
    api.init = function (placeholderElement, options) {
        placeholder = placeholderElement;

        min = options.min;
        max = options.max;
        value = options.value;
        onValueChanged = options.onValueChanged;

        render();
        bindEvents();
    };

    return api;

})(balalaika);

﻿
var AdguardAssistant = function ($, AdguardSelectorLib, AdguardRulesConstructorLib, SliderWidget) { // jshint ignore:line

	/**
	 * Contains assistant settings (style, callbacks)
	 */
	var settings = {
		cssLink: null,
		onElementBlocked: null, // Called when element is blocked,
		translateElement: null // Called when element needs to be translated
	};

	// Iframe identifier
	var iframeId = 'adguard-assistant-dialog';

	// Current preview style element
	var previewStyle = null;

	/**
	 * Contains selected element and info about it
	 */
	var selected = {
		element: null,
		elementInfo: null
	};

	var constants = {
		iframe: {//maximum values for all browsers was leaved for compatibility
			baseWidth: 668,
			extendDetailedSettingsHeight: 503,
			detailedMenuHeight: 360,
			selectorMenuHeight: 213,
			topOffset: 25
		}
	};

	var ignoreClassName = AdguardSelectorLib.ignoreClassName();

	var utils = {

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
		},

		getAllChildren: function (element) {
			var childArray = [];
			var child = element;
			while ((child = utils.getChildren(child))) {
				childArray.push(child);
			}
			return childArray;
		},

		getChildren: function (element) {

			var count = 0;
			var child;

			var children = element.childNodes;
			if (children) {
				var i;
				for (i = 0; i < children.length; i++) {
					if (children[i].nodeType == 1) {
						child = children[i];
						count++;
					}
				}
			}
			return count == 1 ? child : null;
		},

		getParentsLevel: function (element) {
			var parent = element;
			var parentArr = [];
			while ((parent = parent.parentNode) && utils.getNodeName(parent) != "BODY") {
				parentArr.push(parent);
			}
			return parentArr;
		},

		getNodeName: function (element) {
			return element && element.nodeName ? element.nodeName.toUpperCase() : "";
		}
	};

	/**
	 * Makes iframe draggable
	 *
	 * @param iframe
	 */
	var makeDraggable = function (iframe) {

		var iframeJ = findIframe();
		var dragHandle = findInIframe('#drag-handle');
		var $iframeDocument = $(iframe.contentDocument);

		var offset = Object.create(null);

		/**
		 * Generalized function to get position of an event (like mousedown, mousemove, etc)
		 *
		 * @param e
		 * @returns {{x: (Number|number), y: (Number|number)}}
		 */
		var getEventPosition = function (e) {
			if (!e) {
				e = window.event;
			}
			return {
				x: e.screenX,
				y: e.screenY
			};
		};

		/**
		 * Function that does actual "dragging"
		 *
		 * @param x
		 * @param y
		 */
		var drag = function (x, y) {
			var newPositionX = x;
			var newPositionY = y;
			// Don't drag it off the top or left of the screen?
			if (newPositionX < 0) {
				newPositionX = 0;
			}
			if (newPositionY < 0) {
				newPositionY = 0;
			}

			iframeJ.get(0).style.setProperty('left', newPositionX + 'px', 'important');
			iframeJ.get(0).style.setProperty('top', newPositionY + 'px', 'important');
		};

		var cancelIFrameSelection = function (e) {
			e.preventDefault();
			e.stopPropagation();
		};

		var onMouseMove = function (e) {
			var eventPosition = getEventPosition(e);
			drag(eventPosition.x + offset.x, eventPosition.y + offset.y);
		};

		var onMouseDown = function (e) {

			var eventPosition = getEventPosition(e);
			var dragHandleEl = dragHandle.get(0);
			var rect = iframeJ.get(0).getBoundingClientRect();

			offset.x = rect.left + dragHandleEl.offsetLeft - eventPosition.x;
			offset.y = rect.top + dragHandleEl.offsetTop - eventPosition.y;

			$iframeDocument.on('mousemove', onMouseMove);
			$iframeDocument.on('selectstart', cancelIFrameSelection);
		};

		var onMouseUp = function () {
			$iframeDocument.off('mousemove', onMouseMove);
			$iframeDocument.off('selectstart', cancelIFrameSelection);
		};

		dragHandle.on('mousedown', onMouseDown);
		$iframeDocument.on('mouseup', onMouseUp);
	};

	var getViewport = function () {
		return {
			width: window.innerWidth,
			height: window.innerHeight
		};
	};

	var getPositionsForIframe = function (offset, viewPort, height, width) {
		return {
			left: viewPort.width - width - offset,
			top: offset
		};
	};

	var createIframe = function (width, height, callback) {

		var viewPort = getViewport();
		var positions = getPositionsForIframe(constants.iframe.topOffset, viewPort, height, width);

		var iframe = document.createElement('iframe');
		iframe.setAttribute('id', iframeId);
		iframe.setAttribute('class', ignoreClassName);
		iframe.setAttribute('frameBorder', '0');
		iframe.setAttribute('allowTransparency', 'true');

		iframe.style.setProperty('width', width + 'px', "important");
		iframe.style.setProperty('height', height + 'px', "important");
		iframe.style.setProperty('position', 'fixed', "important");
		iframe.style.setProperty('left', positions.left + 'px', "important");
		iframe.style.setProperty('top', positions.top + 'px', "important");

		// Wait for iframe load and then apply styles
		$(iframe).on('load', function () {
			loadDefaultScriptsAndStyles(iframe);
			callback(iframe);
		});
		document.body.appendChild(iframe);
	};

	var loadDefaultScriptsAndStyles = function (iframe) {

		// Chrome doesn't inject scripts in empty iframe
		try {
			var doc = iframe.contentDocument;
			doc.open();
			doc.write("<html><head></head></html>");
			doc.close();
		} catch (ex) {
			// Ignore (does not work in FF)
		}

		var head = iframe.contentDocument.getElementsByTagName('head')[0];

		var link = document.createElement("link");
		link.type = "text/css";
		link.rel = "stylesheet";
		link.href = settings.cssLink;
		head.appendChild(link);
	};

	var findIframe = function () {
		return $('#' + iframeId);
	};

	var findInIframe = function (selector) {
		return $(findIframe().get(0).contentDocument.querySelectorAll(selector));
	};

	/**
	 * Shows dialog window (create iframe dynamically)
	 *
	 * @param content
	 * @param width
	 * @param height
	 * @param callback
	 */
	var showDialog = function (content, width, height, callback) {

		var appendContent = function (iframe) {
			appendContentToIframe(iframe, content);
			localizeMenu();
			makeDraggable(iframe);
			checkPosition();
			callback(iframe);
		};

		var existIframe = findIframe();
		if (existIframe.length > 0) {
			var iframe = existIframe.get(0);
			changeCurrentIframe(width, height, iframe);
			appendContent(iframe);
			return;
		}

		createIframe(width, height, appendContent);
	};

	var changeCurrentIframe = function (width, height, iframe) {
        iframe.style.setProperty('width', width + 'px', "important");
        iframe.style.setProperty('height', height + 'px', "important");
	};

	var appendContentToIframe = function (iframe, content) {
		var body = iframe.contentDocument.body;
		while (body.lastChild) {
			body.removeChild(body.lastChild);
		}
		body.appendChild(content.get(0));
	};

	var bindClicks = function (iframe, events) {
		for (var event in events) {
			if (events.hasOwnProperty(event)) {
				$(iframe.contentDocument.querySelectorAll(event)).on('click', events[event]);
			}
		}
	};

	var onCancelSelectClicked = function (e) {
		e.preventDefault();
		showSelectorMenu(function () {
			removePreview();
			startSelector();
		});
	};

	var onCancelSelectModeClicked = function (e) {
		e.preventDefault();
		removePreview();
		cancelSelectMode();
		closeAssistant();
	};

	/**
	 * Cancels select mode, removes all elements using for selecting
	 */
	var cancelSelectMode = function () {
		AdguardSelectorLib.close();
	};

	var onElementSelected = function (element) {
		selected.element = element;
		selected.elementInfo = AdguardRulesConstructorLib.getElementInfo(element);
		showHidingRuleWindow(element, selected.elementInfo.haveUrlBlockParameter, selected.elementInfo.haveClassAttribute);
	};

	var closeAssistant = function () {
		cancelSelectMode();
		findIframe().remove();
	};

	/**
	 * Starts AdguardSelector work
	 */
	var startSelector = function () {
		// Initializing AdguardSelector with default configuration
		//AdguardSelectorLib.reset();
		AdguardSelectorLib.init(onElementSelected);
	};

	var setFilterRuleInputText = function (ruleText) {
		findInIframe('#filter-rule').get(0).value = ruleText;
	};

	var localizeMenu = function () {
		var elements = findInIframe("[i18n]");
		for (var i = 0; i < elements.length; i++) {
			var msgId = elements[i].getAttribute("i18n");
			settings.translateElement(elements[i], msgId);
		}
	};

	var createAdguardDetailedMenu = function () {
		return $('<div class="main">' +
			'<div class="close adg-close"></div>' +
			'<div class="head" id="drag-handle">' +
			'	<div i18n="assistant_block_element" class="head_title" id="head_title"></div>' +
			'	<div i18n="assistant_block_element_explain" class="head_text" id="head_text"></div>' +
			'</div>' +
			'<div class="content">' +
			'	<div class="element-rule">' +
			'		<div i18n="assistant_slider_explain" class="element-rule_text"></div>' +
			'		<div class="element-rule_slider">' +
			'			<div class="adg-slide" id="slider">' +
			'				<div class="adg-slide-clue-max">MIN</div>' +
			'				<div class="adg-slide-clue-min">MAX</div>' +
			'			</div>' +
			'		</div>' +
			'		<div class="element-rule_more">' +
			'			<span class="element-rule_expand-link" id="adg-show-adv-settings">' +
			'				<span i18n="assistant_extended_settings" class="element-rule_expand-link_txt"></span>' +
			'				<span class="element-rule_expand-link_arr"></span>' +
			'			</span>' +
			'		</div>' +
			'		<div class="element-rule_form" id="adv-settings">' +
			'			<div class="element-rule_form-cont">' +
			'				<div class="element-rule_fieldset" id="one-domain-checkbox-block">' +
			'					<input class="form-ui-control" id="one-domain-checkbox" type="checkbox"/>' +
			'					<label for="one-domain-checkbox" class="form-ui">' +
			'						<span i18n="assistant_apply_rule_to_all_sites" class="form-ui-txt"></span>' +
			'					</label>' +
			'				</div>' +
			'				<div style="display: none;" class="element-rule_fieldset" id="block-by-url-checkbox-block">' +
			'					<input class="form-ui-control" id="block-by-url-checkbox" type="checkbox"/>' +
			'					<label for="block-by-url-checkbox" class="form-ui">' +
			'						<span i18n="assistant_block_by_reference" class="form-ui-txt"></span>' +
			'					</label>' +
			'				</div>' +
			'				<div style="display: none;" class="element-rule_fieldset" id="block-similar-checkbox-block">' +
			'					<input class="form-ui-control" id="block-similar-checkbox" type="checkbox"/>' +
			'					<label for="block-similar-checkbox" class="form-ui">' +
			'						<span i18n="assistant_block_similar" class="form-ui-txt"></span>' +
			'					</label>' +
			'				</div>' +
			'				<div class="element-rule_fieldset">' +
			'					<input class="form-control" id="filter-rule" type="text"/>' +
			'				</div>' +
			'			</div>' +
			'		</div>' +
			'	</div>' +
			'</div>' +
			'<div class="foot">' +
			'	<button i18n="assistant_another_element" type="button" class="btn btn-default" id="adg-cancel"></button>' +
			'	<div class="foot_action">' +
			'		<div class="foot_action_btn">' +
			'			<button i18n="assistant_preview" type="button" class="btn btn-primary" id="adg-preview"></button>' +
			'			<button i18n="assistant_block" type="button" class="btn btn-cancel" id="adg-accept"></button>' +
			'		</div>' +
			'	</div>' +
			'</div>' +
			'</div>');

	};

	var createAdguardSelectorMenu = function () {
		return $('<div class="main ' + ignoreClassName + '">' +
			'<div class="close adg-close" id="close-button"></div>' +
			'<div class="head" id="drag-handle">' +
			'	<div i18n="assistant_select_element" class="head_title"></div>' +
			'	<div i18n="assistant_select_element_ext" class="head_text"></div>' +
			'</div>' +
			'<div class="foot">' +
			'	<button i18n="assistant_select_element_cancel" type="button" class="btn btn-default" id="cancel-select-mode"></button>' +
			'</div>' +
			'</div>');
	};

	var showDetailedMenu = function (callback) {
		var content = createAdguardDetailedMenu();
		showDialog(content, constants.iframe.baseWidth, constants.iframe.detailedMenuHeight, function (iframe) {
			bindClicks(iframe, {
				'#close-button': onCancelSelectModeClicked,
				'.adg-close': onCancelSelectModeClicked,
				'#one-domain-checkbox-block': onScopeChange,
				'#block-by-url-checkbox-block': onScopeChange,
				'#block-similar-checkbox-block': onScopeChange,
				'#adg-cancel': onCancelSelectClicked,
				'#adg-preview': toggleRulePreview,
				'#adg-accept': onRuleAccept,
				'#adg-show-adv-settings': onExtendDetailedSettings
			});
			callback();
		});
	};

	/**
	 * Shows Adguard selector menu
	 */
	var showSelectorMenu = function (callback) {
		var content = createAdguardSelectorMenu();
		showDialog(content, constants.iframe.baseWidth, constants.iframe.selectorMenuHeight, function (iframe) {
			bindClicks(iframe, {
				'#cancel-select-mode': onCancelSelectModeClicked,
				'.adg-close': onCancelSelectModeClicked
			});
			callback();
		});
	};

	var showHidingRuleWindow = function (element, urlBlock, blockSimilar) {
		showDetailedMenu(function () {
			createSlider(element);
			AdguardSelectorLib.selectElement(element);
			onScopeChange();
			handleShowBlockSettings(urlBlock, blockSimilar);
		});
	};

	var resizeIframe = function (width, height) {
		var iframe = findIframe().get(0);

		if (height) {
            iframe.style.setProperty('height', height + 'px', "important");
		}

		if (width) {
            iframe.style.setProperty('width', width + 'px', "important");
		}

		checkPosition();
	};

	var checkPosition = function () {
		var winHeight = window.innerHeight;
		var bottom = document.body.scrollTop + winHeight;

		var iframe = findIframe().get(0);
		var offsetTop = iframe.getBoundingClientRect().top + document.body.scrollTop;
		var height = iframe.offsetHeight;
		if (offsetTop + height > bottom) {
			var top = winHeight - height - constants.iframe.topOffset;
			if (top < 0) {
				top = constants.iframe.topOffset;
			}
            iframe.style.setProperty('top', top + 'px', "important");
		}
	};

	var onExtendDetailedSettings = function () {
		var hidden = !(findInIframe('#adv-settings').hasClass("open"));
		if (hidden) {
			resizeIframe(null, constants.iframe.extendDetailedSettingsHeight);
			findInIframe('#adv-settings').addClass('open');
			findInIframe('#adg-show-adv-settings').addClass('active');
		} else {
			resizeIframe(null, constants.iframe.detailedMenuHeight);
			findInIframe('#adv-settings').removeClass('open');
			findInIframe('#adg-show-adv-settings').removeClass('active');
		}
	};

	var createSlider = function (element) {
		var parents = utils.getParentsLevel(element);
		var children = utils.getAllChildren(element);
		var value = Math.abs(parents.length + 1);
		var max = parents.length + children.length + 1;
		var min = 1;
		var options = {value: value, min: min, max: max};

		if (min == max) {
			//hide slider
			findInIframe('#slider').hide();

			var el = findInIframe('.element-rule_text').get(0);
			el.removeAttribute('i18n');
			settings.translateElement(el, 'assistant_slider_if_hide');

			return;
		}

		options.onSliderMove = function (delta) {
			var elem;
			if (delta > 0) {
				elem = parents[delta - 1];
			}
			if (delta === 0) {
				elem = element;
			}
			if (delta < 0) {
				elem = children[Math.abs(delta + 1)];
			}
			onSliderMove(elem);
		};

		SliderWidget.init(findInIframe("#slider").get(0), {
			min: options.min,
			max: options.max,
			value: options.value,
			onValueChanged: function (value) {
				var delta = options.value - value;
				options.onSliderMove(delta);
			}
		});
	};

	var handleShowBlockSettings = function (showBlockByUrl, showBlockSimilar) {
		if (showBlockByUrl) {
			findInIframe('#block-by-url-checkbox-block').show();
		} else {
			findInIframe('#block-by-url-checkbox').get(0).checked = false;
			findInIframe('#block-by-url-checkbox-block').hide();
		}
		if (showBlockSimilar) {
			findInIframe('#block-similar-checkbox-block').show();
		} else {
			findInIframe('#block-similar-checkbox').get(0).checked = false;
			findInIframe('#block-similar-checkbox-block').hide();
		}
	};

	var onSliderMove = function (element) {

		removePreview();

		selected.element = element;
		selected.elementInfo = AdguardRulesConstructorLib.getElementInfo(element);
		AdguardSelectorLib.selectElement(element);

		makeDefaultCheckboxesForDetailedMenu();
		onScopeChange();
		handleShowBlockSettings(selected.elementInfo.haveUrlBlockParameter, selected.elementInfo.haveClassAttribute);
	};

	var makeDefaultCheckboxesForDetailedMenu = function () {
		findInIframe('#block-by-url-checkbox').get(0).checked = false;
		findInIframe('#block-similar-checkbox').get(0).checked = false;
		findInIframe('#one-domain-checkbox').get(0).checked = false;
	};

	var toggleRulePreview = function (e) {

		if (e) {
			e.preventDefault();
		}

		if (previewStyle) {
			// On finish preview and come back to selected
			removePreview();
			settings.translateElement(findInIframe('#head_title').get(0), "assistant_block_element");
			settings.translateElement(findInIframe('#head_text').get(0), "assistant_block_element_explain");
			settings.translateElement(findInIframe('#adg-preview').get(0), "assistant_preview_start");

			AdguardSelectorLib.selectElement(selected.element);

			findInIframe('.content').show();

			return;
		}

		hideElement();

		settings.translateElement(findInIframe('#head_title').get(0), "assistant_preview_header");
		settings.translateElement(findInIframe('#head_text').get(0), "assistant_preview_header_info");
		settings.translateElement(findInIframe('#adg-preview').get(0), "assistant_preview_end");

		findInIframe('.content').hide();
	};

	var hideElement = function () {
		AdguardSelectorLib.reset();

		var ruleText = findInIframe('#filter-rule').get(0).value;
		var selector = AdguardRulesConstructorLib.constructRuleCssSelector(ruleText);
		if (!selector) {
			return;
		}

		var style = document.createElement("style");
		style.setAttribute("type", "text/css");
		previewStyle = style;

		var head = document.getElementsByTagName('head')[0];
		if (head) {
			style.appendChild(document.createTextNode(selector + " {display: none !important;}"));
			head.appendChild(style);
		}
	};

	var removePreview = function () {

		if (!previewStyle) {
			return;
		}

		var head = document.getElementsByTagName("head")[0];
		if (head) {
			head.removeChild(previewStyle);
		}

		previewStyle = null;
	};

	var onScopeChange = function () {

		var isBlockByUrl = findInIframe('#block-by-url-checkbox').get(0).checked;
		var isBlockSimilar = findInIframe("#block-similar-checkbox").get(0).checked;
		var isBlockOneDomain = findInIframe("#one-domain-checkbox").get(0).checked;

		handleShowBlockSettings(selected.elementInfo.haveUrlBlockParameter && !isBlockSimilar, selected.elementInfo.haveClassAttribute && !isBlockByUrl);

		var options = {
			urlMask: selected.elementInfo.urlBlockAttributeValue,
			isBlockOneDomain: isBlockOneDomain,
			ruleType: isBlockByUrl ? 'URL' : 'CSS',
			cssSelectorType: isBlockSimilar ? 'SIMILAR' : 'STRICT_FULL',
			url: document.location
		};

		var ruleText = AdguardRulesConstructorLib.constructRuleText(selected.element, options);
		setFilterRuleInputText(ruleText);
	};

	var onRuleAccept = function () {

		removePreview();
		toggleRulePreview();
		previewStyle = null;

		var ruleText = findInIframe('#filter-rule').get(0).value;
		settings.onElementBlocked(ruleText, closeAssistant);
	};

	var reselectElement = utils.debounce(function () {
		if (selected.element && !previewStyle) {
			AdguardSelectorLib.selectElement(selected.element);
		}
	}, 50);
	$(window).on('resize', reselectElement);
	$(window).on('scroll', reselectElement);

	this.init = function (options) {

		settings.cssLink = options.cssLink;
		settings.onElementBlocked = options.onElementBlocked;
		settings.translateElement = options.translateElement;

		showSelectorMenu(function () {
			removePreview();
			startSelector();
			// Choose element for assistant
			if (options.selectedElement) {
				$(options.selectedElement).trigger('click');
			}
		});
	};

	this.destroy = function () {
		removePreview();
		cancelSelectMode();
		closeAssistant();
		$(window).off('resize', reselectElement);
		$(window).off('scroll', reselectElement);
	};
};

/* global contentPage, I18nHelper, AdguardAssistant, balalaika, AdguardSelectorLib, AdguardRulesConstructorLib, SliderWidget */

(function () {

    if (window.top !== window || !(document.documentElement instanceof HTMLElement)) {
        return;
    }

    /**
     * `contentPage` may be undefined on the extension startup in FF browser.
     *
     * Different browsers have different strategies of the content scripts injections on extension startup.
     * For example, FF injects content scripts in already opened tabs, but Chrome doesn't do it.
     * In the case of the FF browser, content scripts with the `document_start` option won't injected into opened tabs, so we have to directly check this case.
     */
    if (typeof contentPage === 'undefined') {
        return;
    }

    var adguardAssistant;

    //save right-clicked element for assistant
    var clickedEl = null;
    document.addEventListener('mousedown', function (event) {
        if (event.button === 2) {
            clickedEl = event.target;
        }
    });

    contentPage.onMessage.addListener(function (message) {
        switch (message.type) {
            case 'initAssistant':
                var options = message.options;
                var localization = options.localization;
                var addRuleCallbackName = options.addRuleCallbackName;

                var onElementBlocked = function (ruleText, callback) {
                    contentPage.sendMessage({type: addRuleCallbackName, ruleText: ruleText}, callback);
                };

                var translateElement = function (element, msgId) {
                    var message = localization[msgId];
                    I18nHelper.translateElement(element, message);
                };

                if (adguardAssistant) {
                    adguardAssistant.destroy();
                } else {
                    adguardAssistant = new AdguardAssistant(balalaika, AdguardSelectorLib, AdguardRulesConstructorLib, SliderWidget);
                }

                var selectedElement = null;
                if (clickedEl && options.selectElement) {
                    selectedElement = clickedEl;
                }

                adguardAssistant.init({
                    cssLink: options.cssLink,
                    onElementBlocked: onElementBlocked,
                    translateElement: translateElement,
                    selectedElement: selectedElement
                });
                break;
            case 'destroyAssistant':
                if (adguardAssistant) {
                    adguardAssistant.destroy();
                    adguardAssistant = null;
                }
                break;
        }
    });

})();

})(window);