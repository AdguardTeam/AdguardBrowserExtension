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

import {
    SimpleRegex,
    CosmeticRuleMarker,
    NetworkRule,
} from '@adguard/tsurlfilter';

import { strings } from '../../../../common/strings';
import { UrlUtils } from './utils';
import { Log } from '../../../../common/log';

/**
 * Splits request url by backslash to block or allow patterns
 *
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
        prefix = NetworkRule.MASK_ALLOWLIST + prefix;
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
 *
 * @param rule
 * @returns {string}
 */
export const createDocumentLevelBlockRule = (rule) => {
    const { ruleText } = rule;
    if (ruleText.indexOf(NetworkRule.OPTIONS_DELIMITER) > -1) {
        return `${ruleText},${NetworkRule.OPTIONS.BADFILTER}`;
    }
    return ruleText + NetworkRule.OPTIONS_DELIMITER + NetworkRule.OPTIONS.BADFILTER;
};

/**
 * Generates exception rule with required mask
 *
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
 *
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

    Log.error('Cannot createExceptionCssRule for the rule:', rule);

    return '';
};

/**
 * Creates exception rule for blocking script rule
 *
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
        + NetworkRule.OPTIONS_DELIMITER
        + ruleOption;
};

const getUnblockDomainRule = (domain, ruleOption) => {
    return NetworkRule.MASK_ALLOWLIST + getBlockDomainRule(domain, ruleOption);
};

/**
 * Create exception rules for cookie event
 *
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
    const totalUnblockingRule = getUnblockDomainRule(domain, NetworkRule.OPTIONS.COOKIE);

    const patterns = [];
    if (cookieName) {
        patterns.push(getUnblockDomainRule(domain, `${NetworkRule.OPTIONS.COOKIE}=${cookieName}`));
    }
    if (modifierValue
        && modifierValue !== cookieName
    ) {
        patterns.push(getUnblockDomainRule(domain, `${NetworkRule.OPTIONS.COOKIE}=${modifierValue}`));
    }
    patterns.push(totalUnblockingRule);

    return patterns;
};

export const createExceptionRemoveParamRules = (event) => {
    const { frameDomain, requestRule } = event;

    return [
        getUnblockDomainRule(frameDomain, `${NetworkRule.OPTIONS.REMOVEPARAM}=${requestRule.modifierValue}`),
        getUnblockDomainRule(frameDomain, NetworkRule.OPTIONS.REMOVEPARAM),
    ];
};

export const createExceptionRemoveHeaderRules = (event) => {
    const { frameDomain, requestRule } = event;

    return [
        getUnblockDomainRule(frameDomain, `${NetworkRule.OPTIONS.REMOVEHEADER}=${requestRule.modifierValue}`),
        getUnblockDomainRule(frameDomain, NetworkRule.OPTIONS.REMOVEHEADER),
    ];
};

/**
 * Creates blocking rule for cookie event
 *
 * @param event
 * @returns {string}
 */
export const createBlockingCookieRule = (event) => {
    const {
        frameDomain,
        cookieName,
    } = event;
    const domain = UrlUtils.getCookieDomain(frameDomain);
    const blockingRule = getBlockDomainRule(domain, NetworkRule.OPTIONS.COOKIE);

    const patterns = [];
    if (cookieName) {
        patterns.push(getBlockDomainRule(domain, `${NetworkRule.OPTIONS.COOKIE}=${cookieName}`));
    }
    patterns.push(blockingRule);

    return patterns;
};
