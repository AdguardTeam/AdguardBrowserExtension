import { observer } from 'mobx-react';
import React, { useContext } from 'react';

import { rootStore } from '../../stores/RootStore';
import { Notification } from './Notification';

import './notifications.pcss';

export const Notifications = observer(() => {
    const { uiStore } = useContext(rootStore);

    const { notifications } = uiStore;

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="notifications">
            {notifications.map((notification) => {
                const { id, description, title } = notification;
                return (
                    <Notification
                        key={id}
                        id={id}
                        title={title}
                        description={description}
                    />
                );
            })}
        </div>
    );
});
