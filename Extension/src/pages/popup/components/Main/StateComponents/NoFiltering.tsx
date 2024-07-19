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

import { SpecificPopupState } from '../../../constants';
import { Icon } from '../../../../common/components/ui/Icon';

/**
 * No-filtering component props.
 */
type NoFilteringProps = {
    /**
     * Specific popup state.
     */
    specificPopupState: SpecificPopupState;
};

export const NoFiltering = ({ specificPopupState }: NoFilteringProps) => {
    let iconId = '#lock';

    if (specificPopupState === SpecificPopupState.FilteringUnavailable) {
        iconId = '#secure-page';
    }

    return (
        <div className="main__no-filtering">
            <Icon
                id={iconId}
                classname="icon--no-filtering"
            />
        </div>
    );
};
