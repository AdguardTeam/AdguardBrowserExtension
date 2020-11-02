import React from 'react';

import './filters.pcss';
import { TabSelector } from './TabSelector/TabSelector';

const Filters = () => {
    return (
        <>
            <div className="filters-group">
                <div className="filters-item">
                    <TabSelector />
                </div>
                <div className="filters-item">Search</div>
            </div>
            <div className="filters-group">
                <div className="filters-item">Request type filters</div>
                <div className="filters-item">Miscellaneous filters</div>
            </div>
        </>
    );
};

export { Filters };
