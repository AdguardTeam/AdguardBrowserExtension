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
import { metadataStorage } from '../../storages';
import { logger } from '../../../common/logger';

import { FilterUpdateServiceCommon } from './filter-update-common';

/**
 * Service for scheduling filters update checks.
 *
 * After initialization scheduler checks filter updates
 * {@link CHECK_PERIOD_MS every 5 minutes}.
 */
export class FilterUpdateService extends FilterUpdateServiceCommon {
    /**
     * Initially starts checking filters update.
     */
    // eslint-disable-next-line class-methods-use-this
    public async init(): Promise<void> {
        const dnrRulesetsBuildTimestampMs = metadataStorage.getDnrRulesetsBuildTimestampMs();
        if (dnrRulesetsBuildTimestampMs === undefined) {
            logger.warn('[ext.FilterUpdateService.init]: DNR rulesets build timestamp is not available.');
            return;
        }
        // We set last update time in MV3 during issue reporting.
        await FilterUpdateService.setLastUpdateTimeMs(dnrRulesetsBuildTimestampMs);
    }
}

export const filterUpdateService = new FilterUpdateService();
