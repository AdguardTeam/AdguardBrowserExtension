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
import { MessageType } from '../common/messages';
import { Permissions } from '../common/permissions';

import { messenger } from './services/messenger';

/**
 * This page is used to request permissions by user action to bypass CORS restrictions.
 *
 * @see https://discourse.mozilla.org/t/can-not-use-cross-origin-requests-from-an-mv3-addon-background-script-on-nightly-v102/97603
 */
export class PermissionsPage {
    /**
     * Id of the grant button.
     */
    private static readonly GRANT_BUTTON_ID = 'grant';

    /**
     * Add event listener to grant button on page load.
     */
    public static init(): void {
        window.addEventListener('load', () => {
            const button = document.querySelector(`#${PermissionsPage.GRANT_BUTTON_ID}`);

            if (!button) {
                throw new Error(`Button with id ${PermissionsPage.GRANT_BUTTON_ID} not found`);
            }

            // TODO: check grant before adding listener
            button.addEventListener('click', PermissionsPage.handleGrantRequest, { once: true });
        });
    }

    /**
     * Handles click on the grant button.
     *
     * If granted, sends {@link MessageType.PermissionsGranted} message to the background script.
     * Otherwise, throws an error.
     */
    private static async handleGrantRequest(): Promise<void> {
        const isGranted = await Permissions.addHostPermission();

        if (isGranted) {
            await messenger.sendMessage(MessageType.PermissionsGranted);
            window.close();
        } else {
            throw new Error('Permission is not granted');
        }
    }
}
