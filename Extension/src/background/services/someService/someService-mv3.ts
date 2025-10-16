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

import { SomeServiceCommon } from './someService-common';

/**
 * Manifest V3 specific implementation of SomeService.
 */
export class SomeService extends SomeServiceCommon {
    /**
     * Implementation of abstract method for MV3.
     *
     * @returns Test string value.
     */
    abstractcommonMethod(): string {
        // eslint-disable-next-line no-console
        console.log('overrided mv3 abstract method');

        return this.test;
    }

    /**
     * Method specific to Manifest V3 only.
     *
     * @returns Test string value.
     */
    MV3SpecificMethod(): string {
        // eslint-disable-next-line no-console
        console.log('mv3 method');

        return this.test;
    }
}
