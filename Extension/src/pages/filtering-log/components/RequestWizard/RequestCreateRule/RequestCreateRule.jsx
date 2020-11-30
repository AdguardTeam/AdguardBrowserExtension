import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';
import { RULE_OPTIONS } from '../constants';
import { messenger } from '../../../../services/messenger';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

const RequestCreateRule = observer(() => {
    const { wizardStore, logStore } = useContext(rootStore);

    const RULE_OPTIONS_MAP = {
        [RULE_OPTIONS.RULE_DOMAIN]: {
            label: `${reactTranslator.translate('filtering_modal_apply_domains')}`,
        },
        [RULE_OPTIONS.RULE_MATCH_CASE]: {
            label: `${reactTranslator.translate('filtering_modal_match_case')}`,
        },
        [RULE_OPTIONS.RULE_THIRD_PARTY]: {
            label: `${reactTranslator.translate('filtering_modal_third_party')}`,
        },
        [RULE_OPTIONS.RULE_IMPORTANT]: {
            label: `${reactTranslator.translate('filtering_modal_important')}`,
        },
    };

    const handlePatternChange = (pattern) => () => {
        wizardStore.setRulePattern(pattern);
    };

    const renderPatterns = (patterns) => {
        const patternItems = patterns.map((pattern, idx) => {
            return (
                // eslint-disable-next-line react/no-array-index-key
                <li key={`pattern${idx}`}>
                    <input
                        type="radio"
                        id={pattern}
                        name="rulePattern"
                        value={pattern}
                        checked={pattern === wizardStore.rulePattern}
                        onChange={handlePatternChange(pattern)}
                    />
                    <label htmlFor={pattern}>{pattern}</label>
                </li>
            );
        });

        return (
            <ul>
                {patternItems}
            </ul>
        );
    };

    const handleOptionsChange = (id) => (e) => {
        const checkbox = e.target;
        const { checked } = checkbox;
        wizardStore.setRuleOptionState(id, checked);
    };

    const renderOptions = () => {
        const options = Object.entries(RULE_OPTIONS_MAP);
        const renderedOptions = options.map(([id, { label }]) => {
            if (id === RULE_OPTIONS.RULE_DOMAIN && !logStore.selectedEvent.frameDomain) {
                return null;
            }

            return (
                <li key={id}>
                    <input
                        type="checkbox"
                        id={id}
                        name={id}
                        value={id}
                        onChange={handleOptionsChange(id)}
                        checked={wizardStore.ruleOptions[id].checked}
                    />
                    <label htmlFor={id}>{label}</label>
                </li>
            );
        });

        return (
            <form>
                <ul>
                    {renderedOptions}
                </ul>
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
        const { value } = e.currentTarget;
        wizardStore.setRuleText(value);
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

    return (
        <>
            {/* TODO style button and remove text */}
            <button
                type="button"
                onClick={handleBackClick}
            >
                back
            </button>
            <div className="rule-text">
                <div>{reactTranslator.translate('filtering_modal_rule_text')}</div>
                <input
                    type="text"
                    name="rule-text"
                    value={wizardStore.rule}
                    onChange={handleRuleChange}
                />
            </div>
            {showPatterns && (
                <div className="patterns">
                    <div>{reactTranslator.translate('filtering_modal_patterns')}</div>
                    {rulePatterns}
                </div>
            )}
            {showOptions && (
                <div className="options">
                    <div>{reactTranslator.translate('filtering_modal_options')}</div>
                    {options}
                </div>
            )}
            <button
                type="button"
                onClick={handleAddRuleClick}
            >
                {reactTranslator.translate('filtering_modal_add_rule')}
            </button>
        </>
    );
});

export { RequestCreateRule };
