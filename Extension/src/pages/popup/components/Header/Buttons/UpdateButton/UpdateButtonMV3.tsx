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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../../../common/translators/translator';
import { Icon } from '../../../../../common/components/ui/Icon';
import { popupStore, PopupStore } from '../../../../stores/PopupStore';
import { ExtensionUpdateState } from '../../../../../../background/services/extension-update/extension-update-machine';

export const UpdateButtonMV3 = observer(() => {
    const store = useContext(popupStore);

    const { updateState } = store;

    const handleCheckUpdatesClick = async () => {
        if (!__IS_MV3__) {
            throw new Error('Extension update is not supported in MV2');
        }
        await PopupStore.checkUpdatesMV3();
    };

    const handleUpdateExtensionClick = async (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        await PopupStore.updateExtensionMV3();
    };

    const isUpdateAvailable = updateState === ExtensionUpdateState.Available;

    if (isUpdateAvailable) {
        return (
            <button
                className="button popup-header__button"
                disabled={!isUpdateAvailable}
                type="button"
                onClick={handleUpdateExtensionClick}
                title={translator.getMessage('update_available_title')}
            >
                <Icon
                    id="#update-available"
                    classname="icon--24 icon--header icon--header--update-available"
                    aria-hidden="true"
                />
            </button>
        );
    }

    const isCheckingUpdate = updateState === ExtensionUpdateState.Checking;
    const isUpdating = updateState === ExtensionUpdateState.Updating;

    return (
        <>
            <div
                role="status"
                className="sr-only"
                aria-live="assertive"
                tabIndex={-1}
                aria-hidden={!isCheckingUpdate && !isUpdating}
            >
                {isCheckingUpdate || isUpdating ? translator.getMessage('update_checking_in_progress') : ''}
            </div>
            <button
                className="button popup-header__button"
                disabled={isCheckingUpdate || isUpdating}
                type="button"
                onClick={handleCheckUpdatesClick}
                title={translator.getMessage('update_check')}
            >
                <Icon
                    id="#reload"
                    classname="icon--24 icon--header"
                    animationCondition={isCheckingUpdate || isUpdating}
                    animationClassname="icon--loading"
                    aria-hidden="true"
                />
            </button>
        </>
    );
});
