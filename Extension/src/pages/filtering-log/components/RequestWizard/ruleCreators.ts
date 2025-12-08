/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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
    NetworkRule,
    NETWORK_RULE_OPTIONS,
    OPTIONS_DELIMITER,
} from '@adguard/tsurlfilter';

import { type FilteringEventRuleData, type FilteringLogEvent } from '../../../../background/api';
import { strings } from '../../../../common/strings';
import { logger } from '../../../../common/logger';
import { type RuleCreationOptions } from '../../types';

import { COMMA_DELIMITER } from './constants';
import { UrlUtils } from './utils';

/**
 * Possible cosmetic rule markers.
 */
enum CosmeticRuleMarker {
    Css = '#$#',
    ElementHidingExtCSS = '#?#',
    CssExtCSS = '#$?#',
    ElementHiding = '##',
    Js = '#%#',
    Html = '$$',
}

/**
 * Splits request url by backslash to block or allow patterns.
 *
 * @param requestUrl Request event url.
 * @param domain Request event domain.
 * @param isAllowlist Flag determining if patterns would be blocking or allowing.
 *
 * @returns Array of patterns.
 */
export const splitToPatterns = (requestUrl: string, domain: string, isAllowlist: boolean): string[] => {
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
 *
 * @returns {string}
 */
export const createDocumentLevelBlockRule = (rule: FilteringEventRuleData) => {
    const { appliedRuleText } = rule;
    if (appliedRuleText && appliedRuleText.indexOf(NetworkRule.OPTIONS_DELIMITER) > -1) {
        return `${appliedRuleText},${NetworkRule.OPTIONS.BADFILTER}`;
    }
    return appliedRuleText + NetworkRule.OPTIONS_DELIMITER + NetworkRule.OPTIONS.BADFILTER;
};

/**
 * Generates exception rule with required mask.
 *
 * @param appliedRuleText Rule text.
 * @param mask Mask to be inserted.
 *
 * @returns Exception rule.
 */
const generateExceptionRule = (appliedRuleText: string, mask: CosmeticRuleMarker): string => {
    const insert = (str: CosmeticRuleMarker, index: number, value: string) => {
        return str.slice(0, index) + value + str.slice(index);
    };

    const maskIndex = appliedRuleText.indexOf(mask);
    const maskLength = mask.length;
    const rulePart = appliedRuleText.slice(maskIndex + maskLength);
    // insert exception mark after first char
    const exceptionMask = insert(mask, 1, '@');
    return exceptionMask + rulePart;
};

/**
 * Creates exception rules for css rule.
 *
 * @param rule Css rule.
 * @param event Filtering log event.
 *
 * @returns Exception rule for css rule.
 */
export const createExceptionCssRule = (
    rule: FilteringEventRuleData | undefined,
    event: FilteringLogEvent,
): string => {
    if (!rule || !rule.appliedRuleText) {
        logger.error(`[ext.ruleCreators]: cannot create css exception rule for an event with id: ${event.eventId} because rule is not defined or appliedRuleText is not defined.`);
        return '';
    }

    const { appliedRuleText } = rule;
    const domainPart = event.frameDomain;

    if (appliedRuleText.indexOf(CosmeticRuleMarker.Css) > -1) {
        return domainPart + generateExceptionRule(appliedRuleText, CosmeticRuleMarker.Css);
    }

    if (appliedRuleText.indexOf(CosmeticRuleMarker.ElementHidingExtCSS) > -1) {
        return domainPart + generateExceptionRule(
            appliedRuleText,
            CosmeticRuleMarker.ElementHidingExtCSS,
        );
    }

    if (appliedRuleText.indexOf(CosmeticRuleMarker.CssExtCSS) > -1) {
        return domainPart + generateExceptionRule(appliedRuleText, CosmeticRuleMarker.CssExtCSS);
    }

    if (appliedRuleText.indexOf(CosmeticRuleMarker.ElementHiding) > -1) {
        return domainPart + generateExceptionRule(appliedRuleText, CosmeticRuleMarker.ElementHiding);
    }

    if (appliedRuleText.indexOf(CosmeticRuleMarker.Html) > -1) {
        return domainPart + generateExceptionRule(appliedRuleText, CosmeticRuleMarker.Html);
    }

    logger.error('[ext.ruleCreators]: cannot createExceptionCssRule for the rule:', rule);

    return '';
};

/**
 * Creates exception rule for blocking script rule
 *
 * @param rule
 * @param event
 *
 * @returns {string}
 */
export const createExceptionScriptRule = (
    rule: FilteringEventRuleData | undefined,
    event: FilteringLogEvent,
): string => {
    if (!rule || !rule.appliedRuleText) {
        logger.error(`[ext.ruleCreators]: cannot create exception blocking script rule for an event with id: ${event.eventId} because rule is not defined or appliedRuleText is not defined.`);
        return '';
    }

    const { appliedRuleText } = rule;

    const domainPart = event.frameDomain;

    if (appliedRuleText.indexOf(CosmeticRuleMarker.Js) > -1) {
        return domainPart + generateExceptionRule(appliedRuleText, CosmeticRuleMarker.Js);
    }

    const MASK_SCRIPT_RULE_UBO = CosmeticRuleMarker.ElementHiding;
    if (appliedRuleText.indexOf(MASK_SCRIPT_RULE_UBO) > -1) {
        return domainPart + generateExceptionRule(appliedRuleText, MASK_SCRIPT_RULE_UBO);
    }

    return '';
};

const getBlockDomainRule = (domain: string, ruleOption: string) => {
    const { MASK_START_URL, MASK_SEPARATOR } = SimpleRegex;
    return `${MASK_START_URL}${domain}${MASK_SEPARATOR}${NetworkRule.OPTIONS_DELIMITER}${ruleOption}`;
};

const getUnblockDomainRule = (rawDomain: string | undefined, ruleOption: string) => {
    const domain = rawDomain || '';
    return NetworkRule.MASK_ALLOWLIST + getBlockDomainRule(domain, ruleOption);
};

/**
 * Creates exception rules for cookie event.
 *
 * @param event Filtering log event.
 *
 * @returns Array of patterns.
 */
export const createExceptionCookieRules = (event: FilteringLogEvent): string[] => {
    const {
        frameDomain,
        cookieName,
        requestRule,
    } = event;

    const patterns = [];
    const domain = UrlUtils.getCookieDomain(frameDomain);

    if (cookieName) {
        patterns.push(getUnblockDomainRule(domain, `${NetworkRule.OPTIONS.COOKIE}=${cookieName}`));
    }

    if (
        requestRule
        && requestRule.modifierValue
        && requestRule.modifierValue !== cookieName
    ) {
        patterns.push(getUnblockDomainRule(domain, `${NetworkRule.OPTIONS.COOKIE}=${requestRule.modifierValue}`));
    }

    patterns.push(getUnblockDomainRule(domain, NetworkRule.OPTIONS.COOKIE));

    return patterns;
};

// TODO: these could be refactored into one createExceptionAdvancedModifierRules
export const createExceptionRemoveParamRules = (event: FilteringLogEvent): string[] => {
    const { frameDomain, requestRule } = event;
    const patterns = [];

    if (requestRule && requestRule.modifierValue) {
        patterns.push(getUnblockDomainRule(frameDomain, `${NetworkRule.OPTIONS.REMOVEPARAM}=${requestRule.modifierValue}`));
    }

    patterns.push(getUnblockDomainRule(frameDomain, NetworkRule.OPTIONS.REMOVEPARAM));

    return patterns;
};

export const createExceptionRemoveHeaderRules = (event: FilteringLogEvent): string[] => {
    const { frameDomain, requestRule } = event;
    const patterns = [];

    if (requestRule && requestRule.modifierValue) {
        patterns.push(getUnblockDomainRule(frameDomain, `${NetworkRule.OPTIONS.REMOVEHEADER}=${requestRule.modifierValue}`));
    }

    patterns.push(getUnblockDomainRule(frameDomain, NetworkRule.OPTIONS.REMOVEHEADER));

    return patterns;
};

export const createExceptionCspRules = (event: FilteringLogEvent): string[] => {
    const { frameDomain, requestRule } = event;
    const patterns = [];

    if (requestRule && requestRule.modifierValue) {
        patterns.push(getUnblockDomainRule(frameDomain, `${NetworkRule.OPTIONS.CSP}=${requestRule.modifierValue}`));
    }

    patterns.push(getUnblockDomainRule(frameDomain, NetworkRule.OPTIONS.CSP));

    return patterns;
};

/**
 * Creates blocking rule for cookie event
 *
 * @param event
 *
 * @returns {string}
 */
export const createBlockingCookieRule = (event: FilteringLogEvent) => {
    const {
        frameDomain,
        cookieName,
    } = event;

    const patterns = [];
    const domain = UrlUtils.getCookieDomain(frameDomain);
    const blockingRule = getBlockDomainRule(domain, NetworkRule.OPTIONS.COOKIE);

    if (cookieName) {
        patterns.push(getBlockDomainRule(domain, `${NetworkRule.OPTIONS.COOKIE}=${cookieName}`));
    }
    patterns.push(blockingRule);

    return patterns;
};

type RuleCreationParams = {
    urlPattern?: string;
    rulePattern?: string;
    urlDomain?: string | null;
    thirdParty?: boolean;
    important?: boolean;
    removeParam?: boolean;
};

export const createRuleFromParams = ({
    urlPattern,
    urlDomain,
    thirdParty,
    important,
    removeParam,
}: RuleCreationParams): string => {
    let appliedRuleText = urlPattern || '';

    const options = [];

    // add domain option
    if (urlDomain) {
        options.push(`${NETWORK_RULE_OPTIONS.DOMAIN}=${urlDomain}`);
    }
    // add important option
    if (important) {
        options.push(NETWORK_RULE_OPTIONS.IMPORTANT);
    }
    // add third party option
    if (thirdParty) {
        options.push(NETWORK_RULE_OPTIONS.THIRD_PARTY);
    }
    // add removeparam option
    if (removeParam) {
        options.push(NETWORK_RULE_OPTIONS.REMOVEPARAM);
    }

    if (options.length > 0) {
        // Pick correct symbol to append options with
        const hasOptions = appliedRuleText.includes(OPTIONS_DELIMITER);
        const prefix = hasOptions
            ? COMMA_DELIMITER
            : OPTIONS_DELIMITER;
        appliedRuleText += prefix + options.join(COMMA_DELIMITER);
    }

    return appliedRuleText;
};

export const createCssRuleFromParams = (urlPattern: string, permitDomain: boolean): string => {
    let appliedRuleText = urlPattern;
    if (!permitDomain) {
        appliedRuleText = appliedRuleText.slice(appliedRuleText.indexOf('#'));
    }

    return appliedRuleText;
};

export const createCookieRuleFromParams = ({
    rulePattern,
    thirdParty,
    important,
}: RuleCreationParams) => {
    let appliedRuleText = rulePattern;

    const options = [];

    // add important option
    if (important) {
        options.push(NETWORK_RULE_OPTIONS.IMPORTANT);
    }
    // add third party option
    if (thirdParty) {
        options.push(NETWORK_RULE_OPTIONS.THIRD_PARTY);
    }
    if (options.length > 0) {
        appliedRuleText += COMMA_DELIMITER + options.join(COMMA_DELIMITER);
    }

    return appliedRuleText;
};

export const getRuleText = (
    selectedEvent: FilteringLogEvent | null,
    rulePattern: string,
    ruleOptions: RuleCreationOptions,
) => {
    if (!selectedEvent) {
        return '';
    }

    const {
        ruleDomain,
        ruleImportant,
        ruleThirdParty,
        ruleRemoveParam,
    } = ruleOptions;

    const permitDomain = !ruleDomain?.checked;
    const important = !!ruleImportant?.checked;
    const thirdParty = !!ruleThirdParty?.checked;
    const removeParam = !!ruleRemoveParam?.checked;

    const domain = permitDomain ? selectedEvent.frameDomain : null;

    let appliedRuleText;
    if (selectedEvent.element) {
        appliedRuleText = createCssRuleFromParams(rulePattern, permitDomain);
    } else if (selectedEvent.cookieName) {
        appliedRuleText = createCookieRuleFromParams({
            rulePattern,
            thirdParty,
            important,
        });
    } else if (selectedEvent.script || selectedEvent?.requestRule?.documentLevelRule) {
        appliedRuleText = createRuleFromParams({ urlPattern: rulePattern });
    } else {
        appliedRuleText = createRuleFromParams({
            urlPattern: rulePattern,
            urlDomain: domain,
            thirdParty,
            important,
            removeParam,
        });
    }

    return appliedRuleText;
};
