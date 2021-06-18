import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '../Icon';

import './select.pcss';

const renderOptions = (options) => options.map((option) => {
    const { value, title } = option;

    // &#8201 - Invisible thin space
    return (
        <option key={value} value={value}>
            &#8201;
            {title}
        </option>
    );
});

const Select = (props) => {
    const {
        id, handler, options, value,
    } = props;

    return (
        <div className="select">
            <Icon id="#select" classname="icon--select select__ico" />
            <select
                className="select__in"
                onChange={handler}
                id={id}
                value={value}
            >
                {renderOptions(options)}
            </select>
        </div>
    );
};

Select.propTypes = {
    id: PropTypes.string.isRequired,
    handler: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.object).isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export { Select };
