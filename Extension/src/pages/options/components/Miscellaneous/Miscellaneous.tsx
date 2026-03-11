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
import { TelemetryScreenName } from '../../../../common/telemetry';
import { SettingsSection } from '../Settings/SettingsSection';
import { SettingsSetCheckbox } from '../Settings/SettingsSetCheckbox';
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
import { type SettingHandler } from '../../types';

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

    const [isOpenResetStatsModal, setIsOpenResetStatsModal] = useState(false);
    const [isOpenResetSettingsModal, setIsOpenResetSettingsModal] = useState(false);
    const [isUsageDataModalOpen, setIsUsageDataModalOpen] = useState(false);

    const [isOpenInvertAllowlistModal, setIsOpenInvertAllowlistModal] = useState(false);

    if (!settings) {
        return null;
    }

    const settingChangeHandler: SettingHandler = async ({ id, data }) => {
        logger.trace(`[ext.Miscellaneous]: Setting ${id} set to ${data}`);
        await settingsStore.updateSetting(id, data);
    };

    /**
     * Handles the change of the invert allowlist setting.
     *
     * Note: This handler is used to show a confirmation modal
     * **only** when the user tries to enable the invert allowlist feature,
     * i.e. no modal for its disabling.
     *
     * @param obj Settings object.
     * @param obj.id Setting ID.
     * @param obj.data Setting value.
     *
     * @returns Promise that resolves when the setting is updated.
     */
    const handleInvertAllowlistChange: SettingHandler = async ({ id, data }) => {
        // data === false means DefaultAllowlistMode → false (inverted mode = enabling feature)
        if (data === false) {
            setIsOpenInvertAllowlistModal(true);
            throw new Error('[revert-checkbox] User needs to confirm invert allowlist');
        }

        await addMinDelayLoader(
            uiStore.setShowLoader,
            settingsStore.updateSetting,
        )(id, data);
    };

    /**
     * Handles the confirmation of the invert allowlist modal.
     *
     * @returns Promise that resolves when the setting is updated.
     */
    const handleInvertAllowlistConfirm = async () => {
        await settingsStore.updateSetting(settings.names.DefaultAllowlistMode, false);
    };

    /**
     * Wrapper for the invert allowlist confirm handler with min delay loader,
     * which is needed to apply the changes in the background.
     */
    const handleInvertAllowlistConfirmWrapper = addMinDelayLoader(
        uiStore.setShowLoader,
        handleInvertAllowlistConfirm,
    );

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
                        value={settings.values[UseOptimizedFilters]}
                        handler={settingChangeHandler}
                    />
                )}
                <SettingsSetCheckbox
                    title={translator.getMessage('options_allowlist_invert')}
                    description={translator.getMessage('options_allowlist_invert_desc')}
                    id={DefaultAllowlistMode}
                    label={translator.getMessage('options_allowlist_invert')}
                    value={settings.values[DefaultAllowlistMode]}
                    handler={handleInvertAllowlistChange}
                    inverted
                />
                {isOpenInvertAllowlistModal && (
                    <ConfirmModal
                        title={translator.getMessage('options_invert_allowlist_confirm_modal_title')}
                        subtitle={translator.getMessage('options_invert_allowlist_confirm_modal_subtitle')}
                        isOpen={isOpenInvertAllowlistModal}
                        setIsOpen={setIsOpenInvertAllowlistModal}
                        onConfirm={handleInvertAllowlistConfirmWrapper}
                        customConfirmTitle={
                            translator.getMessage('options_invert_allowlist_confirm_modal_confirm_button')
                        }
                        isConsent
                    />
                )}
                <SettingsSetCheckbox
                    title={translator.getMessage('options_collect_hit_stats_title')}
                    description={reactTranslator.getMessage('options_collect_hit_stats_desc', {
                        a: (chunks: string) => (
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
                    label={translator.getMessage('options_collect_hit_stats_title')}
                    inverted
                    value={settings.values[DisableCollectHits]}
                    handler={settingChangeHandler}
                />
                <SettingsSetCheckbox
                    title={translator.getMessage('options_anonymized_usage_data_title')}
                    description={reactTranslator.getMessage('options_anonymized_usage_data_description', {
                        button: (chunks: string) => (
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
                    value={settings.values[AllowAnonymizedUsageData]}
                    handler={settingChangeHandler}
                />
                <SettingsSetCheckbox
                    title={translator.getMessage('options_show_blocked_ads_count_title')}
                    disabled={settings.values[DisableShowPageStats]}
                    id={DisableShowPageStats}
                    label={translator.getMessage('options_show_blocked_ads_count_title')}
                    inverted
                    value={settings.values[DisableShowPageStats]}
                    handler={settingChangeHandler}
                />

                <SettingsSetCheckbox
                    title={translator.getMessage('options_show_context_menu_title')}
                    disabled={settings.values[DisableShowContextMenu]}
                    id={DisableShowContextMenu}
                    label={translator.getMessage('options_show_context_menu_title')}
                    inverted
                    value={settings.values[DisableShowContextMenu]}
                    handler={settingChangeHandler}
                />

                <SettingsSetCheckbox
                    title={translator.getMessage('options_show_adguard_full_version_title')}
                    disabled={settings.values[DisableShowAdguardPromoInfo]}
                    id={DisableShowAdguardPromoInfo}
                    label={translator.getMessage('options_show_adguard_full_version_title')}
                    inverted
                    value={settings.values[DisableShowAdguardPromoInfo]}
                    handler={settingChangeHandler}
                />

                <SettingsSetCheckbox
                    title={translator.getMessage('options_show_app_updated_notification')}
                    disabled={settings.values[DisableShowAppUpdatedNotification]}
                    id={DisableShowAppUpdatedNotification}
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
                        subtitle={translator.getMessage('options_clear_stats_confirm_modal_subtitle')}
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
                        subtitle={translator.getMessage('options_reset_settings_confirm_modal_subtitle')}
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
