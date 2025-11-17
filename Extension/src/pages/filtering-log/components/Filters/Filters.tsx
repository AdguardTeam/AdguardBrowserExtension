/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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
import { Icon } from '../../../common/components/ui/Icon';
import { isVerticalScroll } from '../../../helpers';
import { useResizeObserver } from '../../../common/hooks/useResizeObserver';

import { MiscellaneousFilters } from './MiscellaneousFilters';
import { EventsTypeFilter } from './EventsTypeFilter';

import './filters.pcss';

const RESIZE_OBSERVER_THROTTLE_MS = 500;

const Filters = () => {
    const [leftArrow, setLeftArrow] = useState(false);
    const [rightArrow, setRightArrow] = useState(true);
    const ref = useRef<HTMLDivElement>(null);

    const calcArrowState = useCallback(([entry]) => {
        const { scrollLeft, scrollWidth, clientWidth } = entry.target;

        /**
         * Call setState within requestAnimationFrame to prevent infinite loop
         */
        window.requestAnimationFrame(() => {
            setLeftArrow(scrollLeft > 0);
            setRightArrow(scrollWidth - clientWidth > scrollLeft);
        });
    }, []);

    useResizeObserver(ref, calcArrowState, RESIZE_OBSERVER_THROTTLE_MS);

    const scrollTags = () => {
        if (!ref.current) {
            return;
        }

        const { scrollLeft, scrollWidth, clientWidth } = ref.current;

        setLeftArrow(scrollLeft > 0);
        setRightArrow(scrollWidth - clientWidth > scrollLeft);
    };

    const scrollLeft = () => {
        if (!ref.current) {
            return;
        }

        const { width } = ref.current.getBoundingClientRect();

        ref.current.scrollLeft -= width;
    };

    const scrollRight = () => {
        if (!ref.current) {
            return;
        }

        const { width } = ref.current.getBoundingClientRect();

        ref.current.scrollLeft += width;
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!ref.current) {
            return;
        }

        if (isVerticalScroll(e.deltaY, e.deltaX)) {
            if (e.deltaY < 0) {
                ref.current.scrollLeft += 10;
            } else {
                ref.current.scrollLeft -= 10;
            }
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
                    className="filters__events-filters thin-scrollbar"
                >
                    {leftArrow && (
                        <button
                            type="button"
                            onClick={scrollLeft}
                            className="filters__arrow filters__arrow--left"
                            // Hide from keyboard navigation and screen readers
                            // Because they can access rest of filters without
                            // scrolling block to the left
                            aria-hidden="true"
                            tabIndex={-1}
                        >
                            <Icon id="#arrow-left" className="filters__arrow__icon" />
                        </button>
                    )}
                    <MiscellaneousFilters />
                    <EventsTypeFilter />
                    {rightArrow && (
                        <button
                            type="button"
                            onClick={scrollRight}
                            className="filters__arrow filters__arrow--right"
                            // Hide from keyboard navigation and screen readers
                            // Because they can access rest of filters without
                            // scrolling block to the right
                            aria-hidden="true"
                            tabIndex={-1}
                        >
                            <Icon id="#arrow-left" className="filters__arrow__icon" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export { Filters };
