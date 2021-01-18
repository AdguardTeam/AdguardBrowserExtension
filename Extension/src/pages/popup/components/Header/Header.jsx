import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { popupStore } from '../../stores/PopupStore';
import { messenger } from '../../../services/messenger';
import { Icon } from '../../../common/components/ui/Icon';

import './header.pcss';
import { reactTranslator } from '../../../../common/translators/reactTranslator';

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
                    classname="icon--logo"
                />
            </div>
            <div className="popup-header__buttons">
                {!applicationFilteringDisabled
                && (
                    <button
                        className="button"
                        type="button"
                        onClick={handlePauseClick}
                        title={reactTranslator.getMessage('context_disable_protection')}
                    >
                        <Icon
                            id="#pause"
                            classname="icon--button"
                        />
                    </button>
                )}
                {applicationFilteringDisabled
                && (
                    <button
                        className="button"
                        type="button"
                        onClick={handleEnableClick}
                        title={reactTranslator.getMessage('context_enable_protection')}
                    >
                        <Icon
                            id="#start"
                            classname="icon--button"
                        />
                    </button>
                )}
                <button
                    className="button"
                    type="button"
                    onClick={handleSettingsClick}
                    title={reactTranslator.getMessage('options_settings')}
                >
                    <Icon
                        id="#settings"
                        classname="icon--button"
                    />
                </button>
            </div>
        </div>
    );
});
