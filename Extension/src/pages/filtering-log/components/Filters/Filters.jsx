import React from 'react';

import { TabSelector } from './TabSelector';
import { EventsSearch } from './EventsSearch';

import './filters.pcss';

const Filters = () => {
    return (
        <>
            <div className="filters-group">
                <div className="filters-item">
                    <TabSelector />
                </div>
                <div className="filters-item"><EventsSearch /></div>
            </div>
            <div className="filters-group">
                <div className="filters-item">Request type filters</div>
                <div className="filters-item">Miscellaneous filters</div>
            </div>
        </>
    );
};

export { Filters };
