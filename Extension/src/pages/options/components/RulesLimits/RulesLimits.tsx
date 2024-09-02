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
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { translator } from '../../../../common/translators/translator';
import { rootStore } from '../../stores/RootStore';
import { messenger } from '../../../services/messenger';
import { MessageType } from '../../../../common/messages';
import { addMinDelayLoader } from '../../../common/components/helpers';
import { type IRulesLimits } from '../../../../background/services/rules-limits/interface';

import { Warning } from './Warning';

import './rules-limits.pcss';

// TODO: We can add an one additional possible step to remove warning: try to
// enable some filter and if configuration will success - warning will be removed.
export const RulesLimits = observer(() => {
    /**
     * Threshold for highlighting the number of enabled rules.
     */
    const THRESHOLD_HIGHLIGHT_PERCENTAGE = 80;

    const { settingsStore, uiStore } = useContext(rootStore);

    useEffect(() => {
        settingsStore.getRulesLimitsCounters();
    }, [settingsStore]);

    const rulesLimits: IRulesLimits = settingsStore.rulesLimits;

    const {
        dynamicRulesEnabledCount,
        dynamicRulesMaximumCount,
        dynamicRulesRegexpsEnabledCount,
        dynamicRulesRegexpsMaximumCount,
        staticFiltersEnabledCount,
        staticFiltersMaximumCount,
        staticRulesEnabledCount,
        staticRulesMaximumCount,
        staticRulesRegexpsEnabledCount,
        staticRulesRegexpsMaxCount,
        areFilterLimitsExceeded,
    } = rulesLimits;

    /**
     * Returns names of filters by their ids.
     *
     * @param filterIds Array of filter ids.
     *
     * @returns Array of filter names.
     */
    const getFiltersNames = (filterIds: number[]): string[] => {
        return filterIds.map((filterId: number) => {
            return settingsStore.filters.find((f) => f.filterId === filterId)?.name;
        });
    };

    const handleReactivateFilters = async () => {
        await messenger.sendMessage(MessageType.RestoreFiltersMv3);
        await settingsStore.getRulesLimitsCounters();
        await settingsStore.checkLimitations();
    };

    const handleReactivateFiltersWrapper = addMinDelayLoader(
        uiStore.setShowLoader,
        handleReactivateFilters,
    );

    const handleCloseWarning = async () => {
        await messenger.sendMessage(MessageType.ClearRulesLimitsWarningMv3);
        await settingsStore.getRulesLimitsCounters();
        await settingsStore.checkLimitations();
    };

    const handleCloseWarningWrapper = addMinDelayLoader(
        uiStore.setShowLoader,
        handleCloseWarning,
    );

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
            description={translator.getMessage('options_rule_limits_description')}
        >
            {areFilterLimitsExceeded && (
                <Warning
                    actuallyEnabledFilterNames={getFiltersNames(rulesLimits.actuallyEnabledFilters).join(', ')}
                    expectedEnabledFilterNames={getFiltersNames(rulesLimits.expectedEnabledFilters).join(', ')}
                    onClickReactivateFilters={handleReactivateFiltersWrapper}
                    onClickCloseWarning={handleCloseWarningWrapper}
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
                        <div className={getClassNamesForNumbers(dynamicRulesEnabledCount, dynamicRulesMaximumCount)}>
                            {reactTranslator.getMessage('options_rule_limits_numbers', {
                                current: dynamicRulesEnabledCount,
                                maximum: dynamicRulesMaximumCount,
                            })}
                        </div>
                    </div>
                    <div className="rules-limits__group">
                        <div className="rules-limits__text--gray">
                            {translator.getMessage('options_rule_limits_dynamic_regex')}
                        </div>
                        <div className={getClassNamesForNumbers(
                            dynamicRulesRegexpsEnabledCount,
                            dynamicRulesRegexpsMaximumCount,
                        )}
                        >
                            {reactTranslator.getMessage('options_rule_limits_numbers', {
                                current: dynamicRulesRegexpsEnabledCount,
                                maximum: dynamicRulesRegexpsMaximumCount,
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
