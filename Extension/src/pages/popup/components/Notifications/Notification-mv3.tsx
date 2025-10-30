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

import React, {
    useEffect,
    useState,
    useRef,
} from 'react';

import classnames from 'classnames';

import { NOTIFICATION_TTL_MS } from '../../../../common/constants';
import { Icon } from '../../../common/components/ui/Icon';
import { TIME_TO_REMOVE_NOTIFICATION_MS } from '../../../common/constants';
import { NotificationType, type NotificationParams } from '../../../common/types';

import './notifications.pcss';

/**
 * The component needed to show a notification about the rule limits
 * exceeded in popup.
 */
export const Notification = ({
    type,
    animationCondition,
    text,
    button,
    closeManually,
}: NotificationParams) => {
    const [notificationClosing, setNotificationClosing] = useState(false);
    // We save the state "close" of the notification in local state to show it
    // again until user has not fixed list of filters.
    const [notificationClosed, setNotificationClosed] = useState(false);

    const notificationClassName = classnames('notification', {
        'notification--closing': notificationClosing,
        'notification--close': notificationClosed,
    });

    useEffect(() => {
        const closeTimeout = setTimeout(() => {
            if (!closeManually) {
                setNotificationClosing(true);
            }
        }, NOTIFICATION_TTL_MS);

        const removeTimeout = setTimeout(() => {
            if (!closeManually) {
                setNotificationClosed(true);
            }
        }, NOTIFICATION_TTL_MS + TIME_TO_REMOVE_NOTIFICATION_MS);

        return () => {
            clearTimeout(closeTimeout);
            clearTimeout(removeTimeout);
        };
    }, [closeManually]);

    const removeOnClickTimeoutRef = useRef<number | undefined>();

    useEffect(() => {
        return () => {
            clearTimeout(removeOnClickTimeoutRef.current);
        };
    }, []);

    const handleCloseClick = () => {
        setNotificationClosing(true);

        removeOnClickTimeoutRef.current = window.setTimeout(() => {
            setNotificationClosed(true);
        }, TIME_TO_REMOVE_NOTIFICATION_MS);
    };

    const iconsMap: Record<NotificationType, JSX.Element> = {
        [NotificationType.Loading]: (
            <Icon
                id="#loading"
                className="icon--24 icon--green-default"
                animationClassName="icon--loading"
                animationCondition={animationCondition}
                aria-hidden="true"
            />
        ),
        [NotificationType.Success]: (
            <Icon
                id="#tick"
                className="icon--24 icon--green-default"
                aria-hidden="true"
            />
        ),
        [NotificationType.Error]: (
            <Icon
                id="#info"
                className="icon--24 icon--red-default"
                aria-hidden="true"
            />
        ),
    };

    return (
        <div className={notificationClassName}>
            <div className="notification__wrapper">
                {iconsMap[type]}
                <div
                    className="notification__content"
                    role={type === NotificationType.Error ? 'alert' : 'status'}
                    aria-live={type === NotificationType.Error ? 'assertive' : 'polite'}
                >
                    <p>
                        {text}
                    </p>
                    {button && (
                        <button
                            type="button"
                            onClick={button.onClick}
                            title={button.title}
                        >
                            {button.title}
                        </button>
                    )}
                </div>
            </div>
            <button
                aria-label="close"
                type="button"
                className="notification__btn-close"
                onClick={handleCloseClick}
            >
                <Icon
                    id="#cross"
                    className="icon icon--24 icon--gray-default"
                />
            </button>
        </div>
    );
};
