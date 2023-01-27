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
import { throttle } from 'lodash';

import { translator } from '../../../common/translators/translator';
import { FrameData } from './frames';
import {
    ContextMenuAction,
    contextMenuEvents,
    settingsEvents,
} from '../../events';
import { SettingOption } from '../../schema';
import { SettingsApi } from '../settings';

export type AddMenuItemOptions = Menus.CreateCreatePropertiesType & {
    messageArgs?: { [key: string]: unknown },
};

/**
 * API for creating and updating browser context menu.
 */
export class ContextMenuApi {
    /**
     * Initializes Context Menu API.
     */
    public static init(): void {
        settingsEvents.addListener(SettingOption.DisableShowContextMenu, ContextMenuApi.handleDisableShowContextMenu);
    }

    /**
     * Throttled updateMenu.
     * Used in because updateMenu can be called multiple times from various event listeners, but
     * context menu doesn't require fast update.
     */
    public static throttledUpdateMenu = throttle(ContextMenuApi.updateMenu, 100);

    /**
     * Updates context menu depends on tab filtering state.
     *
     * @param frameData Frame data from both tswebextension and app state.
     * @param frameData.applicationFilteringDisabled Is app filtering disabled globally.
     * @param frameData.urlFilteringDisabled Is app filtering disabled for current tab.
     * @param frameData.documentAllowlisted Is website allowlisted.
     * @param frameData.userAllowlisted Is current website allowlisted by user rule.
     * @param frameData.canAddRemoveRule Is user rules was applied on current website.
     */
    private static async updateMenu({
        applicationFilteringDisabled,
        urlFilteringDisabled,
        documentAllowlisted,
        userAllowlisted,
        canAddRemoveRule,
    }: FrameData): Promise<void> {
        // Clean up context menu just in case.
        await ContextMenuApi.removeAll();

        // There is nothing to do if context menu is disabled
        if (SettingsApi.getSetting(SettingOption.DisableShowContextMenu)) {
            return;
        }

        try {
            if (applicationFilteringDisabled) {
                await ContextMenuApi.addFilteringDisabledMenuItems();
            } else if (urlFilteringDisabled) {
                await ContextMenuApi.addUrlFilteringDisabledContextMenuAction();
            } else {
                if (documentAllowlisted && !userAllowlisted) {
                    await ContextMenuApi.addMenuItem(ContextMenuAction.SiteException);
                } else if (canAddRemoveRule) {
                    if (documentAllowlisted) {
                        await ContextMenuApi.addMenuItem(ContextMenuAction.SiteFilteringOn);
                    } else {
                        await ContextMenuApi.addMenuItem(ContextMenuAction.SiteFilteringOff);
                    }
                }
                await ContextMenuApi.addSeparator();

                if (!documentAllowlisted) {
                    await ContextMenuApi.addMenuItem(ContextMenuAction.BlockSiteAds);
                }

                await ContextMenuApi.addMenuItem(ContextMenuAction.SecurityReport);
                await ContextMenuApi.addMenuItem(ContextMenuAction.ComplaintWebsite);
                await ContextMenuApi.addSeparator();
                await ContextMenuApi.addMenuItem(ContextMenuAction.UpdateAntibannerFilters);
                await ContextMenuApi.addSeparator();
                await ContextMenuApi.addMenuItem(ContextMenuAction.OpenSettings);
                await ContextMenuApi.addMenuItem(ContextMenuAction.OpenLog);
                await ContextMenuApi.addMenuItem(ContextMenuAction.DisableProtection);
            }
        } catch (e) {
            // do nothing
        }
    }

    /**
     * Removes all context menu items.
     *
     * @private
     */
    private static async removeAll(): Promise<void> {
        await browser.contextMenus.removeAll();
    }

    /**
     * Creates menu items for context menu, displayed, when app filtering disabled globally.
     */
    private static async addFilteringDisabledMenuItems(): Promise<void> {
        await ContextMenuApi.addMenuItem(ContextMenuAction.SiteFilteringDisabled);
        await ContextMenuApi.addSeparator();
        await ContextMenuApi.addMenuItem(ContextMenuAction.OpenLog);
        await ContextMenuApi.addMenuItem(ContextMenuAction.OpenSettings);
        await ContextMenuApi.addMenuItem(ContextMenuAction.EnableProtection);
    }

    /**
     * Creates menu items for context menu, displayed, when app filtering disabled for current tab.
     */
    private static async addUrlFilteringDisabledContextMenuAction(): Promise<void> {
        await ContextMenuApi.addMenuItem(ContextMenuAction.SiteFilteringDisabled);
        await ContextMenuApi.addSeparator();
        await ContextMenuApi.addMenuItem(ContextMenuAction.OpenLog);
        await ContextMenuApi.addMenuItem(ContextMenuAction.OpenSettings);
        await ContextMenuApi.addMenuItem(ContextMenuAction.UpdateAntibannerFilters);
    }

    /**
     * Creates menu item for context menu.
     *
     * @param action Context menu action key.
     * @param options {@link browser.contextMenus.create} Options.
     */
    private static async addMenuItem(action: ContextMenuAction, options: AddMenuItemOptions = {}): Promise<void> {
        const { messageArgs, ...rest } = options;

        await browser.contextMenus.create({
            contexts: ['all'],
            title: translator.getMessage(action, messageArgs),
            onclick: () => {
                contextMenuEvents.publishEvent(action);
            },
            ...rest,
        });
    }

    /**
     * Creates menu separator.
     */
    private static async addSeparator(): Promise<void> {
        await browser.contextMenus.create({
            type: 'separator',
            contexts: ['all'],
        });
    }

    /**
     * Handles changes of disable context menu setting.
     *
     * @param disable Boolean flag where true means context menu is disabled.
     */
    private static async handleDisableShowContextMenu(disable: boolean): Promise<void> {
        // handle only disable menu, anyway user switch tab button, after enabling
        if (disable) {
            await ContextMenuApi.removeAll();
        }
    }
}
