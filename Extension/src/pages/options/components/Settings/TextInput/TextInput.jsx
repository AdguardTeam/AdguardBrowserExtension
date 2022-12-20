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

import React from 'react';
import PropTypes from 'prop-types';

import './input.pcss';

const TextInput = (props) => {
    const {
        id, value, handler, placeholder, disabled,
    } = props;

    const changeHandler = (e) => {
        // eslint-disable-next-line no-shadow
        const { target: { name: id, value: data } } = e;
        handler({ id, data });
    };

    return (
        <div className="input">
            <input
                disabled={disabled}
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
    placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export { TextInput };
