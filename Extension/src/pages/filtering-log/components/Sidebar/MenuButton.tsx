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

import cn from 'classnames';

import { Icon } from '../../../common/components/ui/Icon';

import styles from './Sidebar.module.pcss';

/**
 * Menu button component for sidebar actions.
 *
 * @param props Component props.
 * @param props.children Button text.
 * @param props.iconId Icon ID.
 * @param props.handler Click handler.
 * @param props.colorClass Optional color class.
 *
 * @returns Menu button component.
 */
export const MenuButton = ({
    children,
    iconId,
    handler,
    colorClass,
}: {
    children: string;
    iconId: string;
    handler: (e: React.MouseEvent) => void;
    colorClass?: string;
}) => {
    return (
        <button
            type="button"
            className={styles.pageActionItem}
            onClick={handler}
        >
            <Icon
                id={iconId}
                aria-hidden="true"
                className={cn('icon--24', colorClass)}
            />
            {children}
        </button>
    );
};
