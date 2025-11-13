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
import { SettingsApi } from 'settings-api';

import { FiltersUpdateTime } from '../../../common/constants';
import { SettingOption } from '../../schema';
import { FilterUpdateIntervalSource } from '../enums';

import { TelemetryDataCollectorCommon } from './TelemetryDataCollector-common';

/**
 * Collects and manages telemetry data including synthetic ID, user agent, and application props.
 *
 * This class is responsible for gathering all necessary data for telemetry events.
 */
export class TelemetryDataCollector extends TelemetryDataCollectorCommon {
    /**
     * Gets filter update interval source.
     *
     * @returns SystemDefault if using default interval, Custom otherwise.
     */
    protected static getFilterUpdateInterval(): FilterUpdateIntervalSource | null {
        const updatePeriod: FiltersUpdateTime = SettingsApi.getSetting(SettingOption.FiltersUpdatePeriod);
        const isDefault = updatePeriod === FiltersUpdateTime.OneHour;
        // TODO: Why is only two values? Why we can't send number info?
        return isDefault
            ? FilterUpdateIntervalSource.SystemDefault
            : FilterUpdateIntervalSource.Custom;
    }
}
