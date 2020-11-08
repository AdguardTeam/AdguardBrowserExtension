import React from 'react';

import { TabSelector } from './TabSelector';
import { EventsSearch } from './EventsSearch';
import { Actions } from './Actions';
import { EventsTypeFilter } from './EventsTypeFilter';
import { MiscellaneousFilters } from './MiscellaneousFilters';

import './filters.pcss';

const Filters = () => {
    return (
        <div className="filters">
            <div className="filters__filters-col col-left">
                <img src="../assets/images/shield.svg" alt="logo" className="logo-icon" />
                <TabSelector />
            </div>
            <div className="filters__filters-col col-right">
                <Actions />
            </div>
            <div className="filters__filters-col col-left col-thin">
                <EventsSearch />
            </div>
            <div className="filters__filters-col col-right col-thin">
                <EventsTypeFilter />
                <MiscellaneousFilters />
            </div>
        </div>
    );
};

export { Filters };
