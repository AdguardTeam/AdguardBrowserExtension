import React, { useRef, useEffect } from 'react';
import { useOutsideClick } from '../../../hooks/useOutsideClick';
import { useOutsideFocus } from '../../../hooks/useOutsideFocus';
import { useSelect } from './SelectProvider';
import { Icon } from '../Icon';

import './select.pcss';

export const Select = ({
    id,
    handler,
    options,
    value,
}) => {
    const ref = useRef(null);
    const refList = useRef(null);

    const [hidden, setHidden] = useSelect(id);

    const renderItems = () => options.map((option) => {
        const { value: currentValue, title } = option;

        const handleOptionClick = (e) => {
            e.stopPropagation();
            handler(currentValue);
            setHidden(true);
        };

        return (
            <button
                type="button"
                className="select__item"
                onClick={handleOptionClick}
                key={currentValue}
                value={currentValue}
            >
                {title}
            </button>
        );
    });

    useEffect(() => {
        return () => {
            setHidden(true);
        };
    }, [setHidden]);

    useOutsideClick(ref, () => {
        setHidden(true);
    });

    useOutsideFocus(refList, () => {
        setHidden(true);
    });

    const handleSelectClick = (e) => {
        e.stopPropagation();
        setHidden(!hidden);
    };

    const currentValue = options.find((i) => i.value === value);
    const currentTitle = currentValue.title;

    return (
        <div id={id} className="select" ref={ref}>
            <button
                type="button"
                className="select__value"
                onClick={handleSelectClick}
            >
                {currentTitle}
            </button>
            <Icon
                id="#select"
                classname="icon--select select__ico"
            />
            {!hidden && (
                <div
                    className="select__list"
                    ref={refList}
                >
                    {renderItems(options)}
                </div>
            )}
        </div>
    );
};
