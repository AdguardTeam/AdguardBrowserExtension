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

import { type PageInitAppData } from '../../../src/background/services';
import { messenger } from '../../../src/pages/services/messenger';
import { getParams } from '../get-params';
import { logger } from '../../../src/common/logger';
import { getFilterName } from '../../../src/pages/helpers';

const PROCEED_ANYWAY_BTN_ID = 'adgAccessBlockedProceed';

const PLACEHOLDER_URL_ID = 'adgAccessBlockedUrl';
const PLACEHOLDER_FILTER_ID = 'adgAccessBlockingFilterName';
const PLACEHOLDER_RULE_ID = 'adgAccessBlockingRule';

// FIXME (Slava): add jsdoc
const updateTheme = (theme: string) => {
    // @ts-ignore
    window.themeManager.switchTheme(theme);
};

// FIXME (Slava): add jsdoc
const updatePlaceholder = (elementId: string, text: string) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
};

// FIXME (Slava): add jsdoc
const updatePlaceholders = (url: string, filterName: string, rule: string) => {
    updatePlaceholder(PLACEHOLDER_URL_ID, url);
    updatePlaceholder(PLACEHOLDER_FILTER_ID, filterName);
    updatePlaceholder(PLACEHOLDER_RULE_ID, rule);
};

// FIXME (Slava): add jsdoc
const handleProceedAnyway = (url: string): void => {
    const proceedAnywayBtn = document.getElementById(PROCEED_ANYWAY_BTN_ID);

    if (!proceedAnywayBtn) {
        logger.debug(`${PROCEED_ANYWAY_BTN_ID} button not found`);
        return;
    }

    proceedAnywayBtn.addEventListener('click', (e: Event) => {
        e.preventDefault();

        messenger.addUrlToTrusted(url);
    });
};

// FIXME (Slava): add jsdoc
function PageController(response: PageInitAppData) {
    const {
        filtersMetadata,
        environmentOptions,
    } = response;

    const { url, filterId, rule } = getParams(window.location.search);

    if (!url) {
        logger.error(`Cannot parse "url" param in page url: ${window.location.href}`);
        return null;
    }
    if (!filterId) {
        logger.error(`Cannot parse "filterId" param in page url: ${window.location.href}`);
        return null;
    }
    if (!rule) {
        logger.error(`Cannot parse "rule" param in page url: ${window.location.href}`);
        return null;
    }

    let filterName = getFilterName(Number(filterId), filtersMetadata);
    if (!filterName) {
        logger.debug(`Cannot get filter name for filterId "${filterId}", filterId will be displayed instead`);
        filterName = filterId;
    }

    return {
        init: () => {
            updateTheme(environmentOptions.theme);
            handleProceedAnyway(url);
            updatePlaceholders(url, filterName, rule);
        },
    };
}

let timeoutId: number;
let counter = 0;
const MAX_WAIT_RETRY = 10;
const RETRY_TIMEOUT_MS = 100;

// FIXME (Slava): add jsdoc
export const initBlockerPageHandler = async () => {
    if (typeof messenger === 'undefined') {
        if (counter > MAX_WAIT_RETRY) {
            window.clearTimeout(timeoutId);
            return;
        }
        timeoutId = window.setTimeout(initBlockerPageHandler, RETRY_TIMEOUT_MS);
        counter += 1;
        return;
    }

    window.clearTimeout(timeoutId);

    const response = await messenger.initializeFrameScript();
    const controller = PageController(response);

    if (!controller) {
        return;
    }

    if (document.readyState === 'loading') {
        const listener = () => {
            controller.init();
            document.removeEventListener('DOMContentLoaded', listener);
        };

        document.addEventListener('DOMContentLoaded', listener);
    } else {
        controller.init();
    }
};
