/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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
        title,
        titleId,
        description,
        children,
        disabled,
        inlineControl,
        hideBorder,
    } = props;

    const settingClassName = classNames({
        setting: true,
        'setting--disabled': disabled,
        'setting--hide-border': hideBorder,
        // see renderContent method for detailed explanation
        'setting--reversed': inlineControl,
    });

    const info = (
        <div className="setting__info">
            <div
                id={titleId}
                className="setting__title"
                // Hide title from Screen Readers if it was used as part
                // of the controls title (aria-labelledby).
                aria-hidden={!!titleId}
            >
                {title}
            </div>
            {description && (<div className="setting__desc">{description}</div>)}
        </div>
    );

    const control = inlineControl && (
        <div
            className="setting__container setting__container--inline setting__inline-control"
        >
            {inlineControl}
        </div>
    );

    /**
     * If inlineControl is provided, we render control first and then info
     * and also we reverse the order by using CSS. This is done to make sure
     * that controls receives first focus when tabbing through the settings.
     */
    const renderContent = () => {
        const content = inlineControl ? [control, info] : [info, control];

        return (
            <>
                {content[0]}
                {content[1]}
            </>
        );
    };

    return (
        <div className={settingClassName}>
            <div className="setting__container setting__container--vertical">
                <div className="setting__container setting__container--horizontal">
                    {renderContent()}
                </div>
                {children}
            </div>
        </div>
    );
};

SettingsSet.defaultProps = {
    title: '',
    titleId: '',
    description: '',
    children: null,
    disabled: false,
    inlineControl: null,
};

SettingsSet.propTypes = {
    title: PropTypes.string,
    titleId: PropTypes.string,
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.element, PropTypes.node]),
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.arrayOf(PropTypes.element),
    ]),
    disabled: PropTypes.bool,
    inlineControl: PropTypes.element,
};

export { SettingsSet };
