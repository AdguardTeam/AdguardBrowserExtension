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

import { translator } from '../../../../common/translators/translator';

import styles from './customizeModal.module.pcss';
import { LogFilters, SingleLogFilter } from '../../stores/LogStore';

//FIXME: It be good to create common component for filtering log and request wizard
const ALL_TAG_ID = 'all';

const Tag = ({
    groupName,
    tag,
    handleChange,
}: {
    groupName: string,
    tag: SingleLogFilter,
    handleChange: (tagId: string) => void,
}) => {
    return (
        <div className={styles.tag}>
            <input
                type="radio"
                id={`${groupName}-${tag.id}`}
                name={groupName}
                className="radio-button-input"
                checked={tag.enabled}
                onChange={() => handleChange(tag.id)}
            />
            <label
                htmlFor={`${groupName}-${tag.id}`}
                className="radio-button-label"
            >
                <span className="radio-button" />
                <span className={styles.itemContent}>
                    <span className={styles.itemTitle}>{tag.title}</span>
                    {tag.tooltip !== '' && (
                        <span className={styles.itemTooltip}>{tag.tooltip}</span>
                    )}
                </span>
            </label>
        </div>
    )
}

export const FilterList = ({
    label,
    tags,
    setTags,
    groupName,
}: {
    label: string;
    tags: LogFilters;
    setTags: (tags: LogFilters) => void;
    groupName: string;
}) => {
    const { allButtonEnabled, filters } = tags;

    const enableOne = (tagId: string) => {
        const updatedTags = filters.map((tag) => ({
            ...tag,
            enabled: tag.id === tagId,
        }));
        setTags({ filters: updatedTags, allButtonEnabled: false });
    };

    const enableAll = () => {
        const updatedTags = filters.map((tag) => ({
            ...tag,
            enabled: true,
        }));
        setTags({ filters: updatedTags, allButtonEnabled: true });
    };

    const handleChange = (tagId: string) => {
        if (tagId === ALL_TAG_ID) {
            enableAll();
        } else {
            enableOne(tagId);
        }
    };

    return (
        <div className={styles.filterList}>
            <div className={styles.label}>{label}</div>
            <div>
                <Tag 
                    groupName={groupName}
                    tag={{
                        id: ALL_TAG_ID,
                        title: translator.getMessage('filtering_type_all'),
                        tooltip: '',
                        enabled: allButtonEnabled,
                    }}
                    handleChange={handleChange}
                />
                {filters.map((filter) => (
                    <Tag 
                        key={filter.id}
                        groupName={groupName}
                        tag={{
                            ...filter,
                            enabled: !allButtonEnabled && filter.enabled,
                        }}
                        handleChange={handleChange}
                    />
                ))}
            </div>
        </div>
    );
};
