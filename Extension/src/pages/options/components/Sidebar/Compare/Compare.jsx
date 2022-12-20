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
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { Icon } from '../../../../common/components/ui/Icon';
import './compare.pcss';

export const Compare = ({ click, hide }) => {
    return (
        <div className="compare">
            <div className="compare__message">
                {reactTranslator.getMessage('options_nav_better_than_extension')}
            </div>
            <button
                type="button"
                className="button button--green button--m button--compare"
                onClick={click}
            >
                {reactTranslator.getMessage('options_nav_compare')}
            </button>
            <button
                type="button"
                className="compare__close"
                aria-label={reactTranslator.getMessage('close_button_title')}
                onClick={hide}
            >
                <Icon id="#cross" />
            </button>
        </div>
    );
};
