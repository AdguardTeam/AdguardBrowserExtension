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
import { customAlphabet } from 'nanoid';

import { TELEMETRY_SYNTHETIC_ID_KEY } from '../../../common/constants';
import { logger } from '../../../common/logger';
import { browserStorage } from '../../storages';

/**
 * Generator for unique synthetic IDs used in telemetry.
 *
 * Synthetic ID is a random 8-character identifier consisting of characters [a-f1-9].
 * It's stored in browser storage and persists across sessions.
 */
export class SyntheticIdGenerator {
    /**
     * Synthetic ID alphabet.
     */
    private static readonly SYNTHETIC_ID_ALPHABET = 'abcdef123456789';

    /**
     * Synthetic ID size.
     */
    private static readonly SYNTHETIC_ID_SIZE = 8;

    /**
     * Retrieves synthetic ID from local storage. If it doesn't exist, generates a new one.
     *
     * @returns Synthetic ID.
     */
    public static async gainSyntheticId(): Promise<string> {
        const storedId = await browserStorage.get(TELEMETRY_SYNTHETIC_ID_KEY);

        if (!SyntheticIdGenerator.isValidSyntheticId(storedId)) {
            logger.debug('[ext.SyntheticIdGenerator.gainSyntheticId]: Generating new synthetic id');
            const newId = SyntheticIdGenerator.generateSyntheticId();
            await browserStorage.set(TELEMETRY_SYNTHETIC_ID_KEY, newId);

            return newId;
        }

        return storedId;
    }

    /**
     * Generates a new synthetic ID using the configured alphabet and size.
     *
     * @returns Synthetic ID.
     *
     * @throws Error if generated ID fails validation.
     */
    private static generateSyntheticId(): string {
        const nanoid = customAlphabet(
            SyntheticIdGenerator.SYNTHETIC_ID_ALPHABET,
            SyntheticIdGenerator.SYNTHETIC_ID_SIZE,
        );
        const syntheticId = nanoid();

        if (!SyntheticIdGenerator.isValidSyntheticId(syntheticId)) {
            throw new Error('Failed to generate valid synthetic ID');
        }

        return syntheticId;
    }

    /**
     * Checks if the given synthetic ID is valid.
     *
     * @param syntheticId Synthetic ID to check.
     *
     * @returns True if the synthetic ID is valid, false otherwise.
     */
    private static isValidSyntheticId(syntheticId: unknown): syntheticId is string {
        if (typeof syntheticId !== 'string' || syntheticId.length !== SyntheticIdGenerator.SYNTHETIC_ID_SIZE) {
            return false;
        }

        for (const symbol of syntheticId) {
            if (!SyntheticIdGenerator.SYNTHETIC_ID_ALPHABET.includes(symbol)) {
                return false;
            }
        }

        return true;
    }
}
