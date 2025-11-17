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

import { RULES_LIMITS_KEY } from '../../common/constants';
import { StringStorage } from '../utils/string-storage';
import { type RulesLimitsStorageData } from '../schema/rules-limits';

import { browserStorage } from './shared-instances';

/**
 * Instance of {@link StringStorage} that stores filter enabled before chrome decided to disable them
 * in {@link storage} under {@link RULES_LIMITS_KEY} key.
 */
export const rulesLimitsStorage = new StringStorage<
    typeof RULES_LIMITS_KEY,
    RulesLimitsStorageData,
    'async'
>(RULES_LIMITS_KEY, browserStorage);
