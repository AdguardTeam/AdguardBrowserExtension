import { createContext } from 'react';
import browser from 'webextension-polyfill';
import {
    action,
    configure,
    observable,
    runInAction,
    makeObservable,
} from 'mobx';

import { messenger } from '../../services/messenger';
import { VIEW_STATES } from '../constants';

// Do not allow property change outside of store actions
configure({ enforceActions: 'observed' });

class PopupStore {
    @observable
    applicationFilteringDisabled = null;

    @observable
    applicationAvailable = true;

    @observable
    tabUrl = null;

    @observable
    viewState = VIEW_STATES.ACTIONS;

    constructor() {
        makeObservable(this);
    }

    @action
    getPopupData = async () => {
        // get current tab id
        const tabs = await browser.tabs.query({
            active: true,
            currentWindow: true,
        });
        const currentTab = tabs?.[0];

        const response = await messenger.getTabInfoForPopup(currentTab?.id);

        runInAction(() => {
            const { frameInfo } = response;
            this.applicationFilteringDisabled = frameInfo.applicationFilteringDisabled;
            this.applicationAvailable = frameInfo.applicationAvailable;
            this.tabUrl = frameInfo.url;
        });
    };

    @action
    changeApplicationFilteringDisabled = async (state) => {
        await messenger.changeApplicationFilteringDisabled(state);

        runInAction(() => {
            this.applicationFilteringDisabled = state;
        });
    };

    @action
    setViewState = (state) => {
        this.viewState = state;
    };
}

export const popupStore = createContext(new PopupStore());
