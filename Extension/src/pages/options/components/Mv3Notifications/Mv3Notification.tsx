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
    const [notificationOnClose, setNotificationOnClose] = useState(false);

    const { uiStore } = useContext(rootStore);

    const { id, description, extra } = props;
    const isNotificationWithLink = extra?.link && typeof extra?.link === 'string';

    const displayTimeoutAnimationMs = 5000;
    const displayTimeoutMs = 5300;

    useEffect(() => {
        const displayTimeoutAnimationId = setTimeout(() => {
            setNotificationOnClose(true);
        }, displayTimeoutAnimationMs);

        const displayTimeout = setTimeout(() => {
            uiStore.removeMv3Notification(id);
        }, displayTimeoutMs);

        return () => {
            clearTimeout(displayTimeoutAnimationId);
            clearTimeout(displayTimeout);
        };
    }, [id, uiStore]);

    const notificationClassnames = classnames(
        'mv3-notification',
        { 'mv3-notification--close': notificationOnClose },
    );

    const handleCloseClick = () => {
        setNotificationOnClose(true);
        setTimeout(() => {
            uiStore.removeMv3Notification(id);
        }, 300);
    };

    // TODO: Refactor this code and extract click handler from general
    // notification component.
    const handleRuleLimitsClick = (e: React.MouseEvent) => {
        e.preventDefault();
        messenger.openRulesLimitsTab();
        handleCloseClick();
    };

    return (
        <div className={notificationClassnames}>
            <Icon
                id="#info"
                classname="icon--24 left-icon"
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
                className="mv3-notification__close"
                onClick={handleCloseClick}
            >
                <Icon
                    id="#cross"
                    classname="icon--24"
                />
            </button>
        </div>
    );
};
