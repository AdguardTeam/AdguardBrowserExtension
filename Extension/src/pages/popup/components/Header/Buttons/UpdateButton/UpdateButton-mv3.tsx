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

import { MIN_UPDATE_DISPLAY_DURATION_MS } from '../../../../../../common/constants';
import { sleepIfNecessary } from '../../../../../../common/sleep-utils';
import { translator } from '../../../../../../common/translators/translator';
import { Icon } from '../../../../../common/components/ui/Icon';
import { messenger } from '../../../../../services/messenger';
import { popupStore } from '../../../../stores/PopupStore';
import { ForwardFrom } from '../../../../../../common/forward';
import { TelemetryEventName, TelemetryScreenName } from '../../../../../../background/services/telemetry/enums';

import { UpdateButtonCommon } from './UpdateButton-common';

export const UpdateButton = observer(() => {
    const store = useContext(popupStore);

    const { isExtensionUpdateAvailable, telemetryStore } = store;

    const handleCheckUpdatesClick = async () => {
        telemetryStore.sendCustomEvent(
            TelemetryEventName.CheckUpdatesClick,
            TelemetryScreenName.MainPage,
        );

        await store.checkUpdates();
    };

    const handleUpdateExtensionClick = async (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        const start = Date.now();

        telemetryStore.sendCustomEvent(
            TelemetryEventName.UpdateAvailableClick,
            TelemetryScreenName.MainPage,
        );

        // TODO: We should rely on event for changing status instead of setting
        // flags manually
        // reset update availability flag
        store.setIsExtensionUpdateAvailable(false);
        store.setIsExtensionCheckingUpdateOrUpdating(true);
        await messenger.updateExtension({
            from: ForwardFrom.Popup,
        });

        // Ensure minimum duration for smooth UI experience before extension reload
        await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);
        store.setIsExtensionCheckingUpdateOrUpdating(false);
    };

    if (isExtensionUpdateAvailable) {
        return (
            <UpdateButtonCommon
                isUpdating={store.isExtensionCheckingUpdateOrUpdating}
                onClick={handleUpdateExtensionClick}
                buttonTitle={translator.getMessage('update_available_title')}
            >
                <Icon
                    id="#update-available"
                    className="icon--24 icon--header icon--header--update-available"
                    aria-hidden="true"
                />
            </UpdateButtonCommon>
        );
    }

    return (
        <UpdateButtonCommon
            isUpdating={store.isExtensionCheckingUpdateOrUpdating}
            statusMessage={
                store.isExtensionCheckingUpdateOrUpdating
                    ? translator.getMessage('update_checking_in_progress')
                    : ''
            }
            onClick={handleCheckUpdatesClick}
            buttonTitle={translator.getMessage('update_check')}
        />
    );
});
