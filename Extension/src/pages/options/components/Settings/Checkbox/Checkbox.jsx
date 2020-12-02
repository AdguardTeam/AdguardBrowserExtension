import React from 'react';
import PropTypes from 'prop-types';

import './checkbox.pcss';

const Checkbox = (props) => {
    const {
        id, handler, inverted,
    } = props;

    let { value } = props;

    value = inverted ? !value : value;

    const changeHandler = (e) => {
        // eslint-disable-next-line no-shadow
        const { target: { name: id, checked: data } } = e;
        handler({ id, data: inverted ? !data : data });
    };

    return (
        <div
            className="checkbox"
        >
            <input
                type="checkbox"
                name={id}
                checked={value}
                onChange={changeHandler}
                id={id}
                className="checkbox__in"
            />
            <label
                htmlFor={id}
                className="checkbox__label"
            />
        </div>
    );
};

Checkbox.defaultProps = {
    value: false,
    inverted: false,
};

Checkbox.propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    value: PropTypes.bool,
    inverted: PropTypes.bool,
    handler: PropTypes.func.isRequired,
};

export { Checkbox };
