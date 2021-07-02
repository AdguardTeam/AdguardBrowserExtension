import React, { useState, useEffect, useRef } from 'react';

import { Portal } from '../../Portal';
import { Tooltip } from '../Tooltip';

const TOOLTIP_SHOW_DELAY_MS = 500;

/*
    Wrap child container for handle tooltips rendering in overlay on hover
*/
export const Popover = ({
    text,
    delay,
    children,
    ...props
}) => {
    const [tooltip, setTooltip] = useState({
        visible: false,
        position: null,
    });

    const timer = useRef();

    // clear timer on unmounting
    useEffect(() => {
        return () => {
            clearTimeout(timer.current);
        };
    }, []);

    const handleMouseEnter = (e) => {
        const rect = e.target.getBoundingClientRect();

        timer.current = setTimeout(() => {
            setTooltip({
                visible: true,
                position: {
                    x: rect.left + window.scrollX,
                    y: rect.bottom + window.scrollY,
                },
            });
        }, delay || TOOLTIP_SHOW_DELAY_MS);
    };

    const handleMouseLeave = () => {
        clearTimeout(timer.current);
        setTooltip({
            visible: false,
            position: null,
        });
    };

    return (
        <div
            className="popover"
            {...props}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {tooltip.visible && (
                <Portal id="root-portal">
                    <Tooltip position={tooltip.position} text={text} />
                </Portal>
            )}
            {children}
        </div>
    );
};
