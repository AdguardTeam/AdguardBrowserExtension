/**
 * @typedef {Object} StatusMode
 * @property {string} REGULAR
 * @property {string} MODIFIED
 * @property {string} BLOCKED
 * @property {string} ALLOWED
 */
export const StatusMode = {
    REGULAR: 'regular',
    MODIFIED: 'modified',
    BLOCKED: 'blocked',
    ALLOWED: 'allowed',
};

/**
 * Returns filtering log status
 * @param {Object} event - filtering log event
 * @returns {string}
 */
export const getStatusMode = (event) => {
    const {
        cspReportBlocked,
        replaceRules,
        requestRule,
        removeParam,
    } = event;

    let mode = StatusMode.REGULAR;

    if (cspReportBlocked) {
        mode = StatusMode.BLOCKED;
        return mode;
    }

    if (replaceRules) {
        mode = StatusMode.MODIFIED;
    }

    if (requestRule && !replaceRules) {
        if (requestRule.whitelistRule) {
            mode = StatusMode.ALLOWED;
            // eslint-disable-next-line max-len
        } else if (requestRule.cssRule || requestRule.scriptRule || removeParam) {
            mode = StatusMode.MODIFIED;
        } else if (requestRule.cookieRule) {
            if (requestRule.isModifyingCookieRule) {
                mode = StatusMode.MODIFIED;
            } else {
                mode = StatusMode.BLOCKED;
            }
        } else {
            mode = StatusMode.BLOCKED;
        }
    }

    return mode;
};
