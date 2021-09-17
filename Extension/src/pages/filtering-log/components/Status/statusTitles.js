import { StatusMode } from '../../filteringLogStatus';
import { reactTranslator } from '../../../../common/translators/reactTranslator';

/**
 * @typedef {Object} StatusTitle
 * @property {string} PROCESSED
 * @property {string} BLOCKED
 * @property {string} MODIFIED
 * @property {string} UNBLOCKED
 */
const StatusTitle = {
    PROCESSED: 'filtering_log_status_processed',
    BLOCKED: 'filtering_log_status_blocked',
    MODIFIED: 'filtering_log_status_modified',
    UNBLOCKED: 'filtering_log_status_allowed',
};

const titleMap = {
    [StatusMode.REGULAR]: StatusTitle.PROCESSED,
    [StatusMode.MODIFIED]: StatusTitle.MODIFIED,
    [StatusMode.BLOCKED]: StatusTitle.BLOCKED,
    [StatusMode.ALLOWED]: StatusTitle.UNBLOCKED,
};

export const getStatusTitle = (mode) => {
    return reactTranslator.getMessage(titleMap[mode]);
};
