import React, { useState } from 'react';

import { Actions } from '../Actions';
import { EventsTypeFilter } from './EventsTypeFilter';
import { MiscellaneousFilters } from './MiscellaneousFilters';

import './filters.pcss';
import { Icon } from '../../../common/components/ui/Icon';

const Filters = () => {
    const [leftArrow, setLeftArrow] = useState(false);
    const [rightArrow, setRightArrow] = useState(true);
    const scrollTags = (e) => {
        const { target: { scrollLeft, scrollWidth, clientWidth } } = e;
        const maxScrollLeft = scrollWidth - clientWidth;

        setLeftArrow(scrollLeft > 0);
        setRightArrow(maxScrollLeft > scrollLeft);
    };

    return (
        <div className="filters">
            <div className="filters__nav">
                <Actions />
            </div>

            <div className="filters__events-tags">
                <div
                    onScroll={(e) => { scrollTags(e); }}
                    className="filters__events-filters"
                >
                    {leftArrow && <Icon id="#arrow-scrollbar" classname="filters__arrow filters__arrow--left" />}
                    <MiscellaneousFilters />
                    <EventsTypeFilter />
                    {rightArrow && <Icon id="#arrow-scrollbar" classname="filters__arrow filters__arrow--right" />}
                </div>
            </div>
        </div>
    );
};

export { Filters };
