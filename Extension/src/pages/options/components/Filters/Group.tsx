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
import { observer } from 'mobx-react';

import classNames from 'classnames';

import { AntibannerGroupsId } from '../../../../common/constants';
import { Icon } from '../../../common/components/ui/Icon';
import { useVisibilityCheck } from '../../../common/hooks/useVisibilityCheck';
import { USER_SCRIPTS_API_REQUIRED_URL } from '../../constants';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { shouldShowUserScriptsApiWarning } from '../../../../common/user-scripts-api';

import { UserScriptsApiWarningOutsideCustomGroup } from './UserScriptsApiWarningForCustomFilters';

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
    groupDescription: string;

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

/**
 * Parameters for the {@link DisabledCustomFiltersGroup} component.
 */
type DisabledCustomFiltersGroupParams = {
    /**
     * Id of the title element.
     */
    titleId: string;

    /**
     * Id of the description element.
     */
    descriptionId: string;

    /**
     * Group name.
     */
    groupName: string;

    /**
     * Group description.
     */
    groupDescription: string;
};

const DisabledCustomFiltersGroup = ({
    titleId,
    descriptionId,
    groupName,
    groupDescription,
}: DisabledCustomFiltersGroupParams) => {
    const groupClassName = classNames({
        setting: true,
        group: true,
        'group--disabled': true,
    });

    const warningDescriptionId = `${descriptionId}-warning`;

    return (
        <div className={groupClassName}>
            <div
                className="setting__area setting__area_group setting__area__custom-group-warning"
                aria-labelledby={titleId}
                aria-describedby={`${descriptionId} ${warningDescriptionId}`}
            >
                <Icon
                    id={`#setting-${AntibannerGroupsId.CustomFiltersGroupId}`}
                    classname="icon--24 setting__icon"
                    aria-hidden="true"
                />
                <span className="setting__info setting__info__custom-group-warning">
                    <span id={titleId} className="setting__title group__title">
                        {groupName}
                    </span>
                    <span id={descriptionId} className="setting__desc">
                        {groupDescription}
                    </span>
                    <span id={warningDescriptionId}>
                        <UserScriptsApiWarningOutsideCustomGroup />
                    </span>
                </span>
                <a
                    href={USER_SCRIPTS_API_REQUIRED_URL}
                    target="_blank"
                    rel="noreferrer"
                >
                    <Icon
                        id="#question"
                        classname="icon icon--24 icon--green-default link"
                        aria-hidden="true"
                    />
                </a>
            </div>
        </div>
    );
};

const Group = observer(({
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

    // Use the custom hook to check for permission changes when visibility or focus changes
    const showWarning = useVisibilityCheck(shouldShowUserScriptsApiWarning);

    /**
     * Custom filters are NOT allowed for users by default. To have them enabled,
     * user must explicitly grant User scripts API permission.
     *
     * To fully comply with Chrome Web Store policies regarding remote code execution,
     * we implement a strict security-focused approach for Scriptlet and JavaScript rules execution.
     *
     * 1. Default - regular users that did not grant User scripts API permission explicitly:
     *    - We collect and pre-build script rules from the filters and statically bundle
     *      them into the extension - STEP 1. See 'updateLocalResourcesForChromiumMv3' in our build tools.
     *      IMPORTANT: all scripts and their arguments are local and bundled within the extension.
     *    - These pre-verified local scripts are passed to the engine - STEP 2.
     *    - At runtime before the execution, we check if each script rule is included
     *      in our local scripts list (STEP 3).
     *    - Only pre-verified local scripts are executed via chrome.scripting API (STEP 4.1 and 4.2).
     *      All other scripts are discarded.
     *    - Custom filters are NOT allowed for regular users to prevent any possibility
     *      of remote code execution, regardless of rule interpretation.
     *
     * 2. For advanced users that explicitly granted User scripts API permission -
     *    via enabling the Developer mode or Allow user scripts in the extension details:
     *    - Custom filters are allowed and may contain Scriptlet and JS rules
     *      that can be executed using the browser's built-in userScripts API (STEP 4.3),
     *      which provides a secure sandbox.
     *    - This execution bypasses the local script verification process but remains
     *      isolated and secure through Chrome's native sandboxing.
     *    - This mode requires explicit user activation and is intended for advanced users only.
     *
     * IMPORTANT:
     * Custom filters are ONLY supported when User scripts API permission is explicitly enabled.
     * This strict policy prevents Chrome Web Store rejection due to potential remote script execution.
     * When custom filters are allowed, they may contain:
     * 1. Network rules – converted to DNR rules and applied via dynamic rules.
     * 2. Cosmetic rules – interpreted directly in the extension code.
     * 3. Scriptlet and JS rules – executed via the browser's userScripts API (userScripts.execute)
     *    with Chrome's native sandboxing providing security isolation.
     *
     * For regular users without User scripts API permission (default case):
     * - Only pre-bundled filters with statically verified scripts are supported.
     * - Downloading custom filters or any rules from remote sources is blocked entirely
     *   to ensure compliance with the store policies.
     *
     * This implementation ensures perfect compliance with Chrome Web Store policies
     * by preventing any possibility of remote code execution for regular users.
     *
     * It is possible to follow all places using this logic by searching JS_RULES_EXECUTION.
     */
    if (
        groupId === AntibannerGroupsId.CustomFiltersGroupId
        && showWarning
    ) {
        return (
            <DisabledCustomFiltersGroup
                titleId={titleId}
                descriptionId={descriptionId}
                groupName={groupName}
                groupDescription={groupDescription}
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
});

export { Group };
