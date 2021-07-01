import React, { useRef, useLayoutEffect, useState } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

import './tooltip.pcss';

const TOOLTIP_EDGE_PADDING = 4; // px

export const Tooltip = ({ text, visible, position }) => {
    const [tooltipState, setTooltipState] = useState({
        visible: false,
        position,
    });

    const ref = useRef();

    useLayoutEffect(() => {
        /*
            Prevent scrollbar shift when tooltip renders
            with original position props near screen edge
        */
        const { body } = document;
        const hasBodyHorizontalScrollbar = body.scrollWidth > body.clientWidth;
        const hasBodyVerticalScrollbar = body.scrollHeight > body.clientHeight;

        const originalBodyOverflowY = window.getComputedStyle(body).overflowY;
        const originalBodyOverflowX = window.getComputedStyle(body).overflowX;

        if (!hasBodyHorizontalScrollbar) {
            body.style.overflowX = 'hidden';
        }

        if (!hasBodyVerticalScrollbar) {
            body.style.overflowY = 'hidden';
        }

        /*
            Put this function at the end of the macrotask stack
            to ensure that the DOM element is rendered on the page
        */
        setTimeout(() => {
            // we need to track if the tooltip exists in the next render
            if (!ref.current) {
                return;
            }

            // recalculate tooltip position near screen edge
            const rect = ref.current.getBoundingClientRect();
            const offsetEdge = {
                top: rect.y,
                right: window.innerWidth - rect.right,
                bottom: window.innerHeight - rect.bottom,
                left: rect.x,
            };

            let needPositionUpdate = false;
            const nextPosition = { ...position };

            if (offsetEdge.right < TOOLTIP_EDGE_PADDING) {
                nextPosition.x = position.x + offsetEdge.right - TOOLTIP_EDGE_PADDING;
                needPositionUpdate = true;
            }

            if (offsetEdge.left < TOOLTIP_EDGE_PADDING) {
                nextPosition.x = position.x - offsetEdge.left + TOOLTIP_EDGE_PADDING;
                needPositionUpdate = true;
            }

            if (offsetEdge.top < TOOLTIP_EDGE_PADDING) {
                nextPosition.y = position.y - offsetEdge.top + TOOLTIP_EDGE_PADDING;
                needPositionUpdate = true;
            }

            if (offsetEdge.bottom < TOOLTIP_EDGE_PADDING) {
                nextPosition.y = position.y + offsetEdge.bottom - TOOLTIP_EDGE_PADDING;
                needPositionUpdate = true;
            }

            if (needPositionUpdate) {
                setTooltipState({
                    visible: true,
                    position: nextPosition,
                });
            } else {
                setTooltipState({
                    visible: true,
                    position,
                });
            }

            // reset body scroll
            body.style.overflowX = originalBodyOverflowX;
            body.style.overflowY = originalBodyOverflowY;
        }, 0);
    }, [position]);

    const { x, y } = tooltipState.position;
    const positionTransform = { transform: `translate(${x}px, ${y}px)` };

    return (
        <div
            ref={ref}
            style={positionTransform}
            className={cn('tooltip', visible && tooltipState.visible ? 'tooltip--on' : 'tooltip--off')}
        >
            {text}
        </div>
    );
};

Tooltip.propTypes = {
    text: PropTypes.string.isRequired,
    visible: PropTypes.bool,
    position: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
    }),
};

Tooltip.defaultProps = {
    visible: true,
    position: {
        y: 0,
        x: 0,
    },
};
