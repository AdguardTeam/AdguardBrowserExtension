import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import { rootStore } from '../../../stores/RootStore';
import { RULE_OPTIONS } from '../constants';
import { messenger } from '../../../../services/messenger';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import './request-create-rule.pcss';

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
            /* todo - use checked selector instead,
                 fix markup for multiple lines,*/
            const className = classnames('radio-button', {
                active: pattern === wizardStore.rulePattern,
            });

            return (
                // eslint-disable-next-line react/no-array-index-key
                <label
                    key={idx}
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
                    <label className={className} />
                    {pattern}
                </label>
            );
        });
        /* todo - rename classes, change padding */
        return (
            <div className="miscellaneous-filters__section">
                {patternItems}
            </div>
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

            /* todo - use checked selector instead */
            const className = classnames('custom-checkbox', {
                active: wizardStore.ruleOptions[id].checked,
            });

            return (
                <label className="checkbox-label" key={id}>
                    <input
                        type="checkbox"
                        name={id}
                        value={id}
                        onChange={handleOptionsChange(id)}
                        checked={wizardStore.ruleOptions[id].checked}
                    />
                    <div className={className} />
                    {label}
                </label>
            );
        });

        return (
            <form>
                <div className="miscellaneous-filters__section">
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

    const titleI18nKey = classnames({
        filtering_modal_block: wizardStore.requestModalStateEnum.isBlock,
        filtering_modal_unblock: wizardStore.requestModalStateEnum.isUnblock,
    });

    /* todo - find out colors */
    const buttonClass = classnames('request-modal__button', {
        'request-modal__button--red': wizardStore.requestModalStateEnum.isBlock,
        'request-modal__button--white': wizardStore.requestModalStateEnum.isUnblock,
    });

    return (
        <>
            {/* TODO style button and remove text */}
            <div className="request-modal__title">
                <button
                    type="button"
                    onClick={handleBackClick}
                    className="request-modal__close-icon"
                />
                <span className="request-modal__header">{reactTranslator.translate(titleI18nKey)}</span>
            </div>
            <div className="request-info__key request-modal__rule-text">
                <div>{reactTranslator.translate('filtering_modal_rule_text')}</div>
                <input
                    type="text"
                    name="rule-text"
                    className="request-modal__rule-text"
                    value={wizardStore.rule}
                    onChange={handleRuleChange}
                />
            </div>
            {/* todo - handle overflow */}
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
                className={buttonClass}
                onClick={handleAddRuleClick}
            >
                {reactTranslator.translate(titleI18nKey)}
            </button>
        </>
    );
});

export { RequestCreateRule };
