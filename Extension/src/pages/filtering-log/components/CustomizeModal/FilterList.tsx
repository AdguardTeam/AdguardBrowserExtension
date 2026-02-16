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
import { type LogFilters } from '../../stores/LogStore';
import { ALL_TAG_ID } from '../../constants';

import { Tag } from './Tag';

import styles from './customizeModal.module.pcss';

/**
 * Filter list component for customize modal.
 * Displays a list of filter tags with checkboxes for enabling/disabling them.
 *
 * @param props Component props.
 * @param props.label Label for the filter group.
 * @param props.tags Current filter tags state.
 * @param props.setTags Function to update filter tags state.
 * @param props.groupName Name of the filter group.
 *
 * @returns Filter list component.
 */
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
    const { areAllButtonsEnabled, filters } = tags;

    const toggleOne = (tagId: string) => {
        const updatedTags = filters.map((tag) => ({
            ...tag,
            enabled: tag.id === tagId ? !tag.enabled : tag.enabled,
        }));

        const allSelected = updatedTags.every((tag) => tag.enabled);

        setTags({ filters: updatedTags, areAllButtonsEnabled: allSelected });
    };

    const toggleAll = () => {
        const newAllState = !areAllButtonsEnabled;
        const updatedTags = filters.map((tag) => ({
            ...tag,
            enabled: newAllState,
        }));
        setTags({ filters: updatedTags, areAllButtonsEnabled: newAllState });
    };

    const handleChange = (tagId: string) => {
        if (tagId === ALL_TAG_ID) {
            toggleAll();
        } else {
            toggleOne(tagId);
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
                        enabled: areAllButtonsEnabled,
                    }}
                    handleChange={handleChange}
                />
                {filters.map((filter) => (
                    <Tag
                        key={filter.id}
                        groupName={groupName}
                        tag={filter}
                        handleChange={handleChange}
                    />
                ))}
            </div>
        </div>
    );
};
