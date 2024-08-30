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
import { messenger } from '../../../services/messenger';

/**
 * Notification component props
 */
interface NotificationProps {
    id: string;
    description: string;
    extra?: Record<string, any>;
}

/**
 * Notification component.
 *
 * @param props Notification component props
 */
export const Mv3Notification = (props: NotificationProps) => {
    const [notificationIsClosed, setNotificationIsClosed] = useState(false);

    const [shouldCloseOnTimeout, setShouldCloseOnTimeout] = useState(true);

    const { uiStore } = useContext(rootStore);

    const { id, description, extra } = props;
    const isNotificationWithLink = extra?.link && typeof extra?.link === 'string';

    const TIME_TO_REMOVE_NOTIFICATION_MS = 300;

    const NOTIFICATION_TTL_MS = 4000;

    useEffect(() => {
        const closeTimeout = setTimeout(() => {
            if (shouldCloseOnTimeout) {
                setNotificationIsClosed(true);
            }
        }, NOTIFICATION_TTL_MS);

        const removeTimeout = setTimeout(() => {
            if (shouldCloseOnTimeout) {
                uiStore.removeMv3Notification(id);
            }
        }, NOTIFICATION_TTL_MS + TIME_TO_REMOVE_NOTIFICATION_MS);

        return () => {
            clearTimeout(closeTimeout);
            clearTimeout(removeTimeout);
        };
    }, [id, uiStore, shouldCloseOnTimeout]);

    const notificationClassnames = classnames(
        'mv3-notification',
        { 'mv3-notification--close': notificationIsClosed },
    );

    const handleCloseClick = () => {
        setNotificationIsClosed(true);
        const removeTimeout = setTimeout(() => {
            uiStore.removeMv3Notification(id);
            clearTimeout(removeTimeout);
        }, TIME_TO_REMOVE_NOTIFICATION_MS);
    };

    // TODO: Refactor this code and extract click handler from general
    // notification component.
    const handleRuleLimitsClick = (e: React.MouseEvent) => {
        e.preventDefault();
        messenger.openRulesLimitsTab();
        handleCloseClick();
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
                id="#info"
                classname="icon--24 icon--red-default"
            />
            <div className="mv3-notification__content">
                <p>{description}</p>
                { isNotificationWithLink && (
                    <button type="button" onClick={handleRuleLimitsClick}>
                        {extra.link}
                    </button>
                )}
            </div>
            <button
                aria-label="close"
                type="button"
                className="mv3-notification__btn-close"
                onClick={handleCloseClick}
            >
                <Icon
                    id="#cross"
                    classname="icon--24 icon--gray-default"
                />
            </button>
        </div>
    );
};
