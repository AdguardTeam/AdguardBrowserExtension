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

import { calculateChecksum } from '../../../tools/resources/download-filters';

const includedFakeFilterName = 'included-fake-filter.txt';

const fakeFilterWithIncludeWithoutChecksum = `! Title: Fake filter
! Description: Fake filter
! Version: 2.0.0.0
! TimeUpdated: 2023-02-01T00:00:00+00:00
! Expires: 4 days (update frequency)
!
/rule-from-fake-filter.txt
!#include ./${includedFakeFilterName}
/another-rule-from-fake-filter.txt`;

const fakeFilterWithInclude = `! Checksum: ${calculateChecksum(fakeFilterWithIncludeWithoutChecksum)}
${fakeFilterWithIncludeWithoutChecksum}`;

const includedFakeFilter = `/rule-from-included-fake-filter.txt
/another-rule-from-included-fake-filter.txt`;

export { fakeFilterWithInclude, includedFakeFilter, includedFakeFilterName };
