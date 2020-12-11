import {
    action,
    computed,
    observable,
    makeObservable,
} from 'mobx';
import { NetworkRule } from '@adguard/tsurlfilter';

import { RULE_OPTIONS } from '../components/RequestWizard/constants';
import {
    createDocumentLevelBlockRule,
    createExceptionCookieRule,
    createExceptionCssRule,
    createExceptionScriptRule,
    splitToPatterns,
} from '../components/RequestWizard/ruleCreators';
import { messenger } from '../../services/messenger';

export const WIZARD_STATES = {
    VIEW_REQUEST: 'view.request',
    BLOCK_REQUEST: 'block.request',
    UNBLOCK_REQUEST: 'unblock.request',
};

class WizardStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        makeObservable(this);
    }

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

    @computed
    get requestModalStateEnum() {
        /* should have only one true value */
        return {
            isBlock: this.requestModalState === WIZARD_STATES.BLOCK_REQUEST,
            isUnblock: this.requestModalState === WIZARD_STATES.UNBLOCK_REQUEST,
            isView: this.requestModalState === WIZARD_STATES.VIEW_REQUEST,
        };
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

        const { OPTIONS } = NetworkRule;

        // add domain option
        if (urlDomain) {
            options.push(`${OPTIONS.DOMAIN}=${urlDomain}`);
        }
        // add important option
        if (important) {
            options.push(OPTIONS.IMPORTANT);
        }
        // add match case option
        if (matchCase) {
            options.push(OPTIONS.MATCH_CASE);
        }
        // add third party option
        if (thirdParty) {
            options.push(OPTIONS.THIRD_PARTY);
        }
        if (mandatoryOptions) {
            options = options.concat(mandatoryOptions);
        }
        if (options.length > 0) {
            ruleText += NetworkRule.OPTIONS_DELIMITER + options.join(',');
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
        // if rule was edited by user return it as is
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
            mandatoryOptions = [NetworkRule.OPTIONS.CSP];
        }

        if (requestRule && requestRule.cookieRule) {
            mandatoryOptions = [NetworkRule.OPTIONS.COOKIE];
        }

        if (selectedEvent.requestUrl === 'content-security-policy-check') {
            mandatoryOptions = [NetworkRule.OPTIONS.WEBRTC, NetworkRule.OPTIONS.WEBSOCKET];
        }

        if (selectedEvent.replaceRules) {
            mandatoryOptions = [NetworkRule.OPTIONS.REPLACE];
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
                patterns = [NetworkRule.MASK_ALLOWLIST];
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
