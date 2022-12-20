/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

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
        disabled,
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
                disabled={disabled}
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
