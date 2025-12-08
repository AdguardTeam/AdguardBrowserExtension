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

import React, {
    useContext,
    useEffect,
    useState,
    useRef,
} from 'react';

import classnames from 'classnames';

import { NOTIFICATION_TTL_MS } from '../../../../common/constants';
import { rootStore } from '../../stores/RootStore';
import { TIME_TO_REMOVE_NOTIFICATION_MS } from '../../../common/constants';
import { Icon } from '../../../common/components/ui/Icon';
import { NotificationType, type NotificationParams } from '../../../common/types';
import { translator } from '../../../../common/translators/translator';

/**
 * Notification with id.
 */
export type NotificationParamsWithId = NotificationParams & {
    /**
     * Unique notification id.
     */
    id: string;
};

/**
 * Notification component.
 *
 * @param props Notification component props
 */
export const Notification = (props: NotificationParamsWithId) => {
    const [notificationIsClosed, setNotificationIsClosed] = useState(false);

    const [shouldCloseOnTimeout, setShouldCloseOnTimeout] = useState(true);

    const { uiStore } = useContext(rootStore);

    const {
        id,
        text,
        type,
        button,
    } = props;

    useEffect(() => {
        const closeTimeout = setTimeout(() => {
            if (shouldCloseOnTimeout) {
                setNotificationIsClosed(true);
            }
        }, NOTIFICATION_TTL_MS);

        const removeTimeout = setTimeout(() => {
            if (shouldCloseOnTimeout) {
                uiStore.removeNotification(id);
            }
        }, NOTIFICATION_TTL_MS + TIME_TO_REMOVE_NOTIFICATION_MS);

        return () => {
            clearTimeout(closeTimeout);
            clearTimeout(removeTimeout);
        };
    }, [id, uiStore, shouldCloseOnTimeout]);

    const notificationClassnames = classnames(
        `notification notification--${type}`,
        { 'notification--close': notificationIsClosed },
    );

    const removeOnClickTimeoutRef = useRef<number | undefined>();

    useEffect(() => {
        return () => {
            clearTimeout(removeOnClickTimeoutRef.current);
        };
    }, []);

    /**
     * Handles close button click:
     * 1. marks notification as closed,
     * 2. removes notification from UI store after a delay.
     */
    const handleCloseClick = () => {
        setNotificationIsClosed(true);

        removeOnClickTimeoutRef.current = window.setTimeout(() => {
            uiStore.removeNotification(id);
        }, TIME_TO_REMOVE_NOTIFICATION_MS);
    };

    /**
     * Handles mouse over event which prevents notification from closing.
     */
    const handleMouseOver = () => {
        setShouldCloseOnTimeout(false);
    };

    return (
        <div
            className={notificationClassnames}
            onMouseEnter={handleMouseOver}
        >
            <Icon
                id={type === NotificationType.Success ? '#tick' : '#info'}
                className="icon--24"
                aria-hidden="true"
            />
            <div
                role="status"
                className="notification__content"
                aria-live="assertive"
            >
                <p>{text}</p>
                {button && (
                    <button
                        type="button"
                        role="link"
                        onClick={() => {
                            handleCloseClick();
                            button.onClick();
                        }}
                        title={button.title}
                    >
                        {button.title}
                    </button>
                )}
            </div>
            <button
                type="button"
                className="notification__btn-close"
                onClick={handleCloseClick}
                aria-label={translator.getMessage('close_button_title')}
            >
                <Icon
                    id="#cross"
                    className="icon--24 icon--gray-default"
                    aria-hidden="true"
                />
            </button>
        </div>
    );
};
