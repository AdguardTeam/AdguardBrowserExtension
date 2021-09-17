import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

import './checkbox.pcss';

const Checkbox = (props) => {
    const {
        id,
        handler,
        inverted,
        label,
        value,
        className,
    } = props;

    const computedValue = inverted ? !value : value;
    const [state, setState] = useState(computedValue);

    useEffect(() => {
        setState(computedValue);
    }, [computedValue]);

    const changeHandler = (e) => {
        setState(!state);
        const { target: { name: targetId, checked: data } } = e;
        handler({ id: targetId, data: inverted ? !data : data });
    };

    return (
        <div
            className="checkbox"
        >
            <input
                type="checkbox"
                name={id}
                checked={state}
                onChange={changeHandler}
                id={id}
                className="checkbox__in"
                tabIndex="0"
            />
            <label
                htmlFor={id}
                className={cn('checkbox__label', className)}
            >
                {label}
            </label>
        </div>
    );
};

Checkbox.defaultProps = {
    value: false,
    inverted: false,
    label: '',
};

Checkbox.propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    value: PropTypes.bool,
    inverted: PropTypes.bool,
    handler: PropTypes.func.isRequired,
    label: PropTypes.string,
};

export { Checkbox };
