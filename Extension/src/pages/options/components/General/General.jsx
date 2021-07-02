import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';

import { SettingsSection } from '../Settings/SettingsSection';
import { SettingsSet } from '../Settings/SettingsSet';
import { SettingsSetCheckbox } from '../Settings/SettingsSetCheckbox';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { rootStore } from '../../stores/RootStore';
import { messenger } from '../../../services/messenger';
import { hoursToMs, uploadFile } from '../../../helpers';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { APPEARANCE_THEMES } from '../../../constants';
import { exportData, ExportTypes } from '../../../common/utils/export';

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
        value: APPEARANCE_THEMES.SYSTEM,
        title: reactTranslator.getMessage('options_theme_selector_system'),
    },
    {
        value: APPEARANCE_THEMES.LIGHT,
        title: reactTranslator.getMessage('options_theme_selector_light'),
    },
    {
        value: APPEARANCE_THEMES.DARK,
        title: reactTranslator.getMessage('options_theme_selector_dark'),
    },
];

const ALLOW_ACCEPTABLE_ADS = 'allowAcceptableAds';

const General = observer(() => {
    const {
        settingsStore,
        uiStore,
    } = useContext(rootStore);

    const { settings, allowAcceptableAds } = settingsStore;

    if (!settings) {
        return null;
    }

    const inputEl = useRef(null);

    const handleExportSettings = () => {
        exportData(ExportTypes.SETTINGS);
    };

    const inputChangeHandler = async (event) => {
        event.persist();
        const file = event.target.files[0];

        try {
            const content = await uploadFile(file, 'json');
            const result = await messenger.applySettingsJson(content);
            uiStore.addNotification({ description: reactTranslator.getMessage('options_popup_import_success_title') });
            if (!result) {
                const errorMessage = reactTranslator.getMessage('options_popup_import_error_file_description');
                uiStore.addNotification({ description: errorMessage });
            }
        } catch (e) {
            const message = e.message || reactTranslator.getMessage('options_popup_import_error_title');
            uiStore.addNotification({ description: message });
        }

        // eslint-disable-next-line no-param-reassign
        event.target.value = '';
    };

    const handleImportSettings = (e) => {
        e.preventDefault();
        inputEl.current.click();
    };

    const allowAcceptableAdsChangeHandler = async ({ data }) => {
        await settingsStore.setAllowAcceptableAdsState(data);
    };

    const settingChangeHandler = async ({ id, data }) => {
        await settingsStore.updateSetting(id, data);
    };

    const {
        DISABLE_DETECT_FILTERS,
        FILTERS_UPDATE_PERIOD,
        DISABLE_SAFEBROWSING,
        APPEARANCE_THEME,
    } = settings.names;

    // eslint-disable-next-line max-len
    const ALLOW_ACCEPTABLE_ADS_LEARN_MORE_URL = 'https://adguard.com/forward.html?action=self_promotion&from=options_screen&app=browser_extension';

    // eslint-disable-next-line max-len
    const SAFEBROWSING_LEARN_MORE_URL = 'https://adguard.com/forward.html?action=protection_works&from=options_screen&app=browser_extension';

    return (
        <>
            <SettingsSection title={reactTranslator.getMessage('context_general_settings')}>
                <SettingsSet
                    title={reactTranslator.getMessage('options_select_theme')}
                    inlineControl={(
                        <Setting
                            id={APPEARANCE_THEME}
                            type={SETTINGS_TYPES.SELECT}
                            label={reactTranslator.getMessage('options_select_theme')}
                            options={APPEARANCE_THEMES_OPTIONS}
                            value={settings.values[APPEARANCE_THEME]}
                            handler={settingChangeHandler}
                        />
                    )}
                />
                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_allow_acceptable_ads')}
                    description={reactTranslator.getMessage('options_allow_acceptable_ads_desc', {
                        a: () => (
                            <a
                                href={ALLOW_ACCEPTABLE_ADS_LEARN_MORE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {reactTranslator.getMessage('options_learn_more')}
                            </a>
                        ),
                    })}
                    disabled={!allowAcceptableAds}
                    id={ALLOW_ACCEPTABLE_ADS}
                    type={SETTINGS_TYPES.CHECKBOX}
                    value={allowAcceptableAds}
                    label={reactTranslator.getMessage('options_allow_acceptable_ads')}
                    handler={allowAcceptableAdsChangeHandler}
                />
                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_safebrowsing_enabled')}
                    description={reactTranslator.getMessage('options_safebrowsing_enabled_desc', {
                        a: () => (
                            <a
                                href={SAFEBROWSING_LEARN_MORE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {reactTranslator.getMessage('options_learn_more')}
                            </a>
                        ),
                    })}
                    disabled={settings.values[DISABLE_SAFEBROWSING]}
                    id={DISABLE_SAFEBROWSING}
                    type={SETTINGS_TYPES.CHECKBOX}
                    inverted
                    label={reactTranslator.getMessage('options_safebrowsing_enabled')}
                    value={settings.values[DISABLE_SAFEBROWSING]}
                    handler={settingChangeHandler}
                />
                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_enable_autodetect_filter')}
                    description={reactTranslator.getMessage('options_enable_autodetect_filter_desc')}
                    disabled={settings.values[DISABLE_DETECT_FILTERS]}
                    id={DISABLE_DETECT_FILTERS}
                    type={SETTINGS_TYPES.CHECKBOX}
                    inverted
                    label={reactTranslator.getMessage('options_enable_autodetect_filter')}
                    handler={settingChangeHandler}
                    value={settings.values[DISABLE_DETECT_FILTERS]}
                />
                <SettingsSet
                    title={reactTranslator.getMessage('options_set_update_interval')}
                    description={reactTranslator.getMessage('options_set_update_interval_desc')}
                    inlineControl={(
                        <Setting
                            id={FILTERS_UPDATE_PERIOD}
                            type={SETTINGS_TYPES.SELECT}
                            label={reactTranslator.getMessage('options_set_update_interval')}
                            options={filtersUpdatePeriodOptions}
                            value={settings.values[FILTERS_UPDATE_PERIOD]}
                            handler={settingChangeHandler}
                        />
                    )}
                />
            </SettingsSection>
            <div className="actions">
                <button
                    type="button"
                    className="button button--m button--transparent actions__btn"
                    onClick={handleExportSettings}
                >
                    {reactTranslator.getMessage('options_export_settings')}
                </button>
                <input
                    type="file"
                    id="inputEl"
                    accept="application/json"
                    ref={inputEl}
                    onChange={inputChangeHandler}
                    style={{ display: 'none' }}
                />
                <button
                    type="button"
                    className="button button--m button--transparent actions__btn"
                    onClick={handleImportSettings}
                >
                    {reactTranslator.getMessage('options_import_settings')}
                </button>
            </div>
        </>
    );
});

export { General };
