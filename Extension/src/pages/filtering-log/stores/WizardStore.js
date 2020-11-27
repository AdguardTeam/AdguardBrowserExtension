import {
    action,
    computed,
    observable,
    makeObservable,
} from 'mobx';

import { RULE_OPTIONS, UrlFilterRule, FilterRule } from '../components/RequestWizard/constants';
import {
    createDocumentLevelBlockRule,
    createExceptionCookieRule,
    createExceptionCssRule,
    createExceptionScriptRule,
    splitToPatterns,
} from '../components/RequestWizard/utils';
import { messenger } from '../../services/messenger';

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
    ruleText = null;

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
    updateRuleOptions() {
        const { selectedEvent } = this.rootStore.logStore;
        const { isThirdPartyRequest, frameDomain } = selectedEvent;

        // set rule options to defaults
        Object.values(RULE_OPTIONS).forEach((option) => {
            this.ruleOptions[option].checked = false;
        });

        if (selectedEvent.requestRule
            && (selectedEvent.requestRule.whitelistRule || selectedEvent.requestRule.isImportant)) {
            this.ruleOptions[RULE_OPTIONS.RULE_IMPORTANT].checked = true;
        }

        if (isThirdPartyRequest && !frameDomain) {
            this.ruleOptions[RULE_OPTIONS.RULE_THIRD_PARTY].checked = true;
        }

        if (selectedEvent.requestRule && selectedEvent.requestRule.documentLevelRule) {
            this.ruleOptions[RULE_OPTIONS.RULE_DOMAIN].checked = true;
            this.ruleOptions[RULE_OPTIONS.RULE_IMPORTANT].checked = false;
        }
    }

    @action
    openModal() {
        this.isModalOpen = true;
        this.requestModalState = WIZARD_STATES.VIEW_REQUEST;
        this.updateRuleOptions();
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
    setUnblockState() {
        this.requestModalState = WIZARD_STATES.UNBLOCK_REQUEST;
    }

    @action
    removeFromAllowlistHandler = async () => {
        const { selectedTabId } = this.rootStore.logStore;
        const { frameInfo } = await messenger.getTabFrameInfoById(selectedTabId);

        if (!frameInfo) {
            return;
        }

        await messenger.unAllowlistFrame(frameInfo);

        this.closeModal();
    }

    @action
    removeFromUserFilterHandler = async (filteringEvent) => {
        const { requestRule } = filteringEvent;

        await messenger.removeUserRule(requestRule.ruleText);

        this.closeModal();
    }

    @action
    setViewState() {
        this.requestModalState = WIZARD_STATES.VIEW_REQUEST;
    }

    @action
    setRulePattern(rulePattern) {
        // on every rule pattern change we reset rule text inserted manually
        this.ruleText = null;
        this.rulePattern = rulePattern;
    }

    @action
    setRuleText(ruleText) {
        this.ruleText = ruleText;
    }

    createRuleFromParams = (
        urlPattern,
        urlDomain,
        matchCase,
        thirdParty,
        important,
        mandatoryOptions,
    ) => {
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
        if (this.ruleText !== null) {
            return this.ruleText;
        }

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
        /* TODO fix */
        if (this.requestModalState === WIZARD_STATES.UNBLOCK_REQUEST) {
            let patterns;
            if (selectedEvent.requestUrl) {
                patterns = splitToPatterns(
                    selectedEvent.requestUrl,
                    selectedEvent.requestDomain,
                    true,
                );
            }

            if (selectedEvent.requestUrl === 'content-security-policy-check') {
                patterns = [FilterRule.MASK_ALLOWLIST];
            }

            if (selectedEvent.element) {
                patterns = [createExceptionCssRule(selectedEvent.requestRule, selectedEvent)];
            }

            if (selectedEvent.cookieName) {
                patterns = [createExceptionCookieRule(selectedEvent.requestRule, selectedEvent)];
            }

            if (selectedEvent.script) {
                patterns = [createExceptionScriptRule(selectedEvent.requestRule, selectedEvent)];
            }

            this.setRulePattern(patterns[0]);

            return patterns;
        }

        let patterns = splitToPatterns(
            selectedEvent.requestUrl,
            selectedEvent.requestDomain,
            false,
        );

        if (selectedEvent.requestRule && selectedEvent.requestRule.documentLevelRule) {
            patterns = [createDocumentLevelBlockRule(selectedEvent.requestRule)];
        }

        this.setRulePattern(patterns[0]);
        return patterns;
    }

    @action
    setRuleOptionState(optionId, checked) {
        // on every rule pattern change we reset rule text inserted manually
        this.ruleText = null;
        this.ruleOptions[optionId].checked = checked;
    }
}

export { WizardStore };
