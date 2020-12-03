import React, { useState, useContext } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';
import Modal from 'react-modal';

import { rootStore } from '../../../stores/RootStore';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

import './events-type-filter.pcss';

const EventsTypeFilter = observer(() => {
    const [isOpened, setModalOpened] = useState(false);
    const openModal = () => setModalOpened(true);
    const closeModal = () => setModalOpened(false);

    const { logStore } = useContext(rootStore);
    const { eventTypesFilters } = logStore;

    const handleTypeClick = (e) => {
        logStore.toggleEventTypesFilter(e.target.value);
    };

    const handleAllClick = () => {
        logStore.toggleAllEventTypesFilters();
    };

    const eventsTypesButtonClassName = (name) => classNames(
        'events-types__type',
        { active: eventTypesFilters.find((filter) => filter.name === name).enabled },
    );

    const eventsAllTypesButtonClassName = classNames(
        'events-types__type',
        { active: !eventTypesFilters.some((filter) => !filter.enabled) },
    );

    const renderTypes = () => {
        const filters = eventTypesFilters.map((filter) => filter.name);

        return filters.map((name) => (
            <button
                className={eventsTypesButtonClassName(name)}
                type="button"
                onClick={handleTypeClick}
                value={name}
                key={name}
            >
                {name}
            </button>
        ));
    };

    const renderContent = () => (
        <>
            <button
                className={eventsAllTypesButtonClassName}
                type="button"
                onClick={handleAllClick}
            >
                {reactTranslator.translate('filtering_type_all')}
            </button>
            {renderTypes()}
        </>
    );

    return (
        <>
            <div className="events-types">
                <div className="events-types__content--desktop">
                    {renderContent()}
                </div>
                <div className="events-types__content--mobile">
                    <button
                        className="events-types__icon"
                        type="button"
                        onClick={openModal}
                    >
                        Content type
                    </button>
                    <Modal
                        isOpen={isOpened}
                        onRequestClose={closeModal}
                        className="content-type__modal"
                        style={
                            { overlay: { background: 'transparent' } }
                        }
                    >
                        {renderContent()}
                    </Modal>
                </div>
            </div>
        </>
    );
});

export { EventsTypeFilter };
