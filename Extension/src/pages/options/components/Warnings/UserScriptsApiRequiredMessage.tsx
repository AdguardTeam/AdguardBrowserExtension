/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { BrowserUtils } from '../../../../background/utils/browser-utils';
import { USER_SCRIPTS_API_MIN_CHROME_VERSION_REQUIRED } from '../../../../common/constants';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { messenger } from '../../../services/messenger';
import { USER_SCRIPTS_API_REQUIRED_URL } from '../../constants';
import { rootStore } from '../../stores/RootStore';

/**
 * Props of {@link UserScriptsApiRequiredMessage}.
 */
type UserScriptsApiRequiredMessageProps = {
    /**
     * Translation key of the message shown when Developer mode should be
     * enabled. Defaults to the User rules message.
     */
    devModeMessageKey?: string;

    /**
     * Translation key of the message shown when the "Allow User Scripts"
     * toggle should be enabled. Defaults to the User rules message.
     */
    allowUserScriptsMessageKey?: string;
};

/**
 * Localized message explaining how to grant the user scripts permission
 * to the extension: via Developer mode on older Chrome versions or via
 * the "Allow User Scripts" toggle on Chrome 138 and newer.
 *
 * The message contains links to the browser settings and details pages and
 * to the knowledge base article. Renders nothing when the browser version is
 * unknown. Callers own the wrapper element.
 *
 * @param props Component props.
 * @param props.devModeMessageKey Translation key of the Developer mode message.
 * @param props.allowUserScriptsMessageKey Translation key of the "Allow User Scripts" message.
 *
 * @returns The user scripts API required message or null.
 */
export const UserScriptsApiRequiredMessage = observer(({
    devModeMessageKey = 'options_developer_mode_required',
    allowUserScriptsMessageKey = 'options_allow_user_scripts_required',
}: UserScriptsApiRequiredMessageProps) => {
    const { settingsStore: { currentChromeVersion } } = useContext(rootStore);

    if (!currentChromeVersion) {
        return null;
    }

    const openExtensionsSettings = async (e: React.MouseEvent) => {
        e.preventDefault();
        await messenger.openExtensionsSettingsPage();
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
            href={USER_SCRIPTS_API_REQUIRED_URL}
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
        return reactTranslator.getMessage(devModeMessageKey, {
            'external-link': getExternalLink,
            b: (text: string) => <b>{text}</b>,
            'settings-link': (text: string) => getSettingsLink(
                text,
                BrowserUtils.getExtensionsSettingsUrl(),
                openExtensionsSettings,
            ),
        });
    };

    const getWarningAboutAllowUserScriptsToggle = () => {
        return reactTranslator.getMessage(allowUserScriptsMessageKey, {
            'external-link': getExternalLink,
            b: (text: string) => <b>{text}</b>,
            'settings-link': (text: string) => getSettingsLink(
                text,
                BrowserUtils.getExtensionDetailsUrl(),
                openExtensionDetails,
            ),
        });
    };

    // eslint-disable-next-line max-len
    const shouldEnableDevMode = currentChromeVersion < USER_SCRIPTS_API_MIN_CHROME_VERSION_REQUIRED.ALLOW_USER_SCRIPTS_TOGGLE;

    const message = shouldEnableDevMode
        ? getWarningAboutDevModeToggle()
        : getWarningAboutAllowUserScriptsToggle();

    // The message is rendered without a wrapper element: callers own it.
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{message}</>;
});
