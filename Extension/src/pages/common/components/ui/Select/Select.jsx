import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { useOutsideClick } from '../../../hooks/useOutsideClick';
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

    useOutsideClick(ref, () => {
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
            <div
                hidden={hidden}
                className="select__list"
            >
                {renderItems(options)}
            </div>
        </div>
    );
};

Select.propTypes = {
    id: PropTypes.string.isRequired,
    handler: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.object).isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
