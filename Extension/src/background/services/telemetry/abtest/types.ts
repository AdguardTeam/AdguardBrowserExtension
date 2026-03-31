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

import type zod from 'zod';

import { type experimentSlotSchema } from '../../../schema/telemetry/sessionStartResponse';

/**
 * Fixed Plausible Analytics custom property slot identifier for A/B experiments.
 * Derived from the Zod schema to ensure single source of truth.
 */
export type ExperimentSlot = zod.infer<typeof experimentSlotSchema>;

/**
 * In-memory variant cache type.
 * Maps ExperimentSlot keys to version_name strings.
 */
export type VariantCache = Partial<Record<ExperimentSlot, string>>;

/**
 * Variant assignment returned by the /api/v1/session_start endpoint.
 */
export interface SessionStartVariantAssignment {
    /**
     * The experiment identifier (matches what was sent in tests).
     */
    experiment_name: string;

    /**
     * The assigned variant identifier, stored in client cache and sent in event props.
     */
    version_name: string;
}

/**
 * Response from the /api/v1/session_start endpoint.
 */
export interface SessionStartResponse {
    /**
     * Map of experiment slots to assigned variant info.
     * Empty object when no experiments are active or the service is unavailable.
     */
    versions: Partial<Record<ExperimentSlot, SessionStartVariantAssignment>>;
}

/**
 * Request payload for the /api/v1/session_start endpoint.
 */
export interface SessionStartRequest {
    /**
     * Synthetic telemetry identifier.
     */
    synthetic_id: string;

    /**
     * Application type.
     */
    app_type: 'EXTENSION';

    /**
     * Extension version string.
     */
    version: string;

    /**
     * User agent info.
     */
    user_agent: {
        os: {
            name: string;
            platform?: string;
            version: string;
        };
        device?: {
            brand: string;
            model?: string;
        };
        browser?: {
            name: string;
            version: string;
        };
    };

    /**
     * Common telemetry props (locale, theme, etc.).
     */
    props?: {
        app_locale: string;
        system_locale: string;
        theme?: string;
        update_interval?: string | null;
    };

    /**
     * Map of experiment slots to experiment IDs for which no variant is currently cached.
     * Only unassigned slots are included.
     */
    tests: VariantCache;
}
