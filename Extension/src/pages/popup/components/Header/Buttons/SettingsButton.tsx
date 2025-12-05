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

import React from 'react';

import { translator } from '../../../../../common/translators/translator';
import { Icon } from '../../../../common/components/ui/Icon';
import { messenger } from '../../../../services/messenger';

export const SettingsButton = () => {
    const handleSettingsClick = (event: React.MouseEvent | React.KeyboardEvent) => {
        event.preventDefault();
        messenger.openSettingsTab();
        window.close();
    };

    return (
        <button
            className="button popup-header__button"
            type="button"
            onClick={handleSettingsClick}
            title={translator.getMessage('popup_open_settings')}
        >
            <Icon
                id="#settings"
                className="icon--24 icon--header"
                aria-hidden="true"
            />
        </button>
    );
};
