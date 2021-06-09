import { log } from '../../../common/log';
/**
 * Module used to keep options page settings, which do not need extension level persistence
 */
export class OptionsStorage {
    KEYS = {
        /* user rules editor wrap setting */
        USER_RULES_EDITOR_WRAP: 'user-rules-editor-wrap',

        /* allowlist editor wrap setting */
        ALLOWLIST_EDITOR_WRAP: 'allowlist-editor-wrap',

        /* flag indicating visibility of footer rate in the store bar */
        FOOTER_RATE_SHOW: 'footer-rate-show',

        /**
         * Filtering log columns widths
         */
        COLUMNS_WIDTHS: 'columns-widths',

        /**
         * Request modal width
         */
        REQUEST_INFO_MODAL_WIDTH: 'request-info-modal-width',
    };

    DEFAULTS = {
        [this.KEYS.USER_RULES_EDITOR_WRAP]: false,
        [this.KEYS.ALLOWLIST_EDITOR_WRAP]: false,
        [this.KEYS.FOOTER_RATE_SHOW]: true,
        [this.KEYS.COLUMNS_WIDTHS]: [],
        [this.KEYS.REQUEST_INFO_MODAL_WIDTH]: null,
    };

    constructor() {
        this.storage = localStorage;
    }

    setItem(key, value) {
        try {
            this.storage.setItem(key, JSON.stringify(value));
        } catch (e) {
            log.debug(e);
        }
    }

    getItem(key) {
        let storedValue;
        try {
            storedValue = JSON.parse(this.storage.getItem(key));
        } catch (e) {
            log.debug(e);
            storedValue = null;
        }

        return storedValue === null ? this.DEFAULTS[key] : storedValue;
    }
}
