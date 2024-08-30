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
    useContext,
    useEffect,
    useState,
} from 'react';

import classnames from 'classnames';

import { rootStore } from '../../stores/RootStore';
import { Icon } from '../../../common/components/ui/Icon';

/**
 * Notification component props
 */
interface NotificationProps {
    id: string;
    title?: string;
    description: string;
}

/**
 * Notification component.
 *
 * @param props Notification component props
 */
export const Notification = (props: NotificationProps) => {
    const [notificationIsClosed, setNotificationIsClosed] = useState(false);

    const { id, title, description } = props;

    const { uiStore } = useContext(rootStore);

    const displayTimeoutAnimationMs = 5000;
    const displayTimeoutMs = 5300;

    useEffect(() => {
        const displayTimeoutAnimationId = setTimeout(() => {
            setNotificationIsClosed(true);
        }, displayTimeoutAnimationMs);

        const displayTimeout = setTimeout(() => {
            uiStore.removeNotification(id);
        }, displayTimeoutMs);

        return () => {
            clearTimeout(displayTimeoutAnimationId);
            clearTimeout(displayTimeout);
        };
    }, [id, uiStore]);

    const notificationClassnames = classnames('notification', {
        'notification--close': notificationIsClosed,
    });

    const close = () => {
        setNotificationIsClosed(true);
        setTimeout(() => {
            uiStore.removeNotification(id);
        }, 300);
    };

    return (
        <div className={notificationClassnames}>
            <Icon
                id="#info"
                classname="icon icon--24 notification__icon"
            />
            <div className="notification__message">
                {title && <div className="notification__title">{title}</div>}
                <div className="notification__description">{description}</div>
            </div>
            <button
                type="button"
                aria-label="Close"
                className="button notification__btn-close"
                onClick={close}
            >
                <Icon
                    id="#cross"
                    classname="icon icon--24 notification__icon"
                />
            </button>
        </div>
    );
};
