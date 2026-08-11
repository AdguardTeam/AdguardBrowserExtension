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

import { logger } from '../../../../common/logger';

/**
 * localStorage key under which the User Rules view mode is persisted.
 */
export const VIEW_MODE_STORAGE_KEY = 'userRulesViewMode';

/**
 * Presentation modes of the User Rules section.
 */
export const ViewMode = {
    List: 'list',
    Editor: 'editor',
} as const;

/**
 * The persisted User Rules presentation mode.
 */
export type ViewModeValue = typeof ViewMode[keyof typeof ViewMode];

/**
 * Reads the persisted User Rules view mode from localStorage.
 *
 * Falls back to {@link ViewMode.List} when no value is stored, when reading
 * storage throws (e.g. disabled storage), or when the stored value is invalid.
 *
 * @returns The persisted view mode, or {@link ViewMode.List} by default.
 */
export const readViewMode = (): ViewModeValue => {
    try {
        const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
        return stored === ViewMode.Editor ? ViewMode.Editor : ViewMode.List;
    } catch {
        return ViewMode.List;
    }
};

/**
 * Persists the User Rules view mode to localStorage.
 *
 * Silently ignores storage failures, because the chosen mode is a non-critical
 * per-device UI preference.
 *
 * @param mode The view mode to persist.
 */
export const writeViewMode = (mode: ViewModeValue): void => {
    try {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch (e) {
        logger.error('[ext.view-mode]: error persisting user rules view mode:', e);
    }
};
