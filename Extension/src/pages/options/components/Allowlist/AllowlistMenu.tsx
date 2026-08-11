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

import React from 'react';

import { translator } from '../../../../common/translators/translator';
import { MenuDropDown } from '../../../common/components/ui/MenuDropDown';

import menuStyles from '../../../common/components/ui/MenuDropDown/MenuDropDown.module.pcss';

type AllowlistMenuProps = {
    /**
     * Click handler for the Import action (opens the file picker).
     */
    onImportClick: React.MouseEventHandler<HTMLButtonElement>;
    /**
     * Click handler for the Export action.
     */
    onExportClick: () => void;
    /**
     * Whether the Export action should be disabled (e.g. when the allowlist is empty).
     */
    exportDisabled: boolean;
};

/**
 * Header dropdown menu for the Allowlist screen. Provides Import and Export.
 * Rendered in the shared header so it is available alongside the allowlist
 * title. The import/export logic itself lives in the Allowlist page; this
 * component only renders the menu items and forwards clicks.
 *
 * @returns Dropdown menu element.
 */
export const AllowlistMenu = ({
    onImportClick,
    onExportClick,
    exportDisabled,
}: AllowlistMenuProps) => {
    return (
        <MenuDropDown ariaLabel={translator.getMessage('options_allowlist_menu')}>
            <button
                type="button"
                className={menuStyles.menuItem}
                role="menuitem"
                onClick={onImportClick}
            >
                {translator.getMessage('options_userfilter_import')}
            </button>
            <button
                type="button"
                className={menuStyles.menuItem}
                role="menuitem"
                onClick={onExportClick}
                disabled={exportDisabled}
            >
                {translator.getMessage('options_userfilter_export')}
            </button>
        </MenuDropDown>
    );
};
