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

import React, {
    useCallback,
    useContext,
    useState,
} from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../../common/translators/translator';
import { Icon } from '../../../../common/components/ui/Icon';
import { rootStore } from '../../../stores/RootStore';

import './filters-update.pcss';

const Mv3FiltersUpdate = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const [isUpdating, setIsUpdating] = useState(false);

    const updateClickHandler = useCallback(async () => {
        setIsUpdating(true);
        await settingsStore.updateExtensionMV3();
        setIsUpdating(false);
    }, [settingsStore, setIsUpdating]);

    const checkUpdatesTitle = translator.getMessage('update_check');
    const updateAvailableBtnTitle = translator.getMessage('update_available_update_btn');

    const renderContent = () => {
        if (settingsStore.isCheckingExtensionUpdate) {
            return (
                <div className="extension-update__info">
                    <Icon
                        id="#reload"
                        className="icon--24 icon--green-default"
                        animationCondition
                        animationClassName="icon--loading"
                        aria-hidden="true"
                    />
                    <div className="extension-update__text">
                        <div className="extension-update__title">
                            {translator.getMessage('update_checking_in_progress')}
                        </div>
                    </div>
                </div>
            );
        }

        if (isUpdating) {
            return (
                <div className="extension-update__info">
                    <Icon
                        id="#loading"
                        className="icon--24"
                        animationCondition
                        animationClassName="icon--loading"
                        aria-hidden="true"
                    />
                    <div className="extension-update__text">
                        <div className="extension-update__title">
                            {translator.getMessage('update_installing_in_progress_title')}
                        </div>
                        <div className="extension-update__desc">
                            {translator.getMessage('update_installing_in_progress_desc')}
                        </div>
                    </div>
                </div>
            );
        }

        if (settingsStore.isExtensionUpdateAvailable) {
            return (
                <>
                    <div className="extension-update__info">
                        <Icon
                            id="#update-available"
                            className="icon--24 icon--green-default"
                            aria-hidden="true"
                        />
                        <div className="extension-update__text">
                            <div className="extension-update__title">
                                {translator.getMessage('update_available_title')}
                            </div>
                            <div className="extension-update__desc">
                                {translator.getMessage('update_available_desc')}
                            </div>
                        </div>
                    </div>
                    <div className="extension-update__update-btn">
                        <button
                            type="button"
                            onClick={updateClickHandler}
                            className="button button--link button--link--underlined button--link--green"
                            title={updateAvailableBtnTitle}
                        >
                            {updateAvailableBtnTitle}
                        </button>
                    </div>
                </>
            );
        }

        return (
            <button
                type="button"
                onClick={settingsStore.checkUpdatesMV3}
                className="extension-update__info extension-update__check-btn"
                title={checkUpdatesTitle}
            >
                <Icon
                    id="#reload"
                    className="icon--24 icon--green-default"
                    aria-hidden="true"
                />
                <div className="extension-update__text">
                    <div className="extension-update__title">
                        {checkUpdatesTitle}
                    </div>
                </div>
            </button>
        );
    };

    return (
        <div className="extension-update">
            {renderContent()}
        </div>
    );
});

export { Mv3FiltersUpdate as FiltersUpdate };
