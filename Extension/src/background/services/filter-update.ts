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
import { FilterUpdateApi } from '../api';

/**
 * Service for scheduling filter update checks
 *
 * It delays update check on initialization on 5 min
 * 5 min after initialization scheduler checks filter updates every 30 minutes
 */
export class FilterUpdateService {
    // update checking initialization delay
    private static initDelay = 1000 * 60 * 5; // 5 min

    // checking period
    private static checkPeriodMs = 1000 * 60 * 30; // 30 min

    private timerId: number | undefined;

    constructor() {
        this.update = this.update.bind(this);
    }

    /**
     * Run update scheduler after {@link initDelay} timeout
     */
    public async init(): Promise<void> {
        setTimeout(async () => {
            await this.update();
        }, FilterUpdateService.initDelay);
    }

    /**
     * Checks filter updates every {@link checkPeriodMs} period
     */
    private async update(): Promise<void> {
        window.clearTimeout(this.timerId);

        await FilterUpdateApi.autoUpdateFilters();

        this.timerId = window.setTimeout(async () => {
            await this.update();
        }, FilterUpdateService.checkPeriodMs);
    }
}

export const filterUpdateService = new FilterUpdateService();
