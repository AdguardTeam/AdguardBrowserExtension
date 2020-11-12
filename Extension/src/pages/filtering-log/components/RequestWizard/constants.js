export const RULE_OPTIONS = {
    RULE_DOMAIN: 'ruleDomain',
    RULE_IMPORTANT: 'ruleImportant',
    RULE_MATCH_CASE: 'ruleMatchCase',
    RULE_THIRD_PARTY: 'ruleThirdParty',
};

export const UrlFilterRule = {
    CSP_OPTION: 'csp',
    MASK_SEPARATOR: '^',
    MASK_START_URL: '||',
    MASK_ANY_SYMBOL: '*',
    OPTIONS_DELIMITER: '$',
    DOMAIN_OPTION: 'domain',
    WEBRTC_OPTION: 'webrtc',
    COOKIE_OPTION: 'cookie',
    STEALTH_OPTION: 'stealth',
    REPLACE_OPTION: 'replace',
    REDIRECT_OPTION: 'redirect',
    IMPORTANT_OPTION: 'important',
    WEBSOCKET_OPTION: 'websocket',
    BADFILTER_OPTION: 'badfilter',
    MATCH_CASE_OPTION: 'match-case',
    THIRD_PARTY_OPTION: 'third-party',
};

export const FilterRule = {
    MASK_CSS_RULE: '##',
    MASK_ALLOWLIST: '@@',
    MASK_SCRIPT_RULE: '#%#',
    MASK_SCRIPT_RULE_UBO: '##',
    MASK_CSS_INJECT_RULE: '#$#',
    MASK_CSS_EXTENDED_CSS_RULE: '#?#',
    MASK_CSS_INJECT_EXTENDED_CSS_RULE: '#$?#',
};

// FIXME move into separate file
export const USER_FILTER_ID = 0;

// FIXME rename WHITE_LIST_FILTER_ID to ALLOWLIST_FILTER_ID and move to the constants
export const ALLOWLIST_FILTER_ID = 100;
