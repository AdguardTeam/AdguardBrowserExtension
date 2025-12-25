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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { ConfirmModal } from '../../../../common/components/ConfirmModal';
import { Icon } from '../../../../common/components/ui/Icon';
import { Popover } from '../../../../common/components/ui/Popover';
import { translator } from '../../../../../common/translators/translator';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { rootStore } from '../../../stores/RootStore';
import { FILTER_POLICY_URL } from '../../../constants';

import './annoyances-consent.pcss';

export const AnnoyancesConsent = observer(({
    isOpen,
    setIsOpen,
    onConfirm,
    onCancel,
    shouldShowFilterPolicy,
}) => {
    const { settingsStore } = useContext(rootStore);

    const { filtersToGetConsentFor } = settingsStore;

    const tooltipText = translator.getMessage('options_filters_annoyances_consent_filter_homepage_tooltip');

    const renderFilters = () => {
        return filtersToGetConsentFor.map((filter) => (
            <li key={filter.filterId} className="annoyances-consent__text annoyances-consent__filter">
                <div className="annoyances-consent__filter--header">
                    <div className="annoyances-consent__filter--name">
                        {filter.name}
                    </div>
                    <Popover text={tooltipText}>
                        <a
                            href={filter.homepage}
                            target="_blank"
                            rel="noreferrer"
                            className="annoyances-consent__filter--homepage-link"
                        >
                            <Icon id="#link" aria-hidden="true" />
                        </a>
                    </Popover>
                </div>
                <div className="annoyances-consent__filter--description">
                    {filter.description}
                </div>
            </li>
        ));
    };

    const renderSubtitle = () => (
        <div className="annoyances-consent__content">
            <div className="annoyances-consent__text annoyances-consent__description">
                {translator.getMessage('options_filters_annoyances_consent_description')}
            </div>
            <div className="annoyances-consent__text annoyances-consent__description">
                {translator.getMessage('options_filters_annoyances_consent_question')}
            </div>
            <ul className="annoyances-consent__text annoyances-consent__filters">
                {renderFilters()}
            </ul>
            {shouldShowFilterPolicy && (
                <div className="annoyances-consent__filter--policy">
                    {reactTranslator.getMessage('options_filters_annoyances_consent_filter_policy', {
                        a: (chunks) => (
                            <a
                                className="annoyances-consent__filter--policy--link"
                                href={FILTER_POLICY_URL}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {chunks}
                            </a>
                        ),
                    })}
                </div>
            )}
        </div>
    );

    return (
        <ConfirmModal
            title={translator.getMessage('options_filters_annoyances_consent_title')}
            subtitle={renderSubtitle()}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            onConfirm={onConfirm}
            onCancel={onCancel}
            customConfirmTitle={translator.getMessage('options_filters_annoyances_consent_enable_button')}
            isConsent
            isScrollable={filtersToGetConsentFor.length > 1}
            isOptionalBtnHidden
        />
    );
});
