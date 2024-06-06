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
    useContext,
    useState,
    useRef,
} from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { popupStore } from '../../stores/PopupStore';
import { messenger } from '../../../services/messenger';
import { addMinDelayLoaderAndRemove } from '../../../common/components/helpers';
import { Icon } from '../../../common/components/ui/Icon';
import { addMinDurationTime } from '../../../../common/common-script';
import { MIN_FILTERS_UPDATE_DISPLAY_DURATION_MS } from '../../../common/constants';
import { translator } from '../../../../common/translators/translator';

import './header.pcss';

export const Header = observer(() => {
    const store = useContext(popupStore);
    const [filtersUpdating, setFiltersUpdating] = useState(false);

    const { applicationFilteringDisabled } = store;

    const updateFiltersWithMinDuration = addMinDurationTime(
        messenger.updateFilters,
        MIN_FILTERS_UPDATE_DISPLAY_DURATION_MS,
    );

    const refUpdatingBtn = useRef(null);

    const handleUpdateFiltersClick = async () => {
        refUpdatingBtn.current.blur();
        setFiltersUpdating(true);
        await updateFiltersWithMinDuration();
        setFiltersUpdating(false);
    };

    const handleEnableClick = async () => {
        await store.changeApplicationFilteringDisabled(false);
    };

    const handleEnableClickWrapper = addMinDelayLoaderAndRemove(
        store.setShowLoader,
        handleEnableClick,
    );

    const handlePauseClick = async () => {
        await store.changeApplicationFilteringDisabled(true);
    };

    const handlePauseClickWrapper = addMinDelayLoaderAndRemove(
        store.setShowLoader,
        handlePauseClick,
    );

    const handleSettingsClick = (e) => {
        e.preventDefault();
        messenger.openSettingsTab();
        window.close();
    };

    return (
        <div className="popup-header">
            <Icon
                id="#logo"
                classname="icon--logo"
            />
            <div className="popup-header__buttons">
                {!__IS_MV3__ && (
                    <button
                        className={cn(
                            'button',
                            'popup-header__button',
                        )}
                        ref={refUpdatingBtn}
                        disabled={filtersUpdating}
                        type="button"
                        onClick={handleUpdateFiltersClick}
                        title={translator.getMessage('popup_header_update_filters')}
                    >
                        <Icon
                            id="#reload"
                            classname="icon--24"
                            animationCondition={filtersUpdating}
                            animationClassname="icon--loading"
                        />
                    </button>
                )}
                {!applicationFilteringDisabled
                    && (
                        <button
                            className="button popup-header__button"
                            type="button"
                            onClick={handlePauseClickWrapper}
                            title={translator.getMessage('context_disable_protection')}
                        >
                            <Icon
                                id="#pause"
                                classname="icon--24"
                            />
                        </button>
                    )}
                {applicationFilteringDisabled
                    && (
                        <button
                            className="button popup-header__button"
                            type="button"
                            onClick={handleEnableClickWrapper}
                            title={translator.getMessage('context_enable_protection')}
                        >
                            <Icon
                                id="#start"
                                classname="icon--button icon--24"
                            />
                        </button>
                    )}
                <button
                    className="button popup-header__button"
                    type="button"
                    onClick={handleSettingsClick}
                    title={translator.getMessage('options_settings')}
                >
                    <Icon
                        id="#settings"
                        classname="icon--24"
                    />
                </button>
            </div>
        </div>
    );
});
