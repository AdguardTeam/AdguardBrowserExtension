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

import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { DEVELOPER_MODE_REQUIRED_URL } from '../../constants';
import { PagesApi } from '../../../../background/api';
import { UserAgent } from '../../../../common/user-agent';
import { rootStore } from '../../stores/RootStore';

import './limit-warning.pcss';

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
            // Actually, this flag inside library check if developer mode is enabled and
            // user scripts API with 'execute' method is supported.
            isUserScriptsApiSupported: isUserScriptsApiEnabled,
        },
    } = useContext(rootStore);

    // User scripts API with needed 'execute' method is supported from Chrome 135 and higher.
    const isSuitableChromeVersion = UserAgent.isChromium && Number(UserAgent.version) >= 135;

    if (!__IS_MV3__ || !isSuitableChromeVersion || isUserScriptsApiEnabled) {
        return null;
    }

    const openChromeExtensionsSettings = async (e: React.MouseEvent) => {
        e.preventDefault();
        await PagesApi.openChromeExtensionsSettingsPage();
    };

    const message = reactTranslator.getMessage('options_developer_mode_required', {
        'settings-link': (text: string) => (
            <a
                // Note: Chrome will prevent opening the settings page via href,
                // so we need to open it via the API.
                href={PagesApi.chromeExtensionsSettingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={openChromeExtensionsSettings}
            >
                {text}
            </a>
        ),
        'external-link': (text: string) => (
            <a
                href={DEVELOPER_MODE_REQUIRED_URL}
                target="_blank"
                rel="noopener noreferrer"
            >
                {text}
            </a>
        ),
    });

    return (
        <div role="alert" className="limit-warning">
            <span>
                {message}
            </span>
        </div>
    );
});
