import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { popupStore } from '../../stores/PopupStore';
import { messenger } from '../../../services/messenger';

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
                <svg className="icon icon--logo">
                    <use xlinkHref="#logo" />
                </svg>
            </div>
            <div className="popup-header__buttons">
                {!applicationFilteringDisabled
                && (
                    <button
                        className="button"
                        type="button"
                        onClick={handlePauseClick}
                    >
                        <svg className="icon icon--button">
                            <use xlinkHref="#pause" />
                        </svg>
                    </button>
                )}
                {applicationFilteringDisabled
                && (
                    <button
                        className="button"
                        type="button"
                        onClick={handleEnableClick}
                    >
                        <svg className="icon icon--button">
                            <use xlinkHref="#start" />
                        </svg>
                    </button>
                )}
                <button
                    className="button"
                    type="button"
                    onClick={handleSettingsClick}
                >
                    <svg className="icon icon--button">
                        <use xlinkHref="#settings" />
                    </svg>
                </button>
            </div>
        </div>
    );
});
