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
// import browser, { WebNavigation } from 'webextension-polyfill';

// import { executeScript } from 'scripting-service';

// import {
//     MAIN_FRAME_ID,
//     isHttpOrWsRequest,
//     tabsApi as tsWebExtTabsApi,
// } from '../../tswebextension';
// import { SUBSCRIBE_OUTPUT } from '../../../../../constants';
// import { NotifierType, BACKGROUND_TAB_ID } from '../../../common/constants';
// import {
//     MessageType,
//     LoadCustomFilterInfoMessage,
//     SubscribeToCustomFilterMessage,
//     RemoveAntiBannerFilterMessage,
// } from '../../../common/messages';
// import { CustomFilterApi, GetCustomFilterInfoResult } from '../../api/filters/custom';
// import { messageHandler } from '../../message-handler';
// import { notifier } from '../../notifier';
// import { engine } from '../../engine';
// import type { CustomFilterMetadata } from '../../schema';

/**
 * Service for processing events with custom filters.
 * TODO: Uncomment this class when custom filters will be supported for MV3.
 */
export class CustomFiltersService {
    // /**
    //  * Init handlers.
    //  */
    // static init(): void {
    //     messageHandler.addListener(MessageType.LoadCustomFilterInfo, CustomFiltersService.onCustomFilterInfoLoad);
    // eslint-disable-next-line max-len
    //     messageHandler.addListener(MessageType.SubscribeToCustomFilter, CustomFiltersService.onCustomFilterSubscription);
    //     messageHandler.addListener(MessageType.RemoveAntiBannerFilter, CustomFiltersService.onCustomFilterRemove);

    //     browser.webNavigation.onCommitted.addListener(CustomFiltersService.injectSubscriptionScript);
    // }

    // /**
    //  * Returns custom filter info for modal window.
    //  *
    //  * @param message Message data.
    //  *
    //  * @returns Custom filter info.
    //  */
    // static async onCustomFilterInfoLoad(message: LoadCustomFilterInfoMessage): Promise<GetCustomFilterInfoResult> {
    //     const { url, title } = message.data;

    //     return CustomFilterApi.getFilterInfo(url, title);
    // }

    // /**
    //  * Add new custom filter.
    //  *
    //  * @param message Message data.
    //  *
    //  * @returns Custom filter metadata.
    //  */
    // static async onCustomFilterSubscription(message: SubscribeToCustomFilterMessage): Promise<CustomFilterMetadata> {
    //     const { filter } = message.data;

    //     const { customUrl, name, trusted } = filter;

    //     // Creates a filter and enables the group if necessary.
    //     const filterMetadata = await CustomFilterApi.createFilter({
    //         customUrl,
    //         title: name,
    //         trusted,
    //         enabled: true,
    //     });

    //     await engine.update();

    //     notifier.notifyListeners(NotifierType.CustomFilterAdded);
    //     return filterMetadata;
    // }

    // /**
    //  * Removes a custom filter.
    //  *
    //  * If the filter was enabled, the engine will be updated.
    //  *
    //  * @param message Message data.
    //  */
    // static async onCustomFilterRemove(message: RemoveAntiBannerFilterMessage): Promise<void> {
    //     const { filterId } = message.data;

    //     const wasEnabled = await CustomFilterApi.removeFilter(filterId);
    //     if (wasEnabled) {
    //         await engine.update();
    //     }
    // }

    // /**
    //  * Inject custom filter subscription content script to tab.
    //  *
    //  * @param details OnCommitted event request details.
    //  */
    // static async injectSubscriptionScript(details: WebNavigation.OnCommittedDetailsType): Promise<void> {
    //     const { tabId, frameId } = details;

    //     if (tabId === BACKGROUND_TAB_ID) {
    //         return;
    //     }

    //     const frame = tsWebExtTabsApi.getTabFrame(tabId, frameId);

    //     if (!frame) {
    //         return;
    //     }

    //     const isDocumentFrame = frameId === MAIN_FRAME_ID;

    //     if (!isDocumentFrame || !isHttpOrWsRequest(frame.url)) {
    //         return;
    //     }

    //     try {
    //         await executeScript(tabId, {
    //             files: [`/${SUBSCRIBE_OUTPUT}.js`],
    //             frameId,
    //         });
    //     } catch (e) {
    //         // do nothing
    //     }
    // }
}
