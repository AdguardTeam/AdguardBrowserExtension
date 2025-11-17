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

/**
 * Customized error class for not implemented features.
 */
export class NotImplementedError extends Error {
    /**
     * Error name constant.
     */
    private static readonly ERROR_NAME = 'NotImplementedError';

    /**
     * Base error message.
     */
    private static readonly BASE_MESSAGE = 'Not implemented';

    /**
     * Constructs a new `NotImplementedError` instance.
     *
     * @param message Additional error message (optional).
     */
    constructor(message: string | undefined = undefined) {
        // Prepare the full error message
        const fullMessage = message
            ? `${NotImplementedError.BASE_MESSAGE}: ${message}`
            : NotImplementedError.BASE_MESSAGE;

        super(fullMessage);

        this.name = NotImplementedError.ERROR_NAME;
    }
}
