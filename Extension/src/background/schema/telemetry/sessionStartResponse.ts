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

/**
 * Schema for experiment slot identifiers.
 */
export const experimentSlotSchema = zod.enum(['experiment_1', 'experiment_2', 'experiment_3']);

/**
 * Schema for a single variant assignment from the session_start endpoint.
 */
const sessionStartVariantAssignmentSchema = zod.object({
    /**
     * The experiment identifier (matches what was sent in tests).
     */
    experiment_name: zod.string(),
    /**
     * The assigned variant identifier.
     */
    version_name: zod.string(),
}).nullable().optional();

/**
 * Schema for the session_start response.
 * Validates that versions is a record mapping experiment slots to variant assignments.
 * All fields are nullable/optional for robustness.
 */
export const sessionStartResponseSchema = zod.object({
    /**
     * Map of experiment slots to assigned variant info.
     */
    versions: zod.record(
        experimentSlotSchema,
        sessionStartVariantAssignmentSchema,
    ).optional().default({}),
});

/**
 * Inferred TypeScript type for the session_start response.
 */
export type SessionStartResponseData = zod.infer<typeof sessionStartResponseSchema>;
