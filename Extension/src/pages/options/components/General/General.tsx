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

// TODO remove no-explicit-any disabling
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { SettingsSection } from '../Settings/SettingsSection';
import { SettingsSetCheckbox } from '../Settings/SettingsSetCheckbox';
import { SettingSetSelect } from '../Settings/SettingSetSelect';
import { SETTINGS_TYPES } from '../Settings/Setting';
import { rootStore } from '../../stores/RootStore';
import { messenger } from '../../../services/messenger';
import { handleFileUpload } from '../../../helpers';
import { AppearanceTheme } from '../../../../common/settings';
import {
    ACCEPTABLE_ADS_LEARN_MORE_URL,
    SAFEBROWSING_LEARN_MORE_URL,
    BUG_REPORT_URL,
    BUG_REPORT_MV3_URL,
} from '../../constants';
import { addMinDelayLoader } from '../../../common/components/helpers';
import { exportData, ExportTypes } from '../../../common/utils/export';
import { getErrorMessage } from '../../../../common/error';
import { SettingHandler } from '../../types';
import { ensurePermission } from '../../ensure-permission';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { translator } from '../../../../common/translators/translator';
import { Unknown } from '../../../../common/unknown';
import { FiltersUpdateTime } from '../../../../common/constants';
import { MessageType } from '../../../../common/messages';
import { StaticFiltersLimitsWarning } from '../Warnings';

const filtersUpdatePeriodOptions = [
    {
        value: FiltersUpdateTime.Default,
        title: translator.getMessage('options_select_update_period_default'),
    },
    {
        value: FiltersUpdateTime.FortyEightHours,
        title: translator.getMessage('options_select_update_period_48h'),
    },
    {
        value: FiltersUpdateTime.TwentyFourHours,
        title: translator.getMessage('options_select_update_period_24h'),
    },
    {
        value: FiltersUpdateTime.TwelveHours,
        title: translator.getMessage('options_select_update_period_12h'),
    },
    {
        value: FiltersUpdateTime.SixHours,
        title: translator.getMessage('options_select_update_period_6h'),
    },
    {
        value: FiltersUpdateTime.OneHour,
        title: translator.getMessage('options_select_update_period_1h'),
    },
    {
        value: FiltersUpdateTime.Disabled,
        title: translator.getMessage('options_select_update_period_disabled'),
    },
];

const APPEARANCE_THEMES_OPTIONS = [
    {
        value: AppearanceTheme.System,
        title: translator.getMessage('options_theme_selector_system'),
    },
    {
        value: AppearanceTheme.Light,
        title: translator.getMessage('options_theme_selector_light'),
    },
    {
        value: AppearanceTheme.Dark,
        title: translator.getMessage('options_theme_selector_dark'),
    },
];

const AllowAcceptableAds = 'allowAcceptableAds';

/**
 * We need to handle privacy permission on user action.
 * That is why we check for privacy permission on the UI.
 *
 * @throws error if privacy permission is required, but it wasn't given
 */
const handlePrivacyPermissionForWebRtc = (content: string): Promise<boolean> => {
    const json: unknown = JSON.parse(content);

    const blockWebRtc = Unknown.get(json, 'stealth.stealth-block-webrtc');

    if (typeof blockWebRtc !== 'boolean') {
        throw new Error('Was not able to parse file content');
    }

    return ensurePermission(blockWebRtc);
};

export const General = observer(() => {
    const {
        settingsStore,
        uiStore,
    } = useContext(rootStore);

    const { settings, allowAcceptableAds }: any = settingsStore;

    if (!settings) {
        return null;
    }

    const handleExportSettings = () => {
        exportData(ExportTypes.SETTINGS);
    };

    const inputChangeHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
        event.persist();
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const content = await handleFileUpload(file, 'json');
            const success = await handlePrivacyPermissionForWebRtc(content);
            if (!success) {
                uiStore.addNotification({
                    description: translator.getMessage('options_popup_import_error_required_privacy_permission'),
                });
                event.target.value = '';
                return;
            }

            const result = await messenger.applySettingsJson(content);

            if (result) {
                if (!__IS_MV3__) {
                    const successMessage = translator.getMessage('options_popup_import_success_title');
                    uiStore.addNotification({ description: successMessage });
                } else {
                    const limitsCheckResult = await settingsStore.checkLimitations();
                    if (!limitsCheckResult.ok) {
                        const message = translator.getMessage('options_popup_import_error_title');
                        uiStore.addNotification({ description: message });
                    } else {
                        const successMessage = translator.getMessage('options_popup_import_success_title');
                        uiStore.addNotification({ description: successMessage });
                    }
                }
            } else {
                const errorMessage = translator.getMessage('options_popup_import_error_file_description');
                uiStore.addNotification({ description: errorMessage });
            }
        } catch (e) {
            const message = getErrorMessage(e) || translator.getMessage('options_popup_import_error_title');
            uiStore.addNotification({ description: message });
        }

        // eslint-disable-next-line no-param-reassign
        event.target.value = '';
    };

    const inputChangeHandlerWrapper = addMinDelayLoader(
        uiStore.setShowLoader,
        inputChangeHandler,
    );

    const handleLeaveFeedback = async () => {
        await messenger.openExtensionStore();
    };

    const allowAcceptableAdsChangeHandler: SettingHandler = async ({ data }) => {
        await addMinDelayLoader(
            uiStore.setShowLoader,
            settingsStore.setAllowAcceptableAdsState,
        )(data);
    };

    const settingChangeHandler: SettingHandler = async ({ id, data }) => {
        await settingsStore.updateSetting(id, data);
    };

    const appearanceChangeHandler: SettingHandler = async (payload) => {
        await settingChangeHandler(payload);

        // no need to wait for the result so no await for message sending
        messenger.sendMessage(MessageType.UpdateFullscreenUserRulesTheme, {
            theme: payload.data,
        });
    };

    const {
        DisableDetectFilters,
        FiltersUpdatePeriod,
        DisableSafebrowsing,
        AppearanceTheme,
    } = settings.names;

    return (
        <>
            <SettingsSection title={translator.getMessage('options_general_settings')}>
                <StaticFiltersLimitsWarning useWrapper />
                { /* TODO fix type error when SettingsSection be rewritten in typescript */ }
                {/* @ts-ignore */}
                <SettingSetSelect
                    title={translator.getMessage('options_select_theme')}
                    id={AppearanceTheme}
                    options={APPEARANCE_THEMES_OPTIONS}
                    value={settings.values[AppearanceTheme]}
                    handler={appearanceChangeHandler}
                />
                <SettingsSetCheckbox
                    // TODO fix type error when SettingsSetCheckbox be rewritten in typescript
                    // @ts-ignore
                    title={translator.getMessage('options_block_acceptable_ads')}
                    description={reactTranslator.getMessage('options_block_acceptable_ads_desc', {
                        // TODO fix type error when SettingsSetCheckbox be rewritten in typescript
                        // @ts-ignore
                        a: (chunks) => (
                            <a
                                href={ACCEPTABLE_ADS_LEARN_MORE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {chunks}
                            </a>
                        ),
                    })}
                    disabled={allowAcceptableAds}
                    id={AllowAcceptableAds}
                    type={SETTINGS_TYPES.CHECKBOX}
                    value={!allowAcceptableAds}
                    label={translator.getMessage('options_block_acceptable_ads')}
                    handler={allowAcceptableAdsChangeHandler}
                />
                {!__IS_MV3__ && (
                    <SettingsSetCheckbox
                        // TODO fix type error when SettingsSetCheckbox be rewritten in typescript
                        // @ts-ignore
                        title={translator.getMessage('options_safebrowsing_enabled')}
                        description={reactTranslator.getMessage('options_safebrowsing_enabled_desc', {
                            // TODO fix type error when SettingsSetCheckbox be rewritten in typescript
                            // @ts-ignore
                            a: (chunks) => (
                                <a
                                    href={SAFEBROWSING_LEARN_MORE_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {chunks}
                                </a>
                            ),
                        })}
                        disabled={settings.values[DisableSafebrowsing]}
                        id={DisableSafebrowsing}
                        type={SETTINGS_TYPES.CHECKBOX}
                        inverted
                        label={translator.getMessage('options_safebrowsing_enabled')}
                        value={settings.values[DisableSafebrowsing]}
                        handler={settingChangeHandler}
                    />
                )}
                {!__IS_MV3__ && (
                    <SettingsSetCheckbox
                        // TODO fix type error when SettingsSetCheckbox be rewritten in typescript
                        // @ts-ignore
                        title={translator.getMessage('options_enable_autodetect_filter')}
                        description={translator.getMessage('options_enable_autodetect_filter_desc')}
                        disabled={settings.values[DisableDetectFilters]}
                        id={DisableDetectFilters}
                        type={SETTINGS_TYPES.CHECKBOX}
                        inverted
                        label={translator.getMessage('options_enable_autodetect_filter')}
                        handler={settingChangeHandler}
                        // eslint-disable-next-line react/jsx-boolean-value
                        value={settings.values[DisableDetectFilters]}
                    />
                )}
                {!__IS_MV3__ && (
                    <SettingSetSelect
                        title={translator.getMessage('options_set_update_interval')}
                        description={translator.getMessage('options_set_update_interval_desc')}
                        id={FiltersUpdatePeriod}
                        options={filtersUpdatePeriodOptions}
                        value={settings.values[FiltersUpdatePeriod]}
                        handler={settingChangeHandler}
                    />
                )}
            </SettingsSection>
            <div className="links-menu links-menu--section">
                <button
                    type="button"
                    className="links-menu__item button--link--green"
                    onClick={handleExportSettings}
                >
                    {translator.getMessage('options_export_settings')}
                </button>
                <div className="links-menu__item--wrapper">
                    <input
                        id="inputEl"
                        type="file"
                        accept="application/json"
                        onChange={inputChangeHandlerWrapper}
                        className="actions__input-file"
                    />
                    <label
                        htmlFor="inputEl"
                        className="links-menu__item button--link--green"
                    >
                        <input
                            type="file"
                            accept="application/json"
                            onChange={inputChangeHandlerWrapper}
                            className="actions__input-file"
                        />
                        {translator.getMessage('options_import_settings')}
                    </label>
                </div>
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={__IS_MV3__ ? BUG_REPORT_MV3_URL : BUG_REPORT_URL}
                    className="links-menu__item button--link--green"
                >
                    {translator.getMessage('options_report_bug')}
                </a>
                <button
                    type="button"
                    className="links-menu__item button--link--green"
                    onClick={handleLeaveFeedback}
                >
                    {translator.getMessage('options_leave_feedback')}
                </button>
            </div>
        </>
    );
});
