import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';

import { rootStore } from '../../stores/RootStore';

export const Notification = (props) => {
    const { id, title, description } = props;

    const { uiStore } = useContext(rootStore);

    const displayTimeoutMs = 5000;

    useEffect(() => {
        setTimeout(() => {
            uiStore.removeNotification(id);
        }, displayTimeoutMs);
    });

    return (
        <div className="notification">
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
