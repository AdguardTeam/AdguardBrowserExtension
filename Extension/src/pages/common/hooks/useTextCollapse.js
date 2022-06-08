import { useState, useLayoutEffect } from 'react';
import { measureTextWidth } from '../../helpers';

export const useTextCollapse = (text, width, lineCountLimit, defaultCollapsed) => {
    const [isCollapsed, setCollapsed] = useState(defaultCollapsed);
    const [isOverflown, setOverflown] = useState(false);

    useLayoutEffect(() => {
        const textWidth = measureTextWidth(text);
        const isTextOverflown = textWidth > lineCountLimit * width;
        setOverflown(isTextOverflown);
    }, [text, width, lineCountLimit]);

    const toggleCollapsed = () => {
        setCollapsed(!isCollapsed);
    };

    return [isCollapsed, isOverflown, toggleCollapsed];
};
