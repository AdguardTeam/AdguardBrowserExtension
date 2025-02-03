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

import cn from 'classnames';

import { popupStore } from '../../stores/PopupStore';

import {
    BlockAdsAction,
    CheckSiteSecurityAction,
    OpenFilteringLogAction,
    ReportIssueAction,
    ResetPageUserRulesAction,
} from './SingleActions';

import './actions.pcss';

const Actions = observer(() => {
    const store = useContext(popupStore);

    const { isFilteringPossible, url } = store;

    const actionChangingClassname = cn('action', { 'action--disabled': !isFilteringPossible });

    return (
        <div className="actions">
            <BlockAdsAction isFilteringPossible={isFilteringPossible} className={actionChangingClassname} />
            <OpenFilteringLogAction className="action" />
            <ReportIssueAction
                className={actionChangingClassname}
                isFilteringPossible={isFilteringPossible}
                url={url}
            />
            <CheckSiteSecurityAction
                className={actionChangingClassname}
                isFilteringPossible={isFilteringPossible}
                url={url}
            />
            {
                store.hasUserRulesToReset && (
                    <ResetPageUserRulesAction
                        isFilteringPossible={isFilteringPossible}
                        className={actionChangingClassname}
                        url={url}
                    />
                )
            }
        </div>
    );
});

export { Actions };
