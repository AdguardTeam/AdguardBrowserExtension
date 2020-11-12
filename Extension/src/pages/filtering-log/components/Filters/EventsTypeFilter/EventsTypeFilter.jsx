import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';

import { rootStore } from '../../../stores/RootStore';

import './events-type-filter.pcss';

const EventsTypeFilter = observer(() => {
    const { logStore } = useContext(rootStore);
    const { eventTypesFilters } = logStore;

    const btnTypeHandler = (e) => {
        logStore.setEventTypesFiltersValue(e.target.value);
    };

    const eventsTypesButtonClassName = (type) => classNames(
        'events-types__type',
        { active: eventTypesFilters[type].value },
    );

    const renderTypes = () => {
        const types = Object.keys(eventTypesFilters);

        return types.map((type) => (
            <button
                className={eventsTypesButtonClassName(type)}
                type="button"
                onClick={btnTypeHandler}
                value={type}
                key={type}
            >
                {type}
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
