import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';

import { rootStore } from '../../../stores/RootStore';

import './events-type-filter.pcss';

const EventsTypeFilter = observer(() => {
    const { logStore } = useContext(rootStore);
    const { eventTypesFilters } = logStore;

    const btnTypeHandler = (e) => {
        logStore.toggleEventTypesFilter(e.target.value);
    };

    const btnAllTypesHandler = () => {
        logStore.toggleAllEventTypesFilters(eventTypesFilters.some((filter) => !filter.enabled));
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
                onClick={btnTypeHandler}
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
                    onClick={btnAllTypesHandler}
                    value="All"
                >
                    All
                </button>
                {renderTypes()}
            </div>
        </>
    );
});

export { EventsTypeFilter };
