import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { SettingsSection } from '../Settings/SettingsSection';
import { SettingsSet } from '../Settings/SettingsSet';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { messenger } from '../../../services/messenger';
import { rootStore } from '../../stores/RootStore';
import { log } from '../../../../common/log';
import { reactTranslator } from '../../../../common/translators/reactTranslator';

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

    const settingChangeHandler = async ({ id, data }) => {
        log.info(`Setting ${id} set to ${data}`);
        await settingsStore.updateSetting(id, data);
    };

    const handleFilteringLogClick = async () => {
        await messenger.openFilteringLog();
    };

    const handleResetStatisticsClick = async () => {
        await messenger.resetStatistics();
        uiStore.addNotification({ description: reactTranslator.getMessage('options_reset_stats_done') });
    };

    const handleOpenChangelog = () => {
        window.open(OPEN_CHANGELOG_URL);
    };

    const {
        USE_OPTIMIZED_FILTERS,
        DISABLE_COLLECT_HITS,
        DISABLE_SHOW_CONTEXT_MENU,
        DISABLE_SHOW_ADGUARD_PROMO_INFO,
        DISABLE_SHOW_APP_UPDATED_NOTIFICATION,
        DISABLE_SHOW_PAGE_STATS,
    } = settings.names;

    return (
        <>
            <SettingsSection title={reactTranslator.getMessage('context_miscellaneous_settings')}>
                <SettingsSet
                    title={reactTranslator.getMessage('options_use_optimized_filters')}
                    description={reactTranslator.getMessage('options_use_optimized_filters_desc')}
                    disabled={!settings.values[USE_OPTIMIZED_FILTERS]}
                    inlineControl={(
                        <Setting
                            id={USE_OPTIMIZED_FILTERS}
                            label={reactTranslator.getMessage('options_use_optimized_filters')}
                            type={SETTINGS_TYPES.CHECKBOX}
                            value={settings.values[USE_OPTIMIZED_FILTERS]}
                            handler={settingChangeHandler}
                        />
                    )}
                />

                <SettingsSet
                    title={reactTranslator.getMessage('options_collect_hit_stats_title')}
                    description={(
                        <a
                            href={COLLECT_HITS_LEARN_MORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {reactTranslator.getMessage('options_learn_more')}
                        </a>
                    )}
                    disabled={settings.values[DISABLE_COLLECT_HITS]}
                    inlineControl={(
                        <Setting
                            id={DISABLE_COLLECT_HITS}
                            type={SETTINGS_TYPES.CHECKBOX}
                            label={reactTranslator.getMessage('options_collect_hit_stats_title')}
                            inverted
                            value={settings.values[DISABLE_COLLECT_HITS]}
                            handler={settingChangeHandler}
                        />
                    )}
                />

                <SettingsSet
                    title={reactTranslator.getMessage('options_show_blocked_ads_count_title')}
                    disabled={settings.values[DISABLE_SHOW_PAGE_STATS]}
                    inlineControl={(
                        <Setting
                            id={DISABLE_SHOW_PAGE_STATS}
                            type={SETTINGS_TYPES.CHECKBOX}
                            label={reactTranslator.getMessage('options_show_blocked_ads_count_title')}
                            inverted
                            value={settings.values[DISABLE_SHOW_PAGE_STATS]}
                            handler={settingChangeHandler}
                        />
                    )}
                />

                <SettingsSet
                    title={reactTranslator.getMessage('options_show_context_menu_title')}
                    disabled={settings.values[DISABLE_SHOW_CONTEXT_MENU]}
                    inlineControl={(
                        <Setting
                            id={DISABLE_SHOW_CONTEXT_MENU}
                            type={SETTINGS_TYPES.CHECKBOX}
                            label={reactTranslator.getMessage('options_show_context_menu_title')}
                            inverted
                            value={settings.values[DISABLE_SHOW_CONTEXT_MENU]}
                            handler={settingChangeHandler}
                        />
                    )}
                />

                <SettingsSet
                    title={reactTranslator.getMessage('options_show_adguard_full_version_title')}
                    disabled={settings.values[DISABLE_SHOW_ADGUARD_PROMO_INFO]}
                    inlineControl={(
                        <Setting
                            id={DISABLE_SHOW_ADGUARD_PROMO_INFO}
                            type={SETTINGS_TYPES.CHECKBOX}
                            label={reactTranslator.getMessage('options_show_adguard_full_version_title')}
                            inverted
                            value={settings.values[DISABLE_SHOW_ADGUARD_PROMO_INFO]}
                            handler={settingChangeHandler}
                        />
                    )}
                />

                <SettingsSet
                    title={reactTranslator.getMessage('options_show_app_updated_notification')}
                    disabled={settings.values[DISABLE_SHOW_APP_UPDATED_NOTIFICATION]}
                    inlineControl={(
                        <Setting
                            id={DISABLE_SHOW_APP_UPDATED_NOTIFICATION}
                            type={SETTINGS_TYPES.CHECKBOX}
                            label={reactTranslator.getMessage('options_show_app_updated_notification')}
                            inverted
                            value={settings.values[DISABLE_SHOW_APP_UPDATED_NOTIFICATION]}
                            handler={settingChangeHandler}
                        />
                    )}
                />
            </SettingsSection>

            <div className="actions">
                <button
                    type="button"
                    className="button button--m button--green actions__btn"
                    onClick={handleFilteringLogClick}
                >
                    {reactTranslator.getMessage('options_open_log')}
                </button>
                <button
                    type="button"
                    className="button button--m button--green-bd actions__btn"
                    onClick={handleResetStatisticsClick}
                >
                    {reactTranslator.getMessage('options_reset_stats')}
                </button>
                <button
                    type="button"
                    className="button button--m button--green-bd actions__btn"
                    onClick={handleOpenChangelog}
                >
                    {reactTranslator.getMessage('options_open_changelog')}
                </button>
            </div>
        </>
    );
});

export { Miscellaneous };
