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
 * How an inline editing action (save or cancel) was triggered.
 *
 * Only a pointer click on the row's action button is counted by telemetry; the
 * equivalent editor hotkeys (Enter / Ctrl(Cmd)+S / Escape) are not, so the
 * source is threaded from the button and the editor to the list handlers.
 */
export enum InlineActionSource {
    /**
     * The user clicked the row's checkmark or cross action button.
     */
    Click = 'click',

    /**
     * The user used the editor hotkey (Enter / Ctrl(Cmd)+S / Escape).
     */
    Keyboard = 'keyboard',
}
