// TODO figure out how to fix the eslint errors
/* eslint-disable jsx-a11y/anchor-is-valid,jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
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

import React from 'react';

import {
    Forward,
    ForwardAction,
    ForwardFrom,
} from '../../../../../common/forward';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { translator } from '../../../../../common/translators/translator';

/**
 * Props for the Warning component
 */
type WarningProps = {
    /**
     * String with names of filters that are enabled.
     */
    actuallyEnabledFilterNames: string,

    /**
     * String with names of filters that were expected to be enabled.
     */
    expectedEnabledFilterNames: string,

    /**
     * Function to reactivate filters.
     */
    onClickReactivateFilters: () => void,

    /**
     * Function to close the warning.
     */
    onClickCloseWarning: () => void,
};

/**
 * Warning component
 * It displays a warning message if some filters could not be enabled.
 *
 * @param $0 WarningProps
 * @param $0.actuallyEnabledFilterNames String with names of filters that are enabled.
 * @param $0.expectedEnabledFilterNames String with names of filters that were expected to be enabled.
 * @param $0.onClickReactivateFilters Function to reactivate filters.
 * @param $0.onClickCloseWarning Function to close the warning.
 */
export const Warning = ({
    actuallyEnabledFilterNames,
    expectedEnabledFilterNames,
    onClickReactivateFilters,
    onClickCloseWarning,
}: WarningProps) => {
    const getTheAppUrl = Forward.get({
        action: ForwardAction.GetTheApp,
        from: ForwardFrom.Options,
    });

    return (
        <>
            <div className="rules-limits rules-limits__warning">
                <div className="rules-limits__warning-title">
                    {translator.getMessage('options_rule_limits_warning_title')}
                </div>
                <div className="rules-limits__section">
                    <div className="rules-limits__section-title">
                        {translator.getMessage('options_rule_limits_warning_explanation_title')}
                    </div>
                    <div className="rules-limits__group rules-limits__text--gray">
                        {translator.getMessage('options_rule_limits_warning_explanation_description')}
                    </div>
                </div>
                <div className="rules-limits__section">
                    <div className="rules-limits__section-title">
                        {translator.getMessage('options_rule_limits_warning_list_enabled_before_title')}
                    </div>
                    <div className="rules-limits__group rules-limits__text--gray">
                        {expectedEnabledFilterNames}
                    </div>
                </div>
                <div className="rules-limits__section">
                    <div className="rules-limits__section-title">
                        {translator.getMessage('options_rule_limits_warning_list_enabled_now_title')}
                    </div>
                    <div className="rules-limits__group rules-limits__text--gray">
                        {
                            actuallyEnabledFilterNames.trim().length === 0
                                ? translator.getMessage('options_filters_no_enabled')
                                : actuallyEnabledFilterNames
                        }
                    </div>
                </div>
                <div className="rules-limits__section">
                    <div className="rules-limits__section-title">
                        {translator.getMessage('options_rule_limits_warning_actions_title')}
                    </div>
                    <div className="rules-limits__group rules-limits__text--gray">
                        <div className="rules-limits__group-option">
                            {reactTranslator.getMessage('options_rule_limits_warning_actions_delete_filters', {
                                a: (chunks: string) => (
                                    <a
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rules-limits__group-option-link"
                                        onClick={onClickReactivateFilters}
                                    >
                                        {chunks}
                                    </a>
                                ),
                            })}
                        </div>
                        <div className="rules-limits__group-option">
                            {reactTranslator.getMessage('options_rule_limits_warning_actions_install_app', {
                                a: (chunks: string) => (
                                    <a
                                        target="_blank"
                                        rel="noreferrer"
                                        href={getTheAppUrl}
                                        className="rules-limits__group-option-link rules-limits__text--gray"
                                    >
                                        {chunks}
                                    </a>
                                ),
                            })}
                        </div>
                        <div className="rules-limits__group-option">
                            {reactTranslator.getMessage(
                                actuallyEnabledFilterNames.length > 0
                                    ? 'options_rule_limits_warning_actions_close_warning_multiple_filters'
                                    : 'options_rule_limits_warning_actions_close_warning_one_filter',
                                {
                                    a: (chunks: string) => (
                                        <a
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rules-limits__group-option-link"
                                            onClick={onClickCloseWarning}
                                        >
                                            {chunks}
                                        </a>
                                    ),
                                },
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
