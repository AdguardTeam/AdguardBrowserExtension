import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';

import { SettingsSection } from '../Settings/SettingsSection';
import { SettingsSet } from '../Settings/SettingsSet';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { rootStore } from '../../stores/RootStore';
import { messenger } from '../../../services/messenger';
import { hoursToMs, uploadFile } from '../../../helpers';
import { reactTranslator } from '../../../reactCommon/reactTranslator';

const filtersUpdatePeriodOptions = [
    {
        value: -1,
        title: reactTranslator.translate('options_select_update_period_default'),
    },
    {
        value: hoursToMs(48),
        title: reactTranslator.translate('options_select_update_period_48h'),
    },
    {
        value: hoursToMs(24),
        title: reactTranslator.translate('options_select_update_period_24h'),
    },
    {
        value: hoursToMs(12),
        title: reactTranslator.translate('options_select_update_period_12h'),
    },
    {
        value: hoursToMs(6),
        title: reactTranslator.translate('options_select_update_period_6h'),
    },
    {
        value: hoursToMs(1),
        title: reactTranslator.translate('options_select_update_period_1h'),
    },
    {
        value: 0,
        title: reactTranslator.translate('options_select_update_period_disabled'),
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
        window.open('/pages/export.html#exs', '_blank');
    };

    const inputChangeHandler = async (event) => {
        event.persist();
        const file = event.target.files[0];

        try {
            const content = await uploadFile(file, 'json');
            await messenger.applySettingsJson(content);
        } catch (e) {
            uiStore.addNotification({ description: e.message });
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
    } = settings.names;

    // eslint-disable-next-line max-len
    const ALLOW_ACCEPTABLE_ADS_LEARN_MORE_URL = 'https://adguard.com/forward.html?action=self_promotion&from=options_screen&app=browser_extension';

    // eslint-disable-next-line max-len
    const SAFEBROWSING_LEARN_MORE_URL = 'https://adguard.com/forward.html?action=protection_works&from=options_screen&app=browser_extension';

    return (
        <>
            <SettingsSection title={reactTranslator.translate('context_general_settings')}>
                <SettingsSet
                    title={reactTranslator.translate('options_allow_acceptable_ads')}
                    description={(
                        <a
                            href={ALLOW_ACCEPTABLE_ADS_LEARN_MORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {reactTranslator.translate('options_learn_more')}
                        </a>
                    )}
                    disabled={!allowAcceptableAds}
                    inlineControl={(
                        <Setting
                            id={ALLOW_ACCEPTABLE_ADS}
                            type={SETTINGS_TYPES.CHECKBOX}
                            value={allowAcceptableAds}
                            handler={allowAcceptableAdsChangeHandler}
                        />
                    )}
                />
                <SettingsSet
                    title={reactTranslator.translate('options_safebrowsing_enabled')}
                    description={(
                        <a
                            href={SAFEBROWSING_LEARN_MORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {reactTranslator.translate('options_learn_more')}
                        </a>
                    )}
                    disabled={settings.values[DISABLE_SAFEBROWSING]}
                    inlineControl={(
                        <Setting
                            id={DISABLE_SAFEBROWSING}
                            type={SETTINGS_TYPES.CHECKBOX}
                            inverted
                            value={settings.values[DISABLE_SAFEBROWSING]}
                            handler={settingChangeHandler}
                        />
                    )}
                />
                <SettingsSet
                    title={reactTranslator.translate('options_enable_autodetect_filter')}
                    disabled={settings.values[DISABLE_DETECT_FILTERS]}
                    inlineControl={(
                        <Setting
                            id={DISABLE_DETECT_FILTERS}
                            type={SETTINGS_TYPES.CHECKBOX}
                            inverted
                            handler={settingChangeHandler}
                            value={settings.values[DISABLE_DETECT_FILTERS]}
                        />
                    )}
                />
                <SettingsSet
                    title={reactTranslator.translate('options_set_update_interval')}
                    inlineControl={(
                        <Setting
                            id={FILTERS_UPDATE_PERIOD}
                            type={SETTINGS_TYPES.SELECT}
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
                    className="button button--m button--green actions__btn"
                    onClick={handleExportSettings}
                >
                    {reactTranslator.translate('options_export_settings')}
                </button>
                <input
                    type="file"
                    id="inputEl"
                    ref={inputEl}
                    onChange={inputChangeHandler}
                    style={{ display: 'none' }}
                />
                <button
                    type="button"
                    className="button button--m button--green-bd actions__btn"
                    onClick={handleImportSettings}
                >
                    {reactTranslator.translate('options_import_settings')}
                </button>
            </div>
        </>
    );
});

export { General };
