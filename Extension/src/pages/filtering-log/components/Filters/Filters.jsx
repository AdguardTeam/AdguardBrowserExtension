import React, { useState, useRef } from 'react';

import { Actions } from '../Actions';
import { EventsTypeFilter } from './EventsTypeFilter';
import { MiscellaneousFilters } from './MiscellaneousFilters';
import { Icon } from '../../../common/components/ui/Icon';
import { isVerticalScroll } from '../../../helpers';

import './filters.pcss';

const Filters = () => {
    const [leftArrow, setLeftArrow] = useState(false);
    const [rightArrow, setRightArrow] = useState(true);
    const ref = useRef();
    const scrollTags = (e) => {
        const { target: { scrollLeft, scrollWidth, clientWidth } } = e;
        const maxScrollLeft = scrollWidth - clientWidth;

        setLeftArrow(scrollLeft > 0);
        setRightArrow(maxScrollLeft > scrollLeft);
    };

    const handleWheel = (e) => {
        if (isVerticalScroll(e.deltaY, e.deltaX)) {
            if (e.deltaY < 0) ref.current.scrollLeft += 10;
            else ref.current.scrollLeft -= 10;
        }
    };

    return (
        <div className="filters">
            <div className="filters__nav">
                <Actions />
            </div>

            <div className="filters__events-tags">
                <div
                    ref={ref}
                    onScroll={scrollTags}
                    onWheel={handleWheel}
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
