import React, {
    useContext,
    useState,
    useRef,
    useEffect,
    forwardRef,
} from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';
import { nanoid } from 'nanoid';

import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { Tooltip } from '../ui/Tooltip';
import { copyToClipboardStore } from './copyToClipboardStore';
import { AttachmentPortal } from '../AttachmentPortal';

import './copy-to-clipboard.pcss';

const TOOLTIP_MOUSE_PADDING_PX = 4;

export const CopyToClipboard = observer(forwardRef(({
    children,
    className,
    wrapperClassName,
}, ref) => {
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const { currentContainerId, copyText, resetTooltipId } = useContext(copyToClipboardStore);

    const containerRef = useRef(nanoid());

    // reset tooltip id on component unmount or text changing
    useEffect(() => {
        return () => {
            resetTooltipId();
        };
    }, [children, resetTooltipId]);

    const copyInnerText = (e) => {
        copyText(containerRef.current, e.target.innerText);
    };

    const handleClick = (e) => {
        e.preventDefault();
        // if user highlights text, don't copy whole inner content
        const selectedText = document.getSelection().toString();
        if (selectedText.length < 1) {
            copyInnerText(e);

            // shifting position for prevent cursor flashing on tooltip render
            setTooltipPosition({
                x: e.clientX + TOOLTIP_MOUSE_PADDING_PX,
                y: e.clientY + TOOLTIP_MOUSE_PADDING_PX,
            });
        }
    };

    const handleKeyUp = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const rect = e.target.getBoundingClientRect();
            copyInnerText(e);
            setTooltipPosition({ x: rect.left, y: rect.bottom });
        }
    };

    return (
        <div className={cn('copy-to-clipboard-wrapper', wrapperClassName)}>
            {(containerRef.current === currentContainerId) && (
                <AttachmentPortal rootId="root-portal" position={tooltipPosition}>
                    <Tooltip text={reactTranslator.getMessage('filtering_modal_copied')} />
                </AttachmentPortal>
            )}
            <div
                ref={ref}
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
}));
