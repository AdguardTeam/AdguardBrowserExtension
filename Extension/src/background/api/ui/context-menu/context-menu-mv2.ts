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

import { ContextMenuAction } from '../../../events';

import { ContextMenuApiCommon } from './context-menu-common';

/**
 * API for creating and updating browser context menus.
 */
export class ContextMenuApi extends ContextMenuApiCommon {
    /**
     * Adds manifest specific menu items.
     */
    protected static async addManifestSpecificMenuItems(): Promise<void> {
        await ContextMenuApiCommon.addMenuItem(ContextMenuAction.UpdateFilters);
        await ContextMenuApiCommon.addSeparator();
    }

    /**
     * Creates menu items for the context menu, displayed, when app filtering disabled globally.
     *
     * @param isOptionsPage Is current page options page.
     */
    protected static async addFilteringDisabledMenuItems(isOptionsPage: boolean): Promise<void> {
        await super.addFilteringDisabledMenuItems(isOptionsPage);

        await ContextMenuApi.addMenuItem(ContextMenuAction.OpenLog);

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
    protected static async addUrlFilteringDisabledContextMenuAction(isOptionsPage: boolean): Promise<void> {
        await super.addUrlFilteringDisabledContextMenuAction(isOptionsPage);

        await ContextMenuApi.addMenuItem(ContextMenuAction.OpenLog);

        if (!isOptionsPage) {
            await ContextMenuApi.addMenuItem(ContextMenuAction.OpenSettings);
        }

        await ContextMenuApi.addMenuItem(ContextMenuAction.UpdateFilters);
    }
}
