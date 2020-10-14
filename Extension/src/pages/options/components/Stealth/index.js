import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import SettingsSection from '../Settings/SettingsSection';
import SettingsSet from '../Settings/SettingsSet';
import Setting, { SETTINGS_TYPES } from '../Settings/Setting';
import { rootStore } from '../../stores/RootStore';
import { log } from '../../../../background/utils/log';
import i18n from '../../../services/i18n';

const Stealth = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { settings } = settingsStore;

    if (!settings) {
        return null;
    }

    const settingChangeHandler = async ({ id, data }) => {
        log.info(`Setting ${id} set to ${data}`);
        await settingsStore.updateSetting(id, data);
    };

    const {
        DISABLE_STEALTH_MODE,
        SELF_DESTRUCT_THIRD_PARTY_COOKIES,
        SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME,
        SELF_DESTRUCT_FIRST_PARTY_COOKIES,
        SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME,
        HIDE_REFERRER,
        HIDE_SEARCH_QUERIES,
        SEND_DO_NOT_TRACK,
        BLOCK_WEBRTC,
        STRIP_TRACKING_PARAMETERS,
        TRACKING_PARAMETERS,
    } = settings.names;

    const isStealthModeDisabled = settings.values[DISABLE_STEALTH_MODE];

    return (
        <>
            <h2 className="title">{i18n.translate('options_privacy_title')}</h2>

            <SettingsSection>
                <SettingsSet
                    title={i18n.translate('options_privacy_title')}
                    description={i18n.translate('options_privacy_desc')}
                    disabled={settings.values[DISABLE_STEALTH_MODE]}
                >
                    <Setting
                        id={DISABLE_STEALTH_MODE}
                        type={SETTINGS_TYPES.CHECKBOX}
                        inverted
                        value={settings.values[DISABLE_STEALTH_MODE]}
                        handler={settingChangeHandler}
                    />
                </SettingsSet>
            </SettingsSection>

            <SettingsSection
                title={i18n.translate('options_cookies_title')}
                disabled={isStealthModeDisabled}
            >
                <SettingsSet
                    title={i18n.translate('options_third_party_title')}
                    description={i18n.translate('options_third_party_desc')}
                    disabled={!settings.values[SELF_DESTRUCT_THIRD_PARTY_COOKIES]}
                >
                    <Setting
                        id={SELF_DESTRUCT_THIRD_PARTY_COOKIES}
                        type={SETTINGS_TYPES.CHECKBOX}
                        value={settings.values[SELF_DESTRUCT_THIRD_PARTY_COOKIES]}
                        handler={settingChangeHandler}
                    />
                    <Setting
                        id={SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME}
                        type={SETTINGS_TYPES.INPUT}
                        value={settings.values[SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME]}
                        handler={settingChangeHandler}
                    />
                </SettingsSet>

                <SettingsSet
                    title={i18n.translate('options_first_party_title')}
                    description={i18n.translate('options_first_party_desc')}
                    disabled={!settings.values[SELF_DESTRUCT_FIRST_PARTY_COOKIES]}
                >
                    <Setting
                        id={SELF_DESTRUCT_FIRST_PARTY_COOKIES}
                        type={SETTINGS_TYPES.CHECKBOX}
                        value={settings.values[SELF_DESTRUCT_FIRST_PARTY_COOKIES]}
                        handler={settingChangeHandler}
                    />
                    <Setting
                        id={SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME}
                        type={SETTINGS_TYPES.INPUT}
                        value={settings.values[SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME]}
                        handler={settingChangeHandler}
                    />
                </SettingsSet>
            </SettingsSection>

            <SettingsSection
                title={i18n.translate('context_miscellaneous_settings')}
                disabled={isStealthModeDisabled}
            >
                <SettingsSet
                    title={i18n.translate('options_hide_referrer_title')}
                    description={i18n.translate('options_hide_referrer_desc')}
                    disabled={!settings.values[HIDE_REFERRER]}
                >
                    <Setting
                        id={HIDE_REFERRER}
                        type={SETTINGS_TYPES.CHECKBOX}
                        value={settings.values[HIDE_REFERRER]}
                        handler={settingChangeHandler}
                    />
                </SettingsSet>

                <SettingsSet
                    title={i18n.translate('options_hide_search_queries_title')}
                    description={i18n.translate('options_hide_search_queries_desc')}
                    disabled={!settings.values[HIDE_SEARCH_QUERIES]}
                >
                    <Setting
                        id={HIDE_SEARCH_QUERIES}
                        type={SETTINGS_TYPES.CHECKBOX}
                        value={settings.values[HIDE_SEARCH_QUERIES]}
                        handler={settingChangeHandler}
                    />
                </SettingsSet>

                <SettingsSet
                    title={i18n.translate('options_send_not_track_title')}
                    description={i18n.translate('options_send_not_track_desc')}
                    disabled={!settings.values[SEND_DO_NOT_TRACK]}
                >
                    <Setting
                        id={SEND_DO_NOT_TRACK}
                        type={SETTINGS_TYPES.CHECKBOX}
                        value={settings.values[SEND_DO_NOT_TRACK]}
                        handler={settingChangeHandler}
                    />
                </SettingsSet>

                <SettingsSet
                    title={i18n.translate('options_disable_webrtc_title')}
                    description={i18n.translate('options_disable_webrtc_desc')}
                    disabled={!settings.values[BLOCK_WEBRTC]}
                >
                    <Setting
                        id={BLOCK_WEBRTC}
                        type={SETTINGS_TYPES.CHECKBOX}
                        value={settings.values[BLOCK_WEBRTC]}
                        handler={settingChangeHandler}
                    />
                </SettingsSet>

                <SettingsSet
                    title={i18n.translate('options_strip_tracking_params_title')}
                    description={i18n.translate('options_strip_tracking_params_desc')}
                    disabled={!settings.values[STRIP_TRACKING_PARAMETERS]}
                >
                    <Setting
                        id={STRIP_TRACKING_PARAMETERS}
                        type={SETTINGS_TYPES.CHECKBOX}
                        value={settings.values[STRIP_TRACKING_PARAMETERS]}
                        handler={settingChangeHandler}
                    />
                    <Setting
                        id={TRACKING_PARAMETERS}
                        type={SETTINGS_TYPES.TEXTAREA}
                        value={settings.values[TRACKING_PARAMETERS]}
                        handler={settingChangeHandler}
                    />
                </SettingsSet>
            </SettingsSection>
        </>
    );
});

export default Stealth;
