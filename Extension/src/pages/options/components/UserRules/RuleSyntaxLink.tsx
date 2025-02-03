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

import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';
import { HOW_TO_CREATE_RULES_URL } from '../../constants';

/**
 * Component for link to rule syntax with 'question' icon.
 *
 * @returns Link to rule syntax.
 */
export const RuleSyntaxLink = () => {
    return (
        <a
            className="button button--link link_with_icon"
            href={HOW_TO_CREATE_RULES_URL}
            target="_blank"
            rel="noreferrer"
        >
            <Icon
                id="#question"
                classname="icon icon--24 icon--green-default"
            />
            <span className="link_with_icon__text">
                {translator.getMessage('options_rule_syntax')}
            </span>
        </a>
    );
};
