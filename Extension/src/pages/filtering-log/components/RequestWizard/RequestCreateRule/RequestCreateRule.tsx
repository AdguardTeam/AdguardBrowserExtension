/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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

import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { rootStore } from '../../../stores/RootStore';
import { RULE_CREATION_OPTION } from '../constants';
import { messenger } from '../../../../services/messenger';
import { translator } from '../../../../../common/translators/translator';
import { Icon } from '../../../../common/components/ui/Icon';
import { useOverflowed } from '../../../../common/hooks/useOverflowed';
import { AddedRuleState, WizardRequestState } from '../../../constants';
import { logger } from '../../../../../common/logger';

import './request-create-rule.pcss';

const RequestCreateRule = observer(() => {
    const ref = useRef(null);
    const contentOverflowed = useOverflowed(ref);

    const { wizardStore, logStore } = useContext(rootStore);

    const { selectedEvent } = logStore;

    if (!selectedEvent) {
        return null;
    }

    const RULE_OPTIONS_MAP = {
        [RULE_CREATION_OPTION.DOMAIN]: {
            label: `${translator.getMessage('filtering_modal_apply_domains')}`,
        },
        [RULE_CREATION_OPTION.THIRD_PARTY]: {
            label: `${translator.getMessage('filtering_modal_third_party')}`,
        },
        [RULE_CREATION_OPTION.IMPORTANT]: {
            label: `${translator.getMessage('filtering_modal_important')}`,
        },
        [RULE_CREATION_OPTION.REMOVE_PARAM]: {
            label: `${translator.getMessage('filtering_modal_remove_param')}`,
        },
    };

    const handlePatternChange = (pattern: string) => () => {
        wizardStore.setRulePattern(pattern);
    };

    const renderPatterns = (patterns: string[]): React.JSX.Element => {
        const patternItems = patterns.map((pattern, idx) => (
            <div
                key={pattern}
                className="radio-button-wrapper"
            >
                <input
                    type="radio"
                    id={pattern}
                    name="rulePattern"
                    className="radio-button-input"
                    value={pattern}
                    disabled={wizardStore.isActionSubmitted}
                    checked={pattern === wizardStore.rulePattern}
                    onChange={handlePatternChange(pattern)}
                />
                <label
                    /* eslint-disable-next-line react/no-array-index-key */
                    key={`pattern${idx}`}
                    className="radio-button-label"
                    htmlFor={pattern}
                >
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                    <div className="radio-button" />
                    <div
                        className="radio-button-desc"
                        title={pattern}
                    >
                        {pattern}
                    </div>
                </label>
            </div>
        ));

        return (
            <div className="patterns__content">
                {patternItems}
            </div>
        );
    };

    const handleOptionsChange = (id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const { checked } = e.target;
        wizardStore.setRuleOptionState(id, checked);
    };

    const renderOptions = () => {
        const options = Object.entries(RULE_OPTIONS_MAP);
        const renderedOptions = options.map(([id, { label }]) => {
            if (id === RULE_CREATION_OPTION.DOMAIN
                && !selectedEvent.frameDomain) {
                return null;
            }

            // $third-party and $important modifiers are active for cookie rules
            // so $domain modifier is forbidden
            if (selectedEvent?.requestRule?.cookieRule
                && id === RULE_CREATION_OPTION.DOMAIN) {
                return null;
            }

            // $removeparam option is available only for requests with query
            // and is not shown for cookie rules
            if (id === RULE_CREATION_OPTION.REMOVE_PARAM
                && selectedEvent.requestUrl
                && (selectedEvent.requestUrl?.indexOf('?') < 0
                    || selectedEvent.requestRule?.cookieRule)) {
                return null;
            }

            return (
                <div
                    key={id}
                    className="checkbox-wrapper"
                >
                    <input
                        id={id}
                        className="checkbox-input"
                        type="checkbox"
                        name={id}
                        value={id}
                        disabled={wizardStore.isActionSubmitted}
                        onChange={handleOptionsChange(id)}
                        checked={wizardStore.ruleOptions[id]?.checked}
                    />
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                    <label
                        htmlFor={id}
                        className="checkbox-label"
                        key={id}
                    >
                        <div className="custom-checkbox">
                            <Icon id="#checked" className="icon--18" />
                        </div>
                        <div className="checkbox-label__desc">
                            {label}
                        </div>
                    </label>
                </div>
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
        if (!wizardStore.rule) {
            logger.error('[ext.RequestCreateRule]: rule is empty.');
            return;
        }

        wizardStore.setActionSubmitted(true);
        await messenger.addUserRule(wizardStore.rule);
        const addedRuleState = wizardStore.requestModalState === WizardRequestState.Block
            ? AddedRuleState.Block
            : AddedRuleState.Unblock;

        wizardStore.setAddedRuleState(addedRuleState);
        wizardStore.setActionSubmitted(false);
    };

    const handleRuleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        wizardStore.setRuleText(e.currentTarget.value);
    };

    const {
        element,
        script,
        requestRule,
    } = selectedEvent;

    // Must invoke wizardStore.rulePatterns unconditionally to trigger wizardStore.rule computation
    const rulePatterns = renderPatterns(wizardStore.rulePatterns);
    const options = renderOptions();

    const isElementOrScript = element || script;
    const showPatterns = !isElementOrScript
        && !requestRule?.documentLevelRule
        && wizardStore.rulePatterns
        && wizardStore.rulePatterns.length > 1;
    const showOptions = !isElementOrScript && !requestRule?.documentLevelRule;

    let title = translator.getMessage('filtering_modal_add_title');
    if (wizardStore.requestModalState === WizardRequestState.Unblock) {
        title = translator.getMessage('filtering_modal_exception_title');
    }

    return (
        <>
            <div className={cn('request-modal__title', { 'request-modal__title_fixed': contentOverflowed })}>
                <button
                    type="button"
                    onClick={handleBackClick}
                    className="request-modal__navigation"
                >
                    <Icon
                        id="#arrow-left"
                        className="icon--24 icon--gray-default"
                    />
                    <span className="request-modal__header">{title}</span>
                </button>
            </div>
            <div ref={ref} className="request-modal__content thin-scrollbar">
                <div className="request-info">
                    <div className="request-info__main">
                        <div className="request-info__key">
                            {translator.getMessage('filtering_modal_rule_text_desc')}
                        </div>
                        <textarea
                            disabled={wizardStore.isActionSubmitted}
                            className="request-info__value request-modal__rule-text"
                            onChange={handleRuleChange}
                            value={wizardStore.rule}
                        />
                    </div>
                </div>
                {showPatterns && (
                    <div className="request-info patterns">
                        <div className="request-info__main">
                            <div className="request-info__key">
                                {translator.getMessage('filtering_modal_patterns_desc')}
                            </div>
                            {rulePatterns}
                        </div>
                    </div>
                )}
                {showOptions && (
                    <div className="request-info options">
                        <div className="request-info__main">
                            <div className="request-info__key">
                                {translator.getMessage('filtering_modal_options_desc')}
                            </div>
                            {options}
                        </div>
                    </div>
                )}
            </div>
            <div className={cn('request-modal__controls', { 'request-modal__controls_fixed': contentOverflowed })}>
                <button
                    disabled={wizardStore.isActionSubmitted}
                    type="button"
                    className="button button--l button--green-bg request-modal__button"
                    onClick={handleAddRuleClick}
                    title={translator.getMessage('filtering_modal_add_rule')}
                >
                    {translator.getMessage('filtering_modal_add_rule')}
                </button>
            </div>
        </>
    );
});

export { RequestCreateRule };
