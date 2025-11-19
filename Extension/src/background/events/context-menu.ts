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

import { logger } from '../../common/logger';

export const enum ContextMenuAction {
    SiteProtectionDisabled = 'context_site_protection_disabled',
    SiteFilteringDisabled = 'context_site_filtering_disabled',
    SiteException = 'context_site_exception',
    BlockSiteAds = 'context_block_site_ads',
    SecurityReport = 'context_security_report',
    ComplaintWebsite = 'context_complaint_website',
    SiteFilteringOn = 'context_site_filtering_on',
    SiteFilteringOff = 'context_site_filtering_off',
    EnableProtection = 'context_enable_protection',
    DisableProtection = 'context_disable_protection',
    OpenSettings = 'context_open_settings',
    OpenLog = 'context_open_log',
    UpdateFilters = 'context_update_antibanner_filters',
}

type ContextMenuListener = () => unknown | Promise<unknown>;

/**
 * Type-safe mediator for context menu events.
 */
class ContextMenuEvents {
    private listenersMap = new Map<unknown, ContextMenuListener>();

    /**
     * Adds a listener for context menu events.
     * Only one listener per event.
     *
     * @param event Event with some generic type.
     * @param listener Listener for this event.
     *
     * @throws Basic {@link Error} if a listener was registered for the event.
     */
    public addListener(event: ContextMenuAction, listener: ContextMenuListener): void {
        if (this.listenersMap.has(event)) {
            throw new Error(`${event} listener has already been registered`);
        }
        this.listenersMap.set(event, listener);
    }

    /**
     * Publishes the event and, if a listener is found, notifies the listener.
     *
     * @param event Event with some generic type.
     *
     * @returns Promise with the result of the listener.
     */
    public async publishEvent(event: ContextMenuAction): Promise<unknown> {
        const listener = this.listenersMap.get(event);

        if (!listener) {
            logger.error(`[ext.ContextMenuEvents.publishEvent]: contextMenuEvent not found listener for ${event}!`);
            return;
        }

        return Promise.resolve(listener());
    }

    /**
     * Removes all listeners.
     */
    public removeListeners(): void {
        this.listenersMap.clear();
    }
}

export const contextMenuEvents = new ContextMenuEvents();
