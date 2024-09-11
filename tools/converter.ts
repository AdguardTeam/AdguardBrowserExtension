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

import { convertFiltersToRulesets } from './resources/build-rule-sets';

/**
 * Converts adblocking rules from the .txt files to their declarative presentation.
 *
 * This command is needed only for debug declarative rulesets: edit filters
 * right in the source dir and rebuild the rulesets.
 * But it's not needed for the production build, because the production build
 * already contains builded rulesets from `@adguard/dnr-rulesets`.
 */
const converter = async () => {
    await convertFiltersToRulesets();
};

(async () => {
    await converter();
})();
