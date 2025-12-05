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

import { type BlockingPageInitAppData } from '../../../src/background/services';
import { ForwardFrom } from '../../../src/common/forward';
import { logger } from '../../../src/common/logger';
import { messenger } from '../../../src/pages/services/messenger';
import {
    addGoBackButtonListener,
    getElementById,
    getParams,
    updatePlaceholder,
    updateTheme,
} from '../helpers';

/**
 * Id of the current host placeholder.
 */
const PLACEHOLDER_HOST_ID = 'adgSafebrowsingHost';

/**
 * Id of the "Proceed Anyway" button.
 */
const SAFEBROWSING_PROCEED_BTN_ID = 'adblockerSafebrowsingProceed';

/**
 * Id of the "marked as unsafe" link.
 */
const SAFEBROWSING_UNSAFE_LINK_ID = 'adgSafebrowsingUnsafeLink';

/**
 * Id of the "Go Back" button.
 */
const SAFEBROWSING_GO_BACK_BTN_ID = 'safebrowsingPageBackBtn';

/**
 * Adds listener to handle "Proceed Anyway" button click.
 */
const addProceedAnywayListener = (url: string): void => {
    const proceedAnywayBtn = getElementById(SAFEBROWSING_PROCEED_BTN_ID);

    proceedAnywayBtn.addEventListener('click', (e: Event) => {
        e.preventDefault();

        messenger.openSafebrowsingTrusted(url);
    });
};

/**
 * Adds listener to handle "marked as unsafe" link click.
 *
 * @param url URL to check.
 *
 * @throws Error if element with id {@link SAFEBROWSING_UNSAFE_LINK_ID} is not found.
 */
const addCheckWebsiteSecurityListener = (url: string): void => {
    const checkReportElement = getElementById(SAFEBROWSING_UNSAFE_LINK_ID);

    checkReportElement.addEventListener('click', async (e: Event) => {
        e.preventDefault();
        messenger.checkSiteSecurity(url, ForwardFrom.Safebrowsing);
    });
};

// TODO: improve "let us know" link handling — extension settings can be added as query params
// so most of the fields in so-called 'report web app' can be pre-filled for users

/**
 * Runs the initialization of the safebrowsing page handler:
 * - updates theme on the page;
 * - updates placeholder with the host;
 * - adds listener to handle "Proceed Anyway" button click;
 * - adds listener to handle "marked as unsafe" link click;
 * - adds listener to handle "Go Back" button click (if needed).
 *
 * @param data Data to run the initialization.
 * @param data.response Data to initialize the page.
 * @param data.url URL of blocked page.
 */
const runInit = ({
    response,
    url,
}: {
    response: BlockingPageInitAppData;
    url: string;
}): void => {
    const { theme } = response;

    updateTheme(theme);
    updatePlaceholder(PLACEHOLDER_HOST_ID, new URL(url).host);
    addProceedAnywayListener(url);
    addCheckWebsiteSecurityListener(url);
    addGoBackButtonListener(SAFEBROWSING_GO_BACK_BTN_ID);
};

/**
 * Initializes the safebrowsing page handler.
 */
export const initSafebrowsingPageHandler = async (): Promise<void> => {
    const { url } = getParams(window.location.search);

    if (!url) {
        logger.error(`[ext.page-handler]: cannot parse "url" param in page url: ${window.location.href}`);
        return;
    }

    const response = await messenger.initializeBlockingPageScript();

    if (document.readyState === 'loading') {
        const listener = () => {
            runInit({ response, url });
            document.removeEventListener('DOMContentLoaded', listener);
        };

        document.addEventListener('DOMContentLoaded', listener);
    } else {
        runInit({ response, url });
    }
};
