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
import { OptionsPageSections } from '../../../../common/nav';
import type UiStore from '../../stores/UiStore';
import { logger } from '../../../../common/logger';

import { OptionsLayout } from './Options-layout';

export {
    createCommonMessageHandler as createMessageHandler,
    COMMON_EVENTS as EVENTS,
} from './Options-common';

/**
 * Initializes options page by loading options data
 *
 * @param settingsStore - Settings store instance
 * @param uiStore - UI store instance (unused in MV2, required for MV3 compatibility)
 *
 * @returns Promise resolving to true if initialization succeeded, false otherwise
 */
export const initialize = async (
    settingsStore: SettingsStore,
    // uiStore parameter unused but required for compatibility with MV3
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    uiStore: UiStore,
): Promise<boolean> => {
    const optionsData = await settingsStore.requestOptionsData();

    if (!optionsData) {
        logger.error('[ext.Options-mv2]: Failed to get options data');

        return false;
    }

    return true;
};

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
            <Route path={OptionsPageSections.about} element={<About />} />
            <Route path="*" element={<General />} />
        </Route>
    );
};
