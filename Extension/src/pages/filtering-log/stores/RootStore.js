import { createContext } from 'react';
import { configure } from 'mobx';

import { LogStore } from './LogStore';

// Do not allow property change outside of store actions
configure({ enforceActions: 'observed' });

class RootStore {
    constructor() {
        this.logStore = new LogStore(this);
    }
}

export const rootStore = createContext(new RootStore());
