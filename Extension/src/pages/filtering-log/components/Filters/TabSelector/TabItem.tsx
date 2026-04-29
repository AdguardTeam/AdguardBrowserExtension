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

import { Icon } from '../../../../common/components/ui/Icon';

import styles from './tab-selector-mobile.module.pcss';

/**
 * Tab item component for mobile tab selector.
 *
 * @param props Component props.
 * @param props.title Tab title.
 * @param props.tabId Tab identifier.
 * @param props.isActive Whether tab is active.
 * @param props.onSelect Click handler.
 *
 * @returns Tab item component.
 */
export const TabItem = ({
    title,
    tabId,
    isActive,
    onSelect,
}: {
    title: string;
    tabId: number;
    isActive: boolean;
    onSelect: (tabId: number) => void;
}) => (
    <button
        type="button"
        className={cn(styles.tabItem, isActive && styles.tabItemActive)}
        onClick={() => onSelect(tabId)}
    >
        <span className={styles.tabItemText}>{title}</span>
        {isActive && (
            <Icon
                id="#tick"
                className="icon icon--24 icon--green-default"
                aria-hidden="true"
            />
        )}
    </button>
);
