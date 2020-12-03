import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../../stores/RootStore';
import { RULE_OPTIONS } from '../constants';
import { messenger } from '../../../../services/messenger';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import './request-create-rule.pcss';

const getTitleI18nKey = classnames;

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
                <label className="radio-button" />
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
                <label className="checkbox-label" key={id}>
                    <input
                        type="checkbox"
                        name={id}
                        value={id}
                        onChange={handleOptionsChange(id)}
                        checked={wizardStore.ruleOptions[id].checked}
                    />
                    <div className="custom-checkbox" />
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

    const titleI18nKey = getTitleI18nKey({
        filtering_modal_block: wizardStore.requestModalStateEnum.isBlock,
        filtering_modal_unblock: wizardStore.requestModalStateEnum.isUnblock,
    });

    return (
        <>
            {/* TODO style button and remove text */}
            <div className="request-modal__title">
                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                <button
                    type="button"
                    onClick={handleBackClick}
                    className="request-modal__navigation request-modal__navigation--back"
                >
                    <svg className="icon">
                        <use xlinkHref="#arrow-left" />
                    </svg>
                </button>
                <span className="request-modal__header">{reactTranslator.translate(titleI18nKey)}</span>
            </div>
            <div className="request-modal__content">
                <div className="request-info request-modal__rule-text">
                    <div className="request-info__key">{reactTranslator.translate('filtering_modal_rule_text')}</div>
                    <div
                        /* eslint-disable-next-line jsx-a11y/aria-role */
                        role="textarea"
                        className="request-info__value request-modal__rule-text"
                        contentEditable
                        suppressContentEditableWarning
                        onChange={handleRuleChange}
                    >
                        {wizardStore.rule}
                    </div>
                </div>
                {showPatterns && (
                    <div className="request-info patterns">
                        <div className="request-info__key">{reactTranslator.translate('filtering_modal_patterns')}</div>
                        {rulePatterns}
                    </div>
                )}
                {showOptions && (
                    <div className="request-info options">
                        <div className="request-info__key">{reactTranslator.translate('filtering_modal_options')}</div>
                        {options}
                    </div>
                )}
            </div>
            <button
                type="button"
                className="request-modal__button request-modal__button--red"
                onClick={handleAddRuleClick}
                title={reactTranslator.translate(titleI18nKey)}
            >
                {reactTranslator.translate(titleI18nKey)}
            </button>
        </>
    );
});

export { RequestCreateRule };
