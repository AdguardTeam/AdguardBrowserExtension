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

import {
    Forward,
    ForwardAction,
    ForwardFrom,
} from '../../../../../common/forward';
import { translator } from '../../../../../common/translators/translator';
import { Icon } from '../../../../common/components/ui/Icon';

import './filters-info-mv3.pcss';

export const FiltersInfoMv3 = () => {
    const specsUrl = Forward.get({
        action: ForwardAction.FiltersSpecsMv3,
        from: ForwardFrom.Options,
    });

    return (
        <div className="filters-info-mv3">
            <div>
                {translator.getMessage('options_filters_info_mv3_total_rules', {
                    // FIXME: use rulesLimits.nowEnabledFilters after pull-requests/1750 is merged
                    num: 12345,
                })}
            </div>
            <div className="filters-info-mv3--specs">
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={specsUrl}
                    className="filters-info-mv3--specs-link"
                >
                    <span>
                        {translator.getMessage('options_filters_info_mv3_specs')}
                    </span>
                    <Icon
                        id="#link"
                        classname="filters-info-mv3--specs-link-icon"
                    />
                </a>
            </div>
        </div>
    );
};
