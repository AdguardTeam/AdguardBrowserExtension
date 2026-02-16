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
import { type SingleLogFilter } from '../../stores/LogStore';

import styles from './customizeModal.module.pcss';

/**
 * Tag component for filter list.
 *
 * @param props Component props.
 * @param props.groupName Group name for the tag.
 * @param props.tag Tag data.
 * @param props.handleChange Change handler.
 *
 * @returns Tag component.
 */
export const Tag = ({
    groupName,
    tag,
    handleChange,
}: {
    groupName: string;
    tag: SingleLogFilter;
    handleChange: (tagId: string) => void;
}) => {
    return (
        <div className={cn('checkbox-wrapper', styles.tag)}>
            <input
                type="checkbox"
                id={`${groupName}-${tag.id}`}
                className="checkbox-input"
                checked={tag.enabled}
                onChange={() => handleChange(tag.id)}
            />
            <label
                htmlFor={`${groupName}-${tag.id}`}
                className={cn('checkbox-label', styles.checkboxLabel)}
            >
                <div className={cn('custom-checkbox', styles.customCheckbox)}>
                    <Icon id="#checked" className="icon--24" />
                </div>
                <div className={styles.itemContent}>
                    <span className={styles.itemTitle}>{tag.title}</span>
                    {tag.tooltip !== '' && (
                        <span className={styles.itemTooltip}>{tag.tooltip}</span>
                    )}
                </div>
            </label>
        </div>
    );
};
