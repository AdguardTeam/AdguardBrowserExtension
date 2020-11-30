import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';

import { rootStore } from '../../../stores/RootStore';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

import './events-type-filter.pcss';

const EventsTypeFilter = observer(() => {
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

    return (
        <>
            <div className="events-types">
                <button
                    className={eventsAllTypesButtonClassName}
                    type="button"
                    onClick={handleAllClick}
                >
                    {reactTranslator.translate('filtering_type_all')}
                </button>
                {renderTypes()}
            </div>
        </>
    );
});

export { EventsTypeFilter };
