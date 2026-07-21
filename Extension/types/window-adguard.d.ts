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

declare global {
    interface Navigator {
        /**
         * User-Agent Client Hints API.
         *
         * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgentData
         */
        userAgentData?: {
            /**
             * Whether the device is a mobile device.
             */
            mobile: boolean;

            /**
             * Returns a Promise that resolves with the requested high entropy values.
             *
             * @param hints Array of hint names to request.
             *
             * @returns Promise resolving to an object containing the requested hints.
             */
            getHighEntropyValues: (hints: string[]) => Promise<Record<string, string>>;
        };
    }

    interface Window {
        adguard: {
            /**
             * For changing log level during runtime without call to
             * tswebextension update.
             */
            logger: Logger;

            /**
             * For integration tests.
             */
            configure: (config: Configuration) => Promise<ConfigurationResult>;

            /**
             * Used to trigger autoUpdate function for tests.
             */
            autoUpdate: (forceUpdate?: boolean) => Promise<FilterMetadata[]>;

            /**
             * Used to mock update check in CWS for tests.
             */
            mockUpdateCheckInCws: boolean | undefined;
        };
    }
}

export {}; // This ensures the file is treated as a module
