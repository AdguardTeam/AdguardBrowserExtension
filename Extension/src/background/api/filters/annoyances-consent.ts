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

import { getZodErrorMessage } from '../../../common/error';
import { logger } from '../../../common/logger';
import { annoyancesConsentStorageDataValidator } from '../../schema';
import { annoyancesConsentStorage } from '../../storages';

/**
 * Class for managing annoyances filters consent.
 */
class AnnoyancesConsentApi {
    private consentedFilterIds: Set<number> | null;

    /**
     * Creates an instance of {@link AnnoyancesConsentApi}.
     */
    constructor() {
        // init value
        this.consentedFilterIds = null;
    }

    /**
     * Returns an array of consented annoyances filter ids from storage.
     *
     * @returns An array of consented annoyances filter ids.
     */
    private static async getFromStorage(): Promise<number[]> {
        let data: number[] = [];
        try {
            const storageData = await annoyancesConsentStorage.read();
            if (typeof storageData === 'string') {
                data = annoyancesConsentStorageDataValidator.parse(JSON.parse(storageData));
                annoyancesConsentStorage.setCache(data);
            } else {
                data = [];
                await annoyancesConsentStorage.setData(data);
            }
        } catch (e) {
            logger.warn(`[ext.AnnoyancesConsentApi.getFromStorage]: cannot parse data from "${annoyancesConsentStorage.key}" storage, set default states. Origin error:`, getZodErrorMessage(e));
            data = [];
            await annoyancesConsentStorage.setData(data);
        }
        return data;
    }

    /**
     * Restores consented annoyances filter ids from storage.
     *
     * @returns Set of consented annoyances filter ids.
     */
    private static async getConsentFromStorage(): Promise<Set<number>> {
        const storedConsentedFilterIds = await AnnoyancesConsentApi.getFromStorage();
        return new Set(storedConsentedFilterIds);
    }

    /**
     * Resets consented annoyances filter ids to empty array.
     */
    public async reset(): Promise<void> {
        this.consentedFilterIds = null;
        await annoyancesConsentStorage.setData([]);
    }

    /**
     * Adds filter ids to the list of consented annoyances filter ids.
     *
     * @param filterIds Filter ids.
     */
    public async addFilterIds(filterIds: number[]): Promise<void> {
        if (this.consentedFilterIds === null) {
            this.consentedFilterIds = await AnnoyancesConsentApi.getConsentFromStorage();
        }

        filterIds.forEach((id) => this.consentedFilterIds?.add(id));

        await annoyancesConsentStorage.setData(Array.from(this.consentedFilterIds));
    }

    /**
     * Checks whether the filter is consented.
     *
     * @param id Filter id.
     *
     * @returns True if consent is granted for filter, otherwise false.
     */
    public async isConsentedFilter(id: number): Promise<boolean> {
        if (this.consentedFilterIds === null) {
            this.consentedFilterIds = await AnnoyancesConsentApi.getConsentFromStorage();
        }
        return this.consentedFilterIds.has(id);
    }
}

export const annoyancesConsent = new AnnoyancesConsentApi();
