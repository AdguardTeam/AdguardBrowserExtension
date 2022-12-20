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
import browser, { Menus } from 'webextension-polyfill';

import { translator } from '../../../common/translators/translator';
import { FrameData } from './frames';
import { ContextMenuAction, contextMenuEvents } from '../../events';

export type AddMenuItemOptions = Menus.CreateCreatePropertiesType & {
    messageArgs?: { [key: string]: unknown },
};

/**
 * Api for creating and updating browser context menu
 */
export class ContextMenuApi {
    /**
     * Update context menu depends on tab filtering state
     *
     * @param frameData - frame data from both tswebextension and app state
     * @param frameData.applicationFilteringDisabled - is app filtering disabled globally
     * @param frameData.urlFilteringDisabled - is app filtering disabled for current tab
     * @param frameData.documentAllowlisted - is website allowlisted
     * @param frameData.userAllowlisted - is current website allowlisted by user rule
     * @param frameData.canAddRemoveRule - is user rules was applied on current website
     */
    public static async updateMenu({
        applicationFilteringDisabled,
        urlFilteringDisabled,
        documentAllowlisted,
        userAllowlisted,
        canAddRemoveRule,
    }: FrameData): Promise<void> {
        try {
            // clean up context menu
            await browser.contextMenus.removeAll();

            if (applicationFilteringDisabled) {
                ContextMenuApi.addFilteringDisabledMenuItems();
            } else if (urlFilteringDisabled) {
                ContextMenuApi.addUrlFilteringDisabledContextMenuAction();
            } else {
                if (documentAllowlisted && !userAllowlisted) {
                    ContextMenuApi.addMenuItem(ContextMenuAction.SiteException);
                } else if (canAddRemoveRule) {
                    if (documentAllowlisted) {
                        ContextMenuApi.addMenuItem(ContextMenuAction.SiteFilteringOn);
                    } else {
                        ContextMenuApi.addMenuItem(ContextMenuAction.SiteFilteringOff);
                    }
                }
                ContextMenuApi.addSeparator();

                if (!documentAllowlisted) {
                    ContextMenuApi.addMenuItem(ContextMenuAction.BlockSiteAds);
                }

                ContextMenuApi.addMenuItem(ContextMenuAction.SecurityReport);
                ContextMenuApi.addMenuItem(ContextMenuAction.ComplaintWebsite);
                ContextMenuApi.addSeparator();
                ContextMenuApi.addMenuItem(ContextMenuAction.UpdateAntibannerFilters);
                ContextMenuApi.addSeparator();
                ContextMenuApi.addMenuItem(ContextMenuAction.OpenSettings);
                ContextMenuApi.addMenuItem(ContextMenuAction.OpenLog);
                ContextMenuApi.addMenuItem(ContextMenuAction.DisableProtection);
            }
        } catch (e) {
            // do nothing
        }
    }

    /**
     * Create menu items for context menu, displayed, when app filtering disabled globally
     */
    private static addFilteringDisabledMenuItems(): void {
        ContextMenuApi.addMenuItem(ContextMenuAction.SiteFilteringDisabled);
        ContextMenuApi.addSeparator();
        ContextMenuApi.addMenuItem(ContextMenuAction.OpenLog);
        ContextMenuApi.addMenuItem(ContextMenuAction.OpenSettings);
        ContextMenuApi.addMenuItem(ContextMenuAction.EnableProtection);
    }

    /**
     * Create menu items for context menu, displayed, when app filtering disabled for current tab
     */
    private static addUrlFilteringDisabledContextMenuAction(): void {
        ContextMenuApi.addMenuItem(ContextMenuAction.SiteFilteringDisabled);
        ContextMenuApi.addSeparator();
        ContextMenuApi.addMenuItem(ContextMenuAction.OpenLog);
        ContextMenuApi.addMenuItem(ContextMenuAction.OpenSettings);
        ContextMenuApi.addMenuItem(ContextMenuAction.UpdateAntibannerFilters);
    }

    /**
     * Create menu item for context menu
     *
     * @param action - context menu action key
     * @param options - {@link browser.contextMenus.create} options
     */
    private static addMenuItem(action: ContextMenuAction, options: AddMenuItemOptions = {}): void {
        const { messageArgs, ...rest } = options;

        browser.contextMenus.create({
            contexts: ['all'],
            title: translator.getMessage(action, messageArgs),
            onclick: () => {
                contextMenuEvents.publishEvent(action);
            },
            ...rest,
        });
    }

    /**
     * Create menu separator
     */
    private static addSeparator(): void {
        browser.contextMenus.create({
            type: 'separator',
            contexts: ['all'],
        });
    }
}
