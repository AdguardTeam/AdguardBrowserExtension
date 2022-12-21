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

/**
 * Helper class for work with semver
 *
 * Parsed semver string saves in {@link data} property.
 * We save first {@link MAX_LENGTH} parts of parsed string.
 * If there are less than {@link MAX_LENGTH} parts in the version, the missing ones are filled with zeros
 * For example, entry string `1.1` will be parsed as `[1, 1, 0, 0]`.
 *
 * @param version - semver string
 * @class
 * @throws error, if passed string cannot be parsed
 */
export class Version {
    private static MAX_LENGTH = 4;

    // splitted semver
    public data: number[] = [];

    constructor(version: unknown) {
        const parts = String(version || '').split('.', Version.MAX_LENGTH);

        for (let i = 0; i < Version.MAX_LENGTH; i += 1) {
            if (parts[i] === '') {
                throw new Error(`Found empty part in string '${version}'`);
            }

            const part = parts[i] || '0';

            if (part.length > 1 && part.startsWith('0')) {
                throw new Error(`Can not parse ${version}. Leading zeros are not allowed in the version parts`);
            }

            if (Number.isNaN(Number.parseInt(part, 10))) {
                throw new Error(`Can not parse '${version}' string`);
            }

            this.data[i] = Math.max(Number(part), 0);
        }
    }

    /**
     * Compare current semver with passed
     *
     * @param version - {@link Version} instance
     * @returns number, indicates the result of the comparison (1 - greater, -1 - less, 0 - equals).
     * @throws error, if some version data is invalid
     */
    public compare(version: Version): number {
        for (let i = 0; i < Version.MAX_LENGTH; i += 1) {
            const leftPart = this?.data?.[i];
            const rightPart = version?.data?.[i];

            if (typeof leftPart !== 'number' || typeof rightPart !== 'number') {
                throw new Error('Can not compare versions');
            }

            if (leftPart > rightPart) {
                return 1;
            }
            if (leftPart < rightPart) {
                return -1;
            }
        }
        return 0;
    }
}
