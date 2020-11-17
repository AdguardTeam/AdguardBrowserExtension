// TODO check accessibility
/* eslint-disable jsx-a11y/label-has-associated-control,react/no-array-index-key,no-shadow */
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { rootStore } from '../../../stores/RootStore';
import { RULE_OPTIONS } from '../constants';
import { messenger } from '../../../../services/messenger';

// TODO localize messages
const RequestBlock = observer(() => {
    const { wizardStore } = useContext(rootStore);

    const RULE_OPTIONS_MAP = {
        [RULE_OPTIONS.RULE_DOMAIN]: {
            label: 'Apply the rule to all websites',
        },
        [RULE_OPTIONS.RULE_MATCH_CASE]: {
            label: 'Enable case-sensitive',
        },
        [RULE_OPTIONS.RULE_THIRD_PARTY]: {
            label: 'Apply to third-party requests only',
        },
        [RULE_OPTIONS.RULE_IMPORTANT]: {
            label: 'Give a higher priority to the rule',
        },
    };

    const handlePatternChange = (pattern) => () => {
        wizardStore.setRulePattern(pattern);
    };

    const renderPatterns = (patterns) => {
        const patternItems = patterns.map((pattern, idx) => {
            return (
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

    return (
        <>
            <button
                type="button"
                onClick={handleBackClick}
            >
                back
            </button>
            <div className="rule-text">
                <div>Rule text:</div>
                <input
                    type="text"
                    name="rule-text"
                    value={wizardStore.rule}
                    onChange={handleRuleChange}
                />
            </div>
            <div className="patterns">
                <div>Patterns:</div>
                {renderPatterns(wizardStore.rulePatterns)}
            </div>
            <div className="options">
                <div>Options:</div>
                {renderOptions()}
            </div>
            <button
                type="button"
                onClick={handleAddRuleClick}
            >
                Add rule
            </button>
        </>
    );
});

export { RequestBlock };
