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

// Variable passed from webpack that will be primitive at runtime.
declare const IS_FIREFOX_AMO: boolean;

// Variables passed from webpack that will be primitive at runtime.
declare const IS_RELEASE: boolean;
declare const IS_BETA: boolean;

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __IS_MV3__: boolean;

// Telemetry service URL passed from webpack DefinePlugin
declare const TELEMETRY_URL: string;
