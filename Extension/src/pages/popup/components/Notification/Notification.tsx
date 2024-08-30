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

import React, { useState } from 'react';

import classnames from 'classnames';

import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';
import { messenger } from '../../../services/messenger';

import './notification.pcss';

/**
 * Component Notification is used to show a notification about the rule limits
 * exceeded in popup.
 *
 * @todo TODO: Add reuse this component to show message about successful update
 * of application with filters.
 */
export const Notification = () => {
    const [notificationClosing, setNotificationClosing] = useState(false);
    // We save the state "close" of the notification in local state to show it
    // again until user has not fixed list of filters.
    const [notificationClosed, setNotificationClosed] = useState(false);

    const notificationClassnames = classnames(
        'notification',
        { 'notification--closing': notificationClosing },
        { 'notification--close': notificationClosed },
    );

    // Timeout for closing the notification, same as in the styles animation.
    const closeTimeoutMs = 300;

    const handleCloseClick = () => {
        setNotificationClosing(true);

        setTimeout(() => {
            setNotificationClosed(true);
        }, closeTimeoutMs);
    };

    const handleRuleLimitsClick = (e: React.MouseEvent) => {
        e.preventDefault();
        messenger.openRulesLimitsTab();
        window.close();
    };

    return (
        <div className={notificationClassnames}>
            <Icon
                id="#info"
                classname="icon--24 icon--red-default"
            />
            <div className="notification__content">
                <p>
                    {translator.getMessage('popup_limits_exceeded_warning')}
                </p>
                <button type="button" onClick={handleRuleLimitsClick}>
                    {translator.getMessage('options_rule_limits')}
                </button>
            </div>
            <button
                aria-label="close"
                type="button"
                className="notification__btn-close"
                onClick={handleCloseClick}
            >
                <Icon
                    id="#cross"
                    classname="icon icon--24 icon--gray-default"
                />
            </button>
        </div>
    );
};
