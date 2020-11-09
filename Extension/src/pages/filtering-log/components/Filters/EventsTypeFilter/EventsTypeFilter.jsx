import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';

import { rootStore } from '../../../stores/RootStore';

import './events-type-filter.pcss';

const EventsTypeFilter = observer(() => {
    const { logStore } = useContext(rootStore);
    const { eventTypes, filterByEventType } = logStore;

    const btnTypeHandler = (e) => {
        logStore.setFilterEventType(e.target.value);
    };

    const eventsTypesButtonClassName = (type) => classNames(
        'events-types__type',
        { active: eventTypes[type] === filterByEventType },
    );

    const renderTypes = () => {
        const types = Object.keys(eventTypes);

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
