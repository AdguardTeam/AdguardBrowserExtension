import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import SettingsSection from '../Settings/SettingsSection';
import SettingsSet from '../Settings/SettingsSet';
import Setting, { SETTINGS_TYPES } from '../Settings/Setting';
import messenger from '../../../services/messenger';
import { rootStore } from '../../stores/RootStore';
import { log } from '../../../../background/utils/log';
import i18n from '../../../services/i18n';

const Miscellaneous = observer(() => {
    const {
        settingsStore,
        uiStore,
    } = useContext(rootStore);
    const { settings } = settingsStore;

    if (!settings) {
        return null;
    }

    // eslint-disable-next-line max-len
    const COLLECT_HITS_LEARN_MORE_URL = 'https://adguard.com/forward.html?action=filter_rules&from=options_screen&app=browser_extension';
    // eslint-disable-next-line max-len
    const OPEN_CHANGELOG_URL = 'https://adguard.com/forward.html?action=github_version_popup&from=version_popup&app=browser_extension';

    const settingChangeHandler = async ({ id, enabled }) => {
        log.info(`Setting ${id} set to ${enabled}`);
        await settingsStore.updateSetting(id, enabled);
    };

    const handleFilteringLogClick = async () => {
        await messenger.openFilteringLog();
    };

    const handleResetStatisticsClick = async () => {
        await messenger.resetStatistics();
        uiStore.addNotification({ description: i18n.translate('options_reset_stats_done') });
    };

    const handleOpenChangelog = () => {
        window.open(OPEN_CHANGELOG_URL);
    };

    const {
        USE_OPTIMIZED_FILTERS,
        DISABLE_INTEGRATION_MODE,
        DISABLE_COLLECT_HITS,
        DISABLE_SHOW_CONTEXT_MENU,
        DISABLE_SHOW_ADGUARD_PROMO_INFO,
        DISABLE_SHOW_APP_UPDATED_NOTIFICATION,
    } = settings.names;

    return (
        <>
            <h2 className="title">Miscellaneous</h2>
            <SettingsSection>
                <SettingsSet
                    title={i18n.translate('options_use_optimized_filters')}
                    description={i18n.translate('options_use_optimized_filters_desc')}
                    disabled={!settings.values[USE_OPTIMIZED_FILTERS]}
                >
                    <Setting
                        id={USE_OPTIMIZED_FILTERS}
                        type={SETTINGS_TYPES.CHECKBOX}
                        value={settings.values[USE_OPTIMIZED_FILTERS]}
                        handler={settingChangeHandler}
                    />
                </SettingsSet>

                <SettingsSet
                    title={i18n.translate('options_collect_hit_stats')}
                    description={(
                        <a
                            href={COLLECT_HITS_LEARN_MORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {i18n.translate('options_learn_more')}
                        </a>
                    )}
                    disabled={settings.values[DISABLE_COLLECT_HITS]}
                >
                    <Setting
                        id={DISABLE_COLLECT_HITS}
                        type={SETTINGS_TYPES.CHECKBOX}
                        inverted
                        value={settings.values[DISABLE_COLLECT_HITS]}
                        handler={settingChangeHandler}
                    />
                </SettingsSet>

                <SettingsSet
                    title={i18n.translate('options_show_context_menu')}
                    disabled={settings.values[DISABLE_SHOW_CONTEXT_MENU]}
                >
                    <Setting
                        id={DISABLE_SHOW_CONTEXT_MENU}
                        type={SETTINGS_TYPES.CHECKBOX}
                        inverted
                        value={settings.values[DISABLE_SHOW_CONTEXT_MENU]}
                        handler={settingChangeHandler}
                    />
                </SettingsSet>

                <SettingsSet
                    title={i18n.translate('options_show_adguard_full_version')}
                    disabled={settings.values[DISABLE_SHOW_ADGUARD_PROMO_INFO]}
                >
                    <Setting
                        id={DISABLE_SHOW_ADGUARD_PROMO_INFO}
                        type={SETTINGS_TYPES.CHECKBOX}
                        inverted
                        value={settings.values[DISABLE_SHOW_ADGUARD_PROMO_INFO]}
                        handler={settingChangeHandler}
                    />
                </SettingsSet>

                <SettingsSet
                    title={i18n.translate('options_show_app_updated_notification')}
                    disabled={settings.values[DISABLE_SHOW_APP_UPDATED_NOTIFICATION]}
                >
                    <Setting
                        id={DISABLE_SHOW_APP_UPDATED_NOTIFICATION}
                        type={SETTINGS_TYPES.CHECKBOX}
                        inverted
                        value={settings.values[DISABLE_SHOW_APP_UPDATED_NOTIFICATION]}
                        handler={settingChangeHandler}
                    />
                </SettingsSet>
            </SettingsSection>

            <button
                type="button"
                className="button button--m button--green content__btn"
                onClick={handleFilteringLogClick}
            >
                {i18n.translate('options_open_log')}
            </button>
            <button
                type="button"
                className="button button--m button--green-bd content__btn"
                onClick={handleResetStatisticsClick}
            >
                {i18n.translate('options_reset_stats')}
            </button>
            <button
                type="button"
                className="button button--m button--green-bd content__btn"
                onClick={handleOpenChangelog}
            >
                {i18n.translate('options_open_changelog')}
            </button>
        </>
    );
});

export default Miscellaneous;
