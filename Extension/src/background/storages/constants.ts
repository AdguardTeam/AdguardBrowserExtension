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
 * Name of the IndexedDB database used by the extension.
 */
export const IDB_STORAGE_NAME = 'adguardIDB';

/**
 * Version of the IndexedDB database used by the extension.
 */
export const IDB_STORAGE_VERSION = 1;

/**
 * Name of the object store inside the IndexedDB database.
 */
export const IDB_STORE_NAME = 'defaultStore';

/**
 * Separator between a storage key prefix and a filter identifier.
 */
export const FILTER_STORAGE_KEY_COMBINER = '_';

/**
 * Prefix of the storage key that contains preprocessed filter content.
 */
export const FILTER_CONTENT_STORAGE_KEY = 'filterContent';

/**
 * Prefix of the storage key that contains filter conversion data.
 */
export const FILTER_CONVERSION_DATA_STORAGE_KEY = 'conversionData';
