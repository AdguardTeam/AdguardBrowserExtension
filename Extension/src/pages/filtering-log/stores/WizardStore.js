import {
    action, computed, makeObservable, observable,
} from 'mobx';
import { StringUtils, UrlUtils } from '../components/RequestWizard/RequestBlock/utils';
import { RULE_OPTIONS } from '../components/RequestWizard/constants';

export const WIZARD_STATES = {
    VIEW_REQUEST: 'view.request',
    BLOCK_REQUEST: 'block.request',
    UNBLOCK_REQUEST: 'unblock.request',
};

// FIXME move to the separate file with constants
const UrlFilterRule = {
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

// FIXME move to the separate file with constants
const FilterRule = {
    MASK_WHITE_LIST: '@@',
    MASK_CSS_RULE: '##',
    MASK_CSS_INJECT_RULE: '#$#',
    MASK_CSS_EXTENDED_CSS_RULE: '#?#',
    MASK_CSS_INJECT_EXTENDED_CSS_RULE: '#$?#',
    MASK_SCRIPT_RULE: '#%#',
    MASK_SCRIPT_RULE_UBO: '##',
};

// FIXME whitelist rule
const splitToPatterns = (requestUrl, domain, whitelist) => {
    const PATTERNS_COUNT = 2;

    const hierarchicUrl = UrlUtils.isHierarchicUrl(requestUrl);
    const protocol = UrlUtils.getProtocol(requestUrl);

    let prefix;
    if (hierarchicUrl) {
        prefix = UrlFilterRule.MASK_START_URL; // Covers default protocols: http, ws
    } else {
        prefix = `${protocol}:`; // Covers non-default protocols: stun, turn
    }

    if (whitelist) {
        prefix = FilterRule.MASK_WHITE_LIST + prefix;
    }

    const patterns = [];

    const relative = StringUtils.substringAfter(requestUrl, `${domain}/`);

    const path = StringUtils.substringBefore(relative, '?');
    if (path) {
        const parts = path.split('/');

        let pattern = `${domain}/`;
        for (let i = 0; i < Math.min(parts.length - 1, PATTERNS_COUNT); i += 1) {
            pattern += `${parts[i]}/`;
            patterns.push(prefix + pattern + UrlFilterRule.MASK_ANY_SYMBOL);
        }
        const file = parts[parts.length - 1];
        if (file && patterns.length < PATTERNS_COUNT) {
            pattern += file;
            patterns.push(prefix + pattern);
        }
    }

    // add domain pattern to start
    patterns.unshift(prefix + domain + UrlFilterRule.MASK_SEPARATOR);

    // push full url pattern
    const url = UrlUtils.getUrlWithoutScheme(requestUrl);
    if (`${domain}/` !== url) { // Don't duplicate: ||example.com/ and ||example.com^
        if (patterns.indexOf(prefix + url) < 0) {
            patterns.push(prefix + url);
        }
    }

    return patterns.reverse();
};

class WizardStore {
    @observable
    isModalOpen = false;

    @observable
    requestModalState = WIZARD_STATES.VIEW_REQUEST;

    @observable
    rulePattern = '';

    @observable
    ruleOptions = {
        [RULE_OPTIONS.RULE_DOMAIN]: { checked: false },
        [RULE_OPTIONS.RULE_MATCH_CASE]: { checked: false },
        [RULE_OPTIONS.RULE_THIRD_PARTY]: { checked: false },
        [RULE_OPTIONS.RULE_IMPORTANT]: { checked: false },
    }

    constructor(rootStore) {
        this.rootStore = rootStore;
        makeObservable(this);
    }

    @action
    openModal() {
        this.isModalOpen = true;
        this.requestModalState = WIZARD_STATES.VIEW_REQUEST;
    }

    @action
    closeModal() {
        this.isModalOpen = false;
        this.requestModalState = WIZARD_STATES.VIEW_REQUEST;
    }

    @action
    setBlockState() {
        this.requestModalState = WIZARD_STATES.BLOCK_REQUEST;
    }

    @action
    setViewState() {
        this.requestModalState = WIZARD_STATES.VIEW_REQUEST;
    }

    @action
    setRulePattern(rulePattern) {
        this.rulePattern = rulePattern;
    }

    @computed
    get rule() {
        return this.rulePattern;
    }

    @computed
    get rulePatterns() {
        const { selectedEvent } = this.rootStore.logStore;
        const patterns = splitToPatterns(selectedEvent.requestUrl, selectedEvent.frameDomain);
        this.setRulePattern(patterns[0]);
        return patterns;
    }

    @action
    setRuleOptionState(optionId, checked) {
        this.ruleOptions[optionId] = checked;
    }
}

export { WizardStore };
