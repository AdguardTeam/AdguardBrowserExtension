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

// NOTE: Here important to use 'custom-filters-service' without path, because
// it is an alias for manifest-specific implementation of the custom filters
// service. It will be replaced with mv2 or mv3 version during the build
// via webpack.

/**
 * CustomFiltersService is a class which will be replaced with mv2 or mv3 implementation during
 * the build via webpack.
 *
 * By default, MV3 will be used.
 */
// TODO: Uncomment this line when custom filters will be supported for MV3.
// export { CustomFiltersService } from 'custom-filters-service';
