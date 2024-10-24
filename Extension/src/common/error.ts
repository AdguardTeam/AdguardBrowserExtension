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

type ErrorWithMessage = {
    message: string
};

type ErrorLike = ErrorWithMessage & {
    name: string;
    stack?: string;
};

const NETWORK_ERROR_MESSAGES: ReadonlySet<string> = new Set([
    'network error',                                     // Chrome
    'Failed to fetch',                                   // Chrome, Edge, Yandex browser
    'NetworkError when attempting to fetch resource.',   // Firefox
]);

/**
 * Checks if error has message.
 *
 * @param error Error object.
 */
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
    return (
        typeof error === 'object'
        && error !== null
        && 'message' in error
        && typeof (error as Record<string, unknown>).message === 'string'
    );
}

/**
 * Checks if the error is ErrorLike.
 *
 * @param error Error object.
 */
function isErrorLike(error: unknown): error is ErrorLike {
    return (
        isErrorWithMessage(error)
        && 'name' in error
        && typeof (error as ErrorLike).name === 'string'
    );
}

/**
 * Converts error to the error with message.
 *
 * @param maybeError Possible error.
 */
function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
    if (isErrorWithMessage(maybeError)) {
        return maybeError;
    }

    try {
        return new Error(JSON.stringify(maybeError));
    } catch {
        // fallback in case there's an error stringifying the maybeError
        // like with circular references for example.
        return new Error(String(maybeError));
    }
}

/**
 * Converts error object to error with message. This method might be helpful to handle thrown errors.
 *
 * @param error Error object.
 *
 * @returns Message of the error.
 */
export function getErrorMessage(error: unknown): string {
    // Special case: pretty print Zod errors
    if (error instanceof ZodError) {
        return fromZodError(error).toString();
    }

    return toErrorWithMessage(error).message;
}

/**
 * Checks if the error is a network error.
 *
 * @param error Error object.
 *
 * @returns True if the error is a network error, false otherwise.
 */
export function isNetworkError(error: unknown): boolean {
    // Check if the error is an instance of ErrorLike and is not a TypeError
    if (!isErrorLike(error) || error.name !== 'TypeError') {
        return false;
    }

    // Check if the error message is in the set of network error messages
    return NETWORK_ERROR_MESSAGES.has(error.message);
}
