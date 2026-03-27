/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import { MessageType, sendMessage } from '../common/messages';

import { initLinkInterceptor, getAnchorElement } from './link-interceptor';

/**
 * Content script that intercepts clicks on `adguard:import_user_configuration?…` and
 * `adguard://import_user_configuration?…` links and forwards the query string to the
 * background script for processing.
 */
export class ImportConfiguration {
    /**
     * Mouse button code for the secondary (right) button.
     * Right-click opens the context menu and must not be intercepted.
     */
    private static readonly MOUSE_BUTTON_SECONDARY = 2;

    /**
     * Attaches the click-interception listener to the document.
     */
    public static init(): void {
        initLinkInterceptor(ImportConfiguration.handleOnClickEvent);
    }

    /**
     * Handles pointer-down events. Intercepts import-configuration link clicks,
     * prevents navigation, and forwards the query string to the background.
     *
     * @param event Pointer event from the document.
     */
    private static handleOnClickEvent(event: PointerEvent): void {
        // Right-click must be ignored so the browser can handle
        // the context-menu action natively.
        if (event.button === ImportConfiguration.MOUSE_BUTTON_SECONDARY) {
            return;
        }

        const target = getAnchorElement(event);

        if (!target || !ImportConfiguration.hasImportLink(target)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const queryString = ImportConfiguration.getQueryString(target);

        if (!queryString) {
            return;
        }

        sendMessage({
            type: MessageType.ImportConfiguration,
            data: { queryString },
        });
    }

    /**
     * Checks whether an anchor element points to an import-configuration link.
     *
     * @param element Anchor element to check.
     *
     * @returns `true` if the href matches the import-configuration protocol.
     */
    private static hasImportLink(element: HTMLAnchorElement): boolean {
        const { href } = element;

        return /^adguard:\/*(import_user_configuration)\?/i.test(href);
    }

    /**
     * Extracts the raw query string (without the leading `?`) from an anchor element's href.
     *
     * @param element Anchor element.
     *
     * @returns The query string, or null if the href has no query component.
     */
    private static getQueryString(element: HTMLAnchorElement): string | null {
        const { href } = element;

        const questionIdx = href.indexOf('?');

        if (questionIdx === -1) {
            return null;
        }

        return href.slice(questionIdx + 1);
    }
}
