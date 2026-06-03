/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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
import zod from 'zod';

import { GLOBAL_STATIC_RULE_LIMIT } from '../../storages/rules-limits-warning';

export const rulesLimitsWarningStorageDataValidator = zod.object({
    /**
     * Whether the user has dismissed the "limit lowered by other extensions" warning.
     */
    isDismissed: zod.boolean().default(false),

    /**
     * The staticRulesMaximumCount at the time the warning was dismissed.
     * When this value changes (and limit is still lowered), the warning is shown again.
     */
    dismissedAtStaticRulesMax: zod.number().default(GLOBAL_STATIC_RULE_LIMIT),
}).default({});

/**
 * State for the rules limits warning (variant B) dismissal.
 */
export type RulesLimitsWarningStorageData = zod.infer<typeof rulesLimitsWarningStorageDataValidator>;
