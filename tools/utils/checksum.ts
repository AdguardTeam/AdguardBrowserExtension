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

import crypto from 'crypto';

const CHECKSUM_PATTERN = /^\s*!\s*checksum[\s-:]+([\w\+/=]+).*[\r\n]+/i;

/**
 * Normalizes a response.
 *
 * @param response Filter rules response.
 *
 * @returns Normalized response.
 */
const normalizeResponse = (response: string): string => {
    const partOfResponse = response.substring(0, 200);
    const match = partOfResponse.match(CHECKSUM_PATTERN);
    if (match) {
        response = response.replace(match[0], '');
    }
    response = response.replace(/\r/g, '');
    response = response.replace(/\n+/g, '\n');
    return response;
};

/**
 * Calculates the checksum for a filter list.
 *
 * @param body Filter rules content.
 *
 * @returns Calculated checksum.
 */
export const calculateChecksum = (body: string): string => {
    return crypto.createHash('md5').update(normalizeResponse(body)).digest('base64').replace(/=/g, '');
};
