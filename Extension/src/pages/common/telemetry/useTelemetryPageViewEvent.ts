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
import { useEffect } from 'react';

import { type TelemetryScreenName } from '../../../background/services/telemetry/enums';

import { type TelemetryStore } from './TelemetryStore';

/**
 * Hook that sends a page view telemetry event when the component is mounted.
 *
 * The event is sent once on component mount with the specified screen name.
 * The backend tracks screen navigation using pageId from the telemetry store.
 *
 * @param telemetryStore Telemetry store instance.
 * @param screenName Name of the screen to be logged in telemetry.
 */
export function useTelemetryPageViewEvent(
    telemetryStore: TelemetryStore,
    screenName: TelemetryScreenName,
): void {
    useEffect(() => {
        if (!telemetryStore.pageId) {
            return;
        }

        telemetryStore.sendPageViewEvent(screenName);
    }, [telemetryStore, screenName, telemetryStore.pageId, telemetryStore.isAnonymizedUsageDataAllowed]);
}
