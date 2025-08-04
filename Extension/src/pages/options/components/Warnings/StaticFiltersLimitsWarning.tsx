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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';

import { OptionsPageSections } from '../../../../common/nav';
import { translator } from '../../../../common/translators/translator';
import { rootStore } from '../../stores/RootStore';

/**
 * Static filters limits warning component.
 *
 * Displays a warning about changes made by the browser if rule limits are exceeded
 * or if user enabled maximum possible number of filters.
 *
 * @returns Static filters limits warning component
 * or null for non-MV3 builds or when the warning is not set.
 */
export const StaticFiltersLimitsWarning = observer(() => {
    if (!__IS_MV3__) {
        return null;
    }

    const { uiStore: { staticFiltersLimitsWarning } } = useContext(rootStore);

    if (!staticFiltersLimitsWarning) {
        return null;
    }

    return (
        <div role="alert" className="warning section-warning">
            <span>
                {staticFiltersLimitsWarning}
            </span>
            <Link
                className="section-warning--link"
                to={`/${OptionsPageSections.ruleLimits}`}
            >
                {translator.getMessage('options_rule_limits')}
            </Link>
        </div>
    );
});
