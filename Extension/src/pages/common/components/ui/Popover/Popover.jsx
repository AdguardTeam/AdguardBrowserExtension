import React, { useState, useEffect, useRef } from 'react';

import { AttachmentPortal } from '../../AttachmentPortal';
import { Tooltip } from '../Tooltip';

const TOOLTIP_SHOW_DELAY_MS = 1000;

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
                <AttachmentPortal rootId="root-portal" position={tooltip.position}>
                    <Tooltip text={text} />
                </AttachmentPortal>
            )}
            {children}
        </div>
    );
};
