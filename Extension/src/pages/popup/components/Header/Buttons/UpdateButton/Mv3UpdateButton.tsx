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

import { MIN_UPDATE_DISPLAY_DURATION_MS } from '../../../../../../common/constants';
import { sleepIfNecessary } from '../../../../../../common/sleep-utils';
import { translator } from '../../../../../../common/translators/translator';
import { Icon } from '../../../../../common/components/ui/Icon';
import { messenger } from '../../../../../services/messenger';
import { popupStore } from '../../../../stores/PopupStore';

const Mv3UpdateButton = observer(() => {
    const store = useContext(popupStore);

    const { isExtensionUpdateAvailable } = store;

    const handleCheckUpdatesClick = async () => {
        if (!__IS_MV3__) {
            throw new Error('Extension update is not supported in MV2');
        }
        await store.checkUpdatesMV3();
    };

    const handleUpdateExtensionClick = async (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        const start = Date.now();

        // reset update availability flag
        store.setIsExtensionUpdateAvailable(false);
        store.setIsExtensionUpdating(true);
        await messenger.updateExtensionFromPopupMV3();

        // Ensure minimum duration for smooth UI experience before extension reload
        await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);
        store.setIsExtensionUpdating(false);
    };

    if (isExtensionUpdateAvailable) {
        return (
            <button
                className="button popup-header__button"
                disabled={store.isExtensionUpdating}
                type="button"
                onClick={handleUpdateExtensionClick}
                title={translator.getMessage('update_available_title')}
            >
                <Icon
                    id="#update-available"
                    className="icon--24 icon--header icon--header--update-available"
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
                aria-hidden={!store.isExtensionUpdating}
            >
                {store.isExtensionUpdating ? translator.getMessage('update_checking_in_progress') : ''}
            </div>
            <button
                className="button popup-header__button"
                disabled={store.isExtensionUpdating}
                type="button"
                onClick={handleCheckUpdatesClick}
                title={translator.getMessage('update_check')}
            >
                <Icon
                    id="#reload"
                    className="icon--24 icon--header"
                    animationCondition={store.isExtensionUpdating}
                    animationClassName="icon--loading"
                    aria-hidden="true"
                />
            </button>
        </>
    );
});

export { Mv3UpdateButton as UpdateButton };
