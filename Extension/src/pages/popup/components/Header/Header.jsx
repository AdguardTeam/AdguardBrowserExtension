import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { popupStore } from '../../stores/PopupStore';
import { messenger } from '../../../services/messenger';
import { Icon } from '../ui/Icon';

import './header.pcss';

export const Header = observer(() => {
    const store = useContext(popupStore);

    const { applicationFilteringDisabled } = store;

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
                    className="icon--logo"
                />
            </div>
            <div className="popup-header__buttons">
                {!applicationFilteringDisabled
                && (
                    <button
                        className="button"
                        type="button"
                        onClick={handlePauseClick}
                    >
                        <Icon
                            id="#pause"
                            className="icon--button"
                        />
                    </button>
                )}
                {applicationFilteringDisabled
                && (
                    <button
                        className="button"
                        type="button"
                        onClick={handleEnableClick}
                    >
                        <Icon
                            id="start"
                            className="icon--button"
                        />
                    </button>
                )}
                <button
                    className="button"
                    type="button"
                    onClick={handleSettingsClick}
                >
                    <Icon
                        id="#settings"
                        className="icon--button"
                    />
                </button>
            </div>
        </div>
    );
});
