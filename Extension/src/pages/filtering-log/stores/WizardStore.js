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
    action,
    computed,
    observable,
    makeObservable,
} from 'mobx';
import { NETWORK_RULE_OPTIONS, OPTIONS_DELIMITER } from '@adguard/tsurlfilter';

import { RULE_OPTIONS } from '../components/RequestWizard/constants';
import {
    createDocumentLevelBlockRule,
    createExceptionCookieRules,
    createExceptionCssRule,
    createExceptionRemoveParamRules,
    createExceptionRemoveHeaderRules,
    createExceptionScriptRule,
    createBlockingCookieRule,
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

const MODIFIERS_DELIMITER = ',';

const defaultRuleOptions = {
    [RULE_OPTIONS.RULE_DOMAIN]: { checked: false },
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
            requestRule,
        } = selectedEvent;

        const isImportant = requestRule
            && (requestRule.allowlistRule || requestRule.isImportant)
            && !requestRule.documentLevelRule;

        this.ruleOptions = {
            [RULE_OPTIONS.RULE_DOMAIN]: { checked: false },
            [RULE_OPTIONS.RULE_THIRD_PARTY]: { checked: false },
            [RULE_OPTIONS.RULE_IMPORTANT]: { checked: isImportant },
            [RULE_OPTIONS.RULE_REMOVE_PARAM]: { checked: false },
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
        this.rootStore.logStore.removeSelectedEvent();
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
    };

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
        removeParam,
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
        // add removeparam option
        if (removeParam) {
            options.push(NETWORK_RULE_OPTIONS.REMOVEPARAM);
        }
        if (mandatoryOptions) {
            options = options.concat(mandatoryOptions);
        }
        if (options.length > 0) {
            ruleText += OPTIONS_DELIMITER + options.join(MODIFIERS_DELIMITER);
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

    createCookieRuleFromParams = ({
        rulePattern,
        thirdParty,
        important,
    }) => {
        let ruleText = rulePattern;

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
            ruleText += MODIFIERS_DELIMITER + options.join(MODIFIERS_DELIMITER);
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
            ruleRemoveParam,
        } = ruleOptions;

        const permitDomain = !ruleDomain.checked;
        const important = !!ruleImportant.checked;
        const thirdParty = !!ruleThirdParty.checked;
        const removeParam = !!ruleRemoveParam.checked;

        const domain = permitDomain ? selectedEvent.frameDomain : null;

        let mandatoryOptions = null;

        // Deal with csp rule
        const { requestRule } = selectedEvent;
        if (requestRule && requestRule.cspRule) {
            mandatoryOptions = [NETWORK_RULE_OPTIONS.CSP];
        }

        if (selectedEvent.replaceRules) {
            mandatoryOptions = [NETWORK_RULE_OPTIONS.REPLACE];
        }

        let ruleText;
        if (selectedEvent.element) {
            ruleText = this.createCssRuleFromParams(rulePattern, permitDomain);
        } else if (selectedEvent.cookieName) {
            ruleText = this.createCookieRuleFromParams({
                rulePattern,
                thirdParty,
                important,
            });
        } else if (selectedEvent.script || selectedEvent?.requestRule?.documentLevelRule) {
            ruleText = this.createRuleFromParams({ urlPattern: rulePattern });
        } else {
            ruleText = this.createRuleFromParams({
                urlPattern: rulePattern,
                urlDomain: domain,
                thirdParty,
                important,
                mandatoryOptions,
                removeParam,
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

            if (selectedEvent.element) {
                patterns = [createExceptionCssRule(selectedEvent.requestRule, selectedEvent)];
            }

            if (selectedEvent.cookieName) {
                patterns = createExceptionCookieRules(selectedEvent);
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

        let patterns = [];
        if (selectedEvent.requestUrl && selectedEvent.requestDomain) {
            patterns = splitToPatterns(
                selectedEvent.requestUrl,
                selectedEvent.requestDomain,
                false,
            );
        } else if (selectedEvent.cookieName) {
            patterns = createBlockingCookieRule(selectedEvent);
        }

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
