/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

import Nanobar from 'nanobar';

import { contentPage } from '../content-script/content-script';
import { MESSAGE_TYPES } from '../common/constants';

import '../common/i18n'; // !!! DO NOT REMOVE, THIS MODULE HANDLES TRANSLATIONS

export const init = () => {
    document.addEventListener('DOMContentLoaded', () => {
        const nanobar = new Nanobar({
            classname: 'adg-progress-bar',
        });

        nanobar.go(15);

        function onLoaded() {
            nanobar.go(100);
            setTimeout(() => {
                if (window) {
                    contentPage.sendMessage({ type: MESSAGE_TYPES.OPEN_THANKYOU_PAGE });
                }
            }, 1000);
        }

        async function checkRequestFilterReady() {
            const response = await contentPage.sendMessage({ type: MESSAGE_TYPES.CHECK_REQUEST_FILTER_READY });
            if (response.ready) {
                onLoaded();
            } else {
                setTimeout(checkRequestFilterReady, 500);
            }
        }

        checkRequestFilterReady();
    });
};

export const filterDownload = {
    init,
};
