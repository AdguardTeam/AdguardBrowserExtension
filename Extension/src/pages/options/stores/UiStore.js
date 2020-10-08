import { observable, action } from 'mobx';
import { nanoid } from 'nanoid';

class UiStore {
    @observable notifications = [];

    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @action
    addNotification({ title = '', description }) {
        const id = nanoid();
        this.notifications.push({
            id,
            title,
            description,
        });
        return id;
    }

    @action
    removeNotification(id) {
        this.notifications = this.notifications
            .filter((notification) => notification.id !== id);
    }
}

export default UiStore;
