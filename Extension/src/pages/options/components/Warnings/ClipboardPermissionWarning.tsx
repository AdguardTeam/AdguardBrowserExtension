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

import React, { useEffect, useState } from 'react';

import { Permissions } from '../../../../common/permissions';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { logger } from '../../../../common/logger';

/**
 * Clipboard permission warning component.
 *
 * This warning informs users that clipboard access is required for copy/paste
 * functionality in the User Rules and Allowlist editors.
 * Should only be rendered on Firefox Mobile where clipboard permissions are needed.
 */
export const ClipboardPermissionWarning = () => {
    const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const result = await Permissions.hasClipboardPermissions();
                setHasPermissions(result);
            } catch (e) {
                logger.error('[ext.ClipboardPermissionWarning]: error checking permissions:', e);
                setHasPermissions(false);
            }
        };

        checkPermissions();
    }, []);

    const handleAllowClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const granted = await Permissions.addClipboardPermissions();
            setHasPermissions(granted);
        } catch (err) {
            logger.error('[ext.ClipboardPermissionWarning]: error requesting permissions:', err);
        }
    };

    // Don't show if still checking or permissions already granted
    if (hasPermissions === null || hasPermissions) {
        return null;
    }

    const getAllowLink = (text: string) => (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a
            href="#"
            onClick={handleAllowClick}
        >
            {text}
        </a>
    );

    return (
        <div role="alert" className="warning section-warning">
            <span>
                {reactTranslator.getMessage('options_clipboard_permission_warning', {
                    a: getAllowLink,
                })}
            </span>
        </div>
    );
};
