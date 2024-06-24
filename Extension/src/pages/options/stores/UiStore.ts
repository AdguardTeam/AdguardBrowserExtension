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

import type { InvalidStaticResultData, InvalidDynamicResultData } from '../../../background/services/rules-limits';
// TODO: Maybe not import from components folder here?
import { getDynamicWarningMessage, getStaticWarningMessage } from '../components/Warnings/messages';

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
        this.setStaticFiltersLimitsWarning = this.setStaticFiltersLimitsWarning.bind(this);
        this.setDynamicRulesLimitsWarning = this.setDynamicRulesLimitsWarning.bind(this);
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

    /**
     * Specific limits warning message to be displayed about static filters.
     */
    @observable staticFiltersLimitsWarning: string | null = null;

    /**
     * Specific limits warning message to be displayed about dynamic section with user rules.
     */
    @observable dynamicRulesLimitsWarning: string | null = null;

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
     * @param value Loader visibility state. Default value is false.
     */
    @action
    setShowLoader(value = false) {
        this.showLoader = value;
    }

    /**
     * Sets a specific limit warning message to be displayed about static filters.
     *
     * @throws Error if the warning type is incorrect.
     *
     * @param data Result of limits check of static rules.
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
     * @throws Error if the warning type is incorrect.
     *
     * @param data Result of limits check of dynamic rules.
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
}

export default UiStore;
