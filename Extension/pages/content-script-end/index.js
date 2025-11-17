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

/**
 * !IMPORTANT Only chrome based browsers support devtools, we cut off devtools for other browsers
 *
 * TODO: We can merge content-script-end and content-script-start into one file,
 * because content-script-end has 50kb while content-script-start has 500kb - so
 * it would not significantly increase the size of the content-script file.
 */
/* @if devtools == true */
import { devtools } from '../../src/content-script/devtools/devtools';

devtools.init();
/* @endif */
