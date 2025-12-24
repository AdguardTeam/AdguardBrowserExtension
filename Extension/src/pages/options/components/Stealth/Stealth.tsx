/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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

// TODO remove all @ts-ignore, and explicit any
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { useTelemetryPageViewEvent } from '../../../common/telemetry';
import { TelemetryScreenName } from '../../../../background/services/telemetry/enums';
import { SettingsSection } from '../Settings/SettingsSection';
import { SettingsSetCheckbox } from '../Settings/SettingsSetCheckbox';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { rootStore } from '../../stores/RootStore';
import { logger } from '../../../../common/logger';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { translator } from '../../../../common/translators/translator';
import { addMinDelayLoader } from '../../../common/components/helpers';
import { GLOBAL_PRIVACY_CONTROL_URL, DO_NOT_TRACK_URL } from '../../constants';
import {
    DEFAULT_FIRST_PARTY_COOKIES_SELF_DESTRUCT_MIN,
    DEFAULT_THIRD_PARTY_COOKIES_SELF_DESTRUCT_MIN,
} from '../../../../common/settings';
import { type SettingHandler } from '../../types';
import { ensurePermission } from '../../ensure-permission';

import { DescriptionWithWarning } from './DescriptionWithWarning';

import './stealth.pcss';

const BlockKnownTrackers = 'blockKnownTrackers';
const STRIP_TRACKING_PARAMETERS = 'stripTrackingParameters';

const Stealth = observer(() => {
    const { settingsStore, uiStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(telemetryStore, TelemetryScreenName.TrackingProtectionScreen);
    const { settings, blockKnownTrackers, stripTrackingParameters }: any = settingsStore;

    if (!settings) {
        return null;
    }

    /**
     * Separate handler because this option actually enables filter and
     * require reload engine to apply changes.
     */
    const blockKnownTrackersChangeHandlerWrapper = addMinDelayLoader(
        uiStore.setShowLoader,
        async ({ data }) => {
            await settingsStore.setBlockKnownTrackersState(data);
        },
    );

    /**
     * Separate handler because this option actually enables filter and
     * require reload engine to apply changes.
     */
    const stripTrackingParametersChangeHandlerWrapper = addMinDelayLoader(
        uiStore.setShowLoader,
        async ({ data }) => {
            await settingsStore.setStripTrackingParametersState(data);
        },
    );

    const updateSettingWrapper = addMinDelayLoader(
        uiStore.setShowLoader,
        settingsStore.updateSetting,
    );

    const settingChangeHandler: SettingHandler = async ({ id, data, event }) => {
        let ignoreBackground = false;
        let value = data;

        // Tries to extract and check validity state from event target.
        if (event) {
            const target = event.target as HTMLInputElement;
            const { valid } = target.validity;

            if (!valid) {
                // Prevent pass bad value to background.
                ignoreBackground = true;
            } else {
                // Otherwise convert string to number.
                value = Number(data);
            }
        }

        logger.trace(`[ext.Stealth]: Setting ${id} set to ${data}. Ignore background: ${ignoreBackground}`);
        await updateSettingWrapper(id, value, ignoreBackground);
    };

    const privacySettingChangeHandler: SettingHandler = async (payload) => {
        const { id, data } = payload;

        if (typeof data !== 'boolean') {
            throw new Error('Invalid setting value type');
        }

        await settingsStore.updateSetting(id, data, true);

        const successfullyHandled = await ensurePermission(data);

        if (successfullyHandled) {
            await settingsStore.updateSetting(id, data);
        } else {
            await settingsStore.updateSetting(id, !data, true);
        }
    };

    const privacySettingChangeHandlerWithLoader = addMinDelayLoader(
        uiStore.setShowLoader,
        privacySettingChangeHandler,
    );

    const disableStealthChangeHandler: SettingHandler = async (payload) => {
        const { data: isStealthDisabled } = payload;

        if (typeof isStealthDisabled !== 'boolean') {
            throw new Error('Invalid setting value type');
        }

        const isPermissionRequired = !isStealthDisabled && settings.values[BlockWebRTC];

        if (isPermissionRequired) {
            return privacySettingChangeHandler(payload);
        }

        return settingChangeHandler(payload);
    };

    const disableStealthChangeHandlerWrapper = addMinDelayLoader(
        uiStore.setShowLoader,
        disableStealthChangeHandler,
    );

    const {
        DisableStealthMode,
        SelfDestructThirdPartyCookies,
        SelfDestructThirdPartyCookiesTime,
        SelfDestructFirstPartyCookies,
        SelfDestructFirstPartyCookiesTime,
        HideReferrer,
        HideSearchQueries,
        SendDoNotTrack,
        BlockWebRTC,
        RemoveXClientData,
    } = settings.names;

    const isThirdPartyCookiesEnabled = settings.values[SelfDestructThirdPartyCookies];
    const isFirstPartyCookiesEnabled = settings.values[SelfDestructFirstPartyCookies];

    const switchId = DisableStealthMode;
    const switchTitleId = `${switchId}-title`;

    return (
        <>
            <SettingsSection
                id={switchId}
                title={translator.getMessage('options_privacy_title')}
                titleId={switchTitleId}
                description={translator.getMessage('options_privacy_desc')}
                mode="smallContainer"
                inlineControl={(
                    <Setting
                        id={DisableStealthMode}
                        type={SETTINGS_TYPES.CHECKBOX}
                        label={translator.getMessage('options_privacy_title')}
                        labelId={switchTitleId}
                        inverted
                        value={settings.values[DisableStealthMode]}
                        handler={disableStealthChangeHandlerWrapper}
                    />
                )}
            />

            <SettingsSection
                title={translator.getMessage('options_stealth_general_title')}
                mode="subTitle"
            >
                <SettingsSetCheckbox
                    // TODO fix type error when SettingsSetCheckbox be rewritten in typescript
                    // @ts-ignore
                    title={translator.getMessage('options_block_known_trackers_title')}
                    description={translator.getMessage('options_block_known_trackers_description')}
                    disabled={!blockKnownTrackers}
                    id={BlockKnownTrackers}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={translator.getMessage('options_block_known_trackers_title')}
                    value={blockKnownTrackers}
                    handler={blockKnownTrackersChangeHandlerWrapper}
                />

                <SettingsSetCheckbox
                    // TODO fix type error when SettingsSetCheckbox be rewritten in typescript
                    // @ts-ignore
                    title={translator.getMessage('options_strip_tracking_params_title')}
                    description={translator.getMessage('options_strip_tracking_params_description')}
                    disabled={!stripTrackingParameters}
                    id={STRIP_TRACKING_PARAMETERS}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={translator.getMessage('options_strip_tracking_params_title')}
                    value={stripTrackingParameters}
                    handler={stripTrackingParametersChangeHandlerWrapper}
                />
                <SettingsSetCheckbox
                    // TODO fix type error when SettingsSetCheckbox be rewritten in typescript
                    // @ts-ignore
                    title={translator.getMessage('options_hide_search_queries_title')}
                    description={translator.getMessage('options_hide_search_queries_desc')}
                    disabled={!settings.values[HideSearchQueries]}
                    id={HideSearchQueries}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={translator.getMessage('options_hide_search_queries_title')}
                    value={settings.values[HideSearchQueries]}
                    handler={settingChangeHandler}
                />
                <SettingsSetCheckbox
                    // TODO fix type error when SettingsSetCheckbox be rewritten in typescript
                    // @ts-ignore
                    title={translator.getMessage('options_send_not_track_title')}
                    description={reactTranslator.getMessage('options_send_not_track_desc', {
                        gpc: (chunks: string) => (
                            <a
                                className="desc--link"
                                href={GLOBAL_PRIVACY_CONTROL_URL}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {chunks}
                            </a>
                        ),
                        dnt: (chunks: string) => (
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
                    disabled={!settings.values[SendDoNotTrack]}
                    id={SendDoNotTrack}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={translator.getMessage('options_send_not_track_title')}
                    value={settings.values[SendDoNotTrack]}
                    handler={settingChangeHandler}
                />
            </SettingsSection>

            {!__IS_MV3__ && (
                <SettingsSection
                    title={translator.getMessage('options_stealth_tracking_methods_title')}
                    mode="subTitle"
                >
                    { /* TODO fix type error when SettingsSection be rewritten in typescript */}
                    {/* @ts-ignore */}
                    <SettingsSetCheckbox
                        title={translator.getMessage('options_third_party_title')}
                        description={(
                            <DescriptionWithWarning
                                description={translator.getMessage('options_third_party_desc')}
                                extraDescription={translator.getMessage('options_block_cookies_lifetime')}
                                warningText={translator.getMessage('options_third_party_block_cookies_warning')}
                            />
                        )}
                        disabled={!isThirdPartyCookiesEnabled}
                        id={SelfDestructThirdPartyCookies}
                        type={SETTINGS_TYPES.CHECKBOX}
                        label={translator.getMessage('options_third_party_title')}
                        value={isThirdPartyCookiesEnabled}
                        handler={settingChangeHandler}
                        className="stealth__tracking-setting"
                    >
                        <div className="stealth__tracking-setting__minutes">
                            {translator.getMessage('options_lifetime_minutes')}
                        </div>
                        <Setting
                            id={SelfDestructThirdPartyCookiesTime}
                            className="stealth__input"
                            disabled={!isThirdPartyCookiesEnabled}
                            type={SETTINGS_TYPES.INPUT}
                            value={settings.values[SelfDestructThirdPartyCookiesTime]}
                            handler={settingChangeHandler}
                            placeholder={DEFAULT_THIRD_PARTY_COOKIES_SELF_DESTRUCT_MIN}
                            required={isThirdPartyCookiesEnabled}
                            minValue="0"
                            step="0.1"
                        />
                    </SettingsSetCheckbox>

                    { /* TODO fix type error when SettingsSection be rewritten in typescript */}
                    {/* @ts-ignore */}
                    <SettingsSetCheckbox
                        title={translator.getMessage('options_first_party_title')}
                        description={(
                            <DescriptionWithWarning
                                description={translator.getMessage('options_first_party_desc')}
                                extraDescription={translator.getMessage('options_block_cookies_lifetime')}
                                warningText={translator.getMessage('options_first_party_block_cookies_warning')}
                            />
                        )}
                        disabled={!isFirstPartyCookiesEnabled}
                        id={SelfDestructFirstPartyCookies}
                        type={SETTINGS_TYPES.CHECKBOX}
                        label={translator.getMessage('options_first_party_title')}
                        value={isFirstPartyCookiesEnabled}
                        handler={settingChangeHandler}
                        className="stealth__tracking-setting"
                    >
                        <div className="stealth__tracking-setting__minutes">
                            {translator.getMessage('options_lifetime_minutes')}
                        </div>
                        <Setting
                            id={SelfDestructFirstPartyCookiesTime}
                            className="stealth__input"
                            disabled={!isFirstPartyCookiesEnabled}
                            type={SETTINGS_TYPES.INPUT}
                            value={settings.values[SelfDestructFirstPartyCookiesTime]}
                            handler={settingChangeHandler}
                            placeholder={DEFAULT_FIRST_PARTY_COOKIES_SELF_DESTRUCT_MIN}
                            required={isFirstPartyCookiesEnabled}
                            minValue="0"
                            step="0.1"
                        />
                    </SettingsSetCheckbox>
                </SettingsSection>
            )}

            <SettingsSection
                title={translator.getMessage('options_stealth_miscellaneous_title')}
                mode="subTitle"
            >

                <SettingsSetCheckbox
                    // TODO fix type error when SettingsSetCheckbox is rewritten in TypeScript
                    // @ts-ignore
                    title={translator.getMessage('options_disable_webrtc_title')}
                    description={translator.getMessage('options_disable_webrtc_desc')}
                    disabled={!settings.values[BlockWebRTC]}
                    id={BlockWebRTC}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={translator.getMessage('options_disable_webrtc_title')}
                    value={settings.values[BlockWebRTC]}
                    handler={privacySettingChangeHandlerWithLoader}
                />

                {/* TODO revert this option when will be found a way to disable
                    referrer rule with stealth exclusion AG-34765 */}
                {!__IS_MV3__ && (
                    <SettingsSetCheckbox
                        // TODO fix type error when SettingsSetCheckbox be rewritten in typescript
                        // @ts-ignore
                        title={translator.getMessage('options_hide_referrer_title')}
                        description={translator.getMessage('options_hide_referrer_desc')}
                        disabled={!settings.values[HideReferrer]}
                        id={HideReferrer}
                        type={SETTINGS_TYPES.CHECKBOX}
                        label={translator.getMessage('options_hide_referrer_title')}
                        value={settings.values[HideReferrer]}
                        handler={settingChangeHandler}
                    />  
                )}

                {settingsStore.isChrome && (
                    <SettingsSetCheckbox
                        // TODO fix type error when SettingsSetCheckbox be rewritten in typescript
                        // @ts-ignore
                        title={translator.getMessage('options_remove_client_data_title')}
                        description={translator.getMessage('options_remove_client_data_desc')}
                        disabled={!settings.values[RemoveXClientData]}
                        id={RemoveXClientData}
                        type={SETTINGS_TYPES.CHECKBOX}
                        label={translator.getMessage('options_remove_client_data_title')}
                        value={settings.values[RemoveXClientData]}
                        handler={settingChangeHandler}
                    />
                )}
            </SettingsSection>
        </>
    );
});

export { Stealth };
