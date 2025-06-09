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
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

import { getErrorMessage as loggerGetErrorMessage } from '@adguard/logger';

/**
 * Converts error object to error with message.
 * This method should be used to handle thrown errors from Zod to improve their
 * readability.
 *
 * Otherwise, "@adguard/logger" will use built-in error message conversion to string.
 *
 * @param error Error object.
 *
 * @returns Message of the error.
 */
export function getZodErrorMessage(error: unknown): string {
    // Special case: pretty print Zod errors
    if (error instanceof ZodError) {
        return fromZodError(error).toString();
    }

    return loggerGetErrorMessage(error);
}
