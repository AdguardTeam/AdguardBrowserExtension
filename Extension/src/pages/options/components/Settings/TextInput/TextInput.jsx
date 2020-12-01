import React from 'react';
import PropTypes from 'prop-types';

import './input.pcss';

const TextInput = (props) => {
    const {
        id, value, handler, placeholder,
    } = props;

    const changeHandler = (e) => {
        // eslint-disable-next-line no-shadow
        const { target: { name: id, value: data } } = e;
        handler({ id, data });
    };

    return (
        <div className="input">
            <input
                type="number"
                name={id}
                value={value}
                onChange={changeHandler}
                id={id}
                className="input__in"
                placeholder={placeholder}
            />
        </div>
    );
};

TextInput.defaultProps = {
    placeholder: '',
};

TextInput.propTypes = {
    id: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    handler: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
};

export { TextInput };
