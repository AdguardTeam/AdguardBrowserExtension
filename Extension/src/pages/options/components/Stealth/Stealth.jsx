import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { SettingsSection } from '../Settings/SettingsSection';
import { SettingsSet } from '../Settings/SettingsSet';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { rootStore } from '../../stores/RootStore';
import { log } from '../../../../background/utils/log';
import { reactTranslator } from '../../../reactCommon/reactTranslator';
import {
    DEFAULT_FIRST_PARTY_COOKIES_SELF_DESTRUCT_MIN,
    DEFAULT_THIRD_PARTY_COOKIES_SELF_DESTRUCT_MIN,
    DEFAULT_TRACKING_PARAMETERS,
} from '../../../constants';

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
            <SettingsSection title={reactTranslator.translate('options_privacy_title')}>
                <SettingsSet
                    title={reactTranslator.translate('options_privacy_title')}
                    description={reactTranslator.translate('options_privacy_desc')}
                    disabled={settings.values[DISABLE_STEALTH_MODE]}
                    inlineControl={(
                        <Setting
                            id={DISABLE_STEALTH_MODE}
                            type={SETTINGS_TYPES.CHECKBOX}
                            inverted
                            value={settings.values[DISABLE_STEALTH_MODE]}
                            handler={settingChangeHandler}
                        />
                    )}
                />
            </SettingsSection>

            <SettingsSection
                title={reactTranslator.translate('options_cookies_title')}
                disabled={isStealthModeDisabled}
            >
                <SettingsSet
                    title={reactTranslator.translate('options_third_party_title')}
                    description={reactTranslator.translate('options_third_party_desc')}
                    disabled={!settings.values[SELF_DESTRUCT_THIRD_PARTY_COOKIES]}
                    inlineControl={(
                        <Setting
                            id={SELF_DESTRUCT_THIRD_PARTY_COOKIES}
                            type={SETTINGS_TYPES.CHECKBOX}
                            value={settings.values[SELF_DESTRUCT_THIRD_PARTY_COOKIES]}
                            handler={settingChangeHandler}
                        />
                    )}
                >
                    <Setting
                        id={SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME}
                        type={SETTINGS_TYPES.INPUT}
                        value={settings.values[SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME]}
                        handler={settingChangeHandler}
                        placeholder={DEFAULT_THIRD_PARTY_COOKIES_SELF_DESTRUCT_MIN}
                    />
                </SettingsSet>

                <SettingsSet
                    title={reactTranslator.translate('options_first_party_title')}
                    description={reactTranslator.translate('options_first_party_desc')}
                    disabled={!settings.values[SELF_DESTRUCT_FIRST_PARTY_COOKIES]}
                    inlineControl={(
                        <Setting
                            id={SELF_DESTRUCT_FIRST_PARTY_COOKIES}
                            type={SETTINGS_TYPES.CHECKBOX}
                            value={settings.values[SELF_DESTRUCT_FIRST_PARTY_COOKIES]}
                            handler={settingChangeHandler}
                        />
                    )}
                >
                    <Setting
                        id={SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME}
                        type={SETTINGS_TYPES.INPUT}
                        value={settings.values[SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME]}
                        handler={settingChangeHandler}
                        placeholder={DEFAULT_FIRST_PARTY_COOKIES_SELF_DESTRUCT_MIN}
                    />
                </SettingsSet>
            </SettingsSection>

            <SettingsSection
                title={reactTranslator.translate('context_miscellaneous_settings')}
                disabled={isStealthModeDisabled}
            >
                <SettingsSet
                    title={reactTranslator.translate('options_hide_referrer_title')}
                    description={reactTranslator.translate('options_hide_referrer_desc')}
                    disabled={!settings.values[HIDE_REFERRER]}
                    inlineControl={(
                        <Setting
                            id={HIDE_REFERRER}
                            type={SETTINGS_TYPES.CHECKBOX}
                            value={settings.values[HIDE_REFERRER]}
                            handler={settingChangeHandler}
                        />
                    )}
                />

                <SettingsSet
                    title={reactTranslator.translate('options_hide_search_queries_title')}
                    description={reactTranslator.translate('options_hide_search_queries_desc')}
                    disabled={!settings.values[HIDE_SEARCH_QUERIES]}
                    inlineControl={(
                        <Setting
                            id={HIDE_SEARCH_QUERIES}
                            type={SETTINGS_TYPES.CHECKBOX}
                            value={settings.values[HIDE_SEARCH_QUERIES]}
                            handler={settingChangeHandler}
                        />
                    )}
                />

                <SettingsSet
                    title={reactTranslator.translate('options_send_not_track_title')}
                    description={reactTranslator.translate('options_send_not_track_desc')}
                    disabled={!settings.values[SEND_DO_NOT_TRACK]}
                    inlineControl={(
                        <Setting
                            id={SEND_DO_NOT_TRACK}
                            type={SETTINGS_TYPES.CHECKBOX}
                            value={settings.values[SEND_DO_NOT_TRACK]}
                            handler={settingChangeHandler}
                        />
                    )}
                />

                <SettingsSet
                    title={reactTranslator.translate('options_disable_webrtc_title')}
                    description={reactTranslator.translate('options_disable_webrtc_desc')}
                    disabled={!settings.values[BLOCK_WEBRTC]}
                    inlineControl={(
                        <Setting
                            id={BLOCK_WEBRTC}
                            type={SETTINGS_TYPES.CHECKBOX}
                            value={settings.values[BLOCK_WEBRTC]}
                            handler={settingChangeHandler}
                        />
                    )}
                />

                <SettingsSet
                    title={reactTranslator.translate('options_strip_tracking_params_title')}
                    description={reactTranslator.translate('options_strip_tracking_params_desc')}
                    disabled={!settings.values[STRIP_TRACKING_PARAMETERS]}
                    inlineControl={(
                        <Setting
                            id={STRIP_TRACKING_PARAMETERS}
                            type={SETTINGS_TYPES.CHECKBOX}
                            value={settings.values[STRIP_TRACKING_PARAMETERS]}
                            handler={settingChangeHandler}
                        />
                    )}
                >
                    <Setting
                        id={TRACKING_PARAMETERS}
                        type={SETTINGS_TYPES.TEXTAREA}
                        value={settings.values[TRACKING_PARAMETERS]}
                        handler={settingChangeHandler}
                        placeholder={DEFAULT_TRACKING_PARAMETERS}
                    />
                </SettingsSet>
            </SettingsSection>
        </>
    );
});

export { Stealth };
