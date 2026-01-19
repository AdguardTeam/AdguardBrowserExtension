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

import cn from 'classnames';

import { ConfirmModal } from '../../../../common/components/ConfirmModal';
import { Icon } from '../../../../common/components/ui/Icon';
import { Popover } from '../../../../common/components/ui/Popover';
import { translator } from '../../../../../common/translators/translator';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { rootStore } from '../../../stores/RootStore';
import { FILTER_POLICY_URL } from '../../../constants';
import theme from '../../../../common/styles/theme';

import styles from './annoyances-consent.module.pcss';

type AnnoyancesConsentProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onConfirm: () => void;
    onCancel: () => void;
    shouldShowFilterPolicy: boolean;
};

export const AnnoyancesConsent = observer(({
    isOpen,
    setIsOpen,
    onConfirm,
    onCancel,
    shouldShowFilterPolicy,
}: AnnoyancesConsentProps) => {
    const { settingsStore } = useContext(rootStore);

    const { filtersToGetConsentFor } = settingsStore;

    const tooltipText = translator.getMessage('options_filters_annoyances_consent_filter_homepage_tooltip');

    const renderFilters = () => {
        return filtersToGetConsentFor.map((filter) => (
            <li key={filter.filterId} className={styles.filterItem}>
                <div className={styles.filterHeader}>
                    <div className={styles.filterName}>
                        {filter.name}
                    </div>
                    <Popover text={tooltipText}>
                        <a
                            href={filter.homepage}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(styles.filterHomepageLink, theme.common.hideOnMobile)}
                        >
                            <Icon id="#link" aria-hidden="true" className="icon--24" />
                        </a>
                    </Popover>
                </div>
                <div className={styles.filterDescription}>
                    {filter.description}
                </div>
            </li>
        ));
    };

    const renderSubtitle = () => (
        <div className={styles.content}>
            <div className={`${styles.text} ${styles.description}`}>
                {translator.getMessage('options_filters_annoyances_consent_description')}
            </div>
            <div className={`${styles.text} ${styles.description}`}>
                {translator.getMessage('options_filters_annoyances_consent_question')}
            </div>
            <ul className={`${styles.text} ${styles.filters}`}>
                {renderFilters()}
            </ul>
            {shouldShowFilterPolicy && (
                <div className={styles.filterPolicy}>
                    {reactTranslator.getMessage('options_filters_annoyances_consent_filter_policy', {
                        a: (chunks: string[]) => (
                            <a
                                className={styles.filterPolicyLink}
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
