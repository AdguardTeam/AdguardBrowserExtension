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
import browser from 'webextension-polyfill';

import { AddUrlToTrustedMessage, MessageType } from '../../common/messages';
import { DocumentBlockApi, TabsApi } from '../api';
import { Engine } from '../engine';
import { messageHandler } from '../message-handler';

export class DocumentBlockService {
    public static async init(): Promise<void> {
        await DocumentBlockApi.init();

        messageHandler.addListener(MessageType.AddUrlToTrusted, DocumentBlockService.onAddUrlToTrusted);
    }

    private static async onAddUrlToTrusted({ data }: AddUrlToTrustedMessage): Promise<void> {
        const { url } = data;

        await DocumentBlockApi.setTrustedDomain(url);
        await Engine.update();

        const tab = await TabsApi.getActive();

        if (tab?.id) {
            await browser.tabs.update(tab.id, { url });
        }
    }
}
