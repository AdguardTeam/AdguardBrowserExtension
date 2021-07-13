import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useOutsideClick } from '../../../hooks/useOutsideClick';
import { Icon } from '../Icon';

import './select.pcss';

const Select = (props) => {
    const ref = useRef(null);
    const {
        id, handler, options, value, selectDropdown, hideSelectDropdown,
    } = props;

    const [hidden, setHidden] = useState(true);

    const renderItems = () => options.map((option) => {
        const { value: currentValue, title } = option;

        return (
            <button
                type="button"
                className="select__item"
                onClick={() => handler(currentValue)}
                key={currentValue}
                value={currentValue}
            >
                {title}
            </button>
        );
    });

    useOutsideClick(ref, () => {
        setHidden(true);
        if (selectDropdown === id) {
            hideSelectDropdown();
        }
    });

    useEffect(() => {
        if (selectDropdown === id) {
            setHidden(false);
        }
    }, [id, selectDropdown]);

    const handleSelectClick = () => {
        if (hidden) {
            setHidden(false);
        }
    };

    const currentValue = options.find((i) => i.value === value);
    const currentTitle = currentValue.title;

    return (
        <div id={id} className="select">
            <button
                ref={ref}
                type="button"
                className="select__value"
                onClick={handleSelectClick}
            >
                {currentTitle}
            </button>
            <Icon id="#select" classname="icon--select select__ico" />
            <div
                hidden={hidden}
                className="select__list"
            >
                {renderItems(options)}
            </div>
        </div>
    );
};

Select.defaultProps = {
    selectDropdown: null,
    hideSelectDropdown: null,
};

Select.propTypes = {
    id: PropTypes.string.isRequired,
    handler: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.object).isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    selectDropdown: PropTypes.string,
    hideSelectDropdown: PropTypes.func,
};

export { Select };
