import React from 'react';
import PropTypes from 'prop-types';
import './textarea.pcss';

function Textarea(props) {
    const {
        id, value, handler,
    } = props;

    const changeHandler = (e) => {
        // eslint-disable-next-line no-shadow
        const { target: { name: id, value: data } } = e;
        handler({ id, data });
    };

    return (
        <textarea
            name={id}
            onChange={changeHandler}
            aria-label={id}
            className="textarea"
            defaultValue={value}
        />
    );
}

Textarea.propTypes = {
    id: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    handler: PropTypes.func.isRequired,
};

export { Textarea };
