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

import type { RootStore } from './RootStore';

/**
 * Notification object.
 */
type Notification = {
    id: string;
    title: string;
    description: string;
};

/**
 * Set notification input object.
 */
type NotificationInput = {
    description: string;
} & Partial<Omit<Notification, 'description'>>;

class UiStore {
    /**
     * Root store instance. Added in advance, even though it is not used.
     */
    private rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;

        makeObservable(this);

        this.setShowLoader = this.setShowLoader.bind(this);
    }

    @observable notifications: Notification[] = [];

    /**
     * Loader visibility state. **Used for mv3**.
     */
    @observable showLoader = false;

    @action
    addNotification({ title = '', description }: NotificationInput) {
        const id = nanoid();
        this.notifications.push({
            id,
            title,
            description,
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
     * @param {boolean} value Loader visibility state. Default value is false.
     */
    @action
    setShowLoader(value = false) {
        this.showLoader = value;
    }
}

export default UiStore;
