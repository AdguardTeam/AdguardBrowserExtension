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

import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { SettingsSection } from '../Settings/SettingsSection';
import { SettingsSetCheckbox } from '../Settings/SettingsSetCheckbox';
import { SETTINGS_TYPES } from '../Settings/Setting';
import { messenger } from '../../../services/messenger';
import { rootStore } from '../../stores/RootStore';
import { userRulesEditorStore } from '../../../common/components/UserRulesEditor/UserRulesEditorStore';
import { Log } from '../../../../common/log';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { ConfirmModal } from '../../../common/components/ConfirmModal';
import { COLLECT_HITS_LEARN_MORE_URL } from '../../constants';

const Miscellaneous = observer(() => {
    const {
        settingsStore,
        uiStore,
    } = useContext(rootStore);

    const userRulesEditorStoreContext = useContext(userRulesEditorStore);

    const { settings } = settingsStore;

    const [isOpenResetStatsModal, setIsOpenResetStatsModal] = useState(false);
    const [isOpenResetSettingsModal, setIsOpenResetSettingsModal] = useState(false);

    if (!settings) {
        return null;
    }

    const settingChangeHandler = async ({ id, data }) => {
        Log.info(`Setting ${id} set to ${data}`);
        await settingsStore.updateSetting(id, data);
    };

    const handleFilteringLogClick = async () => {
        await messenger.openFilteringLog();
    };

    const handleResetStatisticsClick = async () => {
        setIsOpenResetStatsModal(true);
    };

    const handleResetStatisticsConfirm = async () => {
        await messenger.resetStatistics();
        uiStore.addNotification({ description: reactTranslator.getMessage('options_reset_stats_done') });
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
            uiStore.addNotification({ description: reactTranslator.getMessage('options_reset_settings_done') });
        } else {
            uiStore.addNotification({ description: reactTranslator.getMessage('options_reset_settings_error') });
        }
    };

    const {
        UseOptimizedFilters,
        DisableCollectHits,
        DisableShowContextMenu,
        DisableShowAdguardPromoInfo,
        DisableShowAppUpdatedNotification,
        DisableShowPageStats,
        DefaultAllowlistMode,
    } = settings.names;

    return (
        <>
            <SettingsSection title={reactTranslator.getMessage('options_miscellaneous_settings')}>
                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_use_optimized_filters')}
                    description={reactTranslator.getMessage('options_use_optimized_filters_desc')}
                    disabled={!settings.values[UseOptimizedFilters]}
                    id={UseOptimizedFilters}
                    label={reactTranslator.getMessage('options_use_optimized_filters')}
                    type={SETTINGS_TYPES.CHECKBOX}
                    value={settings.values[UseOptimizedFilters]}
                    handler={settingChangeHandler}
                />
                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_allowlist_invert')}
                    description={reactTranslator.getMessage('options_allowlist_invert_desc')}
                    id={DefaultAllowlistMode}
                    label={reactTranslator.getMessage('options_allowlist_invert')}
                    type={SETTINGS_TYPES.CHECKBOX}
                    value={settings.values[DefaultAllowlistMode]}
                    handler={settingChangeHandler}
                    inverted
                />
                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_collect_hit_stats_title')}
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
                    label={reactTranslator.getMessage('options_collect_hit_stats_title')}
                    inverted
                    value={settings.values[DisableCollectHits]}
                    handler={settingChangeHandler}
                />

                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_show_blocked_ads_count_title')}
                    disabled={settings.values[DisableShowPageStats]}
                    id={DisableShowPageStats}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={reactTranslator.getMessage('options_show_blocked_ads_count_title')}
                    inverted
                    value={settings.values[DisableShowPageStats]}
                    handler={settingChangeHandler}
                />

                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_show_context_menu_title')}
                    disabled={settings.values[DisableShowContextMenu]}
                    id={DisableShowContextMenu}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={reactTranslator.getMessage('options_show_context_menu_title')}
                    inverted
                    value={settings.values[DisableShowContextMenu]}
                    handler={settingChangeHandler}
                />

                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_show_adguard_full_version_title')}
                    disabled={settings.values[DisableShowAdguardPromoInfo]}
                    id={DisableShowAdguardPromoInfo}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={reactTranslator.getMessage('options_show_adguard_full_version_title')}
                    inverted
                    value={settings.values[DisableShowAdguardPromoInfo]}
                    handler={settingChangeHandler}
                />

                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_show_app_updated_notification')}
                    disabled={settings.values[DisableShowAppUpdatedNotification]}
                    id={DisableShowAppUpdatedNotification}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={reactTranslator.getMessage('options_show_app_updated_notification')}
                    inverted
                    value={settings.values[DisableShowAppUpdatedNotification]}
                    handler={settingChangeHandler}
                />
                <button
                    type="button"
                    className="button button--list"
                    onClick={handleFilteringLogClick}
                >
                    {reactTranslator.getMessage('options_open_log')}
                </button>

                {
                    isOpenResetStatsModal
                        && (
                            <ConfirmModal
                                title={reactTranslator.getMessage('options_clear_stats_confirm_modal_title')}
                                isOpen={isOpenResetStatsModal}
                                setIsOpen={setIsOpenResetStatsModal}
                                onConfirm={handleResetStatisticsConfirm}
                                customConfirmTitle={reactTranslator.getMessage('options_clear_stats_confirm_modal_clear_button')}
                                customCancelTitle={reactTranslator.getMessage('options_confirm_modal_cancel_button')}
                            />
                        )
                }
                <button
                    type="button"
                    className="button button--list button--red"
                    onClick={handleResetStatisticsClick}
                >
                    {reactTranslator.getMessage('options_reset_stats')}
                </button>

                {
                    isOpenResetSettingsModal
                    && (
                        <ConfirmModal
                            title={reactTranslator.getMessage('options_reset_settings_confirm_modal_title')}
                            isOpen={isOpenResetSettingsModal}
                            setIsOpen={setIsOpenResetSettingsModal}
                            onConfirm={handleResetSettingsConfirm}
                            customConfirmTitle={reactTranslator.getMessage('options_reset_settings_confirm_modal_clear_button')}
                            customCancelTitle={reactTranslator.getMessage('options_confirm_modal_cancel_button')}
                        />
                    )
                }
                <button
                    type="button"
                    className="button button--list button--red"
                    onClick={handleResetSettingsClick}
                >
                    {reactTranslator.getMessage('options_reset_settings')}
                </button>
            </SettingsSection>
        </>
    );
});

export { Miscellaneous };
