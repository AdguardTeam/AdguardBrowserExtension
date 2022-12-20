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
import classNames from 'classnames';

const SettingsSet = (props) => {
    const {
        title, description, children, disabled, inlineControl, hideBorder,
    } = props;
    const settingClassName = classNames({
        setting: true,
        'setting--disabled': disabled,
        'setting--hide-border': hideBorder,
    });

    return (
        <div className={settingClassName}>
            <div className="setting__container setting__container--vertical">
                <div className="setting__container setting__container--horizontal">
                    <div className="setting__info">
                        <div className="setting__title">{title}</div>
                        {description && <div className="setting__desc">{description}</div>}
                    </div>
                    {inlineControl && <div className="setting__container setting__container--inline setting__inline-control">{inlineControl}</div>}
                </div>
                {children}
            </div>
        </div>
    );
};

SettingsSet.defaultProps = {
    title: '',
    description: '',
    children: null,
    disabled: false,
    inlineControl: null,
};

SettingsSet.propTypes = {
    title: PropTypes.string,
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.element, PropTypes.node]),
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.arrayOf(PropTypes.element),
    ]),
    disabled: PropTypes.bool,
    inlineControl: PropTypes.element,
};

export { SettingsSet };
