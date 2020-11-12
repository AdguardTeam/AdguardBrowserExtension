import {
    action,
    computed,
    observable,
    makeObservable,
} from 'mobx';

import { RULE_OPTIONS, UrlFilterRule } from '../components/RequestWizard/constants';
import { splitToPatterns } from '../components/RequestWizard/utils';

export const WIZARD_STATES = {
    VIEW_REQUEST: 'view.request',
    BLOCK_REQUEST: 'block.request',
    UNBLOCK_REQUEST: 'unblock.request',
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
        // FIXME update ruleOptions checkboxes respectively, set all for example false
    }

    @action
    closeModal = () => {
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

    createRuleFromParams = (urlPattern, urlDomain, matchCase, thirdParty, important, mandatoryOptions) => {
        let ruleText = urlPattern;

        let options = [];

        // add domain option
        if (urlDomain) {
            options.push(`${UrlFilterRule.DOMAIN_OPTION}=${urlDomain}`);
        }
        // add important option
        if (important) {
            options.push(UrlFilterRule.IMPORTANT_OPTION);
        }
        // add match case option
        if (matchCase) {
            options.push(UrlFilterRule.MATCH_CASE_OPTION);
        }
        // add third party option
        if (thirdParty) {
            options.push(UrlFilterRule.THIRD_PARTY_OPTION);
        }
        if (mandatoryOptions) {
            options = options.concat(mandatoryOptions);
        }
        if (options.length > 0) {
            ruleText += UrlFilterRule.OPTIONS_DELIMITER + options.join(',');
        }

        return ruleText;
    };

    createCssRuleFromParams = (urlPattern, permitDomain) => {
        let ruleText = urlPattern;
        if (!permitDomain) {
            ruleText = ruleText.slice(ruleText.indexOf('#'));
        }

        return ruleText;
    };

    getRuleText(selectedEvent, rulePattern, ruleOptions) {
        const {
            ruleDomain,
            ruleImportant,
            ruleMatchCase,
            ruleThirdParty,
        } = ruleOptions;

        const permitDomain = !ruleDomain.checked;
        const important = !!ruleImportant.checked;
        const matchCase = !!ruleMatchCase.checked;
        const thirdParty = !!ruleThirdParty.checked;

        const domain = permitDomain ? selectedEvent.frameDomain : null;

        let mandatoryOptions = null;

        // Deal with csp rule
        const { requestRule } = selectedEvent;
        if (requestRule && requestRule.cspRule) {
            mandatoryOptions = [UrlFilterRule.CSP_OPTION];
        }

        if (requestRule && requestRule.cookieRule) {
            mandatoryOptions = [UrlFilterRule.COOKIE_OPTION];
        }

        if (selectedEvent.requestUrl === 'content-security-policy-check') {
            mandatoryOptions = [UrlFilterRule.WEBRTC_OPTION, UrlFilterRule.WEBSOCKET_OPTION];
        }

        if (selectedEvent.replaceRules) {
            mandatoryOptions = [UrlFilterRule.REPLACE_OPTION];
        }

        let ruleText;
        if (selectedEvent.element) {
            ruleText = this.createCssRuleFromParams(rulePattern, permitDomain);
        } else if (selectedEvent.cookieName) {
            ruleText = this.createRuleFromParams(
                rulePattern,
                null,
                null,
                thirdParty,
                important,
                mandatoryOptions,
            );
        } else if (selectedEvent.script) {
            ruleText = this.createRuleFromParams(rulePattern);
        } else {
            ruleText = this.createRuleFromParams(
                rulePattern,
                domain,
                matchCase,
                thirdParty,
                important,
                mandatoryOptions,
            );
        }

        return ruleText;
    }

    @computed
    get rule() {
        const { logStore } = this.rootStore;
        return this.getRuleText(logStore.selectedEvent, this.rulePattern, this.ruleOptions);
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
        this.ruleOptions[optionId].checked = checked;
    }
}

export { WizardStore };
