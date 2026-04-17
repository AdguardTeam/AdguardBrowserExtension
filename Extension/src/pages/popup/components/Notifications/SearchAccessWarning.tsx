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

import browser from 'webextension-polyfill';

import { translator } from '../../../../common/translators/translator';
import { NotificationType } from '../../../common/types';
import { popupStore } from '../../stores/PopupStore';
import { OPERA_EXTENSIONS_SETTINGS_URL } from '../../../../common/constants';

import { Notification } from './Notification';

/**
 * Component that displays a warning when Opera's "Allow access to search page results"
 * permission is not granted.
 */
export const SearchAccessWarning = observer((): React.ReactElement | null => {
    const store = useContext(popupStore);

    if (!store.showSearchAccessWarning) {
        return null;
    }

    const handleGoToSettings = (): void => {
        const url = new URL(OPERA_EXTENSIONS_SETTINGS_URL);
        url.searchParams.set('id', browser.runtime.id);

        browser.tabs.create({ url: url.toString() });
    };

    const handleDontShowAgain = (): void => {
        store.dismissSearchAccessWarning();
    };

    return (
        <Notification
            type={NotificationType.Error}
            text={translator.getMessage('opera_search_permission_warning')}
            buttons={[
                {
                    title: translator.getMessage('opera_search_permission_go_to_settings'),
                    onClick: handleGoToSettings,
                },
                {
                    title: translator.getMessage('opera_search_permission_dont_show'),
                    onClick: handleDontShowAgain,
                },
            ]}
            closeManually
        />
    );
});
