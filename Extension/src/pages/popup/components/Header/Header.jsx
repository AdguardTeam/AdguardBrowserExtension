import React, { useContext, useState, useRef } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { popupStore } from '../../stores/PopupStore';
import { messenger } from '../../../services/messenger';
import { Icon } from '../../../common/components/ui/Icon';
import { addMinDurationTime } from '../../../../common/common-script';
import { MIN_FILTERS_UPDATE_DISPLAY_DURATION } from '../../../common/constants';

import './header.pcss';
import { reactTranslator } from '../../../../common/translators/reactTranslator';

export const Header = observer(() => {
    const store = useContext(popupStore);
    const [filtersUpdating, setFiltersUpdating] = useState(false);

    const { applicationFilteringDisabled } = store;

    const updateFiltersWithMinDuration = addMinDurationTime(
        messenger.updateFilters.bind(messenger),
        MIN_FILTERS_UPDATE_DISPLAY_DURATION,
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

    const handlePauseClick = async () => {
        await store.changeApplicationFilteringDisabled(true);
    };

    const handleSettingsClick = (e) => {
        e.preventDefault();
        messenger.openSettingsTab();
        window.close();
    };

    return (
        <div className="popup-header">
            <div className="popup-header__logo">
                <Icon
                    id="#logo"
                    classname="icon--logo"
                />
            </div>
            <div className="popup-header__buttons">
                <button
                    className={cn(
                        'button',
                        'popup-header__button',
                        { 'updating-filters': filtersUpdating },
                    )}
                    ref={refUpdatingBtn}
                    disabled={filtersUpdating}
                    type="button"
                    onClick={handleUpdateFiltersClick}
                    title={reactTranslator.getMessage('popup_header_update_filters')}
                >
                    <Icon
                        id="#update-filters"
                        classname="icon--update-filters"
                    />
                </button>
                {!applicationFilteringDisabled
                    && (
                        <button
                            className="button popup-header__button"
                            type="button"
                            onClick={handlePauseClick}
                            title={reactTranslator.getMessage('context_disable_protection')}
                        >
                            <Icon
                                id="#pause"
                                classname="icon--pause"
                            />
                        </button>
                    )}
                {applicationFilteringDisabled
                    && (
                        <button
                            className="button popup-header__button"
                            type="button"
                            onClick={handleEnableClick}
                            title={reactTranslator.getMessage('context_enable_protection')}
                        >
                            <Icon
                                id="#start"
                                classname="icon--button icon--start"
                            />
                        </button>
                    )}
                <button
                    className="button popup-header__button"
                    type="button"
                    onClick={handleSettingsClick}
                    title={reactTranslator.getMessage('options_settings')}
                >
                    <Icon
                        id="#settings"
                        classname="icon--settings"
                    />
                </button>
            </div>
        </div>
    );
});
