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

import { type MessageHandler } from '@adguard/tswebextension/mv3';

export interface TsWebExtensionEngine {
    /**
     * Debounces the update method.
     *
     * @returns Nothing.
     */
    debounceUpdate: () => void;

    /**
     * Handles messages from the tswebextension.
     *
     * @param message - Message from the tswebextension.
     *
     * @returns Promise<void>.
     */
    handleMessage: MessageHandler;

    /**
     * Starts the tswebextension and updates the counter of active rules.
     *
     * @returns Promise<void>.
     */
    start(): Promise<void>;

    /**
     * Updates tswebextension configuration and after that updates the counter
     * of active rules.
     *
     * @returns Promise<void>.
     */
    update(): Promise<void>;

    /**
     * Sets the filtering state.
     */
    setFilteringState(isFilteringDisabled: boolean): Promise<void>;
}
