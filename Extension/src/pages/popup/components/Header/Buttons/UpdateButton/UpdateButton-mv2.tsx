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

import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import { MIN_UPDATE_DISPLAY_DURATION_MS } from '../../../../../../common/constants';
import { translator } from '../../../../../../common/translators/translator';
import { addMinDurationTime } from '../../../../../../common/sleep-utils';
import { messenger } from '../../../../../services/messenger';
import { getFiltersUpdateResultMessage } from '../../../../../../common/toast-helper';

<<<<<<<< HEAD:Extension/src/pages/popup/components/Header/Buttons/UpdateButton/updateButton-mv2.tsx
import { UpdateButtonCommon } from './updateButton-common';
========
import { UpdateButtonCommon } from './UpdateButton-common';
>>>>>>>> release/v5.3:Extension/src/pages/popup/components/Header/Buttons/UpdateButton/UpdateButton-mv2.tsx

export const UpdateButton = () => {
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
        <UpdateButtonCommon
            isUpdating={filtersUpdating}
            statusMessage={filtersUpdating ? translator.getMessage('options_popup_updating_filters') : updateMessage}
            onClick={handleUpdateFiltersClick}
            buttonTitle={translator.getMessage('popup_header_update_filters')}
        />
    );
};
