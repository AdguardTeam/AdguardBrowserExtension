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
import { messenger } from '../../../src/pages/services/messenger';
import { logger } from '../../../src/common/logger';
import { getFilterName } from '../../../src/pages/helpers';
import {
    addGoBackButtonListener,
    getElementById,
    getParams,
    updatePlaceholder,
} from '../helpers';

import { toggleLoader } from './loader';

/**
 * Id of the "Proceed Anyway" button.
 */
const BLOCKED_PROCEED_ANYWAY_BTN_ID = 'adgAccessBlockedProceed';

/**
 * Id of the "Go Back" button.
 */
const BLOCKED_GO_BACK_BTN_ID = 'blockedPageBackBtn';

/**
 * Id of the "Add this site to Allowlist" button.
 */
const ADD_TO_ALLOWLIST_BTN_ID = 'adgAccessAllowToWhiteList';

/**
 * Id of the current host placeholder.
 */
const PLACEHOLDER_HOST_ID = 'adgAccessBlockedHost';

/**
 * Id of the "URL" placeholder.
 */
const PLACEHOLDER_URL_ID = 'adgAccessBlockedUrl';

/**
 * Id of the "Filter" placeholder to display filter name.
 */
const PLACEHOLDER_FILTER_ID = 'adgAccessBlockingFilterName';

/**
 * Id of the "Rule" placeholder.
 */
const PLACEHOLDER_RULE_ID = 'adgAccessBlockingRule';

/**
 * Updates the theme of the page.
 *
 * @param theme The theme to set.
 */
const updateTheme = (theme: string): void => {
    // @ts-ignore
    window.themeManager.switchTheme(theme);
};

/**
 * Data to set in the placeholders on the page.
 */
type PlaceholdersData = {
    /**
     * URL to set in the placeholder.
     */
    url: string;

    /**
     * Filter name to set in the placeholder.
     */
    filterName: string;

    /**
     * Rule to set in the placeholder.
     */
    rule: string;
};

/**
 * Updates the placeholders of the page.
 *
 * @param data Data to set in the placeholders.
 * @param data.url URL to set in the placeholder.
 * @param data.filterName Filter name to set in the placeholder.
 * @param data.rule Rule to set in the placeholder.
 */
const updatePlaceholders = ({ url, filterName, rule }: PlaceholdersData): void => {
    updatePlaceholder(PLACEHOLDER_HOST_ID, new URL(url).host);
    updatePlaceholder(PLACEHOLDER_URL_ID, url);
    updatePlaceholder(PLACEHOLDER_FILTER_ID, filterName);
    updatePlaceholder(PLACEHOLDER_RULE_ID, rule);
};

/**
 * Adds listener to handle "Proceed Anyway" button click.
 *
 * @param url URL to add to trusted.
 */
const addProceedAnywayListener = async (url: string): Promise<void> => {
    const proceedAnywayBtn = getElementById(BLOCKED_PROCEED_ANYWAY_BTN_ID);

    proceedAnywayBtn.addEventListener('click', async (e: Event) => {
        e.preventDefault();

        // Show the loader while waiting for the response in MV3
        toggleLoader(__IS_MV3__);

        try {
            await messenger.addUrlToTrusted(url);
            // Redirect to the trusted URL after successful response
            window.location.href = url;
        } catch (error) {
            logger.info('[ext.page-handler]: Error adding URL to trusted:', error);
        }
    });
};

/**
 * Adds listener to handle "Add this site to allowlist" button click.
 *
 * Handles adding a domain (based on `url`) to the allowlist and proceeding to the page by `url`.
 *
 * @param url URL of blocked request.
 */
const addAddToAllowlistListener = async (url: string): Promise<void> => {
    const addToAllowlistBtn = getElementById(ADD_TO_ALLOWLIST_BTN_ID);

    addToAllowlistBtn.addEventListener('click', async (e: Event) => {
        e.preventDefault();

        // Show the loader while waiting for the response in MV3
        toggleLoader(__IS_MV3__);

        try {
            await messenger.addAllowlistDomainForUrl(url);
            window.location.href = url;
        } catch (error) {
            logger.info('[ext.page-handler]: Error adding domain to allowlist:', error);
        }
    });
};

/**
 * Runs the initialization of the blocked page handler:
 * - updates theme on the page;
 * - updates placeholders for url, filter name and rule;
 * - adds listener to handle "Proceed Anyway" button click;
 * - adds listener to handle "Go Back" button click (if needed).
 *
 * @param data Data to run the initialization.
 * @param data.response Data to initialize the page.
 * @param data.url URL of blocked page.
 * @param data.filterId Filter id of the rule that blocked the page.
 * @param data.rule Rule that blocked the page.
 */
const runInit = ({
    response,
    url,
    filterId,
    rule,
}: {
    response: BlockingPageInitAppData;
    url: string;
    filterId: string;
    rule: string;
}): void => {
    const { filtersMetadata, theme } = response;

    let filterName = getFilterName(Number(filterId), filtersMetadata);
    if (!filterName) {
        logger.debug(`[ext.page-handler]: cannot get filter name for filterId "${filterId}", filterId will be displayed instead.`);
        filterName = filterId;
    }

    updateTheme(theme);
    updatePlaceholders({ url, filterName, rule });
    addProceedAnywayListener(url);
    addAddToAllowlistListener(url);
    addGoBackButtonListener(BLOCKED_GO_BACK_BTN_ID);
};

/**
 * Initializes the blocked by rules page handler.
 */
export const initBlockedPageHandler = async (): Promise<void> => {
    const { url, filterId, rule } = getParams(window.location.search);

    if (!url) {
        logger.error(`[ext.page-handler]: cannot parse "url" param in page url: ${window.location.href}`);
        return;
    }
    if (!filterId) {
        logger.error(`[ext.page-handler]: cannot parse "filterId" param in page url: ${window.location.href}`);
        return;
    }
    if (!rule) {
        logger.error(`[ext.page-handler]: cannot parse "rule" param in page url: ${window.location.href}`);
        return;
    }

    const response = await messenger.initializeBlockingPageScript();

    if (document.readyState === 'loading') {
        const listener = () => {
            runInit({
                response,
                url,
                filterId,
                rule,
            });
            document.removeEventListener('DOMContentLoaded', listener);
        };

        document.addEventListener('DOMContentLoaded', listener);
    } else {
        runInit({
            response,
            url,
            filterId,
            rule,
        });
    }
};
