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
import { action, observable } from 'mobx';

import { logger } from '../../../common/logger';
import { type TelemetryEventName, type TelemetryScreenName } from '../../../background/telemetry';
import { messenger } from '../../services/messenger';

/**
 * Telemetry store.
 *
 * This store is integrated into both popup and option page's
 * global stores. This is why it's located in the common folder.
 */
export class TelemetryStore {
    /**
     * Is disable collect hits setting enabled.
     *
     * NOTE: This flag only mirrors "disableCollectHits" setting value, you should never change it directly.
     */
    @observable
    isDisableCollectHits = true;

    /**
     * ID of the current page.
     */
    @observable
    pageId: string | null = null;

    /**
     * Sets the "help us improve" setting.
     *
     * NOTE: This method should be called only on initialization
     * and when value is changed from background, never call it directly.
     *
     * @param isDisableCollectHits Is disable collect hits setting enabled.
     */
    @action
    setIsDisableCollectHits = (isDisableCollectHits: boolean): void => {
        this.isDisableCollectHits = isDisableCollectHits;
    };

    /**
     * Sets the page ID.
     *
     * @param pageId Page ID.
     */
    @action
    setPageId = (pageId: string | null): void => {
        // Guard against multiple calls, allow to set page ID only once or to `null`
        if (this.pageId && pageId) {
            logger.error(`[ext.TelemetryStore]: Cannot set page ID: already set to '${this.pageId}'`);
            return;
        }

        this.pageId = pageId;
    };

    /**
     * Removes previously added opened page from telemetry service.
     *
     * Note: This method should be called only from options page,
     * for popup page we have separate handling based on background connection,
     * since popup page does not fires unload event.
     */
    @action
    removeOpenedPage = async (): Promise<void> => {
        try {
            if (!this.pageId) {
                return;
            }

            // Delete from store first to prevent race condition
            const { pageId } = this;
            this.pageId = null;
            await messenger.removeTelemetryOpenedPage(pageId);
        } catch (e) {
            logger.debug('[ext.TelemetryStore]: Failed to remove opened page from telemetry service', e);
        }
    };

    /**
     * Sends a message to the background to send a page view telemetry event if telemetry is enabled.
     *
     * NOTE: Do not await this function, as it is not necessary to wait for the response.
     *
     * @param screenName Name of the screen.
     */
    sendPageViewEvent = async (screenName: TelemetryScreenName): Promise<void> => {
        try {
            if (this.isDisableCollectHits) {
                return;
            }

            if (!this.pageId) {
                logger.error(`[ext.TelemetryStore]: Cannot send page view telemetry event: missing page ID for screen '${screenName}'`);
                return;
            }

            await messenger.sendTelemetryPageViewEvent(screenName, this.pageId);
        } catch (e) {
            logger.debug('[ext.TelemetryStore]: Failed to send page view telemetry event', e);
        }
    };

    /**
     * Sends a message to the background to send a custom telemetry event if telemetry is enabled.
     *
     * NOTE: Do not await this function, as it is not necessary to wait for the response.
     *
     * @param eventName Name of the custom telemetry event.
     * @param screenName Name of the screen where the event occurred.
     */
    sendCustomEvent = async (
        eventName: TelemetryEventName,
        screenName: TelemetryScreenName,
    ): Promise<void> => {
        try {
            if (this.isDisableCollectHits) {
                return;
            }

            await messenger.sendTelemetryCustomEvent(screenName, eventName);
        } catch (e) {
            logger.debug('[ext.TelemetryStore]: Failed to send custom telemetry event', e);
        }
    };
}
