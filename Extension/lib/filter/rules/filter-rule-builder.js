var StringUtils = require('../../../lib/utils/common').StringUtils;
var FilterRule = require('../../../lib/filter/rules/base-filter-rule').FilterRule;
var Log = require('../../../lib/utils/log').Log;

/**
 * Filter classes enumeration
 */
var classes = null;
function getClasses() {
    if (!classes) {
        classes = {
            CssFilterRule: require('../../../lib/filter/rules/css-filter-rule').CssFilterRule,
            UrlFilterRule: require('../../../lib/filter/rules/url-filter-rule').UrlFilterRule,
            ScriptFilterRule: require('../../../lib/filter/rules/script-filter-rule').ScriptFilterRule
        }
    }
    return classes;
}

exports.FilterRuleBuilder = {

    /**
     * Method that parses rule text and creates object of a suitable class.
     *
     * @param ruleText Rule text
     * @param filterId Filter identifier
     * @returns Filter rule object. Either UrlFilterRule or CssFilterRule or ScriptFilterRule.
     */
    createRule: function (ruleText, filterId) {

        ruleText = ruleText ? ruleText.trim() : null;
        if (!ruleText) {
            return null;
        }
        var rule = null;
        try {
            if (StringUtils.startWith(ruleText, FilterRule.COMMENT) ||
                StringUtils.contains(ruleText, FilterRule.OLD_INJECT_RULES) ||
                StringUtils.contains(ruleText, FilterRule.MASK_CONTENT_RULE) ||
                StringUtils.contains(ruleText, FilterRule.MASK_JS_RULE)) {
                // Empty or comment, ignore
                // Content rules are not supported
                return null;
            }

            var CssFilterRule = getClasses().CssFilterRule;
            var UrlFilterRule = getClasses().UrlFilterRule;
            var ScriptFilterRule = getClasses().ScriptFilterRule;
            if (StringUtils.startWith(ruleText, FilterRule.MASK_WHITE_LIST)) {
                rule = new UrlFilterRule(ruleText, filterId);
            } else if (StringUtils.contains(ruleText, FilterRule.MASK_CSS_RULE) || StringUtils.contains(ruleText, FilterRule.MASK_CSS_EXCEPTION_RULE)) {
                rule = new CssFilterRule(ruleText, filterId);
            } else if (StringUtils.contains(ruleText, FilterRule.MASK_CSS_INJECT_RULE) || StringUtils.contains(ruleText, FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE)) {
                rule = new CssFilterRule(ruleText, filterId);
            } else if (StringUtils.contains(ruleText, FilterRule.MASK_SCRIPT_RULE) || StringUtils.contains(ruleText, FilterRule.MASK_SCRIPT_EXCEPTION_RULE)) {
                rule = new ScriptFilterRule(ruleText, filterId);
            } else {
                rule = new UrlFilterRule(ruleText, filterId);
            }
        } catch (ex) {
            Log.warn("Cannot create rule from filter {0}: {1}, cause {2}", filterId, ruleText, ex);
        }
        return rule;
    }
};
