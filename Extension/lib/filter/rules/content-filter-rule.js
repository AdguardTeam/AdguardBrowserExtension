(function (adguard, api) {

    'use strict';

    var ATTRIBUTE_START_MARK = '[';
    var ATTRIBUTE_END_MARK = ']';
    var QUOTES = '"';
    var TAG_CONTENT_MASK = 'tag-content';
    var WILDCARD_MASK = 'wildcard';
    var TAG_CONTENT_MAX_LENGTH = 'max-length';
    var TAG_CONTENT_MIN_LENGTH = 'min-length';
    var PARENT_ELEMENTS = 'parent-elements';
    var PARENT_SEARCH_LEVEL = 'parent-search-level';
    var DEFAULT_PARENT_SEARCH_LEVEL = 3;

    function Wildcard(pattern) {

        this.regexp = new RegExp(wildcardToRegex(pattern), 'i');
        this.shortcut = extractShortcut(pattern);

        /**
         * Converts wildcard to regular expression
         *
         * @param pattern The wildcard pattern to convert
         * @return A regex equivalent of the given wildcard
         */
        function wildcardToRegex(pattern) {

            var specials = [
                '\\', '*', '+', '?', '|', '{', '}', '[', ']', '(', ')', '^', '$', '.', '#'
            ];
            var specialsRegex = new RegExp('[' + specials.join('\\') + ']', 'g');
            pattern = pattern.replace(specialsRegex, '\\$&');

            pattern = adguard.utils.strings.replaceAll(pattern, '\\*', '[\\s\\S]*');
            pattern = adguard.utils.strings.replaceAll(pattern, '\\?', '.');
            return '^' + pattern + '$';
        }

        /**
         * Extracts longest string that does not contain * or ? symbols.
         *
         * @param pattern Wildcard pattern
         * @return Longest string without special symbols
         */
        function extractShortcut(pattern) {

            var wildcardChars = ['*', '?'];
            var startIndex = 0;
            var endIndex = adguard.utils.strings.indexOfAny(pattern, wildcardChars);

            if (endIndex < 0) {
                return pattern.toLowerCase();
            }

            var shortcut = endIndex === startIndex ? '' : pattern.substring(startIndex, endIndex - startIndex);

            while (endIndex >= 0) {

                startIndex = startIndex + endIndex + 1;
                if (pattern.length <= startIndex) {
                    break;
                }

                endIndex = adguard.utils.strings.indexOfAny(pattern.substring(startIndex), wildcardChars);
                var tmpShortcut = endIndex < 0 ? pattern.substring(startIndex) : pattern.substring(startIndex, endIndex + startIndex);

                if (tmpShortcut.length > shortcut.length) {
                    shortcut = tmpShortcut;
                }
            }

            return shortcut.toLowerCase();
        }

        /**
         * Returns 'true' if input text is matching wildcard.
         * This method first checking shortcut -- if shortcut exists in input string -- than it checks regexp.
         *
         * @param input Input string
         * @return true if input string matches wildcard
         */
        this.matches = function (input) {

            if (!input) {
                return false;
            }

            if (input.toLowerCase().indexOf(this.shortcut) < 0) {
                return false;
            }

            return this.regexp.test(input);
        }
    }

    function getQuoteIndex(text, startIndex) {

        var nextChar = '"';
        var quoteIndex = startIndex - 2;

        while (nextChar === '"') {
            quoteIndex = text.indexOf(QUOTES, quoteIndex + 2);
            if (quoteIndex === -1) {
                return -1;
            }
            nextChar = text.length === (quoteIndex + 1) ? '0' : text.charAt(quoteIndex + 1);
        }

        return quoteIndex;
    }

    /**
     * Creates an instance of the ContentFilterRule from its text format
     */
    var ContentFilterRule = function (ruleText, filterId) {

        api.FilterRule.call(this, ruleText, filterId);

        this.parentSearchLevel = DEFAULT_PARENT_SEARCH_LEVEL;
        this.maxLength = 8192;

        var mask = api.FilterRule.MASK_CONTENT_EXCEPTION_RULE;
        var indexOfMask = ruleText.indexOf(mask);
        if (indexOfMask >= 0) {
            this.whiteListRule = true;
        } else {
            mask = api.FilterRule.MASK_CONTENT_RULE;
            indexOfMask = ruleText.indexOf(mask);
        }

        if (indexOfMask < 0) {
            throw 'Invalid rule ' + ruleText;
        }

        this.elementsFilter = ruleText.substring(indexOfMask + mask.length);
        var ruleStartIndex = ruleText.indexOf(ATTRIBUTE_START_MARK);

        // Cutting tag name from string
        if (ruleStartIndex === -1) {
            this.tagName = ruleText.substring(indexOfMask + mask.length);
        } else {
            this.tagName = ruleText.substring(indexOfMask + mask.length, ruleStartIndex);
        }

        // Loading domains (if any))
        if (indexOfMask > 0) {
            var domains = ruleText.substring(0, indexOfMask);
            this.loadDomains(domains);
        }

        if (!this.whiteListRule && this.isGeneric()) {
            throw 'Content rule must have at least one permitted domain';
        }

        var selector = [this.tagName];

        // Loading attributes filter
        while (ruleStartIndex !== -1) {
            var equalityIndex = ruleText.indexOf(api.FilterRule.EQUAL, ruleStartIndex + 1);
            var quoteStartIndex = ruleText.indexOf(QUOTES, equalityIndex + 1);
            var quoteEndIndex = getQuoteIndex(ruleText, quoteStartIndex + 1);
            if (quoteStartIndex === -1 || quoteEndIndex === -1) {
                break;
            }
            var ruleEndIndex = ruleText.indexOf(ATTRIBUTE_END_MARK, quoteEndIndex + 1);

            var attributeName = ruleText.substring(ruleStartIndex + 1, equalityIndex);
            var attributeValue = ruleText.substring(quoteStartIndex + 1, quoteEndIndex);
            attributeValue = adguard.utils.strings.replaceAll(attributeValue, '""', '"');

            switch (attributeName) {
                case TAG_CONTENT_MASK:
                    this.tagContentFilter = attributeValue;
                    break;
                case WILDCARD_MASK:
                    this.wildcard = new Wildcard(attributeValue);
                    break;
                case TAG_CONTENT_MAX_LENGTH:
                    this.maxLength = parseInt(attributeValue);
                    break;
                case TAG_CONTENT_MIN_LENGTH:
                    this.minLength = parseInt(attributeValue);
                    break;
                case PARENT_ELEMENTS:
                    this.parentElements = attributeValue.split(',');
                    break;
                case PARENT_SEARCH_LEVEL:
                    this.parentSearchLevel = parseInt(attributeValue);
                    break;
                default:
                    selector.push('[');
                    selector.push(attributeName);
                    selector.push('*="');
                    selector.push(attributeValue);
                    selector.push('"]');
                    break;
            }

            if (ruleEndIndex === -1) {
                break;
            }
            ruleStartIndex = ruleText.indexOf(ATTRIBUTE_START_MARK, ruleEndIndex + 1);
        }

        this.selector = selector.join('');

        // Validates selector immediately
        window.document.querySelectorAll(this.selector);
    };

    ContentFilterRule.prototype = Object.create(api.FilterRule.prototype);

    ContentFilterRule.prototype.getMatchedElements = function (document) {

        var elements = document.querySelectorAll(this.selector);

        var result = null;

        for (var i = 0; i < elements.length; i++) {

            var element = elements[i];

            var elementToDelete = null;

            if (this.isFiltered(element)) {

                if (this.parentElements) {
                    var parentElement = this.searchForParentElement(element);
                    if (parentElement) {
                        elementToDelete = parentElement;
                    }
                } else {
                    elementToDelete = element;
                }

                if (elementToDelete) {
                    if (result === null) {
                        result = [];
                    }
                    result.push(element);
                }
            }
        }

        return result;
    };

    /**
     * Checks if HtmlElement is filtered by this content filter.
     *
     * @param element Evaluated element
     * @return true if element should be filtered
     */
    ContentFilterRule.prototype.isFiltered = function (element) {

        // Checking tag content length limits
        var content = element.innerHTML || '';
        if (this.maxLength > 0) {
            // If max-length is set - checking content length (it should be lesser than max length)
            if (content.length > this.maxLength) {
                return false;
            }
        }

        if (this.minLength > 0) {
            // If min-length is set - checking content length (it should be greater than min length)
            if (content.length < this.minLength) {
                return false;
            }
        }

        if (!this.tagContentFilter && !this.wildcard) {
            // Rule does not depend on content
            return true;
        }

        if (!content) {
            return false;
        }

        // Checking tag content against filter
        if (this.tagContentFilter && content.indexOf(this.tagContentFilter) < 0) {
            return false;
        }

        // Checking tag content against the wildcard
        if (this.wildcard && !this.wildcard.matches(content)) {
            return false;
        }

        // All filters are passed, tag is filtered
        return true;
    };

    /**
     * Searches for parent element to delete.
     * Suitable parent elements are set by 'parent-elements' attribute.
     * If suitable element found - returns it. Otherwise - returns null.
     *
     * @param element Element evaluated against this rule
     * @return Parent element to be deleted
     */
    ContentFilterRule.prototype.searchForParentElement = function (element) {

        if (!this.parentElements || this.parentElements.length === 0) {
            return null;
        }

        var parentElement = element.parentNode;

        for (var i = 0; i < this.parentSearchLevel; i++) {
            if (!parentElement) {
                return null;
            }
            if (this.parentElements.indexOf(parentElement.tagName.toLowerCase()) > 0) {
                return parentElement;
            }
            parentElement = parentElement.parentNode;
        }

        return null;
    };

    /**
     * All content rules markers start with this character
     */
    ContentFilterRule.RULE_MARKER_FIRST_CHAR = '$';

    /**
     * Content rule markers
     */
    ContentFilterRule.RULE_MARKERS = [
        api.FilterRule.MASK_CONTENT_EXCEPTION_RULE,
        api.FilterRule.MASK_CONTENT_RULE
    ];

    api.ContentFilterRule = ContentFilterRule;
    api.Wildcard = Wildcard;

})(adguard, adguard.rules);