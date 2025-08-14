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

import { ContentType } from 'tswebextension';

import { RULE_CREATION_OPTION } from '../components/RequestWizard/constants';
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
import { type AddedRuleState, WizardRequestState } from '../constants';
import { type RuleCreationOptions } from '../types';
import { type FilteringLogEvent } from '../../../background/api/filtering-log';
import { logger } from '../../../common/logger';

import { type RootStore } from './RootStore';

const defaultRuleOptions: RuleCreationOptions = {
    [RULE_CREATION_OPTION.DOMAIN]: { checked: false },
    [RULE_CREATION_OPTION.THIRD_PARTY]: { checked: false },
    [RULE_CREATION_OPTION.IMPORTANT]: { checked: false },
    [RULE_CREATION_OPTION.REMOVE_PARAM]: null,
};

class WizardStore {
    private rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        makeObservable(this);
    }

    @observable
    isModalOpen = false;

    @observable
    requestModalState = WizardRequestState.View;

    @observable
    ruleText: string | null = null;

    @observable
    rulePattern = '';

    @observable
    ruleOptions: RuleCreationOptions = defaultRuleOptions;

    @observable
    addedRuleState: AddedRuleState | null = null;

    /**
     * Whether the rule for the specified request is now applied or deleted
     */
    @observable
    isActionSubmitted = false;

    @computed
    get requestModalStateEnum() {
        /* should have only one true value */
        return {
            isBlock: this.requestModalState === WizardRequestState.Block,
            isUnblock: this.requestModalState === WizardRequestState.Unblock,
            isView: this.requestModalState === WizardRequestState.View,
        };
    }

    @action
    setActionSubmitted(value: boolean) {
        this.isActionSubmitted = value;
    }

    @action
    updateRuleOptions() {
        const { selectedEvent } = this.rootStore.logStore;

        if (!selectedEvent) {
            return;
        }

        const { requestRule } = selectedEvent;

        const isImportant = !!(requestRule
            && (requestRule.allowlistRule || requestRule.isImportant)
            && !requestRule.documentLevelRule);

        this.ruleOptions = {
            [RULE_CREATION_OPTION.DOMAIN]: { checked: false },
            [RULE_CREATION_OPTION.THIRD_PARTY]: { checked: false },
            [RULE_CREATION_OPTION.IMPORTANT]: { checked: isImportant },
            [RULE_CREATION_OPTION.REMOVE_PARAM]: { checked: false },
        };
    }

    @action
    openModal() {
        this.isModalOpen = true;
        this.requestModalState = WizardRequestState.View;
        this.updateRuleOptions();
    }

    @action
    closeModal = () => {
        this.isActionSubmitted = false;
        this.isModalOpen = false;
        this.addedRuleState = null;
        this.requestModalState = WizardRequestState.View;
        this.rootStore.logStore.removeSelectedEvent();
    };

    @action
    setBlockState() {
        this.requestModalState = WizardRequestState.Block;
    }

    @action
    setUnblockState() {
        this.requestModalState = WizardRequestState.Unblock;
    }

    @action
    setAddedRuleState(nextAddedRuleState: AddedRuleState | null) {
        this.addedRuleState = nextAddedRuleState;
        this.requestModalState = WizardRequestState.View;
    }

    @action
    setPreviewState() {
        this.requestModalState = WizardRequestState.Preview;
    }

    @action
    removeFromAllowlistHandler = async () => {
        this.setActionSubmitted(true);
        const { selectedTabId } = this.rootStore.logStore;

        if (!selectedTabId) {
            logger.error('[ext.WizardStore]: selected tab id is not defined');
            return;
        }

        await messenger.removeAllowlistDomain(selectedTabId, false);

        this.closeModal();
    };

    @action
    removeFromUserFilterHandler = async (filteringEvent: FilteringLogEvent) => {
        this.setActionSubmitted(true);
        const { requestRule } = filteringEvent;

        if (!requestRule) {
            return;
        }

        const ruleText = requestRule.originalRuleText ?? requestRule.appliedRuleText;

        if (!ruleText) {
            logger.error('[ext.WizardStore]: rule text is not defined');
            return;
        }

        await messenger.removeUserRule(ruleText);

        this.closeModal();
    };

    @action
    removeAddedRuleFromUserFilter = async () => {
        this.setActionSubmitted(true);

        if (!this.rule) {
            return;
        }

        await messenger.removeUserRule(this.rule);
        this.closeModal();
    };

    @action
    setViewState() {
        this.requestModalState = WizardRequestState.View;
    }

    @action
    setRulePattern(rulePattern: string): void {
        // on every rule pattern change we reset rule text inserted manually
        this.ruleText = null;
        this.rulePattern = rulePattern;
    }

    @action
    setRuleText(ruleText: string) {
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

        if (!selectedEvent) {
            return [];
        }

        if (this.requestModalState === WizardRequestState.Unblock) {
            let patterns: string[] = [];
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

            if (patterns[0]) {
                this.setRulePattern(patterns[0]);
            }

            return patterns;
        }

        let patterns: string[] = [];
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

        if (patterns[0]) {
            this.setRulePattern(patterns[0]);
        }

        return patterns;
    }

    @action
    setRuleOptionState(optionId: string, checked: boolean) {
        // on every rule pattern change we reset rule text inserted manually
        this.ruleText = null;
        // @ts-ignore
        this.ruleOptions[optionId].checked = checked;
    }
}

export { WizardStore };
