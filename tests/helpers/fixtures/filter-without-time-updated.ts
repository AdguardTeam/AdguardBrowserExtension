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

/**
 * Fake filter text WITHOUT `! TimeUpdated:` metadata tag.
 * Used to test Last-Modified header fallback behavior.
 */
const fakeFilterWithoutTimeUpdated = `! Title: Fake filter without TimeUpdated
! Description: Filter for testing Last-Modified header fallback
! Version: 1.0.0.0
! Expires: 4 days (update frequency)
!
||example.com^$document
||example.org^##h1`;

/**
 * Fake filter text WITH `! TimeUpdated:` metadata tag.
 * Used for comparison: TimeUpdated metadata should take priority over Last-Modified header.
 */
const fakeFilterWithTimeUpdated = `! Title: Fake filter with TimeUpdated
! Description: Filter for testing TimeUpdated priority
! Version: 1.0.0.0
! TimeUpdated: 2024-06-15T10:30:00+00:00
! Expires: 4 days (update frequency)
!
||example.com^$document
||example.org^##h1`;

export { fakeFilterWithoutTimeUpdated, fakeFilterWithTimeUpdated };
