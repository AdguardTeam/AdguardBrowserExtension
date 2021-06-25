import React, { useRef, useLayoutEffect, useState } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

import './tooltip.pcss';

const TOOLTIP_EDGE_PADDING = 4; // px

export const Tooltip = ({ text, visible, position }) => {
    const [positionState, setPositionState] = useState(position);

    const ref = useRef();

    // sync state and props
    useLayoutEffect(() => {
        setPositionState(position);
    }, [position]);

    // recalculate tooltip position near screen edge
    useLayoutEffect(() => {
        const rect = ref.current.getBoundingClientRect();
        const offsetEdge = {
            top: rect.y,
            right: window.innerWidth - rect.right,
            bottom: window.innerHeight - rect.bottom,
            left: rect.x,
        };

        let needUpdate = false;
        const nextPosition = { ...positionState };

        if (offsetEdge.right < TOOLTIP_EDGE_PADDING) {
            nextPosition.x = positionState.x + offsetEdge.right - TOOLTIP_EDGE_PADDING;
            needUpdate = true;
        }

        if (offsetEdge.left < TOOLTIP_EDGE_PADDING) {
            nextPosition.x = positionState.x - offsetEdge.left + TOOLTIP_EDGE_PADDING;
            needUpdate = true;
        }

        if (offsetEdge.top < TOOLTIP_EDGE_PADDING) {
            nextPosition.y = positionState.y - offsetEdge.top + TOOLTIP_EDGE_PADDING;
            needUpdate = true;
        }

        if (offsetEdge.bottom < TOOLTIP_EDGE_PADDING) {
            nextPosition.y = positionState.y + offsetEdge.bottom - TOOLTIP_EDGE_PADDING;
            needUpdate = true;
        }

        if (needUpdate) {
            setPositionState(nextPosition);
        }
    }, [positionState]);

    const { x, y } = positionState;
    const positionTransform = { transform: `translate(${x}px, ${y}px)` };

    return (
        <div
            ref={ref}
            style={positionTransform}
            className={cn('tooltip', visible ? 'tooltip--on' : 'tooltip--off')}
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
