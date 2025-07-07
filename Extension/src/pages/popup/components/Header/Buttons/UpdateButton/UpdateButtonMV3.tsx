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

import React, { useContext, useState } from 'react';

import { translator } from '../../../../../../common/translators/translator';
import { Icon } from '../../../../../common/components/ui/Icon';
import { popupStore } from '../../../../stores/PopupStore';

export const UpdateButtonMV3 = () => {
    const store = useContext(popupStore);

    const { checkUpdatesMV3, updateExtensionMV3, extensionUpdateAvailable } = store;

    const [updateChecking, setUpdateChecking] = useState(false);

    const handleCheckUpdatesClick = async () => {
        if (!__IS_MV3__) {
            throw new Error('Extension update is not supported in MV2');
        }

        setUpdateChecking(true);
        await checkUpdatesMV3();
        setUpdateChecking(false);
    };

    const handleUpdateExtensionClick = async (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        await updateExtensionMV3();
    };

    if (extensionUpdateAvailable) {
        return (
            <button
                className="button popup-header__button"
                disabled={!extensionUpdateAvailable}
                type="button"
                onClick={handleUpdateExtensionClick}
                title={translator.getMessage('options_updates_available_title')}
            >
                <Icon
                    id="#update-available"
                    classname="icon--24 icon--header icon--header--update-available"
                    aria-hidden="true"
                />
            </button>
        );
    }

    return (
        <>
            <div
                role="status"
                className="sr-only"
                aria-live="assertive"
                tabIndex={-1}
                aria-hidden={!updateChecking}
            >
                {updateChecking ? translator.getMessage('options_checking_for_updates_in_progress') : ''}
            </div>
            <button
                className="button popup-header__button"
                disabled={updateChecking}
                type="button"
                onClick={handleCheckUpdatesClick}
                title={translator.getMessage('options_check_update')}
            >
                <Icon
                    id="#reload"
                    classname="icon--24 icon--header"
                    animationCondition={updateChecking}
                    animationClassname="icon--loading"
                    aria-hidden="true"
                />
            </button>
        </>
    );
};
