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

// FIXME (Slava): import one script file (previously downloaded from remote source)
// which shall be provided by web team.
import './imported-chunks/adg-blocked.js';
import './imported-chunks/back-btn.js';
import './imported-chunks/first.js';
import './imported-chunks/theme-manager.js';
import './imported-chunks/locales.js';
import { initBlockedPageHandler } from './page-handler';

// FIXME (Slava): remove later
// eslint-disable-next-line no-console
console.log('BLOCKED TEST');

initBlockedPageHandler();
