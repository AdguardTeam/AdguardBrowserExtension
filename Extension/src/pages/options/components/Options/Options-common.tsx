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
import { type RootStore } from '../../stores/RootStore';
import { NotifierType } from '../../../../common/constants';
import { type LongLivedConnectionCallbackMessage } from '../../../services/messenger';
import { updateFilterDescription } from '../../../helpers';
import { logger } from '../../../../common/logger';

/**
 * Creates a common message handler for processing extension events
 * Handles common events like filter updates, allowlist changes, and settings updates
 *
 * @param settingsStore - Settings store instance for managing application settings
 * @param uiStore - UI store instance for managing notifications and UI state
 *
 * @returns Async function that handles LongLivedConnectionCallbackMessage events
 */
export const createCommonMessageHandler = (
    settingsStore: RootStore['settingsStore'],
    uiStore: RootStore['uiStore'],
) => {
    return async (message: LongLivedConnectionCallbackMessage) => {
        const { type } = message;

        switch (type) {
            case NotifierType.RequestFilterUpdated: {
                await settingsStore.requestOptionsData();
                break;
            }
            case NotifierType.UpdateAllowlistFilterRules: {
                await settingsStore.getAllowlist();
                break;
            }
            case NotifierType.FiltersUpdateCheckReady: {
                const [updatedFilters] = message.data;
                settingsStore.refreshFilters(updatedFilters);
                uiStore.addNotification(updateFilterDescription(updatedFilters));
                break;
            }
            case NotifierType.SettingUpdated: {
                await settingsStore.requestOptionsData();
                break;
            }
            case NotifierType.FullscreenUserRulesEditorUpdated: {
                const [isOpen] = message.data;
                settingsStore.setFullscreenUserRulesEditorState(isOpen);
                break;
            }
            default: {
                logger.warn('[ext.Options-common]: Undefined message type:', type);
                break;
            }
        }
    };
};

/**
 * Array of common events that both MV2 and MV3 options pages listen to
 * These events handle filter updates, allowlist changes, and settings modifications
 */
export const COMMON_EVENTS = [
    NotifierType.RequestFilterUpdated,
    NotifierType.UpdateAllowlistFilterRules,
    NotifierType.FiltersUpdateCheckReady,
    NotifierType.SettingUpdated,
    NotifierType.FullscreenUserRulesEditorUpdated,
];
