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
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';
import { CUSTOM_FILTERS_DISABLED_IN_MV3_DUE_TO_CWS } from '../../constants';
import { AntibannerGroupsId } from '../../../../common/constants';

import './group.pcss';

const renderEnabledFilters = (enabledFilters) => {
    const enabledFiltersNames = enabledFilters.map((filter) => filter.name);
    const SLICE_POINT = 3;
    const displayable = enabledFiltersNames.slice(0, SLICE_POINT);
    const countable = enabledFiltersNames.slice(SLICE_POINT);

    if (countable.length > 0) {
        return (
            <>
                {reactTranslator.getMessage('options_filters_enabled')}
                {' '}
                {reactTranslator.getMessage(
                    'options_filters_enabled_and_more',
                    { enabled: displayable.join(', '), more: countable.length },
                )}
            </>
        );
    }

    if (displayable.length > 1) {
        const [last, ...rest] = displayable.reverse();
        return (
            <>
                {reactTranslator.getMessage('options_filters_enabled')}
                {' '}
                {reactTranslator.getMessage(
                    'options_filters_enabled_and_last',
                    { enabled: rest.join(', '), last },
                )}
            </>
        );
    }

    if (displayable.length === 1) {
        return (
            <>
                {reactTranslator.getMessage('options_filters_enabled')}
                {' '}
                {displayable[0]}
            </>
        );
    }

    return reactTranslator.getMessage('options_filters_no_enabled');
};

const DisabledCustomFiltersGroup = ({
    groupName,
    groupId,
    enabledFilters,
}) => {
    const groupClassName = classNames({
        setting: true,
        group: true,
        'group--disabled': true,
    });

    return (
        <div className={groupClassName}>
            <a
                href={CUSTOM_FILTERS_DISABLED_IN_MV3_DUE_TO_CWS}
                target="_blank"
                rel="noreferrer"
                className="setting__area setting__area_group link_like_setting_area"
            >
                <div className="container">
                    <Icon
                        id={`#setting-${groupId}`}
                        classname="icon--24 setting__icon"
                    />
                    <div className="setting__info">
                        <div className="setting__title group__title">
                            {groupName}
                        </div>
                        <div className="setting__desc">
                            {renderEnabledFilters(enabledFilters)}
                        </div>
                        <span className="warning">
                            {translator.getMessage('options_filters_custom_disabled_cws')}
                        </span>
                    </div>
                </div>
                <Icon
                    id="#link"
                    classname="icon icon--24 icon--green-default link"
                />
            </a>
        </div>
    );
};

const Group = ({
    groupName,
    groupId,
    enabledFilters,
    groupClickHandler,
    checkboxHandler,
    checkboxValue,
}) => {
    const groupClassName = classNames({
        setting: true,
        group: true,
        'group--disabled': !checkboxValue,
    });

    // TODO: Remove this component when custom filters will be supported for MV3.
    if (__IS_MV3__ && groupId === AntibannerGroupsId.CustomFiltersGroupId) {
        return (
            <DisabledCustomFiltersGroup
                groupName={groupName}
                groupId={AntibannerGroupsId.CustomFiltersGroupId}
                enabledFilters={enabledFilters}
            />
        );
    }

    return (
        <div className={groupClassName}>
            <button
                type="button"
                tabIndex={0}
                className="setting__area setting__area_group"
                onClick={groupClickHandler}
            >
                <Icon
                    id={`#setting-${groupId}`}
                    classname="icon--24 setting__icon"
                />
                <div className="setting__info">
                    <div className="setting__title group__title">
                        {groupName}
                    </div>
                    <div className="setting__desc">
                        {renderEnabledFilters(enabledFilters)}
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
                    optimistic={!__IS_MV3__}
                    className="group__checkbox"
                />
            </div>
        </div>
    );
};

export { Group };
