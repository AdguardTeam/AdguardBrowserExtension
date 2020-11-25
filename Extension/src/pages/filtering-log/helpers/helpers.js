import { FilterRule, UrlFilterRule } from '../components/RequestWizard/constants';

export const createDocumentLevelBlockRule = (rule) => {
    const { ruleText } = rule;
    if (ruleText.indexOf(UrlFilterRule.OPTIONS_DELIMITER) > -1) {
        return `${ruleText},${UrlFilterRule.BADFILTER_OPTION}`;
    }
    return ruleText + UrlFilterRule.OPTIONS_DELIMITER + UrlFilterRule.BADFILTER_OPTION;
};

const generateExceptionRule = (ruleText, mask) => {
    const insert = (str, index, value) => str.slice(0, index) + value + str.slice(index);

    const maskIndex = ruleText.indexOf(mask);
    const maskLength = mask.length;
    const rulePart = ruleText.slice(maskIndex + maskLength);
    // insert exception mark after first char
    const exceptionMask = insert(mask, 1, '@');
    return exceptionMask + rulePart;
};

// eslint-disable-next-line consistent-return
export const createExceptionCssRule = (rule, event) => {
    const { ruleText } = rule;
    const domainPart = event.frameDomain;
    if (ruleText.indexOf(FilterRule.MASK_CSS_INJECT_RULE) > -1) {
        return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_CSS_INJECT_RULE);
    }
    if (ruleText.indexOf(FilterRule.MASK_CSS_EXTENDED_CSS_RULE) > -1) {
        return domainPart + generateExceptionRule(
            ruleText,
            FilterRule.MASK_CSS_EXTENDED_CSS_RULE,
        );
    }
    if (ruleText.indexOf(FilterRule.MASK_CSS_INJECT_EXTENDED_CSS_RULE) > -1) {
        return domainPart + generateExceptionRule(
            ruleText, FilterRule.MASK_CSS_INJECT_EXTENDED_CSS_RULE,
        );
    }
    if (ruleText.indexOf(FilterRule.MASK_CSS_RULE) > -1) {
        return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_CSS_RULE);
    }
};

export const createExceptionCookieRule = (rule, event) => {
    let domain = event.frameDomain;
    if (domain[0] === '.') {
        domain = domain.substring(1);
    }
    return FilterRule.MASK_WHITE_LIST + UrlFilterRule.MASK_START_URL + domain;
};

// eslint-disable-next-line consistent-return
export const createExceptionScriptRule = (rule, event) => {
    const { ruleText } = rule;
    const domainPart = event.frameDomain;
    if (ruleText.indexOf(FilterRule.MASK_SCRIPT_RULE) > -1) {
        return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_SCRIPT_RULE);
    }
    if (ruleText.indexOf(FilterRule.MASK_SCRIPT_RULE_UBO) > -1) {
        return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_SCRIPT_RULE_UBO);
    }
};
