import {
    action,
    computed,
    observable,
    makeObservable,
} from 'mobx';

import { RULE_OPTIONS } from '../components/RequestWizard/constants';
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
