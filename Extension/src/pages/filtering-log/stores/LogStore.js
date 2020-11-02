import { observable, makeObservable } from 'mobx';

class LogStore {
    @observable requests = [];

    constructor(rootStore) {
        this.rootStore = rootStore;
        makeObservable(this);
    }
}

export { LogStore };
