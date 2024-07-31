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

import { ContentType } from '@adguard/tswebextension';

import { RULE_OPTIONS } from '../components/RequestWizard/constants';
import {
    createDocumentLevelBlockRule,
    createExceptionCookieRules,
    createExceptionCssRule,
    createExceptionRemoveParamRules,
    createExceptionRemoveHeaderRules,
    createExceptionCspRules,
    createExceptionScriptRule,
    createBlockingCookieRule,
    splitToPatterns,
    getRuleText,
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

    /**
     * Whether the rule for the specified request is now applied or deleted
     */
    @observable
    isActionSubmitted = false;

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
    setActionSubmitted(value) {
        this.isActionSubmitted = value;
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
        this.isActionSubmitted = false;
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
        this.setActionSubmitted(true);
        const { selectedTabId } = this.rootStore.logStore;

        await messenger.removeAllowlistDomain(selectedTabId, false);

        this.closeModal();
    };

    @action
    removeFromUserFilterHandler = async (filteringEvent) => {
        this.setActionSubmitted(true);
        const { requestRule } = filteringEvent;

        await messenger.removeUserRule(requestRule.originalRuleText ?? requestRule.appliedRuleText);

        this.closeModal();
    };

    @action
    removeAddedRuleFromUserFilter = async () => {
        this.setActionSubmitted(true);
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

    @computed
    get rule() {
        const { logStore } = this.rootStore;
        // If the rule was edited by the user, it will be returned as is
        return this.ruleText === null
            ? getRuleText(logStore.selectedEvent, this.rulePattern, this.ruleOptions)
            : this.ruleText;
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

            if (selectedEvent.requestType === ContentType.Csp) {
                patterns = createExceptionCspRules(selectedEvent);
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
