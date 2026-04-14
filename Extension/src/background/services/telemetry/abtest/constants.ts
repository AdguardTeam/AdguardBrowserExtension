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

import { type VariantCache } from './types';

/**
 * Storage key for the variant cache.
 */
export const VARIANTS_STORAGE_KEY = 'ab_test_manager.variants';

/**
 * Type for the experiment registry mapping slots to experiment IDs.
 */
export type ExperimentRegistry = Readonly<VariantCache>;

/**
 * Registry of active A/B experiments.
 *
 * Maps Plausible Analytics custom property slots to experiment IDs.
 * Maximum 3 slots (experiment_1, experiment_2, experiment_3).
 * Add new experiments here when needed.
 *
 * Example: { experiment_1: 'AG-47804-trial-a_def' }.
 */
export const EXPERIMENT_REGISTRY: ExperimentRegistry = {
    experiment_1: 'AG-51010-limitations-browser',
    experiment_2: 'AG-52622-general-settings-promo',
};

export const AG_51010_LIMITATIONS_BROWSER_B = 'AG-51010-limitations-browser-b';

export const AG_52622_GENERAL_SETTINGS_PROMO_B = 'AG-52622-general-settings-promo-b';
