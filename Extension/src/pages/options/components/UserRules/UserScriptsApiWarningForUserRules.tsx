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

import { shouldShowUserScriptsApiWarning } from '../../../../common/user-scripts-api';
import { useVisibilityCheck } from '../../../common/hooks/useVisibilityCheck';
import { rootStore } from '../../stores/RootStore';
import { UserScriptsApiRequiredMessage } from '../Warnings';

/**
 * User scripts API warning component for User rules section.
 *
 * This warning is specifically needed to inform users that full functionality
 * of JavaScript rules requires user scripts API to be enabled in the browser.
 * Without user scripts API granted, certain advanced JS filtering capabilities will be
 * limited or unavailable.
 */
export const UserScriptsApiWarningForUserRules = observer(() => {
    const { settingsStore: { currentChromeVersion } } = useContext(rootStore);

    const showWarning = useVisibilityCheck(shouldShowUserScriptsApiWarning);

    if (!showWarning || !currentChromeVersion) {
        return null;
    }

    return (
        <div role="alert" className="warning section-warning">
            <span>
                <UserScriptsApiRequiredMessage />
            </span>
        </div>
    );
});
