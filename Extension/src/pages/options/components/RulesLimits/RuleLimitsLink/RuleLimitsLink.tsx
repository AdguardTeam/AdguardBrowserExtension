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
import { Link } from 'react-router-dom';

import { OptionsPageSections } from '../../../../../common/nav';
import { translator } from '../../../../../common/translators/translator';
import { Icon } from '../../../../common/components/ui/Icon';

/**
 * Component for link to rule limits with 'info' icon.
 *
 * @returns Link to rule limits.
 */
export const RuleLimitsLink = () => {
    return (
        <Link
            className="link_with_icon__link"
            to={`/${OptionsPageSections.ruleLimits}`}
        >
            <Icon
                id="#info"
                classname="icon icon--24 icon--green-default"
            />
            <span className="link_with_icon__text">
                {translator.getMessage('options_rule_limits')}
            </span>
        </Link>
    );
};
