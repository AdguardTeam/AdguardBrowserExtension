import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { rootStore } from '../../stores/RootStore';

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
    }, []);

    const notificationClassnames = classnames('notification', {
        'notification--close': notificationOnClose,
    });

    return (
        <div className={notificationClassnames}>
            {title.length > 0
                && <div className="notification__title">{title}</div>}
            <div className="notification__description">{description}</div>
        </div>
    );
};

Notification.propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
};
