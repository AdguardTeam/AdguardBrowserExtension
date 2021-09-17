import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';
import { Tags } from '../Tags';

import './events-type-filter.pcss';
import { NAVIGATION_TAGS } from '../../../../../common/constants';

const EventsTypeFilter = observer(() => {
    const { logStore } = useContext(rootStore);

    const {
        eventTypesFilters,
        setEventTypesFilters,
    } = logStore;

    return (
        <div className="events-types">
            <div className="events-types__content">
                <Tags
                    type={NAVIGATION_TAGS.REGULAR}
                    tags={eventTypesFilters}
                    setTags={setEventTypesFilters}
                />
            </div>
        </div>
    );
});

export { EventsTypeFilter };
