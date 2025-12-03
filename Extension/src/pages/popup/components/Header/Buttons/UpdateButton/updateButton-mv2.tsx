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

import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import { MIN_UPDATE_DISPLAY_DURATION_MS } from '../../../../../../common/constants';
import { translator } from '../../../../../../common/translators/translator';
import { Icon } from '../../../../../common/components/ui/Icon';
import { addMinDurationTime } from '../../../../../../common/sleep-utils';
import { messenger } from '../../../../../services/messenger';
import { getFiltersUpdateResultMessage } from '../../../../../../common/toast-helper';

export const UpdateButton = () => {
    const refUpdatingBtn = useRef<HTMLButtonElement>(null);

    const timeoutId = useRef<NodeJS.Timeout>();
    const [filtersUpdating, setFiltersUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');

    const updateFiltersWithMinDuration = addMinDurationTime(
        messenger.updateFilters,
        MIN_UPDATE_DISPLAY_DURATION_MS,
    );

    const handleUpdateFiltersClick = async () => {
        clearTimeout(timeoutId.current);

        setFiltersUpdating(true);
        setUpdateMessage('');

        const updatedFilters = await updateFiltersWithMinDuration();
        const { text } = getFiltersUpdateResultMessage(true, updatedFilters);

        setUpdateMessage(text);
        setFiltersUpdating(false);

        // Hack used here: previously we updated content of aria-live with message
        // which Screen Readers will announce to user after that we will remove it
        // immediately to avoid having focus on this hidden element.
        timeoutId.current = setTimeout(() => {
            setUpdateMessage('');
        }, 1);
    };

    // cleanup timeout after unmount
    useEffect(() => {
        return () => {
            clearTimeout(timeoutId.current);
        };
    }, []);

    return (
        <>
            <div
                role="status"
                className="sr-only"
                aria-live="assertive"
                tabIndex={-1}
                aria-hidden={!filtersUpdating && !updateMessage} // MV2
            >
                {filtersUpdating ? translator.getMessage('options_popup_updating_filters') : updateMessage}
                {' '}
// MV2
            </div>
            <button
                className="button popup-header__button"
                ref={refUpdatingBtn} // MV2
                disabled={filtersUpdating} // MV2
                type="button"
                onClick={handleUpdateFiltersClick} // handler
                title={translator.getMessage('popup_header_update_filters')} // message
            >
                <Icon
                    id="#reload"
                    className="icon--24 icon--header"
                    animationCondition={filtersUpdating} // MV3
                    animationClassName="icon--loading"
                    aria-hidden="true"
                />
            </button>
        </>
    );
};
