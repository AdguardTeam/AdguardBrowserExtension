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
import classNames from 'classnames';

const SettingsSection = (props) => {
    const {
        title,
        description,
        renderBackButton,
        id,
        inlineControl,
        children,
        disabled,
        mode,
    } = props;

    const settingGroupClassName = classNames('settings__group', {
        'settings__group--disabled': disabled,
    });

    const titleContainerClass = classNames('title__container', {
        'title__container--small': mode === 'smallContainer',
        'title__container--back': renderBackButton,
        'title__container--sub': mode === 'subTitle',
        'title__container--control': id,
    });

    const titleClass = classNames('title', {
        'title--back-btn': renderBackButton,
        'title--sub': mode === 'subTitle',
    });

    return (
        <div className={settingGroupClassName} key={title}>
            <label
                className={titleContainerClass}
                htmlFor={id}
            >
                {renderBackButton
                    ? renderBackButton()
                    : (
                        <div className="title__inner">
                            {title && <h2 className={titleClass}>{title}</h2>}
                            {description && <div className="title__desc">{description}</div>}
                        </div>
                    )}
                {inlineControl
                    && (
                        <div
                            className="setting__container setting__container--inline setting__inline-control"
                        >
                            {inlineControl}
                        </div>
                    )}
            </label>
            <div>
                {children}
            </div>
        </div>
    );
};

export { SettingsSection };
