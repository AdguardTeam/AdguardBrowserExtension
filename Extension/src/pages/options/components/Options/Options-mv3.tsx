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

import React from 'react';
import { Route } from 'react-router-dom';

import { type SettingsStore } from 'settings-store';

import { General } from '../General';
import { Filters } from '../Filters';
import { Stealth } from '../Stealth';
import { Allowlist } from '../Allowlist';
import { UserRules } from '../UserRules';
import { Miscellaneous } from '../Miscellaneous';
import { About } from '../About';
import { RulesLimits } from '../RulesLimits/RulesLimits-mv3';
import { type LongLivedConnectionCallbackMessage } from '../../../services/messenger';
import { logger } from '../../../../common/logger';
import { ExtensionUpdateFSMState, NotifierType } from '../../../../common/constants';
import { NotificationType } from '../../../common/types';
import { OptionsPageSections } from '../../../../common/nav';
import { translator } from '../../../../common/translators/translator';
import type UiStore from '../../stores/UiStore';

import { COMMON_EVENTS, createCommonMessageHandler } from './Options-common';
import { OptionsLayout } from './Options-layout';

/**
 * Creates a message handler with extension update state change support
 * Handles all common events plus ExtensionUpdateStateChange
 *
 * @param settingsStore - Settings store instance
 * @param uiStore - UI store instance for managing notifications
 *
 * @returns Async function that handles LongLivedConnectionCallbackMessage events including update state changes
 */
export const createMessageHandler = (
    settingsStore: SettingsStore,
    uiStore: UiStore,
) => {
    const handleExtensionUpdateStateChange = (state: ExtensionUpdateFSMState) => {
        switch (state) {
            case ExtensionUpdateFSMState.Checking:
                settingsStore.setIsExtensionCheckingUpdateOrUpdating(true);
                break;
            case ExtensionUpdateFSMState.NotAvailable: {
                settingsStore.setIsExtensionCheckingUpdateOrUpdating(false);
                uiStore.addNotification({
                    type: NotificationType.Success,
                    text: translator.getMessage('update_not_needed'),
                });
                break;
            }
            case ExtensionUpdateFSMState.Available: {
                settingsStore.setIsExtensionCheckingUpdateOrUpdating(false);
                settingsStore.setIsExtensionUpdateAvailable(true);
                break;
            }
            case ExtensionUpdateFSMState.Updating:
                settingsStore.setIsExtensionCheckingUpdateOrUpdating(true);
                break;
            case ExtensionUpdateFSMState.Failed: {
                settingsStore.setIsExtensionCheckingUpdateOrUpdating(false);
                settingsStore.setIsExtensionUpdateAvailable(false);
                uiStore.addNotification({
                    type: NotificationType.Error,
                    text: translator.getMessage('update_failed_text'),
                    button: {
                        title: translator.getMessage('update_failed_try_again_btn'),
                        onClick: settingsStore.checkUpdates,
                    },
                });
                break;
            }
            default: {
                // do nothing since notification should be shown
                // for a limited list of states
                break;
            }
        }
    };

    return async (message: LongLivedConnectionCallbackMessage) => {
        const { type } = message;

        switch (type) {
            case NotifierType.ExtensionUpdateStateChange: {
                const [eventData] = message.data;
                handleExtensionUpdateStateChange(eventData);
                break;
            }
            default: {
                createCommonMessageHandler(settingsStore, uiStore)(message);
                break;
            }
        }
    };
};

/**
 * Initializes the options page with filter limits checking
 * Loads options data, checks for filter limits exceeded, and validates rule limitations
 *
 * @param settingsStore - Settings store instance
 * @param uiStore - UI store instance for displaying limit notifications
 *
 * @returns Promise resolving to true if initialization succeeded, false otherwise
 */
export const initialize = async (
    settingsStore: SettingsStore,
    uiStore: UiStore,
): Promise<boolean> => {
    const optionsData = await settingsStore.requestOptionsData();

    if (!optionsData) {
        logger.error('[ext.Options-mv3]: Failed to get options data');

        return false;
    }
    const { runtimeInfo } = optionsData;

    // Show notification about changed filter list by browser only once.
    if (runtimeInfo?.areFilterLimitsExceeded) {
        uiStore.addRuleLimitsNotification(translator.getMessage('popup_limits_exceeded_warning'));
    }

    // Note: Is it important to check the limits after the request for
    // options data is completed, because the request for options data
    // will wait until the background service worker wakes up.
    await settingsStore.checkLimitations();

    return true;
};

/**
 * Array of all events that options page listens to
 * Includes common events plus ExtensionUpdateStateChange
 */
export const EVENTS = [
    ...COMMON_EVENTS,
    NotifierType.ExtensionUpdateStateChange,
];

/**
 * Returns the route configuration for options page
 * Includes all standard pages without Rules Limits section
 *
 * @returns JSX Route element with nested routes for all option pages
 */
export const getOptionRoute = () => {
    return (
        <Route path="/" element={<OptionsLayout />}>
            <Route index element={<General />} />
            <Route path={OptionsPageSections.filters} element={<Filters />} />
            <Route path={OptionsPageSections.stealth} element={<Stealth />} />
            <Route path={OptionsPageSections.allowlist} element={<Allowlist />} />
            <Route path={OptionsPageSections.userFilter} element={<UserRules />} />
            <Route path={OptionsPageSections.miscellaneous} element={<Miscellaneous />} />
            <Route path={OptionsPageSections.ruleLimits} element={<RulesLimits />} />
            <Route path={OptionsPageSections.about} element={<About />} />
            <Route path="*" element={<General />} />
        </Route>
    );
};
