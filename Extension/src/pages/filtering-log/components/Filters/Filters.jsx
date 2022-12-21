/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {
    useState,
    useRef,
    useCallback,
} from 'react';

import { Actions } from '../Actions';
import { EventsTypeFilter } from './EventsTypeFilter';
import { MiscellaneousFilters } from './MiscellaneousFilters';
import { Icon } from '../../../common/components/ui/Icon';
import { isVerticalScroll } from '../../../helpers';
import { useResizeObserver } from '../../../common/hooks/useResizeObserver';

import './filters.pcss';

const RESIZE_OBSERVER_THROTTLE_MS = 500;

const Filters = () => {
    const [leftArrow, setLeftArrow] = useState(false);
    const [rightArrow, setRightArrow] = useState(true);
    const ref = useRef();

    const calcArrowState = useCallback(([entry]) => {
        const { scrollLeft, scrollWidth, clientWidth } = entry.target;

        /**
         * call setState within requestAnimationFrame to prevent inifinite loop
         */
        window.requestAnimationFrame(() => {
            setLeftArrow(scrollLeft > 0);
            setRightArrow(scrollWidth - clientWidth > scrollLeft);
        });
    }, []);

    useResizeObserver(ref, calcArrowState, RESIZE_OBSERVER_THROTTLE_MS);

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
