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
import browser from 'webextension-polyfill';

import { type AddUrlToTrustedMessage, MessageType } from '../../common/messages';
import { DocumentBlockApi, TabsApi } from '../api';
import { engine } from '../engine';
import { messageHandler } from '../message-handler';

/**
 * The DocumentBlockService controls events when an already blocked site
 * is excluded from the blocking mechanism for a period of time.
 */
export class DocumentBlockService {
    /**
     * Initializes {@link DocumentBlockApi} and registers a listener for
     * the event of adding a domain to trusted domains.
     */
    public static async init(): Promise<void> {
        await DocumentBlockApi.init();

        messageHandler.addListener(MessageType.AddUrlToTrusted, DocumentBlockService.onAddUrlToTrusted);
    }

    /**
     * Updates the active tab with the provided URL.
     *
     * @param url The URL to update the active tab with.
     */
    private static updateActiveTab = async (url: string): Promise<void> => {
        const tab = await TabsApi.getActive();

        if (!tab?.id) {
            return;
        }

        await browser.tabs.update(tab.id, { url });
    };

    /**
     * Listener for the event of adding a domain to trusted domains.
     *
     * @param message Message of type {@link AddUrlToTrustedMessage}.
     * @param message.data Contains string url domain.
     */
    private static async onAddUrlToTrusted({ data }: AddUrlToTrustedMessage): Promise<void> {
        const { url } = data;

        await DocumentBlockApi.setTrustedDomain(url);
        await engine.update();

        DocumentBlockService.updateActiveTab(url);
    }
}
