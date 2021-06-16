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
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [isCopied, handleCopy] = useCopyToClipboard(1500);

    const handleInnerText = (e) => {
        handleCopy(e.target.innerText);
    };

    const handleClick = (e) => {
        e.preventDefault();
        handleInnerText(e);
        // use e.nativeEvent for access offsetX and offsetY event props
        const { offsetX, offsetY } = e.nativeEvent;

        // shifting position for prevent cursor flashing on tooltip render
        setTooltipPosition({
            x: offsetX + 4,
            y: offsetY + 4,
        });
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
                onClick={handleClick}
                onKeyUp={handleKeyUp}
            >
                {children}
            </div>
        </div>
    );
};
