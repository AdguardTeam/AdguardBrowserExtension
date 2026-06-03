/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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
import { Link } from 'react-router-dom';

import cn from 'classnames';

import { translator } from '../../../../../common/translators/translator';
import { OptionsPageSections } from '../../../../../common/nav';
import { Icon } from '../../../../common/components/ui/Icon';
import { rootStore } from '../../../stores/RootStore';
import { messenger } from '../../../../services/messenger';
import { getCtaByOs } from '../../General/DesktopAppPromo/DesktopAppPromo';

import styles from './waring-variant-b.module.pcss';

/**
 * Props for the WarningVariantB component.
 */
type WarningVariantBProps = {
    /**
     * Function to close the warning.
     */
    onClickCloseWarning: () => void;
};

/**
 * Warning component for variant B of the A/B test.
 * Displays a simplified warning with actionable steps.
 */
export const WarningVariantB = ({ onClickCloseWarning }: WarningVariantBProps) => {
    const { settingsStore } = useContext(rootStore);

    const {
        areFilterLimitsExceeded,
        shouldShowLimitLoweredWarning: isLimitLowered,
    } = settingsStore.rulesLimits;

    const handleManageExtensions = async () => {
        await messenger.openChromeExtensionsPage();
    };

    if (!isLimitLowered && !areFilterLimitsExceeded) {
        return null;
    }

    const titleKey = areFilterLimitsExceeded
        ? 'options_rule_limits_warning_variant_b_title_limit_reached'
        : 'options_rule_limits_warning_variant_b_title_limit_lowered';

    const { text: desktopAppButtonLabel, url: desktopAppUrl } = getCtaByOs();

    return (
        <div className={styles.warningWrapper}>
            <div className={styles.warning}>
                <div className={styles.title}>
                    {translator.getMessage(titleKey)}
                </div>

                <div className={styles.subtitle}>
                    {translator.getMessage('options_rule_limits_warning_variant_b_subtitle')}
                </div>

                <button
                    type="button"
                    className={styles.close}
                    onClick={onClickCloseWarning}
                    aria-label={translator.getMessage('close_button_title')}
                >
                    <Icon
                        id="#cross"
                        className="icon--24 icon--gray-default"
                        aria-hidden="true"
                    />
                </button>

                <div className={styles.warningSections}>
                    {isLimitLowered && (
                        <div className={styles.section}>
                            <Icon
                                id="#setting-0"
                                className="icon--24 icon--orange-default"
                                aria-hidden="true"
                            />
                            <div>
                                <div className={styles.sectionTitle}>
                                    {
                                        translator.getMessage(
                                            'options_rule_limits_warning_variant_b_remove_blockers_title',
                                        )
                                    }
                                </div>
                                <div className={styles.sectionDescription}>
                                    {
                                        translator.getMessage(
                                            'options_rule_limits_warning_variant_b_remove_blockers_description',
                                        )
                                    }
                                </div>
                                <button
                                    type="button"
                                    className={styles.link}
                                    onClick={handleManageExtensions}
                                >
                                    {translator.getMessage('options_rule_limits_warning_variant_b_manage_extensions')}
                                </button>
                            </div>
                        </div>
                    )}

                    {areFilterLimitsExceeded && (
                        <div className={styles.section}>
                            <Icon
                                id="#setting-7"
                                className="icon--24 icon--orange-default"
                                aria-hidden="true"
                            />
                            <div>
                                <div className={styles.sectionTitle}>
                                    {
                                        translator.getMessage(
                                            'options_rule_limits_warning_variant_b_review_filters_title',
                                        )
                                    }
                                </div>
                                <div className={styles.sectionDescription}>
                                    {
                                        translator.getMessage(
                                            'options_rule_limits_warning_variant_b_review_filters_description',
                                        )
                                    }
                                </div>
                                <Link
                                    to={`/${OptionsPageSections.filters}`}
                                    className={styles.link}
                                >
                                    {translator.getMessage('options_rule_limits_warning_variant_b_go_to_filters')}
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {(areFilterLimitsExceeded || isLimitLowered) && (
                    <div className={cn(styles.section, styles.getAppSection)}>
                        <Icon
                            id="#quality"
                            className="icon--24 icon--green-default"
                            aria-hidden="true"
                        />

                        <div>
                            <div className={styles.sectionTitle}>
                                {translator.getMessage('options_rule_limits_warning_variant_b_desktop_app_title')}
                            </div>
                            <div className={styles.sectionDescription}>
                                {translator.getMessage('options_rule_limits_warning_variant_b_desktop_app_description')}
                            </div>
                            <a
                                href={desktopAppUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={cn('button button--green-bg button--m', styles.getAppButton)}
                            >
                                {desktopAppButtonLabel}
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
