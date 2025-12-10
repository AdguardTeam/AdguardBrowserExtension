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

import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { useTelemetryPageViewEvent } from '../../../common/telemetry';
import { TelemetryScreenName } from '../../../../background/services/telemetry/enums';
import { SettingsSection } from '../Settings/SettingsSection';
import { SettingsSetCheckbox } from '../Settings/SettingsSetCheckbox';
import { SETTINGS_TYPES } from '../Settings/Setting';
import { messenger } from '../../../services/messenger';
import { rootStore } from '../../stores/RootStore';
import { NotificationType } from '../../../common/types';
import { addMinDelayLoader } from '../../../common/components/helpers';
import { userRulesEditorStore } from '../../../common/components/UserRulesEditor/UserRulesEditorStore';
import { logger } from '../../../../common/logger';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { translator } from '../../../../common/translators/translator';
import { ConfirmModal } from '../../../common/components/ConfirmModal';
import { COLLECT_HITS_LEARN_MORE_URL } from '../../constants';

import { ExtensionUsageDataModal } from './ExtensionUsageDataModal/ExtensionUsageDataModal';

export const Miscellaneous = observer(() => {
    const {
        settingsStore,
        uiStore,
        telemetryStore,
    } = useContext(rootStore);

    useTelemetryPageViewEvent(telemetryStore, TelemetryScreenName.AdditionalSettings);

    const userRulesEditorStoreContext = useContext(userRulesEditorStore);

    const { settings } = settingsStore;

    if (!settings) {
        return null;
    }

    const [isOpenResetStatsModal, setIsOpenResetStatsModal] = useState(false);
    const [isOpenResetSettingsModal, setIsOpenResetSettingsModal] = useState(false);
    const [isUsageDataModalOpen, setIsUsageDataModalOpen] = useState(false);

    const settingChangeHandler = async ({ id, data }) => {
        logger.trace(`[ext.Miscellaneous]: Setting ${id} set to ${data}`);
        await settingsStore.updateSetting(id, data);
    };

    const handleInvertAllowlistChange = async ({ id, data }) => {
        await addMinDelayLoader(
            uiStore.setShowLoader,
            settingsStore.updateSetting,
        )(id, data);
    };

    const handleFilteringLogClick = async () => {
        await messenger.openFilteringLog();
    };

    const handleResetStatisticsClick = async () => {
        setIsOpenResetStatsModal(true);
    };

    const handleResetStatisticsConfirm = async () => {
        await messenger.resetStatistics();
        uiStore.addNotification({
            type: NotificationType.Success,
            text: translator.getMessage('options_reset_stats_done'),
        });
    };

    const handleResetSettingsClick = async () => {
        setIsOpenResetSettingsModal(true);
    };

    const handleResetSettingsConfirm = async () => {
        settingsStore.setAllowlistSizeReset(true);
        userRulesEditorStoreContext.setUserRulesEditorPrefsDropped(true);

        const result = await messenger.resetSettings();
        if (result) {
            /* force all setting context data update with 'firstRender' option */
            settingsStore.requestOptionsData(true);
            uiStore.addNotification({
                type: NotificationType.Success,
                text: translator.getMessage('options_reset_settings_done'),
            });
        } else {
            uiStore.addNotification({
                type: NotificationType.Error,
                text: translator.getMessage('options_reset_settings_error'),
            });
        }

        if (__IS_MV3__) {
            await settingsStore.checkLimitations();
        }
    };

    const handleResetSettingsConfirmWrapper = addMinDelayLoader(
        uiStore.setShowLoader,
        handleResetSettingsConfirm,
    );

    const {
        UseOptimizedFilters,
        DisableCollectHits,
        AllowAnonymizedUsageData,
        DisableShowContextMenu,
        DisableShowAdguardPromoInfo,
        DisableShowAppUpdatedNotification,
        DisableShowPageStats,
        DefaultAllowlistMode,
    } = settings.names;

    return (
        <SettingsSection title={translator.getMessage('options_miscellaneous_settings')}>
            <div className="settings__group">
                {!__IS_MV3__ && (
                    <SettingsSetCheckbox
                        title={translator.getMessage('options_use_optimized_filters')}
                        description={translator.getMessage('options_use_optimized_filters_desc')}
                        disabled={!settings.values[UseOptimizedFilters]}
                        id={UseOptimizedFilters}
                        label={translator.getMessage('options_use_optimized_filters')}
                        type={SETTINGS_TYPES.CHECKBOX}
                        value={settings.values[UseOptimizedFilters]}
                        handler={settingChangeHandler}
                    />
                )}
                <SettingsSetCheckbox
                    title={translator.getMessage('options_allowlist_invert')}
                    description={translator.getMessage('options_allowlist_invert_desc')}
                    id={DefaultAllowlistMode}
                    label={translator.getMessage('options_allowlist_invert')}
                    type={SETTINGS_TYPES.CHECKBOX}
                    value={settings.values[DefaultAllowlistMode]}
                    handler={handleInvertAllowlistChange}
                    inverted
                />
                <SettingsSetCheckbox
                    title={translator.getMessage('options_collect_hit_stats_title')}
                    description={reactTranslator.getMessage('options_collect_hit_stats_desc', {
                        a: (chunks) => (
                            <a
                                href={COLLECT_HITS_LEARN_MORE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {chunks}
                            </a>
                        ),
                    })}
                    disabled={settings.values[DisableCollectHits]}
                    id={DisableCollectHits}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={translator.getMessage('options_collect_hit_stats_title')}
                    inverted
                    value={settings.values[DisableCollectHits]}
                    handler={settingChangeHandler}
                />
                <SettingsSetCheckbox
                    title={translator.getMessage('options_anonymized_usage_data_title')}
                    description={reactTranslator.getMessage('options_anonymized_usage_data_description', {
                        button: (chunks) => (
                            <button
                                type="button"
                                className="button button--link button--link--underlined button--link--green"
                                onClick={() => setIsUsageDataModalOpen(true)}
                            >
                                {chunks}
                            </button>
                        ),
                    })}
                    id={AllowAnonymizedUsageData}
                    label={translator.getMessage('options_anonymized_usage_data_title')}
                    type={SETTINGS_TYPES.CHECKBOX}
                    value={settings.values[AllowAnonymizedUsageData]}
                    handler={settingChangeHandler}
                />
                <SettingsSetCheckbox
                    title={translator.getMessage('options_show_blocked_ads_count_title')}
                    disabled={settings.values[DisableShowPageStats]}
                    id={DisableShowPageStats}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={translator.getMessage('options_show_blocked_ads_count_title')}
                    inverted
                    value={settings.values[DisableShowPageStats]}
                    handler={settingChangeHandler}
                />

                <SettingsSetCheckbox
                    title={translator.getMessage('options_show_context_menu_title')}
                    disabled={settings.values[DisableShowContextMenu]}
                    id={DisableShowContextMenu}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={translator.getMessage('options_show_context_menu_title')}
                    inverted
                    value={settings.values[DisableShowContextMenu]}
                    handler={settingChangeHandler}
                />

                <SettingsSetCheckbox
                    title={translator.getMessage('options_show_adguard_full_version_title')}
                    disabled={settings.values[DisableShowAdguardPromoInfo]}
                    id={DisableShowAdguardPromoInfo}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={translator.getMessage('options_show_adguard_full_version_title')}
                    inverted
                    value={settings.values[DisableShowAdguardPromoInfo]}
                    handler={settingChangeHandler}
                />

                <SettingsSetCheckbox
                    title={translator.getMessage('options_show_app_updated_notification')}
                    disabled={settings.values[DisableShowAppUpdatedNotification]}
                    id={DisableShowAppUpdatedNotification}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={translator.getMessage('options_show_app_updated_notification')}
                    inverted
                    value={settings.values[DisableShowAppUpdatedNotification]}
                    handler={settingChangeHandler}
                />
            </div>
            <div className="links-menu links-menu--section">
                <button
                    type="button"
                    className="links-menu__item button--link--green"
                    onClick={handleFilteringLogClick}
                >
                    {translator.getMessage('options_open_log')}
                </button>

                {isOpenResetStatsModal && (
                    <ConfirmModal
                        title={translator.getMessage('options_clear_stats_confirm_modal_title')}
                        isOpen={isOpenResetStatsModal}
                        setIsOpen={setIsOpenResetStatsModal}
                        onConfirm={handleResetStatisticsConfirm}
                        customConfirmTitle={translator.getMessage('options_clear_stats_confirm_modal_clear_button')}
                    />
                )}

                <button
                    type="button"
                    className="links-menu__item button--link--red"
                    onClick={handleResetStatisticsClick}
                >
                    {translator.getMessage('options_reset_stats')}
                </button>

                {isOpenResetSettingsModal && (
                    <ConfirmModal
                        title={translator.getMessage('options_reset_settings_confirm_modal_title')}
                        isOpen={isOpenResetSettingsModal}
                        setIsOpen={setIsOpenResetSettingsModal}
                        onConfirm={handleResetSettingsConfirmWrapper}
                        customConfirmTitle={
                            translator.getMessage('options_reset_settings_confirm_modal_clear_button')
                        }
                    />
                )}

                <ExtensionUsageDataModal
                    closeModalHandler={() => setIsUsageDataModalOpen(false)}
                    isOpen={isUsageDataModalOpen}
                />

                <button
                    type="button"
                    className="links-menu__item button--link--red"
                    onClick={handleResetSettingsClick}
                >
                    {translator.getMessage('options_reset_settings')}
                </button>
            </div>
        </SettingsSection>
    );
});
