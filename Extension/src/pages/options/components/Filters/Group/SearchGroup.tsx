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

import cn from 'classnames';

import { type CategoriesFilterData } from '../../../../../background/api/filters/categories';
import { Filter } from '../Filter';
import { Setting, SETTINGS_TYPES } from '../../Settings/Setting';
import { Icon } from '../../../../common/components/ui/Icon';
import { translator } from '../../../../../common/translators/translator';

import styles from './group.module.pcss';

const renderFilters = (matchedFilters: CategoriesFilterData[], groupEnabled: boolean) => {
    return matchedFilters.map((filter) => (
        <Filter
            key={filter.filterId}
            filter={filter}
            groupEnabled={groupEnabled}
            disabled={!groupEnabled}
        />
    ));
};

/**
 * Parameters for the {@link SearchGroup} component.
 */
type SearchGroupParams = {
    /**
     * Group name.
     */
    groupName: string;

    /**
     * Group id.
     */
    groupId: number;

    /**
     * Checkbox value.
     */
    groupEnabled: boolean;

    /**
     * Filters to show in the group.
     */
    filtersToShow: CategoriesFilterData[];

    /**
     * Handler for group click event.
     */
    groupClickHandler: () => void;

    /**
     * Handler for checkbox change event.
     *
     * @param id Group id.
     * @param data Checkbox value.
     */
    checkboxHandler: ({ id, data }: { id: string; data: boolean }) => void;
};

const SearchGroup = ({
    groupName,
    groupId,
    groupEnabled,
    filtersToShow,
    groupClickHandler,
    checkboxHandler,
}: SearchGroupParams) => {
    const groupClassName = cn(styles.group, !groupEnabled && styles.disabled);
    const filtersClassName = cn('filters', {
        'filters--disabled': !groupEnabled,
    });

    const titleId = `setting-title-${groupId}`;

    return (
        <li className="search-group-list__item">
            <div className={groupClassName}>
                <button
                    type="button"
                    role="link"
                    tabIndex={0}
                    className="setting__area setting__area_group"
                    onClick={groupClickHandler}
                    aria-labelledby={titleId}
                >
                    <Icon
                        id={`#setting-${groupId}`}
                        className="icon--24 setting__icon"
                        aria-hidden="true"
                    />
                    <span className="setting__info">
                        <span id={titleId} className="setting__title setting__title--search">
                            {groupName}
                        </span>
                    </span>
                </button>
                <div className={styles.checkbox}>
                    <Setting
                        id={groupId}
                        type={SETTINGS_TYPES.CHECKBOX}
                        label={groupName}
                        labelId={titleId}
                        value={groupEnabled}
                        handler={checkboxHandler}
                        optimistic={!__IS_MV3__}
                    />
                </div>
            </div>
            <ul
                className={filtersClassName}
                aria-label={translator.getMessage('options_filters_of_group', { groupName })}
            >
                {renderFilters(filtersToShow, groupEnabled)}
            </ul>
        </li>
    );
};

export { SearchGroup };
