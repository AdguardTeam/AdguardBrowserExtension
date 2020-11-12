import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';

import { rootStore } from '../../../stores/RootStore';

import './events-type-filter.pcss';

const EventsTypeFilter = observer(() => {
    const { logStore } = useContext(rootStore);
    const { eventTypesFilters } = logStore;

    const btnTypeHandler = (e) => {
        logStore.toogleEventTypesFilter(e.target.value);
    };

    const eventsTypesButtonClassName = (name) => classNames(
        'events-types__type',
        { active: eventTypesFilters.find((filter) => filter.name === name).value },
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
                {renderTypes()}
            </div>
        </>
    );
});

export { EventsTypeFilter };
