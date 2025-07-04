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

import { Icon } from '../../../../common/components/ui/Icon';
import { translator } from '../../../../../common/translators/translator';
import { rootStore } from '../../../stores/RootStore';

import './filters-update.pcss';

const FiltersUpdateMV3 = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        filtersUpdating,
        extensionUpdateAvailable,
        extensionUpdating,
    } = settingsStore;

    const checkClickHandler = async () => {
        await settingsStore.checkUpdatesMV3();
    };

    const updateClickHandler = async () => {
        await settingsStore.updateExtensionMV3();
    };

    const getCheckUpdatesBlock = () => {
        const title = translator.getMessage('options_check_update');

        return (
            <button
                type="button"
                onClick={checkClickHandler}
                className="extension-update__info extension-update__check-btn"
                title={title}
            >
                <Icon
                    id="#reload"
                    classname="icon--24 icon--green-default"
                    aria-hidden="true"
                />
                <div className="extension-update__text">
                    <div className="extension-update__title">
                        {title}
                    </div>
                </div>
            </button>
        );
    };

    const getCheckingUpdatesInProgressBlock = () => (
        <div className="extension-update__info">
            <Icon
                id="#reload"
                classname="icon--24 icon--green-default"
                animationCondition={filtersUpdating}
                animationClassname="icon--loading"
                aria-hidden="true"
            />
            <div className="extension-update__text">
                <div className="extension-update__title">
                    {translator.getMessage('options_checking_for_updates_in_progress')}
                </div>
            </div>
        </div>
    );

    const getUpdatesAvailableBlock = () => {
        const btnTitle = translator.getMessage('options_updates_available_update_btn');

        return (
            <>
                <div className="extension-update__info">
                    <Icon
                        id="#update-available"
                        classname="icon--24 icon--green-default"
                        aria-hidden="true"
                    />
                    <div className="extension-update__text">
                        <div className="extension-update__title">
                            {translator.getMessage('options_updates_available_title')}
                        </div>
                        <div className="extension-update__desc">
                            {translator.getMessage('options_updates_available_desc')}
                        </div>
                    </div>
                </div>
                <div>
                    <button
                        type="button"
                        onClick={updateClickHandler}
                        className="button button--link button--link--underlined button--link--green"
                        title={btnTitle}
                    >
                        {btnTitle}
                    </button>
                </div>
            </>
        );
    };

    const getUpdatesInstallingInProgressBlock = () => (
        <div className="extension-update__info">
            <Icon
                id="#loading"
                classname="icon--24"
                animationCondition={extensionUpdating}
                animationClassname="icon--loading"
                aria-hidden="true"
            />
            <div className="extension-update__text">
                <div className="extension-update__title">
                    {translator.getMessage('options_updates_installing_in_progress_title')}
                </div>
                <div className="extension-update__desc">
                    {translator.getMessage('options_updates_installing_in_progress_desc')}
                </div>
            </div>
        </div>
    );

    const getNeededStateBlock = () => {
        let stateBlock = getCheckUpdatesBlock();

        if (filtersUpdating) {
            stateBlock = getCheckingUpdatesInProgressBlock();
        } else if (extensionUpdateAvailable) {
            stateBlock = getUpdatesAvailableBlock();
        } else if (extensionUpdating) {
            stateBlock = getUpdatesInstallingInProgressBlock();
        }

        return stateBlock;
    };

    return (
        <div className="extension-update">
            {getNeededStateBlock()}
        </div>
    );
});

export { FiltersUpdateMV3 };
