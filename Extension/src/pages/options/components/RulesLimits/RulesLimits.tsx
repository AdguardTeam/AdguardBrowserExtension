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

import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { SettingsSection } from '../Settings/SettingsSection';
import {
    Forward,
    ForwardAction,
    ForwardFrom,
} from '../../../../common/forward';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { translator } from '../../../../common/translators/translator';
import { rootStore } from '../../stores/RootStore';
import { type IRulesLimits } from '../../../../background/services/rules-limits/mv3/rules-limits';
import { messenger } from '../../../services/messenger';
import { MessageType } from '../../../../common/messages';

import { Warning } from './Warning';

import './rules-limits.pcss';

export const RulesLimits = observer(() => {
    /**
     * Threshold for highlighting the number of enabled rules.
     */
    const THRESHOLD_HIGHLIGHT_PERCENTAGE = 80;

    const { settingsStore } = useContext(rootStore);

    useEffect(() => {
        settingsStore.getRulesLimits();
    }, [settingsStore]);

    const rulesLimits = settingsStore.rulesLimits as IRulesLimits;

    const {
        userRulesEnabledCount,
        userRulesMaximumCount,
        userRulesRegexpsEnabledCount,
        userRulesRegexpsMaximumCount,
        staticFiltersEnabledCount,
        staticFiltersMaximumCount,
        staticRulesEnabledCount,
        staticRulesMaximumCount,
        staticRulesRegexpsEnabledCount,
        staticRulesRegexpsMaxCount,
    } = rulesLimits;

    const learnMoreAboutMv3Url = Forward.get({
        action: ForwardAction.LearnMoreAboutMv3,
        from: ForwardFrom.Options,
    });

    const actuallyEnabledFilterNames = rulesLimits.actuallyEnabledFilters.map((filterId) => {
        return settingsStore.filters.find(f => f.filterId === filterId)?.name;
    });

    const expectedEnabledFilterNames = rulesLimits.expectedEnabledFilters.map((filterId) => {
        return settingsStore.filters.find(f => f.filterId === filterId)?.name;
    });

    const showWarning = rulesLimits.expectedEnabledFilters.length > 0;

    const onClickReactivateFilters = async () => {
        // FIXME(Slava): enable loader
        await messenger.sendMessage(MessageType.RestoreFilters);
        await settingsStore.getRulesLimits();
        // FIXME(Slava): disable loader
    };

    const onClickCloseWarning = async () => {
        // FIXME(Slava): enable loader
        await messenger.sendMessage(MessageType.ClearRulesLimitsWarning);
        await settingsStore.getRulesLimits();
        // FIXME(Slava): disable loader
    };

    const getClassNamesForNumbers = (current: number, maximum: number) => {
        const percentage = (current / maximum) * 100;
        const shouldHighlight = percentage >= THRESHOLD_HIGHLIGHT_PERCENTAGE;

        return cn('rules-limits__group-limits', {
            'rules-limits__text--orange': shouldHighlight,
            'rules-limits__text--green': !shouldHighlight,
        });
    };

    return (
        <SettingsSection
            title={translator.getMessage('options_rule_limits')}
            description={(
                <>
                    <div>{translator.getMessage('options_rule_limits_description')}</div>
                    <div className="title__desc--additional">
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href={learnMoreAboutMv3Url}
                            className="title__desc--additional-link"
                        >
                            {translator.getMessage('options_rule_limits_description_link')}
                        </a>
                    </div>
                </>
            )}
        >
            {showWarning && (
                <Warning
                    actuallyEnabledFilterNames={actuallyEnabledFilterNames.join(', ')}
                    expectedEnabledFilterNames={expectedEnabledFilterNames.join(', ')}
                    onClickReactivateFilters={onClickReactivateFilters}
                    onClickCloseWarning={onClickCloseWarning}
                />
            )}
            <div className="rules-limits">
                <div className="rules-limits__section">
                    <div
                        className="rules-limits__section-title"
                    >
                        {translator.getMessage('options_rule_limits_dynamic')}
                    </div>
                    <div className="rules-limits__group">
                        <div className="rules-limits__text--gray">
                            {translator.getMessage('options_rule_limits_dynamic_user_rules')}
                        </div>
                        <div className={getClassNamesForNumbers(userRulesEnabledCount, userRulesMaximumCount)}>
                            {reactTranslator.getMessage('options_rule_limits_numbers', {
                                current: userRulesEnabledCount,
                                maximum: userRulesMaximumCount,
                            })}
                        </div>
                    </div>
                    <div className="rules-limits__group">
                        <div className="rules-limits__text--gray">
                            {translator.getMessage('options_rule_limits_dynamic_regex')}
                        </div>
                        <div className={getClassNamesForNumbers(
                            userRulesRegexpsEnabledCount,
                            userRulesRegexpsMaximumCount,
                        )}
                        >
                            {reactTranslator.getMessage('options_rule_limits_numbers', {
                                current: userRulesRegexpsEnabledCount,
                                maximum: userRulesRegexpsMaximumCount,
                            })}
                        </div>
                    </div>
                </div>
                <div className="rules-limits__section">
                    <div
                        className="rules-limits__section-title"
                    >
                        {translator.getMessage('options_rule_limits_static_rulesets')}
                    </div>
                    <div className="rules-limits__group">
                        <div className="rules-limits__text--gray">
                            {translator.getMessage('options_rule_limits_static_rulesets_builtin')}
                        </div>
                        <div className={getClassNamesForNumbers(staticFiltersEnabledCount, staticFiltersMaximumCount)}>
                            {reactTranslator.getMessage('options_rule_limits_numbers', {
                                current: staticFiltersEnabledCount,
                                maximum: staticFiltersMaximumCount,
                            })}
                        </div>
                    </div>
                </div>
                <div className="rules-limits__section">
                    <div
                        className="rules-limits__section-title"
                    >
                        {translator.getMessage('options_rule_limits_static_rules')}
                    </div>
                    <div className="rules-limits__group">
                        <div className="rules-limits__text--gray">
                            {translator.getMessage('options_rule_limits_static_rules_all')}
                        </div>
                        <div className={getClassNamesForNumbers(staticRulesEnabledCount, staticRulesMaximumCount)}>
                            {reactTranslator.getMessage('options_rule_limits_numbers', {
                                current: staticRulesEnabledCount,
                                maximum: staticRulesMaximumCount,
                            })}
                        </div>
                    </div>
                    <div className="rules-limits__group">
                        <div className="rules-limits__text--gray">
                            {translator.getMessage('options_rule_limits_static_rules_regex')}
                        </div>
                        <div className={getClassNamesForNumbers(
                            staticRulesRegexpsEnabledCount,
                            staticRulesRegexpsMaxCount,
                        )}
                        >
                            {reactTranslator.getMessage('options_rule_limits_numbers', {
                                current: staticRulesRegexpsEnabledCount,
                                maximum: staticRulesRegexpsMaxCount,
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </SettingsSection>
    );
});
