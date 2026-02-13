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
 * A simple mock fetch polyfill for Vitest using XMLHttpRequest.
 * This implementation does NOT rely on setTimeout or any other timer APIs.
 *
 * Note: This polyfill is simplistic and does not handle all the edge cases
 * or advanced features of the standard fetch API (e.g., streaming, abort signals, etc.).
 */

interface FetchPolyfillResponse {
    ok: boolean;
    status: number;
    statusText: string;
    url: string;
    text(): Promise<string>;
    headers: {
      get(header: string): string | null;
    };
    text(): Promise<string>;
    json(): Promise<unknown>;
  }

/**
 * Helper function to parse raw header strings into a key-value map.
 *
 * @param rawHeaders - The string of raw headers from XHR.
 *
 * @returns The parsed headers as an object.
 */
function parseResponseHeaders(rawHeaders: string): Record<string, string> {
    const headerMap: Record<string, string> = {};
    const headerPairs = rawHeaders.trim().split(/[\r\n]+/);

    headerPairs.forEach((line) => {
        const parts = line.split(': ');
        const header = parts.shift()?.toLowerCase();
        const value = parts.join(': ');
        if (header) {
            headerMap[header] = value;
        }
    });

    return headerMap;
}

/**
 * Installs a global fetch polyfill based on XMLHttpRequest.
 */
export function mockGlobalFetch() {
    return async function fetchPolyfill(
        input: RequestInfo | URL,
        init?: RequestInit,
    ): Promise<FetchPolyfillResponse> {
        return new Promise<FetchPolyfillResponse>((resolve, reject) => {
            const url = typeof input === 'string' ? input : input.toString();
            const method = init?.method || 'GET';
            const headers = init?.headers || {};
            const body = init?.body ?? null;

            const xhr = new XMLHttpRequest();
            xhr.open(method, url, true);

            // Set request headers
            if (typeof headers === 'object' && !Array.isArray(headers)) {
                Object.entries(headers).forEach(([key, value]) => {
                    if (typeof value === 'string') {
                        xhr.setRequestHeader(key, value);
                    }
                });
            }

            xhr.onload = function () {
                const responseHeaders = parseResponseHeaders(xhr.getAllResponseHeaders() || '');
                const response: FetchPolyfillResponse = {
                    ok: xhr.status >= 200 && xhr.status < 300,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    url,
                    headers: {
                        get: (header: string) => responseHeaders[header.toLowerCase()] || null,
                    },
                    text: async () => xhr.responseText,
                    json: async () => {
                        try {
                            return JSON.parse(xhr.responseText);
                        } catch (e) {
                            // Return null or throw an error if JSON parsing fails
                            throw new Error('Failed to parse JSON');
                        }
                    },
                };

                resolve(response);
            };

            xhr.onerror = function () {
                reject(new Error('Network request failed'));
            };

            xhr.onabort = function () {
                reject(new Error('Fetch request was aborted'));
            };

            xhr.ontimeout = function () {
                reject(new Error('Fetch request timed out'));
            };

            xhr.send(body as XMLHttpRequestBodyInit | Document | null | undefined);
        });
    };
}
