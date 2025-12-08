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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../../common/translators/translator';
import { Icon } from '../../../../common/components/ui/Icon';
import { popupStore } from '../../../stores/PopupStore';
import { TelemetryEventName, TelemetryScreenName } from '../../../../../background/services';

/**
 * Pause/Resume button component.
 */
export const ProtectionSwitch = observer(() => {
    const store = useContext(popupStore);

    const {
        applicationFilteringPaused,
        pauseApplicationFiltering,
        resumeApplicationFiltering,
        telemetryStore,
    } = store;

    const onClick = async () => {
        telemetryStore.sendCustomEvent(
            TelemetryEventName.PauseClick,
            TelemetryScreenName.MainPage,
        );

        if (applicationFilteringPaused) {
            await resumeApplicationFiltering();
        } else {
            await pauseApplicationFiltering();
        }
    };

    const iconId = applicationFilteringPaused ? '#start' : '#pause';

    return (
        <button
            type="button"
            role="switch"
            title={translator.getMessage('popup_protection_button')}
            className="button popup-header__button"
            aria-checked={!applicationFilteringPaused}
            onClick={onClick}
        >
            <Icon
                id={iconId}
                className="icon--24 icon--header"
                aria-hidden="true"
            />
        </button>
    );
});
