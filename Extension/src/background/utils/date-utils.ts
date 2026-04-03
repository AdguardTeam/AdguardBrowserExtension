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

import { logger } from '../../common/logger';

/**
 * Maximum allowed clock skew in milliseconds (5 minutes).
 *
 * Used to tolerate minor time differences between client and server.
 */
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * Parses an RFC 7231 HTTP-date string (Last-Modified header format) to milliseconds since UNIX epoch.
 *
 * @param header The Last-Modified header value (e.g., "Wed, 21 Oct 2015 07:28:00 GMT").
 *
 * @returns Timestamp in milliseconds since UNIX epoch, or null if parsing fails.
 */
export const parseLastModifiedHeader = (header: string | undefined): number | null => {
    if (!header) {
        return null;
    }

    try {
        const timestamp = new Date(header).getTime();

        if (!isValidTimestamp(timestamp)) {
            logger.warn(`[ext.parseLastModifiedHeader]: Invalid Last-Modified header: "${header}"`);
            return null;
        }

        return timestamp;
    } catch (error) {
        logger.warn(`[ext.parseLastModifiedHeader]: Failed to parse Last-Modified header: "${header}"`, error);
        return null;
    }
};

/**
 * Validates that a timestamp is a valid number, positive, and not too far in the future.
 *
 * @param timestamp Timestamp in milliseconds since UNIX epoch.
 *
 * @returns True if the timestamp is valid.
 */
export const isValidTimestamp = (timestamp: number): boolean => {
    // Check if timestamp is a valid number
    if (Number.isNaN(timestamp) || !Number.isFinite(timestamp)) {
        return false;
    }

    // Check if timestamp is positive
    if (timestamp <= 0) {
        return false;
    }

    // Check if timestamp is not too far in the future (allow some clock skew)
    const now = Date.now();
    if (timestamp > now + MAX_CLOCK_SKEW_MS) {
        logger.warn(`[ext.isValidTimestamp]: Timestamp is in the future: ${timestamp} (current: ${now})`);
        return false;
    }

    return true;
};

/**
 * Converts a timestamp in milliseconds since UNIX epoch to an ISO 8601 string.
 *
 * @param timestamp Timestamp in milliseconds since UNIX epoch.
 *
 * @returns ISO 8601 formatted date string.
 */
export const convertToISOString = (timestamp: number): string => {
    return new Date(timestamp).toISOString();
};
