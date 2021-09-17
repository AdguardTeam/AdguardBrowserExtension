import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { SettingsSection } from '../Settings/SettingsSection';
import { SettingsSetCheckbox } from '../Settings/SettingsSetCheckbox';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { rootStore } from '../../stores/RootStore';
import { log } from '../../../../common/log';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import {
    GLOBAL_PRIVACY_CONTROL_URL,
    DO_NOT_TRACK_URL,
    DEFAULT_FIRST_PARTY_COOKIES_SELF_DESTRUCT_MIN,
    DEFAULT_THIRD_PARTY_COOKIES_SELF_DESTRUCT_MIN,
} from '../../../constants';

const BLOCK_KNOWN_TRACKERS = 'blockKnownTrackers';
const STRIP_TRACKING_PARAMETERS = 'stripTrackingParameters';

const Stealth = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { settings, blockKnownTrackers, stripTrackingParameters } = settingsStore;

    if (!settings) {
        return null;
    }

    const blockKnownTrackersChangeHandler = async ({ data }) => {
        await settingsStore.setBlockKnownTrackersState(data);
    };

    const stripTrackingParametersChangeHandler = async ({ data }) => {
        await settingsStore.setStripTrackingParametersState(data);
    };

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
        BLOCK_CHROME_CLIENT_DATA,
    } = settings.names;

    const isStealthModeDisabled = settings.values[DISABLE_STEALTH_MODE];
    const isThirdPartyCookiesEnabled = settings.values[SELF_DESTRUCT_THIRD_PARTY_COOKIES];
    const isFirstPartyCookiesEnabled = settings.values[SELF_DESTRUCT_FIRST_PARTY_COOKIES];

    return (
        <>
            <SettingsSection
                title={reactTranslator.getMessage('options_privacy_title')}
                description={reactTranslator.getMessage('options_privacy_desc')}
                inlineControl={(
                    <Setting
                        id={DISABLE_STEALTH_MODE}
                        type={SETTINGS_TYPES.CHECKBOX}
                        label={reactTranslator.getMessage('options_privacy_title')}
                        inverted
                        value={settings.values[DISABLE_STEALTH_MODE]}
                        handler={settingChangeHandler}
                    />
                )}
            />

            <SettingsSection
                title={reactTranslator.getMessage('options_stealth_general_title')}
                subTitle
                disabled={isStealthModeDisabled}
            >
                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_block_known_trackers_title')}
                    description={reactTranslator.getMessage('options_block_known_trackers_description')}
                    disabled={!blockKnownTrackers}
                    id={BLOCK_KNOWN_TRACKERS}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={reactTranslator.getMessage('options_block_known_trackers_title')}
                    value={blockKnownTrackers}
                    handler={blockKnownTrackersChangeHandler}
                />

                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_strip_tracking_params_title')}
                    description={reactTranslator.getMessage('options_strip_tracking_params_description')}
                    disabled={!stripTrackingParameters}
                    id={STRIP_TRACKING_PARAMETERS}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={reactTranslator.getMessage('options_strip_tracking_params_title')}
                    value={stripTrackingParameters}
                    handler={stripTrackingParametersChangeHandler}
                />
                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_hide_search_queries_title')}
                    description={reactTranslator.getMessage('options_hide_search_queries_desc')}
                    disabled={!settings.values[HIDE_SEARCH_QUERIES]}
                    id={HIDE_SEARCH_QUERIES}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={reactTranslator.getMessage('options_hide_search_queries_title')}
                    value={settings.values[HIDE_SEARCH_QUERIES]}
                    handler={settingChangeHandler}
                />
                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_send_not_track_title')}
                    description={reactTranslator.getMessage('options_send_not_track_desc', {
                        gpc: (chunks) => (
                            <a
                                className="desc--link"
                                href={GLOBAL_PRIVACY_CONTROL_URL}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {chunks}
                            </a>
                        ),
                        dnt: (chunks) => (
                            <a
                                className="desc--link"
                                href={DO_NOT_TRACK_URL}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {chunks}
                            </a>
                        ),
                    })}
                    disabled={!settings.values[SEND_DO_NOT_TRACK]}
                    id={SEND_DO_NOT_TRACK}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={reactTranslator.getMessage('options_send_not_track_title')}
                    value={settings.values[SEND_DO_NOT_TRACK]}
                    handler={settingChangeHandler}
                />
            </SettingsSection>

            <SettingsSection
                title={reactTranslator.getMessage('options_stealth_cookies_title')}
                subTitle
                disabled={isStealthModeDisabled}
            >
                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_third_party_title')}
                    description={reactTranslator.getMessage('options_third_party_desc')}
                    disabled={!isThirdPartyCookiesEnabled}
                    id={SELF_DESTRUCT_THIRD_PARTY_COOKIES}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={reactTranslator.getMessage('options_third_party_title')}
                    value={isThirdPartyCookiesEnabled}
                    handler={settingChangeHandler}
                >
                    <Setting
                        id={SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME}
                        disabled={!isThirdPartyCookiesEnabled || isStealthModeDisabled}
                        type={SETTINGS_TYPES.INPUT}
                        value={settings.values[SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME]}
                        handler={settingChangeHandler}
                        placeholder={DEFAULT_THIRD_PARTY_COOKIES_SELF_DESTRUCT_MIN}
                    />
                </SettingsSetCheckbox>

                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_first_party_title')}
                    description={reactTranslator.getMessage('options_first_party_desc')}
                    disabled={!isFirstPartyCookiesEnabled}
                    id={SELF_DESTRUCT_FIRST_PARTY_COOKIES}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={reactTranslator.getMessage('options_first_party_title')}
                    value={isFirstPartyCookiesEnabled}
                    handler={settingChangeHandler}
                >
                    <Setting
                        id={SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME}
                        disabled={!isFirstPartyCookiesEnabled || isStealthModeDisabled}
                        type={SETTINGS_TYPES.INPUT}
                        value={settings.values[SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME]}
                        handler={settingChangeHandler}
                        placeholder={DEFAULT_FIRST_PARTY_COOKIES_SELF_DESTRUCT_MIN}
                    />
                </SettingsSetCheckbox>
            </SettingsSection>

            <SettingsSection
                title={reactTranslator.getMessage('options_stealth_miscellaneous_title')}
                subTitle
                disabled={isStealthModeDisabled}
            >
                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_hide_referrer_title')}
                    description={reactTranslator.getMessage('options_hide_referrer_desc')}
                    disabled={!settings.values[HIDE_REFERRER]}
                    id={HIDE_REFERRER}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={reactTranslator.getMessage('options_hide_referrer_title')}
                    value={settings.values[HIDE_REFERRER]}
                    handler={settingChangeHandler}
                />

                {settingsStore.isChrome && (
                    <SettingsSetCheckbox
                        title={reactTranslator.getMessage('options_remove_client_data_title')}
                        description={reactTranslator.getMessage('options_remove_client_data_desc')}
                        disabled={!settings.values[BLOCK_CHROME_CLIENT_DATA]}
                        id={BLOCK_CHROME_CLIENT_DATA}
                        type={SETTINGS_TYPES.CHECKBOX}
                        label={reactTranslator.getMessage('options_remove_client_data_title')}
                        value={settings.values[BLOCK_CHROME_CLIENT_DATA]}
                        handler={settingChangeHandler}
                    />
                )}

                <SettingsSetCheckbox
                    title={reactTranslator.getMessage('options_disable_webrtc_title')}
                    description={reactTranslator.getMessage('options_disable_webrtc_desc')}
                    disabled={!settings.values[BLOCK_WEBRTC]}
                    id={BLOCK_WEBRTC}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={reactTranslator.getMessage('options_disable_webrtc_title')}
                    value={settings.values[BLOCK_WEBRTC]}
                    handler={settingChangeHandler}
                />
            </SettingsSection>
        </>
    );
});

export { Stealth };
