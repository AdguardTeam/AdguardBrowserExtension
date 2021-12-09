import { SimpleRegex } from '@adguard/tsurlfilter/dist/es/simple-regex';
import {
    MASK_ALLOWLIST,
    OPTIONS_DELIMITER,
    NETWORK_RULE_OPTIONS,
} from '@adguard/tsurlfilter/dist/es/network-rule-options';
import { CosmeticRuleMarker } from '@adguard/tsurlfilter/dist/es/cosmetic-rule-marker';

import { strings } from '../../../../common/strings';
import { UrlUtils } from './utils';
import { log } from '../../../../common/log';

/**
 * Splits request url by backslash to block or allow patterns
 * @param {string} requestUrl - request event url
 * @param {string} domain - request event domain
 * @param {boolean} isAllowlist - flag determining if patterns would be blocking or allowing
 * @returns {string[]}
 */
export const splitToPatterns = (requestUrl, domain, isAllowlist) => {
    const PATTERNS_COUNT = 2;

    const hierarchicUrl = UrlUtils.isHierarchicUrl(requestUrl);

    let prefix;
    if (hierarchicUrl) {
        prefix = SimpleRegex.MASK_START_URL; // Covers default protocols: http, ws
    } else {
        prefix = UrlUtils.getProtocol(requestUrl); // Covers non-default protocols: stun, turn
    }

    if (isAllowlist) {
        prefix = MASK_ALLOWLIST + prefix;
    }

    const patterns = [];

    const relative = strings.substringAfter(requestUrl, `${domain}/`);

    const path = strings.substringBefore(relative, '?');
    if (path) {
        const parts = path.split('/');

        let pattern = `${domain}/`;
        for (let i = 0; i < Math.min(parts.length - 1, PATTERNS_COUNT); i += 1) {
            pattern += `${parts[i]}/`;
            patterns.push(prefix + pattern);
        }
        const file = parts[parts.length - 1];
        if (file && patterns.length < PATTERNS_COUNT) {
            pattern += file;
            patterns.push(prefix + pattern);
        }
    }

    // add domain pattern to start
    patterns.unshift(prefix + domain + SimpleRegex.MASK_SEPARATOR);

    // add 2LD to start, if it differs from the current one
    const secondLevelDomain = domain.split('.').slice(-2).join('.');
    if (secondLevelDomain !== domain) {
        patterns.unshift(prefix + secondLevelDomain + SimpleRegex.MASK_SEPARATOR);
    }

    // push full url pattern
    const url = UrlUtils.getUrlWithoutScheme(requestUrl);
    if (`${domain}/` !== url) { // Don't duplicate: ||example.com/ and ||example.com^
        if (patterns.indexOf(prefix + url) < 0) {
            patterns.push(prefix + url);
        }
    }

    return patterns.reverse();
};

/**
 * Creates rule blocking document level rules
 * e.g. for rule "@@||example.org^$urlblock" ->
 *      blocking rule would be " @@||example.org^$urlblock,badfilter"
 * @param rule
 * @returns {string}
 */
export const createDocumentLevelBlockRule = (rule) => {
    const { ruleText } = rule;
    if (ruleText.indexOf(OPTIONS_DELIMITER) > -1) {
        return `${ruleText},${NETWORK_RULE_OPTIONS.BADFILTER}`;
    }
    return ruleText + OPTIONS_DELIMITER + NETWORK_RULE_OPTIONS.BADFILTER;
};

/**
 * Generates exception rule with required mask
 * @param ruleText
 * @param mask
 * @returns {*}
 */
const generateExceptionRule = (ruleText, mask) => {
    const insert = (str, index, value) => str.slice(0, index) + value + str.slice(index);

    const maskIndex = ruleText.indexOf(mask);
    const maskLength = mask.length;
    const rulePart = ruleText.slice(maskIndex + maskLength);
    // insert exception mark after first char
    const exceptionMask = insert(mask, 1, '@');
    return exceptionMask + rulePart;
};

/**
 * Creates exception rules for css rules
 * @param rule
 * @param event
 * @returns {string}
 */
export const createExceptionCssRule = (rule, event) => {
    const { ruleText } = rule;
    const domainPart = event.frameDomain;
    if (ruleText.indexOf(CosmeticRuleMarker.Css) > -1) {
        return domainPart + generateExceptionRule(ruleText, CosmeticRuleMarker.Css);
    }
    if (ruleText.indexOf(CosmeticRuleMarker.ElementHidingExtCSS) > -1) {
        return domainPart + generateExceptionRule(
            ruleText,
            CosmeticRuleMarker.ElementHidingExtCSS,
        );
    }
    if (ruleText.indexOf(CosmeticRuleMarker.CssExtCSS) > -1) {
        return domainPart + generateExceptionRule(
            ruleText, CosmeticRuleMarker.CssExtCSS,
        );
    }
    if (ruleText.indexOf(CosmeticRuleMarker.ElementHiding) > -1) {
        return domainPart + generateExceptionRule(ruleText, CosmeticRuleMarker.ElementHiding);
    }

    if (ruleText.indexOf(CosmeticRuleMarker.Html) > -1) {
        return domainPart + generateExceptionRule(ruleText, CosmeticRuleMarker.Html);
    }

    log.error('Cannot createExceptionCssRule for the rule:', rule);

    return '';
};

/**
 * Creates exception rule for blocking script rule
 * @param rule
 * @param event
 * @returns {string}
 */
export const createExceptionScriptRule = (rule, event) => {
    const { ruleText } = rule;
    const domainPart = event.frameDomain;

    if (ruleText.indexOf(CosmeticRuleMarker.Js) > -1) {
        return domainPart + generateExceptionRule(ruleText, CosmeticRuleMarker.Js);
    }

    const MASK_SCRIPT_RULE_UBO = '##';
    if (ruleText.indexOf(MASK_SCRIPT_RULE_UBO) > -1) {
        return domainPart + generateExceptionRule(ruleText, MASK_SCRIPT_RULE_UBO);
    }

    return '';
};

const getBlockDomainRule = (domain, ruleOption) => {
    const { MASK_START_URL, MASK_SEPARATOR } = SimpleRegex;

    return MASK_START_URL
        + domain
        + MASK_SEPARATOR
        + OPTIONS_DELIMITER
        + ruleOption;
};

const getUnblockDomainRule = (domain, ruleOption) => {
    return MASK_ALLOWLIST + getBlockDomainRule(domain, ruleOption);
};

/**
 * Create exception rules for cookie event
 * @param event
 * @returns {string[]} array of patterns
 */
export const createExceptionCookieRules = (event) => {
    const {
        frameDomain,
        cookieName,
        requestRule: { modifierValue },
    } = event;
    const domain = UrlUtils.getCookieDomain(frameDomain);
    const totalUnblockingRule = getUnblockDomainRule(domain, NETWORK_RULE_OPTIONS.COOKIE);

    const patterns = [];
    if (cookieName) {
        patterns.push(getUnblockDomainRule(domain, `${NETWORK_RULE_OPTIONS.COOKIE}=${cookieName}`));
    }
    if (modifierValue
        && modifierValue !== cookieName
    ) {
        patterns.push(getUnblockDomainRule(domain, `${NETWORK_RULE_OPTIONS.COOKIE}=${modifierValue}`));
    }
    patterns.push(totalUnblockingRule);

    return patterns;
};

export const createExceptionRemoveParamRules = (event) => {
    const { frameDomain, requestRule } = event;

    return [
        getUnblockDomainRule(frameDomain, `${NETWORK_RULE_OPTIONS.REMOVEPARAM}=${requestRule.modifierValue}`),
        getUnblockDomainRule(frameDomain, NETWORK_RULE_OPTIONS.REMOVEPARAM),
    ];
};

export const createExceptionRemoveHeaderRules = (event) => {
    const { frameDomain, requestRule } = event;

    return [
        getUnblockDomainRule(frameDomain, `${NETWORK_RULE_OPTIONS.REMOVEHEADER}=${requestRule.modifierValue}`),
        getUnblockDomainRule(frameDomain, NETWORK_RULE_OPTIONS.REMOVEHEADER),
    ];
};

/**
 * Creates blocking rule for cookie event
 * @param event
 * @returns {string}
 */
export const createBlockingCookieRule = (event) => {
    const {
        frameDomain,
        cookieName,
    } = event;
    const domain = UrlUtils.getCookieDomain(frameDomain);
    const blockingRule = getBlockDomainRule(domain, NETWORK_RULE_OPTIONS.COOKIE);

    const patterns = [];
    if (cookieName) {
        patterns.push(getBlockDomainRule(domain, `${NETWORK_RULE_OPTIONS.COOKIE}=${cookieName}`));
    }
    patterns.push(blockingRule);

    return patterns;
};
