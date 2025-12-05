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
import { nanoid } from 'nanoid';

import { logger } from '../../../common/logger';
import { MessageType } from '../../../common/messages';
import { messageHandler } from '../../message-handler';

import { type TelemetryScreenName } from './enums';

/**
 * Tracks page navigation and screen views for telemetry purposes.
 *
 * Maintains current and previous screen names to provide navigation context
 * in telemetry events.
 */
export class TelemetryPageTracker {
    /**
     * Previous screen name.
     */
    public prevScreenName: TelemetryScreenName | undefined = undefined;

    /**
     * Current screen name.
     */
    public currentScreenName: TelemetryScreenName | undefined = undefined;

    /**
     * Page ID of the current screen.
     */
    public currentScreenPageId: string | undefined = undefined;

    /**
     * Set of opened pages IDs.
     * This is needed to track all opened pages (popup, options) and whenever it gets empty
     * reset {@link prevScreenName} and {@link currentScreenName} to `undefined`.
     * We store IDs instead of booleans or counter simply to avoid case when user opens
     * multiple pages of options / popup by directly putting URL in the browser tab.
     */
    private openedPages: Set<string> = new Set();

    /**
     * Sets up message listeners.
     */
    public init(): void {
        messageHandler.addListener(MessageType.AddTelemetryOpenedPage, this.handleAddOpenedPage);
        messageHandler.addListener(MessageType.RemoveTelemetryOpenedPage, this.handleRemoveOpenedPage);
    }

    /**
     * Handler for RemoveTelemetryOpenedPage message.
     *
     * @param message Message with pageId to remove.
     * @param message.data Data object containing the page ID.
     * @param message.data.pageId ID of the page to remove.
     */
    private handleRemoveOpenedPage = ({ data }: { data: { pageId: string } }): void => {
        this.removeOpenedPage(data.pageId);
    };

    /**
     * Handler for AddTelemetryOpenedPage message.
     *
     * @returns Page ID of new opened page, which can be used to remove it later.
     */
    private handleAddOpenedPage = (): string => {
        return this.addOpenedPage();
    };

    /**
     * Adds opened page to the list of opened pages.
     *
     * @param pageId ID of page to add. If not provided, a new ID will be generated.
     *
     * @returns Page ID of new opened page, which can be used to remove it later.
     */
    public addOpenedPage = (pageId?: string): string => {
        const newPageId = pageId || nanoid();
        this.openedPages.add(newPageId);

        return newPageId;
    };

    /**
     * Removes opened page from the list of opened pages.
     *
     * @param pageId ID of page to remove.
     */
    public removeOpenedPage = (pageId: string): void => {
        if (!this.openedPages.has(pageId)) {
            logger.debug(`[ext.TelemetryPageTracker]: Page with ID ${pageId} not found in opened pages list`);
            return;
        }

        this.openedPages.delete(pageId);

        if (this.openedPages.size === 0) {
            // Reset screen names if there are no opened pages
            this.prevScreenName = undefined;
            this.currentScreenName = undefined;
            this.currentScreenPageId = undefined;
        } else if (pageId === this.currentScreenPageId) {
            // Rotate forward screen names if current page is closed
            this.prevScreenName = this.currentScreenName;
            this.currentScreenName = undefined;
            this.currentScreenPageId = undefined;
        }
    };

    /**
     * Updates screen name and page ID.
     *
     * Do not send page view event if screen name is the same as the current
     * screen name and page ID is the same as the current screen page ID.
     * This condition as guard if UI renders same screen name twice.
     *
     * @param screenName Name of the screen to update.
     * @param pageId ID of the page to update.
     *
     * @returns True if screen name or page ID has changed.
     */
    public updateScreen(screenName: TelemetryScreenName, pageId: string): boolean {
        if (screenName === this.currentScreenName && pageId === this.currentScreenPageId) {
            return false;
        }

        this.prevScreenName = this.currentScreenName;
        this.currentScreenName = screenName;
        this.currentScreenPageId = pageId;

        return true;
    }
}
