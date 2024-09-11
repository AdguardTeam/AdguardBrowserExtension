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

import React, { useRef, useState } from 'react';

import { translator } from '../../../../../common/translators/translator';
import { Icon } from '../../../../common/components/ui/Icon';
import { addMinDurationTime } from '../../../../common/common-script';
import { messenger } from '../../../../services/messenger';
import { MIN_FILTERS_UPDATE_DISPLAY_DURATION_MS } from '../../../../common/constants';

export const UpdateButton = () => {
    const [filtersUpdating, setFiltersUpdating] = useState(false);

    const updateFiltersWithMinDuration = addMinDurationTime(
        messenger.updateFilters,
        MIN_FILTERS_UPDATE_DISPLAY_DURATION_MS,
    );

    const refUpdatingBtn = useRef<HTMLButtonElement>(null);

    const handleUpdateFiltersClick = async () => {
        if (refUpdatingBtn.current) {
            refUpdatingBtn.current.blur();
        }
        setFiltersUpdating(true);
        await updateFiltersWithMinDuration();
        setFiltersUpdating(false);
    };

    return (
        <button
            className="button popup-header__button"
            ref={refUpdatingBtn}
            disabled={filtersUpdating}
            type="button"
            onClick={handleUpdateFiltersClick}
            title={translator.getMessage('popup_header_update_filters')}
        >
            <Icon
                id="#reload"
                classname="icon--24 icon--header"
                animationCondition={filtersUpdating}
                animationClassname="icon--loading"
            />
        </button>
    );
};
