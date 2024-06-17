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

import { MIN_LOADER_SHOWING_TIME_MS } from '../../common/constants';

import type { RootStore } from './RootStore';

/**
 * Notification object.
 */
type Notification = {
    id: string;
    title?: string;
    description: string;
};

/**
 * MV3 notification object.
 */
type Mv3Notification = Notification & {
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
    }

    /**
     * Notifications in new design.
     */
    @observable mv3Notifications: Mv3Notification[] = [];

    /**
     * Notifications in old design.
     */
    @observable notifications: Notification[] = [];

    /**
     * Loader visibility state. **Used for mv3**.
     */
    @observable showLoader = false;

    private loaderStart: number | null = null;

    @action
    addNotification({ title = '', description }: Omit<Notification, 'id'>) {
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

    @action
    addMv3Notification({ title = '', description, extra }: Omit<Mv3Notification, 'id'>) {
        const id = nanoid();
        this.mv3Notifications.push({
            id,
            title,
            description,
            extra,
        });
        return id;
    }

    @action
    removeMv3Notification(id: string) {
        this.mv3Notifications = this.mv3Notifications
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

        if (value) {
            this.loaderStart = Date.now();
        } else {
            this.loaderStart = null;
        }
    }

    /**
     * Checks whether the loader should be hidden.
     *
     * **Used for mv3**.
     *
     * @todo Can be removed after AG-33293 is done.
     *
     * @returns True if the loader is visible now,
     * and at least {@link MIN_LOADER_SHOWING_TIME_MS} has passed since it was shown.
     */
    shouldHideLoader() {
        return this.showLoader
            && this.loaderStart !== null
            && Date.now() - this.loaderStart >= MIN_LOADER_SHOWING_TIME_MS;
    }
}

export default UiStore;
