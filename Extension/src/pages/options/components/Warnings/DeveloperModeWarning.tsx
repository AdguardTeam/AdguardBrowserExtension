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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { BrowserUtils } from '../../../../background/utils/browser-utils';
import { CHROME_EXTENSIONS_SETTINGS_URL } from '../../../../common/constants';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { logger } from '../../../../common/logger';
import { messenger } from '../../../services/messenger';
import { DEVELOPER_MODE_REQUIRED_URL } from '../../constants';
import { UserAgent } from '../../../../common/user-agent';
import { rootStore } from '../../stores/RootStore';

import './limit-warning.pcss';

/**
 * Minimum Chrome versions required for different toggles which enables usage of User Scripts API.
 *
 * User scripts API with needed 'execute' method is supported from Chrome 135 and higher.
 * But prior to 138 it can be enabled only via Developer mode toggle.
 * And for 138 and higher it can be enabled via User Scripts API toggle in the extensions details.
 *
 * @see https://developer.chrome.com/docs/extensions/reference/api/userScripts
 */
const MIN_CHROME_VERSION_REQUIRED = {
    /**
     * Minimum Chrome version where Developer mode should be enabled.
     *
     * @see https://developer.chrome.com/docs/extensions/reference/api/userScripts#chrome_versions_prior_to_138_developer_mode_toggle
     */
    DEV_MODE_TOGGLE: 135,
    /**
     * Minimum Chrome version where User Scripts API toggle should be enabled.
     *
     * @see https://developer.chrome.com/docs/extensions/reference/api/userScripts#chrome_versions_138_and_newer_allow_user_scripts_toggle
     */
    ALLOW_USER_SCRIPTS_TOGGLE: 138,
};

/**
 * Developer mode warning component.
 *
 * This warning is specifically needed to inform users that full functionality
 * of JavaScript rules requires developer mode to be enabled in the browser.
 * Without developer mode, certain advanced JS filtering capabilities will be
 * limited or unavailable.
 */
export const DeveloperModeWarning = observer(() => {
    const {
        settingsStore: {
            /**
             * Actually, this flag (inside the tswebextension library) checks
             * whether the User Scripts API with 'execute' method is supported.
             */
            isUserScriptsApiSupported: isUserScriptsApiEnabled,
        },
    } = useContext(rootStore);

    if (isUserScriptsApiEnabled) {
        logger.debug('[ext.DeveloperModeWarning]: User Scripts API is already enabled');
        return null;
    }

    if (!__IS_MV3__ || !UserAgent.isChromium) {
        logger.debug('[ext.DeveloperModeWarning]: User Scripts API supported only in MV3 Chromium-based browsers');
        return null;
    }

    const currentChromeVersion = Number(UserAgent.version);

    if (currentChromeVersion < MIN_CHROME_VERSION_REQUIRED.DEV_MODE_TOGGLE) {
        logger.debug(`[ext.DeveloperModeWarning]: User Scripts API is not supported in Chrome v${currentChromeVersion}`);
        return null;
    }

    const openChromeExtensionsSettings = async (e: React.MouseEvent) => {
        e.preventDefault();
        await messenger.openChromeExtensionsPage();
    };

    const openExtensionDetails = async (e: React.MouseEvent) => {
        e.preventDefault();
        await messenger.openExtensionDetailsPage();
    };

    /**
     * Returns an external link.
     *
     * @param text Link text.
     *
     * @returns Link element — `<a>` tag.
     */
    const getExternalLink = (text: string) => (
        <a
            href={DEVELOPER_MODE_REQUIRED_URL}
            target="_blank"
            rel="noopener noreferrer"
        >
            {text}
        </a>
    );

    /**
     * Returns a link to settings page where a toggle should be switched.
     *
     * Note: By design `chrome://` URLs are not linkable
     * so we need to open it via the API.
     *
     * @param text Link text.
     * @param href Link href.
     * @param onClickHandler Click handler.
     *
     * @returns Link element — `<a>` tag.
     */
    const getSettingsLink = (text: string, href: string, onClickHandler: (e: React.MouseEvent) => void) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClickHandler}
        >
            {text}
        </a>
    );

    const getWarningAboutDevModeToggle = () => {
        return reactTranslator.getMessage('options_developer_mode_required', {
            'settings-link': (text: string) => getSettingsLink(
                text,
                CHROME_EXTENSIONS_SETTINGS_URL,
                openChromeExtensionsSettings,
            ),
            'external-link': getExternalLink,
        });
    };

    const getWarningAboutAllowUserScriptsToggle = () => {
        return reactTranslator.getMessage('options_allow_user_scripts_required', {
            'settings-link': (text: string) => getSettingsLink(
                text,
                BrowserUtils.getExtensionDetailsUrl(),
                openExtensionDetails,
            ),
            'external-link': getExternalLink,
        });
    };

    const shouldEnableDevMode = currentChromeVersion < MIN_CHROME_VERSION_REQUIRED.ALLOW_USER_SCRIPTS_TOGGLE;

    const message = shouldEnableDevMode
        ? getWarningAboutDevModeToggle()
        : getWarningAboutAllowUserScriptsToggle();

    return (
        <div role="alert" className="limit-warning">
            <span>
                {message}
            </span>
        </div>
    );
});
