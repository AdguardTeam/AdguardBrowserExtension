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

import React, { useState, useRef } from 'react';

import cn from 'classnames';

import { Icon } from '../Icon';
import { translator } from '../../../../../common/translators/translator';
import { useOutsideClick } from '../../../hooks/useOutsideClick';

import styles from './MenuDropDown.module.pcss';

export const MenuDropDown = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const menuRef = useRef<HTMLDivElement | null>(null);

    useOutsideClick(menuRef, () => setIsOpen(false));

    return (
        <div className={cn(styles.dropdownContainer, className)} ref={menuRef}>
            <button
                type="button"
                className={styles.menuButton}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={translator.getMessage('options_filters_search_filter')}
                aria-expanded={isOpen}
            >
                <Icon
                    id="#more-vertical"
                    className="icon--24 icon--gray-default"
                    aria-hidden="true"
                />
            </button>

            {isOpen && (
                <div className={styles.dropdown} onClick={() => setIsOpen(false)}>
                    {children}
                </div>
            )}
        </div>
    );
};
