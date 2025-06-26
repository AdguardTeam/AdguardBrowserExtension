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
 * File name where we store a version of dnr-rulesets which is used for the latest Full update.
 */
const FULL_UPDATE_DNR_RULESETS_VERSION_FILE_NAME = 'dnr-rulesets-version.txt';

/**
 * Directory containing the filters for MV3.
 */
const MV3_FILTERS_DIR = 'Extension/filters/chromium-mv3';

/**
 * Full update dnr-rulesets version file path.
 */
export const FULL_UPDATE_DNR_RULESETS_VERSION_FILE_PATH = `${MV3_FILTERS_DIR}/${FULL_UPDATE_DNR_RULESETS_VERSION_FILE_NAME}`;
