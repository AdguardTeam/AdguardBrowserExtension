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

import { logger } from '../../../src/common/logger';
import { messenger } from '../../../src/pages/services/messenger';
import { getParams } from '../get-params';

const handleProceedAnyway = () => {
    const proceedAnywayBtn = document.getElementById('adblockerSafebrowsingProceed');

    if (!proceedAnywayBtn) {
        logger.debug('adblockerSafebrowsingProceed button not found');
        return;
    }

    proceedAnywayBtn.addEventListener('click', (e: Event) => {
        e.preventDefault();

        const { url } = getParams(window.location.search);

        if (!url) {
            logger.error(`Cannot parse "url" param in page url: ${window.location.href}`);
            return;
        }

        messenger.openSafebrowsingTrusted(url);
    });
};

export const initProceedAnywayHandler = async () => {
    if (document.readyState === 'loading') {
        const listener = () => {
            handleProceedAnyway();
            document.removeEventListener('DOMContentLoaded', listener);
        };

        document.addEventListener('DOMContentLoaded', listener);
    } else {
        handleProceedAnyway();
    }
};
