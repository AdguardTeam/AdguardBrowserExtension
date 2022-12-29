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
import { hoursToMs, handleFileUpload } from '../../../helpers';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { AppearanceTheme } from '../../../../common/settings';

import {
    ACCEPTABLE_ADS_LEARN_MORE_URL,
    SAFEBROWSING_LEARN_MORE_URL,
    GITHUB_URL,
} from '../../constants';

import { exportData, ExportTypes } from '../../../common/utils/export';
import { UserAgent } from '../../../../common/user-agent';
import { BROWSER_ADDON_STORE_LINKS } from '../../../constants';
import { getErrorMessage } from '../../../../common/error';
import { SettingHandler } from '../../types';
import { ensurePermission } from '../../ensure-permission';
import { translator } from '../../../../common/translators/translator';
import { Unknown } from '../../../../common/unknown';

const filtersUpdatePeriodOptions = [
    {
        value: -1,
        title: reactTranslator.getMessage('options_select_update_period_default'),
    },
    {
        value: hoursToMs(48),
        title: reactTranslator.getMessage('options_select_update_period_48h'),
    },
    {
        value: hoursToMs(24),
        title: reactTranslator.getMessage('options_select_update_period_24h'),
    },
    {
        value: hoursToMs(12),
        title: reactTranslator.getMessage('options_select_update_period_12h'),
    },
    {
        value: hoursToMs(6),
        title: reactTranslator.getMessage('options_select_update_period_6h'),
    },
    {
        value: hoursToMs(1),
        title: reactTranslator.getMessage('options_select_update_period_1h'),
    },
    {
        value: 0,
        title: reactTranslator.getMessage('options_select_update_period_disabled'),
    },
];

const APPEARANCE_THEMES_OPTIONS = [
    {
        value: AppearanceTheme.System,
        title: reactTranslator.getMessage('options_theme_selector_system'),
    },
    {
        value: AppearanceTheme.Light,
        title: reactTranslator.getMessage('options_theme_selector_light'),
    },
    {
        value: AppearanceTheme.Dark,
        title: reactTranslator.getMessage('options_theme_selector_dark'),
    },
];

const AllowAcceptableAds = 'allowAcceptableAds';

let currentBrowserAddonStoreUrl = BROWSER_ADDON_STORE_LINKS.CHROME;
if (UserAgent.isFirefox) {
    currentBrowserAddonStoreUrl = BROWSER_ADDON_STORE_LINKS.FIREFOX;
} else if (UserAgent.isEdgeChromium) {
    currentBrowserAddonStoreUrl = BROWSER_ADDON_STORE_LINKS.EDGE;
} else if (UserAgent.isOpera) {
    currentBrowserAddonStoreUrl = BROWSER_ADDON_STORE_LINKS.OPERA;
}

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

const General = observer(() => {
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
                const successMessage = reactTranslator.getMessage('options_popup_import_success_title');
                uiStore.addNotification({ description: successMessage });
            } else {
                const errorMessage = reactTranslator.getMessage('options_popup_import_error_file_description');
                uiStore.addNotification({ description: errorMessage });
            }
        } catch (e) {
            const message = getErrorMessage(e) || reactTranslator.getMessage('options_popup_import_error_title');
            uiStore.addNotification({ description: message });
        }

        // eslint-disable-next-line no-param-reassign
        event.target.value = '';
    };

    const allowAcceptableAdsChangeHandler: SettingHandler = async ({ data }) => {
        await settingsStore.setAllowAcceptableAdsState(data);
    };

    const settingChangeHandler: SettingHandler = async ({ id, data }) => {
        await settingsStore.updateSetting(id, data);
    };

    const {
        DisableDetectFilters,
        FiltersUpdatePeriod,
        DisableSafebrowsing,
        AppearanceTheme,
    } = settings.names;

    return (
        <>
            <SettingsSection title={reactTranslator.getMessage('options_general_settings')}>
                { /* TODO fix type error when SettingsSection be rewritten in typescript */ }
                {/* @ts-ignore */}
                <SettingSetSelect
                    title={reactTranslator.getMessage('options_select_theme')}
                    id={AppearanceTheme}
                    options={APPEARANCE_THEMES_OPTIONS}
                    value={settings.values[AppearanceTheme]}
                    handler={settingChangeHandler}
                />
                <SettingsSetCheckbox
                    // TODO fix type error when SettingsSetCheckbox be rewritten in typescript
                    // @ts-ignore
                    title={reactTranslator.getMessage('options_block_acceptable_ads')}
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
                    label={reactTranslator.getMessage('options_block_acceptable_ads')}
                    handler={allowAcceptableAdsChangeHandler}
                />
                <SettingsSetCheckbox
                    // TODO fix type error when SettingsSetCheckbox be rewritten in typescript
                    // @ts-ignore
                    title={reactTranslator.getMessage('options_safebrowsing_enabled')}
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
                    label={reactTranslator.getMessage('options_safebrowsing_enabled')}
                    value={settings.values[DisableSafebrowsing]}
                    handler={settingChangeHandler}
                />
                <SettingsSetCheckbox
                    // TODO fix type error when SettingsSetCheckbox be rewritten in typescript
                    // @ts-ignore
                    title={reactTranslator.getMessage('options_enable_autodetect_filter')}
                    description={reactTranslator.getMessage('options_enable_autodetect_filter_desc')}
                    disabled={settings.values[DisableDetectFilters]}
                    id={DisableDetectFilters}
                    type={SETTINGS_TYPES.CHECKBOX}
                    inverted
                    label={reactTranslator.getMessage('options_enable_autodetect_filter')}
                    handler={settingChangeHandler}
                    value={settings.values[DisableDetectFilters]}
                />
                <SettingSetSelect
                    title={reactTranslator.getMessage('options_set_update_interval')}
                    description={reactTranslator.getMessage('options_set_update_interval_desc')}
                    id={FiltersUpdatePeriod}
                    options={filtersUpdatePeriodOptions}
                    value={settings.values[FiltersUpdatePeriod]}
                    handler={settingChangeHandler}
                />
            </SettingsSection>
            <div
                className="links-menu"
                style={{ marginLeft: '16px' }}
            >
                <button
                    type="button"
                    className="links-menu__item"
                    onClick={handleExportSettings}
                >
                    {reactTranslator.getMessage('options_export_settings')}
                </button>
                <input
                    id="inputEl"
                    type="file"
                    accept="application/json"
                    onChange={inputChangeHandler}
                    className="actions__input-file"
                />
                <label
                    htmlFor="inputEl"
                    className="links-menu__item"
                >
                    <input
                        type="file"
                        accept="application/json"
                        onChange={inputChangeHandler}
                        className="actions__input-file"
                    />
                    {reactTranslator.getMessage('options_import_settings')}
                </label>
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={GITHUB_URL}
                    className="links-menu__item"
                >
                    {reactTranslator.getMessage('options_report_bug')}
                </a>
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={currentBrowserAddonStoreUrl}
                    className="links-menu__item"
                >
                    {reactTranslator.getMessage('options_leave_feedback')}
                </a>
            </div>
        </>
    );
});

export { General };
