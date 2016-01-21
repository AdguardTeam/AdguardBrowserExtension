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

/**
 * Adguard rules constructor library
 */
var AdguardRulesConstructorLib = {

    createRuleText: function (element) {
        if (!element) {
            return;
        }

        var selector = Adguard.makeCssNthChildFilter(element);
        return selector ? "##" + selector : "";
    },

    createSimilarRuleText: function (element) {
        if (!element) {
            return "";
        }

        var className = element.className;
        if (!className) {
            return "";
        }

        var selector = className.trim().replace(/\s+/g, ', .');
        return selector ? "##" + '.' + selector : "";
    },

    constructRuleText : function (element, isBlockByUrl, isBlockSimilar, isBlockOneDomain, domain) {
        if (isBlockByUrl) {
            var blockUrlRuleText = this._constructUrlBlockRuleText(element, isBlockOneDomain, domain);
            if (blockUrlRuleText) {
                return blockUrlRuleText;
            }
        }

        var result;
        if (isBlockSimilar) {
            result = this.createSimilarRuleText(element);
        } else {
            result = this.createRuleText(element);
        }

        if (!isBlockOneDomain) {
            result = domain + result;
        }

        return result;
    },

    _constructUrlBlockRuleText: function (element, oneDomain, domain) {
        var urlMask = getUrlBlockAttribute(element);
        if (!urlMask || urlMask == '') {
            return null;
        }

        var blockUrlRuleText = urlMask.replace(/^http:\/\/(www\.)?/, "||");
        if (blockUrlRuleText.indexOf('.') == 0) {
            blockUrlRuleText = blockUrlRuleText.substring(1);
        }

        if (!oneDomain) {
            blockUrlRuleText = blockUrlRuleText + "$" + "domain=" + domain;
        }

        return blockUrlRuleText;
    }
};