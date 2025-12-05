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

import { getErrorMessage } from '@adguard/logger';

type OptionalPermission = browser.Manifest.OptionalPermission;

/**
 * This class manages browser permissions. It can be called as from background page as from other
 * pages: e.g. options, popup.
 */
export class Permissions implements Permissions {
    /**
     * Checks if browser has permissions.
     *
     * @param permissions Array of permissions.
     *
     * @returns True if browser has all permissions, otherwise false.
     *
     * @throws Error if failed to check permissions
     */
    static async hasPermissions(permissions: OptionalPermission[]): Promise<boolean> {
        const permissionsRequest = {
            permissions,
        };

        try {
            return await browser.permissions.contains(permissionsRequest);
        } catch (e) {
            const errorMessage = getErrorMessage(e);
            throw new Error(`Was not able to check if browser contains permissions: "${permissions.join(', ')}", error: "${errorMessage}"`);
        }
    }

    /**
     * Requests permissions from user.
     *
     * @param permissions Array of permissions.
     *
     * @returns True if permissions were granted, otherwise false.
     *
     * @throws Error if failed to request permissions, due to browser error or user
     */
    static async addPermissions(permissions: OptionalPermission[]): Promise<boolean> {
        const permissionsRequest = {
            permissions,
        };

        try {
            return await browser.permissions.request(permissionsRequest);
        } catch (e) {
            const errorMessage = getErrorMessage(e);
            throw new Error(`Was not able to add permissions: "${permissions.join(', ')}", error: "${errorMessage}"`);
        }
    }

    /**
     * Requests "privacy" permission.
     *
     * @returns True if permission was granted.
     */
    static async addPrivacy(): Promise<boolean> {
        return Permissions.addPermissions(['privacy']);
    }

    /**
     * Checks if privacy permission was granted by user.
     *
     * @returns True if extension already has privacy permission.
     */
    static async hasPrivacy(): Promise<boolean> {
        return Permissions.hasPermissions(['privacy']);
    }

    /**
     * Checks if clipboard permissions were granted by user.
     *
     * @returns True if extension already has both clipboardRead and clipboardWrite permissions.
     */
    static async hasClipboardPermissions(): Promise<boolean> {
        return Permissions.hasPermissions(['clipboardRead', 'clipboardWrite']);
    }

    /**
     * Requests clipboard permissions (clipboardRead and clipboardWrite).
     *
     * @returns True if permissions were granted.
     */
    static async addClipboardPermissions(): Promise<boolean> {
        return Permissions.addPermissions(['clipboardRead', 'clipboardWrite']);
    }
}
