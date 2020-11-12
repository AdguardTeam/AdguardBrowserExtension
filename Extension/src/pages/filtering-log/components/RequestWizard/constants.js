export const RULE_OPTIONS = {
    RULE_DOMAIN: 'ruleDomain',
    RULE_MATCH_CASE: 'ruleMatchCase',
    RULE_THIRD_PARTY: 'ruleThirdParty',
    RULE_IMPORTANT: 'ruleImportant',
};

export const UrlFilterRule = {
    MASK_START_URL: '||',
    MASK_ANY_SYMBOL: '*',
    MASK_SEPARATOR: '^',
    DOMAIN_OPTION: 'domain',
    IMPORTANT_OPTION: 'important',
    MATCH_CASE_OPTION: 'match-case',
    THIRD_PARTY_OPTION: 'third-party',
    OPTIONS_DELIMITER: '$',
    CSP_OPTION: 'csp',
    WEBRTC_OPTION: 'webrtc',
    WEBSOCKET_OPTION: 'websocket',
    COOKIE_OPTION: 'cookie',
    STEALTH_OPTION: 'stealth',
    REPLACE_OPTION: 'replace',
    REDIRECT_OPTION: 'redirect',
    BADFILTER_OPTION: 'badfilter',
};

export const FilterRule = {
    MASK_WHITE_LIST: '@@', // FIXME rename to MASK_ALLOWLIST
    MASK_CSS_RULE: '##',
    MASK_CSS_INJECT_RULE: '#$#',
    MASK_CSS_EXTENDED_CSS_RULE: '#?#',
    MASK_CSS_INJECT_EXTENDED_CSS_RULE: '#$?#',
    MASK_SCRIPT_RULE: '#%#',
    MASK_SCRIPT_RULE_UBO: '##',
};
