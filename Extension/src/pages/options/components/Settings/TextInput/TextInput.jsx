import React from 'react';
import PropTypes from 'prop-types';
import './input.pcss';

function TextInput(props) {
    const {
        id, value, handler,
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
            />
        </div>
    );
}

TextInput.propTypes = {
    id: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    handler: PropTypes.func.isRequired,
};

export default TextInput;
