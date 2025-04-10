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
import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';
import { CUSTOM_FILTERS_DISABLED_IN_MV3_DUE_TO_CWS } from '../../constants';
import { AntibannerGroupsId } from '../../../../common/constants';

import './group.pcss';

const DisabledCustomFiltersGroup = ({
    titleId,
    descriptionId,
    filterDetailsId,
    filterDetails,
    groupName,
    groupDescription,
    groupId,
}) => {
    const groupClassName = classNames({
        setting: true,
        group: true,
        'group--disabled': true,
    });

    const warningDescriptionId = `${descriptionId}-warning`;

    return (
        <div className={groupClassName}>
            <a
                href={CUSTOM_FILTERS_DISABLED_IN_MV3_DUE_TO_CWS}
                target="_blank"
                rel="noreferrer"
                className="setting__area setting__area_group link_like_setting_area"
                aria-labelledby={titleId}
                aria-describedby={`${descriptionId} ${warningDescriptionId}`}
            >
                <span className="container">
                    <Icon
                        id={`#setting-${groupId}`}
                        classname="icon--24 setting__icon"
                        aria-hidden="true"
                    />
                    <span className="setting__info">
                        <span id={titleId} className="setting__title group__title">
                            {groupName}
                        </span>
                        <span id={descriptionId} className="setting__title group__description">
                            {groupDescription}
                        </span>
                        {filterDetails && (
                            <span id={filterDetailsId} className="setting__desc">
                                {filterDetails}
                            </span>
                        )}
                        <span id={warningDescriptionId} className="warning">
                            {translator.getMessage('options_filters_custom_disabled_cws')}
                        </span>
                    </span>
                </span>
                <Icon
                    id="#link"
                    classname="icon icon--24 icon--green-default link"
                    aria-hidden="true"
                />
            </a>
        </div>
    );
};

const Group = ({
    groupName,
    groupDescription,
    groupId,
    filterDetails,
    groupClickHandler,
    checkboxHandler,
    checkboxValue,
}) => {
    const groupClassName = classNames({
        setting: true,
        group: true,
        'group--disabled': !checkboxValue,
    });

    const titleId = `setting-title-${groupId}`;
    const descriptionId = `setting-desc-${groupId}`;
    const filterDetailsId = `setting-desc-filters-${groupId}`;
    const iconId = `#setting-${groupId}`;

    // TODO: Remove this component when custom filters will be supported for MV3.
    if (__IS_MV3__ && groupId === AntibannerGroupsId.CustomFiltersGroupId) {
        return (
            <DisabledCustomFiltersGroup
                titleId={titleId}
                descriptionId={descriptionId}
                filterDetailsId={filterDetailsId}
                filterDetails={filterDetails}
                groupName={groupName}
                groupDescription={groupDescription}
                groupId={AntibannerGroupsId.CustomFiltersGroupId}
            />
        );
    }

    return (
        <li className={groupClassName}>
            <button
                type="button"
                role="link"
                tabIndex={0}
                className="setting__area setting__area_group"
                onClick={groupClickHandler}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
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
