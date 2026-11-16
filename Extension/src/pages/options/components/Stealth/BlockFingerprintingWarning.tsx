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

import React, { useEffect } from 'react';

import { logger } from '../../../../common/logger';
import { shouldShowCanvasProtectionUserScriptsWarning } from '../../../../common/user-scripts-api';
import { useVisibilityCheck } from '../../../common/hooks/useVisibilityCheck';
import { messenger } from '../../../services/messenger';
import { UserScriptsApiRequiredMessage } from '../Warnings';

/**
 * Warning about the missing user scripts API permission, shown under the
 * Block fingerprinting setting.
 *
 * Whenever the API is available, on mount or when the warning disappears, the
 * background is asked to re-apply the stored setting, so protection starts
 * without toggling the setting again even if the permission was granted while
 * the options page was closed.
 *
 * @returns Warning element or null when the permission is granted.
 */
export const BlockFingerprintingWarning = () => {
    const showWarning = useVisibilityCheck(shouldShowCanvasProtectionUserScriptsWarning);

    useEffect(() => {
        if (showWarning) {
            return;
        }

        messenger.reapplyCanvasProtection().catch((e) => {
            logger.error('[ext.BlockFingerprintingWarning]: failed to re-apply canvas protection:', e);
        });
    }, [showWarning]);

    if (!showWarning) {
        return null;
    }

    return (
        <div className="stealth__attention">
            <UserScriptsApiRequiredMessage
                devModeMessageKey="options_block_fingerprinting_developer_mode_required"
                allowUserScriptsMessageKey="options_block_fingerprinting_allow_user_scripts_required"
            />
        </div>
    );
};
