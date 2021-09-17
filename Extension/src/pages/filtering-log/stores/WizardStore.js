import {
    action,
    computed,
    observable,
    makeObservable,
} from 'mobx';
import {
    NETWORK_RULE_OPTIONS,
    MASK_ALLOWLIST,
    OPTIONS_DELIMITER,
} from '@adguard/tsurlfilter/dist/es/network-rule-options';

import { RULE_OPTIONS } from '../components/RequestWizard/constants';
import {
    createDocumentLevelBlockRule,
    createExceptionCookieRule,
    createExceptionCssRule,
    createExceptionRemoveParamRules,
    createExceptionRemoveHeaderRules,
    createExceptionScriptRule,
    splitToPatterns,
} from '../components/RequestWizard/ruleCreators';
import { messenger } from '../../services/messenger';

export const WIZARD_STATES = {
    VIEW_REQUEST: 'view.request',
    BLOCK_REQUEST: 'block.request',
    UNBLOCK_REQUEST: 'unblock.request',
    PREVIEW_REQUEST: 'preview.request',
};

export const ADDED_RULE_STATES = {
    BLOCK: 'block',
    UNBLOCK: 'unblock',
};

const defaultRuleOptions = {
    [RULE_OPTIONS.RULE_DOMAIN]: { checked: true },
    [RULE_OPTIONS.RULE_THIRD_PARTY]: { checked: false },
    [RULE_OPTIONS.RULE_IMPORTANT]: { checked: false },
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
    ruleOptions = defaultRuleOptions;

    @observable
    addedRuleState = null;

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
        const {
            requestThirdParty,
            requestRule,
        } = selectedEvent;

        const isImportant = requestRule
            && (requestRule.allowlistRule || requestRule.isImportant)
            && !requestRule.documentLevelRule;

        this.ruleOptions = {
            [RULE_OPTIONS.RULE_DOMAIN]: { checked: true },
            [RULE_OPTIONS.RULE_THIRD_PARTY]: { checked: requestThirdParty },
            [RULE_OPTIONS.RULE_IMPORTANT]: { checked: isImportant },
        };
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
        this.addedRuleState = null;
        this.requestModalState = WIZARD_STATES.VIEW_REQUEST;
    };

    @action
    setBlockState() {
        this.requestModalState = WIZARD_STATES.BLOCK_REQUEST;
    }

    @action
    setUnblockState() {
        this.requestModalState = WIZARD_STATES.UNBLOCK_REQUEST;
    }

    @action
    setAddedRuleState(nextAddedRuleState) {
        this.addedRuleState = nextAddedRuleState;
        this.requestModalState = WIZARD_STATES.VIEW_REQUEST;
    }

    @action
    setPreviewState() {
        this.requestModalState = WIZARD_STATES.PREVIEW_REQUEST;
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
    };

    @action
    removeFromUserFilterHandler = async (filteringEvent) => {
        const { requestRule } = filteringEvent;

        await messenger.removeUserRule(requestRule.ruleText);

        this.closeModal();
    };

    @action
    removeAddedRuleFromUserFilter = async () => {
        await messenger.removeUserRule(this.rule);
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

    createRuleFromParams = ({
        urlPattern,
        urlDomain,
        thirdParty,
        important,
        mandatoryOptions,
    }) => {
        let ruleText = urlPattern;

        let options = [];

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
        if (mandatoryOptions) {
            options = options.concat(mandatoryOptions);
        }
        if (options.length > 0) {
            ruleText += OPTIONS_DELIMITER + options.join(',');
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
            ruleThirdParty,
        } = ruleOptions;

        const permitDomain = !ruleDomain.checked;
        const important = !!ruleImportant.checked;
        const thirdParty = !!ruleThirdParty.checked;

        const domain = permitDomain ? selectedEvent.frameDomain : null;

        let mandatoryOptions = null;

        // Deal with csp rule
        const { requestRule } = selectedEvent;
        if (requestRule && requestRule.cspRule) {
            mandatoryOptions = [NETWORK_RULE_OPTIONS.CSP];
        }

        if (requestRule && requestRule.cookieRule) {
            mandatoryOptions = [NETWORK_RULE_OPTIONS.COOKIE];
        }

        if (selectedEvent.requestUrl === 'content-security-policy-check') {
            mandatoryOptions = [NETWORK_RULE_OPTIONS.WEBRTC, NETWORK_RULE_OPTIONS.WEBSOCKET];
        }

        if (selectedEvent.replaceRules) {
            mandatoryOptions = [NETWORK_RULE_OPTIONS.REPLACE];
        }

        let ruleText;
        if (selectedEvent.element) {
            ruleText = this.createCssRuleFromParams(rulePattern, permitDomain);
        } else if (selectedEvent.cookieName) {
            ruleText = this.createRuleFromParams({
                urlPattern: rulePattern,
                thirdParty,
                important,
                mandatoryOptions,
            });
        } else if (selectedEvent.script) {
            ruleText = this.createRuleFromParams({ urlPattern: rulePattern });
        } else {
            ruleText = this.createRuleFromParams({
                urlPattern: rulePattern,
                urlDomain: domain,
                thirdParty,
                important,
                mandatoryOptions,
            });
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
            if (selectedEvent.requestUrl && selectedEvent.requestDomain) {
                patterns = splitToPatterns(
                    selectedEvent.requestUrl,
                    selectedEvent.requestDomain,
                    true,
                );
            }

            if (selectedEvent.requestUrl === 'content-security-policy-check') {
                patterns = [MASK_ALLOWLIST];
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

            if (selectedEvent.removeParam) {
                patterns = createExceptionRemoveParamRules(selectedEvent);
            }

            if (selectedEvent.removeHeader) {
                patterns = createExceptionRemoveHeaderRules(selectedEvent);
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
