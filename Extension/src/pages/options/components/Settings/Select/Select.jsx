import React from 'react';
import PropTypes from 'prop-types';

import './select.pcss';

const renderOptions = (options) => options.map((option) => {
    const { value, title } = option;
    return <option key={value} value={value}>{title}</option>;
});

const Select = (props) => {
    const {
        id, handler, options, value,
    } = props;

    const changeHandler = (e) => {
        // eslint-disable-next-line no-shadow
        const { target: { id, value: data } } = e;
        handler({ id, data: parseInt(data, 10) });
    };

    return (
        <select
            className="select"
            onChange={changeHandler}
            id={id}
            value={value}
        >
            {renderOptions(options)}
        </select>
    );
};

Select.propTypes = {
    id: PropTypes.string.isRequired,
    handler: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.object).isRequired,
    value: PropTypes.number.isRequired,
};

export { Select };
