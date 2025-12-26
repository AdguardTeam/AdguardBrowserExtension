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

import { translator } from '../../../../common/translators/translator';
import {
    ContextMenuAction,
    contextMenuEvents,
    settingsEvents,
} from '../../../events';
import { SettingOption } from '../../../schema';
import { SettingsApi } from '../../settings';
import { OPTIONS_PAGE } from '../../../../common/constants';
import { type FrameData } from '../frames';

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
export class ContextMenuApiCommon {
    /**
     * Context menu titles.
     */
    private static readonly MENU_TITLES = {
        [ContextMenuAction.SiteProtectionDisabled]: translator.getMessage('context_site_protection_disabled'),
        [ContextMenuAction.SiteFilteringDisabled]: translator.getMessage('context_site_filtering_disabled'),
        [ContextMenuAction.SiteException]: translator.getMessage('context_site_exception'),
        [ContextMenuAction.SiteFilteringOn]: translator.getMessage('context_site_filtering_on'),
        [ContextMenuAction.SiteFilteringOff]: translator.getMessage('context_site_filtering_off'),
        [ContextMenuAction.BlockSiteAds]: translator.getMessage('context_block_site_ads'),
        [ContextMenuAction.SecurityReport]: translator.getMessage('context_security_report'),
        [ContextMenuAction.ComplaintWebsite]: translator.getMessage('context_complaint_website'),
        [ContextMenuAction.UpdateFilters]: translator.getMessage('context_update_antibanner_filters'),
        [ContextMenuAction.OpenSettings]: translator.getMessage('context_open_settings'),
        [ContextMenuAction.OpenLog]: translator.getMessage('context_open_log'),
        [ContextMenuAction.DisableProtection]: translator.getMessage('context_disable_protection'),
        [ContextMenuAction.EnableProtection]: translator.getMessage('context_enable_protection'),
    };

    /**
     * Initializes Context Menu API.
     */
    public static init(): void {
        settingsEvents.addListener(
            SettingOption.DisableShowContextMenu,
            ContextMenuApiCommon.handleDisableShowContextMenu,
        );
        browser.contextMenus.onClicked.addListener(async (onClickData: browser.Menus.OnClickData) => {
            await contextMenuEvents.publishEvent(onClickData.menuItemId as ContextMenuAction);
        });
    }

    /**
     * Throttled updateMenu.
     * Used in because updateMenu can be called multiple times from various event listeners, but
     * context menu doesn't require fast update.
     */
    public throttledUpdateMenu: (frameData: FrameData) => void = throttle((frameData: FrameData) => {
        this.updateMenu(frameData);
    }, 100);

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
    private async updateMenu({
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
        await ContextMenuApiCommon.removeAll();

        // There is nothing to do if context menu is disabled
        if (SettingsApi.getSetting(SettingOption.DisableShowContextMenu)) {
            return;
        }

        // Used no to show settings menu item on the options page
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2258
        const isOptionsPage = !!(url?.startsWith(browser.runtime.getURL(OPTIONS_PAGE)));

        try {
            if (applicationFilteringDisabled) {
                await ContextMenuApiCommon.addFilteringDisabledMenuItems(isOptionsPage);
            } else if (urlFilteringDisabled) {
                await this.addUrlFilteringDisabledContextMenuAction(isOptionsPage);
            } else {
                if (documentAllowlisted && !userAllowlisted) {
                    await ContextMenuApiCommon.addMenuItem(ContextMenuAction.SiteException);
                } else if (canAddRemoveRule) {
                    if (documentAllowlisted) {
                        await ContextMenuApiCommon.addMenuItem(ContextMenuAction.SiteFilteringOn);
                    } else {
                        await ContextMenuApiCommon.addMenuItem(ContextMenuAction.SiteFilteringOff);
                    }
                }
                await ContextMenuApiCommon.addSeparator();

                if (!documentAllowlisted) {
                    await ContextMenuApiCommon.addMenuItem(ContextMenuAction.BlockSiteAds);
                }

                await ContextMenuApiCommon.addMenuItem(ContextMenuAction.SecurityReport);
                await ContextMenuApiCommon.addMenuItem(ContextMenuAction.ComplaintWebsite);
                await ContextMenuApiCommon.addSeparator();
                await this.addUpdateFiltersMenuItem(true);
                if (!isOptionsPage) {
                    await ContextMenuApiCommon.addMenuItem(ContextMenuAction.OpenSettings);
                }
                await ContextMenuApiCommon.addMenuItem(ContextMenuAction.OpenLog);
                await ContextMenuApiCommon.addMenuItem(ContextMenuAction.DisableProtection);
            }
        } catch (e) {
            // do nothing
        }
    }

    /**
     * Removes all context menu items.
     */
    private static async removeAll(): Promise<void> {
        await browser.contextMenus.removeAll();
    }

    /**
     * Adds "Update Filters" menu item if supported by manifest version.
     *
     * @param withSeparator Whether to add a separator after the menu item.
     */
    // eslint-disable-next-line
    protected async addUpdateFiltersMenuItem(withSeparator: boolean): Promise<void> {}

    /**
     * Creates menu items for the context menu, displayed, when app filtering disabled globally.
     *
     * @param isOptionsPage Is current page options page.
     */
    private static async addFilteringDisabledMenuItems(isOptionsPage: boolean): Promise<void> {
        await ContextMenuApiCommon.addMenuItem(ContextMenuAction.SiteProtectionDisabled);
        await ContextMenuApiCommon.addSeparator();

        await ContextMenuApiCommon.addMenuItem(ContextMenuAction.OpenLog);

        if (!isOptionsPage) {
            await ContextMenuApiCommon.addMenuItem(ContextMenuAction.OpenSettings);
        }

        await ContextMenuApiCommon.addMenuItem(ContextMenuAction.EnableProtection);
    }

    /**
     * Creates menu items for the context menu, displayed, when app filtering disabled for current tab.
     *
     * @param isOptionsPage Is current page options page.
     */
    private async addUrlFilteringDisabledContextMenuAction(isOptionsPage: boolean): Promise<void> {
        // Disabled because it's just informational inactive button
        await ContextMenuApiCommon.addMenuItem(ContextMenuAction.SiteFilteringDisabled, { enabled: false });
        await ContextMenuApiCommon.addSeparator();

        await ContextMenuApiCommon.addMenuItem(ContextMenuAction.OpenLog);

        if (!isOptionsPage) {
            await ContextMenuApiCommon.addMenuItem(ContextMenuAction.OpenSettings);
        }

        await this.addUpdateFiltersMenuItem(false);
    }

    /**
     * Creates menu item for context menu.
     *
     * @param action Context menu action key.
     * @param options {@link browser.contextMenus.create} Options.
     */
    protected static async addMenuItem(
        action: ContextMenuAction,
        options: Menus.CreateCreatePropertiesType = {},
    ): Promise<void> {
        await createMenu({
            id: action,
            contexts: ['all'],
            title: ContextMenuApiCommon.MENU_TITLES[action],
            ...options,
        });
    }

    /**
     * Creates menu separator.
     */
    protected static async addSeparator(): Promise<void> {
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
            await ContextMenuApiCommon.removeAll();
        }
    }
}
