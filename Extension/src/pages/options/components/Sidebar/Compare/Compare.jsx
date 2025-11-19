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

import { translator } from '../../../../../common/translators/translator';
import { Icon } from '../../../../common/components/ui/Icon';

import './compare.pcss';

export const Compare = ({ onCompareClick, onCloseClick }) => {
    return (
        <div role="alert" className="compare">
            <div className="compare__message">
                {translator.getMessage('options_nav_better_than_extension')}
            </div>
            <button
                type="button"
                className="button button--green-bg button--m button--compare"
                title={translator.getMessage('options_nav_compare')}
                onClick={onCompareClick}
            >
                {translator.getMessage('options_nav_compare')}
            </button>
            <button
                type="button"
                className="compare__close"
                aria-label={translator.getMessage('close_button_title')}
                onClick={onCloseClick}
            >
                <Icon
                    id="#cross"
                    className="icon--24 icon--gray-default"
                    aria-hidden="true"
                />
            </button>
        </div>
    );
};
