import browser from 'webextension-polyfill';
// TODO move log to the common directory
import { log } from '../../background/utils/log';

class Messenger {
    // eslint-disable-next-line class-methods-use-this
    async sendMessage(type, data) {
        log.debug('Request type:', type);
        if (data) {
            log.debug('Request data:', data);
        }

        const response = await browser.runtime.sendMessage({
            type,
            data,
        });

        if (response) {
            log.debug('Response type:', type);
            log.debug('Response data:', response);
        }

        return response;
    }

    async getOptionsData() {
        return this.sendMessage('getOptionsData');
    }

    // eslint-disable-next-line class-methods-use-this
    async changeUserSetting(settingId, value) {
        // TODO refactor message handler to use common message format { type, data }
        await browser.runtime.sendMessage({
            type: 'changeUserSetting',
            key: settingId,
            value,
        });
    }

    async enableFilter(filterId) {
        // TODO use common message types in constants;
        const type = 'addAndEnableFilter';
        return this.sendMessage(type, { filterId });
    }

    async disableFilter(filterId) {
        // TODO use common message types in constants;
        const type = 'disableAntiBannerFilter';
        return this.sendMessage(type, { filterId });
    }

    async applySettingsJson(json) {
        // TODO use common message types in the constants
        const type = 'applySettingsJson';
        return this.sendMessage(type, { json });
    }

    async openFilteringLog() {
        // TODO use common message types in the constants
        const type = 'openFilteringLog';
        return this.sendMessage(type);
    }

    async resetStatistics() {
        // TODO use common message types in the constants
        const type = 'resetBlockedAdsCount';
        return this.sendMessage(type);
    }

    async getUserRules() {
        // TODO use common message types in the constants
        const type = 'getUserRules';
        return this.sendMessage(type);
    }

    async saveUserRules(value) {
        // TODO use common message types in the constants
        const type = 'saveUserRules';
        await this.sendMessage(type, { value });
    }
}

const messenger = new Messenger();

export default messenger;
