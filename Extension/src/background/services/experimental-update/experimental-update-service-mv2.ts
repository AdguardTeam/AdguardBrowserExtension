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

import { type Metadata } from '../../schema';

import {
    type CustomFilter,
    type FilterInfo,
    type FiltersSettings,
    type MigratedData,
    type RuleResource,
} from './schema';

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * This class is a empty dummy to correct work of MV2 build without using MV3 code.
 */
export class Experimental {
    /**
     * Just a empty dummy for MV2.
     *
     * @param dataFromStorage Data from storage.
     *
     * @throws Not implemented error.
     */
    static isExperimental(dataFromStorage: unknown): boolean {
        throw new Error('isExperimental not implemented');
    }

    /**
     * Just a empty dummy for MV2.
     *
     * @param inputUserRules User rules string.
     *
     * @throws Not implemented error.
     */
    static getUserRules(inputUserRules: unknown): string[] {
        throw new Error('getUserRules not implemented');
    }

    /**
     * Just a empty dummy for MV2.
     *
     * @throws Not implemented error.
     */
    static getCustomFilters(): CustomFilter[] {
        throw new Error('getCustomFilters not implemented');
    }

    /**
     * Just a empty dummy for MV2.
     *
     * @throws Not implemented error.
     */
    static filterExistingRules(): FilterInfo[] {
        throw new Error('filterExistingRules not implemented');
    }

    /**
     * Just a empty dummy for MV2.
     *
     * @throws Not implemented error.
     */
    static isCustomFilter(): boolean {
        throw new Error('isCustomFilter not implemented');
    }

    /**
     * Just a empty dummy for MV2.
     *
     * @param filtersInfo Filters info object.
     * @param metadata Object with filters metadata.
     * @param ruleResources Array of rule resources from the manifest.
     *
     * @throws Not implemented error.
     */
    static getFiltersSettings(
        filtersInfo: unknown,
        metadata: Metadata,
        ruleResources: RuleResource[],
    ): FiltersSettings {
        throw new Error('getFiltersSettings not implemented');
    }

    /**
     * Just a empty dummy for MV2.
     *
     * @param dataFromStorage Data from the storage.
     * @param metadata Object with filters metadata.
     * @param ruleResources Array of rule resources from the manifest.
     *
     * @throws Not implemented error.
     */
    static migrateSettings(
        dataFromStorage: unknown,
        metadata: Metadata,
        ruleResources: RuleResource[],
    ): MigratedData {
        throw new Error('migrateSettings not implemented');
    }
}

/* eslint-enable @typescript-eslint/no-unused-vars */
