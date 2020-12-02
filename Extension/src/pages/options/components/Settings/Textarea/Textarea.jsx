import React from 'react';
import PropTypes from 'prop-types';

import './textarea.pcss';

const Textarea = (props) => {
    const {
        id, value, handler, placeholder,
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
            placeholder={placeholder}
        />
    );
};

Textarea.defaultProps = {
    placeholder: '',
};

Textarea.propTypes = {
    id: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    handler: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
};

export { Textarea };
