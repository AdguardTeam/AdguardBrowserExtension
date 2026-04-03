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

import browser, { type WebNavigation } from 'webextension-polyfill';

import { UserAgent } from '../../../common/user-agent';
import { logger } from '../../../common/logger';
import { messageHandler } from '../../message-handler';
import { MessageType } from '../../../common/messages';
import { searchPageAccessStorage } from '../../storages';
import { MAIN_FRAME_ID } from '../../tswebextension';
import { NotImplementedError } from '../../errors/not-implemented-error';

import { isSearchEngineDomain } from './search-domains';

/**
 * Base service for detecting and notifying users about Opera's
 * "Allow access to search page results" permission.
 */
export class SearchPageAccessServiceCommon {
    /**
     * Bound reference to {@link onNavigationCommitted} for adding/removing the listener.
     */
    private static boundOnNavigationCommitted: ((details: WebNavigation.OnCommittedDetailsType) => void) | null = null;

    /**
     * Initializes the service.
     * Only activates in Opera browser. Skips the navigation listener
     * if the notification has already been dismissed.
     */
    public static async init(): Promise<void> {
        if (!UserAgent.isOpera) {
            return;
        }

        const shouldShow = await searchPageAccessStorage.shouldShowNotification();
        if (!shouldShow) {
            return;
        }

        messageHandler.addListener(
            MessageType.DismissSearchPageAccessNotification,
            SearchPageAccessServiceCommon.dismissNotification.bind(this),
        );

        this.addNavigationListener();
    }

    /**
     * Returns whether the notification should be shown.
     *
     * @returns Whether the notification should be shown.
     */
    public static async shouldShowNotification(): Promise<boolean> {
        return UserAgent.isOpera
            && await searchPageAccessStorage.shouldShowNotification()
            && !await searchPageAccessStorage.isPermissionGranted();
    }

    /**
     * Sets shouldShowNotification to false, saves state,
     * and removes the navigation listener since it is no longer needed.
     */
    public static async dismissNotification(): Promise<void> {
        await searchPageAccessStorage.dismissNotification();
        this.removeNavigationListener();
    }

    /**
     * Registers the webNavigation.onCommitted listener.
     */
    private static addNavigationListener(): void {
        if (this.boundOnNavigationCommitted) {
            return;
        }

        this.boundOnNavigationCommitted = this.onNavigationCommitted.bind(this);
        browser.webNavigation.onCommitted.addListener(this.boundOnNavigationCommitted);
    }

    /**
     * Removes the webNavigation.onCommitted listener if it was registered.
     */
    private static removeNavigationListener(): void {
        if (!this.boundOnNavigationCommitted) {
            return;
        }

        browser.webNavigation.onCommitted.removeListener(this.boundOnNavigationCommitted);
        this.boundOnNavigationCommitted = null;
    }

    /**
     * Handles navigation committed event.
     *
     * @param details Navigation details.
     */
    protected static async onNavigationCommitted(details: WebNavigation.OnCommittedDetailsType): Promise<void> {
        const {
            tabId,
            frameId,
            url,
        } = details;

        if (frameId !== MAIN_FRAME_ID) {
            return;
        }

        if (!isSearchEngineDomain(url)) {
            return;
        }

        const shouldShow = await searchPageAccessStorage.shouldShowNotification();
        if (!shouldShow) {
            return;
        }

        await this.checkPermission(tabId, url);
    }

    /**
     * Attempts to inject a test script into the tab.
     *
     * @param tabId Tab ID to check.
     * @param url URL of the page.
     */
    private static async checkPermission(tabId: number, url: string): Promise<void> {
        try {
            await this.executeTestScript(tabId);

            logger.debug(`[ext.SearchPageAccessServiceCommon.checkPermission]: permission granted for ${url}`);
            await searchPageAccessStorage.setIsPermissionGranted(true);
        } catch (error) {
            logger.warn(`[ext.SearchPageAccessServiceCommon.checkPermission]: injection failed for ${url}:`, error);
            await searchPageAccessStorage.setIsPermissionGranted(false);
        }
    }

    /**
     * Executes test script injection to check permission.
     * Must be overridden by MV2/MV3 subclasses.
     *
     * @param tabId Tab ID to inject into.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected static async executeTestScript(tabId: number): Promise<void> {
        throw new NotImplementedError();
    }
}
