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

import { calculateChecksum } from '../../../tools/utils/checksum';

const fakeFilterWithVersion = (version: string) => {
    const currentDateWithoutMS = new Date().toISOString()
        .slice(0, -5);

    const filterWithoutChecksum = `! Title: Fake filter
! Description: Fake filter
! Version: ${version}
! TimeUpdated: ${currentDateWithoutMS}+00:00
! Expires: 4 days (update frequency)
!
||example.com^$document
||example.org^##h1`;

    const checksum = calculateChecksum(filterWithoutChecksum);
    return `! Checksum: ${checksum}
${filterWithoutChecksum}`;
};

export { fakeFilterWithVersion };
