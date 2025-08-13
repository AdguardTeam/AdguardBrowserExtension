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

import {
    observable,
    action,
    makeObservable,
} from 'mobx';
import { nanoid } from 'nanoid';

import { type InvalidStaticResultData, type InvalidDynamicResultData } from '../../../background/services/rules-limits';
// TODO: Maybe not import from components folder here?
import { getDynamicWarningMessage, getStaticWarningMessage } from '../components/Warnings/messages';

import { type RootStore } from './RootStore';

export enum NotificationType {
    SUCCESS = 'success',
    ERROR = 'error',
}

/**
 * Notification object.
 */
export type Notification = {
    /**
     * ID of notification
     */
    id: string;

    /**
     * Description of notification
     */
    description: string;

    /**
     * Notification type
     */
    type: NotificationType;

    /**
     * Some additional data, e.g. links.
     */
    extra?: Record<string, any>;
};

class UiStore {
    /**
     * Root store instance. Added in advance, even though it is not used.
     */
    private rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;

        makeObservable(this);

        this.setShowLoader = this.setShowLoader.bind(this);
        this.setStaticFiltersLimitsWarning = this.setStaticFiltersLimitsWarning.bind(this);
        this.setDynamicRulesLimitsWarning = this.setDynamicRulesLimitsWarning.bind(this);
    }

    /**
     * Notifications list
     */
    @observable
    notifications: Notification[] = [];

    /**
     * Loader visibility state. **Used for mv3**.
     */
    @observable
    showLoader = false;

    /**
     * Specific limits warning message to be displayed about static filters.
     */
    @observable
    staticFiltersLimitsWarning: string | null = null;

    /**
     * Specific limits warning message to be displayed about dynamic section with user rules.
     */
    @observable
    dynamicRulesLimitsWarning: string | null = null;

    /**
     * Sidebar visibility state. **Used only on mobile**.
     */
    @observable
    isSidebarOpen = false;

    @action
    addNotification({ description, type, extra }: Omit<Notification, 'id'>) {
        const id = nanoid();
        this.notifications.push({
            id,
            description,
            extra,
            type,
        });
        return id;
    }

    @action
    removeNotification(id: string) {
        this.notifications = this.notifications
            .filter((notification) => notification.id !== id);
    }

    /**
     * Sets the loader visibility state. **Used for mv3**
     *
     * @param value Loader visibility state. Default value is false.
     */
    @action
    setShowLoader(value = false) {
        this.showLoader = value;
    }

    /**
     * Sets a specific limit warning message to be displayed about static filters.
     *
     * @param data Result of limits check of static rules.
     *
     * @throws Error if the warning type is incorrect.
     */
    @action
    setStaticFiltersLimitsWarning(data?: InvalidStaticResultData | undefined) {
        if (!data) {
            this.staticFiltersLimitsWarning = null;
            return;
        }

        if (data.type !== 'static') {
            throw new Error('Incorrect warning type');
        }

        this.staticFiltersLimitsWarning = getStaticWarningMessage(data);
    }

    /**
     * Sets a specific limit warning message to be displayed about dynamic section with user rules.
     *
     * @param data Result of limits check of dynamic rules.
     *
     * @throws Error if the warning type is incorrect.
     */
    @action
    setDynamicRulesLimitsWarning(data?: InvalidDynamicResultData | undefined) {
        if (!data) {
            this.dynamicRulesLimitsWarning = null;
            return;
        }

        if (data.type !== 'dynamic') {
            throw new Error('Incorrect warning type');
        }

        this.dynamicRulesLimitsWarning = getDynamicWarningMessage(data);
    }

    /**
     * Opens the sidebar.
     */
    @action
    openSidebar = () => {
        this.isSidebarOpen = true;
    };

    /**
     * Closes the sidebar.
     */
    @action
    closeSidebar = () => {
        this.isSidebarOpen = false;
    };
}

export default UiStore;
