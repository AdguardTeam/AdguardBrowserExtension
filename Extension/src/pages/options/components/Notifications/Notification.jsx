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
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { rootStore } from '../../stores/RootStore';
import { Icon } from '../../../common/components/ui/Icon';

export const Notification = (props) => {
    const [notificationOnClose, setNotificationOnClose] = useState(false);

    const { id, title, description } = props;

    const { uiStore } = useContext(rootStore);

    const displayTimeoutAnimationMs = 5000;
    const displayTimeoutMs = 5300;

    useEffect(() => {
        const displayTimeoutAnimationId = setTimeout(() => {
            setNotificationOnClose(true);
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
        'notification--close': notificationOnClose,
    });

    const close = () => {
        setNotificationOnClose(true);
        setTimeout(() => {
            uiStore.removeNotification(id);
        }, 300);
    };

    return (
        <div className={notificationClassnames}>
            <Icon id="#info" classname="notification__icon notification__icon--info" />
            <div className="notification__message">
                {title.length > 0
                    && <div className="notification__title">{title}</div>}
                <div className="notification__description">{description}</div>
            </div>
            <button
                type="button"
                className="button notification__close"
                onClick={close}
            >
                <Icon id="#cross" classname="notification__icon notification__icon--close" />
            </button>
        </div>
    );
};

Notification.propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
};
