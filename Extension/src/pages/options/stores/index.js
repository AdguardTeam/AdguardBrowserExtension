import { createContext } from 'react';
import { configure } from 'mobx';

import SettingsStore from './SettingsStore';
import UiStore from './UiStore';

// Do not allow property change outside of store actions
configure({ enforceActions: 'observed' });

class RootStore {
    constructor() {
        this.settingsStore = new SettingsStore(this);
        this.uiStore = new UiStore(this);
    }
}

export default createContext(new RootStore());
