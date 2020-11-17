import React from 'react';

import { TabSelector } from './TabSelector';
import { EventsSearch } from './EventsSearch';
import { EventsTypeFilter } from './EventsTypeFilter';
import { MiscellaneousFilters } from './MiscellaneousFilters';

import './filters.pcss';

const Filters = () => {
    return (
        <div className="filters">
            <div className="filters__tab-selector">
                <TabSelector />
            </div>

            <div className="filters__events-search">
                <EventsSearch />
            </div>

            <div className="hr" />

            <div className="filters__events-filters">
                <EventsTypeFilter />
            </div>

            <div className="filters__miscellaneous-filters">
                <MiscellaneousFilters />
            </div>

            <div className="hr" />
        </div>
    );
};

export { Filters };
