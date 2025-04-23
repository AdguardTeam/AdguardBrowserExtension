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

import classNames from 'classnames';

import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { Icon } from '../../../common/components/ui/Icon';

import './group.pcss';

/**
 * Parameters for the {@link Group} component.
 */
type GroupParams = {
    /**
     * Group name.
     */
    groupName: string;

    /**
     * Group description.
     */
    groupDescription?: string;

    /**
     * Group id.
     */
    groupId: number;

    /**
     * Details about enabled filters:
     * - if group is off — `null`;
     * - if group is on — `Enabled: <x> of <y>` or `No filters enabled`.
     */
    filterDetails: string | null;

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

    /**
     * Checkbox value.
     */
    checkboxValue: boolean;
};

const Group = ({
    groupName,
    groupDescription,
    groupId,
    filterDetails,
    groupClickHandler,
    checkboxHandler,
    checkboxValue,
}: GroupParams) => {
    const groupClassName = classNames({
        setting: true,
        group: true,
        'group--disabled': !checkboxValue,
    });

    const titleId = `setting-title-${groupId}`;
    const descriptionId = `setting-desc-${groupId}`;
    const filterDetailsId = `setting-desc-filters-${groupId}`;
    const iconId = `#setting-${groupId}`;

    return (
        <li className={groupClassName}>
            <button
                type="button"
                role="link"
                tabIndex={0}
                className="setting__area setting__area_group"
                onClick={groupClickHandler}
                aria-labelledby={titleId}
                aria-describedby={`${descriptionId}${filterDetails ? ` ${filterDetailsId}` : ''}`}
            >
                <Icon
                    id={iconId}
                    classname="icon--24 setting__icon"
                    aria-hidden="true"
                />
                <span className="setting__info">
                    <span id={titleId} className="setting__title group__title">
                        {groupName}
                    </span>
                    <span id={descriptionId} className="setting__desc">
                        {groupDescription}
                    </span>
                    {filterDetails && (
                        <span id={filterDetailsId} className="setting__desc">
                            {filterDetails}
                        </span>
                    )}
                </span>
            </button>
            <div className="setting__inline-control setting__inline-control_group">
                <Setting
                    id={groupId}
                    type={SETTINGS_TYPES.CHECKBOX}
                    label={groupName}
                    labelId={titleId}
                    value={checkboxValue}
                    handler={checkboxHandler}
                    optimistic={!__IS_MV3__}
                    className="group__checkbox"
                />
            </div>
        </li>
    );
};

export { Group };
