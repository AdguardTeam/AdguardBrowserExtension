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

import { translator } from '../../../../../common/translators/translator';
import { Icon } from '../../../../common/components/ui/Icon';
import { ExtensionUpdateState } from '../../../../common/state-machines/extension-update-machine';
import { rootStore } from '../../../stores/RootStore';

import './filters-update.pcss';

const FiltersUpdateMV3 = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { extensionUpdateState } = settingsStore;

    const checkClickHandler = async () => {
        await settingsStore.checkUpdatesMV3();
    };

    const updateClickHandler = async () => {
        await settingsStore.updateExtensionMV3();
    };

    const checkUpdatesTitle = translator.getMessage('update_check');

    const CheckUpdatesBlock = (
        <button
            type="button"
            onClick={checkClickHandler}
            className="extension-update__info extension-update__check-btn"
            title={checkUpdatesTitle}
        >
            <Icon
                id="#reload"
                classname="icon--24 icon--green-default"
                aria-hidden="true"
            />
            <div className="extension-update__text">
                <div className="extension-update__title">
                    {checkUpdatesTitle}
                </div>
            </div>
        </button>
    );

    const CheckingUpdatesInProgressBlock = (
        <div className="extension-update__info">
            <Icon
                id="#reload"
                classname="icon--24 icon--green-default"
                animationCondition={extensionUpdateState === ExtensionUpdateState.Checking}
                animationClassname="icon--loading"
                aria-hidden="true"
            />
            <div className="extension-update__text">
                <div className="extension-update__title">
                    {translator.getMessage('update_checking_in_progress')}
                </div>
            </div>
        </div>
    );

    const updateAvailableBtnTitle = translator.getMessage('update_available_update_btn');

    const UpdatesAvailableBlock = (
        <>
            <div className="extension-update__info">
                <Icon
                    id="#update-available"
                    classname="icon--24 icon--green-default"
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
            <div>
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

    const UpdatesInstallingInProgressBlock = (
        <div className="extension-update__info">
            <Icon
                id="#loading"
                classname="icon--24"
                animationCondition={extensionUpdateState === ExtensionUpdateState.Updating}
                animationClassname="icon--loading"
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

    const getStateBlockMap = {
        [ExtensionUpdateState.Idle]: CheckUpdatesBlock,
        [ExtensionUpdateState.Checking]: CheckingUpdatesInProgressBlock,
        [ExtensionUpdateState.Available]: UpdatesAvailableBlock,
        [ExtensionUpdateState.Updating]: UpdatesInstallingInProgressBlock,
        [ExtensionUpdateState.NotAvailable]: CheckUpdatesBlock,
        [ExtensionUpdateState.UpdateFailed]: CheckUpdatesBlock,
    };

    return (
        <div className="extension-update">
            {getStateBlockMap[extensionUpdateState]}
        </div>
    );
});

export { FiltersUpdateMV3 };
