import { createContext } from 'react';
import { configure } from 'mobx';

import { LogStore } from './LogStore';
import { WizardStore } from './WizardStore';

// Do not allow property change outside of store actions
configure({ enforceActions: 'observed' });

class RootStore {
    constructor() {
        this.logStore = new LogStore(this);
        this.wizardStore = new WizardStore(this);
    }
}

export const rootStore = createContext(new RootStore());
