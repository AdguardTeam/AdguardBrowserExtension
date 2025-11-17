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
// NOTE: Here important to use 'engine' without path, because it is an alias for
// manifest-specific implementation of the engine. It will be replaced with MV2
// or MV3 version during the build via webpack.
import { Engine } from 'engine';

/**
 * Engine is a singleton instance of tswebextension wrapper which will be
 * replaced with MV2 or MV3 implementation during the build via webpack.
 *
 * By default, MV3 will be used.
 */
export const engine = new Engine();
