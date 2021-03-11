import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';
import { RULE_OPTIONS } from '../constants';
import { messenger } from '../../../../services/messenger';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { Icon } from '../../../../common/components/ui/Icon';

import './request-create-rule.pcss';
import { WIZARD_STATES } from '../../../stores/WizardStore';

const RequestCreateRule = observer(() => {
    const { wizardStore, logStore } = useContext(rootStore);

    const RULE_OPTIONS_MAP = {
        [RULE_OPTIONS.RULE_DOMAIN]: {
            label: `${reactTranslator.getMessage('filtering_modal_apply_domains')}`,
        },
        [RULE_OPTIONS.RULE_MATCH_CASE]: {
            label: `${reactTranslator.getMessage('filtering_modal_match_case')}`,
        },
        [RULE_OPTIONS.RULE_THIRD_PARTY]: {
            label: `${reactTranslator.getMessage('filtering_modal_third_party')}`,
        },
        [RULE_OPTIONS.RULE_IMPORTANT]: {
            label: `${reactTranslator.getMessage('filtering_modal_important')}`,
        },
    };

    const handlePatternChange = (pattern) => () => {
        wizardStore.setRulePattern(pattern);
    };

    const renderPatterns = (patterns) => {
        const patternItems = patterns.map((pattern, idx) => (
            <label
                /* eslint-disable-next-line react/no-array-index-key */
                key={`pattern${idx}`}
                className="radio-button-label"
                htmlFor={pattern}
            >
                <input
                    type="radio"
                    id={pattern}
                    name="rulePattern"
                    value={pattern}
                    checked={pattern === wizardStore.rulePattern}
                    onChange={handlePatternChange(pattern)}
                />
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <div className="radio-button" />
                {pattern}
            </label>
        ));

        return (
            <div className="patterns__content">
                {patternItems}
            </div>
        );
    };

    const handleOptionsChange = (id) => (e) => {
        const { checked } = e.target;
        wizardStore.setRuleOptionState(id, checked);
    };

    const renderOptions = () => {
        const options = Object.entries(RULE_OPTIONS_MAP);
        const renderedOptions = options.map(([id, { label }]) => {
            if (id === RULE_OPTIONS.RULE_DOMAIN && !logStore.selectedEvent.frameDomain) {
                return null;
            }

            return (
                // eslint-disable-next-line jsx-a11y/label-has-associated-control
                <label className="checkbox-label" key={id}>
                    <input
                        type="checkbox"
                        name={id}
                        value={id}
                        onChange={handleOptionsChange(id)}
                        checked={wizardStore.ruleOptions[id].checked}
                    />
                    <div className="custom-checkbox">
                        <Icon id="#checked" classname="icon--checked" />
                    </div>
                    {label}
                </label>
            );
        });

        return (
            <form>
                <div className="options__content">
                    {renderedOptions}
                </div>
            </form>
        );
    };

    const handleBackClick = () => {
        wizardStore.setViewState();
    };

    const handleAddRuleClick = async () => {
        await messenger.addUserRule(wizardStore.rule);
        wizardStore.closeModal();
    };

    const handleRuleChange = (e) => {
        wizardStore.setRuleText(e.currentTarget.value);
    };

    const {
        element,
        script,
        requestRule,
        cookieName,
    } = logStore.selectedEvent;

    // Must invoke wizardStore.rulePatterns unconditionally to trigger wizardStore.rule computation
    const rulePatterns = renderPatterns(wizardStore.rulePatterns);
    const options = renderOptions();

    const isElementOrScript = element || script;
    const showPatterns = !isElementOrScript && !cookieName;
    const showOptions = !isElementOrScript && !requestRule?.documentLevelRule;

    let title = reactTranslator.getMessage('filtering_modal_add_title');
    if (wizardStore.requestModalState === WIZARD_STATES.UNBLOCK_REQUEST) {
        title = reactTranslator.getMessage('filtering_modal_exception_title');
    }

    return (
        <>
            <div className="request-modal__title">
                <button
                    type="button"
                    onClick={handleBackClick}
                    className="request-modal__navigation request-modal__navigation--back"
                >
                    <Icon classname="icon--contain" id="#arrow-left" />
                </button>
                <span className="request-modal__header">{title}</span>
            </div>
            <div className="request-modal__content">
                <div className="request-info request-modal__rule-text">
                    <div className="request-info__key">
                        {reactTranslator.getMessage('filtering_modal_rule_text_desc')}
                    </div>
                    <textarea
                        className="request-info__value request-modal__rule-text"
                        onChange={handleRuleChange}
                        defaultValue={wizardStore.rule}
                    >
                    </textarea>
                </div>
                {showPatterns && (
                    <div className="request-info patterns">
                        <div className="request-info__key">
                            {reactTranslator.getMessage('filtering_modal_patterns_desc')}
                        </div>
                        {rulePatterns}
                    </div>
                )}
                {showOptions && (
                    <div className="request-info options">
                        <div className="request-info__key">
                            {reactTranslator.getMessage('filtering_modal_options_desc')}
                        </div>
                        {options}
                    </div>
                )}
            </div>
            <button
                type="button"
                className="request-modal__button"
                onClick={handleAddRuleClick}
                title={reactTranslator.getMessage('filtering_modal_add_rule')}
            >
                {reactTranslator.getMessage('filtering_modal_add_rule')}
            </button>
        </>
    );
});

export { RequestCreateRule };
