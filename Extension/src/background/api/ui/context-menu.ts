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
import browser, { type Menus } from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { throttle } from 'lodash-es';

import { translator } from '../../../common/translators/translator';
import {
    ContextMenuAction,
    contextMenuEvents,
    settingsEvents,
} from '../../events';
import { SettingOption } from '../../schema';
import { SettingsApi } from '../settings';
import { OPTIONS_PAGE } from '../../../common/constants';

import { type FrameData } from './frames';

type AddMenuItemOptions = Menus.CreateCreatePropertiesType & {
    messageArgs?: { [key: string]: unknown };
};

/**
 * Wrapper around context menus create method.
 * It helps to handle errors thrown by contextMenus.
 *
 * @param props Options for creating menu.
 */
const createMenu = (props: browser.Menus.CreateCreatePropertiesType): Promise<void> => {
    return new Promise((resolve, reject) => {
        browser.contextMenus.create(props, () => {
            if (browser.runtime.lastError) {
                reject(browser.runtime.lastError);
                return;
            }
            resolve();
        });
    });
};

/**
 * API for creating and updating browser context menus.
 */
export class ContextMenuApi {
    /**
     * Initializes Context Menu API.
     */
    public static init(): void {
        settingsEvents.addListener(SettingOption.DisableShowContextMenu, ContextMenuApi.handleDisableShowContextMenu);
        browser.contextMenus.onClicked.addListener(async (onClickData: browser.Menus.OnClickData) => {
            await contextMenuEvents.publishEvent(onClickData.menuItemId as ContextMenuAction);
        });
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
     * @param frameData.url Current tab url.
     */
    private static async updateMenu({
        applicationFilteringDisabled,
        urlFilteringDisabled,
        documentAllowlisted,
        userAllowlisted,
        canAddRemoveRule,
        url,
    }: FrameData): Promise<void> {
        // TODO add better handling for AdGuard for Firefox
        // There is nothing to do if context menu is not supported
        if (!browser.contextMenus) {
            return;
        }

        // Clean up context menu just in case.
        await ContextMenuApi.removeAll();

        // There is nothing to do if context menu is disabled
        if (SettingsApi.getSetting(SettingOption.DisableShowContextMenu)) {
            return;
        }

        // Used no to show settings menu item on the options page
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2258
        const isOptionsPage = !!(url?.startsWith(browser.runtime.getURL(OPTIONS_PAGE)));

        try {
            if (applicationFilteringDisabled) {
                await ContextMenuApi.addFilteringDisabledMenuItems(isOptionsPage);
            } else if (urlFilteringDisabled) {
                await ContextMenuApi.addUrlFilteringDisabledContextMenuAction(isOptionsPage);
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
                if (!__IS_MV3__) {
                    await ContextMenuApi.addMenuItem(ContextMenuAction.UpdateFilters);
                    await ContextMenuApi.addSeparator();
                }
                if (!isOptionsPage) {
                    await ContextMenuApi.addMenuItem(ContextMenuAction.OpenSettings);
                }
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
     * Creates menu items for the context menu, displayed, when app filtering disabled globally.
     *
     * @param isOptionsPage Is current page options page.
     */
    private static async addFilteringDisabledMenuItems(isOptionsPage: boolean): Promise<void> {
        await ContextMenuApi.addMenuItem(ContextMenuAction.SiteProtectionDisabled);
        await ContextMenuApi.addSeparator();
        if (!__IS_MV3__) {
            await ContextMenuApi.addMenuItem(ContextMenuAction.OpenLog);
        }
        if (!isOptionsPage) {
            await ContextMenuApi.addMenuItem(ContextMenuAction.OpenSettings);
        }
        await ContextMenuApi.addMenuItem(ContextMenuAction.EnableProtection);
    }

    /**
     * Creates menu items for the context menu, displayed, when app filtering disabled for current tab.
     *
     * @param isOptionsPage Is current page options page.
     */
    private static async addUrlFilteringDisabledContextMenuAction(isOptionsPage: boolean): Promise<void> {
        // Disabled because it's just informational inactive button
        await ContextMenuApi.addMenuItem(ContextMenuAction.SiteFilteringDisabled, { enabled: false });
        await ContextMenuApi.addSeparator();
        if (!__IS_MV3__) {
            await ContextMenuApi.addMenuItem(ContextMenuAction.OpenLog);
        }
        if (!isOptionsPage) {
            await ContextMenuApi.addMenuItem(ContextMenuAction.OpenSettings);
        }
        if (!__IS_MV3__) {
            await ContextMenuApi.addMenuItem(ContextMenuAction.UpdateFilters);
        }
    }

    /**
     * Creates menu item for context menu.
     *
     * @param action Context menu action key.
     * @param options {@link browser.contextMenus.create} Options.
     */
    private static async addMenuItem(action: ContextMenuAction, options: AddMenuItemOptions = {}): Promise<void> {
        const { messageArgs, ...rest } = options;

        await createMenu({
            id: action,
            contexts: ['all'],
            title: translator.getMessage(action, messageArgs),
            ...rest,
        });
    }

    /**
     * Creates menu separator.
     */
    private static async addSeparator(): Promise<void> {
        await createMenu({
            id: nanoid(), // required for Firefox
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
