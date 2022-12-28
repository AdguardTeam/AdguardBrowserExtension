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

import _ from 'lodash';

/**
 * Helper util used for work with unknown type.
 */
export class Unknown {
    /**
     * Returns key from object with `unknown` type.
     *
     * @param obj Object with type `unknown`.
     * @param key Key for search and return its value from object.
     *
     * @returns Undefined if key doesn't exist in the object
     * or value of key in this object.
     */
    public static get = (obj: unknown, key: string): unknown | undefined => {
        return _.get(obj, key);
    };

    /**
     * Checks if property exists in the object, and narrows the type of the object.
     *
     * @param obj An unknown object.
     * @param key All possible keys of the object.
     * @returns True if property exists, otherwise false.
     */
    public static hasProp<K extends PropertyKey>(obj: unknown, key: K): obj is Record<K, unknown> {
        return key != null && obj != null && typeof obj === 'object' && key in obj;
    }
}
