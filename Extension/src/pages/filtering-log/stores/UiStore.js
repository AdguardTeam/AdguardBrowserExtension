import { makeObservable, observable } from 'mobx';

export const REQUEST_WIZARD_STATES = {
    VIEW_REQUEST: 'view.request',
    BLOCK_REQUEST: 'block.request',
    UNBLOCK_REQUEST: 'unblock.request',
};

class UiStore {
    @observable
    requestModalIsOpen = false;

    @observable
    requestModalState = REQUEST_WIZARD_STATES.VIEW_REQUEST;

    constructor(rootStore) {
        this.rootStore = rootStore;
        makeObservable(this);
    }

    openModal() {
        this.requestModalIsOpen = true;
    }

    closeModal() {
        this.requestModalIsOpen = false;
        this.requestModalState = REQUEST_WIZARD_STATES.VIEW_REQUEST;
    }
}

export { UiStore };
