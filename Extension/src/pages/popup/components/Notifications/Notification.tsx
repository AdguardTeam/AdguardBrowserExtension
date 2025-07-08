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

import { Icon } from '../../../common/components/ui/Icon';

import './notification.pcss';

type NotificationProps = {
    /**
     * Icon component for the notification.
     */
    icon: React.ReactNode;

    /**
     * Title of the notification.
     */
    title: string;

    /**
     * Button to be shown in the notification, optional.
     */
    button?: {
        /**
         * Text of the button.
         */
        text: string;

        /**
         * Click handler for the button.
         */
        onClick: () => void;
    };
};

/**
 * The component needed to show a notification about the rule limits
 * exceeded in popup.
 *
 * @todo TODO: Add reuse this component to show message about successful update
 * of application with filters.
 */
export const Notification = ({
    icon,
    title,
    button,
}: NotificationProps) => {
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

    return (
        <div className={notificationClassnames}>
            {icon}
            <div className="notification__content">
                <p>
                    {title}
                </p>
                {button && (
                    <button
                        type="button"
                        onClick={button.onClick}
                    >
                        {button.text}
                    </button>
                )}
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
