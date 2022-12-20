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
import { Setting, SETTINGS_TYPES } from './Setting';
import { SettingsSet } from './SettingsSet';

// clickable setting with a label wrap
const SettingsSetCheckbox = (props) => {
    const {
        title, description, children, disabled,
        id, handler, label, inverted, value, sectionDisabled,
    } = props;

    return (
        <label
            htmlFor={id}
            className="setting-checkbox"
        >
            <SettingsSet
                title={title}
                description={description}
                disabled={disabled}
                inlineControl={(
                    <Setting
                        id={id}
                        type={SETTINGS_TYPES.CHECKBOX}
                        inverted={inverted}
                        label={label}
                        handler={handler}
                        value={value}
                        disabled={sectionDisabled}
                    />
                )}
            >
                {children}
            </SettingsSet>
        </label>
    );
};

SettingsSetCheckbox.propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export { SettingsSetCheckbox };
