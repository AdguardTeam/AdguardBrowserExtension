import React, { useState } from 'react';
import cn from 'classnames';

import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { Tooltip } from '../ui/Tooltip';

import './copy-to-clipboard.pcss';

export const CopyToClipboard = ({
    children,
    className,
    wrapperClassName,
}) => {
    /*  We need to prevent copying when highlighting text

        difference between click and text highlighting based on the sequence of mouse events:

        mousedown -> mouseup  - click
        mousedown -> mousemove -> mouseup  - text highlighting

        Using boolean state shared between three handlers for detecting both actions
    */
    const [isCopyInit, handleCopyInit] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [isCopied, handleCopy] = useCopyToClipboard(1500);

    const handleInnerText = (e) => {
        handleCopy(e.target.innerText);
    };

    const handleMouseDown = () => {
        handleCopyInit(true);
    };

    const handleMouseMove = () => {
        if (isCopyInit) {
            handleCopyInit(false);
        }
    };

    const handleMouseUp = (e) => {
        e.preventDefault();
        if (isCopyInit) {
            handleInnerText(e);
            // use e.nativeEvent for access offsetX and offsetY event props
            const { offsetX, offsetY } = e.nativeEvent;

            // shifting position for prevent cursor flashing on tooltip render
            setTooltipPosition({
                x: offsetX + 4,
                y: offsetY + 4,
            });
        }
    };

    const handleKeyUp = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleInnerText(e);
            setTooltipPosition({ x: 0, y: -40 });
        }
    };

    return (
        <div className={cn('copy-to-clipboard-wrapper', wrapperClassName)}>
            {isCopied && (
                <Tooltip
                    visible
                    text={reactTranslator.getMessage('filtering_modal_copied')}
                    position={tooltipPosition}
                />
            )}
            <div
                className={cn('copy-to-clipboard', className)}
                role="button"
                tabIndex="0"
                title={reactTranslator.getMessage('filtering_modal_copy_to_clipboard')}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onKeyUp={handleKeyUp}
            >
                {children}
            </div>
        </div>
    );
};
