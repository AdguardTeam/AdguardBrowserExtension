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

import { USER_SCRIPTS_API_REQUIRED_URL } from '../../../constants';
import { messenger } from '../../../../services/messenger';
import { rootStore } from '../../../stores/RootStore';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import {
    CHROME_EXTENSIONS_SETTINGS_URL,
    USER_SCRIPTS_API_MIN_CHROME_VERSION_REQUIRED,
} from '../../../../../common/constants';
import { BrowserUtils } from '../../../../../background/utils';

export const UserScriptsApiWarningOutsideCustomGroup = observer(() => {
    const { settingsStore: { currentChromeVersion } } = useContext(rootStore);

    if (!currentChromeVersion) {
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
        return reactTranslator.getMessage('options_custom_group_developer_mode_required', {
            'external-link': getExternalLink,
            b: (text: string) => <b>{text}</b>,
            'settings-link': (text: string) => getSettingsLink(
                text,
                CHROME_EXTENSIONS_SETTINGS_URL,
                openChromeExtensionsSettings,
            ),
        });
    };

    const getWarningAboutAllowUserScriptsToggle = () => {
        return reactTranslator.getMessage('options_custom_group_allow_user_scripts_required', {
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

    return (
        <span className="warning custom-group-warning">
            {message}
        </span>
    );
});
