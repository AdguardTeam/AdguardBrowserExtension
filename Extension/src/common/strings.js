/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Util class for work with strings
 */
export const strings = (() => {
    const StringUtils = {
        isEmpty(str) {
            return !str || str.trim().length === 0;
        },

        startWith(str, prefix) {
            return str && str.indexOf(prefix) === 0;
        },

        endsWith(str, postfix) {
            return str.endsWith(postfix);
        },

        substringAfter(str, separator) {
            if (!str) {
                return str;
            }
            const index = str.indexOf(separator);
            return index < 0 ? '' : str.substring(index + separator.length);
        },

        substringBefore(str, separator) {
            if (!str || !separator) {
                return str;
            }
            const index = str.indexOf(separator);
            return index < 0 ? str : str.substring(0, index);
        },

        contains(str, searchString) {
            return str && str.indexOf(searchString) >= 0;
        },

        containsIgnoreCase(str, searchString) {
            return str && searchString && str.toUpperCase().indexOf(searchString.toUpperCase()) >= 0;
        },

        replaceAll(str, find, replace) {
            if (!str) {
                return str;
            }
            return str.split(find).join(replace);
        },

        join(array, separator, startIndex, endIndex) {
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
                return '';
            }
            const buf = [];
            for (let i = startIndex; i < endIndex; i += 1) {
                buf.push(array[i]);
            }
            return buf.join(separator);
        },

        /**
         * Get string before regexp first match
         *
         * @param {string} str
         * @param {RegExp} rx
         */
        getBeforeRegExp(str, rx) {
            const index = str.search(rx);
            return str.substring(0, index);
        },

        /**
         * Look for any symbol from "chars" array starting at "start" index or from the start of the string
         *
         * @param str   String to search
         * @param chars Chars to search for
         * @param start Start index (optional, inclusive)
         * @returns int Index of the element found or null
         */
        indexOfAny(str, chars, start) {
            start = start || 0;

            if (typeof str === 'string' && str.length <= start) {
                return -1;
            }

            for (let i = start; i < str.length; i += 1) {
                const c = str.charAt(i);
                if (chars.indexOf(c) > -1) {
                    return i;
                }
            }

            return -1;
        },

        /**
         * Splits string by a delimiter, ignoring escaped delimiters
         *
         * @param str               String to split
         * @param delimiter         Delimiter
         * @param escapeCharacter   Escape character
         * @param preserveAllTokens If true - preserve empty entries.
         */
        splitByDelimiterWithEscapeCharacter(str, delimiter, escapeCharacter, preserveAllTokens) {
            const parts = [];

            if (this.isEmpty(str)) {
                return parts;
            }

            let sb = [];
            for (let i = 0; i < str.length; i += 1) {
                const c = str.charAt(i);

                if (c === delimiter) {
                    if (i === 0) {
                        // Ignore
                    } else if (str.charAt(i - 1) === escapeCharacter) {
                        sb.splice(sb.length - 1, 1);
                        sb.push(c);
                    } else if (preserveAllTokens || sb.length > 0) {
                        const part = sb.join('');
                        parts.push(part);
                        sb = [];
                    }
                } else {
                    sb.push(c);
                }
            }

            if (preserveAllTokens || sb.length > 0) {
                parts.push(sb.join(''));
            }

            return parts;
        },

        /**
         * Serialize HTML element
         *
         * @param element
         */
        elementToString(element) {
            const s = [];
            s.push('<');
            s.push(element.localName);
            const { attributes } = element;
            for (let i = 0; i < attributes.length; i += 1) {
                const attr = attributes[i];
                s.push(' ');
                s.push(attr.name);
                s.push('="');
                const value = attr.value === null ? '' : attr.value.replace(/"/g, '\\"');
                s.push(value);
                s.push('"');
            }
            s.push('>');
            return s.join('');
        },

        /**
         * Checks if the specified string starts with a substr at the specified index.
         *
         * @param str - String to check
         * @param startIndex - Index to start checking from
         * @param substr - Substring to check
         * @returns boolean true if it does start
         */
        startsAtIndexWith(str, startIndex, substr) {
            if (str.length - startIndex < substr.length) {
                return false;
            }

            for (let i = 0; i < substr.length; i += 1) {
                if (str.charAt(startIndex + i) !== substr.charAt(i)) {
                    return false;
                }
            }

            return true;
        },

        /**
         * Checks if str has unquoted substr
         *
         * @param str
         * @param substr
         */
        hasUnquotedSubstring(str, substr) {
            const quotes = ['"', "'", '/'];

            const stack = [];
            for (let i = 0; i < str.length; i += 1) {
                const cursor = str[i];

                if (stack.length === 0) {
                    if (this.startsAtIndexWith(str, i, substr)) {
                        return true;
                    }
                }

                if (quotes.indexOf(cursor) >= 0
                    && (i === 0 || str[i - 1] !== '\\')) {
                    const last = stack.pop();
                    if (!last) {
                        stack.push(cursor);
                    } else if (last !== cursor) {
                        stack.push(last);
                        stack.push(cursor);
                    }
                }
            }

            return false;
        },
    };

    return StringUtils;
})();
