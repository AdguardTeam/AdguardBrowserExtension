import React, { useState, useEffect, useRef } from 'react';

import { Portal } from '../../Portal/Portal';
import { Tooltip } from '../Tooltip';

const TOOLTIP_SHOW_DELAY_MS = 500;

/*
    Wrap child container for handle tooltips rendering in overlay on hover
*/
export const Popover = ({ text, children, ...props }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const timer = useRef();

    // clear timer on unmounting
    useEffect(() => {
        return () => {
            clearTimeout(timer.current);
        };
    }, []);

    const handleMouseEnter = (e) => {
        const rect = e.target.getBoundingClientRect();

        setTooltipPosition({
            x: rect.left,
            y: rect.bottom,
        });

        timer.current = setTimeout(() => {
            setShowTooltip(true);
        }, TOOLTIP_SHOW_DELAY_MS);
    };

    const handleMouseLeave = () => {
        clearTimeout(timer.current);
        setShowTooltip(false);
    };
    return (
        <div {...props} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {showTooltip && (
                <Portal id="root-portal">
                    <Tooltip position={tooltipPosition} text={text} />
                </Portal>
            )}
            {children}
        </div>
    );
};
