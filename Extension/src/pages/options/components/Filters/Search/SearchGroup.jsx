/**
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

import { Filter } from '../Filter';
import { Setting, SETTINGS_TYPES } from '../../Settings/Setting';
import { Icon } from '../../../../common/components/ui/Icon';

import '../group.pcss';

const renderFilters = (matchedFilters) => {
    return matchedFilters
        .map((filter) => <Filter key={filter.filterId} filter={filter} />);
};

const SearchGroup = ({
    groupName,
    groupId,
    filtersToShow,
    groupClickHandler,
    checkboxHandler,
    checkboxValue,
}) => {
    const groupClassName = cn('setting group', { 'group--disabled': !checkboxValue });
    const filtersClassName = cn('filters', {
        'filters--disabled': !checkboxValue,
    });
    return (
        <>
            <div className={groupClassName}>
                <button
                    type="button"
                    tabIndex={0}
                    className="setting__area setting__area_group"
                    onClick={groupClickHandler}
                >
                    <Icon
                        id={`#setting-${groupId}`}
                        classname="icon--setting setting__icon"
                    />
                    <div className="setting__info">
                        <div className="setting__title group__title">
                            {groupName}
                        </div>
                    </div>
                </button>
                <div className="setting__inline-control setting__inline-control_group">
                    <Setting
                        id={groupId}
                        type={SETTINGS_TYPES.CHECKBOX}
                        label={groupName}
                        value={checkboxValue}
                        handler={checkboxHandler}
                        className="group__checkbox"
                    />
                </div>
            </div>
            <div className={filtersClassName}>
                {renderFilters(filtersToShow)}
            </div>
        </>
    );
};

export { SearchGroup };
