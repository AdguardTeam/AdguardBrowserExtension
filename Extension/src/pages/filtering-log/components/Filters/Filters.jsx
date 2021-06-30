import React, { useState, useRef, useEffect } from 'react';
import throttle from 'lodash/throttle';

import { Actions } from '../Actions';
import { EventsTypeFilter } from './EventsTypeFilter';
import { MiscellaneousFilters } from './MiscellaneousFilters';
import { Icon } from '../../../common/components/ui/Icon';
import { isVerticalScroll } from '../../../helpers';

import './filters.pcss';

const RESIZE_OBSERVER_THROTTLE_MS = 500;

const Filters = () => {
    const [leftArrow, setLeftArrow] = useState(false);
    const [rightArrow, setRightArrow] = useState(true);
    const ref = useRef();

    useEffect(() => {
        const target = ref.current;

        const observer = new ResizeObserver(throttle(([entry]) => {
            const { scrollLeft, scrollWidth, clientWidth } = entry.target;

            setLeftArrow(scrollLeft > 0);
            setRightArrow(scrollWidth - clientWidth > scrollLeft);
        }, RESIZE_OBSERVER_THROTTLE_MS));

        observer.observe(target);

        return () => {
            observer.unobserve(target);
        };
    }, [ref]);

    const scrollTags = () => {
        const { scrollLeft, scrollWidth, clientWidth } = ref.current;

        setLeftArrow(scrollLeft > 0);
        setRightArrow(scrollWidth - clientWidth > scrollLeft);
    };

    const scrollLeft = () => {
        const { width } = ref.current.getBoundingClientRect();
        ref.current.scrollLeft -= width;
    };

    const scrollRight = () => {
        const { width } = ref.current.getBoundingClientRect();
        ref.current.scrollLeft += width;
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
                    {leftArrow && (
                        <button
                            type="button"
                            onClick={scrollLeft}
                            className="filters__arrow filters__arrow--left"
                        >
                            <Icon classname="filters__arrow__icon" id="#arrow-scrollbar" />
                        </button>
                    )}
                    <MiscellaneousFilters />
                    <EventsTypeFilter />
                    {rightArrow && (
                        <button
                            type="button"
                            onClick={scrollRight}
                            className="filters__arrow filters__arrow--right"
                        >
                            <Icon classname="filters__arrow__icon" id="#arrow-scrollbar" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export { Filters };
