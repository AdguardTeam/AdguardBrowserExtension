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
    useRef,
} from 'react';

import classnames from 'classnames';

import { NOTIFICATION_TTL_MS } from '../../../../common/constants';
import { rootStore } from '../../stores/RootStore';
import { Icon } from '../../../common/components/ui/Icon';
import { messenger } from '../../../services/messenger';
import { type Notification as INotification } from '../../stores/UiStore';
import { NotificationType } from '../../../common/constants';
import { translator } from '../../../../common/translators/translator';

/**
 * Notification component props
 */
export interface NotificationProps extends INotification {}

/**
 * Notification component.
 *
 * @param props Notification component props
 */
export const Notification = (props: NotificationProps) => {
    const [notificationIsClosed, setNotificationIsClosed] = useState(false);

    const [shouldCloseOnTimeout, setShouldCloseOnTimeout] = useState(true);

    const { uiStore } = useContext(rootStore);

    const {
        id,
        description,
        type,
        extra,
    } = props;

    const isNotificationWithLink = extra?.link && typeof extra?.link === 'string';

    let onClickHandler: ((e: React.MouseEvent) => void) | undefined;

    if (extra?.onClick && typeof extra?.onClick === 'function') {
        onClickHandler = (e: React.MouseEvent) => {
            e.preventDefault();
            extra.onClick();
            handleCloseClick();
        };
    }

    const TIME_TO_REMOVE_NOTIFICATION_MS = 300;

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

    const removeOnClickTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (removeOnClickTimeoutRef.current) {
                clearTimeout(removeOnClickTimeoutRef.current);
            }
        };
    }, []);

    const handleCloseClick = () => {
        setNotificationIsClosed(true);
        removeOnClickTimeoutRef.current = window.setTimeout(() => {
            uiStore.removeNotification(id);
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
                id={type === NotificationType.Success ? '#tick' : '#info'}
                classname="icon--24"
                aria-hidden="true"
            />
            <div
                role="status"
                className="notification__content"
                aria-live="assertive"
            >
                <p>{description}</p>
                { isNotificationWithLink && (
                    <button
                        type="button"
                        role="link"
                        onClick={onClickHandler || handleRuleLimitsClick}
                    >
                        {extra.link}
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
                    classname="icon--24 icon--gray-default"
                    aria-hidden="true"
                />
            </button>
        </div>
    );
};
