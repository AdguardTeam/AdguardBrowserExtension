/* eslint-disable max-len */
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

import { getErrorMessage } from './error';

/**
 * This class manages browser permissions. It can be called as from background page as from other
 * pages: e.g. options, popup.
 */
export class Permissions implements Permissions {
    /**
     * Privacy permission request.
     */
    private static readonly PRIVACY_PERMISSIONS: browser.Permissions.Permissions = {
        permissions: ['privacy'],
    };

    /**
     * Host permission request.
     * Used to bypass CORS restrictions in Firefox.
     *
     * @see https://discourse.mozilla.org/t/can-not-use-cross-origin-requests-from-an-mv3-addon-background-script-on-nightly-v102/97603
     */
    private static readonly HOST_PERMISSIONS: browser.Permissions.Permissions = {
        origins: ['<all_urls>'],
    };

    /**
     * Requests "privacy" permission.
     *
     * @returns True if permission was granted.
     */
    public static async addPrivacy(): Promise<boolean> {
        return Permissions.addPermission(Permissions.PRIVACY_PERMISSIONS);
    }

    /**
     * Requests host permission.
     * Used to bypass CORS restrictions in Firefox.
     *
     * @see https://discourse.mozilla.org/t/can-not-use-cross-origin-requests-from-an-mv3-addon-background-script-on-nightly-v102/97603
     *
     * @returns True if permission was granted.
     */
    public static async addHostPermission(): Promise<boolean> {
        return Permissions.addPermission(Permissions.HOST_PERMISSIONS);
    }

    /**
     * Checks if host permission was granted by user.
     *
     * @returns True if extension already has host permission.
     */
    public static async hasHostPermission(): Promise<boolean> {
        return Permissions.hasPermission(Permissions.HOST_PERMISSIONS);
    }

    /**
     * Checks if privacy permission was granted by user.
     *
     * @returns True if extension already has privacy permission.
     */
    public static async hasPrivacy(): Promise<boolean> {
        return Permissions.hasPermission(Permissions.PRIVACY_PERMISSIONS);
    }

    /**
     * Checks if browser has permissions.
     *
     * @param permissions Permissions request.
     * @returns Boolean flag
     * @throws Error failed to check
     */
    private static async hasPermission(permissions: browser.Permissions.AnyPermissions): Promise<boolean> {
        try {
            return await browser.permissions.contains(permissions);
        } catch (e) {
            const errorMessage = getErrorMessage(e);
            throw new Error(
                `Was not able to check if browser contains permission: "${permissions}", error: "${errorMessage}"`,
            );
        }
    }

    /**
     * Requests permissions from user.
     *
     * @param permissions Permissions request.
     *
     * @returns True if permission granted, otherwise false.
     * @throws Error if failed to request permission, due to browser error or user
     */
    private static async addPermission(permissions: browser.Permissions.Permissions): Promise<boolean> {
        try {
            return await browser.permissions.request(permissions);
        } catch (e) {
            const errorMessage = getErrorMessage(e);
            throw new Error(`Was not able to add permission: "${permissions}", error: "${errorMessage}"`);
        }
    }
}
