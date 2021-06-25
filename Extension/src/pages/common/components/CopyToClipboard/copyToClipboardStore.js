import { createContext } from 'react';
import { observable, action, makeObservable } from 'mobx';

import { copyToClipboard } from '../../../helpers';

const TOOLTIP_VISIBLE_TIME_MS = 1500;

class CopyToClipboardStore {
    constructor() {
        makeObservable(this);
    }

    @observable
    currentContainerId = null;

    tooltipTimer = null;

    @action
    copyText = (containerId, text) => {
        clearTimeout(this.tooltipTimer);
        copyToClipboard(text);
        this.currentContainerId = containerId;
        this.tooltipTimer = setTimeout(() => {
            this.resetTooltipId();
        }, TOOLTIP_VISIBLE_TIME_MS);
    }

    @action
    resetTooltipId = () => {
        this.currentContainerId = null;
    }
}

export const copyToClipboardStore = createContext(new CopyToClipboardStore());
